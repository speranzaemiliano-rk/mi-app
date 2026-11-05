// Texto libre de los movimientos (descripción, origen, nombre de cuenta, referencia, proveedor…) en las listas de Caja y Bancos, Ingresos, Egresos y Pagos:
// tiene que verse LITERAL (nunca interpretarse como HTML), tanto en el cuerpo de la celda como en los atributos title= y en los onclick con ids.
// Un movimiento con '<img src=x onerror=…>' o con comillas rompía la tabla o ejecutaba script. Corre contra la demo. Uso: node escapar-movimientos.mjs
import { abrirDemo, entrarAlSistema, irA } from './demo-lib.mjs';
const { b, p, errores } = await abrirDemo();
const res = [];
const ok = (n, c, x) => res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]);
await entrarAlSistema(p);

// Texto «hostil»: etiqueta, & suelto, comillas dobles y simples, una imagen con onerror, una entidad ya escrita y un intento de inyectar un atributo (sirve para el title="…").
const HPRE = '<b>NEG-', HPOST = '</b> Tom & Jerry "dq" \'sq\' <img src=x onerror=window.__xss=1> &lt;i&gt; " onmouseover="window.__xss=3" x="';
const H = t => HPRE + t + HPOST;
// Ids que intentan cortar un onclick="f('ID')": cada uno marca un window.__xss distinto si se ejecuta.
const ID = { emit: "emi');window.__xss=4;('", doc: "doc');window.__xss=5;('", pago: "pg');window.__xss=6;('", grupo: "gr');window.__xss=7;('", cambio: "cmb');window.__xss=8;('",
  comp: "cmp');window.__xss=9;('", nomComp: "nom');window.__xss=10;('", ddjj: "dj');window.__xss=11;('", nomDdjj: "nd');window.__xss=12;('" };

await p.evaluate(({ pre, post }) => {
  window.__alerts = []; window.alert = m => window.__alerts.push(String(m)); window.confirm = () => false;
  window._imprimirDocHTML = h => { window.__html = h; };
  window.__H = t => pre + t + post;   // el mismo texto hostil que arma Node
}, { pre: HPRE, post: HPOST });
const hoy = await p.evaluate(() => _hoyLocalISO());

