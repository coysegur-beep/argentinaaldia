/**
 * Facade único de contenido para todo el sitio.
 *
 * Decide al cargar el módulo si los datos vienen de Sanity o de los samples
 * locales. Toma de Sanity si SANITY_PROJECT_ID está seteado y NO es un
 * placeholder. Cae a samples si:
 *   - el placeholder sigue ahí
 *   - o Sanity está configurado pero el fetch falla (network/auth/404)
 *
 * Todas las páginas y endpoints importan desde acá; nunca desde sample-*.ts
 * directamente. Eso permite que cambiar de samples a Sanity (o caer al
 * fallback en CI sin credenciales) no requiera tocar consumidores.
 */
import {
  isSanityConfigured,
  sanityInitError,
  fetchAllArticles,
  fetchAllAuthors,
  fetchAllCategories,
} from '../lib/sanity';
import { articles as sampleArticles } from './sample-articles';
import { authors as sampleAuthors } from './sample-authors';
import { categories as sampleCategories } from './sample-categories';
import type { Article, Author, Category, CategorySlug } from '../types';

type Source = 'sanity' | 'samples' | 'samples-fallback';

// Detecta build productivo en Cloudflare Pages. CF expone `CF_PAGES=1` durante
// cualquier build, y `CF_PAGES_BRANCH` con el nombre de la branch que se está
// buildeando (en preview deploys de PRs es la branch del PR, no `main`).
// En prod build, caer a samples es un failure mode que debe abortar el deploy
// — un medio de noticias no puede servir contenido de muestra en silencio.
// En dev y en previews, el fallback a samples sigue siendo aceptable.
const IS_PROD_BUILD =
  process.env.CF_PAGES === '1' && process.env.CF_PAGES_BRANCH === 'main';

/**
 * ¿Esta nota es visible públicamente AHORA?
 *
 * Filtra por fechaPublicacion <= ahora. Notas con fecha futura quedan fuera
 * del array `articles` y por lo tanto:
 *   - no aparecen en ningún listado / cover / destacada / opinión / dispatches
 *   - no se prerenderea su URL en getStaticPaths del detail page
 *   - el sitio devuelve 404 hasta que el próximo build (post-fechaPublicacion)
 *     las incluya y genere su HTML
 *
 * Comportamiento esperado por el editor para embargos y publicaciones programadas
 * (ver studio/README.md sección "Programar al futuro").
 *
 * En modo Sanity, el filtro ya viene aplicado en GROQ (publishedFilter en sanity.ts).
 * En modo samples, este filtro JS hace el trabajo.
 * Aplicar en ambos casos da defensa en profundidad sin costo significativo.
 */
function isVisible(article: Article, now: Date = new Date()): boolean {
  return new Date(article.fechaPublicacion).getTime() <= now.getTime();
}

// Definite assignment: o el bloque if/else if/else asigna directamente, o lo
// hace fallback(). TS no sigue el flujo a través de la helper, por eso `!`.
let _articles!: Article[];
let _authors!: Author[];
let _categories!: Category[];
let _source!: Source;

function fallback(reason: string): void {
  console.warn(`[content] Sanity unreachable, using samples: ${reason}`);
  _articles = sampleArticles;
  _authors = sampleAuthors;
  _categories = sampleCategories;
  _source = 'samples-fallback';
}

if (isSanityConfigured) {
  try {
    const [articlesRes, authorsRes, categoriesRes] = await Promise.all([
      fetchAllArticles(),
      fetchAllAuthors(),
      fetchAllCategories(),
    ]);
    _articles = articlesRes;
    _authors = authorsRes;
    _categories = categoriesRes;
    _source = 'sanity';
    console.info(
      `[content] source: sanity (${_articles.length} articles, ${_authors.length} authors, ${_categories.length} categories)`,
    );
  } catch (err) {
    fallback(err instanceof Error ? err.message : String(err));
  }
} else if (sanityInitError) {
  // SANITY_PROJECT_ID seteado pero formato inválido (ej. fake_id con underscore).
  fallback(sanityInitError.message);
} else {
  _articles = sampleArticles;
  _authors = sampleAuthors;
  _categories = sampleCategories;
  _source = 'samples';
  console.info('[content] source: samples (Sanity not configured)');
}

