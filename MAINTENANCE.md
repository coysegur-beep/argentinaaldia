# Mantenimiento

Operaciones recurrentes para mantener el sitio sano en producción. Pensado para el admin técnico — el equipo editorial no necesita tocar nada de esto.

---

## Updates de dependencias

### Cadencia general

- **Patches** (X.Y.z → X.Y.z+1): aplicar cuando aparezcan, sin pensar. Suelen ser bugfixes y patches de seguridad.
- **Minors** (X.y → X.y+1): leer changelog primero. Astro y Sanity tienen changelogs útiles que listan breaking changes. Aplicar batch trimestral con regression test (build + visual smoke test).
- **Majors** (x → x+1): planificar como tarea separada con su PR dedicado. Usualmente requiere codemod o cambios manuales.

Comandos útiles:

```bash
npm outdated                    # ver qué deps tienen update disponible
npm update <paquete>            # update sin cambiar major
npm install <paquete>@latest    # forzar última (incluye majors)
```

### Astro

- Patches y minors: `npx @astrojs/upgrade` corre el codemod oficial si hace falta.
- Majors (5 → 6): leer la migration guide en docs.astro.build. Probar localmente con `npm run dev`, después `npm run build`, después `npx astro check`. Verificar visualmente la home + un detail page + categoria + autor.
- Adaptador `@astrojs/cloudflare`: actualizar junto con Astro core (suelen ir sincronizados).
- Atención particular: cualquier cambio en cómo Astro maneja `output: 'static'` o `getStaticPaths`. Esos son la columna vertebral del sitio.

### Sanity

- `@sanity/client` v6 es estable y rara vez tiene majors. Patches y minors safe.
- `@portabletext/to-html` (en deps del sitio): patches safe; minors revisar serializers custom si los hubiera.
- Studio (en `studio/package.json`, `sanity` v3): updates propios del studio standalone, NO afectan al sitio público. Aplicar con cadencia mensual.

### Tailwind

- v3 patches y minors: safe.
- v3 → v4: migración mayor (CSS-first config). Posponer hasta que haya razón fuerte (deprecación de v3, feature crítico solo en v4). Cuando se haga, reescribir `tailwind.config.mjs` como CSS-first y validar el build.

### Otras

- `typescript`: minors safe siempre que `npx astro check` pase. Cuidar regresiones en strict mode.
- `@astrojs/sitemap`: bajo riesgo, updates seguros.
- `sharp` (transitive): viene como dep de Astro; se actualiza solo. No declarar como dep directa.

---

## Backup de Sanity

### Por qué importa

El contenido editorial vive 100% en Sanity. Si el dataset se corrompe, alguien borra todo por accidente, o Sanity tiene un incidente crítico, el sitio sigue funcionando con samples (gracias al fallback) pero el contenido real desaparece. **El código está versionado en GitHub; el contenido NO está versionado en ningún lado por defecto.**

### Setup automatizado (semanal recomendado)

Sanity ofrece export oficial via CLI:

```bash
sanity dataset export production backup-2026-05-06.tar.gz
```

Genera un `.tar.gz` con todos los documentos + assets (imágenes). Tamaño típico para un diario activo: 100-500 MB después de varios meses.

**Automatización con GitHub Action (semanal, sube a S3):**

```yaml
# .github/workflows/sanity-backup.yml
name: Sanity backup

on:
  schedule:
    - cron: '0 4 * * 0'   # domingos 4 AM UTC = 1 AM ART
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          sparse-checkout: studio
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - name: Install Sanity CLI
        run: npm install -g sanity@latest
      - name: Export dataset
        env:
          SANITY_AUTH_TOKEN: ${{ secrets.SANITY_BACKUP_TOKEN }}
        run: |
          cd studio
          DATE=$(date +%Y-%m-%d)
          sanity dataset export production "backup-$DATE.tar.gz" \
            --project=${{ secrets.SANITY_PROJECT_ID }}
      - name: Upload to S3 (or alternative storage)
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          aws s3 cp studio/backup-*.tar.gz s3://argentinaaldia-backups/sanity/
```

**Secrets necesarios** en GitHub repo settings:
- `SANITY_BACKUP_TOKEN`: token de Sanity con permisos `read` (crear en sanity.io → API → Tokens).
- `SANITY_PROJECT_ID`: el mismo del `.env`.
- `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY`: si usás S3. Si usás otro storage (Cloudflare R2, Backblaze, GCS), reemplazar el step por el equivalente.

