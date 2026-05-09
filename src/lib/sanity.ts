import { createClient } from '@sanity/client';
import type { Article, Author, Category } from '../types';

// ============================================================
// 1. CONFIG + CLIENT
// ============================================================

const projectId = (import.meta.env.SANITY_PROJECT_ID ?? '').trim();
const dataset = (import.meta.env.SANITY_DATASET ?? 'production').trim();
const apiVersion = (import.meta.env.SANITY_API_VERSION ?? '2024-03-15').trim();
const tokenRaw = (import.meta.env.SANITY_TOKEN ?? '').trim();
const token = tokenRaw || undefined;

const PLACEHOLDERS = ['', '<<<TU_SANITY_PROJECT_ID>>>', '<<<MI_PROJECT_ID>>>'];

const _hasProjectId = !PLACEHOLDERS.includes(projectId);

// createClient() valida el projectId sincronamente y tira si el formato es
// inválido (ej. underscore, mayúsculas). Capturamos acá para que content.ts
// pueda decidir el fallback con un mensaje específico.
let _client: ReturnType<typeof createClient> | null = null;
let _initError: Error | null = null;

if (_hasProjectId) {
  try {
    _client = createClient({
      projectId,
      dataset,
      apiVersion,
      token,
      useCdn: !token,
      perspective: 'published',
    });
  } catch (err) {
    _initError = err instanceof Error ? err : new Error(String(err));
  }
}

export const sanityClient = _client;
export const isSanityConfigured = _client !== null;
export const sanityInitError = _initError;

// ============================================================
// 2. PROJECTIONS REUSABLES
// ============================================================

const authorProjection = `{
  _id,
  nombre,
  "slug": slug.current,
  cargo,
  "foto": foto.asset->url,
  bio,
  redesSociales
}`;

const categoryProjection = `{
  _id,
  nombre,
  "slug": slug.current,
  descripcion,
  colorAccent,
  orden
}`;

const articleProjection = `{
  _id,
  titulo,
  "slug": slug.current,
  kicker,
  "copete": coalesce(copete, ""),
  contenido[]{
    ...,
    _type == "image" => {
      "_type": "image",
      "src": asset->url,
      "alt": coalesce(alt, ""),
      "caption": caption,
      "width": asset->metadata.dimensions.width,
      "height": asset->metadata.dimensions.height,
      "lqip": asset->metadata.lqip,
      "hotspotX": hotspot.x,
      "hotspotY": hotspot.y
    }
  },
  "imagenPrincipal": {
    "src": imagenPrincipal.asset->url,
    "alt": coalesce(imagenPrincipal.alt, ""),
    "caption": imagenPrincipal.caption,
    "width": imagenPrincipal.asset->metadata.dimensions.width,
    "height": imagenPrincipal.asset->metadata.dimensions.height,
    "lqip": imagenPrincipal.asset->metadata.lqip,
    "hotspotX": imagenPrincipal.hotspot.x,
    "hotspotY": imagenPrincipal.hotspot.y
  },
  "autor": autor->${authorProjection},
  "categoria": categoria->${categoryProjection},
  "tags": coalesce(tags, []),
  fechaPublicacion,
  fechaActualizacion,
  esDestacada,
  esCoverDelDia,
  tiempoLectura,
  "ai_generated": coalesce(ai_generated, false)
}`;

// ============================================================
// 3. QUERIES
// ============================================================

/**
 * Filtro GROQ que excluye notas con fechaPublicacion en el futuro.
 *
 * Aplicado en la query source de artículos hoy (allArticles). Exportado para
 * que cualquier query GROQ futura por-página (cuando se migre a per-page fetch
 * en lugar de fetch-once) lo importe en vez de duplicar el literal.
 *
 * Defensa adicional: content.ts aplica isVisible() en JS sobre el array
 * resultante. Si por alguna razón una nota futura se cuela del filtro GROQ
 * (cambio de timezone del cluster, dataset corrupto, error de proyección),
 * la capa JS la atrapa.
 */
export const publishedFilter = `fechaPublicacion <= now()`;

export const queries = {
  allArticles: `*[_type == "article" && ${publishedFilter}] | order(fechaPublicacion desc)${articleProjection}`,
  allAuthors: `*[_type == "author"]${authorProjection}`,
  allCategories: `*[_type == "category"] | order(orden asc)${categoryProjection}`,
};

// ============================================================
// 4. FETCHERS
// ============================================================

export async function fetchAllArticles(): Promise<Article[]> {
  if (!sanityClient) return [];
  return sanityClient.fetch<Article[]>(queries.allArticles);
}

export async function fetchAllAuthors(): Promise<Author[]> {
  if (!sanityClient) return [];
  return sanityClient.fetch<Author[]>(queries.allAuthors);
}

export async function fetchAllCategories(): Promise<Category[]> {
  if (!sanityClient) return [];
  return sanityClient.fetch<Category[]>(queries.allCategories);
}
