# Studio — Guía editorial

Este es el sistema donde se cargan y editan las notas, los autores y las categorías de Argentina al día. Todo lo que escribas acá aparece en el sitio público después del próximo rebuild (que es automático cada hora).

Esta guía está pensada para el equipo editorial. No necesitás saber programación. Si en algún paso te trabás, andá al final, "Cuándo pedir ayuda al admin técnico".

---

## Cómo entrar

1. Abrí en el browser: **https://argentinaaldia.sanity.studio**
2. Click en **"Continue with Google"**.
3. Iniciá sesión con la cuenta de Google que el admin te autorizó (la del trabajo, no la personal).

Si te aparece **"You don't have access to this project"** quiere decir que tu cuenta no está dada de alta. Escribile al admin con la dirección exacta de Google que querés usar.

---

## Qué vas a ver al entrar

El studio se divide en tres columnas:

```
┌─────────────────┬──────────────────┬───────────────────────┐
│ TIPO DE         │ DOCUMENTOS       │ EDITOR DEL DOCUMENTO  │
│ CONTENIDO       │ DEL TIPO ELEGIDO │                       │
│                 │                  │                       │
│ • Nota          │ • Nota 1         │  Título: ...          │
│ • Autor         │ • Nota 2         │  Slug: ...            │
│ • Categoría     │ • Nota 3         │  Kicker: ...          │
│                 │ • + Create new   │  ...                  │
└─────────────────┴──────────────────┴───────────────────────┘
```

- **Izquierda:** los tres tipos de contenido. Click en uno para verlo.
- **Centro:** la lista de lo que ya está cargado de ese tipo. Abajo de todo, el botón **+ Create new** para sumar uno nuevo.
- **Derecha:** el editor con todos los campos del documento que estás viendo.

---

## Glosario rápido (solo lo que vas a leer en pantalla)

| Término | Qué significa en lenguaje normal |
|---|---|
| **Documento** | Una nota, un autor o una categoría. Cada cosa que se carga es un documento. |
| **Tipo de contenido** | La forma de lo que cargás: Nota, Autor o Categoría. |
| **Slug** | La parte final de la dirección web. Si la nota se llama "Inflación de mayo", el slug puede ser `inflacion-mayo` y queda `argentinaaldia.com/economia/inflacion-mayo`. El studio lo arma automáticamente del título; lo podés editar a mano. **Una vez publicado un documento (nota, autor o categoría), el slug no se cambia:** los links externos y los resultados que Google ya indexó quedan apuntando a 404. Si te equivocaste, pedile al admin que arme una redirección. |
| **Portable Text** | El editor de cuerpo de la nota. Funciona como un Word simplificado: párrafos, negritas, listas, subtítulos, citas, imágenes y tweets. Vos nunca ves código. |
| **Reference** | Un campo donde elegís de una lista. El campo "Categoría" en una nota te muestra las 9 categorías existentes; el campo "Autor" te muestra los autores cargados. |
| **Publish / Unpublish** | Botones abajo a la derecha. Publish hace que la nota aparezca en el sitio en el próximo rebuild. Unpublish la saca. |

---

## Setup inicial (la primera vez que se usa el studio)

Si sos la primera persona en cargar contenido, hay que ir en este orden estricto: **categorías → autores → notas**. Las notas tienen que elegir un autor y una categoría que ya existan. Si las cargás al revés, no podés guardar.

### Paso 1 — Crear las 9 categorías

Estas 9 son las que vive el sitio. Los slugs y colores ya están decididos por diseño; copiarlos exactos para que funcionen los componentes visuales:

