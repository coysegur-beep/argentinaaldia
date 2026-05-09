// Migra realArticles (real-articles.ts) a Sanity como Published.
//
// - Cada doc se crea con _id = nota._id ?? nota.slug, sin prefijo 'drafts.' →
//   queda Published y aparece en el sitio público (perspective: 'published').
// - Idempotente: client.createOrReplace por _id. Re-correr cuando se sumen
//   más notas actualiza las existentes y crea las nuevas, sin duplicar.
// - imagenPrincipal NO se migra (subida manual desde el studio después).
//
// Cleanup de drafts: opt-in con `--clean-drafts`. Sin el flag, los drafts
// existentes en el dataset NO se tocan (safeguard contra borrar trabajo en
// progreso del editor).
//
// Run:
//   npm run migrate:real                    # solo crea/actualiza
//   npm run migrate:real -- --clean-drafts  # también borra todos los drafts

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createClient } from '@sanity/client';
import { realArticles } from '../src/data/real-articles.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------
const argv = new Set(process.argv.slice(2));
const SHOULD_CLEAN_DRAFTS = argv.has('--clean-drafts');

// ---------------------------------------------------------------------------
// .env loader (sin dep dotenv)
// ---------------------------------------------------------------------------
const envText = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
}

const PROJECT_ID = '99wrkpjl';
const DATASET = 'production';
const API_VERSION = '2024-03-15';
const TOKEN = (process.env.SANITY_TOKEN ?? '').trim();

if (!TOKEN) {
  console.error('SANITY_TOKEN vacío en .env. Generá uno con permission Editor en sanity.io/manage y volvé a correr.');
  process.exit(1);
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  token: TOKEN,
  useCdn: false,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const key = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12);

