// Ad-hoc one-shot: audita en Sanity cuántas notas tienen los tags
// 'opinion', 'investigacion', 'judicial'. Diagnóstico del bug de
// OpinionSection / InvestigationSection en home.

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

const tagsToCheck = ['opinion', 'investigacion', 'judicial'];

console.log(`\n=== Auditoría de tags en Sanity ===\n`);

for (const tag of tagsToCheck) {
  const docs = await client.fetch(
    `*[_type == "article" && $tag in tags]{ _id, titulo, tags } | order(_id asc)`,
    { tag },
  );
  console.log(`tag "${tag}": ${docs.length} notas`);
  for (const d of docs) {
    console.log(`  - ${d._id}: ${d.titulo?.slice(0, 70) ?? ''}`);
  }
  console.log('');
}

// Bonus: distribución general de tags para visibilidad
const all = await client.fetch(
  `*[_type == "article"]{ _id, titulo, tags }`,
);

const tagCount = new Map();
let totalWithTags = 0;
let totalWithoutTags = 0;
for (const d of all) {
  if (Array.isArray(d.tags) && d.tags.length > 0) {
    totalWithTags++;
    for (const t of d.tags) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
  } else {
    totalWithoutTags++;
  }
}

console.log(`=== Distribución global de tags ===`);
console.log(`Total notas: ${all.length}`);
console.log(`Con tags:    ${totalWithTags}`);
console.log(`Sin tags:    ${totalWithoutTags}`);
console.log(`\nTags más frecuentes:`);
const sorted = [...tagCount.entries()].sort((a, b) => b[1] - a[1]);
for (const [t, c] of sorted) console.log(`  ${String(c).padStart(3)} × ${t}`);
console.log('');