await p.evaluate(({ ID, hoy }) => {
  const H = window.__H;
  const emp = empresas && empresas[0];
  if (emp) emp.nombre = H('EMPNOM');
  cuentasBancarias.push({ id: 'CB-HOSTIL', banco: H('BANCO'), tipo: H('CTATIPO'), alias: H('ALIAS'), cbu: '0123456789012345678901', moneda: 'ARS', saldo: 0, empresaId: emp ? emp.id : '' });
  // ── Movimientos manuales (ingGeneral) ──
  const ing = (o) => ingGeneral.push(Object.assign({ fecha: hoy, moneda: 'ARS', monto: 100 }, o));
  ing({ id: 'h_caja_ing', tipo: 'otro', origen: H('CAJAING'), referencia: H('CAJAINGREF'), obs: H('CAJAINGOBS') });
  ing({ id: 'h_caja_egr', tipo: 'mov_egreso_caja', origen: H('CAJAEGR') });
  ing({ id: 'h_tipo_raro', tipo: H('TIPORARO'), origen: 'mov con tipo hostil' });
  ing({ id: 'h_tipo_egr', tipo: H('TIPOEGR'), esEgreso: true, origen: 'egreso con tipo hostil' });
  ing({ id: 'h_banco_ent', tipo: 'mov_banco_entrada', esBancario: true, tipoAB: 'A', cuentaId: 'CB-HOSTIL', medio: H('BEMEDIO'), origen: H('BANCOENT'), origenDest: H('BANCODEST') });
  ing({ id: 'h_usd', tipo: 'otro', moneda: 'USD', origen: H('USDING') });
  ing({ id: 'h_emit', tipo: 'otro', origen: 'mov con id de emitido hostil', origenEmitidoId: ID.emit });
  ing({ id: 'h_banco_emit', tipo: 'mov_banco_entrada', esBancario: true, tipoAB: 'A', cuentaId: 'CB-HOSTIL', origen: 'banco con id de emitido hostil', origenEmitidoId: ID.emit });
  ing({ id: 'h_confid', tipo: 'otro', origen: H('SECRETO'), confidencial: true });
  // Operación de cambio de dólares con id hostil
  ing({ id: ID.cambio + '-USD', tipo: 'mov_egreso_caja', moneda: 'USD', origen: 'cambio', esCambio: true, cambioId: ID.cambio, fxOp: 'venta', fxTC: 1000, fxNota: H('FXNOTA'), fxContra: H('FXCONTRA') });
  ing({ id: ID.cambio + '-ARS', tipo: 'mov_ingreso_caja', moneda: 'ARS', origen: 'cambio', esCambio: true, cambioId: ID.cambio, fxOp: 'venta', fxTC: 1000, fxNota: H('FXNOTA'), fxContra: H('FXCONTRA') });
  // ── Presupuesto con un pago en efectivo y otro por banco ──
  const d0 = JSON.parse(JSON.stringify(datos.find(d => (d.pagosHistorial || []).length)));
  d0.id = 'h_pre'; d0.proveedor = H('PREPROV'); d0.concepto = H('PRECONC'); d0.pagosHistorial = [
    { pagoId: 'h_pre_p1', fecha: hoy, modalidad: 'B', capital: 10, mayores: 0 },
    { pagoId: 'h_pre_p2', fecha: hoy, modalidad: 'A', capital: 20, mayores: 0, cuentaId: 'CB-HOSTIL', medioBancario: 'Transferencia' }];
  d0.pagado = 30; d0.presupuesto = 1000; d0.pagadoPresupuesto = 30; d0.pagadoMayores = 0;
  datos.push(d0);
  // ── Factura con un pago por banco (medio hostil) y uno en efectivo ──
  facturas.push({ id: 'h_fact', proveedor: H('FACTPROV'), numero: '0001-1', fecha: hoy, descripcion: H('FACTDESC'), importe: 1000, moneda: 'ARS', pagado: 70, estado: 'parcial', pagosHistorial: [
    { pagoId: 'h_f_p1', fecha: hoy, modalidad: 'A', monto: 50, cuentaId: 'CB-HOSTIL', medioBancario: H('FACTMEDIO'), totalRet: 0 },
    { pagoId: 'h_f_p2', fecha: hoy, modalidad: 'B', monto: 20, totalRet: 0 }] });
  // ── Documento recibido con ids hostiles (los usa el onclick de los botones) ──
  documentos.push({ id: ID.doc, proveedor: H('DOCPROV'), numero: '9', fecha: hoy, descripcion: H('DOCDESC'), importe: 100, moneda: 'ARS', pagado: 30, tipo: 'vep', pagosHistorial: [
    { pagoId: ID.pago, fecha: hoy, modalidad: 'B', monto: 30, totalRet: 0, grupoPagoId: ID.grupo,
      comprobanteId: ID.comp, comprobanteNombre: ID.nomComp, ddjjId: ID.ddjj, ddjjNombre: ID.nomDdjj }] });
  // ── Cobros: venta, alquiler y servicio con texto hostil, uno por banco y uno en efectivo ──
  const v0 = JSON.parse(JSON.stringify(ventas.find(v => (v.cobrosHistorial || []).length)));
  v0.id = 'h_venta'; v0.uf = H('VENTAUF'); v0.tipo = H('VENTATIPO'); v0.comprador = H('COMPRADOR');
  v0.cobrosHistorial = [{ fecha: hoy, comp: 'cuota', monto: 11, tipoAB: 'A', cuentaId: 'CB-HOSTIL' }, { fecha: hoy, comp: 'cuota', monto: 12, tipoAB: 'B' }];
  ventas.push(v0);
  const a0 = JSON.parse(JSON.stringify(alquileres.find(a => (a.cobrosHistorial || []).length)));
  a0.id = 'h_alq'; a0.inquilino = H('INQUILINO'); a0.unidad = H('ALQUNIDAD'); a0.direccion = H('ALQDIR');
  a0.cobrosHistorial = [{ fecha: hoy, monto: 21, concepto: 'alquiler', periodo: hoy.slice(0, 7), tipoAB: 'A', cuentaId: 'CB-HOSTIL' }, { fecha: hoy, monto: 22, concepto: 'alquiler', periodo: hoy.slice(0, 7), tipoAB: 'B' }];
  alquileres.push(a0);
  const s0 = JSON.parse(JSON.stringify(servicios.find(s => (s.cobrosHistorial || []).length)));
  s0.id = 'h_serv'; s0.cliente = H('CLISERV'); s0.descripcion = H('SERVDESC');
  s0.cobrosHistorial = [{ fecha: hoy, monto: 31, tipoAB: 'A', cuentaId: 'CB-HOSTIL' }, { fecha: hoy, monto: 32, tipoAB: 'B' }];
  servicios.push(s0);
}, { ID, hoy });

