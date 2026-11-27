// La app (index.html): UNA sola lista de modelos de IA y el «pensamiento» mínimo que acepta cada familia.
// Antes había ocho copias de la lista y de la línea que apaga el pensamiento, con modelos que Google
// da de baja el 1/12/2026. Corre contra la demo (base en memoria).
// Uso: node demo/pruebas/ia-modelo-pensar.mjs    (ver README: hace falta bajar-cdn.sh antes)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { abrirDemo, entrarAlSistema } from './demo-lib.mjs';
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.ROOT || path.resolve(AQUI, '../..');
const { b, p, errores } = await abrirDemo();
const res = [];
const ok = (n, c, x) => res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]);
await entrarAlSistema(p);
await p.evaluate(() => { window.__alerts = []; window.alert = m => window.__alerts.push(String(m)); window.confirm = () => true; });

// Modelos con baja anunciada por Google: los pedidos se redirigen solos a otro modelo (que piensa
// a nivel medio, o sea: lento) y se cobran a otra tarifa. No pueden quedar en el código.
const BAJA_1_12_2026 = ['gemini-2.5-flash', 'gemini-2.5-pro'];

// ═════════ A: la tabla de pensamiento, familia por familia ═════════
// Mandarle a un modelo el campo de otra familia es un error que deja sin IA a la pantalla entera,
// así que cada familia tiene que recibir exactamente el suyo.
const pensar = (m) => p.evaluate(m => JSON.stringify(_iaPensarMinimo(m)), m);
const casos = [
  ['gemini-3.6-flash',       '{"thinkingLevel":"minimal"}'],
  ['gemini-3.5-flash-lite',  '{"thinkingLevel":"minimal"}'],
  ['gemini-3-flash-preview', '{"thinkingLevel":"minimal"}'],
  ['gemini-3.8-flash',       '{"thinkingLevel":"low"}'],       // 3.8 no acepta «minimal»
  ['gemini-4-neon',          '{"thinkingLevel":"low"}'],       // la familia 4 tampoco
  ['gemini-4-carbon',        '{"thinkingLevel":"low"}'],
  ['gemini-3.1-pro-preview', '{"thinkingLevel":"low"}'],       // los pro sólo low/medium/high
  ['gemini-2.5-flash-lite',  '{"thinkingBudget":0}'],          // 2.5 usa presupuesto, no nivel
  ['gemini-2.5-flash',       '{"thinkingBudget":0}'],
  ['modelo-nuevo-de-2027',   'null'],                          // desconocido: decide Google
  ['',                       'null'],
];
for (const [m, esperado] of casos) {
  const r = await pensar(m);
  ok('A ' + (m || '(vacío)') + ' → ' + esperado, r === esperado, r);
}

// ═════════ B: las dos listas de modelos ═════════
const listas = await p.evaluate(() => ({ lectura: IA_MODELOS_LECTURA.slice(), chat: IA_MODELOS_CHAT.slice() }));
ok('B1 la lista de lectura no tiene ningún modelo dado de baja', !listas.lectura.some(m => BAJA_1_12_2026.includes(m)), listas.lectura.join(' '));
ok('B2 la del asistente tampoco (usaba gemini-2.5-pro)', !listas.chat.some(m => BAJA_1_12_2026.includes(m)), listas.chat.join(' '));
ok('B3 las dos arrancan con un modelo al que se le puede apagar el pensamiento', ['{"thinkingLevel":"minimal"}', '{"thinkingBudget":0}'].includes(await pensar(listas.lectura[0])) && ['{"thinkingLevel":"minimal"}', '{"thinkingBudget":0}'].includes(await pensar(listas.chat[0])), listas.lectura[0] + ' / ' + listas.chat[0]);
ok('B4 hay plan B: más de un modelo en cada lista', listas.lectura.length >= 2 && listas.chat.length >= 2, listas.lectura.length + ' / ' + listas.chat.length);
ok('B5 el último de cada lista es un modelo que Google NO dio de baja (para no quedar sin IA)', listas.lectura[listas.lectura.length - 1] === 'gemini-2.5-flash-lite' && listas.chat[listas.chat.length - 1] === 'gemini-2.5-flash-lite', listas.lectura.slice(-1) + ' / ' + listas.chat.slice(-1));

