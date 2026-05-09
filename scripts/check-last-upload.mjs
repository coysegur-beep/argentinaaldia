// Ad-hoc one-shot: ¿cuál fue el último upload exitoso de imagen a Sanity?
// Devuelve el _updatedAt del article con imagenPrincipal más reciente.
// Sirve para diagnosticar el rate limit window de Unsplash.

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

const last = await client.fetch(
  `*[_type=="article" && defined(imagenPrincipal)] | order(_updatedAt desc) [0..2]{ _id, _updatedAt, titulo }`,
);

console.log(`\n=== últimos 3 articles con imagen (orden desc por _updatedAt) ===`);
for (const a of last) {
  console.log(`  ${a._updatedAt}  ${a._id}  "${a.titulo?.slice(0, 50) ?? ''}"`);
}
console.log(`\n=== hora reportada por el sistema (Date.now() en ISO UTC) ===`);
console.log(`  ${new Date().toISOString()}`);
console.log('');