const limpiar = ids => p.evaluate(ids => ids.forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; }), ids);
// Cada pantalla se repinta con la marca de «se ejecutó script» en blanco: así una falla no contamina a las pantallas que siguen.
const pintar = fn => p.evaluate(fn => { delete window.__xss; (new Function(fn))(); }, fn);
// Revisa un tbody: no se inyectó nada (ni <img>, ni <b>, ni atributos de evento) y cada texto aparece LITERAL (una sola vez escapado: «Tom & Jerry», no «Tom &amp; Jerry»).
async function revisar(nombre, tbodyId, tags) {
  await p.waitForTimeout(500);   // deja que dispare un onerror, si lo hubiera
  const r = await p.evaluate(({ tbodyId, tags }) => {
    const tb = document.getElementById(tbodyId), H = window.__H;
    if (!tb) return { existe: false };
    return {
      existe: true,
      imgs: tb.querySelectorAll('img').length,
      bs: [...tb.querySelectorAll('b')].filter(x => /^NEG-/.test(x.textContent)).length,
      evt: tb.querySelectorAll('[onmouseover],[onerror]').length,
      faltan: tags.filter(t => !tb.textContent.includes(H(t))),
      xss: window.__xss,
    };
  }, { tbodyId, tags });
  ok(nombre + ': la tabla existe', r.existe, tbodyId);
  if (!r.existe) return;
  ok(nombre + ': no se inyectó ninguna imagen ni etiqueta <b>', r.imgs === 0 && r.bs === 0, JSON.stringify(r));
  ok(nombre + ': no se coló ningún atributo de evento (onmouseover/onerror)', r.evt === 0, JSON.stringify(r));
  ok(nombre + ': todos los textos libres se ven literales (' + tags.length + ')', r.faltan.length === 0, 'faltan: ' + r.faltan.join(', '));
  ok(nombre + ': no se ejecutó script (window.__xss sin definir)', r.xss === undefined, String(r.xss));
}
// title= de las celdas: tiene que valer EXACTAMENTE el texto (si no, las comillas cortaron el atributo)
async function revisarTitle(nombre, tbodyId, tag) {
  const r = await p.evaluate(({ tbodyId, tag }) => {
    const tb = document.getElementById(tbodyId), H = window.__H;
    const hit = [...tb.querySelectorAll('[title]')].filter(x => x.getAttribute('title') === H(tag));
    return { n: hit.length };
  }, { tbodyId, tag });
  ok(nombre + ': el title= de la celda lleva el texto completo y literal', r.n > 0, JSON.stringify(r));
}
// Botones de acción: stubs que anotan los argumentos con que se los llama; el id hostil tiene que llegar ENTERO y sin ejecutar nada.
await p.evaluate(() => {
  window.__llamadas = [];
  ['_verOrigenMovimiento', '_editarOrigenMovimiento', '_borrarMovConPin', 'cgDesaplicarMov', 'imprimirPagoDoc', 'abrirEditarPago', 'fxEliminar', 'abrirModalEmitir', 'descargarDoc', 'adjuntarCompPago'].forEach(f => {
    window[f] = function () { window.__llamadas.push([f, [].slice.call(arguments)]); };
  });
});
async function clicBotones(nombre, tbodyId, esperados) {
  // Se hace clic sólo en los botones cuyo onclick lleva un id hostil (los demás abren modales reales que acá no interesan).
  // esperados: [[funcion, [args…]], …] — cada llamada tiene que haber ocurrido con el id ENTERO.
  await p.evaluate(() => { window.__llamadas = []; delete window.__xss; });
  const n = await p.evaluate(tbodyId => { const bs = [...document.getElementById(tbodyId).querySelectorAll('button[onclick]')].filter(b => b.getAttribute('onclick').includes('__xss')); bs.forEach(b => { try { b.click(); } catch (e) {} }); return bs.length; }, tbodyId);
  const ll = await p.evaluate(() => window.__llamadas);
  const xss = await p.evaluate(() => window.__xss);
  ok(nombre + ': hay botones con ids hostiles para probar (' + n + ')', n >= esperados.length, String(n));
  for (const [f, args] of esperados) {
    const hay = ll.some(l => l[0] === f && JSON.stringify(l[1]) === JSON.stringify(args));
    ok(nombre + ': ' + f + '(' + args.map(a => JSON.stringify(a)).join(', ') + ') recibe el id completo', hay, JSON.stringify(ll.filter(l => l[0] === f)).slice(0, 400));
  }
  ok(nombre + ': hacer clic en esos botones no ejecuta el id hostil (window.__xss sin definir)', xss === undefined, String(xss));
}

