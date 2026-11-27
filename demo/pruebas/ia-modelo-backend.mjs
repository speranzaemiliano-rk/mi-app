// Backend (functions/server.js) → el proxy /gemini: qué modelo usa y cuánto «piensa».
// Levanta el server real con `fetch` simulado (no sale a internet, no hace falta GEMINI_API_KEY real)
// y mira EXACTAMENTE qué cuerpo le mandaría a Google.
// Uso: node demo/pruebas/ia-modelo-backend.mjs     (necesita `npm install` en functions/)
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.ROOT || path.resolve(AQUI, '../..');

const PUERTO = 3917;
process.env.PORT = String(PUERTO);
process.env.GEMINI_API_KEY = 'clave-de-prueba';
delete process.env.APP_API_TOKEN;      // sin token: modo compatibilidad, se puede llamar sin auth
delete process.env.GEMINI_MODEL;
delete process.env.GEMINI_THINKING;

// ── `fetch` simulado: anota lo que se le pide a Google y contesta lo que diga la prueba ──
const pedidos = [];
let respuesta = () => ({ ok: true, status: 200, body: { candidates: [{ content: { parts: [{ text: '{"ok":1}' }] } }] } });
const fetchReal = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  const u = String(url);
  if (!/generativelanguage\.googleapis\.com/.test(u)) return fetchReal(url, opts);
  const cuerpo = JSON.parse((opts && opts.body) || '{}');
  pedidos.push({ url: u.split('?')[0], modelo: decodeURIComponent((u.match(/models\/([^:]+):/) || [])[1] || ''), cuerpo });
  const r = respuesta(pedidos.length);
  return { ok: r.ok, status: r.status, json: async () => r.body };
};

const _req = createRequire(import.meta.url);
const silenciarLog = console.log; console.log = () => {};
_req(path.join(ROOT, 'functions/server.js'));
console.log = silenciarLog;
await new Promise(r => setTimeout(r, 400));

const res = [];
const ok = (n, c, x) => res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]);
const pedir = async (cuerpo) => {
  pedidos.length = 0;
  const r = await fetchReal('http://127.0.0.1:' + PUERTO + '/gemini', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo)
  });
  return { status: r.status, cabeceras: Object.fromEntries(r.headers), datos: await r.json().catch(() => ({})), pedidos: pedidos.slice() };
};
const pensarDe = (p) => (p.cuerpo.generationConfig || {}).thinkingConfig || null;
const body1 = (extra) => ({ contents: [{ parts: [{ text: 'hola' }] }], generationConfig: Object.assign({ temperature: 0, maxOutputTokens: 2048 }, extra || {}) });

// ═════════ A: el modelo por defecto no es uno que Google da de baja ═════════
const diag = await (await fetchReal('http://127.0.0.1:' + PUERTO + '/gemini/diag')).json();
const BAJA = ['gemini-2.5-flash', 'gemini-2.5-pro'];   // se dan de baja el 1/12/2026
ok('A1 el modelo por defecto no está dado de baja', !BAJA.includes(diag.modeloPorDefecto), diag.modeloPorDefecto);
ok('A2 el modelo de los bots (WhatsApp/mail) tampoco', !BAJA.includes(diag.modeloDeLosBots), diag.modeloDeLosBots);
ok('A3 /gemini/diag dice la clave y el pensamiento de cada modelo', diag.keyCargada === true && diag.pensamientoPorModelo['gemini-3.5-flash-lite'] === 'nivel minimal', JSON.stringify(diag.pensamientoPorModelo));
ok('A4 sin GEMINI_MODEL no hay aviso de modelo fijado', diag.modeloFijadoEnRailway === null && diag.avisoModeloFijado === null, JSON.stringify([diag.modeloFijadoEnRailway, diag.avisoModeloFijado]));

// ═════════ B: a cada familia, el campo que ESA familia acepta ═════════
const casos = [
  ['gemini-3.6-flash',       { thinkingLevel: 'minimal' }],
  ['gemini-3.5-flash-lite',  { thinkingLevel: 'minimal' }],
  ['gemini-3.8-flash',       { thinkingLevel: 'low' }],      // 3.8 no acepta «minimal»
  ['gemini-4-neon',          { thinkingLevel: 'low' }],      // la familia 4 tampoco
  ['gemini-3.1-pro-preview', { thinkingLevel: 'low' }],      // los pro sólo low/medium/high
  ['gemini-2.5-flash-lite',  { thinkingBudget: 0 }],         // 2.5 usa presupuesto
];
for (const [m, esperado] of casos) {
  const r = await pedir({ model: m, body: body1() });
  ok('B ' + m + ' → ' + JSON.stringify(esperado), JSON.stringify(pensarDe(r.pedidos[0])) === JSON.stringify(esperado), JSON.stringify(pensarDe(r.pedidos[0])));
}
const rDesc = await pedir({ model: 'modelo-que-no-existe-todavia', body: body1() });
ok('B7 un modelo desconocido no recibe ningún campo de pensamiento', pensarDe(rDesc.pedidos[0]) === null, JSON.stringify(pensarDe(rDesc.pedidos[0])));