// Fail-loud en prod: si después de toda la cascada terminamos con samples,
// abortamos el build antes de deployar. Esto cubre los 3 paths de fallback
// (catch del fetch, sanityInitError, y Sanity no configurado). Incidente
// que motiva esto: SANITY_TOKEN revocado en CF Pages → fetch 401 →
// fallback silencioso a samples → 4+ días sirviendo contenido de muestra
// sin alerta. Ver content.ts:fallback() para el flow anterior.
if (IS_PROD_BUILD && _source !== 'sanity') {
  throw new Error(
    `[content] Production build refused: data source resolved to "${_source}", expected "sanity". ` +
      `Sample data must not reach production. Verify SANITY_PROJECT_ID, SANITY_DATASET, ` +
      `and dataset access in Cloudflare Pages environment variables.`,
  );
}

// Defensa en profundidad: filtra notas con fechaPublicacion futura.
// En modo Sanity el GROQ ya las excluye (publishedFilter), pero aplicar acá
// también garantiza el mismo comportamiento si alguien sube una nota con fecha
// futura a samples, o si el GROQ falla por cualquier razón.
const _hiddenCount = _articles.length;
_articles = _articles.filter((a) => isVisible(a));
const _hidden = _hiddenCount - _articles.length;
if (_hidden > 0) {
  console.info(`[content] ${_hidden} article(s) hidden (fechaPublicacion in the future)`);
}

export const articles: Article[] = _articles;
export const authors: Author[] = _authors;
export const categories: Category[] = _categories;
export const SOURCE: Source = _source;

const sortedByDateDesc = [...articles].sort(
  (a, b) =>
    new Date(b.fechaPublicacion).getTime() -
    new Date(a.fechaPublicacion).getTime(),
);

// Article helpers (mismo API que sample-articles.ts)
export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getArticlesByCategory(slug: CategorySlug): Article[] {
  return sortedByDateDesc.filter((a) => a.categoria.slug === slug);
}

export function getArticlesByAuthor(slug: string): Article[] {
  return sortedByDateDesc.filter((a) => a.autor.slug === slug);
}

export function getCoverArticle(): Article | undefined {
  return articles.find((a) => a.esCoverDelDia);
}

export function getDestacadas(limit = 3): Article[] {
  return sortedByDateDesc.filter((a) => a.esDestacada).slice(0, limit);
}

export function getOpinion(limit = 3): Article[] {
  return sortedByDateDesc.filter((a) => a.tags.includes('opinion')).slice(0, limit);
}

export function getLatest(limit = 8, excludeOpinion = true): Article[] {
  const pool = excludeOpinion
    ? sortedByDateDesc.filter((a) => !a.tags.includes('opinion'))
    : sortedByDateDesc;
  return pool.slice(0, limit);
}

export function getMostRead(limit = 5): Article[] {
  return sortedByDateDesc.slice(0, limit);
}

export function getRelated(article: Article, limit = 3): Article[] {
  return sortedByDateDesc
    .filter(
      (a) =>
        a.slug !== article.slug && a.categoria.slug === article.categoria.slug,
    )
    .slice(0, limit);
}

export function getLatestExcluding(
  slug: CategorySlug,
  limit = 3,
): Article[] {
  return sortedByDateDesc.filter((a) => a.categoria.slug !== slug).slice(0, limit);
}

export function getInvestigaciones(limit = 6): Article[] {
  return sortedByDateDesc
    .filter((a) => a.tags.includes('investigacion'))
    .slice(0, limit);
}

export function getJudiciales(limit = 5): Article[] {
  return sortedByDateDesc
    .filter((a) => a.tags.includes('judicial'))
    .slice(0, limit);
}

// Author / Category helpers
export function getCategoryBySlug(slug: CategorySlug): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getAuthorBySlug(slug: string): Author | undefined {
  return authors.find((a) => a.slug === slug);
}
