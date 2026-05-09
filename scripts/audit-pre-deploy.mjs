// Ad-hoc pre-deploy QA: query global por notas sin imagenPrincipal.
// One-shot. Borrar después si no se reusa.

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

const total = await client.fetch(`count(*[_type == "article"])`);
const sinImagen = await client.fetch(
  `*[_type == "article" && !defined(imagenPrincipal)]{ _id, titulo }`,
);
const conImagen = total - sinImagen.length;

console.log(`\n=== Auditoría pre-deploy ===`);
console.log(`Total artículos:    ${total}`);
console.log(`Con imagenPrincipal: ${conImagen}`);
console.log(`Sin imagenPrincipal: ${sinImagen.length}`);
if (sinImagen.length > 0) {
  console.log(`\nDetalle de notas sin imagen (completar manual antes de deploy):`);
  for (const n of sinImagen) {
    console.log(`  - ${n._id}: ${n.titulo?.slice(0, 80) ?? '(sin título)'}`);
  }
}
console.log('');
