/**
 * Renderiza los SVG de OG image y publisher logo a PNG raster.
 *
 * Razón: SVG en og:image rompe en FB/WhatsApp/LinkedIn. Y schema.org
 * publisher.logo formalmente requiere raster (PNG/JPG). Los SVGs en /public
 * son la fuente "diseñada" y los PNGs son el output que referencian las metatags.
 *
 * Cómo correrlo:    npm run og:generate
 * Cuándo correrlo:  cuando cambien los SVGs fuente (rara vez).
 *
 * sharp viene como dep transitive de Astro; no hace falta instalar nada extra.
 */
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const targets = [
  {
    src: 'public/og-default.svg',
    out: 'public/og-default.png',
    width: 1200,
    height: 630,
  },
  {
    src: 'public/logo-publisher.svg',
    out: 'public/logo-publisher.png',
    width: 600,
    height: 60,
  },
];

for (const t of targets) {
  const svg = await readFile(resolve(ROOT, t.src));
  const png = await sharp(svg, { density: 300 })
    .resize(t.width, t.height, { fit: 'contain', background: { r: 10, g: 10, b: 10, alpha: 1 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(resolve(ROOT, t.out), png);
  console.log(`✓ ${t.out}  (${t.width}×${t.height}, ${png.byteLength} bytes)`);
}