// ═════════ C: una app VIEJA (en la caché del celular) queda protegida ═════════
// Hasta la v597 la app mandaba thinkingBudget:0 a cualquier modelo. A un Gemini 3 ese campo
// no le dice nada: pensaría a nivel medio (lento) sin que nadie se enterara.
const rViejo = await pedir({ model: 'gemini-3.6-flash', body: body1({ thinkingConfig: { thinkingBudget: 0 } }) });
ok('C1 thinkingBudget:0 a un Gemini 3 se traduce a nivel minimal', JSON.stringify(pensarDe(rViejo.pedidos[0])) === '{"thinkingLevel":"minimal"}', JSON.stringify(pensarDe(rViejo.pedidos[0])));
const rViejoPresu = await pedir({ model: 'gemini-3.8-flash', body: body1({ thinkingConfig: { thinkingBudget: 512 } }) });
ok('C2 un presupuesto > 0 (el viejo 2.5-pro) pasa al nivel más bajo que igual piensa', JSON.stringify(pensarDe(rViejoPresu.pedidos[0])) === '{"thinkingLevel":"low"}', JSON.stringify(pensarDe(rViejoPresu.pedidos[0])));
const rOk25 = await pedir({ model: 'gemini-2.5-flash-lite', body: body1({ thinkingConfig: { thinkingBudget: 0 } }) });
ok('C3 en 2.5 el campo es el correcto: se respeta tal cual', JSON.stringify(pensarDe(rOk25.pedidos[0])) === '{"thinkingBudget":0}', JSON.stringify(pensarDe(rOk25.pedidos[0])));
const rNivelApp = await pedir({ model: 'gemini-3.6-flash', body: body1({ thinkingConfig: { thinkingLevel: 'high' } }) });
ok('C4 si la app pide un nivel a propósito, el servidor no lo baja', JSON.stringify(pensarDe(rNivelApp.pedidos[0])) === '{"thinkingLevel":"high"}', JSON.stringify(pensarDe(rNivelApp.pedidos[0])));
const rSinGC = await pedir({ model: 'gemini-3.6-flash', body: { contents: [{ parts: [{ text: 'hola' }] }] } });
ok('C5 un pedido sin generationConfig igual sale con el pensamiento mínimo', JSON.stringify(pensarDe(rSinGC.pedidos[0])) === '{"thinkingLevel":"minimal"}', JSON.stringify(pensarDe(rSinGC.pedidos[0])));
ok('C6 los campos de siempre no se tocan', (rViejo.pedidos[0].cuerpo.generationConfig || {}).maxOutputTokens === 2048 && rViejo.pedidos[0].cuerpo.contents.length === 1, JSON.stringify(rViejo.pedidos[0].cuerpo.generationConfig));

// ═════════ D: si Gemini rechaza el campo, se reintenta SIN él (lento es mejor que roto) ═════════
respuesta = (n) => n === 1
  ? { ok: false, status: 400, body: { error: { message: 'Invalid JSON payload received. Unknown name "thinkingLevel" at generation_config.' } } }
  : { ok: true, status: 200, body: { candidates: [{ content: { parts: [{ text: 'anduvo' }] } }] } };
const rRetry = await pedir({ model: 'gemini-3.6-flash', body: body1() });
ok('D1 reintenta una segunda vez', rRetry.pedidos.length === 2, rRetry.pedidos.length);
ok('D2 el reintento va sin thinkingConfig', rRetry.pedidos.length === 2 && pensarDe(rRetry.pedidos[1]) === null, JSON.stringify(rRetry.pedidos[1] && pensarDe(rRetry.pedidos[1])));
ok('D3 y la app recibe la respuesta buena, no el error', rRetry.status === 200 && JSON.stringify(rRetry.datos).includes('anduvo'), rRetry.status + ' ' + JSON.stringify(rRetry.datos).slice(0, 90));
// Un error que NO es del pensamiento no se reintenta (no hay que gastar dos llamadas ni dos cuotas).
respuesta = () => ({ ok: false, status: 429, body: { error: { message: 'Resource has been exhausted (quota).' } } });
const rCuota = await pedir({ model: 'gemini-3.6-flash', body: body1() });
ok('D4 un error de cuota no se reintenta y llega tal cual', rCuota.pedidos.length === 1 && rCuota.status === 429, rCuota.pedidos.length + ' · ' + rCuota.status);
respuesta = () => ({ ok: true, status: 200, body: { candidates: [{ content: { parts: [{ text: '{"ok":1}' }] } }] } });

