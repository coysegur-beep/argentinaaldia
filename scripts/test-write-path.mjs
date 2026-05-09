// Diagnóstico paralelo: prueba el write path completo desde Node con el
// mismo cliente/token que usa audit-images.mjs. Aísla si el problema es
// server-side (write rechazado) o studio-side (browser).
//
// - Target sintético `drafts.test-write-debug` — NO toca contenido real.
// - Sube un PNG 1×1 (transparente, ~67 bytes) hardcodeado en base64.
// - Cleanup garantizado en finally.
// - Idempotente: si quedó algo de una corrida fallida, lo borra primero.
//
// Run: npx tsx scripts/test-write-path.mjs

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

const DOC_ID = 'drafts.test-write-debug';

// PNG 1×1 transparente — buffer mínimo válido para que Sanity acepte el upload.
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const pngBuffer = Buffer.from(PNG_BASE64, 'base64');

let assetId = null;
let testFailed = null;

async function step(num, name, fn) {
  process.stdout.write(`[${num}/5] ${name}... `);
  try {
    const result = await fn();
    console.log('OK');
    return result;
  } catch (err) {
    console.log('FALLA');
    console.error(`        ${err?.message ?? err}`);
    throw err;
  }
}

async function preCleanup() {
  const existing = await client.fetch(
    '*[_id == $id][0]{_id, "asset": imagenPrincipal.asset._ref}',
    { id: DOC_ID },
  );
  if (!existing) return;
  console.log(
    `(pre-cleanup) doc previo encontrado (${existing._id}), borrando para empezar limpio`,
  );
  try {
    await client.delete(DOC_ID);
  } catch (err) {
    console.warn(`  ✗ no se pudo borrar doc previo: ${err?.message ?? err}`);
  }
  if (existing.asset) {
    try {
      await client.delete(existing.asset);
      console.log(`  ✓ asset previo ${existing.asset} borrado`);
    } catch (err) {
      console.warn(
        `  ✗ no se pudo borrar asset previo ${existing.asset}: ${err?.message ?? err}`,
      );
    }
  }
  console.log('');
}

async function main() {
  await preCleanup();

  await step(1, `Cliente OK: 99wrkpjl/production, token presente (${TOKEN.length} chars)`, async () => {
    if (!TOKEN) throw new Error('token vacío');
  });

  const asset = await step(
    2,
    `Asset upload: PNG ${pngBuffer.length} bytes`,
    async () => {
      return await client.assets.upload('image', pngBuffer, {
        filename: 'test-write-debug.png',
        contentType: 'image/png',
      });
    },
  );
  assetId = asset._id;
  console.log(`        asset id: ${assetId}`);

  const created = await step(3, `Doc create: ${DOC_ID}`, async () => {
    return await client.create({
      _id: DOC_ID,
      _type: 'article',
      titulo: 'Test write debug — borrar si lo ves',
      imagenPrincipal: {
        _type: 'image',
        asset: { _type: 'reference', _ref: assetId },
      },
    });
  });
  console.log(`        doc _id: ${created._id}, _updatedAt: ${created._updatedAt}`);

  const readBack = await step(4, 'Read-back', async () => {
    const docs = await client.fetch(
      '*[_id == $id]{_id, _updatedAt, "asset": imagenPrincipal.asset._ref}',
      { id: DOC_ID },
    );
    if (docs.length === 0) throw new Error('doc no encontrado en read-back');
    const d = docs[0];
    const updatedAt = new Date(d._updatedAt).getTime();
    const ageSecs = Math.round((Date.now() - updatedAt) / 1000);
    if (ageSecs > 60) {
      throw new Error(`_updatedAt es de hace ${ageSecs}s, esperado < 60s`);
    }
    if (d.asset !== assetId) {
      throw new Error(`asset mismatch: doc tiene "${d.asset}", esperado "${assetId}"`);
    }
    return { ageSecs, asset: d.asset };
  });
  console.log(
    `        _updatedAt diff: ${readBack.ageSecs}s, asset matches: ${readBack.asset === assetId}`,
  );
}

try {
  await main();
} catch (err) {
  testFailed = err;
}

console.log('\n[5/5] Cleanup:');
try {
  await client.delete(DOC_ID);
  console.log(`        ✓ doc ${DOC_ID} borrado`);
} catch (err) {
  console.warn(`        ✗ no se pudo borrar doc: ${err?.message ?? err}`);
  console.warn(`          HUÉRFANO — borrar a mano: ${DOC_ID}`);
}
if (assetId) {
  try {
    await client.delete(assetId);
    console.log(`        ✓ asset ${assetId} borrado`);
  } catch (err) {
    console.warn(`        ✗ no se pudo borrar asset: ${err?.message ?? err}`);
    console.warn(`          HUÉRFANO — borrar a mano: ${assetId}`);
  }
}

console.log('');
if (testFailed) {
  console.log('RESULT: server rechaza writes desde Node. Investigar token/permisos.');
  process.exit(1);
} else {
  console.log('RESULT: server acepta writes desde Node. El problema está en el studio');
  console.log('        del user (browser-side). Diagnóstico se enfoca ahí.');
}
