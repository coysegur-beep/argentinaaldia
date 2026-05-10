// =============================================================================
// generate-articles.mjs — Generador de notas con asistencia de IA (Gemini API)
// =============================================================================
//
// Flujo:
//   1. Lee `src/data/topics-queue.json`, filtra los topics no consumidos.
//   2. Selecciona los próximos N (DAILY_COUNT, default 2) por prioridad.
//   3. Para cada topic, llama a Gemini API (gemini-2.5-flash por default) con
//      un system prompt periodístico estricto. Pide JSON estructurado.
//   4. Convierte el `cuerpo_md` (markdown) a Portable Text simple para el
//      campo `contenido` de Sanity.
//   5. Sube cada nota a Sanity como **draft** (`drafts.ai-<slug>`) con
//      `ai_generated: true` y `aiModel` para auditoría. El editor revisa y
//      publica desde el studio.
//   6. Marca el topic con `consumed: true` + `consumed_at` + `sanity_id` en
//      `topics-queue.json` (idempotente — re-correr saltea consumidos).
//   7. Trackea uso de tokens en `data/ai-usage.json`. Aborta si supera
//      MONTHLY_TOKEN_LIMIT (default 1.000.000) en el mes corriente.
//
// Variables de entorno:
//   GEMINI_API_KEY         requerida — token de la Gemini API
//                                      (https://aistudio.google.com/apikey).
//   GEMINI_MODEL           opcional   — default 'gemini-2.5-flash'.
//   SANITY_PROJECT_ID      requerida — id del proyecto Sanity.
//   SANITY_DATASET         requerida — dataset (production por default).
//   SANITY_API_VERSION     opcional   — default 2024-03-15.
//   SANITY_TOKEN           requerida — token Editor para escribir drafts.
//   DAILY_COUNT            opcional   — cuántas notas generar (default 2).
//   MONTHLY_TOKEN_LIMIT    opcional   — tope mensual de tokens (default 1M).
//   DRY_RUN=1              opcional   — no llama API ni escribe a Sanity ni
//                                       actualiza queue. Útil para testear.
//
// Run:
//   npm run generate-articles
//   DAILY_COUNT=1 DRY_RUN=1 npm run generate-articles
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@sanity/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// -----------------------------------------------------------------------------
// 1. Carga de .env (defensiva — en GitHub Actions las vars vienen del workflow)
// -----------------------------------------------------------------------------
try {
  const envText = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
  for (const line of envText.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
} catch {
  // .env ausente: OK en CI. Las vars deben venir del environment.
}

// -----------------------------------------------------------------------------
// 2. Configuración + validación de env
// -----------------------------------------------------------------------------
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY ?? '').trim();
const GEMINI_MODEL = (process.env.GEMINI_MODEL ?? 'gemini-2.5-flash').trim();
const SANITY_PROJECT_ID = (process.env.SANITY_PROJECT_ID ?? '').trim();
const SANITY_DATASET = (process.env.SANITY_DATASET ?? 'production').trim();
const SANITY_API_VERSION = (process.env.SANITY_API_VERSION ?? '2024-03-15').trim();
const SANITY_TOKEN = (process.env.SANITY_TOKEN ?? '').trim();

const DAILY_COUNT = parseInt(process.env.DAILY_COUNT ?? '2', 10);
const MONTHLY_TOKEN_LIMIT = parseInt(process.env.MONTHLY_TOKEN_LIMIT ?? '1000000', 10);
const DRY_RUN = process.env.DRY_RUN === '1';

const missing = [];
if (!GEMINI_API_KEY && !DRY_RUN) missing.push('GEMINI_API_KEY');
if (!SANITY_PROJECT_ID && !DRY_RUN) missing.push('SANITY_PROJECT_ID');
if (!SANITY_TOKEN && !DRY_RUN) missing.push('SANITY_TOKEN');
if (missing.length > 0) {
  console.error(`Faltan variables: ${missing.join(', ')}. Cargá .env o seteá en el environment.`);
  process.exit(1);
}

const TOPICS_PATH = path.join(ROOT, 'src/data/topics-queue.json');
const USAGE_PATH = path.join(ROOT, 'data/ai-usage.json');

