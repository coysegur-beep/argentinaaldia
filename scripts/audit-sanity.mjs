// Ad-hoc: audita el dataset de Sanity para ver qué hay antes de migrate:real.
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

const docs = await client.fetch(
  `*[_type in ['article','author','category']]{
    _id,
    _type,
    _updatedAt,
    "title": coalesce(titulo, nombre),
    "slug": slug.current
  } | order(_type asc, _id asc)`,
);

const byType = { article: [], author: [], category: [] };
for (const d of docs) byType[d._type].push(d);

console.log(`\n=== TOTALES ===`);
console.log(`articles:   ${byType.article.length}`);
console.log(`authors:    ${byType.author.length}`);
console.log(`categories: ${byType.category.length}`);
console.log(`total:      ${docs.length}\n`);

console.log(`=== ARTICLES ===`);
if (byType.article.length === 0) {
  console.log('  (ninguno)\n');
} else {
  for (const a of byType.article) {
    const isDraft = a._id.startsWith('drafts.');
    const tag = isDraft ? 'DRAFT     ' : 'PUBLISHED ';
    console.log(`  ${tag} ${a._id.padEnd(50)} ${a._updatedAt}  "${a.title ?? '(sin titulo)'}"`);
  }
  console.log('');
}

console.log(`=== AUTHORS ===`);
for (const a of byType.author) {
  console.log(`  ${a._id.padEnd(50)} slug=${(a.slug ?? '').padEnd(28)} "${a.title}"`);
}
console.log('');

console.log(`=== CATEGORIES ===`);
for (const c of byType.category) {
  console.log(`  ${c._id.padEnd(50)} slug=${(c.slug ?? '').padEnd(16)} "${c.title}"`);
}
console.log('');

const drafts = byType.article.filter((a) => a._id.startsWith('drafts.'));
const realPublished = byType.article.filter(
  (a) => !a._id.startsWith('drafts.') && /^real-\d{3}$/.test(a._id),
);
const otherPublished = byType.article.filter(
  (a) => !a._id.startsWith('drafts.') && !/^real-\d{3}$/.test(a._id),
);

console.log(`=== ANÁLISIS ===`);
console.log(`drafts:                  ${drafts.length}`);
console.log(`published con id real-X: ${realPublished.length}`);
console.log(`published con id otro:   ${otherPublished.length}`);