function transformContenido(blocks) {
  if (!Array.isArray(blocks)) throw new Error('contenido no es un array');
  return blocks.map((b) => {
    if (b._type === 'block') {
      return {
        _type: 'block',
        _key: key(),
        style: b.style ?? 'normal',
        markDefs: [],
        children: (b.children ?? []).map((c) => ({
          _type: 'span',
          _key: key(),
          text: c.text ?? '',
          marks: [],
        })),
      };
    }
    if (b._type === 'quote') {
      return { _type: 'quote', _key: key(), text: b.text, cite: b.cite };
    }
    if (b._type === 'tweet') {
      return { _type: 'tweet', _key: key(), url: b.url };
    }
    // image blocks requieren upload de asset; fuera de scope
    throw new Error(`bloque de tipo "${b._type}" no soportado en migración inicial`);
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  // -------------------------------------------------------------------------
  // Step A: cleanup opcional de drafts (solo si --clean-drafts)
  // -------------------------------------------------------------------------
  let draftsDeleted = 0;
  if (SHOULD_CLEAN_DRAFTS) {
    console.log(`\n[--clean-drafts] Borrando drafts existentes...`);
    const ids = await client.fetch(
      '*[_type=="article" && _id in path("drafts.**")]._id',
    );
    console.log(`  encontrados ${ids.length} drafts`);
    for (const id of ids) {
      try {
        await client.delete(id);
        draftsDeleted++;
      } catch (err) {
        console.warn(`  ✗ no se pudo borrar ${id}: ${err?.message ?? err}`);
      }
    }
    console.log(`  ✓ ${draftsDeleted} drafts borrados`);
  } else {
    console.log(
      '\n(safeguard) Skipping draft cleanup. Pasá --clean-drafts para borrar drafts existentes.',
    );
  }

  // -------------------------------------------------------------------------
  // Step B: resolver refs categoria/autor (cache)
  // -------------------------------------------------------------------------
  console.log(`\nResolviendo refs en Sanity (${PROJECT_ID}/${DATASET})...`);
  const cats = await client.fetch(`*[_type=="category"]{_id,"slug":slug.current}`);
  const auts = await client.fetch(`*[_type=="author"]{_id,"slug":slug.current}`);
  const catBySlug = new Map(cats.map((c) => [c.slug, c._id]));
  const autBySlug = new Map(auts.map((a) => [a.slug, a._id]));
  console.log(`  ${cats.length} categorías, ${auts.length} autores resueltos`);

  // -------------------------------------------------------------------------
  // Step C: short-circuit si no hay nada que migrar
  // -------------------------------------------------------------------------
  const total = realArticles.length;
  if (total === 0) {
    console.log(`\nrealArticles está vacío — nada que migrar.`);
    console.log(`(esperado en la primera corrida del esqueleto)`);
    console.log(`\n=========================================`);
    console.log(`0 de 0 notas migradas como Published`);
    console.log(`${draftsDeleted} drafts borrados`);
    console.log(`0 errores`);
    console.log(`=========================================\n`);
    return;
  }

  // -------------------------------------------------------------------------
  // Step D: iterar realArticles → createOrReplace
  // -------------------------------------------------------------------------
  let okCount = 0;
  const skipped = [];

  for (let i = 0; i < total; i++) {
    const a = realArticles[i];
    const idx = `${i + 1}/${total}`;
    console.log(`\nProcesando ${idx}: ${a.titulo}`);

    const catSlug = a.categoria?.slug;
    const autSlug = a.autor?.slug;
    const catId = catBySlug.get(catSlug);
    const autId = autBySlug.get(autSlug);

    if (!catId) {
      const reason = `categoría "${catSlug}" no existe en Sanity`;
      console.warn(`  ✗ ${reason}`);
      skipped.push({ slug: a.slug, titulo: a.titulo, reason });
      continue;
    }
    if (!autId) {
      const reason = `autor "${autSlug}" no existe en Sanity`;
      console.warn(`  ✗ ${reason}`);
      skipped.push({ slug: a.slug, titulo: a.titulo, reason });
      continue;
    }

    let contenido;
    try {
      contenido = transformContenido(a.contenido);
    } catch (err) {
      const reason = `contenido inválido: ${err.message}`;
      console.warn(`  ✗ ${reason}`);
      skipped.push({ slug: a.slug, titulo: a.titulo, reason });
      continue;
    }

    const docId = a._id ?? a.slug;

    // Defensa anti-draft: realArticles deben quedar published, no como drafts.
    if (docId.startsWith('drafts.')) {
      const reason = 'id arranca con drafts. — realArticles deben ser published';
      console.warn(`  ✗ ${reason}`);
      skipped.push({ slug: a.slug, titulo: a.titulo, reason });
      continue;
    }

    // Campos source-authoritative: sobrescriben en cada re-corrida.
    const sourceFields = {
      titulo: a.titulo,
      slug: { _type: 'slug', current: a.slug },
      copete: a.copete,
      contenido,
      autor: { _type: 'reference', _ref: autId },
      categoria: { _type: 'reference', _ref: catId },
      tags: a.tags ?? [],
      fechaPublicacion: a.fechaPublicacion,
      tiempoLectura: a.tiempoLectura,
    };

    try {
      // Existe? Si sí, patch parcial preservando campos editoriales que
      // viven solo en Sanity (imagenPrincipal subida desde el studio o por
      // upload-unsplash, esCoverDelDia decidido por el editor del día,
      // esDestacada idem, ai_generated, etc.). Si no existe, create completo
      // con defaults del source.
      const existing = await client.fetch(
        '*[_id == $id][0]._id',
        { id: docId },
      );

      if (existing) {
        let patchBuilder = client.patch(docId).set(sourceFields);

        // kicker: source-authoritative con unset si el source lo borró
        if (a.kicker) {
          patchBuilder = patchBuilder.set({ kicker: a.kicker });
        } else {
          patchBuilder = patchBuilder.unset(['kicker']);
        }

        // fechaActualizacion: solo set si el source la define. No unset —
        // el editor puede haberla sumado post-migración para señalar
        // correcciones; preservar.
        if (a.fechaActualizacion) {
          patchBuilder = patchBuilder.set({
            fechaActualizacion: a.fechaActualizacion,
          });
        }

        // NO se setean: imagenPrincipal, esCoverDelDia, esDestacada,
        // ai_generated, ni cualquier otro campo editor-authoritative que
        // viva solo en Sanity. Sanity preserva lo que el patch no toca.

        await patchBuilder.commit();
        console.log('  ✓ actualizada (preserva imagenPrincipal/esCoverDelDia/esDestacada/ai_generated)');
      } else {
        // Doc nuevo: createOrReplace con todos los campos del source incluidos
        // los defaults (esDestacada/esCoverDelDia=false). El editor los puede
        // ajustar después desde el studio.
        const fullDoc = {
          _id: docId,
          _type: 'article',
          ...sourceFields,
          ...(a.kicker ? { kicker: a.kicker } : {}),
          ...(a.fechaActualizacion ? { fechaActualizacion: a.fechaActualizacion } : {}),
          esDestacada: !!a.esDestacada,
          esCoverDelDia: !!a.esCoverDelDia,
          // imagenPrincipal omitido — el editor la sube manualmente.
        };
        await client.createOrReplace(fullDoc);
        console.log('  ✓ creada');
      }
      okCount++;
    } catch (err) {
      const reason = `error de API: ${err?.message ?? String(err)}`;
      console.warn(`  ✗ ${reason}`);
      skipped.push({ slug: a.slug, titulo: a.titulo, reason });
    }
  }

  // -------------------------------------------------------------------------
  // Step E: reporte
  // -------------------------------------------------------------------------
  console.log(`\n=========================================`);
  console.log(`${okCount} de ${total} notas migradas como Published`);
  console.log(`${draftsDeleted} drafts viejos borrados`);
  console.log(`${skipped.length} salteadas/erradas`);
  if (skipped.length > 0) {
    console.log(`\nDetalle de salteadas:`);
    for (const s of skipped) console.log(`  - ${s.slug}: ${s.reason}`);
  }
  console.log(`=========================================\n`);
}

main().catch((err) => {
  console.error('\nError fatal:', err);
  process.exit(1);
});
