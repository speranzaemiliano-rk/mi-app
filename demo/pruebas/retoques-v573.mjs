// Retoques de la revisión de los arreglos de la v573: moneda de los cobros de ventas (cuota/cochera en dólares), nota de crédito que hereda la
// proporción de IVA de su factura, «Pagar varias facturas» que frena pesos+dólares, escapado de la ficha del proveedor y de las Solicitudes de
// borrado, y la Caja consolidada con la misma regla que Cuentas Bancarias para alquileres cobrados en otra moneda.
// Corre contra la demo (base en memoria). Uso: node retoques-v573.mjs
import { abrirDemo, entrarAlSistema, irA } from './demo-lib.mjs';
const { b, p, errores } = await abrirDemo();
const res = [];
const ok = (n, c, x) => res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]);
await entrarAlSistema(p);
await p.evaluate(() => { window.__alerts = []; window.alert = m => window.__alerts.push(String(m)); window.confirm = () => true; window.__xss = undefined; });

// ── moneda de un cobro de venta ──
const mons = await p.evaluate(() => {
  const v = { cuotasMoneda: 'ars_cac' }, vu = { cuotasMoneda: 'usd' };
  return ['usd', 'cuota_usd_simple', 'cochera_usd', 'cuota_ars_simple', 'cochera_ars', 'ars_construccion', 'cuota', 'ars_general'].map(c => _ventaCobroMoneda(v, { comp: c })).concat([_ventaCobroMoneda(vu, { comp: 'cuota' })]);
});
ok('M1: usd / cuota_usd_simple / cochera_usd son dólares; el resto, pesos; una cuota de venta en dólares (cuotasMoneda usd) también',
  JSON.stringify(mons) === JSON.stringify(['USD', 'USD', 'USD', 'ARS', 'ARS', 'ARS', 'ARS', 'ARS', 'USD']), JSON.stringify(mons));

// bancos: cobros por banco SIN cuenta elegida, en dólares
const ant = await p.evaluate(() => { const t = _bancoTotales(); return { aEnt: t.ARS.ent, uEnt: t.USD.ent }; });
await p.evaluate(() => {
  const hoy = _hoyLocalISO();
  ventas.push({ id: 'rt_v1', uf: 'RT-1', comprador: 'Comp RT', modalidad: 'total_usd', precioUSD: 10000, cobradoUSD: 5000, cobrosHistorial: [
    { id: 'rtc1', fecha: hoy, monto: 3000, comp: 'cuota_usd_simple', tipoAB: 'A', cuentaId: '' },
    { id: 'rtc2', fecha: hoy, monto: 2000, comp: 'cochera_usd', tipoAB: 'A', cuentaId: '' }] });
});
const desp = await p.evaluate(() => { const t = _bancoTotales(); return { aEnt: t.ARS.ent, uEnt: t.USD.ent }; });
ok('M2: dos cobros por banco sin cuenta (cuota y cochera en USD) suman 5.000 en DÓLARES y nada en pesos', Math.abs(desp.uEnt - ant.uEnt - 5000) < 0.01 && Math.abs(desp.aEnt - ant.aEnt) < 0.01, JSON.stringify({ ant, desp }));
const cg = await p.evaluate(() => _cgRecolectarMovs().filter(m => m.srcTipo === 'venta' && /RT-1/.test(m.desc)).map(m => m.moneda));
ok('M3: la Caja General los pone en USD', cg.length === 2 && cg.every(x => x === 'USD'), JSON.stringify(cg));
await p.evaluate(() => { ventas.push({ id: 'rt_v2', uf: 'RT-2', comprador: 'Comp RT2', modalidad: 'total_usd', precioUSD: 10000, cobradoUSD: 4000, cobrosHistorial: [{ id: 'rtc3', fecha: _hoyLocalISO(), monto: 4000, comp: 'cuota_usd_simple', tipoAB: 'B' }] }); });
const efu = await p.evaluate(() => { const norm = (x) => JSON.stringify(x); return { usd: typeof _consEfectivoUSD === 'function' }; });
const ef = await p.evaluate(() => { renderEfectivoPesos(); renderEfectivoUSD(); return { ars: (_efUltimo && _efUltimo.ARS ? _efUltimo.ARS.filas : []).filter(m => /RT-2/.test(m.desc || '')).length, usd: (_efUltimo && _efUltimo.USD ? _efUltimo.USD.filas : []).filter(m => /RT-2/.test(m.desc || '')).length }; });
ok('M4: una cuota en dólares cobrada en mano figura en Efectivo USD y NO en Efectivo pesos', ef.usd === 1 && ef.ars === 0, JSON.stringify(ef));
await p.evaluate(() => { for (var i = ventas.length - 1; i >= 0; i--) if (/^rt_/.test(ventas[i].id || '')) ventas.splice(i, 1); });

