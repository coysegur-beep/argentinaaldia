import type { APIRoute } from 'astro';
import { articles } from '../data/content';
import { SITE_NAME, absoluteUrl } from '../lib/seo';

const TWO_DAYS_MS = 48 * 60 * 60 * 1000;

function escapeXml(s: string | null | undefined): string {
  if (s == null) return '';
  return s.replace(
    /[<>&'"]/g,
    (c) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        "'": '&apos;',
        '"': '&quot;',
      })[c]!,
  );
}

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('https://argentinaaldia.com');
  const now = Date.now();

  const recientes = articles.filter((a) => {
    if (!a.fechaPublicacion) return false;
    const t = new Date(a.fechaPublicacion).getTime();
    if (Number.isNaN(t)) return false;
    return now - t <= TWO_DAYS_MS;
  });

  const urls = recientes
    .map((a) => {
      const catSlug = a.categoria?.slug;
      const articleSlug = a.slug;
      const fecha = a.fechaPublicacion;
      if (!catSlug || !articleSlug || !fecha) return null;

      const titulo = a.titulo ?? 'Sin título';
      return `
  <url>
    <loc>${escapeXml(absoluteUrl(`/${catSlug}/${articleSlug}`, origin))}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(SITE_NAME)}</news:name>
        <news:language>es</news:language>
      </news:publication>
      <news:publication_date>${fecha}</news:publication_date>
      <news:title>${escapeXml(titulo)}</news:title>
    </news:news>
  </url>`;
    })
    .filter((s): s is string => s !== null)
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urls}
</urlset>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
