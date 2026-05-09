// Migra samples (sample-articles.ts) a Sanity como Drafts.
//
// - Cada doc se crea con _id = "drafts.<slug>" -> queda como Draft, no se publica
//   y NO aparece en el sitio público (que usa perspective: 'published').
// - Idempotente: si ya existe el draft, se borra y recrea.
// - Si la categoría o autor de la sample no existe en Sanity, se saltea.
// - imagenPrincipal NO se migra (requeriría upload de assets aparte).
//
// Run: npm run migrate:samples

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createClient } from '@sanity/client';
import { articles } from '../src/data/sample-articles.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// .env loader (sin dep dotenv, parser mínimo)
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
    // image blocks requieren upload de asset; fuera de scope del migrador inicial
    throw new Error(`bloque de tipo "${b._type}" no soportado en migración inicial`);
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\nResolviendo refs en Sanity (${PROJECT_ID}/${DATASET})...`);

  const cats = await client.fetch(`*[_type=="category"]{_id,"slug":slug.current}`);
  const auts = await client.fetch(`*[_type=="author"]{_id,"slug":slug.current}`);
  const catBySlug = new Map(cats.map((c) => [c.slug, c._id]));
  const autBySlug = new Map(auts.map((a) => [a.slug, a._id]));

  console.log(`  ${cats.length} categorías: ${[...catBySlug.keys()].sort().join(', ') || '(ninguna)'}`);
  console.log(`  ${auts.length} autores: ${[...autBySlug.keys()].sort().join(', ') || '(ninguno)'}`);

  const total = articles.length;
  let okCount = 0;
  const skipped = [];

  for (let i = 0; i < total; i++) {
    const a = articles[i];
    const idx = `${i + 1}/${total}`;
    console.log(`\nMigrando ${idx}: ${a.titulo}`);

    const catSlug = a.categoria.slug;
    const autSlug = a.autor.slug;
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

    const docId = `drafts.${a.slug}`;
    if (!docId.startsWith('drafts.')) {
      // defensa por si alguien refactoriza el id arriba: evita publicar por accidente
      const reason = 'id no arranca con drafts. — defensa anti-publicación';
      console.warn(`  ✗ ${reason}`);
      skipped.push({ slug: a.slug, titulo: a.titulo, reason });
      continue;
    }

    const doc = {
      _id: docId,
      _type: 'article',
      titulo: a.titulo,
      slug: { _type: 'slug', current: a.slug },
      ...(a.kicker ? { kicker: a.kicker } : {}),
      copete: a.copete,
      contenido,
      autor: { _type: 'reference', _ref: autId },
      categoria: { _type: 'reference', _ref: catId },
      tags: a.tags ?? [],
      fechaPublicacion: a.fechaPublicacion,
      ...(a.fechaActualizacion ? { fechaActualizacion: a.fechaActualizacion } : {}),
      esDestacada: !!a.esDestacada,
      esCoverDelDia: !!a.esCoverDelDia,
      tiempoLectura: a.tiempoLectura,
      // imagenPrincipal omitido: requiere upload aparte. El editor lo sube
      // manualmente en el studio (validación va a marcarlo en rojo hasta entonces).
    };

    try {
      const existing = await client.fetch('*[_id==$id][0]._id', { id: docId });
      if (existing) {
        await client.delete(docId);
        console.log('  · draft previo borrado');
      }
      await client.createIfNotExists(doc);
      console.log('  ✓ creado');
      okCount++;
    } catch (err) {
      const reason = `error de API: ${err?.message ?? String(err)}`;
      console.warn(`  ✗ ${reason}`);
      skipped.push({ slug: a.slug, titulo: a.titulo, reason });
    }
  }

  console.log(`\n=========================================`);
  console.log(`${okCount} de ${total} samples migradas como Draft`);
  console.log(`${skipped.length} salteadas`);
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