// ───── Caja General ─────
await irA(p, 'CajaGeneral');
await limpiar(['cgFiltroTipo', 'cgFiltroDesde', 'cgFiltroHasta', 'cgFiltroBusq', 'cgFiltroOrigen', 'cgFiltroMovTipo', 'cgFiltroMedio']);
await pintar('renderCajaGeneral()');
const tagsCG = ['CAJAING', 'CAJAEGR', 'TIPORARO', 'TIPOEGR', 'BANCOENT', 'USDING', 'PREPROV', 'PRECONC', 'FACTPROV', 'FACTDESC', 'DOCPROV', 'DOCDESC', 'COMPRADOR', 'VENTAUF', 'VENTATIPO', 'INQUILINO', 'CLISERV', 'SERVDESC'];
await revisar('Caja General', 'cgBody', tagsCG);
await revisarTitle('Caja General', 'cgBody', 'CAJAING');
await clicBotones('Caja General', 'cgBody', [
  ['_verOrigenMovimiento', ['emitido', ID.emit]], ['_editarOrigenMovimiento', ['emitido', ID.emit]],
  ['_verOrigenMovimiento', ['documento', ID.doc]], ['_editarOrigenMovimiento', ['documento', ID.doc]],
  ['_borrarMovConPin', ['docpago', ID.doc, ID.pago]], ['cgDesaplicarMov', ['doc', ID.doc, 0, ID.grupo]],
]);
// Movimiento confidencial: para quien no es Super Usuario la descripción sigue enmascarada (no se muestra, ni escapada)
await p.evaluate(() => { window.__esSA = esSuperAdmin; esSuperAdmin = false; renderCajaGeneral(); });
{
  const r = await p.evaluate(() => { const t = document.getElementById('cgBody').textContent; return { secreto: t.includes('NEG-SECRETO'), mask: t.includes('Movimiento de caja') }; });
  ok('Caja General: movimiento confidencial sigue enmascarado para quien no es Super Usuario', !r.secreto && r.mask, JSON.stringify(r));
}
await p.evaluate(() => { esSuperAdmin = window.__esSA; renderCajaGeneral(); });
{
  const r = await p.evaluate(() => document.getElementById('cgBody').textContent.includes(window.__H('SECRETO')));
  ok('Caja General: el Super Usuario sí ve el texto confidencial (literal)', r);
}
// El papel impreso sigue escapando UNA sola vez
await p.evaluate(() => { window.__html = ''; cgImprimir(); });
{
  const h = await p.evaluate(() => window.__html);
  const unaVez = await p.evaluate(() => escHtml(window.__H('CAJAING')));
  ok('Libro de caja impreso: sin etiquetas sueltas del texto libre', !/<b>NEG-|<img src=x/.test(h), h.slice(h.indexOf('NEG-CAJAING') - 40, h.indexOf('NEG-CAJAING') + 80));
  ok('Libro de caja impreso: el texto está escapado UNA sola vez (ni crudo ni doble)', h.includes(unaVez) && !h.includes(unaVez.replace(/&/g, '&amp;')), h.slice(h.indexOf('NEG-CAJAING') - 40, h.indexOf('NEG-CAJAING') + 160));
}

