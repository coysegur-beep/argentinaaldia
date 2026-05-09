import type { APIRoute } from 'astro';
import { articles } from '../data/content';
import {
  SITE_NAME,
  SITE_DESCRIPTION_DEFAULT,
  SITE_LANG,
  absoluteUrl,
} from '../lib/seo';

const FEED_LIMIT = 50;

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

function rfc822(iso: string | null | undefined): string {
  if (!iso) return new Date().toUTCString();
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return new Date().toUTCString();
  return new Date(t).toUTCString();
}

function articleTime(a: { fechaPublicacion?: string | null }): number {
  if (!a.fechaPublicacion) return 0;
  const t = new Date(a.fechaPublicacion).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('https://argentinaaldia.com');
  const sorted = [...articles]
    .sort((a, b) => articleTime(b) - articleTime(a))
    .slice(0, FEED_LIMIT);

  const items = sorted
    .map((a) => {
      const catSlug = a.categoria?.slug;
      const articleSlug = a.slug;
      if (!catSlug || !articleSlug) return null;

      const url = absoluteUrl(`/${catSlug}/${articleSlug}`, origin);
      const titulo = a.titulo ?? 'Sin título';
      const copete = a.copete ?? '';
      const autorNombre = a.autor?.nombre ?? 'Redacción';
      const catNombre = a.categoria?.nombre ?? '';
      const imgSrc = a.imagenPrincipal?.src;
      const pubDate = rfc822(a.fechaPublicacion);
      const teaser = `${copete}\n\n<a href="${escapeXml(url)}">Seguir leyendo en ${escapeXml(SITE_NAME)} →</a>`;
      const enclosureLine = imgSrc
        ? `\n      <enclosure url="${escapeXml(imgSrc)}" type="image/jpeg" />`
        : '';

      return `
    <item>
      <title>${escapeXml(titulo)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${escapeXml(autorNombre)}</dc:creator>
      <category>${escapeXml(catNombre)}</category>${enclosureLine}
      <description>${escapeXml(copete)}</description>
      <content:encoded><![CDATA[${teaser}]]></content:encoded>
    </item>`;
    })
    .filter((s): s is string => s !== null)
    .join('');

  const firstWithDate = sorted.find((a) => a.fechaPublicacion);
  const lastBuildDate = firstWithDate
    ? rfc822(firstWithDate.fechaPublicacion)
    : new Date().toUTCString();

  const channelUrl = origin.toString().replace(/\/$/, '') + '/';
  const selfUrl = absoluteUrl('/feed.xml', origin);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${escapeXml(channelUrl)}</link>
    <atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml" />
    <description>${escapeXml(SITE_DESCRIPTION_DEFAULT)}</description>
    <language>${SITE_LANG}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
};