// ═════════ C: _iaGenConfig = los campos de siempre + el pensamiento de ESE modelo ═════════
const gen = (m, extra) => p.evaluate(({ m, extra }) => JSON.stringify(_iaGenConfig(m, extra)), { m, extra });
ok('C1 conserva temperature y maxOutputTokens', await gen('gemini-3.6-flash', { temperature: 0, maxOutputTokens: 8192 }) === '{"temperature":0,"maxOutputTokens":8192,"thinkingConfig":{"thinkingLevel":"minimal"}}', await gen('gemini-3.6-flash', { temperature: 0, maxOutputTokens: 8192 }));
ok('C2 a un modelo desconocido no le agrega nada', await gen('otro-modelo', { temperature: 0 }) === '{"temperature":0}', await gen('otro-modelo', { temperature: 0 }));
ok('C3 no modifica el objeto que recibe', await p.evaluate(() => { const x = { temperature: 0 }; _iaGenConfig('gemini-3.6-flash', x); return JSON.stringify(x); }) === '{"temperature":0}', 'mutó el objeto');
ok('C4 sin extra devuelve sólo el pensamiento', await gen('gemini-3.8-flash', null) === '{"thinkingConfig":{"thinkingLevel":"low"}}', await gen('gemini-3.8-flash', null));

// ═════════ D: el modelo elegido a mano va primero y el resto queda de respaldo ═════════
const modelos = (v) => p.evaluate(v => { if (v === null) localStorage.removeItem('rk_ia_modelo'); else localStorage.setItem('rk_ia_modelo', v); return _iaModelos(IA_MODELOS_LECTURA).join(','); }, v);
ok('D1 sin elección, la lista de la app tal cual', await modelos(null) === listas.lectura.join(','), await modelos(null));
ok('D2 «auto» es lo mismo que nada', await modelos('auto') === listas.lectura.join(','), await modelos('auto'));
ok('D3 vacío también', await modelos('') === listas.lectura.join(','), await modelos(''));
const conElegido = await modelos('gemini-3.8-flash');
ok('D4 el elegido va PRIMERO', conElegido.split(',')[0] === 'gemini-3.8-flash', conElegido);
ok('D5 y los de la app quedan detrás como respaldo', conElegido.split(',').length === listas.lectura.length + 1, conElegido);
const yaEnLista = await modelos(listas.lectura[1]);
ok('D6 elegir uno que ya está en la lista no lo repite', yaEnLista.split(',').filter(m => m === listas.lectura[1]).length === 1, yaEnLista);
await modelos(null);