// ───── Extracto bancario (y Cuentas Bancarias) ─────
await irA(p, 'CuentasBancarias');
await limpiar(['cbDesde', 'cbHasta', 'cbFiltroTipo', 'cbFiltroDir', 'cbFiltroBusq', 'cbFiltroOrigen', 'cbCuentaFiltro']);
await pintar('renderCuentasBancarias()');
await revisar('Extracto bancario', 'cbExtBody', ['BANCOENT', 'BANCODEST', 'BEMEDIO', 'BANCO', 'PREPROV', 'PRECONC', 'FACTPROV', 'FACTMEDIO', 'COMPRADOR', 'VENTAUF', 'INQUILINO', 'CLISERV', 'SERVDESC']);
await clicBotones('Extracto bancario', 'cbExtBody', [['_verOrigenMovimiento', ['emitido', ID.emit]], ['_editarOrigenMovimiento', ['emitido', ID.emit]]]);
await revisar('Cuentas bancarias (saldos)', 'cbBody', ['BANCO', 'CTATIPO', 'ALIAS', 'EMPNOM']);

// ───── Efectivo en pesos / en dólares (ya escapaban: que siga así) ─────
await irA(p, 'EfectivoPesos');
await limpiar(['efpFiltroDesde', 'efpFiltroHasta', 'efpFiltroTipo', 'efpFiltroDir', 'efpFiltroBusq', 'efpFiltroOrigen']);
await pintar('renderEfectivoPesos()');
await revisar('Efectivo en pesos', 'efpBody', ['CAJAING', 'CAJAEGR', 'TIPORARO', 'PREPROV', 'PRECONC', 'DOCPROV', 'DOCDESC']);
await clicBotones('Efectivo en pesos', 'efpBody', [['_verOrigenMovimiento', ['documento', ID.doc]], ['cgDesaplicarMov', ['doc', ID.doc, 0, ID.grupo]]]);
await irA(p, 'EfectivoUSD');
await limpiar(['efuFiltroDesde', 'efuFiltroHasta', 'efuFiltroTipo', 'efuFiltroDir', 'efuFiltroBusq', 'efuFiltroOrigen']);
await pintar('renderEfectivoUSD()');
await revisar('Efectivo en dólares', 'efuBody', ['USDING']);

// ───── Ingresos generales ─────
await irA(p, 'IngGeneral');
await limpiar(['igBuscador', 'igFiltroTipo', 'igFiltroDesde', 'igFiltroHasta', 'igFiltroMoneda']);
await pintar('renderIngGeneral()');
await revisar('Ingresos generales', 'ingGeneralBody', ['CAJAING', 'CAJAINGREF', 'CAJAINGOBS', 'TIPORARO', 'BANCOENT', 'USDING']);

// ───── Resumen de ingresos ─────
await irA(p, 'ResumenIngresos');
await limpiar(['riFiltroDesde', 'riFiltroHasta', 'riFiltroTipo', 'riFiltroMoneda', 'riBuscador', 'riFiltroOrigen']);
await pintar('renderResumenIngresos()');
await revisar('Resumen de ingresos', 'riDetalleBody', ['CAJAING', 'TIPORARO', 'COMPRADOR', 'VENTAUF', 'VENTATIPO', 'INQUILINO', 'CLISERV', 'SERVDESC']);

