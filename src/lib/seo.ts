import type { Article } from '../types';

export const SITE_NAME = 'Argentina al día';
export const SITE_TAGLINE = 'Las noticias de Argentina, todos los días';
export const SITE_DESCRIPTION_DEFAULT =
  'Periodismo independiente, federal y editado. Política, economía, sociedad y cultura desde todas las provincias del país.';
export const SITE_LANG = 'es-AR';
export const SITE_LOCALE = 'es_AR';
export const SITE_COUNTRY = 'AR';

export const TWITTER_HANDLE = '@argentinaaldia';

export const SITE_SOCIALS = [
  'https://twitter.com/argentinaaldia',
  'https://instagram.com/argentinaaldia',
  'https://facebook.com/argentinaaldia',
];

// PNG raster — generado desde el SVG fuente vía `npm run og:generate`.
// SVG en og:image rompe en FB/WhatsApp/LinkedIn; schema.org publisher.logo
// formalmente requiere raster. Los SVG quedan en /public como fuente diseñada.
export const PUBLISHER_LOGO = {
  url: '/logo-publisher.png',
  width: 600,
  height: 60,
} as const;

export const OG_DEFAULT_IMAGE = {
  url: '/og-default.png',
  width: 1200,
  height: 630,
  alt: 'Argentina al día — Las noticias de Argentina, todos los días',
} as const;

export const OG_TITLE_MAX = 60;
export const OG_DESCRIPTION_MAX = 160;

/** Si la parte específica supera este umbral, se omite el sufijo de marca
 *  para no colaborar al overflow visual en SERP/social cards. */
export const TITLE_SUFFIX_OMIT_THRESHOLD = 55;

export function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return base.replace(/[.,;:\-—\s]+$/, '') + '…';
}

/**
 * Arma el `<title>` aplicando la convención del sitio:
 *   - Si la parte específica es ≤55 chars: `<específico> | Argentina al día`
 *   - Si supera 55 chars: devuelve la parte específica sola, sin sufijo
 *
 * NO se trunca a 60. La identidad entre `<title>`, `og:title` y
 * `twitter:title` se mantiene a longitud completa — cada plataforma
 * (Google SERP, Twitter, WhatsApp, browser tab) trunca visualmente como
 * mejor le sirve, pero el contenido textual canónico queda completo en
 * el HTML para que Google pueda indexar la frase entera.
 *
 * Use cases:
 *   buildPageTitle('Política')                        → 'Política | Argentina al día'
 *   buildPageTitle('Política — Página 2')             → 'Política — Página 2 | Argentina al día'
 *   buildPageTitle('Buscar')                          → 'Buscar | Argentina al día'
 *   buildPageTitle('Página no encontrada')            → 'Página no encontrada | Argentina al día'
 *   buildPageTitle('Cosquín cerró con récord...')     → 'Cosquín cerró con récord... | Argentina al día'  (≤55 chars)
 *   buildPageTitle('La producción minera marcó un nuevo récord: el litio saltó 70%...')
 *                                                     → '<sin sufijo>'  (>55 chars)
 */
export function buildPageTitle(specific: string): string {
  const s = specific.trim();
  if (s.length > TITLE_SUFFIX_OMIT_THRESHOLD) return s;
  return `${s} | ${SITE_NAME}`;
}

/**
 * Arma una `meta description` con prefix opcional + contenido + suffix
 * opcional. Trunca a OG_DESCRIPTION_MAX (160) sin cortar palabras (vía
 * `truncate()`) y sólo agrega elipsis si efectivamente truncó.
 *
 * Use cases:
 *   buildPageDescription(article.copete)
 *   buildPageDescription(autor.bio, { prefix: `Notas de ${nombre} en Argentina al día. ` })
 *   buildPageDescription(categoria.descripcion ?? '', { prefix: `Las últimas noticias de ${nombre} en Argentina al día. ` })
 */
export function buildPageDescription(
  content: string,
  opts: { prefix?: string; suffix?: string } = {},
): string {
  const prefix = opts.prefix ?? '';
  const suffix = opts.suffix ?? '';
  const raw = `${prefix}${content}${suffix}`.trim();
  return truncate(raw, OG_DESCRIPTION_MAX);
}

