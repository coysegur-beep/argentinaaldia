# Argentina al día

**Argentina al día es el diario digital de cobertura federal**: política, economía, sociedad, cultura, deportes y agro desde Buenos Aires, Córdoba, Rosario, Mendoza, el NOA y la Patagonia. Periodismo independiente, editado, diario.

> Las noticias de Argentina, todos los días.

El sitio está construido con Astro 5 (build estático, sin server) y Tailwind, los contenidos viven en Sanity, y se deploya en Cloudflare Pages. Esa decisión de stack responde a tres prioridades de un diario digital: **velocidad** (cada milisegundo de TTFB cuesta lectores), **accesibilidad** (los lectores no son developers) y **mantenimiento simple** (un equipo chico tiene que poder operarlo sin un SRE).

- **Sitio público:** [argentinaaldia.com](https://argentinaaldia.com)
- **Studio (CMS):** `https://argentinaaldia.sanity.studio`

## Requisitos

- **Node 20 LTS** o **Node 22 LTS** (Astro 5 acepta también ≥18.20.8 pero 20+ es lo recomendado).
- **npm 10+** (viene con Node 20).
- Windows, macOS o Linux. Probado en Windows 11 con PowerShell y en CI Ubuntu.
- Para administrar contenido en producción: cuenta gratis en [sanity.io](https://sanity.io). Para desarrollar local NO es necesaria — el sitio levanta con datos de muestra.

## Arrancar

```bash
git clone <repo-url> argentina-al-dia
cd argentina-al-dia
cp .env.example .env
npm install
npm run dev                # http://localhost:4321
```

Si no tocás `.env`, el sitio arranca con **datos de muestra** (10 notas reales redactadas con cobertura federal, 4 autores, 9 categorías). Es suficiente para trabajar en componentes, layout, SEO o cualquier cosa que no requiera contenido editorial fresco.

## Variables de entorno

Las 5 variables del proyecto. Todas viven en `.env` en la raíz (no commitear: ya está en `.gitignore`).

| Variable | Default | Cuándo configurarla |
|---|---|---|
| `SANITY_PROJECT_ID` | placeholder | **Producción.** En dev local podés dejar el placeholder y caés a samples. |
| `SANITY_DATASET` | `production` | Casi siempre `production`. Otros valores solo si tenés más de un dataset. |
| `SANITY_API_VERSION` | `2024-03-15` | Versión de GROQ. No la cambies salvo que hagas un upgrade explícito y testees queries. |
| `SANITY_TOKEN` | vacío | Solo si necesitás leer drafts (preview mode) o el dataset es privado. Dataset público + lectura: dejarlo vacío. |
| `PUBLIC_SITE_URL` | `https://argentinaaldia.com` | El dominio canónico. Se usa para canonical URLs, OG, sitemap. Cambiar en preview deploys o entornos distintos. |

El log de build te dice qué fuente de datos está activa:

```
[content] source: samples (Sanity not configured)            ← placeholder
[content] source: sanity (12 articles, 4 authors, 9 cats)    ← Sanity OK
[content] Sanity unreachable, using samples: <razón>          ← fallback ante error
```

El **fallback automático** garantiza que el build nunca falle por credenciales. CI sin variables, branches feature, forks: todos buildean limpio.

## Studio (CMS) en paralelo

El studio es un proyecto npm separado en [studio/](studio/) — no comparte `node_modules` con el sitio. Setup la primera vez:

```bash
cd studio
npm install
# crear studio/.env con:
#   SANITY_STUDIO_PROJECT_ID=<tu-project-id>
#   SANITY_STUDIO_DATASET=production
npm run dev               # http://localhost:3333
```

Para la guía editorial completa (cómo cargar las 9 categorías, autores, primeras notas), ver [studio/README.md](studio/README.md).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta el sitio en `http://localhost:4321` con hot reload |
| `npm run build` | Build estático en `dist/` (lo que se sube a Cloudflare Pages) |
| `npm run preview` | Sirve el build local para verificarlo antes del deploy |
| `npx astro check` | Typecheck (TypeScript strict) sobre todos los `.astro` |
| `npm run og:generate` | Regenera `public/og-default.png` y `public/logo-publisher.png` desde los SVG fuente. Correr cuando cambien los SVG o el branding. |
| `npm run generate-articles` | Genera 1-3 notas de opinión/análisis con Claude API y las sube a Sanity como **drafts**. Ver sección "Generación automática de contenido". |

## Generación automática de contenido

El proyecto incluye un script (`scripts/generate-articles.mjs`) que llama a la Gemini API (Google) para producir notas de opinión/análisis a partir de una cola de temas. El output va a Sanity como **drafts** (nunca se publica solo) — el editor revisa, suma `imagenPrincipal`, y aprieta Publish desde el studio.

### Cómo cargar temas

Editá `src/data/topics-queue.json` sumando objetos al array. Shape:

```json
{
  "id": "topic-006",
  "titulo_sugerido": "Título tentativo (el modelo lo puede ajustar)",
  "categoria": "economia",
  "tipo": "analisis",
  "prompt_extra": "Brief editorial: foco, perspectivas, qué no incluir.",
  "prioridad": 2
}
```

- **`categoria`**: tiene que ser un slug existente en Sanity (politica, economia, sociedad, cultura, deportes, agro, espectaculos, mundo, provincias).
- **`tipo`**: `opinion` | `analisis` | `explicativo`.
- **`prioridad`**: entero. Menor número = más prioridad.
- **`id`**: único, secuencial. Sirve para identificar la entrada después de consumida.

Cuando el script consume un topic, le agrega `consumed: true`, `consumed_at`, y `sanity_id`. El topic queda en el archivo (no se borra) — sirve como historial.

### Correr manualmente (local)

```bash
# Configurar .env raíz con:
#   GEMINI_API_KEY=AIza...                (https://aistudio.google.com/apikey)
#   SANITY_PROJECT_ID=...
#   SANITY_DATASET=production
#   SANITY_TOKEN=...   (Editor)

npm run generate-articles
```

Variables opcionales:

- `GEMINI_MODEL=gemini-2.5-pro` — modelo a usar (default `gemini-2.5-flash`).
- `DAILY_COUNT=3` — cuántos topics consumir por corrida (default 2).
- `MONTHLY_TOKEN_LIMIT=500000` — tope mensual de tokens (default 1M).
- `DRY_RUN=1` — no llama API ni escribe a Sanity ni actualiza queue. Para sanity-checks.

### GitHub Actions (cron diario)

El workflow `.github/workflows/generate-news.yml` corre todos los días a **08:00 hora Argentina** (11:00 UTC). También se puede disparar manualmente desde la UI de GitHub Actions con override de `DAILY_COUNT` y `MONTHLY_TOKEN_LIMIT`.

**Secrets requeridos en el repo** (Settings → Secrets and variables → Actions):

- `GEMINI_API_KEY` — token de Gemini API. Generar gratis en [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (no requiere tarjeta de crédito).
- `SANITY_PROJECT_ID` — id del proyecto.
- `SANITY_DATASET` — `production`.
- `SANITY_TOKEN` — token Editor para escribir drafts.

El workflow commitea automáticamente las actualizaciones de `src/data/topics-queue.json` (consumidos) y `data/ai-usage.json` (tracking de tokens) con el mensaje `chore(ai): consume topics + update usage tracking [skip ci]`.

### Costo aproximado

Modelo por default: `gemini-2.5-flash`. Por nota generada (~700-1000 palabras):

- Input: ~500 tokens (system prompt + brief).
- Output: ~1500 tokens (JSON con cuerpo).
- **Tier gratuito de Gemini cubre el uso normal (1-3 notas/día) sin tarjeta de crédito requerida.** El plan free de Gemini API permite varias requests por minuto y un tope diario de tokens más que suficiente para este volumen editorial.
- Si se decide usar el modelo `gemini-2.5-pro` (mejor calidad), el tier free también lo cubre dentro de límites más bajos.

El script logea uso de tokens al final de cada corrida y persiste el contador del mes en `data/ai-usage.json`. Si el contador supera `MONTHLY_TOKEN_LIMIT` aborta antes de la siguiente call.

### Disclosure visible

Cada nota subida con `ai_generated: true` muestra el componente `<AiDisclosure>` arriba del cuerpo en la página de detalle, con el texto:

> **Asistencia de IA** — Esta nota fue redactada con asistencia de inteligencia artificial sobre la base de un brief editorial, y revisada antes de publicar.

El editor puede destildar el flag desde el studio si la nota termina sin parecido al output original tras edits humanos sustantivos.

### Reglas duras del system prompt

El modelo tiene prohibido inventar declaraciones textuales, citas atribuidas, datos numéricos precisos, o fechas específicas. Si necesita un dato, lo agrega al campo `pending_facts` del JSON para que el editor lo verifique antes de publicar. El script imprime esos `pending_facts` por consola en cada corrida.

## Estructura del repo

```
src/
├── pages/                          # Rutas
│   ├── index.astro                 # Home con 12 componentes editoriales
│   ├── [categoria].astro           # Listado de categoría (página 1)
│   ├── [categoria]/p/[page].astro  # Paginación de categoría (página 2+)
│   ├── [categoria]/[slug].astro    # Detalle de nota
│   ├── autor/[slug].astro          # Página de autor + sus notas
│   ├── buscar.astro                # Buscador client-side (noindex)
│   ├── 404.astro                   # Editorial, con sugerencias
│   ├── feed.xml.ts                 # RSS 2.0
│   ├── sitemap-news.xml.ts         # Google News sitemap (últimas 48h)
│   └── robots.txt.ts               # Bots de IA bloqueados, tradicionales OK
├── layouts/
│   ├── BaseLayout.astro            # HTML shell + todos los meta SEO + JSON-LD
│   └── SiteShell.astro             # Chrome reusable (header, mega menu, newsletter, footer)
├── components/                     # 12 componentes home + ArticleCard + Pagination + etc.
├── data/
│   ├── content.ts                  # Facade Sanity-or-samples — punto de entrada único
│   ├── sample-articles.ts          # Fallback: 10 notas con cobertura federal
│   ├── sample-authors.ts           # Fallback: 4 autores
│   └── sample-categories.ts        # Fallback: las 9 categorías
├── lib/
│   ├── sanity.ts                   # Cliente + projections GROQ + fetchers async
│   ├── seo.ts                      # Builders de JSON-LD, OG helpers, truncate
│   └── format.ts                   # Helpers de fecha en es-AR
├── styles/global.css
├── types.ts                        # Article, Author, Category, ContentBlock, etc.
└── env.d.ts                        # Tipado de import.meta.env

studio/                             # Sanity Studio standalone
├── schemas/
│   ├── article.ts
│   ├── author.ts
│   └── category.ts
├── sanity.config.ts
├── sanity.cli.ts
└── README.md                       # Guía paso a paso para el equipo editorial

public/                             # Assets estáticos
├── favicon.svg
├── logo-publisher.svg              # Fuente diseñada (svg)
├── logo-publisher.png              # Generado por og:generate (referenciado en JSON-LD)
├── og-default.svg                  # Fuente diseñada (svg)
└── og-default.png                  # Generado por og:generate (referenciado en og:image)

scripts/
└── generate-og-png.mjs             # SVG → PNG con sharp (para OG y publisher logo)
```

## Stack

- **Astro 5** con `output: 'static'` y adapter `@astrojs/cloudflare` (preparado para deploy en Pages).
- **TypeScript strict** en todo el código del sitio.
- **Tailwind CSS v3** con paleta custom (ink, celeste, carbon, bone, sol + colores por sección).
- **Sanity v3** como CMS, con cliente `@sanity/client` para queries GROQ build-time.
- **@portabletext/to-html** disponible para Fase futura cuando crezcan los block types.
- Sin frameworks de UI (React/Vue/Svelte). Astro componentes puros + un solo `<script is:inline>` en el buscador.

## SEO técnico (qué viene resuelto)

- JSON-LD `NewsArticle` + `BreadcrumbList` por nota.
- JSON-LD `NewsMediaOrganization` en home.
- Open Graph + Twitter Cards completos con `og:image` raster (PNG).
- `<link rel="canonical">` absoluto en cada página.
- `<link rel="prev/next">` en páginas paginadas (sin duplicate content: página 1 vive en `/seccion`, no en `/seccion/p/1`).
- `<meta name="robots" content="noindex,follow">` en `/buscar` y `/404`.
- `sitemap-index.xml` (general) + `sitemap-news.xml` (formato Google News, últimas 48h).
- `feed.xml` RSS 2.0 con las últimas 50 notas (copete + "Seguir leyendo" — no contenido completo).
- `robots.txt` permitiendo crawlers tradicionales y bloqueando 12 bots de IA.

Para los detalles de deploy, monitoreo y mantenimiento ver [DEPLOY.md](DEPLOY.md), [MAINTENANCE.md](MAINTENANCE.md) y [TECH_DEBT.md](TECH_DEBT.md).

## Convenciones del código

- `es-AR` locale, timezone `America/Argentina/Buenos_Aires`.
- Una sola `<h1>` por página, siempre del contenido (título de nota, nombre de categoría, etc.). El masthead "Argentina al día" no es h1.
- Mobile usable a 375px sin scroll horizontal.
- `font-serif` (Spectral) para titulares y citas; `font-sans` (Inter) para body, UI y metadatos.
- Colores via Tailwind config (no hex hardcoded en componentes salvo `style={`background-color: ${categoria.colorAccent}`}` que es data-driven).
- Componentes Astro tontos, lógica de slicing/filtrado en las páginas (`getCoverArticle()`, `getDestacadas(3)`, etc.).
- Empty states diseñados (categoría sin notas, 404, búsqueda sin resultados): nunca dejar al usuario en una página vacía.

## Cómo contribuir

1. Crear branch desde `main`.
2. `npm run dev` para validar localmente.
3. Antes de pushear: `npx astro check` debe estar limpio.
4. Antes de mergear: `npm run build` debe completar sin error (incluso con `SANITY_PROJECT_ID=fake_id` para validar el fallback).

## Licencia

Antes del primer deploy público hay que decidir dos cosas separadas: si **el código** del sitio será privado (default razonable para un producto comercial, repo de GitHub privado, sin archivo `LICENSE`) o público (entonces evaluar MIT / Apache 2.0 / AGPL); y si **el contenido editorial** será all rights reserved, Creative Commons BY-NC, o BY-SA. Mientras tanto, todo se asume "all rights reserved". Detalles y framing de la decisión en [LICENSE.md](LICENSE.md).