// ═════════ E: se puede medir (era «está lento» sin número) ═════════
const rMedir = await pedir({ model: 'gemini-3.6-flash', body: body1() });
ok('E1 la respuesta trae el modelo y los milisegundos en cabeceras', rMedir.cabeceras['x-gemini-modelo'] === 'gemini-3.6-flash' && /^\d+$/.test(rMedir.cabeceras['x-gemini-ms'] || ''), JSON.stringify([rMedir.cabeceras['x-gemini-modelo'], rMedir.cabeceras['x-gemini-ms']]));
ok('E2 y la respuesta de Gemini llega intacta (la app lee `candidates`)', !!(rMedir.datos.candidates && rMedir.datos.candidates[0]), JSON.stringify(rMedir.datos).slice(0, 80));

// ═════════ F: las dos variables de Railway ═════════
process.env.GEMINI_MODEL = 'gemini-3.5-flash-lite';
const rFijado = await pedir({ model: 'gemini-3.6-flash', body: body1() });
ok('F1 GEMINI_MODEL pisa el modelo que pide la app', rFijado.pedidos[0].modelo === 'gemini-3.5-flash-lite', rFijado.pedidos[0].modelo);
const diagFijado = await (await fetchReal('http://127.0.0.1:' + PUERTO + '/gemini/diag')).json();
ok('F2 y el diagnóstico AVISA que el selector de Config no tiene efecto', /no tiene efecto/.test(diagFijado.avisoModeloFijado || ''), String(diagFijado.avisoModeloFijado).slice(0, 60));
delete process.env.GEMINI_MODEL;
process.env.GEMINI_THINKING = 'default';
const rDefault = await pedir({ model: 'gemini-3.6-flash', body: body1({ thinkingConfig: { thinkingBudget: 0 } }) });
ok('F3 GEMINI_THINKING=default deja decidir a Google (no manda nada)', pensarDe(rDefault.pedidos[0]) === null, JSON.stringify(pensarDe(rDefault.pedidos[0])));
process.env.GEMINI_THINKING = 'high';
const rAlto = await pedir({ model: 'gemini-3.6-flash', body: body1() });
ok('F4 GEMINI_THINKING=high fuerza ese nivel', JSON.stringify(pensarDe(rAlto.pedidos[0])) === '{"thinkingLevel":"high"}', JSON.stringify(pensarDe(rAlto.pedidos[0])));
delete process.env.GEMINI_THINKING;

// ═════════ H: «¿ya redesplegó Railway?» desde el navegador, sin token ═════════
const raiz = await (await fetchReal('http://127.0.0.1:' + PUERTO + '/')).json();
ok('H1 la raíz (sin auth) dice qué modelo de IA usa el backend', raiz.ia && raiz.ia.modelo === diag.modeloPorDefecto, JSON.stringify(raiz));
ok('H2 y cuánto piensa', raiz.ia && raiz.ia.razonamiento === 'nivel minimal', JSON.stringify(raiz.ia));
ok('H3 no filtra nada secreto', !/AIza|key|token|secret/i.test(JSON.stringify(raiz)), JSON.stringify(raiz));

// ═════════ G: los asistentes que viven en el backend (WhatsApp y mail) ═════════
const srv = await import('fs');
const fuente = srv.readFileSync(path.join(ROOT, 'functions/server.js'), 'utf8');
ok('G1 ningún modelo dado de baja quedó escrito a mano en el backend', !/['"]gemini-2\.5-(flash|pro)['"]/.test(fuente), (fuente.match(/['"]gemini-2\.5-[a-z]*['"]/g) || []).join(' '));
ok('G2 WhatsApp y el mail bot pasan por la tabla de pensamiento', (fuente.match(/_iaAjustarPensar\(IA_MODELO_BOT/g) || []).length === 2, (fuente.match(/_iaAjustarPensar\(IA_MODELO_BOT/g) || []).length);

const fallas = res.filter(r => r[0] !== 'OK ');
console.log(res.map(r => r[0] + ' · ' + r[1] + (r[2] ? '   → ' + r[2] : '')).join('\n'));
console.log('\n' + res.length + ' chequeos · ' + (fallas.length ? '❌ ' + fallas.length + ' FALLAS' : '✅ todo bien'));
process.exit(fallas.length ? 1 : 0);
