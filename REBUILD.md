# Rebuild automático del sitio

Setup del sistema que mantiene el sitio fresco sin intervención manual. Lectura asumida: ya hiciste el deploy inicial siguiendo `DEPLOY.md` y el sitio está en producción en Cloudflare Pages.

---

## Por qué necesitás esto

Argentina al día buildea estático: cada deploy genera un snapshot del contenido al momento del build, y ese snapshot se sirve sin cambios hasta el próximo build. Tres cosas se "freezan" en cada deploy:

1. **El conjunto de notas visibles.** Una nota nueva cargada en el CMS no aparece en el sitio hasta el próximo build.
2. **`sitemap-news.xml`** que filtra "últimas 48h": si el último build fue hace 36 horas, el sitemap muestra notas que ya tienen 36-84h. Google News deja de levantarlas.
3. **La fecha y número de edición** del banner (`HeaderBanner.astro`).

Sin un sistema de rebuild automático, cuando muere un expresidente, cuando el Indec publica IPC, cuando el dólar pega un movimiento brusco, el editor publica y queda esperando que alguien del equipo técnico esté disponible para gatillar deploy. Esa fricción rompe la confianza editorial — el primer "¿salió mi nota?" en Slack es la señal de que el sistema falló.

**Solución:** combinación de webhook (event-driven, instantáneo) + cron (time-based, safety net). Los dos apuntan al mismo [Deploy Hook de Cloudflare Pages](https://developers.cloudflare.com/pages/configuration/deploy-hooks/).

---

## Arquitectura: webhook + cron

### Mecanismo primario — Webhook de Sanity → Deploy Hook

**Es lo que el editor espera:** publico una nota, en segundos está online. Sin esto, el sistema se siente roto desde el día 1, no importa qué tan elegante sea el cron.

- Disparador: Sanity Webhook configurado en sanity.io para gatillarse en `Create / Update / Delete` de los tipos `article`, `author`, `category`.
- Latencia: típicamente 5-30 segundos entre el click "Publish" del editor y el sitio actualizado.
- Cobertura: cualquier cambio de contenido. Una nota nueva, una corrección, un autor que cambia su foto.

### Safety net — Cron periódico al Deploy Hook

**Cubre lo que el webhook no puede:** fallos de red, configuración rota, períodos sin actividad editorial donde igual hay que refrescar.

- Disparador: Cloudflare Worker con cron trigger.
- Latencia: depende de la cadencia (cada 4-12h según volumen editorial — ver tabla abajo).
- Cobertura:
  - **Fallos del webhook** (red caída de Sanity, webhook borrado por accidente, secret rotado mal). El editor publicó, el webhook no disparó, pero el cron levanta el cambio en su próxima ventana.
  - **Roll-off de `sitemap-news.xml`**: notas que cumplen 48h dejan de listarse. Sin un build periódico, el sitemap muestra notas viejas que Google News descarta.
  - **Publicaciones programadas a futuro**: una nota con `fechaPublicacion = mañana 7 AM` queda invisible hasta el primer build posterior a esa hora. El cron garantiza que ese build ocurra.

### Cómo se combinan

```
┌─────────────────────────────────┐
│ MECANISMO PRIMARIO              │
│ ───────────────────             │
│ Sanity Webhook on               │
│ document.publish                │ POST   ┌──────────────────────────┐
│                                 │───────▶│ CF Pages Deploy Hook     │
│ Latencia ~30 segundos           │        │ <URL única, secreta>     │
│                                 │        │                          │      ┌────────────────┐
└─────────────────────────────────┘        │                          │build │ Sitio público  │
                                           │                          │─────▶│ argentinaaldia │
┌─────────────────────────────────┐        │                          │      │ .com           │
│ SAFETY NET                      │        │                          │      │                │
│ ───────────                     │        │                          │      │                │
│ CF Worker cron                  │ POST   │                          │      │                │
│ cada 4-12h (según volumen)      │───────▶│                          │      │                │
│                                 │        │                          │      │                │
└─────────────────────────────────┘        └──────────────────────────┘      └────────────────┘
```

CF Pages encola los builds: si llegan dos POST muy cerca, el primero se cancela y solo se ejecuta el segundo (no se acumulan cinco builds porque el editor publicó cinco notas en un minuto).

---

## Cadencia del cron: depende del volumen editorial

Cloudflare Pages free tier: **500 builds/mes** sumando todos los disparadores (cron + webhook + push a `main`). Cada publicación nueva del webhook gasta 1 build. La cadencia óptima del cron NO es un número fijo — depende de cuántas publicaciones hace el equipo editorial por día.

| Volumen editorial | Webhook builds/mes | Cron recomendado | Cron builds/mes | Total | ¿Free tier alcanza? |
|---|---|---|---|---|---|
| Sin webhook (cron solo) | 0 | Cada 2 h | 360 | 360 | Sí, holgado |
| 5 notas/día | 150 | Cada 4 h | 180 | 330 | Sí |
| 10 notas/día | 300 | Cada 6 h | 120 | 420 | Sí, justo |
| 15 notas/día | 450 | Cada 12 h | 60 | 510 | NO. Paid plan o cron 24 h |
| 20+ notas/día | 600+ | Cada 12 h o disable | 30-60 | 630-660+ | Paid plan recomendado |

**Margen para code commits:** los pushes a `main` también consumen builds (~5/día = 150/mes durante dev activo, ~1/día = 30/mes en mantenimiento). Sumarlos al total para ver si entrás en 500.

**Default sugerido para un diario que está arrancando** (sin contenido todavía, no sabés cuánto vas a publicar): **cron cada 4 h + webhook activado**. Cubre hasta 8-10 notas/día sin pisar el límite. Después de 1-2 meses operando, mirás los números reales en CF Pages → Settings → Plan limits y ajustás.

**Cuándo upgradear a paid plan ($20/mes desbloquea 5.000 builds/mes):**

- El equipo editorial supera consistentemente 15 notas/día.
- Necesitás builds concurrentes (free permite 1 a la vez — si dos cambios llegan juntos, el segundo espera).
- El sitio genera ingresos que justifican $20/mes — para un medio en producción esto es trivial.

No artificialmente bajes la cadencia del cron a "cada 24 horas" para no gastar builds. Eso degrada el sitemap-news y hace que el editor desconfíe del sistema. Si los números no dan, paid plan.

---

## Setup paso a paso

### Paso 1 — Crear el Deploy Hook en CF Pages

Es la URL común que tanto el webhook como el cron van a usar.

1. Entrar al dashboard del proyecto en CF: **Workers & Pages** → tu proyecto → pestaña **Settings**.
2. Scrollear hasta la sección **Builds & deployments** → **Deploy hooks** → click **Add deploy hook**.
3. Configurar:
   - **Hook name:** `rebuild-trigger`
   - **Branch:** `main`
4. Click **Create hook**. CF te muestra una URL larga del tipo:
   ```
   https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/abcd1234-...
   ```
5. **Copiarla y guardarla en algún lado seguro** (gestor de contraseñas, no en el repo). Esta URL es el "secreto" — cualquiera con la URL puede gatillar builds en tu cuenta.

Para probarla manualmente desde local:
```bash
curl -X POST https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/abcd1234-...
```

CF responde con un JSON tipo `{"result": {"id": "..."}}` y, en el dashboard del proyecto, vas a ver un nuevo deploy en la pestaña **Deployments** dentro de los 30 segundos.

---

### Paso 2 — Webhook de Sanity (mecanismo primario)

Es el primer paso después del Deploy Hook porque es el que el equipo editorial siente.

1. Entrar a [sanity.io/manage](https://sanity.io/manage) → seleccionar el proyecto.
2. Pestaña **API** → sección **Webhooks** → **Create webhook**.
3. Configurar:
   - **Name:** `Rebuild on content change`
   - **URL:** la URL del Deploy Hook del Paso 1 (sí, exactamente la misma).
   - **Trigger on:** marcar **Create**, **Update**, **Delete**.
   - **Filter:** `_type in ["article", "author", "category"]` (evita disparos por tipos que no afectan al sitio si en el futuro agregás otros).
   - **Projection:** dejar vacío (no necesitamos payload, solo el disparo).
   - **HTTP method:** POST.
   - **API version:** la misma que `SANITY_API_VERSION` del proyecto (`2024-03-15`).
4. Click **Save**.

**Verificación inmediata:**

1. Editar cualquier nota en el studio y click **Publish**.
2. En el dashboard del webhook (Sanity Manage → API → Webhooks → click sobre el webhook), ver la pestaña **Attempts**: debería aparecer una entrega exitosa (200) dentro de 5 segundos.
3. En CF Pages → tu proyecto → **Deployments**, debería gatillarse un nuevo deploy con trigger "Deploy Hook".
4. ~30 segundos después: la nota debería estar visible en `argentinaaldia.com` (refrescar incógnito para evitar caché).

Si no funciona algo, la pestaña **Attempts** del webhook te dice exactamente qué falló (URL incorrecta, timeout, response 4xx/5xx).

**Warning sobre cargas masivas:** si el equipo editorial hace 5-10 publicaciones en un minuto (importación inicial, carga en lote, copiar/pegar plantillas), se gatillan 5-10 webhooks → 5-10 builds. CF cancela los redundantes pero **cada disparo cuenta para el límite mensual**. Para una importación inicial de 100+ notas, conviene **pausar el webhook desde Sanity Manage**, hacer la carga, reactivar.

---

### Paso 3 — Cron (safety net)

Dos opciones según preferencias del equipo. **Recomendación: Cloudflare Worker** (al final).

#### Opción A — GitHub Actions

**Tradeoffs:**
- ✓ Cero costo en repos públicos, 2.000 minutos/mes en repos privados (cada cron run usa ~5 segundos).
- ✓ UI familiar para devs que ya usan GitHub Actions: ves cada ejecución en la pestaña Actions del repo.
- ✗ **Cron tiene delay típico de 5-15 minutos** y puede demorar hasta 60 min en horarios pico (limitación documentada de GH Actions). Para safety net cada 4h+ no es bloqueante.
- ✗ Una integración más (GitHub) en la mezcla. Si GH tiene un outage, el cron no corre.

**Setup:**

Crear `.github/workflows/cron-rebuild.yml`:

```yaml
name: Cron rebuild (safety net)

on:
  schedule:
    - cron: '0 */4 * * *'   # cada 4 horas en minuto 0 (default sugerido)
  workflow_dispatch:        # botón en GH para gatillar manual

jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: POST to Cloudflare Deploy Hook
        run: curl -X POST -f -sS "${{ secrets.CF_DEPLOY_HOOK }}"
```

Configurar el secret en GitHub:
1. Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
2. Name: `CF_DEPLOY_HOOK`
3. Value: la URL del Deploy Hook del Paso 1.
4. **Add secret**.

Commitear el `.yml`, pushear. GH muestra el workflow en la pestaña **Actions**. La primera ejecución va a ser en el próximo cambio de hora múltiplo de 4 (00:00, 04:00, 08:00, etc. UTC).

---

#### Opción B — Cloudflare Workers Cron (RECOMENDADA)

**Tradeoffs:**
- ✓ Mismo vendor que el sitio. Una integración menos. Si CF tiene un outage, todo se cae junto — pero ya estás caído de todas formas, así que no es un riesgo nuevo.
- ✓ **Cron preciso al segundo** (Workers ejecuta cron triggers con latencia <30 segundos del horario programado).
- ✓ Free tier sobrado: 100.000 requests/día para Workers. Un cron de 4h hace 6 requests/día — usás el 0,006% del límite.
- ✓ Logs en el mismo dashboard de CF.
- ✗ Crear un Worker la primera vez requiere instalar `wrangler` (CLI de CF) y leer ~30 min de doc.

**Por qué la recomiendo:** mismo vendor, precisión, free tier sobrado, cero deps adicionales en la cadena. El "costo" de aprender Wrangler es ~30 min y queda para el siguiente Worker que aparezca eventualmente.

**Setup:**

1. Instalar Wrangler local:
   ```bash
   npm install -g wrangler
   wrangler login
   ```
   Se abre el browser para autorizar Wrangler en tu cuenta de CF.

2. Crear una carpeta para el Worker (separada del sitio):
   ```bash
   mkdir -p workers/cron-rebuild
   cd workers/cron-rebuild
   ```

3. Crear `workers/cron-rebuild/wrangler.toml`:
   ```toml
   name = "argentinaaldia-cron-rebuild"
   main = "src/index.js"
   compatibility_date = "2026-05-01"

   [triggers]
   crons = ["0 */4 * * *"]   # cada 4h por default; ver tabla de cadencia
   ```

4. Crear `workers/cron-rebuild/src/index.js`:
   ```js
   export default {
     async scheduled(event, env, ctx) {
       const response = await fetch(env.DEPLOY_HOOK_URL, { method: 'POST' });
       console.log(
         `[cron-rebuild] ${new Date().toISOString()} → ${response.status} ${response.statusText}`,
       );
       if (!response.ok) {
         throw new Error(`Deploy hook returned ${response.status}`);
       }
     },
   };
   ```

5. Configurar el secret del Deploy Hook:
   ```bash
   cd workers/cron-rebuild
   wrangler secret put DEPLOY_HOOK_URL
   # te pide que pegues el valor → pegar la URL del Paso 1 → enter
   ```

6. Deployar el Worker:
   ```bash
   wrangler deploy
   ```
   Wrangler te muestra el URL del Worker (no se usa — el cron lo dispara solo) y confirma el cron registrado.

7. Verificar en el dashboard de CF: **Workers & Pages** → `argentinaaldia-cron-rebuild` → pestaña **Triggers**. Tiene que aparecer `0 */4 * * *` listado.

Para gatillar manualmente sin esperar al horario:
```bash
wrangler dev --test-scheduled
# en otra terminal:
curl http://localhost:8787/cdn-cgi/handler/scheduled
```

---

## Verificación final del sistema completo

Después de configurar Webhook + Cron:

1. **Test del webhook:** publicar una nota en el studio → confirmar que aparece en `argentinaaldia.com` en menos de 60 segundos.
2. **Test del cron:** esperar al próximo horario programado (00:00, 04:00, etc. UTC — convertir a ART restando 3h) → verificar que se gatilló un deploy con trigger "Deploy Hook" en CF Pages.
3. **Test del filtrado de fecha futura:** crear una nota con `fechaPublicacion` en el futuro → confirmar que NO aparece en el sitio inmediatamente (el GROQ + JS filter del sitio la deben filtrar). Confirmar que aparece después del próximo build posterior a la fecha programada.
4. **Test de `sitemap-news.xml`:** todas las `<news:publication_date>` deben estar dentro de las últimas 48h respecto del último build.

Si algo de esto falla, mirar logs:
- Webhook: Sanity Manage → API → Webhooks → Attempts.
- Cron Worker: CF dashboard → Workers → cron-rebuild → Logs.
- Build mismo: CF Pages → tu proyecto → Deployments → click el deploy → log completo.

---

## Costos y límites

| Recurso | Free tier | Lo que usa este sistema |
|---|---|---|
| **CF Pages builds** | 500/mes | Variable según volumen editorial (ver tabla de cadencia). Sumar webhook + cron + commits. |
| **CF Workers requests** | 100.000/día | Cron 4h: 6/día. Usado: 0,006%. |
| **CF Workers CPU time** | 10ms/request | El handler es 1 fetch + 1 console.log → ~2ms. Sobrado. |
| **GH Actions minutes** (si elegís A) | 2.000/mes en repos privados | Cron 6/día × 30 días × 5seg = ~15 min/mes. Usado: 0,75%. |
| **Sanity Webhooks** | Incluidos en plan free | Sin límite efectivo para uso normal. |

**Si te pasás del free tier de CF Pages:** no se rompe nada. CF cobra ~$0.005-0.01 por build extra. 100 builds extra = ~$0.50-1/mes. A esa escala no vale el dolor de optimizar la cadencia — pero si te pasás todos los meses, es señal de upgrade a paid plan ($20/mes desbloquea 5.000 builds + builds concurrentes).

---

## Cuándo cambiar la cadencia o el setup

| Si pasa esto | Entonces |
|---|---|
| Editor reporta "publiqué hace 5 minutos y no se ve" repetidamente | Verificar el webhook (Sanity Manage → Attempts). Si está roto, fixear. El cron NO es solución para esto. |
| Google Search Console reporta `sitemap-news.xml` con URLs viejas (>48h) | Bajar la cadencia del cron 1 step (de 6h a 4h). Verificar que cabe en budget. |
| El proyecto cruza los 1.000 builds/mes | Upgrade a paid plan. El UX mejora porque también desbloquea builds concurrentes. |
| El equipo editorial pasa de 5 a 25+ notas/día | Paid plan (no recortar el cron — es safety net, no toleres romperlo). |
| Necesitás revalidación selectiva por nota (no rebuild completo) | Fuera de scope hoy con `output: 'static'`. Requeriría migrar a `output: 'server'` con on-demand revalidation. Evaluación separada. |

---

## Próximos pasos

- Ver `MAINTENANCE.md` para monitoreo continuo del sistema (alertas si webhook/cron falla, qué chequear cada 6 meses).
- Ver `TECH_DEBT.md` para el inventario de mejoras pendientes relacionadas con el flujo de contenido.
