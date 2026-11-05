// Dos números engañosos: (a) «Disponibles» de Ventas contaba como disponible toda unidad que no estuviera cobrada por completo (incluidas las que ya tienen comprador y
// pagan en cuotas), y salía de restar un número filtrado a uno total; (b) «Cobrado este mes» del Inicio sólo sumaba los cobros de ventas de UF.
// Ahora «Disponibles» = unidades sin comprador, sin cobros y sin venta cerrada (siempre sobre TODAS las UF, no sobre lo filtrado), y «Cobrado este mes» suma lo que
// entró como cobro del mes según la Caja General (ventas + alquileres + honorarios + recibos emitidos que entraron a caja + ingresos generales «Otro»), por moneda.
// Corre contra la demo (base en memoria). Uso: node inicio-ventas-kpis.mjs   (ver README: hace falta bajar-cdn.sh antes)
import { abrirDemo, entrarAlSistema, irA } from './demo-lib.mjs';
const { b, p, errores } = await abrirDemo();
const res = [];
const ok = (n, c, x) => res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]);
await entrarAlSistema(p);
await p.evaluate(() => { window.__alerts = []; window.alert = m => window.__alerts.push(String(m)); });

const num = (s) => parseFloat(String(s).replace(/[^0-9,.-]/g, '').replace(/\./g, '').replace(',', '.'));
const cerca = (x, y, t = 0.011) => Math.abs(x - y) <= t;
const tarjetas = () => p.evaluate(() => ({ tot: Number(document.getElementById('ventasUFTotal').textContent), vend: Number(document.getElementById('ventasUFVendidas').textContent), disp: Number(document.getElementById('ventasUFDisponibles').textContent) }));
// «Cobrado este mes» tal como lo ve la persona (texto de la tarjeta del Inicio): { ars, usd, sub, titulo }
const kpiMes = () => p.evaluate(() => { _hKPIs(); var main = document.getElementById('kpiMesV').textContent, sub = document.getElementById('kpiMesSub').textContent;
  var card = document.getElementById('kpiMesV').closest('.hp-kpi'); return { main: main, sub: sub, titulo: card ? card.getAttribute('title') || '' : '' }; });
const leerKpi = async () => { const k = await kpiMes(); const usdMain = /^USD/.test(k.main);
  const ars = usdMain ? 0 : num(k.main); const usd = usdMain ? num(k.main) : (/USD/.test(k.sub) ? num(k.sub) : 0); return { ars, usd, main: k.main, sub: k.sub, titulo: k.titulo }; };
// Lo que tendría que dar, calculado de las colecciones en crudo (sin usar los helpers nuevos de la app)
const esperado = (mesFijo) => p.evaluate((mesFijo) => { const mes = mesFijo || _hoyLocalISO().slice(0, 7); let ars = 0, usd = 0;
  const suma = (mon, m) => { if (mon === 'USD') usd += m; else ars += m; };
  const enMes = (c) => (c.fecha || '').slice(0, 7) === mes;
  ventas.forEach(v => (v.cobrosHistorial || []).forEach(c => { if (!enMes(c) || c.formaPago === 'canje') return; suma(c.comp === 'usd' ? 'USD' : 'ARS', c.monto || 0); }));
  alquileres.forEach(a => (a.cobrosHistorial || []).forEach(c => { if (!enMes(c)) return; suma((c.monedaCobro || a.moneda || 'ARS'), (c.montoCobrado > 0 ? c.montoCobrado : (c.monto || 0))); }));
  servicios.forEach(s => (s.cobrosHistorial || []).forEach(c => { if (enMes(c)) suma('ARS', c.monto || 0); }));
  ingGeneral.forEach(ig => { if (!enMes(ig)) return; if (ig.esEgreso || ig.tipo === 'mov_egreso_caja' || ig.tipo === 'mov_banco_salida') return;
    if (ig.origenEmitidoId || ig.tipo === 'otro') suma(ig.moneda || 'ARS', ig.monto || 0); });
  return { ars: Math.round(ars * 100) / 100, usd: Math.round(usd * 100) / 100 }; }, mesFijo);