| Nombre | Slug | Color (hex) | Orden | Descripción sugerida |
|---|---|---|---|---|
| Política | `politica` | `#A32D2D` | 1 | Gobierno nacional, Congreso, partidos y poder. |
| Economía | `economia` | `#185FA5` | 2 | Mercados, inflación, finanzas y producción. |
| Sociedad | `sociedad` | `#3B6D11` | 3 | Derechos, educación, salud y vida cotidiana. |
| Cultura | `cultura` | `#3C3489` | 4 | Libros, música, cine, artes visuales. |
| Deportes | `deportes` | `#0F6E56` | 5 | Fútbol, básquet, tenis y la pelota nacional. |
| Agro | `agro` | `#854F0B` | 6 | Campo, ganadería, mercados rurales. |
| Espectáculos | `espectaculos` | `#993556` | 7 | Televisión, streaming, farándula. |
| Mundo | `mundo` | `#444441` | 8 | América Latina, EE.UU., Europa, Asia. |
| Provincias | `provincias` | `#6B4423` | 9 | Federalismo: NOA, NEA, Cuyo, Patagonia, centro. |

**Cómo cargar cada una**, paso por paso:

1. En la columna izquierda, click en **Categoría**.
2. En la columna del centro, click en **+ Create new**.
3. Se abre el editor en la derecha. Llenar:
   - **Nombre:** `Política`
   - **Slug:** click en **Generate** (genera `politica` automáticamente desde el nombre). Si te pone otra cosa, editá a mano para que diga exactamente lo de la tabla — el sistema valida que sea uno de los 9 valores y te avisa si está mal.
   - **Descripción:** copiar de la tabla (o redactar parecido en 1-2 líneas).
   - **Color de acento (hex):** copiar el código `#A32D2D` exacto, con el `#`.
   - **Orden en el menú:** `1`
4. Click **Publish** (botón verde abajo a la derecha).
5. Repetir para las otras 8 categorías cambiando los valores según la tabla.

Cuando termines, en la columna del centro tenés que ver las 9 categorías listadas.

### Paso 2 — Crear los autores

Mínimo 3-4 autores antes de cargar la primera nota (si no, el grid de la página de autor queda hueco). Por cada uno:

1. Click en **Autor** (izquierda) → **+ Create new** (centro).
2. Llenar:
   - **Nombre:** nombre completo, p.ej. `María Fernanda Ruiz`.
   - **Slug:** click **Generate**. Se arma `maria-fernanda-ruiz`.
   - **Cargo:** rol en la redacción. Ejemplos:
     - `Editora jefa de Política`
     - `Corresponsal en Provincias y Agro`
     - `Cronista de Sociedad`
     - `Columnista de Economía`
   - **Foto:** subir un retrato cuadrado (mínimo 400×400 px). Click **Upload**, elegir el archivo. Si es rectangular, se va a recortar al cuadrado en el sitio — preferí cuadradas.
   - **Bio:** 2-3 párrafos en el editor de texto. Mencionar trayectoria, premios si los hay, dónde escribió antes.
   - **Redes sociales** (opcional): poner el usuario sin la `@`. Ejemplo: `mfruiz_ar` (no `@mfruiz_ar`).
3. Click **Publish**.

### Paso 3 — Crear la primera nota

Antes de empezar, asegurate de tener decidido:

- En qué categoría va.
- Qué autor la firma.
- La imagen principal lista (preferentemente 1600px de ancho o más, formato horizontal).
- Un alt text para la imagen (ver más abajo qué es).

Después:

1. Click en **Nota** (izquierda) → **+ Create new** (centro).
2. Llenar todos los campos en este orden:

#### Título
- Una sola idea principal, 50-90 caracteres ideal.
- Sin clickbait ("No te vas a creer lo que pasó con…").
- Voz activa cuando se pueda ("La CGT cerró un acuerdo" mejor que "Un acuerdo fue cerrado por la CGT").
- Evitar siglas sin contexto si la nota va al cover. "UTA" en titular del día es opaco para el lector ocasional; en una nota de sección, OK.

#### Slug
Click **Generate**. Se arma desde el título. Editar solo si:
- Es muy largo (corta a 5-7 palabras claves).
- Tiene caracteres raros que no quedan bien en una URL.

Una vez publicada la nota, **no cambies el slug** — los links externos que ya apuntaban a ella se rompen. Si te equivocaste, pedile al admin que arme una redirección.

#### Kicker (antetítulo)
Una línea breve sobre el título que da contexto. Opcional pero recomendado. Ejemplos:
- `Paritarias nacionales`
- `Inflación`
- `Violencia de género`
- `Opinión` (si es una columna)