// ── nota de crédito: hereda la proporción de IVA de su factura ──
const nc = await p.evaluate(() => {
  facturas.push({ id: 'rt_f1', proveedor: 'Prov RT', fecha: '2026-03-01', numero: 'A-1', importe: 110500, netoGravado: 100000, moneda: 'ARS', pagosHistorial: [], tipoComprobante: 'A' });
  facturas.push({ id: 'rt_n1', proveedor: 'Prov RT', fecha: '2026-03-05', numero: 'NC-1', importe: 110500, esNotaCredito: true, notaCreditoDe: 'rt_f1', notaCreditoKind: 'fact', moneda: 'ARS', tipoComprobante: 'A' });
  facturas.push({ id: 'rt_n2', proveedor: 'Prov RT', fecha: '2026-03-05', numero: 'NC-2', importe: 121000, esNotaCredito: true, moneda: 'ARS', tipoComprobante: 'A' });
  const f = _rptIvaCompra(facturas.find(x => x.id === 'rt_f1')), n = _rptIvaCompra(facturas.find(x => x.id === 'rt_n1')), n2 = _rptIvaCompra(facturas.find(x => x.id === 'rt_n2'));
  return { f, n, n2 };
});
ok('N1: la NC total de una factura al 10,5 % neutraliza su IVA (neto −100.000, IVA −10.500)', Math.abs(nc.n.neto + 100000) < 0.01 && Math.abs(nc.n.iva + 10500) < 0.01 && !nc.n.estimado, JSON.stringify(nc.n));
ok('N1: la factura y su NC suman 0 de IVA y de neto', Math.abs(nc.f.iva + nc.n.iva) < 0.01 && Math.abs(nc.f.neto + nc.n.neto) < 0.01);
ok('N2: una NC suelta (sin factura) sigue estimando al 21 %', Math.abs(nc.n2.neto + 100000) < 0.01 && Math.abs(nc.n2.iva + 21000) < 0.01 && nc.n2.estimado, JSON.stringify(nc.n2));
await p.evaluate(() => { for (var i = facturas.length - 1; i >= 0; i--) if (/^rt_/.test(facturas[i].id || '')) facturas.splice(i, 1); });

// ── Pagar varias facturas: pesos + dólares ──
const mix = await p.evaluate(async () => {
  facturas.push({ id: 'rt_p1', proveedor: 'Prov MIX', fecha: '2026-03-01', numero: 'M-1', importe: 1000, moneda: 'ARS', pagosHistorial: [], estado: 'pendiente', tipoComprobante: 'A', netoGravado: 826.45 });
  facturas.push({ id: 'rt_p2', proveedor: 'Prov MIX', fecha: '2026-03-02', numero: 'M-2', importe: 10, moneda: 'USD', pagosHistorial: [], estado: 'pendiente', tipoComprobante: 'A', netoGravado: 8.26 });
  const f1 = facturas.find(x => x.id === 'rt_p1'), f2 = facturas.find(x => x.id === 'rt_p2');
  _pagoFDMulti = { prov: 'Prov MIX', items: [{ idx: facturas.indexOf(f1), f: f1, pend: 1000, neto: 826, checked: true }, { idx: facturas.indexOf(f2), f: f2, pend: 10, neto: 8, checked: true }] };
  const mons = _pagoFDMultiMonedas(_pagoFDMulti.items);
  window.__alerts = [];
  await _guardarPagoFDMultiple('B', '2026-03-10', '', 'Transferencia');
  return { mons, alerts: window.__alerts.slice(), p1: (f1.pagosHistorial || []).length, p2: (f2.pagosHistorial || []).length };
});
ok('P1: detecta pesos y dólares tildados a la vez', mix.mons.length === 2, JSON.stringify(mix.mons));
ok('P2: guardar frena con un aviso claro y no registra ningún pago', mix.alerts.length === 1 && /pesos y en d[oó]lares/.test(mix.alerts[0]) && mix.p1 === 0 && mix.p2 === 0, JSON.stringify(mix));
await p.evaluate(() => { for (var i = facturas.length - 1; i >= 0; i--) if (/^rt_/.test(facturas[i].id || '')) facturas.splice(i, 1); });

