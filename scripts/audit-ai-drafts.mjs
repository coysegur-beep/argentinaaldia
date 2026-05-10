// Ad-hoc one-shot: lista todos los drafts AI (ids con prefijo `drafts.ai-`)
// y muestra los campos relevantes para review editorial. Read-only.

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

const drafts = await client.fetch(
  `*[_id in path("drafts.ai-**")]{
    _id,
    titulo,
    "slug": slug.current,
    kicker,
    copete,
    "categoria": categoria->{ nombre, "slug": slug.current },
    tags,
    ai_generated,
    aiModel,
    "contenidoLength": count(contenido),
    fechaPublicacion,
    _createdAt,
    _updatedAt
  } | order(_createdAt desc)`,
);

console.log(`\n=== Drafts AI encontrados: ${drafts.length} ===\n`);

if (drafts.length === 0) {
  console.log('(ninguno — el cron todavía no corrió o falló)\n');
  process.exit(0);
}

for (const d of drafts) {
  console.log(`────────────────────────────────────────────────────────────────`);
  console.log(`_id:                ${d._id}`);
  console.log(`_createdAt:         ${d._createdAt}`);
  console.log(`_updatedAt:         ${d._updatedAt}`);
  console.log(`titulo:             ${d.titulo}`);
  console.log(`slug:               ${d.slug}`);
  console.log(`kicker:             ${d.kicker ?? '(sin kicker)'}`);
  console.log(`copete:             ${d.copete}`);
  console.log(`categoria:          ${d.categoria?.nombre} (${d.categoria?.slug})`);
  console.log(`tags:               [${(d.tags ?? []).join(', ')}]`);
  console.log(`ai_generated:       ${d.ai_generated}`);
  console.log(`aiModel:            ${d.aiModel ?? '(no seteado)'}`);
  console.log(`contenido (bloques): ${d.contenidoLength}`);
  console.log(`fechaPublicacion:   ${d.fechaPublicacion}`);
  console.log('');
}