**Retención sugerida:** 12 backups semanales rotando (~3 meses). Para uno mayor (anual, archive), agregar un step que el primer domingo de cada mes copie a una bucket separada de "archive".

### Restauración

Si todo se rompe y necesitás restaurar:

```bash
sanity dataset import backup-2026-05-06.tar.gz production --replace
```

`--replace` borra el dataset actual y restaura del backup. **Doble check antes de correr esto en producción.** Idealmente probarlo primero en un dataset de staging.

---

## Monitoreo

### Uptime básico (recomendado, gratis)

Setup mínimo para enterarse si el sitio se cae:

- [UptimeRobot](https://uptimerobot.com/) free: 50 monitors, ping cada 5 minutos, alerta por email/Slack/Discord si hay downtime.
- Setup: crear monitors para:
  - `https://argentinaaldia.com/` (home)
  - `https://argentinaaldia.com/feed.xml` (RSS, valida que el endpoint funciona)
  - `https://argentinaaldia.com/sitemap-news.xml` (sitemap, valida endpoint)

Alternativas equivalentes: [Better Uptime](https://betterstack.com/uptime), [Cronitor](https://cronitor.io/), Cloudflare Health Checks (incluido en plan paid).

### Errores client-side (recomendado a futuro: Sentry)

El sitio es estático — no hay errores de servidor. Los errores que pueden aparecer son:

- JavaScript del buscador (`/buscar`) que falle ante un input raro.
- Botón "Copiar link" que falle si `navigator.clipboard` no está disponible (browsers viejos).
- Imágenes que no carguen (CDN de Sanity caído).

Para capturar esos errores en producción, [Sentry](https://sentry.io) es el estándar:

- Plan free: 5.000 events/mes, 1 user. Suficiente para un sitio chico/mediano.
- Setup: agregar `@sentry/astro` siguiendo la integration guide oficial.

**No implementado todavía.** Para un sitio recién deployado, prioridad baja. Sumar cuando:
- Hay reportes de bugs que no podés reproducir local.
- El tráfico justifica saber qué browsers/devices son los usuarios.
- Hay tiempo del equipo para revisar Sentry weekly.

### Logs nativos (revisar manualmente cuando algo falla)

Sin tooling adicional, los siguientes logs están disponibles:

| Logs | Dónde | Para qué |
|---|---|---|
| Builds de CF Pages | CF dashboard → Pages → tu proyecto → Deployments → click un deploy | Diagnosticar builds fallidos, ver qué cambió desde el deploy anterior |
| Cron Worker | CF dashboard → Workers → cron-rebuild → Logs | Verificar que el cron disparó y obtuvo 200 del Deploy Hook |
| Webhook Sanity | sanity.io/manage → tu proyecto → API → Webhooks → tu webhook → Attempts | Ver cada disparo del webhook, status code de respuesta, payload |
| Tráfico (si activás Web Analytics) | CF dashboard → Web Analytics | Pageviews, países, referrers — sin cookies, gratis |

---

## Checklist semestral

Cada 6 meses (mayo y noviembre, por ejemplo), correr esta checklist en una sentada de 30-60 minutos. Lleva tiempo pero atrapa el rot acumulado.

### Contenido

- [ ] Crawl del sitio buscando links rotos. Herramientas: [Screaming Frog free](https://www.screamingfrog.co.uk/seo-spider/) (hasta 500 URLs) o `lychee` CLI. Reportar al equipo editorial los links externos rotos en notas viejas.
- [ ] Imágenes de notas viejas siguen cargando del CDN de Sanity. Si alguna 404, restaurar del backup o reemplazar.
- [ ] Páginas de autor de gente que ya no escribe en el medio: ¿se mantienen, se redirigen, se anonimizan? Decisión editorial-legal.

### Performance

- [ ] [PageSpeed Insights](https://pagespeed.web.dev/) sobre la home + 1 nota: Performance ≥85, Accessibility ≥95, Best Practices ≥95, SEO ≥95.
- [ ] Mobile a 375px sin scroll horizontal en home, listado de categoría, detail page, autor, buscar, 404.
- [ ] Fonts cargan: confirmar que Spectral e Inter aparecen (DevTools → Network → filter "font"). Si fallback al sistema, hay algo roto en el `<link>` de Google Fonts.

### SEO

- [ ] Lista de bots de IA en `robots.txt` actualizada. Cada 3-6 meses aparecen crawlers nuevos. Fuentes vivas para cross-checkear:
  - [darkvisitors.com](https://darkvisitors.com/) — directorio actualizado de AI scrapers con los strings exactos del User-agent para pegar en robots.txt.
  - [github.com/ai-robots-txt/ai.robots.txt](https://github.com/ai-robots-txt/ai.robots.txt) — repo open source con un robots.txt completo que crece a medida que aparecen bots nuevos.
  
  Sumar los nuevos al array `aiBots` en `src/pages/robots.txt.ts` y push a producción.
- [ ] JSON-LD validado con [Rich Results Test](https://search.google.com/test/rich-results) sobre 1 nota cualquiera. Sin errores ni warnings.
- [ ] `sitemap-news.xml` validado con [xml-sitemaps.com](https://www.xml-sitemaps.com/validate-xml-sitemap.html). Sin errores de namespace o formato de fecha.
- [ ] Google Search Console (si está conectado): revisar errores de cobertura, URLs excluidas, problemas mobile usability.

### Infraestructura

- [ ] Cert SSL del custom domain no vence en <30 días. CF lo renueva automáticamente, pero verificar.
- [ ] Backup de Sanity más reciente: tiene <8 días. Si el cron de backup falló silenciosamente, detectarlo acá.
- [ ] Logs del cron Worker sin errores acumulados (CF dashboard → Workers → Logs).
- [ ] Logs del webhook Sanity con tasa de éxito >99% en últimos 30 días.
- [ ] CF Pages: builds totales del último mes. Si está cerca o sobre 500, evaluar paid plan o ajustar cadencia del cron (ver `REBUILD.md`).

### Dependencias

- [ ] `npm outdated` en raíz: revisar cada paquete. Aplicar patches (sin pensar) y minors (con changelog). Anotar majors pendientes.
- [ ] `cd studio && npm outdated`: mismo proceso para el studio.
- [ ] Verificar que `node --version` instalado matchea o supera `NODE_VERSION` configurado en CF Pages.
- [ ] `npm audit`: si aparecen vulnerabilidades críticas o altas, evaluar fix. Las moderadas/bajas en deps transitive de tooling de dev pueden esperar.

### Documentación

- [ ] `README.md` raíz: tabla de env vars sigue reflejando lo real.
- [ ] `studio/README.md`: las 9 categorías + colorAccent listados siguen matcheando `tailwind.config.mjs` y `src/data/sample-categories.ts`.
- [ ] `DEPLOY.md`: el listado de troubleshooting sigue cubriendo los problemas que vimos en producción. Sumar nuevos casos vistos.
- [ ] `TECH_DEBT.md`: revisar qué items se resolvieron, qué se sumó, qué se postergó.

---

## Cuándo escalar el setup

Señales de que el sistema actual se está quedando chico:

| Señal | Acción |
|---|---|
| >1.000 builds/mes en CF Pages consistente | Paid plan ($20/mes), 5.000 builds + builds concurrentes |
| >50 notas/día publicadas | Evaluar revalidación on-demand (requiere migrar a `output: 'server'`) |
| >100k pageviews/mes | Sumar Cloudflare Web Analytics o Plausible para entender audiencia |
| Equipo editorial >5 personas | Roles y permisos en Sanity (en plan paid del CMS) |
| Error monitoring sin Sentry empieza a doler | Sumar Sentry, evaluar plan paid si free se llena |
| Búsqueda client-side se vuelve lenta (>500 notas) | Migrar `/buscar` a backend (Algolia, Meilisearch, o GROQ on-demand) |
| El sitio empieza a tener cuentas / suscripciones / paywall | Migración estructural — `output: 'server'` o híbrido, sumar auth, evaluar Astro DB o Sanity como datastore |

Ninguna de estas es bloqueante para arrancar. Son inflection points que aparecen con escala. La arquitectura actual (Astro static + Sanity + CF Pages) es sólida hasta los 200-500k pageviews/mes y un equipo editorial de hasta ~10 personas.

---

## Próximos pasos

- Ver `TECH_DEBT.md` para el inventario completo de TODOs pendientes.
- Ver `REBUILD.md` si necesitás ajustar cadencia del cron o el webhook de Sanity.
- Ver `DEPLOY.md` si vas a hacer un cambio que requiere reconfigurar Cloudflare Pages.
