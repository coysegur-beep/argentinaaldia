// Ad-hoc: borra el autor florencia-goldsman de Sanity si no tiene refs activas.
// One-shot. Borrar este archivo después de correr.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@sanity/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const envText = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
}

const TOKEN = (process.env.SANITY_TOKEN ?? '').trim();
if (!TOKEN) {
  console.error('SANITY_TOKEN vacío en .env');
  process.exit(1);
}

const client = createClient({
  projectId: '99wrkpjl',
  dataset: 'production',
  apiVersion: '2024-03-15',
  token: TOKEN,
  useCdn: false,
});

async function main() {
  // -------------------------------------------------------------------------
  // PASO 1: verificar referencias activas en notas Published Y Drafts
  // -------------------------------------------------------------------------
  console.log('\nPaso 1: buscando notas que referencian a florencia-goldsman...');
  const refs = await client.fetch(
    `*[_type == "article" && autor->slug.current == "florencia-goldsman"]{ _id, titulo }`,
  );
  console.log(`  encontradas: ${refs.length}`);

  if (refs.length > 0) {
    console.log('\n✗ ABORTANDO: las siguientes notas todavía referencian a Florencia:');
    for (const r of refs) {
      console.log(`  - ${r._id}: ${r.titulo}`);
    }
    console.log('\nReasigná esas notas a otro autor antes de borrar Florencia.');
    process.exit(1);
  }
  console.log('  ✓ sin referencias activas — ok para borrar');

  // -------------------------------------------------------------------------
  // PASO 2: borrar Florencia (incluye published + cualquier draft)
  // -------------------------------------------------------------------------
  console.log('\nPaso 2: borrando autor florencia-goldsman...');
  const result = await client.delete({
    query: '*[_type == "author" && slug.current == "florencia-goldsman"]',
  });
  const deletedIds = result?.results?.map((r) => r.id) ?? [];
  console.log(`  ✓ ${deletedIds.length} documento(s) borrado(s): ${deletedIds.join(', ') || '(ninguno)'}`);

  // -------------------------------------------------------------------------
  // PASO 3: listar autores restantes
  // -------------------------------------------------------------------------
  console.log('\nPaso 3: autores que quedan en Sanity...');
  const remaining = await client.fetch(
    `*[_type == "author"] | order(slug.current asc){ nombre, "slug": slug.current }`,
  );
  for (const a of remaining) {
    console.log(`  - ${a.slug.padEnd(28)} ${a.nombre}`);
  }
  const stillThere = remaining.some((a) => a.slug === 'florencia-goldsman');

  console.log('\n=========================================');
  console.log(`Notas referenciando a Florencia antes del borrado: 0`);
  console.log(`Florencia borrada: ${stillThere ? 'NO (sigue presente!)' : 'SI'}`);
  console.log(`Autores restantes (${remaining.length}): ${remaining.map((a) => a.slug).join(', ')}`);
  console.log('=========================================\n');
}

main().catch((err) => {
  console.error('\nError fatal:', err);
  process.exit(1);
});
