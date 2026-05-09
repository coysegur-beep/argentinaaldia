# Deuda técnica

Inventario consciente de lo que se postergó, por qué, y cuándo conviene resolverlo. Los items están ordenados por prioridad: los **bloqueantes** se resuelven antes del primer deploy público; el resto puede esperar pero tiene un trigger concreto que indica cuándo es buen momento.

Cada item sigue la misma estructura: descripción → por qué no se resolvió → qué pasa si no → solución estándar → trigger.

---

## Bloqueantes (resolver antes del primer deploy público)

### 1. Fecha y número de edición hardcoded en `SiteShell`

- **Categoría:** Build-time freeze
- **Archivo:** [src/layouts/SiteShell.astro:54](src/layouts/SiteShell.astro#L54)
- **Descripción del problema actual:** `SiteShell.astro` hardcodea `fechaHoy = new Date('2026-05-06T08:00:00-03:00')` y `numeroEdicion = 4287`. Cada build genera HTML con esos valores literales; no se actualizan hasta tocar el código.
- **Por qué no se resolvió ahora:** durante development con samples no tiene sentido cambiarlo (la fecha de samples es 2026-05-06, todo coherente). Para producción real requiere decidir entre `new Date()` build-time + cron de rebuild (4h delay max), o hidratación client-side (instantáneo pero sumás JS).
- **Qué pasa si NO se resuelve:** el banner muestra "Miércoles 6 de mayo de 2026" perpetuamente. Bug visible y vergonzoso si se descubre semanas después del launch.
- **Solución estándar:** reemplazar los hardcodes por `new Date()` + helper que calcule el número de edición como `dias desde fecha-inicio + offset`. Con el cron de 4h activo (`REBUILD.md`), max delay = 4h, aceptable para "hoy". Para precisión absoluta, hidratación client-side con un `<script>` que actualiza el `<time>` del banner al cargar.
- **Cuándo conviene resolverlo:** antes del primer deploy a producción. No opcional.

### 2. Decisión de LICENSE pendiente

- **Categoría:** Decisión del dueño
- **Archivo:** [LICENSE.md](LICENSE.md)
- **Descripción del problema actual:** `LICENSE.md` existe como stub explicativo. Las dos decisiones reales (código privado/público; contenido all-rights-reserved/CC BY-NC/etc.) están sin tomar.
- **Por qué no se resolvió ahora:** decisión del dueño del proyecto y la dirección editorial, no del equipo técnico.
- **Qué pasa si NO se resuelve:** zona gris legal. Si el repo es público sin LICENSE, default copyright = nadie tiene derecho legal de usar el código. Para contenido sin licencia explícita, todo es "all rights reserved" por default — terceros no pueden republicar legalmente.
- **Solución estándar:** dos decisiones independientes. (1) Código: privado (repo GitHub privado, sin archivo LICENSE) o público (MIT/Apache 2.0/AGPL). (2) Contenido: all rights reserved, CC BY-NC, o CC BY-SA. Reescribir `LICENSE.md` con la decisión final.
- **Cuándo conviene resolverlo:** antes del primer deploy público. Si el repo va a ser público y no hay licencia, está abierto a interpretación.

### 3. Páginas de Compañía y Legal sin implementar

- **Categoría:** Página declarada / 404
- **Afectados:** links del Footer (`/quienes-somos`, `/manual-de-estilo`, `/equipo`, `/contacto`, `/anunciar`, `/terminos`, `/privacidad`, `/cookies`, `/etica`, `/correcciones`).
- **Descripción del problema actual:** los paths están listados en [Footer.astro](src/components/Footer.astro) pero ninguna ruta existe. Click en cualquiera devuelve 404.
- **Por qué no se resolvió ahora:** son páginas con contenido editorial/legal que no puede inventar el dev (política de privacidad real necesita revisión legal; "Quiénes somos" es texto de la organización; código de ética es decisión del comité editorial).
- **Qué pasa si NO se resuelve:** un lector que clickea `/quienes-somos` esperando info del medio aterriza en un 404. Pega muy mal a la confianza editorial. Para legal específicamente (privacidad, cookies, términos), tener links rotos puede ser problema regulatorio según jurisdicción.
- **Solución estándar:** dos opciones. (a) **Recomendada:** crear singleton `staticPage` en Sanity con campos `slug`, `titulo`, `contenido` (Portable Text), y una ruta `src/pages/[slug].astro` que renderice cualquiera. El equipo edita desde el studio. (b) Páginas Astro hardcoded en `src/pages/quienes-somos.astro` etc. (más simple para empezar pero no se actualizan sin re-deploy).
- **Cuándo conviene resolverlo:** antes del primer deploy público para **Compañía + Legal** (mínimo viable: contenido placeholder editado por el equipo). Las páginas de Especiales/Multimedia pueden esperar a que existan los formatos editoriales.

### 4. Newsletter sin form ni endpoint backend

- **Categoría:** Endpoint faltante / promesa editorial sin acción
- **Archivo:** [src/components/Footer.astro](src/components/Footer.astro) — bloque `<div id="newsletter">`
- **Descripción del problema actual:** el bloque Newsletter del footer hoy es solo texto editorial (eyebrow "Newsletter diario" + headline "La Argentina del día, en tu casilla a las 7 AM" + descripción). NO hay `<form>` ni endpoint `/api/newsletter`. La promesa visual ("en tu casilla a las 7 AM") existe sin acción asociada.
- **Por qué no se resolvió ahora:** no se eligió aún proveedor de newsletter (Mailchimp, Beehiiv, Substack, ConvertKit, Buttondown, Resend con DB propia, etc.). Cada uno tiene API distinta. Decisión: mejor mostrar copy editorial sin form que mostrar form que devuelve 404.
- **Qué pasa si NO se resuelve:** el lector lee la promesa pero no encuentra cómo suscribirse. Si pasa demasiado tiempo así, transmite "sitio abandonado" o "feature en construcción".
- **Solución estándar:** elegir proveedor → sumar `<form action="..." method="post">` en el bloque marcado con el TODO Pre-launch en `Footer.astro`. Para la mayoría de proveedores: form con submit directo a su URL (cero código backend). Si querés más control (validación server-side, anti-spam, double opt-in custom): endpoint Astro con `output: 'server'` para `/api/newsletter` que hace POST a la API del proveedor con su token como secret. Si la decisión se posterga más allá del launch, considerar reescribir el copy del headline para no prometer un canal que no existe.
- **Cuándo conviene resolverlo:** antes del primer deploy público o pocas semanas después. Tener newsletter rota ANTES de tener tráfico es mejor que tener newsletter rota DESPUÉS.

### 5. `og-default.png` y `logo-publisher.png` son arte placeholder

- **Categoría:** Asset / branding
- **Archivos:** [public/og-default.svg](public/og-default.svg), [public/logo-publisher.svg](public/logo-publisher.svg) (fuentes), regenerados con `npm run og:generate` a `.png`.
- **Descripción del problema actual:** los SVG fuente son funcionales (Fraunces 100px, paleta de marca, divider celeste) pero hechos a mano por el dev como placeholder. No son arte definitivo de un diseñador. Adicional: el PNG actual cae al fallback (Georgia/serif) porque ni Spectral ni Fraunces están instaladas en el environment de `og:generate` ni embebidas en el SVG vía `@font-face`. El rediseño profesional debe entregar el PNG ya renderizado, o el SVG con la fuente embebida (woff2 base64), para que el render sea reproducible.
- **Por qué no se resolvió ahora:** arte definitivo requiere brief de identidad visual al estudio o diseñador, decisión que va más allá del dev.
- **Qué pasa si NO se resuelve:** los previews sociales (WhatsApp, Twitter, FB, LinkedIn) y el publisher logo en JSON-LD muestran el placeholder. El sitio se ve "indie" en vez de "marca consolidada".
- **Solución estándar:** contratar diseño profesional. Recibir PNG 1200×630 (og default) y 600×60 con fondo transparente o `#0A0A0A` (logo publisher). Reemplazar `public/og-default.png` y `public/logo-publisher.png` directamente. No tocar código.
- **Cuándo conviene resolverlo:** antes del primer deploy público con presupuesto real, o en un sprint de polish post-launch (semanas 2-4).

---

## Resolver pronto post-launch

### 6. Backup automation de Sanity

- **Categoría:** Tooling / safety net
- **Descripción del problema actual:** no hay GitHub Action (ni equivalente) corriendo backups semanales del dataset Sanity. Si el dataset se corrompe, alguien borra docs por accidente, o Sanity tiene un incidente, no hay restore.
- **Por qué no se resolvió ahora:** requiere credenciales de almacenamiento offsite (S3, Cloudflare R2, Backblaze, etc.) que el dueño elige y costea.
- **Qué pasa si NO se resuelve:** la primera vez que algo se rompa, perdés contenido editorial real. Es desastre evitable.
- **Solución estándar:** ya documentada en [MAINTENANCE.md](MAINTENANCE.md) sección "Backup de Sanity" — workflow YAML completo, lista de secrets necesarios. Solo hay que decidir el storage offsite, crear las credenciales, pegar los secrets en GitHub.
- **Cuándo conviene resolverlo:** antes de que el contenido en Sanity supere ~50 docs. El "valor en riesgo" cruza umbral cuando representa varios días de trabajo del equipo editorial.

### 7. Sin error monitoring

- **Categoría:** Tooling / observabilidad
- **Descripción del problema actual:** bugs client-side son invisibles para el admin. El sitio es estático así que no hay errores de servidor, pero JavaScript del buscador, fallas de share/copy link, o imágenes que no carguen pasan en silencio.
- **Por qué no se resolvió ahora:** Sentry suma vendor + costo + complejidad. Para un sitio recién deployado, prioridad baja.
- **Qué pasa si NO se resuelve:** bugs llegan por email del lector ("no me funciona el botón de compartir") o nunca llegan. Time-to-detection alto, time-to-fix más alto todavía.
- **Solución estándar:** integrar `@sentry/astro` siguiendo la integration guide oficial. Plan free 5.000 events/mes alcanza para sitios chicos/medianos.
- **Cuándo conviene resolverlo:** primera vez que aparezca un bug reproducido por usuario que no podés repro local. O cuando el tráfico justifique entender qué browsers/devices son los usuarios reales.

### 8. `mostReadOrder` ordena por fecha, no por views reales

- **Categoría:** Algoritmo / UX
- **Archivo:** [src/data/content.ts](src/data/content.ts) función `getMostRead()`.
- **Descripción del problema actual:** `getMostRead()` devuelve los primeros 5 articulos del array ordenado por `fechaPublicacion desc`. La sección "Lo más leído" de la home muestra recencia, no popularidad real.
- **Por qué no se resolvió ahora:** view counts requieren analytics activadas + un mecanismo para llevar esos counts hasta el GROQ (campo en Sanity actualizado por cron, o API on-demand). Decisión que depende del proveedor de analytics.
- **Qué pasa si NO se resuelve:** la sección es engañosa al lector ("¿esta es la más leída? acaba de salir"). Pierde el valor periodístico de "lo más leído como señal de qué importa".
- **Solución estándar:** dos opciones. (a) **Sin backend nuevo:** sumar campo `ordenMasLeidas: number` en el schema `article` de Sanity, editado a mano por la jefatura editorial cada mañana. Workflow más manual pero cero infraestructura. (b) **Automatizado:** sumar campo `viewsCount: number` en el schema, alimentado por cron (GitHub Action o CF Worker) que pulla counts de Plausible/Cloudflare Web Analytics/GA4 API y escribe back a Sanity vía mutation.
- **Cuándo conviene resolverlo:** cuando haya ≥100 notas (antes el ranking no es estadísticamente significativo) Y analytics activadas (sin datos no hay nada que ordenar). Si las dos condiciones se dan en distintos momentos, esperar a la segunda.

### 9. Preview de contenido programado para editores

- **Categoría:** Editorial workflow
- **Descripción del problema actual:** una nota con `fechaPublicacion` futura queda invisible en el sitio público hasta el build posterior a esa fecha (comportamiento correcto y deseado). Pero el editor NO tiene forma de ver cómo se va a renderizar la nota antes de que sea pública.
- **Por qué no se resolvió ahora:** implementar preview requiere ruta SSR (`output: 'server'`) selectiva, token de Sanity con permisos de lectura de drafts/futuros, y autenticación para no exponer drafts a cualquiera con la URL.
- **Qué pasa si NO se resuelve:** workflow incómodo: el editor publica con fecha "ahora" para ver, anota mentalmente cómo se ve, edita la fecha al futuro. Propenso a olvidos ("¿la dejé con fecha de hoy o futura?").
- **Solución estándar:** ruta `src/pages/preview/[id].astro` con `export const prerender = false` (Astro permite SSR selectivo dentro de un proyecto static). Lee la nota por `_id` con `SANITY_TOKEN` (que sí ve drafts y futuras). Proteger con un PIN compartido (header check) o un JWT corto generado desde el studio. Adapter Cloudflare ya está instalado, soporta esa ruta SSR.
- **Cuándo conviene resolverlo:** cuando el equipo editorial crezca a 3+ y los workflows de embargos (notas con fecha programada) se vuelvan rutina.

---

## Resolver cuando el sitio escale

### 10. `PortableTextRenderer` solo cubre bloques básicos

- **Categoría:** Renderer / contenido
- **Archivo:** [src/components/PortableTextRenderer.astro:2](src/components/PortableTextRenderer.astro#L2)
- **Descripción del problema actual:** el renderer maneja `block`, `image`, `quote`, `tweet` con texto plano. NO soporta marks anidadas (negrita + link + itálica), links inline, bloques custom de Sanity (callout, video embed, gallery, etc.), ni serializers personalizados.
- **Por qué no se resolvió ahora:** las samples no tienen marks complejas; el editor de Sanity todavía no se usó en serio así que los block types reales que el equipo va a querer no están definidos.
- **Qué pasa si NO se resuelve:** cuando un editor escriba contenido con `**negrita** con [link](url)` o use bloques custom (que se irán definiendo con el uso), el rendering puede ignorar marks o romper el layout silenciosamente.
- **Solución estándar:** migrar a `@portabletext/to-html` (ya instalada como dep, sin cambios en `package.json`). Mantener los serializers actuales para image/quote/tweet equivalentes; sumar serializers nuevos para los block types custom que aparezcan. Ver docs en [github.com/portabletext/to-html](https://github.com/portabletext/to-html).
- **Cuándo conviene resolverlo:** primer reporte de un editor "el formato de mi nota no se ve bien", o cuando lleguen los primeros 10-20 notas reales en Sanity.

### 11. Búsqueda client-side no escala más allá de ~500 notas

- **Categoría:** Performance / arquitectura
- **Archivo:** [src/pages/buscar.astro](src/pages/buscar.astro)
- **Descripción del problema actual:** la página `/buscar` embebe TODAS las notas como JSON en el HTML (`<script type="application/json">`) y filtra en JS al tipear. Funciona muy bien hasta ~500 notas; después el HTML pesa MB y la primera carga se vuelve lenta.
- **Por qué no se resolvió ahora:** con 10 notas de samples el JSON inline pesa <50KB. Cualquier solución más sofisticada es overkill para ese volumen.
- **Qué pasa si NO se resuelve:** a partir de 500-1.000 notas, `/buscar/index.html` pesa 1-3MB → carga lenta → menos uso del buscador → menos engagement.
- **Solución estándar:** dos opciones. (a) **Algolia o Meilisearch hosted:** índice generado al build vía sus CLI/SDKs, cliente JS hace queries al endpoint del proveedor. Más rápido y rico (typo tolerance, sinónimos), pero suma vendor. (b) **Endpoint /api/search en Astro** con `output: 'server'` selectivo, hace GROQ on-demand. Más simple, sin proveedor extra, pero requiere migrar la ruta a SSR.
- **Cuándo conviene resolverlo:** chequear el peso de `dist/buscar/index.html` en cada build. Cuando supere 500KB, planear migración. Estimación: ~250-400 notas dependiendo del largo de copetes.

### 12. Sin tests automatizados

- **Categoría:** Quality / tooling
- **Descripción del problema actual:** no hay unit tests, integration tests, ni E2E. La validación del proyecto es solo `astro check` (typecheck) + `npm run build` (no rompe en build).
- **Por qué no se resolvió ahora:** para un proyecto en fase de boilerplate, los tests son overhead. La build-as-test ya catchea lo más obvio (broken imports, type errors, compilation errors).
- **Qué pasa si NO se resuelve:** regresiones visuales o de lógica se descubren en producción o en review manual de PR. Refactors grandes son arriesgados sin red.
- **Solución estándar:** empezar con lo más alto-valor primero. (a) **Playwright para 2-3 E2E críticos:** home renderiza con cover, una nota carga sin error, /buscar filtra correctamente. (b) **Vitest para unidades en `src/lib/seo.ts`:** `truncate()`, `ogImageUrl()`, builders de JSON-LD. Estas funciones son puras, fáciles de testear, alto retorno.
- **Cuándo conviene resolverlo:** primer bug post-deploy que un test obvio hubiera evitado. O cuando el equipo crezca y "yo me acuerdo de lo que toqué" deja de ser estrategia válida.

### 13. Scripts de migración deben preservar campos editoriales post-migración

- **Categoría:** Pipeline / safety
- **Archivos:** [scripts/migrate-real-to-sanity.mjs](scripts/migrate-real-to-sanity.mjs) (corregido en commit `a342973`), [scripts/migrate-samples-to-sanity.mjs](scripts/migrate-samples-to-sanity.mjs) (pendiente).
- **Descripción del problema actual:** los scripts de migración usaban `client.createOrReplace(doc)` con un `doc` armado desde el source (`real-articles.ts` / `sample-articles.ts`) que omite `imagenPrincipal` a propósito (las imágenes se suben aparte vía `upload-unsplash-images.mjs` o manualmente desde el studio). Re-correr el migrate después de subir imágenes BORRABA esas imágenes — `createOrReplace` reemplaza el doc completo. Mismo riesgo con `esCoverDelDia`, `esDestacada`, `ai_generated`, `hotspot` y cualquier campo editor-authoritative que viva solo en Sanity.
- **Por qué no se detectó cuando se escribió el script:** la primera corrida fue trivial (`createOrReplace` contra dataset vacío). El bug solo se manifiesta en la segunda corrida y siguientes, cuando ya hay campos editoriales agregados que el source no conoce. Salió a la luz cuando hubo que re-correr el script para propagar tags editoriales nuevos a Sanity y se perdieron las 30 imágenes recién subidas.
- **Qué pasa si NO se resuelve:** cada cambio al source (sumar tags, corregir typo, ajustar copete) → re-corrida → re-borrado de imágenes y campos editoriales. Imposible iterar sobre el contenido sin perder trabajo de la redacción.
- **Solución aplicada en migrate-real-to-sanity.mjs (commit `a342973`):** antes del write, fetchear `*[_id == $id][0]._id` para saber si el doc existe.
  - Si existe: `client.patch(_id).set({...sourceFields}).commit()` — actualiza solo los campos pasados, preserva todo lo demás.
  - Si no existe: `createOrReplace` con defaults (caso first-import).
  - Clasificación de campos: **source-authoritative** (`titulo`, `copete`, `contenido`, `autor`, `categoria`, `tags`, `fechaPublicacion`, `tiempoLectura`, `kicker`) se sobrescriben siempre. **Editor-authoritative** (`imagenPrincipal`, `esCoverDelDia`, `esDestacada`, `ai_generated`, hotspot, y `fechaActualizacion` cuando el source no la define) se omiten del patch y Sanity los preserva.
- **Pendiente para `migrate-samples-to-sanity.mjs`:** mismo refactor cuando ese script se vuelva a usar. Hoy crea drafts (`drafts.<slug>`) con `fetch + delete + createIfNotExists`, que tampoco preserva campos editoriales sumados al draft (poco probable en samples, pero la regla aplica).
- **Cuándo conviene resolverlo:** el caso crítico (`real-articles`) ya está. Para `samples`, cuando se planee iterar sobre `sample-articles.ts` como source con re-corridas y haya algo en los drafts que valga preservar.

---

## Cómo usar este documento

Cada vez que se cierra un sprint o se hace un retro, mirar este archivo:

- ¿Algún item bloqueante (1-5) sigue pendiente y se acerca el deploy? Priorizarlo.
- ¿Algún item alta (6-9) se está volviendo bloqueante (ej: el contenido cruzó las 50 notas y todavía no hay backup)? Promoverlo.
- ¿Algún item se resolvió? Borrarlo o moverlo a un changelog separado (mantener el doc corto).
- ¿Apareció deuda nueva? Sumarla con la misma estructura de 5 puntos. Items sin trigger concreto se vuelven ruido.

Para items resueltos durante mantenimiento normal: no hace falta borrarlos del git history; solo del archivo. El historial vive en `git log -- TECH_DEBT.md`.