#### Copete (dek)
2-3 oraciones que contestan qué pasó, quién, cuándo, dónde. Agrega contexto que el titular no contesta. Máximo 300 caracteres — después de eso se trunca en redes sociales y en el resumen de Google.

Mal copete (repite el titular):
> "La UTA y la CGT cerraron una recomposición salarial."

Buen copete (agrega contexto):
> "El acuerdo entre el sindicato de colectiveros y la cúpula sindical fija aumentos hasta agosto y reabre la discusión por el bono de fin de año. El Gobierno acompañó la mesa pero no firmó."

#### Contenido
El cuerpo de la nota. El editor te deja:
- Escribir párrafos normales.
- Marcar **negrita** o *itálica* (botones arriba del editor).
- Agregar subtítulos (H2 para secciones grandes dentro de la nota, H3 para sub-secciones).
- Insertar listas, citas (blockquote).
- Insertar **imágenes intermedias** (con su propio alt, caption y hotspot opcional — mismas reglas que la imagen principal, ver más abajo).
- Insertar **citas con atribución** (texto + quién lo dijo).
- Insertar **tweets embebidos** pegando la URL del tweet.

Para los bloques especiales (imagen, cita, tweet), buscá el botón **+** o **Insert** en la barra de herramientas del editor.

#### Imagen principal
Subir una foto horizontal, idealmente 1600px de ancho o más. Sanity solo achica imágenes, nunca las agranda — si subís una de 800px va a verse borrosa en pantallas retina. Formato JPG para fotos (mejor compresión); PNG solo para gráficos con transparencia o logos.

Después aparecen tres campos:

- **Alt text** (obligatorio): describí la imagen para alguien que no puede verla. Ejemplo: `Apretón de manos en una mesa de negociación sindical`. **Por qué importa:**
  - Lectores con lectores de pantalla escuchan este texto y necesitan entender qué pasa en la foto.
  - Google lo lee para indexar la imagen y mostrarla en búsquedas.
  - Si la imagen no carga (red lenta, falla del CDN), aparece este texto en su lugar.
  - **No** es para repetir el título de la nota. Es para describir la imagen en sí.
- **Pie de foto / caption** (opcional pero recomendado): el crédito y contexto. Ejemplo: `La firma se dio en la sede de la Secretaría de Trabajo. Foto: Archivo Clarín.`
- **Hotspot** (opcional pero recomendado): después de subir, click en la imagen → **Edit hotspot** → arrastrar el círculo a la cara, acción o sujeto principal. Eso garantiza que los crops automáticos para cards, thumbnails, mobile y la previsualización en redes sociales (Twitter, WhatsApp, LinkedIn) no decapiten al protagonista. Sin hotspot, el sistema recorta desde el centro geométrico — funciona OK para fotos centradas pero falla en retratos donde el sujeto está descentrado.

#### Autor
Elegir del menú desplegable. Si no aparece el autor que querés, hay que crearlo primero (Paso 2 arriba) y volver.

#### Categoría
Elegir del menú desplegable. Una sola por nota.

#### Tags
Etiquetas en minúscula y guiones (kebab-case). Ejemplos: `paritarias`, `cgt`, `vaca-muerta`, `pampa-humeda`.

Reglas:
- Pocos por nota: 3 a 6.
- Reutilizar los que ya existen (consistencia).
- **`opinion`** es especial: si lo agregás, la nota aparece en la sección "Opinión" de la home y se renderiza con estilo de columna (foto del autor circular, headline en itálica). Usar **solo** para columnas firmadas, no para notas de información.

#### Fecha de publicación
La fecha y hora en que la nota debe aparecer pública.

- Si querés que se publique **ya:** dejá la fecha por defecto (ahora).
- Si querés **programar para el futuro** (p.ej. una nota embargada hasta mañana 7 AM): poné esa fecha y hora. La nota va a quedar en estado "publicada" pero el sitio público la va a mostrar recién a partir de esa fecha (en el próximo rebuild posterior).

#### Fecha de actualización
Dejala vacía la primera vez que publicás.