// -----------------------------------------------------------------------------
// 3. Helpers
// -----------------------------------------------------------------------------
const key = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12);

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function currentMonthKey() {
  // 'YYYY-MM' UTC. Usado para reset mensual del contador.
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Convierte markdown muy simple a Portable Text de Sanity.
 *
 * Soporta solo dos casos por bloque:
 *   - Línea/párrafo que arranca con `## ` -> block style 'h2'.
 *   - Cualquier otro párrafo -> block style 'normal'.
 *
 * No soporta inline (negrita, itálica, links, listas, blockquotes). El system
 * prompt restringe explícitamente al modelo a esos formatos para evitar que
 * salgan asteriscos o sintaxis cruda en el render.
 */
function mdToPortableText(md) {
  const sections = String(md ?? '')
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  return sections.map((section) => {
    const isH2 = section.startsWith('## ');
    const text = isH2 ? section.slice(3).trim() : section.replace(/^#+\s*/, '');
    return {
      _type: 'block',
      _key: key(),
      style: isH2 ? 'h2' : 'normal',
      markDefs: [],
      children: [
        { _type: 'span', _key: key(), text, marks: [] },
      ],
    };
  });
}

// -----------------------------------------------------------------------------
// 4. Token usage tracking (persistido en data/ai-usage.json)
// -----------------------------------------------------------------------------
function loadUsage() {
  try {
    const raw = fs.readFileSync(USAGE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveUsage(usage) {
  fs.mkdirSync(path.dirname(USAGE_PATH), { recursive: true });
  fs.writeFileSync(USAGE_PATH, JSON.stringify(usage, null, 2) + '\n');
}

function readOrInitUsage() {
  const month = currentMonthKey();
  const existing = loadUsage();
  if (!existing || existing.month !== month) {
    return {
      month,
      tokens_input: 0,
      tokens_output: 0,
      tokens_total: 0,
      runs: 0,
      last_run: null,
    };
  }
  return existing;
}

// -----------------------------------------------------------------------------
// 5. Schema declarativo para structured output + system prompt + user prompt
// -----------------------------------------------------------------------------
//
// Cuando se pasa `responseSchema` junto con `responseMimeType: 'application/json'`,
// el SDK garantiza que `response.text()` sea JSON válido parseable, con todos
// los campos required presentes y los tipos correctos. Elimina los crashes
// observados en producción donde gemini-2.5-flash devolvía claves duplicadas
// o strings sin cerrar bajo presión de longitud.
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    titulo: {
      type: 'string',
      description: 'Hasta 110 caracteres, sin clickbait.',
    },
    bajada: {
      type: 'string',
      description: '2-3 oraciones, hasta 280 caracteres, agrega contexto.',
    },
    cuerpo_md: {
      type: 'string',
      description: '600-1100 palabras en markdown simple (## subtítulos + párrafos).',
    },
    tags: {
      type: 'array',
      items: { type: 'string' },
      description: '3-6 tags, kebab-case minúsculas.',
    },
    palabras_clave_seo: {
      type: 'array',
      items: { type: 'string' },
      description: '5-8 frases para SEO/indexación.',
    },
    tiempo_lectura_min: {
      type: 'integer',
      description: 'Entre 3 y 8.',
    },
    pending_facts: {
      type: 'array',
      items: { type: 'string' },
      description: 'Datos específicos que conviene verificar antes de publicar (puede quedar vacío).',
    },
  },
  required: ['titulo', 'bajada', 'cuerpo_md', 'tags', 'tiempo_lectura_min'],
  propertyOrdering: [
    'titulo',
    'bajada',
    'cuerpo_md',
    'tags',
    'palabras_clave_seo',
    'tiempo_lectura_min',
    'pending_facts',
  ],
};

const SYSTEM_PROMPT = `Sos un periodista argentino con voz editorial. Producís notas de OPINIÓN o ANÁLISIS — nunca breaking news con datos puntuales.

REGLAS DURAS (no negociables):
- PROHIBIDO inventar declaraciones textuales, citas atribuidas, datos concretos, fechas específicas o cifras precisas.
- PROHIBIDO citar a personas reales como si hubieran dicho algo. Paráfrasis general OK ("el oficialismo ha sostenido históricamente que...").
- Si el tema requiere un dato específico que no manejás con certeza, escribilo en abstracto o agregalo al campo \`pending_facts\` para que el editor lo verifique antes de publicar.
- Tono: profesional, voz editorial argentina (voseo aceptable), contexto histórico, múltiples perspectivas.
- Largo del cuerpo: 600 a 1100 palabras.
- Formato Markdown SIMPLE en \`cuerpo_md\`: solo párrafos separados por línea en blanco y subtítulos \`## ...\`. SIN negrita, SIN itálica, SIN links, SIN listas, SIN blockquotes. Si querés énfasis, usalo en la prosa, no con sintaxis.

CAMPOS DE SALIDA (el schema los valida automáticamente; estas notas indican estilo y longitud):
- titulo: hasta 110 caracteres, sin clickbait.
- bajada: 2-3 oraciones, hasta 280 caracteres, agrega contexto que el título no contesta.
- cuerpo_md: 600-1100 palabras, markdown simple.
- tags: 3-6 tags, kebab-case minúsculas.
- palabras_clave_seo: 5-8 frases para SEO/indexación.
- tiempo_lectura_min: entero entre 3 y 8.
- pending_facts: datos específicos que conviene verificar antes de publicar (puede quedar vacío).`;

function buildUserPrompt(topic) {
  const tipoMap = {
    opinion: 'columna de opinión firmada',
    analisis: 'análisis editorial con perspectiva histórica',
    explicativo: 'explicativo didáctico para lector general',
  };
  const tipoDesc = tipoMap[topic.tipo] ?? topic.tipo;

  return [
    `Escribí una ${tipoDesc} para la sección "${topic.categoria}".`,
    `Título sugerido (podés ajustarlo si mejora): "${topic.titulo_sugerido}".`,
    topic.prompt_extra ? `Brief editorial:\n${topic.prompt_extra}` : null,
  ]
    .filter(Boolean)
    .join('\n\n');
}

// -----------------------------------------------------------------------------
// 6. Llamada a Gemini API (responseMimeType: 'application/json' fuerza el JSON)
// -----------------------------------------------------------------------------
async function callModel(model, topic) {
  // Structured output: `responseMimeType: 'application/json'` + `responseSchema`
  // garantizan JSON válido parseable, con campos required presentes y tipos
  // correctos. Elimina los crashes que vimos en producción (claves duplicadas,
  // strings sin cerrar) cuando el modelo se autorregulaba el formato bajo
  // presión de longitud.
  const result = await model.generateContent(buildUserPrompt(topic));
  const text = result.response.text();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(
      `JSON inválido del modelo: ${err.message}\nOutput crudo:\n${text.slice(0, 500)}...`,
    );
  }

  // Validación mínima de shape — si falta algo crítico, error
  for (const f of ['titulo', 'bajada', 'cuerpo_md', 'tags', 'tiempo_lectura_min']) {
    if (parsed[f] === undefined || parsed[f] === null || parsed[f] === '') {
      throw new Error(`shape inválido: campo "${f}" ausente o vacío`);
    }
  }

  return {
    parsed,
    usage: {
      input: result.response.usageMetadata?.promptTokenCount ?? 0,
      output: result.response.usageMetadata?.candidatesTokenCount ?? 0,
    },
  };
}

// -----------------------------------------------------------------------------
// 7. Main
// -----------------------------------------------------------------------------
async function main() {
  console.log(`\n=== generate-articles · ${new Date().toISOString()} ===`);
  console.log(`Modelo: ${GEMINI_MODEL}`);
  if (DRY_RUN) console.log('[DRY_RUN=1] No se llamará a Gemini API ni se escribirá a Sanity.');

  // 7.1 — leer queue
  const queueRaw = JSON.parse(fs.readFileSync(TOPICS_PATH, 'utf8'));
  const pending = queueRaw
    .filter((t) => !t.consumed)
    .sort((a, b) => (a.prioridad ?? 99) - (b.prioridad ?? 99));

  if (pending.length === 0) {
    console.log('topics-queue.json no tiene topics pendientes. Sumá entradas y volvé a correr.');
    return;
  }

  const selected = pending.slice(0, DAILY_COUNT);
  console.log(`\nTopics pendientes: ${pending.length}. Procesando ${selected.length} (DAILY_COUNT=${DAILY_COUNT}).`);

  // 7.2 — chequeo de tokens del mes ANTES de llamar a la API
  const usage = readOrInitUsage();
  console.log(`\nUso del mes ${usage.month}: ${usage.tokens_total.toLocaleString()} / ${MONTHLY_TOKEN_LIMIT.toLocaleString()} tokens`);
  if (usage.tokens_total >= MONTHLY_TOKEN_LIMIT) {
    console.error(`\n✗ Límite mensual alcanzado. Aumentá MONTHLY_TOKEN_LIMIT o esperá al próximo mes.`);
    process.exit(1);
  }

  // 7.3 — clientes (skipped en dry run)
  const aiModel = DRY_RUN
    ? null
    : new GoogleGenerativeAI(GEMINI_API_KEY).getGenerativeModel({
        model: GEMINI_MODEL,
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          maxOutputTokens: 4096,
        },
      });
  const sanity = DRY_RUN
    ? null
    : createClient({
        projectId: SANITY_PROJECT_ID,
        dataset: SANITY_DATASET,
        apiVersion: SANITY_API_VERSION,
        token: SANITY_TOKEN,
        useCdn: false,
      });

  // 7.4 — resolver refs (categorías + autor "comite-editorial" como firma default)
  let catBySlug = new Map();
  let comiteAuthorId = null;
  if (!DRY_RUN) {
    const cats = await sanity.fetch(`*[_type=="category"]{_id, "slug": slug.current}`);
    catBySlug = new Map(cats.map((c) => [c.slug, c._id]));

    const comite = await sanity.fetch(
      `*[_type=="author" && slug.current=="comite-editorial"][0]._id`,
    );
    comiteAuthorId = comite ?? null;
    if (!comiteAuthorId) {
      console.error('✗ No existe el autor "comite-editorial" en Sanity. Creálo desde el studio antes de seguir.');
      process.exit(1);
    }
  }

  // 7.5 — iterar
  let okCount = 0;
  const skipped = [];
  let totalIn = 0;
  let totalOut = 0;

  for (let i = 0; i < selected.length; i++) {
    const topic = selected[i];
    const idx = `${i + 1}/${selected.length}`;
    console.log(`\n--- ${idx} · ${topic.id} · ${topic.titulo_sugerido}`);

    // categoría tiene que existir
    if (!DRY_RUN) {
      const catId = catBySlug.get(topic.categoria);
      if (!catId) {
        const reason = `categoría "${topic.categoria}" no existe en Sanity`;
        console.warn(`  ✗ ${reason}`);
        skipped.push({ id: topic.id, reason });
        continue;
      }
    }

    let parsed, callUsage;
    try {
      if (DRY_RUN) {
        console.log('  [DRY_RUN] (saltado)');
        continue;
      }
      const result = await callModel(aiModel, topic);
      parsed = result.parsed;
      callUsage = result.usage;
    } catch (err) {
      const reason = `error Gemini API: ${err.message}`;
      console.warn(`  ✗ ${reason}`);
      skipped.push({ id: topic.id, reason });
      continue;
    }

    totalIn += callUsage.input;
    totalOut += callUsage.output;
    console.log(`  · tokens: in=${callUsage.input}  out=${callUsage.output}`);

    if (Array.isArray(parsed.pending_facts) && parsed.pending_facts.length > 0) {
      console.log(`  · pending_facts a verificar antes de publicar:`);
      for (const f of parsed.pending_facts) console.log(`      - ${f}`);
    }
    if (Array.isArray(parsed.palabras_clave_seo) && parsed.palabras_clave_seo.length > 0) {
      console.log(`  · palabras_clave_seo: ${parsed.palabras_clave_seo.join(', ')}`);
    }

    // armar doc
    const slug = slugify(parsed.titulo);
    const docId = `drafts.ai-${slug}`;
    const catId = catBySlug.get(topic.categoria);

    // tags + palabras_clave_seo dedupeadas
    const tagsRaw = [
      ...(Array.isArray(parsed.tags) ? parsed.tags : []),
      ...(Array.isArray(parsed.palabras_clave_seo) ? parsed.palabras_clave_seo : []),
    ];
    const tags = Array.from(new Set(tagsRaw.map((t) => String(t).trim()).filter(Boolean)));

    const doc = {
      _id: docId,
      _type: 'article',
      titulo: String(parsed.titulo).slice(0, 200),
      slug: { _type: 'slug', current: slug },
      copete: String(parsed.bajada),
      contenido: mdToPortableText(parsed.cuerpo_md),
      autor: { _type: 'reference', _ref: comiteAuthorId },
      categoria: { _type: 'reference', _ref: catId },
      tags,
      fechaPublicacion: new Date().toISOString(),
      esDestacada: false,
      esCoverDelDia: false,
      tiempoLectura: Math.max(3, Math.min(8, Number(parsed.tiempo_lectura_min) || 5)),
      ai_generated: true,
      aiModel: GEMINI_MODEL,
      // imagenPrincipal omitido — el editor la sube manualmente al revisar
      // el draft. El schema marca el campo required, así que en el studio se
      // ve un warning rojo hasta que esté.
    };

    if (!docId.startsWith('drafts.')) {
      const reason = 'defensa: id no arranca con "drafts." — saltado para no publicar sin revisión';
      console.warn(`  ✗ ${reason}`);
      skipped.push({ id: topic.id, reason });
      continue;
    }

    try {
      await sanity.createOrReplace(doc);
      console.log(`  ✓ draft creado: ${docId}`);
    } catch (err) {
      const reason = `error Sanity: ${err?.message ?? err}`;
      console.warn(`  ✗ ${reason}`);
      skipped.push({ id: topic.id, reason });
      continue;
    }

    // marcar topic como consumido en queue
    const updated = queueRaw.map((t) =>
      t.id === topic.id
        ? { ...t, consumed: true, consumed_at: new Date().toISOString(), sanity_id: docId }
        : t,
    );
    fs.writeFileSync(TOPICS_PATH, JSON.stringify(updated, null, 2) + '\n');
    // mutación in-place del puntero local para reflejar en la próxima iteración
    queueRaw.splice(0, queueRaw.length, ...updated);

    okCount++;

    // check del límite mensual mid-run, abortamos si sobrepasamos
    const wouldBeTotal = usage.tokens_total + totalIn + totalOut;
    if (wouldBeTotal >= MONTHLY_TOKEN_LIMIT) {
      console.warn(
        `\n  · alcanzamos MONTHLY_TOKEN_LIMIT (${wouldBeTotal.toLocaleString()} >= ${MONTHLY_TOKEN_LIMIT.toLocaleString()}). Cortamos antes de la próxima iteración.`,
      );
      break;
    }
  }

  // 7.6 — persistir token usage (solo si no es dry run y hubo calls reales)
  if (!DRY_RUN && (totalIn + totalOut) > 0) {
    usage.tokens_input += totalIn;
    usage.tokens_output += totalOut;
    usage.tokens_total += totalIn + totalOut;
    usage.runs += 1;
    usage.last_run = new Date().toISOString();
    saveUsage(usage);
  }

  // 7.7 — reporte final
  console.log(`\n=== resumen ===`);
  console.log(`Notas creadas: ${okCount} / ${selected.length}`);
  console.log(`Salteadas:     ${skipped.length}`);
  console.log(`Tokens input:  ${totalIn.toLocaleString()}`);
  console.log(`Tokens output: ${totalOut.toLocaleString()}`);
  console.log(`Tokens total:  ${(totalIn + totalOut).toLocaleString()}`);
  if (!DRY_RUN) {
    const remaining = Math.max(0, MONTHLY_TOKEN_LIMIT - usage.tokens_total);
    const pct = Math.round((usage.tokens_total / MONTHLY_TOKEN_LIMIT) * 100);
    console.log(`Mes ${usage.month}: ${usage.tokens_total.toLocaleString()} / ${MONTHLY_TOKEN_LIMIT.toLocaleString()} (${pct}%) — restante ${remaining.toLocaleString()}`);
  }

  if (skipped.length > 0) {
    console.log(`\nDetalle de salteadas:`);
    for (const s of skipped) console.log(`  - ${s.id}: ${s.reason}`);
  }
  console.log('');
}

main().catch((err) => {
  console.error('\nError fatal:', err);
  process.exit(1);
});