// ───── Egresos: detalle de pagos ─────
await irA(p, 'Egresos');
await limpiar(['egresosBuscador', 'egresosFiltroMod', 'egresosFiltroDesde', 'egresosFiltroHasta']);
await pintar('renderDetalleEgresos()');
await revisar('Egresos (detalle de pagos)', 'egresosDetalleBody', ['PREPROV', 'PRECONC', 'FACTPROV', 'FACTDESC', 'DOCPROV', 'DOCDESC', 'CAJAEGR']);
await revisarTitle('Egresos (detalle de pagos)', 'egresosDetalleBody', 'PRECONC');
await revisar('Egresos (por proveedor)', 'egresosBody', ['PREPROV', 'FACTPROV', 'DOCPROV']);

// ───── Pagos a proveedores ─────
await irA(p, 'Pagos');
await limpiar(['pagBuscador', 'pagFiltroMod', 'pagDesde', 'pagHasta']);
await pintar('renderPagos()');
await revisar('Pagos a proveedores', 'pagosBody', ['PREPROV', 'PRECONC', 'FACTPROV', 'DOCPROV']);
await clicBotones('Pagos a proveedores', 'pagosBody', [
  ['imprimirPagoDoc', [ID.doc, 0]], ['abrirEditarPago', ['doc', ID.doc, 0]],
  ['descargarDoc', [ID.comp, ID.nomComp]], ['descargarDoc', [ID.ddjj, ID.nomDdjj]],
  ['adjuntarCompPago', ['doc', ID.doc, 0, null]], ['adjuntarCompPago', ['doc', ID.doc, 0, null, 'ddjj']],
]);

// ───── Compra / venta de dólares ─────
await irA(p, 'CambioUSD');
await limpiar(['fxDesde', 'fxHasta', 'fxFiltroOp']);
await pintar('renderCambioUSD()');
await revisar('Compra / venta USD', 'fxBody', ['FXCONTRA']);
await clicBotones('Compra / venta USD', 'fxBody', [['fxEliminar', [ID.cambio]]]);

// ───── Comprobante impreso de un ingreso general ─────
{
  await p.evaluate(() => {
    window.__escrito = '';
    window.open = () => ({ document: { write: h => { window.__escrito += h; }, close() {} } });
    imprimirComprobanteIngGeneral(ingGeneral.find(x => x.id === 'h_caja_ing'));
  });
  const h = await p.evaluate(() => window.__escrito);
  const esc = async t => await p.evaluate(t => escHtml(window.__H(t)), t);
  ok('Orden de recibo de un ingreso general: sin etiquetas sueltas del texto libre', !/<b>NEG-|<img src=x/.test(h), h.slice(h.indexOf('NEG-CAJAING') - 40, h.indexOf('NEG-CAJAING') + 80));
  for (const t of ['CAJAING', 'CAJAINGREF', 'CAJAINGOBS']) {
    const u = await esc(t);
    ok('Orden de recibo de un ingreso general: ' + t + ' escapado UNA sola vez', h.includes(u) && !h.includes(u.replace(/&/g, '&amp;')), h.slice(h.indexOf('NEG-' + t) - 40, h.indexOf('NEG-' + t) + 160));
  }
}

// Un texto normal sigue viéndose normal (con tildes, ñ, &, comillas): una sola pasada de escape
await p.evaluate(({ hoy }) => { ingGeneral.push({ id: 'h_normal', fecha: hoy, moneda: 'ARS', monto: 5, tipo: 'otro', origen: 'Cuota N° 3 — D\'Angelo & Hijos "SRL" ñandú' }); }, { hoy });
await irA(p, 'CajaGeneral'); await limpiar(['cgFiltroDesde']); await pintar('renderCajaGeneral()');
{
  const t = await p.evaluate(() => document.getElementById('cgBody').textContent);
  ok('Un texto normal con tildes, comilla simple, & y comillas dobles se ve igual que se escribió', t.includes('Cuota N° 3 — D\'Angelo & Hijos "SRL" ñandú'));
}

ok('sin errores de JS durante la prueba', errores.length === 0, errores.slice(0, 4).join(' | '));
const fallas = res.filter(r => r[0] === 'FALLA');
for (const r of res) console.log(r[0], r[1], r[2] ? '→ ' + r[2] : '');
console.log('\n' + (res.length - fallas.length) + '/' + res.length + ' OK');
await b.close();
process.exit(fallas.length ? 1 : 0);