Cuando edites la nota más adelante (corregir un dato, agregar información nueva), **actualizá esta fecha al momento de la edición**. NO toques la fecha de publicación original — eso es engaño al lector. La diferencia entre las dos fechas es lo que le señala al lector "esta nota cambió desde que se publicó", y abajo del byline aparece el aviso "Actualizado: 6 de mayo, 14:32".

Solo poné fecha de actualización si:
- Cambiaste algún dato sustantivo.
- Sumaste información nueva (declaración, hecho, contexto que cambia la lectura).
- Hubo una corrección formal.

NO la pongas si:
- Solo arreglaste un typo.
- Cambiaste una palabra por sinónimo.
- Reordenaste un párrafo sin cambiar el sentido.

#### ¿Es destacada?
Si está en `true`, la nota aparece en el bloque "Lo que importa hoy" de la home (hasta 3 destacadas en simultáneo). Decisión editorial diaria — coordinar con el resto de la redacción para no marcar 8 a la vez.

#### ¿Es cover del día?
Si está en `true`, la nota es la principal de la home, ocupa el bloque grande con foto. **Solo una nota por día debería tener esto en `true`**. Si marcás dos, el sitio va a mostrar la primera que encuentra (impredecible) — coordinar con la jefatura del día.

Cuando salga la del día siguiente, ponerle `false` a la del día anterior.

#### Tiempo de lectura (min)
Estimado en minutos. Regla útil: 200 palabras por minuto. Una nota de 600 palabras = 3 min. Una columna de opinión de 1.000 = 5 min. Una larga lectura de 2.500 = 12-13 min.

3. Una vez todo lleno, click **Publish** abajo a la derecha.

La nota va a aparecer en el sitio público en el próximo rebuild (máximo 1 hora). Si necesitás que aparezca ya, pediselo al admin (puede gatillar el rebuild manualmente).

---

## Casos comunes

### Programar una nota para el futuro

En el campo **Fecha de publicación**, elegí la fecha y hora futuras. Click **Publish**. La nota queda guardada y publicada en el CMS, pero el sitio la muestra recién cuando corresponde.

Limitación: el sitio rebuildea cada hora. Si programás una nota para las 7:00 AM, va a aparecer entre las 7:00 y las 7:59 AM, no exactamente a las 7:00:00. Si necesitás precisión al minuto (lanzamiento embargado de un dato económico, etc.), avisale al admin para que dispare el rebuild en ese momento exacto.

### Editar una nota ya publicada

1. Click en **Nota** (izquierda).
2. En la columna del centro, encontrá la nota y click para abrirla.
3. Editar lo que haga falta.
4. **Si el cambio es sustantivo** (corrige un dato, suma información nueva, aclara una afirmación que se interpretó mal): actualizar el campo **Fecha de actualización** al momento del cambio. Esto le dice al lector "esta nota cambió desde que se publicó" — el sitio muestra "Actualizado: 6 de mayo, 14:32" debajo del byline.
5. **Si el cambio es cosmético** (un typo, un guion mal puesto): no hace falta actualizar la fecha.
6. **NUNCA cambies la fecha de publicación original.** Esa fecha es histórica, marca cuándo la nota apareció por primera vez. Cambiarla para "refrescar" la nota engaña al lector y a los buscadores. Si querés republicar una nota como nueva, creá una nueva nota con un slug distinto.
7. Click **Publish** para que los cambios salgan al sitio en el próximo rebuild.

### Despublicar una nota

Abrir la nota → **Unpublish** (botón al lado de Publish). La nota queda guardada en el CMS pero deja de aparecer en el sitio. Útil si:
- Hay que retirar temporalmente por un error grave en revisión.
- Apareció antes de tiempo y querés volverla a programar.

Para volver a sacarla: editar y click **Publish**.

### Borrar una nota definitivamente

Abrir la nota → menú **⋮** arriba a la derecha → **Delete**.

**Cuidado:** los links externos que apunten a esa nota van a romperse (404). Si la nota tuvo tráfico, mejor despublicar (Unpublish) y dejarla guardada. Borrar definitivamente solo si nunca debió existir.

