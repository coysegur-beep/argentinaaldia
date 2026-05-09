# Deploy guide — Cloudflare Pages

Paso a paso para deployar el sitio público a Cloudflare Pages. Asume que ya hay un repo en GitHub con el código y una cuenta gratuita en Cloudflare.

El sitio se buildea estático (`output: 'static'`) y se sirve directo desde el edge de Cloudflare, sin Worker invocándose en cada request. Eso da TTFB bajo y costos cercanos a cero. La parte dinámica (re-fetchear de Sanity para que `sitemap-news.xml` quede fresco) se resuelve con un cron de rebuild — cubierto en MAINTENANCE.md / paso D.

---

## Antes de empezar

- **Cuenta gratis de Cloudflare**: [dash.cloudflare.com](https://dash.cloudflare.com).
- **Repo del proyecto en GitHub** con la rama `main` lista para producción.
- **Credenciales de Sanity** anotadas (las del `.env` que NO commiteaste — `SANITY_PROJECT_ID`, `SANITY_TOKEN`, etc.).
- **(Opcional, pero recomendado) Dominio comprado**: `argentinaaldia.com` o el que sea final. Sin dominio, el sitio queda en `<project>.pages.dev`, que sirve para ver que todo funciona pero no es público-friendly.

---

## Paso 1 — Conectar el repo a Cloudflare Pages

1. Entrar a [dash.cloudflare.com](https://dash.cloudflare.com) y loguearse.
2. En el menú lateral izquierdo, click en **Workers & Pages**.
3. En la página que se abre, click en el botón azul **Create application** (esquina superior derecha).
4. En las dos pestañas que aparecen arriba, elegir **Pages** (no "Workers").
5. Click en **Connect to Git**.
6. Cloudflare te pide autorización para acceder a tu cuenta de GitHub. Click **Connect GitHub account** → autorizar en GitHub el acceso a la organización/repos que quieras exponer. Tip: en GitHub, conviene autorizar solo los repos específicos del proyecto, no toda la cuenta.
7. De vuelta en CF, ahora ves la lista de tus repos. Buscá `argentina-al-dia` (o como se llame el repo) y click **Begin setup**.

En este punto la pantalla muestra un formulario de configuración de build. Pasá al **Paso 2**.

---

## Paso 2 — Configurar el build

En el formulario que se abrió:

| Campo | Valor |
|---|---|
| **Project name** | `argentina-al-dia` (lo que sea — define el subdominio temporal `<name>.pages.dev`) |
| **Production branch** | `main` |
| **Framework preset** | `Astro` (lo detecta automáticamente; si no, elegir de la lista) |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | `/` (vacío — es la raíz del repo) |

**Importante:** abrí el desplegable **Environment variables (advanced)** en la misma pantalla. Vamos a setear las 5 del proyecto antes de hacer el primer deploy. Pasá al **Paso 3** sin clickear "Save and Deploy" todavía.

---

## Paso 3 — Variables de entorno

Cloudflare distingue dos tipos:

- **Plaintext**: el valor se ve en el dashboard después de pegado. Para vars no sensibles.
- **Secret (Encrypt)**: el valor queda encriptado y NO se muestra en el dashboard después de guardarlo (solo podés sobreescribirlo). Para tokens y claves.

Setear las 5 variables del proyecto:

| Variable | Tipo | Valor | Notas |
|---|---|---|---|
| `SANITY_PROJECT_ID` | Plaintext | tu project id real | Visible en el browser igual (queda en el client de Sanity), no es secreto. |
| `SANITY_DATASET` | Plaintext | `production` | |
| `SANITY_API_VERSION` | Plaintext | `2024-03-15` | |
| `SANITY_TOKEN` | **Secret** | tu token de lectura | **Marcalo como Secret.** Es la credencial de acceso al CMS — si se filtra, alguien puede leer drafts y hacer otras cosas que el rol del token permita. |
| `PUBLIC_SITE_URL` | Plaintext | `https://argentinaaldia.com` | El dominio final. Si todavía no tenés dominio, dejá `https://<project>.pages.dev` y cambialo cuando configures el custom domain (paso 4). |

**Plus, una variable que NO es del proyecto pero CF necesita:**

| Variable | Tipo | Valor | Por qué |
|---|---|---|---|
| `NODE_VERSION` | Plaintext | `20` | Cloudflare buildea con Node 18 por defecto. El proyecto requiere 20 LTS. Sin esta var, el build puede romperse en deps que requieren Node 20+. |

Para pegar cada una: click **Add variable** → poner Name y Value → marcar la checkbox "Encrypt" si es Secret → repetir.

Una vez las 6 están cargadas, click **Save and Deploy** (botón azul abajo).

CF arranca el primer build. Toma 30-90 segundos. Vas a ver el log en vivo:
- "Cloning repository…"
- "Installing dependencies…" (el `npm install`)
- "Running build…" (el `npm run build`)
- "Uploading assets…"
- "Success! Uploaded N files"
- "Deployment complete"

Si algo falla acá, scrolleá el log y buscá la línea que dice `error:` o `[ERROR]`. Las causas más comunes están en **Troubleshooting** al final.

Cuando el deploy termina, tu sitio está en `https://<project>.pages.dev`. Abrir esa URL para verificar que renderiza.

---

## Paso 4 — Custom domain

Asumiendo que ya tenés `argentinaaldia.com` comprado en algún registrador (NIC.ar, Cloudflare Registrar, Namecheap, GoDaddy, etc.).

### Opción A — Tu dominio ya está en Cloudflare DNS (recomendado)

1. En el dashboard del proyecto Pages, ir a **Custom domains** (pestaña arriba).
2. Click **Set up a custom domain**.
3. Escribir `argentinaaldia.com` → **Continue**.
4. CF te dice "We'll add a CNAME automatically" → **Activate domain**. Listo.
5. Repetir para `www.argentinaaldia.com` con la opción **Redirect to apex** (manda `www` al root).

CF emite SSL automático en ~5 minutos via Universal SSL.

### Opción B — Tu dominio está en otro DNS (NIC.ar, Namecheap, etc.)

1. En el dashboard del proyecto Pages → **Custom domains** → **Set up a custom domain** → escribir `argentinaaldia.com`.
2. CF te muestra los registros DNS que tenés que crear en tu proveedor. Suele ser:
   - **CNAME** del root (`@`) o del subdominio → apuntando a `<project>.pages.dev`
   - O un registro **A** apuntando a las IPs de Cloudflare (las muestra el panel)
3. Ir al panel del registrador y cargar esos registros.
4. Volver a CF y click **Check DNS records**. Tarda entre 5 minutos y 48 horas en propagarse (típicamente <1 hora).
5. Una vez verificado, CF emite SSL.

### Después del custom domain

- Editar la variable `PUBLIC_SITE_URL` en CF (Paso 3) y poner `https://argentinaaldia.com` si todavía estaba apuntando al `pages.dev`.
- Re-deployar (click **Retry deployment** en el último deploy, o pushear cualquier commit a `main`).
- Confirmar que `https://argentinaaldia.com` ahora resuelve al sitio y todos los `<link rel="canonical">` apuntan al dominio real (no al `pages.dev`).

---

## Paso 5 — Verificación post-deploy

Checklist a correr después de cada deploy importante. Cualquier ítem rojo es bloqueante.

### URLs base

Abrir cada una en el browser y confirmar status 200 + contenido esperado:

| URL | Qué verificar |
|---|---|
| `https://argentinaaldia.com/` | Home renderiza con el cover, ticker, secciones, footer. |
| `https://argentinaaldia.com/politica` | Listado de categoría con notas. |
| `https://argentinaaldia.com/espectaculos` | Empty state diseñado (no 404). |
| Una nota cualquiera | Detail page con foto, byline, contenido, share, related. |
| `https://argentinaaldia.com/buscar` | Buscador, escribir una palabra y validar que filtre. |
| `https://argentinaaldia.com/no-existe-esta-ruta` | 404 personalizado, NO la pantalla genérica de Cloudflare. |

### Endpoints técnicos

| URL | Qué verificar |
|---|---|
| `https://argentinaaldia.com/robots.txt` | Header `Content-Type: text/plain`. Lista los User-agent de IA bloqueados. Las dos líneas finales `Sitemap:` apuntan al dominio real (no `pages.dev`). |
| `https://argentinaaldia.com/sitemap-index.xml` | XML válido, lista `sitemap-0.xml`. |
| `https://argentinaaldia.com/sitemap-news.xml` | XML válido, namespace `news` declarado, items con `<news:publication_date>` dentro de las últimas 48h. |
| Pegar la URL de `sitemap-news.xml` en [xml-sitemaps.com/validate-xml-sitemap.html](https://www.xml-sitemaps.com/validate-xml-sitemap.html) | Valida formato sitemap genérico Y schema de Google News (namespace, formato de fecha). Atrapa errores que opengraph.xyz y los validadores HTML no detectan — es lo que hace que Google rechace el sitemap silenciosamente. |
| `https://argentinaaldia.com/feed.xml` | RSS 2.0 válido. Pegar la URL en [feedvalidator.org](https://www.feedvalidator.org/) — debe pasar sin errores ni warnings. |

### SEO y previews sociales

| Herramienta | Qué pegar | Qué chequear |
|---|---|---|
| [search.google.com/test/rich-results](https://search.google.com/test/rich-results) | URL de cualquier nota | Detecta `NewsArticle` y `BreadcrumbList` sin errores. |
| [opengraph.xyz](https://www.opengraph.xyz/) | URL de cualquier nota | Preview muestra título, descripción, imagen 1200×630, atribución. NO debe verse imagen rota. |
| [cards-dev.twitter.com/validator](https://cards-dev.twitter.com/validator) (si está disponible) | URL de cualquier nota | Twitter card `summary_large_image` con imagen y atribución. |
| Compartir en WhatsApp consigo mismo | URL de cualquier nota | Preview con imagen, título, descripción. Si la imagen no aparece, hay problema con el OG image. |

### Performance

| Herramienta | URL | Threshold |
|---|---|---|
| [PageSpeed Insights](https://pagespeed.web.dev/) | Home + una nota | Performance ≥85, Accessibility ≥95, Best Practices ≥95, SEO ≥95. |
| Mobile a 375px | Chrome DevTools → Toggle device toolbar → iPhone SE | Sin scroll horizontal en ninguna ruta principal. |

---

## Rollback strategy

**Caso típico:** se mergeó un PR a `main`, CF buildeó y deployó automáticamente, y producción muestra un bug visible/regresión grave/contenido roto. Hay que volver al estado anterior YA, no esperar a que alguien arregle el commit.

Cloudflare Pages tiene rollback nativo en ~30 segundos sin rebuild.

### Pasos del rollback

1. Entrar al dashboard del proyecto en CF Pages.
2. Click en la pestaña **Deployments**.
3. La lista muestra todos los deploys, el de arriba es el activo (production). Buscar el deploy ANTERIOR estable — el penúltimo, o el último conocido como "bueno".
4. En la fila de ese deploy, click en el menú **⋯** (tres puntos a la derecha) → **Rollback to this deployment**.
5. CF te pide confirmación → **Confirm**.
6. En ~30 segundos, ese deploy vuelve a ser el activo. El deploy roto sigue listado en el historial pero deja de ser production.
7. Verificar abriendo la URL del sitio en una ventana incógnita (para evitar caché del browser).

**Lo que el rollback NO hace:** no revierte el commit en GitHub. Si pusheaste `bad-commit` y rolleas en CF, el código en `main` sigue teniendo `bad-commit`. El próximo push a `main` (con cualquier nuevo commit) va a deployar OTRA VEZ el código roto a menos que arregles el problema antes.

**Tampoco toca Sanity.** El rollback de Cloudflare Pages solo revierte el código del sitio. Si el problema vino de una nota mal cargada (imagen rota, contenido con HTML inválido, fecha en formato raro), la nota sigue rota en Sanity y el siguiente build automático la trae de vuelta — caés en el ciclo "rollback → cron rebuild → mismo problema". Antes de rollback, identificar de dónde vino el problema:

- **Origen en código** (PR mergeado, refactor, dep nueva): rollback CF + revertir el commit en GitHub + fix forward.
- **Origen en contenido** (una nota específica, una imagen, un campo mal llenado): NO rollback. Despublicar o corregir la nota en Sanity y esperar el próximo build. El rollback no soluciona nada acá.
- **Origen mixto** (un cambio de código que rompe ante contenido específico): rollback CF + arreglar el contenido en Sanity + fix forward del código + redeploy.

### Pasos siguientes después del rollback

1. **Avisarle al equipo** (Slack/email): "Producción rolled back al deploy X. El bug es Y. Estoy investigando."
2. **Crear branch** desde el commit anterior estable: `git checkout -b fix/issue-123 <hash-del-commit-bueno>`.
3. **Identificar y arreglar** el bug. Sumar test si aplica.
4. **PR + revisión + merge a main**.
5. CF deploya automáticamente la nueva versión. Verificar que el bug está resuelto.
6. **Si la nueva versión está OK**, confirmá. Si no, rollback otra vez (no es una sola bala — podés rollback varias veces).

### Cuándo NO usar rollback

- **Bug menor cosmético** (typo en el footer, color levemente off): mejor PR + fix forward. El rollback consume atención del equipo.
- **Bug que afecta solo a una ruta no crítica** (`/equipo` muestra placeholder pero `/` y las notas funcionan): igual, fix forward.
- **Bug en el contenido (no en el código)**: no es problema del deploy, sino del CMS. Despublicar la nota desde el studio y republicar corregida.

### Cuándo SÍ usar rollback

- Producción tira 500 / pantalla blanca.
- Las notas no cargan (regresión en el query GROQ).
- El header está roto y el sitio entero se ve mal.
- Se filtró info sensible accidentalmente (variable de entorno expuesta, etc.).
- Cualquier cosa donde la duración del problema en producción tiene mayor costo que la disrupción del rollback.

---

## Troubleshooting común

### Build falla en CF pero pasa en local

- **Causa #1:** Node version distinta. CF usa Node 18 por default. Setear `NODE_VERSION=20` en env vars (ver Paso 3).
- **Causa #2:** dependencia que el lockfile no contempla. Hacer `rm -rf node_modules package-lock.json && npm install` local, commitear el lockfile actualizado, push.
- **Causa #3:** secret faltante. Si el build dice `Cannot read property of undefined` en algún `import.meta.env.VAR`, falta esa variable en el dashboard de CF.

### `[content] Sanity unreachable, using samples` en producción

- El `SANITY_TOKEN` está mal copiado (con espacios al inicio/final) o vencido. Regenerar en Sanity → reemplazar en CF dashboard → re-deploy.
- `SANITY_PROJECT_ID` con typo. Verificar en sanity.io contra lo cargado en CF.

### El sitio funciona en `<project>.pages.dev` pero el custom domain tira 404 / Connection error

- DNS no propagó todavía. Esperar hasta 48h. Verificar con `dig argentinaaldia.com` o [dnschecker.org](https://dnschecker.org).
- El SSL no se emitió. En CF Pages → Custom domains, ver el status del dominio. Si dice "Pending verification" hace más de 1 hora, contactar soporte de CF.

### `og:image` no aparece en preview de WhatsApp/Facebook

- El PNG de OG no se subió: correr `npm run og:generate` local, commitear, push, re-deploy.
- La URL del og:image es relativa y no absoluta: chequear que `PUBLIC_SITE_URL` esté seteado en CF.
- WhatsApp cachea previews por 24h. Para forzar refresh: usar [opengraph.xyz](https://www.opengraph.xyz/) primero, después esperar.

### `/feed.xml` o `/sitemap-news.xml` devuelven 404

- Verificar que el archivo `src/pages/feed.xml.ts` (o `sitemap-news.xml.ts`) esté en el commit. `git log --all --full-history -- "src/pages/feed.xml.ts"`.
- En el log de build de CF, buscar la línea `▶ src/pages/feed.xml.ts → /feed.xml`. Si no aparece, el endpoint no se generó.

### Deploy automático no se gatilla con push a main

- CF perdió el webhook de GitHub. Reconectar: Project → Settings → Builds & deployments → Reauthorize.
- El branch en CF está mal configurado. Confirmar Production branch = `main` en Settings.

---

## Próximos pasos después del primer deploy

- Configurar el cron de rebuild para que `sitemap-news.xml` quede fresco (ver `MAINTENANCE.md` cuando esté listo, o paso D de Fase 6).
- Cargar contenido inicial en Sanity Studio siguiendo la guía editorial (`studio/README.md`).
- Sumar al equipo editorial al studio (admin invita por email desde sanity.io).
- (Opcional) Conectar Cloudflare Web Analytics (gratis, sin cookies) en el proyecto Pages → Settings → Add Web Analytics.