// ═════════ E: lo que la app le manda DE VERDAD a Gemini al leer una factura ═════════
// Es el camino más usado (📄 Leer factura con IA). Se espía `_geminiProxy` y se le devuelve una
// respuesta armada, así se ve el modelo y el generationConfig exactos que salieron.
await p.evaluate(() => {
  window.__ia = [];
  window._geminiProxy = function (model, body) {
    window.__ia.push({ model: model, gen: JSON.parse(JSON.stringify(body.generationConfig || {})) });
    return Promise.resolve({ ok: true, json: () => Promise.resolve({ candidates: [{ content: { parts: [{ text: JSON.stringify({ proveedor: 'Probando IA SRL', numero: '0001-00000001', fecha: '2026-11-20', importe: 1210, moneda: 'ARS', tipoComprobante: 'A', items: [] }) }] } }] }) });
  };
});
const leerFactura = await p.evaluate(async () => {
  const f = new File([new Uint8Array([37, 80, 68, 70])], 'factura.pdf', { type: 'application/pdf' });
  const est = document.getElementById('leerFactEstado') || document.createElement('div');
  est.id = 'leerFactEstado'; if (!est.parentNode) document.body.appendChild(est);
  try { await procesarFacturaPDF(f); } catch (e) { return { error: String(e && e.message || e) }; }
  return { pedidos: window.__ia.slice() };
});
const pedido1 = (leerFactura.pedidos || [])[0];
ok('E1 «Leer factura con IA» llamó a Gemini', !!pedido1, JSON.stringify(leerFactura).slice(0, 160));
ok('E2 con el modelo de la lista (no uno dado de baja)', !!pedido1 && pedido1.model === listas.lectura[0] && !BAJA_1_12_2026.includes(pedido1.model), pedido1 && pedido1.model);
ok('E3 y con el pensamiento mínimo de ESA familia', !!pedido1 && JSON.stringify(pedido1.gen.thinkingConfig) === '{"thinkingLevel":"minimal"}', pedido1 && JSON.stringify(pedido1.gen));
ok('E4 sin el campo viejo thinkingBudget, que a un Gemini 3 no le dice nada', !!pedido1 && pedido1.gen.thinkingConfig && pedido1.gen.thinkingConfig.thinkingBudget === undefined, pedido1 && JSON.stringify(pedido1.gen.thinkingConfig));
ok('E5 y con el presupuesto de salida de siempre (el JSON no se corta)', !!pedido1 && pedido1.gen.maxOutputTokens === 8192 && pedido1.gen.temperature === 0, pedido1 && JSON.stringify(pedido1.gen));
// Con un modelo elegido a mano, la misma pantalla tiene que usar ESE.
const leerConElegido = await p.evaluate(async () => {
  localStorage.setItem('rk_ia_modelo', 'gemini-2.5-flash-lite');
  window.__ia = [];
  const f = new File([new Uint8Array([37, 80, 68, 70])], 'factura.pdf', { type: 'application/pdf' });
  try { await procesarFacturaPDF(f); } catch (e) {}
  localStorage.removeItem('rk_ia_modelo');
  return window.__ia.slice();
});
ok('E6 el modelo elegido en Config manda en la pantalla de lectura', (leerConElegido[0] || {}).model === 'gemini-2.5-flash-lite', JSON.stringify(leerConElegido[0] || {}));
ok('E7 y le va el campo de SU familia (presupuesto, no nivel)', JSON.stringify(((leerConElegido[0] || {}).gen || {}).thinkingConfig) === '{"thinkingBudget":0}', JSON.stringify((leerConElegido[0] || {}).gen || {}));