// ── escapado: ficha del proveedor y Solicitudes de borrado ──
const esc = await p.evaluate(() => {
  const mal = '<img src=x onerror="window.__xss=1">';
  facturas.push({ id: 'rt_e1', proveedor: 'Prov ESC', fecha: '2026-03-01', numero: mal, descripcion: mal, importe: 100, moneda: 'ARS', pagado: 100, estado: 'pagada', pagosHistorial: [{ id: 'rtp1', fecha: '2026-03-02', monto: 100, modalidad: 'B' }] });
  documentos.push({ id: "rt_d'1", proveedor: 'Prov ESC', fecha: '2026-03-01', numero: mal, descripcion: mal, importe: 50, moneda: 'ARS', tipo: 'remito', pagado: 50, pagosHistorial: [{ id: 'rtp2', fecha: '2026-03-03', monto: 50, tipoAB: 'B' }] });
  const d1 = document.createElement('div'); d1.innerHTML = buildProvPagosHTML('Prov ESC'); document.body.appendChild(d1);
  const d2 = document.createElement('div'); d2.innerHTML = renderSolicitudCard({ id: 's1', descripcion: mal, solicitadoPor: mal, estado: 'rechazada', motivoRechazo: mal, solicitadoEn: Date.now() }); document.body.appendChild(d2);
  const r = { imgs: d1.querySelectorAll('img').length + d2.querySelectorAll('img').length, texto: (d1.textContent + d2.textContent).indexOf('<img') >= 0, xss: window.__xss, onclickDoc: (d1.innerHTML.match(/abrirEditarPago\(&quot;doc&quot;|abrirEditarPago\('doc'[^"]*"/) || [''])[0] };
  d1.remove(); d2.remove();
  facturas.splice(facturas.findIndex(x => x.id === 'rt_e1'), 1); documentos.splice(documentos.findIndex(x => x.id === "rt_d'1"), 1);
  return r;
});
ok('E1: la ficha del proveedor y las solicitudes muestran el HTML literal, sin crear elementos ni ejecutar script', esc.imgs === 0 && esc.texto && esc.xss === undefined, JSON.stringify(esc));

// ── Caja consolidada: alquiler en USD cobrado en pesos, por banco ──
const cons = await p.evaluate(() => {
  const col = { datos: [], facturas: [], documentos: [], ventas: [], servicios: [], ingGeneral: [],
    banco: [{ id: 'cb1', banco: 'Banco RT', moneda: 'ARS', saldo: 0 }],
    alquileres: [{ id: 'a1', moneda: 'USD', cobrosHistorial: [{ id: 'c1', fecha: '2026-03-01', monto: 1000, tipoAB: 'A', cuentaId: 'cb1', monedaCobro: 'ARS', montoCobrado: 1200000, concepto: 'alquiler' }] }] };
  return _consBancos(col);
});
ok('C1: la Caja consolidada suma lo que ENTRÓ ($1.200.000 en una cuenta en pesos), no el monto del contrato (1.000)', Math.abs(cons.ars - 1200000) < 0.01 && Math.abs(cons.usd) < 0.01, JSON.stringify(cons));

// ── tooltip/nota de Tesorería ──
await irA(p, 'Tesoreria');
await p.waitForTimeout(1500);
const nota = await p.evaluate(() => (document.getElementById('tesSaldosNota') || {}).textContent || '');
ok('T1: la nota de la Tesorería ya no dice que «el banco está dentro de la caja»', nota.length > 0 && !/ya est[aá] dentro de la caja/.test(nota) && /no se suman/i.test(nota), nota);

// ── empresa: provincia fuera de la lista y «Nueva empresa» ──
const emp = await p.evaluate(async () => {
  const e = empresas[0]; const eid = e.id;
  await REF_EMPRESAS.child(eid).child('datos').update({ provincia: 'Capital Federal', telefono: '1111' });
  e.datos = Object.assign({}, e.datos, { provincia: 'Capital Federal', telefono: '1111' });   // la lista en memoria no se refresca sola
  return eid;
});
await p.waitForTimeout(300);
const prov = await p.evaluate((eid) => { dbVerDatos(eid); const sel = document.querySelector('#dbEditForm [data-key=provincia]'); return { value: sel.value, texto: sel.options[sel.selectedIndex].text }; }, emp);
ok('P3: «Datos de empresa» muestra una provincia que la lista cerrada no tiene (Capital Federal), no «— Seleccionar —»', prov.value === 'Capital Federal' && prov.texto === 'Capital Federal', JSON.stringify(prov));
await p.evaluate((eid) => { document.querySelector('#dbEditForm [data-key=telefono]').value = '2222'; dbGuardarDatos(eid); }, emp);
await p.waitForTimeout(500);
const tras = await p.evaluate((eid) => ({ prov: (empresas.find(e => e.id === eid).datos || {}).provincia, tel: (empresas.find(e => e.id === eid).datos || {}).telefono }), emp);
ok('P4: cambiar sólo el teléfono y guardar conserva la provincia', tras.prov === 'Capital Federal' && tras.tel === '2222', JSON.stringify(tras));
const nuevaEmp = await p.evaluate(() => { abrirModalEmpresa(); const a = document.getElementById('empTipoPersona'), c = document.getElementById('empCondIva'); const r0 = [a.selectedIndex, c.selectedIndex];
  a.selectedIndex = 1; c.selectedIndex = 1; abrirModalEmpresa(); return { antes: r0, despues: [a.selectedIndex, c.selectedIndex] }; });
ok('P5: «Nueva empresa» no hereda el tipo de persona ni la condición de IVA de la última que se abrió', nuevaEmp.despues[0] === 0 && nuevaEmp.despues[1] === 0, JSON.stringify(nuevaEmp));

ok('Z: sin errores de JS durante toda la prueba', errores.length === 0, JSON.stringify(errores.slice(0, 3)));
for (const r of res) console.log(r.join(' '));
console.log('\n' + res.filter(r => r[0] === 'OK ').length + '/' + res.length + ' OK');
await b.close();
process.exit(res.some(r => r[0] !== 'OK ') ? 1 : 0);