### Sumar un autor nuevo en medio de cargar una nota

Si estás escribiendo una nota y el autor no existe todavía:

1. Guardar lo que tenés sin publicar (Sanity guarda automáticamente como "Draft").
2. Ir a **Autor → + Create new**, cargar al autor nuevo y publicarlo.
3. Volver a la nota (está en la lista del centro como Draft) y elegirlo en el campo **Autor**.
4. Publicar la nota.

---

## Reglas de estilo sugeridas (no impuestas)

Estas son convenciones que ayudan a que el sitio se vea consistente y rinda en SEO. La jefatura editorial define el estilo final del medio.

### Titular
- 50-90 caracteres ideal (cabe en Google y previews sociales sin truncarse).
- Una sola idea principal.
- Voz activa preferida.
- Sin signos `¡` `?` salvo intencionalidad clara.
- Sin mayúsculas todo en mayúscula salvo siglas.
- Sin clickbait ("Lo que pasó te va a sorprender", "Mirá esto").

### Copete
- 2-3 oraciones, 100-250 caracteres.
- Agrega información que el titular no contesta (contexto, alcance, consecuencia).
- No repite palabras del titular cuando se puede evitar.

### Tags
- Kebab-case: `paritarias-2026`, no `Paritarias 2026` ni `paritarias_2026`.
- Pocos: 3 a 6 por nota.
- Reutilizar los que ya existen (mirar antes de inventar uno nuevo).
- Si dudás entre dos formas, ganá la consistencia con notas anteriores.

### Imágenes
- Mínimo 1200px de ancho. 1600px+ ideal.
- Formato horizontal (la cover del día se recorta a 16:9, las cards a 16:10).
- Alt text obligatorio y descriptivo (ver arriba "por qué importa").
- Caption con crédito de la fuente.
- Marcar **hotspot** en retratos o fotos con sujeto descentrado: evita que el crop a 1200×630 decapite al protagonista en redes sociales. En fotos con composición centrada, opcional.
- No usar imágenes con marcas de agua agresivas en el centro.

### Cuándo usar el tag `opinion`
- Solo si la nota es una **columna firmada** con voz personal del autor.
- Una nota de información con opinión filtrada NO es opinión.
- Una entrevista con preguntas opinadas NO es opinión.
- Si dudás, no lo pongas — siempre se puede agregar después.

---

## Cuándo pedir ayuda al admin técnico

Escribile al admin si:

- No podés entrar al studio (login falla).
- El sitio no muestra una nota que ya publicaste y pasó más de 1 hora.
- Necesitás que se gatille un rebuild urgente (publicación embargada al minuto exacto).
- Vas a borrar una nota que tuvo mucho tráfico (mejor armar una redirección antes).
- Necesitás cambiar el slug de una nota ya publicada.
- Pedís sumar a alguien al equipo editorial (te tienen que dar acceso al studio).
- Algo del studio se rompió o se ve raro (pantalla blanca, mensaje de error, etc.).

---

## Para el admin técnico

Esta sección es para quien opera la infraestructura, no para el equipo editorial.

### Setup local del studio

```bash
cd studio
npm install
# crear studio/.env con:
#   SANITY_STUDIO_PROJECT_ID=<project-id>
#   SANITY_STUDIO_DATASET=production
npm run dev               # http://localhost:3333
```

### Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Studio en local con hot reload |
| `npm run build` | Build estático del studio |
| `npm run deploy` | Deploy a `https://<project>.sanity.studio` |

### Schemas

Los schemas viven en `studio/schemas/`. Si los modificás, hay que actualizar también `src/types.ts` en el sitio público para que los tipos TypeScript sigan sincronizados. Para detalles de cómo se mapean los campos de Sanity a los tipos TS y cómo se proyectan en GROQ, ver `src/lib/sanity.ts`.

### Cómo se conecta con el sitio público

El sitio público (`/` en la raíz del repo) lee `SANITY_PROJECT_ID` de `.env`. Si está vacío o es placeholder, cae a `src/data/sample-*.ts`. El log de build dice qué fuente está activa. Detalles: README.md de la raíz.
