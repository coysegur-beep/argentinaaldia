import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@sanity/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const env = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
for (const line of env.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
  if (m) process.env[m[1]] ??= m[2];
}

const client = createClient({
  projectId: '99wrkpjl',
  dataset: 'production',
  apiVersion: '2024-03-15',
  token: process.env.SANITY_TOKEN.trim(),
  useCdn: false,
});

const last = await client.fetch(
  `*[_type == "sanity.imageAsset"] | order(_createdAt desc) [0..4]{ _id, _createdAt, originalFilename }`,
);
console.log('Últimos 5 assets de imagen subidos:');
for (const a of last) console.log(`  ${a._createdAt}  ${a.originalFilename ?? '(sin nombre)'}`);
console.log(`\nHora actual: ${new Date().toISOString()}`);
const total = await client.fetch(`count(*[_type == "sanity.imageAsset"])`);
console.log(`Total assets en dataset: ${total}`);