// ═════════ (a) Disponibles de Ventas ═════════
await irA(p, 'Ventas');
let t0 = await tarjetas();
const datosDemo = await p.evaluate(() => ({ n: ventas.length, sinComprador: ventas.filter(v => !(v.comprador || '').trim()).length,
  completas: ventas.filter(v => { const r = resumenVenta(v); return Math.max(r.precioUSD - r.cobradoUSD, 0) <= 0 && Math.max(r.precioARS - r.cobradoARS, 0) <= 0; }).length }));
ok('A0: la demo trae UF y todas tienen comprador', datosDemo.n >= 8 && datosDemo.sinComprador === 0, JSON.stringify(datosDemo));
ok('A1: con todas las UF vendidas (algunas en cuotas) NO hay unidades disponibles', t0.disp === 0, JSON.stringify(t0) + ' ' + JSON.stringify(datosDemo));
ok('A1: «UF totales» y «Vendidas» siguen igual (total y completas)', t0.tot === datosDemo.n && t0.vend === datosDemo.completas, JSON.stringify(t0) + ' ' + JSON.stringify(datosDemo));

// Casos a mano: sin comprador y sin nada cobrado = disponible; el resto no
await p.evaluate(() => {
  const base = { tipo: 'departamento', modalidad: 'total_usd', fecha: '', cobrosHistorial: [] };
  ventas.push(Object.assign({}, base, { id: 'kt_1', uf: 'KT-1', comprador: '', precioUSD: 150000, cobradoUSD: 0 }));                       // a la venta: disponible
  ventas.push(Object.assign({}, base, { id: 'kt_2', uf: 'KT-2', comprador: 'Reservó Pérez', precioUSD: 150000, cobradoUSD: 0 }));        // con comprador, sin cobros (boleto a firmar)
  ventas.push(Object.assign({}, base, { id: 'kt_3', uf: 'KT-3', comprador: '', precioUSD: 150000, cobradoUSD: 10000,
    cobrosHistorial: [{ id: 'kc3', fecha: '2026-01-10', monto: 10000, comp: 'usd', tipoAB: 'B' }] }));                                      // sin nombre pero ya cobró algo: no está libre
  ventas.push(Object.assign({}, base, { id: 'kt_4', uf: 'KT-4', comprador: '', precioUSD: 0, cobradoUSD: 0 }));                          // sin precio cargado, sin comprador: libre
  ventas.push(Object.assign({}, base, { id: 'kt_5', uf: 'KT-5', comprador: '', precioUSD: 100000, cobradoUSD: 100000 }));               // venta cerrada aunque falte el nombre
  ventas.push(Object.assign({}, base, { id: 'kt_6', uf: 'KT-6', comprador: '   ', precioUSD: 90000, cobradoUSD: 0 }));                   // el comprador sólo tiene espacios: libre
  ventas.push(Object.assign({}, base, { id: 'kt_7', uf: 'KT-7', comprador: '', modalidad: 'cuotas_cac', terrenoUSD: 50000, terrenoCobrado: 0, construccionBase: 1000000, nroCuotas: 12, construccionCobrado: 0, cacBase: 1, cacActual: 1, cuota1Venc: '2026-12-01' })); // terreno + CAC sin comprador ni cobros: libre
  renderVentas();
});
let t1 = await tarjetas();
ok('A2: «Disponibles» cuenta sólo las libres (KT-1, KT-4, KT-6 y KT-7), no las que tienen comprador o cobros', t1.disp === 4, JSON.stringify(t1));
ok('A2: «UF totales» suma las nuevas', t1.tot === datosDemo.n + 7, JSON.stringify(t1));
ok('A2: la venta cerrada sin nombre (KT-5) cuenta como vendida; una libre sin precio (KT-4) no', t1.vend === datosDemo.completas + 1, JSON.stringify(t1) + ' completas demo=' + datosDemo.completas);
// con filtros las tarjetas de unidades no se mueven (antes «Disponibles» = total − vendidas-de-lo-filtrado)
for (const [id, val] of [['ventasFiltroEstado', 'vendida'], ['ventasFiltroEstado', 'en_venta'], ['ventasFiltroModalidad', 'total_usd'], ['ventasBuscador', 'KT-1']]) {
  await p.evaluate(([i, v]) => { document.getElementById(i).value = v; renderVentas(); }, [id, val]);
  const tf = await tarjetas();
  ok('A3: con el filtro «' + id.replace('ventasFiltro', '').replace('ventasBuscador', 'búsqueda') + ' = ' + val + '» las tarjetas de unidades no cambian', tf.tot === t1.tot && tf.vend === t1.vend && tf.disp === t1.disp, JSON.stringify(tf) + ' vs ' + JSON.stringify(t1));
  await p.evaluate(([i]) => { document.getElementById(i).value = ''; renderVentas(); }, [id]);
}
// la tarjeta «Total cobrado» sigue sumando lo de la lista (no se tocó)
const totCob = await p.evaluate(() => document.getElementById('ventasTotalCobrado').textContent);
ok('A4: «Total cobrado» sigue mostrando un importe', /USD/.test(totCob), totCob);
// al cobrar una libre pasa a no estar disponible; al borrarle el comprador y los cobros vuelve
await p.evaluate(() => { var v = ventas.find(x => x.id === 'kt_1'); v.comprador = 'Nuevo Comprador'; renderVentas(); });
ok('A5: poniéndole comprador a KT-1 deja de estar disponible (4 → 3)', (await tarjetas()).disp === 3);
await p.evaluate(() => { var v = ventas.find(x => x.id === 'kt_1'); v.comprador = ''; renderVentas(); });
ok('A5: sacándoselo vuelve (3 → 4)', (await tarjetas()).disp === 4);
// la tarjeta explica qué cuenta
const tip = await p.evaluate(() => { var el = document.getElementById('ventasUFDisponibles'); var c = el && el.closest('.stat-card'); return c ? (c.getAttribute('title') || '') : ''; });
ok('A6: la tarjeta «Disponibles» explica que son las unidades sin comprador ni cobros', /sin comprador/i.test(tip) && /cobro/i.test(tip), tip);

