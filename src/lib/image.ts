/**
 * Builders de URLs para el CDN de Sanity, con respeto del hotspot del editor.
 *
 * Para assets que NO son del CDN de Sanity (samples Unsplash, URLs externas),
 * devolvemos la `src` tal cual y `buildSrcSet` retorna `undefined`. Eso evita
 * que terminemos generando un srcset con widths inventados sobre URLs que no
 * los soportan.
 *
 * Decisión: no usamos `@sanity/image-url`. La sintaxis nativa del CDN cubre
 * todo lo que necesitamos hoy (w/h/q/fit/crop=focalpoint/fp-x/fp-y/auto=format)
 * sin sumar dependencias.
 */
import type { ArticleImage } from '../types';

const SANITY_CDN = 'cdn.sanity.io';

export interface ImageOpts {
  w?: number;
  h?: number;
  q?: number;
  fit?: 'crop' | 'max' | 'fill';
}

export function buildImageUrl(image: ArticleImage, opts: ImageOpts = {}): string {
  // Guard: el tipo dice `src: string` pero en runtime puede ser null (GROQ
  // devuelve null para asset->url cuando el campo no tiene asset cargado) o
  // undefined (samples a medias). Devolvemos string vacío para que el caller
  // pueda decidir si suprimir el render — ver SanityImage.astro.
  if (!image?.src) return '';

  // Samples / URLs no-Sanity: devolver tal cual. El consumer puede sumar
  // sus propios query params si la URL los soporta (Unsplash sí los soporta,
  // por eso `seo.ts` ya hace eso para OG).
  if (!image.src.includes(SANITY_CDN)) return image.src;

  const u = new URL(image.src);
  if (opts.w) u.searchParams.set('w', String(opts.w));
  if (opts.h) u.searchParams.set('h', String(opts.h));
  if (opts.q) u.searchParams.set('q', String(opts.q));
  if (opts.fit) u.searchParams.set('fit', opts.fit);

  // Hotspot solo aplica con fit=crop. Sin hotspot el CDN crop-ea desde el
  // centro geométrico, que es el default sano cuando el editor no marcó foco.
  if (
    opts.fit === 'crop' &&
    image.hotspotX != null &&
    image.hotspotY != null
  ) {
    u.searchParams.set('crop', 'focalpoint');
    u.searchParams.set('fp-x', String(image.hotspotX));
    u.searchParams.set('fp-y', String(image.hotspotY));
  }

  u.searchParams.set('auto', 'format');
  return u.toString();
}

/**
 * Genera un srcset para un array de widths. Solo emite algo cuando la imagen
 * vive en el CDN de Sanity — para Unsplash y URLs externas devolvemos
 * `undefined` y el consumer renderiza un `<img>` sin `srcset`.
 *
 * `q: 75` es el sweet spot que recomienda Sanity: indistinguible de q=100 a
 * ojo en la mayoría de fotos editoriales y ahorra ~30% de bytes.
 *
 * Si pasás `aspectRatio`, todas las entries del srcset se croppean a ese
 * ratio (con hotspot si la imagen lo tiene). Eso garantiza que el browser
 * elija una variante con la misma forma que el `src` principal — sin esto,
 * el browser podría bajar una imagen con el ratio natural del original y
 * el layout se desincroniza con `width`/`height` del `<img>`.
 */
export function buildSrcSet(
  image: ArticleImage,
  widths: number[],
  aspectRatio?: number,
): string | undefined {
  // Mismo guard que buildImageUrl: src null/undefined desactiva el srcset.
  if (!image?.src || !image.src.includes(SANITY_CDN)) return undefined;
  return widths
    .map((w) => {
      const opts: ImageOpts = { w, q: 75 };
      if (aspectRatio != null) {
        opts.h = Math.round(w / aspectRatio);
        opts.fit = 'crop';
      }
      return `${buildImageUrl(image, opts)} ${w}w`;
    })
    .join(', ');
}