// ═════════ F: Config → ⚡ Modelo de Gemini ═════════
await p.evaluate(() => mostrarTab('Config'));
await p.waitForTimeout(300);
const ui = await p.evaluate(() => {
  const sel = document.getElementById('cfgIaModelo');
  return { hay: !!sel, opciones: sel ? Array.from(sel.options).map(o => o.value) : [], visible: sel ? !!(sel.offsetWidth || sel.offsetHeight) : false };
});
ok('F1 el selector de modelo existe y se ve en Config', ui.hay && ui.visible, JSON.stringify(ui).slice(0, 120));
ok('F2 arranca en «Automático»', ui.opciones[0] === 'auto', ui.opciones.join(' '));
ok('F3 ninguna opción ofrece un modelo dado de baja', !ui.opciones.some(o => BAJA_1_12_2026.includes(o)), ui.opciones.join(' '));
const guardado = await p.evaluate(async () => {
  const sel = document.getElementById('cfgIaModelo');
  sel.value = 'gemini-3.5-flash-lite'; guardarIaModelo();
  await new Promise(r => setTimeout(r, 150));
  const nube = await db.ref('global/config/iaModelo').once('value');
  return { ls: localStorage.getItem('rk_ia_modelo'), nube: nube.val(), txt: (document.getElementById('cfgIaModeloStatus') || {}).textContent || '' };
});
ok('F4 guardar deja el modelo en este dispositivo', guardado.ls === 'gemini-3.5-flash-lite', guardado.ls);
ok('F5 y en la nube, para todos los dispositivos', guardado.nube === 'gemini-3.5-flash-lite', guardado.nube);
ok('F6 el cartel dice qué modelo usa y cuánto piensa', /gemini-3\.5-flash-lite/.test(guardado.txt) && /minimal/.test(guardado.txt), guardado.txt.slice(0, 110));
const vueltaAuto = await p.evaluate(async () => {
  const sel = document.getElementById('cfgIaModelo');
  sel.value = 'auto'; guardarIaModelo();
  await new Promise(r => setTimeout(r, 150));
  const nube = await db.ref('global/config/iaModelo').once('value');
  return { ls: localStorage.getItem('rk_ia_modelo'), nube: nube.val(), txt: (document.getElementById('cfgIaModeloStatus') || {}).textContent || '' };
});
ok('F7 volver a «Automático» borra la elección acá y en la nube', !vueltaAuto.ls && vueltaAuto.nube === null, JSON.stringify(vueltaAuto).slice(0, 110));
ok('F8 y el cartel vuelve a nombrar el modelo de la app', vueltaAuto.txt.includes(listas.lectura[0]), vueltaAuto.txt.slice(0, 110));
const conValorRaro = await p.evaluate(async () => {
  localStorage.setItem('rk_ia_modelo', 'gemini-9-inventado');
  cargarIaModeloUI();
  await new Promise(r => setTimeout(r, 150));
  const sel = document.getElementById('cfgIaModelo');
  const r = { valor: sel.value, opciones: Array.from(sel.options).map(o => o.value), txt: (document.getElementById('cfgIaModeloStatus') || {}).textContent || '' };
  localStorage.removeItem('rk_ia_modelo');
  return r;
});
ok('F9 un modelo cargado a mano que no está en la lista igual se muestra', conValorRaro.valor === 'gemini-9-inventado' && conValorRaro.opciones.includes('gemini-9-inventado'), JSON.stringify(conValorRaro).slice(0, 140));
ok('F10 y el cartel avisa que el razonamiento lo decide Google', /decida Google/.test(conValorRaro.txt), conValorRaro.txt.slice(0, 110));

// ═════════ G: que no queden copias sueltas en el código ═════════
const fuente = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const sueltos = (fuente.match(/['"]gemini-[0-9][^'"]*['"]/g) || []).filter(m => !/2\.5-flash-lite|3\.5-flash-lite|3\.6-flash|3\.8-flash/.test(m));
ok('G1 no hay modelos escritos a mano fuera de las dos listas y del selector', sueltos.length === 0, sueltos.join(' '));
const enListas = (fuente.match(/IA_MODELOS_(LECTURA|CHAT)\s*=/g) || []).length;
ok('G2 las listas se declaran una sola vez cada una', enListas === 2, enListas);
ok('G3 ninguna pantalla arma el thinkingConfig por su cuenta', !/thinkingConfig = \{ thinkingBudget/.test(fuente) && (fuente.match(/thinkingBudget/g) || []).length <= 3, (fuente.match(/thinkingBudget/g) || []).length);
const llamadas = (fuente.match(/_iaGenConfig\(/g) || []).length;
ok('G4 las pantallas de lectura pasan por _iaGenConfig (6 pantallas + el asistente)', llamadas >= 8, llamadas);
ok('G5 el final-obra tampoco pide un modelo dado de baja', !/['"]gemini-2\.5-(flash|pro)['"]/.test(fs.readFileSync(path.join(ROOT, 'final-obra/index.html'), 'utf8')), 'quedó el modelo viejo');

const fallas = res.filter(r => r[0] !== 'OK ');
console.log(res.map(r => r[0] + ' · ' + r[1] + (r[2] ? '   → ' + r[2] : '')).join('\n'));
if (errores.length) console.log('\nErrores de JS en la página:\n' + errores.slice(0, 6).join('\n'));
console.log('\n' + res.length + ' chequeos · ' + (fallas.length ? '❌ ' + fallas.length + ' FALLAS' : '✅ todo bien'));
await b.close();
process.exit(fallas.length || errores.length ? 1 : 0);