// limpiar lo agregado
await p.evaluate(() => { for (var i = ventas.length - 1; i >= 0; i--) if (/^kt_/.test(ventas[i].id || '')) ventas.splice(i, 1); renderVentas(); });
ok('A7: al sacar las de prueba vuelve el estado de la demo', (await tarjetas()).disp === 0);

// ═════════ (b) Cobrado este mes del Inicio ═════════
await irA(p, 'Home');
await p.waitForTimeout(500);
const base = await esperado();
let k0 = await leerKpi();
ok('B0: la demo tiene cobros de ventas Y de otras fuentes este mes (si no la prueba no dice nada)', base.usd > 0 && base.ars > 0, JSON.stringify(base));
ok('B1: la UF 6A fechada HOY sigue dando cobro este mes (USD 28.900)', cerca(k0.usd, 28900) && base.usd >= 28900, JSON.stringify(k0) + ' ' + JSON.stringify(base));
ok('B1: en pesos suma alquileres y recibos del mes (antes decía $0,00 porque sólo miraba ventas)', k0.ars > 0 && cerca(k0.ars, base.ars), JSON.stringify(k0) + ' esperado=' + JSON.stringify(base));
ok('B1: pesos y dólares van SEPARADOS (el principal es pesos, los dólares en el subtítulo, sin mezclarlos)', /^\$/.test(k0.main) && /^\+ USD/.test(k0.sub) && !cerca(k0.ars, k0.ars + k0.usd), k0.main + ' | ' + k0.sub);
const fuentes = await p.evaluate(() => { _hKPIs(); return document.getElementById('kpiMesV').closest('.hp-kpi').getAttribute('title') || ''; });
ok('B1: el detalle de la tarjeta nombra las fuentes (ventas, alquileres, recibos…)', /Ventas UF/.test(fuentes) && /Alquileres/.test(fuentes) && /Recibos emitidos/.test(fuentes), fuentes);
ok('B1: el detalle aclara que aportes, préstamos y compra/venta de dólares no son cobros', /aportes/i.test(fuentes) && /pr[eé]stamos/i.test(fuentes) && /d[oó]lares/i.test(fuentes), fuentes);