export function absoluteUrl(path: string | URL, origin: string | URL): string {
  return new URL(path.toString(), origin.toString()).toString();
}

/**
 * Construye una URL de imagen 1200×630 lista para OG/Twitter cards.
 *
 * Detecta el origen del asset y aplica las transformaciones nativas:
 *   - Unsplash: query params w/h/fit/auto (no soporta focal point nativo,
 *     así que el `hotspot` se ignora y el crop queda centrado).
 *   - Sanity CDN: mismo set de query params + crop=focalpoint/fp-x/fp-y
 *     cuando el editor marcó hotspot en el asset. Sin hotspot, crop centrado.
 *   - Cualquier otro hostname: devuelve la URL tal cual.
 *
 * El `hotspot` es opcional. Cuando viene `{x, y}` con coords [0..1] del
 * asset de Sanity, el preview social respeta el foco que eligió el editor
 * en lugar del centro geométrico — útil para fotos donde el sujeto está
 * descentrado y el crop a 1200×630 lo decapita.
 */
export function ogImageUrl(
  src: string | undefined | null,
  hotspot?: { x: number; y: number } | null,
): string | null {
  if (!src) return null;
  try {
    const url = new URL(src);
    const isUnsplash = url.hostname.endsWith('unsplash.com');
    const isSanity = url.hostname.endsWith('cdn.sanity.io');
    if (isUnsplash || isSanity) {
      url.searchParams.set('w', '1200');
      url.searchParams.set('h', '630');
      url.searchParams.set('fit', 'crop');
      // Hotspot solo aplica al CDN de Sanity. Unsplash no expone fp-x/fp-y.
      if (isSanity && hotspot && hotspot.x != null && hotspot.y != null) {
        url.searchParams.set('crop', 'focalpoint');
        url.searchParams.set('fp-x', String(hotspot.x));
        url.searchParams.set('fp-y', String(hotspot.y));
      }
      url.searchParams.set('auto', 'format');
      return url.toString();
    }
    return src;
  } catch {
    return src;
  }
}

export function newsMediaOrganizationSchema(origin: string | URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: SITE_NAME,
    url: origin.toString(),
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl(PUBLISHER_LOGO.url, origin),
      width: PUBLISHER_LOGO.width,
      height: PUBLISHER_LOGO.height,
    },
    sameAs: SITE_SOCIALS,
    areaServed: SITE_COUNTRY,
    inLanguage: SITE_LANG,
  };
}

export function newsArticleSchema(article: Article, origin: string | URL) {
  const articleUrl = absoluteUrl(
    `/${article.categoria.slug}/${article.slug}`,
    origin,
  );
  const authorUrl = absoluteUrl(`/autor/${article.autor.slug}`, origin);
  const img = article.imagenPrincipal;
  const hotspot =
    img.hotspotX != null && img.hotspotY != null
      ? { x: img.hotspotX, y: img.hotspotY }
      : undefined;
  const imageUrl = ogImageUrl(img.src, hotspot);

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.titulo.slice(0, 110),
    datePublished: article.fechaPublicacion,
    dateModified: article.fechaActualizacion ?? article.fechaPublicacion,
    author: [
      {
        '@type': 'Person',
        name: article.autor.nombre,
        url: authorUrl,
      },
    ],
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: SITE_NAME,
      url: origin.toString(),
      logo: {
        '@type': 'ImageObject',
        url: absoluteUrl(PUBLISHER_LOGO.url, origin),
        width: PUBLISHER_LOGO.width,
        height: PUBLISHER_LOGO.height,
      },
    },
    image: imageUrl ? [imageUrl] : [],
    articleSection: article.categoria.nombre,
    articleBody: article.copete,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    url: articleUrl,
    inLanguage: SITE_LANG,
    isAccessibleForFree: true,
  };
}

export function breadcrumbSchema(
  items: { name: string; url: string }[],
  origin: string | URL,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.url, origin),
    })),
  };
}
