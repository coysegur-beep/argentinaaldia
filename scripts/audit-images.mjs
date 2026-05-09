// Ad-hoc: chequea si las 3 notas (real-001, real-013, real-030) tienen
// imagenPrincipal poblada en Sanity, e inspecciona drafts colgados.

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

const client = createClient({
  projectId: '99wrkpjl',
  dataset: 'production',
  apiVersion: '2024-03-15',
  token: process.env.SANITY_TOKEN.trim(),
  useCdn: false,
});

// Trae TODOS los docs (published + drafts) de los 3 ids para comparar
const ids = ['real-001', 'real-013', 'real-030', 'drafts.real-001', 'drafts.real-013', 'drafts.real-030'];
const docs = await client.fetch(
  `*[_id in $ids]{
    _id,
    _updatedAt,
    titulo,
    "imagenPrincipalAssetRef": imagenPrincipal.asset._ref,
    "imagenPrincipalUrl": imagenPrincipal.asset->url,
    "imagenPrincipalAlt": imagenPrincipal.alt,
    "imagenPrincipalHotspot": imagenPrincipal.hotspot,
    "contenidoTypes": contenido[]._type
  }`,
  { ids },
);

console.log(`\nDocs encontrados: ${docs.length}\n`);
for (const d of docs.sort((a, b) => a._id.localeCompare(b._id))) {
  console.log(`=== ${d._id} ===`);
  console.log(`  _updatedAt:                ${d._updatedAt}`);
  console.log(`  titulo:                    ${d.titulo?.slice(0, 60)}...`);
  console.log(`  imagenPrincipal.asset:     ${d.imagenPrincipalAssetRef ?? '(null)'}`);
  console.log(`  imagenPrincipal.url:       ${d.imagenPrincipalUrl ?? '(null)'}`);
  console.log(`  imagenPrincipal.alt:       ${d.imagenPrincipalAlt ?? '(null)'}`);
  console.log(`  imagenPrincipal.hotspot:   ${JSON.stringify(d.imagenPrincipalHotspot ?? null)}`);
  console.log(`  contenido tipos:           ${JSON.stringify(d.contenidoTypes ?? [])}`);
  console.log('');
}

// Drafts colgados en general
const allDraftIds = await client.fetch(
  `*[_id in path("drafts.**") && _type=="article"]._id`,
);
console.log(`\nDrafts colgados (cualquier slug): ${allDraftIds.length}`);
if (allDraftIds.length > 0) {
  for (const id of allDraftIds.slice(0, 10)) console.log(`  - ${id}`);
}