// cada fuente suma en SU moneda
const hoy = await p.evaluate(() => _hoyLocalISO());
const mesPasado = await p.evaluate(() => { var d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-15'; });
await p.evaluate(([hoy, mesPasado]) => {
  servicios.push({ id: 'kt_s1', descripcion: 'Honorarios de prueba', cliente: 'Cliente KT', cobrosHistorial: [{ id: 'ksc1', fecha: hoy, monto: 100000, tipoAB: 'B' }, { id: 'ksc2', fecha: mesPasado, monto: 777777, tipoAB: 'B' }] });
  alquileres.push({ id: 'kt_a1', unidad: 'KT-ALQ', inquilino: 'Inq KT', moneda: 'USD', canon: 500, canonActual: 500, inicio: '2026-01-01', fin: '2027-12-31', cobrosHistorial: [{ id: 'kac1', fecha: hoy, monto: 500, concepto: 'alquiler', periodo: hoy.slice(0, 7), tipoAB: 'B' }] });
  ingGeneral.push({ id: 'kt_i1', tipo: 'otro', fecha: hoy, moneda: 'ARS', monto: 123456, origen: 'Ingreso varios KT' });
  ventas.push({ id: 'kt_v1', uf: 'KT-V', comprador: 'Cobro viejo', modalidad: 'total_ars', precioARS: 1000, cobradoARS: 1000, cobrosHistorial: [{ id: 'kvc1', fecha: mesPasado, monto: 555555, comp: 'ars', tipoAB: 'B' }] });
}, [hoy, mesPasado]);
let e1 = await esperado(), k1 = await leerKpi();
ok('B2: suma honorarios ($100.000), un alquiler en dólares (USD 500) y un ingreso «Otro» ($123.456) del mes', cerca(e1.ars - base.ars, 223456) && cerca(e1.usd - base.usd, 500), JSON.stringify(e1) + ' base=' + JSON.stringify(base));
ok('B2: el KPI coincide con las colecciones en crudo, cada moneda por su lado', cerca(k1.ars, e1.ars) && cerca(k1.usd, e1.usd), JSON.stringify(k1) + ' esperado=' + JSON.stringify(e1));
ok('B2: los cobros de OTRO mes no entran (honorarios de $777.777 y venta de $555.555 del mes pasado)', !cerca(k1.ars, e1.ars + 777777) && !cerca(k1.ars, e1.ars + 555555), JSON.stringify(k1));

// lo que NO es un cobro, aunque sea un ingreso de la caja
await p.evaluate((hoy) => {
  [['aporte_socio', 9000000], ['prestamo_empresa', 8000000], ['prestamo_bancario', 7000000], ['subsidio', 6000000], ['devolucion', 5000000]].forEach((a, i) =>
    ingGeneral.push({ id: 'kt_n' + i, tipo: a[0], fecha: hoy, moneda: 'ARS', monto: a[1], origen: 'No es cobro ' + a[0] }));
  ingGeneral.push({ id: 'kt_n5', tipo: 'mov_banco_entrada', fecha: hoy, moneda: 'ARS', monto: 4000000, origen: 'Depósito manual', esBancario: true });
  ingGeneral.push({ id: 'kt_n6', tipo: 'mov_ingreso_caja', fecha: hoy, moneda: 'ARS', monto: 3000000, origen: 'Ingreso caja manual' });
  ingGeneral.push({ id: 'kt_n7', tipo: 'mov_banco_entrada', fecha: hoy, moneda: 'ARS', monto: 2000000, origen: 'Extracto importado', esBancario: true, origenImport: 'santander' });
  // compra/venta de dólares: dos puntas con el mismo cambioId (la de pesos que entra y la de dólares que sale)
  ingGeneral.push({ id: 'kt_c1-ARS', tipo: 'mov_ingreso_caja', fecha: hoy, moneda: 'ARS', monto: 1500000, origen: 'Venta de USD', esCambio: true, cambioId: 'kt_c1', fxOp: 'venta', fxTC: 1500, tipoAB: 'B' });
  ingGeneral.push({ id: 'kt_c1-USD', tipo: 'mov_egreso_caja', fecha: hoy, moneda: 'USD', monto: 1000, origen: 'Venta de USD', esCambio: true, cambioId: 'kt_c1', esEgreso: true, fxOp: 'venta', fxTC: 1500, tipoAB: 'B' });
  ingGeneral.push({ id: 'kt_c2-USD', tipo: 'mov_ingreso_caja', fecha: hoy, moneda: 'USD', monto: 2000, origen: 'Compra de USD', esCambio: true, cambioId: 'kt_c2', fxOp: 'compra', fxTC: 1500, tipoAB: 'B' });
  // un recibo emitido que SALIÓ de caja (egreso) no es un cobro
  ingGeneral.push({ id: 'emitmov_kt_e1', tipo: 'mov_egreso_caja', fecha: hoy, moneda: 'ARS', monto: 999999, origen: 'Doc. factura KT', esEgreso: true, origenEmitidoId: 'kt_e1', tipoAB: 'B' });
}, hoy);
let k2 = await leerKpi();
ok('B3: aportes, préstamos, subsidios, devoluciones, movimientos manuales/importados, compra-venta de dólares y egresos NO suman', cerca(k2.ars, e1.ars) && cerca(k2.usd, e1.usd), JSON.stringify(k2) + ' esperado=' + JSON.stringify(e1));
// un recibo emitido que SÍ entró a caja o al banco
await p.evaluate((hoy) => {
  ingGeneral.push({ id: 'emitmov_kt_e2', tipo: 'mov_ingreso_caja', fecha: hoy, moneda: 'ARS', monto: 250000, origen: 'Recibo R-9 — Cliente KT', origenEmitidoId: 'kt_e2', tipoAB: 'B' });
  ingGeneral.push({ id: 'emitmov_kt_e3', tipo: 'mov_banco_entrada', fecha: hoy, moneda: 'USD', monto: 800, origen: 'Doc. factura F-3 — Cliente KT', origenEmitidoId: 'kt_e3', esBancario: true, tipoAB: 'A' });
}, hoy);
let e4 = await esperado(), k4 = await leerKpi();
ok('B4: un recibo emitido que entró a caja ($250.000) y uno al banco en dólares (USD 800) suman, cada uno en su moneda', cerca(e4.ars - e1.ars, 250000) && cerca(e4.usd - e1.usd, 800) && cerca(k4.ars, e4.ars) && cerca(k4.usd, e4.usd), JSON.stringify(k4) + ' esperado=' + JSON.stringify(e4));

// un cobro de venta por canje no es plata
await p.evaluate((hoy) => { ventas.push({ id: 'kt_v2', uf: 'KT-CJ', comprador: 'Canje', modalidad: 'total_usd', precioUSD: 40000, cobradoUSD: 40000, cobrosHistorial: [{ id: 'kvc2', fecha: hoy, monto: 40000, comp: 'usd', formaPago: 'canje' }] }); }, hoy);
let k5 = await leerKpi();
ok('B5: un cobro por canje de m² no suma (no entró dinero)', cerca(k5.usd, e4.usd), JSON.stringify(k5) + ' esperado=' + JSON.stringify(e4));

// el número coincide con lo que dice la Caja General para el mes (misma fuente de movimientos)
const cg = await p.evaluate(() => { var mes = _hoyLocalISO().slice(0, 7), ars = 0, usd = 0;
  if (typeof _cgMovsDeIngresos !== 'function' || typeof _cgFuenteCobro !== 'function') return { ars: -1, usd: -1 };
  _cgMovsDeIngresos().forEach(m => { if (!_cgFuenteCobro(m) || (m.fecha || '').slice(0, 7) !== mes) return; if (m.moneda === 'USD') usd += m.monto; else ars += m.monto; });
  return { ars: Math.round(ars * 100) / 100, usd: Math.round(usd * 100) / 100 }; });
ok('B6: lo que suma el Inicio sale de los mismos movimientos que la Caja General (_cgMovsDeIngresos)', cerca(cg.ars, k5.ars) && cerca(cg.usd, k5.usd), JSON.stringify(cg) + ' vs ' + JSON.stringify(k5));
// y cada cobro que suma el Inicio está en el libro de la Caja General
await irA(p, 'CajaGeneral');
const enLibro = await p.evaluate(() => { renderCajaGeneral(); var mes = _hoyLocalISO().slice(0, 7), ars = 0, usd = 0;
  if (typeof _cgFuenteCobro !== 'function') return { ars: -1, usd: -1 };
  _cgUltimo.filas.forEach(m => { if (!m.esIngreso || (m.fecha || '').slice(0, 7) !== mes) return; if (!_cgFuenteCobro(m)) return; if (m.moneda === 'USD') usd += m.monto; else ars += m.monto; });
  return { ars: Math.round(ars * 100) / 100, usd: Math.round(usd * 100) / 100 }; });
ok('B6: las filas del libro de la Caja General que son cobros del mes dan lo mismo que el Inicio', cerca(enLibro.ars, k5.ars) && cerca(enLibro.usd, k5.usd), JSON.stringify(enLibro) + ' vs ' + JSON.stringify(k5));

// ─── mes: se toma el de la fecha LOCAL, no el de la fecha UTC (a las 21:30 del último día del mes en Argentina, UTC ya está en el mes siguiente) ───
await irA(p, 'Home');
await p.evaluate(() => { const RD = Date, fijo = RD.parse('2026-10-31T23:30:00-03:00');   // 2026-11-01T02:30Z
  class FD extends RD { constructor(...a) { if (a.length === 0) super(fijo); else super(...a); } static now() { return fijo; }
    getFullYear() { return new RD(this.getTime() - 3 * 3600e3).getUTCFullYear(); } getMonth() { return new RD(this.getTime() - 3 * 3600e3).getUTCMonth(); } getDate() { return new RD(this.getTime() - 3 * 3600e3).getUTCDate(); } }
  window.__RD = RD; window.Date = FD;
  ventas.push({ id: 'kt_f1', uf: 'KT-OCT', comprador: 'Cobro 31/10', modalidad: 'total_ars', precioARS: 1, cobradoARS: 1, cobrosHistorial: [{ id: 'kfc1', fecha: '2026-10-31', monto: 31310, comp: 'ars', tipoAB: 'B' }] });
  ventas.push({ id: 'kt_f2', uf: 'KT-NOV', comprador: 'Cobro 1/11', modalidad: 'total_ars', precioARS: 1, cobradoARS: 1, cobrosHistorial: [{ id: 'kfc2', fecha: '2026-11-01', monto: 11111, comp: 'ars', tipoAB: 'B' }] }); });
const fronteraHoy = await p.evaluate(() => _hoyLocalISO());
const kf = await p.evaluate(() => { _hKPIs(); return { main: document.getElementById('kpiMesV').textContent, sub: document.getElementById('kpiMesSub').textContent }; });
await p.evaluate(() => { window.Date = window.__RD; });
const kfars = /^\$/.test(kf.main) ? num(kf.main) : 0;
const eOct = await esperado('2026-10'), eNov = await esperado('2026-11');
ok('B7: a las 23:30 del 31/10 (hora argentina) «este mes» es octubre: suma lo de octubre (con el cobro del 31/10) y no lo de noviembre (el del 1/11)',
  fronteraHoy === '2026-10-31' && cerca(kfars, eOct.ars) && !cerca(kfars, eNov.ars) && eOct.ars - eNov.ars !== 0, fronteraHoy + ' | ' + kf.main + ' ' + kf.sub + ' | oct=' + JSON.stringify(eOct) + ' nov=' + JSON.stringify(eNov));

// limpiar y confirmar que la app quedó sana
await p.evaluate(() => { for (var i = ventas.length - 1; i >= 0; i--) if (/^kt_/.test(ventas[i].id || '')) ventas.splice(i, 1);
  for (var j = alquileres.length - 1; j >= 0; j--) if (/^kt_/.test(alquileres[j].id || '')) alquileres.splice(j, 1);
  for (var k = servicios.length - 1; k >= 0; k--) if (/^kt_/.test(servicios[k].id || '')) servicios.splice(k, 1);
  for (var m = ingGeneral.length - 1; m >= 0; m--) if (/^(kt_|emitmov_kt_)/.test(ingGeneral[m].id || '')) ingGeneral.splice(m, 1); });
const kFin = await leerKpi();
ok('B8: sacadas las de prueba el KPI vuelve al de la demo', cerca(kFin.ars, k0.ars) && cerca(kFin.usd, k0.usd), JSON.stringify(kFin) + ' vs ' + JSON.stringify(k0));
// dar click en la tarjeta lleva a donde se ve el detalle
const clic = await p.evaluate(() => (document.getElementById('kpiMesV').closest('.hp-kpi').getAttribute('onclick') || ''));
ok('B9: la tarjeta lleva a la Caja General (de ahí sale el número), no a Ventas', /CajaGeneral/.test(clic), clic);

// el Inicio se pone al día solo cuando llega un cobro nuevo de alquileres / servicios / ingresos generales (no sólo al cargar ventas)
await irA(p, 'Home');
const antes = num(await p.evaluate(() => document.getElementById('kpiMesV').textContent));
const kpiTxt = async () => num(await p.evaluate(() => document.getElementById('kpiMesV').textContent));
let previo = await kpiTxt();
await p.evaluate((h) => { ingGeneral.push({ id: 'kt_live1', tipo: 'otro', fecha: h, moneda: 'ARS', monto: 55000, origen: 'Ingreso en vivo KT' }); persistirIngGeneral(); }, hoy);
await p.waitForTimeout(700);
let despues = await kpiTxt();
ok('B10: al llegar un ingreso general nuevo el Inicio se actualiza solo (sin recargar ni volver a entrar)', cerca(despues - previo, 55000), previo + ' → ' + despues);
previo = despues;
await p.evaluate((h) => { servicios.push({ id: 'kt_live2', descripcion: 'Honorarios en vivo KT', cliente: 'Cliente KT', cobrosHistorial: [{ id: 'klc2', fecha: h, monto: 7000, tipoAB: 'B' }] }); persistirServicios(); }, hoy);
await p.waitForTimeout(700);
despues = await kpiTxt();
ok('B10: ...y lo mismo con un cobro de honorarios', cerca(despues - previo, 7000), previo + ' → ' + despues);
await p.evaluate(() => { ingGeneral = ingGeneral.filter(x => x.id !== 'kt_live1'); persistirIngGeneral(); servicios = servicios.filter(x => x.id !== 'kt_live2'); persistirServicios(); });
await p.waitForTimeout(700);
ok('B10: y al borrarlos vuelve al valor de antes', cerca(num(await p.evaluate(() => document.getElementById('kpiMesV').textContent)), antes));

const erroresJS = errores.filter(e => !/favicon|ERR_FAILED|Failed to load resource/.test(e));
ok('Z: sin errores de JS durante toda la prueba', erroresJS.length === 0, erroresJS.slice(0, 3).join(' || '));

const mal = res.filter(r => r[0] !== 'OK ');
res.forEach(r => console.log(r[0] + ' ' + r[1] + (r[2] ? '   → ' + r[2] : '')));
console.log('\n' + (res.length - mal.length) + '/' + res.length + ' OK');
await b.close();
process.exit(mal.length ? 1 : 0);
