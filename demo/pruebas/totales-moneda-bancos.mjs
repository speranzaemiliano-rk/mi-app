// Bancos: los totales de las tarjetas, el saldo del extracto y el «Saldo total» del Inicio NO mezclan pesos con dólares.
// Antes: «Total entradas / salidas / Saldo neto» sumaban en un solo importe en pesos los movimientos de las cuentas en dólares,
// el extracto tenía UN solo saldo corrido (y con una cuenta elegida arrastraba los movimientos de TODAS las demás),
// y el Inicio escondía un saldo en pesos negativo cuando había dólares. Ahora cada moneda va por su lado, sin convertir.
// Corre contra la demo (base en memoria): los datos se arman en las variables de la app y nada se guarda.
// Uso: DEMO_CDN=/home/user/mi-app/demo/pruebas/cdn node totales-moneda-bancos.mjs   (ver README: hace falta bajar-cdn.sh antes)
import { abrirDemo, entrarAlSistema, irA } from './demo-lib.mjs';
const { b, p, errores } = await abrirDemo();
const res = [];
const ok = (n, c, x) => res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]);
await entrarAlSistema(p);
await p.evaluate(() => { window.alert = () => {}; window.confirm = () => true; });
await irA(p, 'CuentasBancarias');

// ───── armado de datos: una cuenta en pesos y una en dólares, con movimientos de todos los orígenes ─────
// Fechas: todas dentro de los últimos 30 días (d(20) = hace 20 días) para que el filtro «Desde» que trae la pantalla no las recorte.
// ARS: apertura 1.000.000 + entradas (200.000 + 1.200.000 del alquiler cobrado en pesos + 50.000 de una venta) − salidas (50.000 + 100.000)
//      = 2.300.000 en total; en la cuenta de pesos sola: 1.000.000 + 200.000 + 1.200.000 − 50.000 − 100.000 = 2.250.000 (la venta no tiene cuenta).
// USD: apertura 5.000 + entradas (3.000 + 700 de una venta sin cuenta) − salidas (1.000 + 2.000 de una factura en dólares) = 5.700; en la cuenta sola: 5.000.
const armar = (opts = {}) => p.evaluate((opts) => {
  const d = n => { const x = new Date(); x.setDate(x.getDate() - n); return x.toISOString().substring(0, 10); };
  cuentasBancarias = [
    { id: 'T-ARS', banco: 'Banco Pesos', tipo: 'Cuenta Corriente', moneda: 'ARS', saldo: opts.saldoArs != null ? opts.saldoArs : 1000000, alias: '', cbu: '', empresaId: '' },
  ];
  if (!opts.soloPesos) cuentasBancarias.push({ id: 'T-USD', banco: 'Banco Dolares', tipo: 'Caja de Ahorros USD', moneda: 'USD', saldo: 5000, alias: '', cbu: '', empresaId: '' });
  datos = []; documentos = []; servicios = [];
  const mov = (id, tipo, f, cta, mon, monto, esEg, origen) => ({ id, tipo, fecha: d(f), cuentaId: cta, moneda: mon, monto, medio: 'Transferencia', origen, origenDest: '', esEgreso: esEg, esBancario: true, tipoAB: 'A' });
  ingGeneral = [
    mov('m1', 'mov_banco_entrada', 20, 'T-ARS', 'ARS', 200000, false, 'x-ent-ars'),
    mov('m3', 'mov_banco_salida', 18, 'T-ARS', 'ARS', 50000, true, 'x-sal-ars'),
  ];
  if (!opts.soloPesos) ingGeneral.push(mov('m2', 'mov_banco_entrada', 19, 'T-USD', 'USD', 3000, false, 'x-ent-usd'), mov('m4', 'mov_banco_salida', 17, 'T-USD', 'USD', 1000, true, 'x-sal-usd'));
  const pago = (f, cta, monto) => ({ fecha: d(f), modalidad: 'A', cuentaId: cta, monto, totalRet: 0, fondoReparo: 0, medioBancario: 'Transferencia' });
  facturas = [{ id: 'F-ARS', numero: '0001-0001', proveedor: 'Prov Pesos', moneda: 'ARS', pagosHistorial: [pago(15, 'T-ARS', 100000)] }];
  if (!opts.soloPesos) facturas.push({ id: 'F-USD', numero: '0001-0002', proveedor: 'Prov Dolares', moneda: 'USD', pagosHistorial: [pago(16, 'T-USD', 2000)] });
  // un contrato en dólares cobrado EN PESOS y depositado en la cuenta en pesos: entra plata en pesos (1.200.000), no «USD 1.000»
  alquileres = [{ id: 'A1', unidad: 'U-1', inquilino: 'Inq Uno', moneda: 'USD', cobrosHistorial: [
    { fecha: d(14), periodo: '2099-01', monto: 1000, concepto: 'alquiler', tipoAB: 'A', cuentaId: 'T-ARS', monedaCobro: 'ARS', montoCobrado: 1200000, tc: 1200 }] }];
  ventas = [{ id: 'V1', uf: 'UF-1', comprador: 'Comp Uno', cobrosHistorial: [
    { fecha: d(13), monto: 700, comp: 'usd', tipoAB: 'A', cuentaId: '' },
    { fecha: d(12), monto: 50000, comp: 'ars_general', tipoAB: 'A', cuentaId: '' }] }];
  if (opts.sinVentaUsd) ventas[0].cobrosHistorial.shift();
  ['cbDesde', 'cbHasta', 'cbFiltroBusq', 'cbFiltroOrigen', 'cbFiltroTipo', 'cbFiltroDir'].forEach(i => { const e = document.getElementById(i); if (e) e.value = ''; });
  const cf = document.getElementById('cbCuentaFiltro'); if (cf) cf.value = opts.cuenta || '';
  const o = document.getElementById('cbOrden'); if (o) o.value = 'asc';
  if (opts.desde) document.getElementById('cbDesde').value = d(opts.desde);
  renderCuentasBancarias();
  if (opts.cuenta) { document.getElementById('cbCuentaFiltro').value = opts.cuenta; renderExtractoBancario(); }
}, opts);
const norm = s => String(s || '').replace(/\s+/g, ' ').trim();
const card = id => p.evaluate(i => { const e = document.getElementById(i); const c = e && e.closest('.stat-card'); return c ? c.innerText.replace(/\s+/g, ' ').trim() : ''; }, id);
const pill = () => p.evaluate(() => (document.getElementById('cbSaldoPill') || {}).textContent || '');
const filas = () => p.evaluate(() => [...document.querySelectorAll('#cbExtBody tr')].map(tr => { const t = [...tr.children].map(td => td.innerText.replace(/\s+/g, ' ').trim()); return { fecha: t[0], desc: t[2], cuenta: t[4], ent: t[6], sal: t[7], saldo: t[8] }; }));
const filaDe = (fs, txt) => fs.find(f => (f.desc || '').indexOf(txt) >= 0) || {};
const cuentasFila = () => p.evaluate(() => [...document.querySelectorAll('#cbBody tr')].map(tr => { const t = [...tr.children].map(td => td.innerText.replace(/\s+/g, ' ').trim()); return { banco: t[0], moneda: t[3], ini: t[5], act: t[6] }; }));

// ───── S1: las tarjetas de arriba, una cuenta en pesos y una en dólares ─────
await armar();
const cEnt = await card('cbIngresosBancarios'), cSal = await card('cbEgresosBancarios'), cNeto = await card('cbSaldoTotal');
ok('S1: Total entradas en pesos = $1.450.000,00 (200.000 + alquiler cobrado en pesos 1.200.000 + venta 50.000), sin los dólares', /\$1\.450\.000,00/.test(cEnt), cEnt);
ok('S1: Total entradas en dólares = USD 3.700,00 aparte (3.000 de la cuenta + 700 de una venta sin cuenta)', /USD 3\.700,00/.test(cEnt), cEnt);
ok('S1: Total salidas en pesos = $150.000,00 (50.000 + factura 100.000)', /\$150\.000,00/.test(cSal), cSal);
ok('S1: Total salidas en dólares = USD 3.000,00 (1.000 + factura en dólares 2.000)', /USD 3\.000,00/.test(cSal), cSal);
ok('S1: Saldo neto en pesos = $2.300.000,00 (apertura de la cuenta en pesos + entradas − salidas), sin los USD 5.000 de apertura', /\$2\.300\.000,00/.test(cNeto), cNeto);
ok('S1: Saldo neto en dólares = USD 5.700,00 (apertura 5.000 + 3.700 − 3.000)', /USD 5\.700,00/.test(cNeto), cNeto);
ok('S1: el importe en pesos NO se llevó los movimientos en dólares (ni 3.000 ni 1.453.000 sueltos)', !/\$1\.453\.000/.test(cEnt) && !/\$153\.000/.test(cSal) && !/\$2\.303\.000/.test(cNeto), cEnt + ' | ' + cSal + ' | ' + cNeto);

// ───── S2: saldo por cuenta (cada una en su moneda, y el cobro en pesos de un contrato en dólares entra en pesos) ─────
const cf = await cuentasFila();
const fArs = cf.find(f => /Pesos/.test(f.banco)) || {}, fUsd = cf.find(f => /Dolares/.test(f.banco)) || {};
ok('S2: la cuenta en pesos queda en $2.250.000,00 (cobró el alquiler en USD como 1.200.000 pesos, no «1.000»)', /\$2\.250\.000,00/.test(fArs.act || ''), JSON.stringify(fArs));
ok('S2: la cuenta en dólares queda en USD 5.000,00 (5.000 + 3.000 − 1.000 − 2.000)', /USD 5\.000,00/.test(fUsd.act || ''), JSON.stringify(fUsd));

// ───── S3: extracto con TODAS las cuentas: un saldo corrido por moneda, cada renglón con su símbolo ─────
let fs = await filas();
const r = (t) => filaDe(fs, t);
ok('S3: el extracto lista los 9 movimientos', fs.length === 9, String(fs.length));
ok('S3: entrada en dólares rotulada USD y su saldo es el de los dólares (5.000 + 3.000 = USD 8.000,00)', /^USD 3\.000,00$/.test(r('x-ent-usd').ent) && /^USD 8\.000,00$/.test(r('x-ent-usd').saldo), JSON.stringify(r('x-ent-usd')));
ok('S3: la entrada en pesos sigue con $ y su saldo no incluye los dólares ($1.200.000,00)', /^\$200\.000,00$/.test(r('x-ent-ars').ent) && /^\$1\.200\.000,00$/.test(r('x-ent-ars').saldo), JSON.stringify(r('x-ent-ars')));
ok('S3: la salida en pesos sale de SU saldo ($1.150.000,00), no del que venía de los dólares', /^\$1\.150\.000,00$/.test(r('x-sal-ars').saldo), JSON.stringify(r('x-sal-ars')));
ok('S3: la salida en dólares sale del saldo en dólares (USD 7.000,00)', /^USD 1\.000,00$/.test(r('x-sal-usd').sal) && /^USD 7\.000,00$/.test(r('x-sal-usd').saldo), JSON.stringify(r('x-sal-usd')));
ok('S3: la factura en dólares baja el saldo en dólares (USD 5.000,00)', /^USD 2\.000,00$/.test(r('0001-0002').sal) && /^USD 5\.000,00$/.test(r('0001-0002').saldo), JSON.stringify(r('0001-0002')));
ok('S3: el cobro del alquiler (en USD, cobrado en pesos) figura en pesos: $1.200.000,00 y saldo $2.250.000,00', /^\$1\.200\.000,00$/.test(r('U-1').ent) && /^\$2\.250\.000,00$/.test(r('U-1').saldo), JSON.stringify(r('U-1')));
ok('S3: una venta cobrada en dólares y sin cuenta va al saldo en dólares (USD 700,00 → USD 5.700,00)', /^USD 700,00$/.test(r('UF-1').ent) || fs.some(f => /^USD 700,00$/.test(f.ent) && /^USD 5\.700,00$/.test(f.saldo)), JSON.stringify(fs.filter(f => /UF-1/.test(f.desc))));
ok('S3: el último movimiento en pesos cierra en $2.300.000,00 y el de dólares en USD 5.700,00', fs.some(f => /^\$50\.000,00$/.test(f.ent) && /^\$2\.300\.000,00$/.test(f.saldo)) && fs.some(f => /^USD 700,00$/.test(f.ent) && /^USD 5\.700,00$/.test(f.saldo)), JSON.stringify(fs.map(f => f.saldo)));
const pl = await pill();
ok('S3: el cartelito del saldo muestra los dos saldos finales por moneda', /\$2\.300\.000,00/.test(pl) && /USD 5\.700,00/.test(pl), pl);
const th = await p.evaluate(() => (document.querySelector('#cbExtBody').closest('table').querySelector('thead tr').lastElementChild.previousElementSibling.innerText || ''));
ok('S3: la columna «Saldo acum.» avisa que, con monedas distintas, es por moneda', /por moneda/i.test(th), th);

// ───── S4: filtrar una cuenta: el saldo es el de ESA cuenta (antes arrastraba los movimientos de todas las demás) ─────
await armar({ cuenta: 'T-USD' });
fs = await filas();
ok('S4: la cuenta en dólares muestra sólo sus 3 movimientos', fs.length === 3 && fs.every(f => /Dolares/.test(f.cuenta)), JSON.stringify(fs));
ok('S4: saldos corridos de la cuenta en dólares: 8.000 → 7.000 → 5.000 (el último coincide con el «Saldo actual» de la cuenta)', fs.map(f => f.saldo).join('|') === 'USD 8.000,00|USD 7.000,00|USD 5.000,00', fs.map(f => f.saldo).join('|'));
ok('S4: el cartelito de la cuenta en dólares dice USD 5.000,00 y no mezcla pesos', /USD 5\.000,00/.test(await pill()) && !/\$\d/.test(await pill()), await pill());
await armar({ cuenta: 'T-ARS' });
fs = await filas();
ok('S4: la cuenta en pesos: 200.000 → 1.200.000, 50.000 → 1.150.000, 100.000 → 1.050.000, alquiler → 2.250.000', fs.map(f => f.saldo).join('|') === '$1.200.000,00|$1.150.000,00|$1.050.000,00|$2.250.000,00', fs.map(f => f.saldo).join('|'));
ok('S4: el cartelito de la cuenta en pesos dice $2.250.000,00 y no nombra dólares', /\$2\.250\.000,00/.test(await pill()) && !/USD/.test(await pill()), await pill());
const th2 = await p.evaluate(() => (document.querySelector('#cbExtBody').closest('table').querySelector('thead tr').lastElementChild.previousElementSibling.innerText || ''));
ok('S4: con una sola moneda a la vista la columna vuelve a llamarse «Saldo acum.»', !/por moneda/i.test(th2), th2);

// ───── S5: un «Desde» recorta la lista pero el saldo sigue siendo el acumulado de verdad ─────
await armar({ desde: 16 });
fs = await filas();
const sD = fs.find(f => /0001-0002/.test(f.desc)) || {};
ok('S5: con «Desde» la lista se recorta pero el saldo de los dólares sigue siendo el acumulado (USD 5.000,00)', fs.length < 9 && /^USD 5\.000,00$/.test(sD.saldo), JSON.stringify({ n: fs.length, sD }));

// ───── S6: sólo pesos: nada cambia, no aparece ningún renglón en dólares ─────
await armar({ soloPesos: true, sinVentaUsd: true });
const cEnt6 = await card('cbIngresosBancarios'), cNeto6 = await card('cbSaldoTotal');
fs = await filas();
ok('S6: sin nada en dólares las tarjetas muestran sólo pesos (entradas $1.450.000,00, neto $2.300.000,00)', /\$1\.450\.000,00/.test(cEnt6) && /\$2\.300\.000,00/.test(cNeto6) && !/USD/.test(cEnt6 + cNeto6), cEnt6 + ' | ' + cNeto6);
ok('S6: el extracto queda igual que siempre: un solo saldo corrido en pesos', fs.length > 0 && fs.every(f => /^\$/.test(f.saldo)) && /Saldo: \$2\.300\.000,00$/.test(norm(await pill())), JSON.stringify(fs.map(f => f.saldo)) + ' ' + await pill());

// ───── S7: «Saldo total» del Inicio: pesos y dólares por separado; un saldo en pesos NEGATIVO no se esconde ─────
// (la demo recalcula el nodo `caja` desde la Caja General antes de cada _hKPIs: con todo lo demás vacío la caja da cero y queda sólo el saldo de las cuentas)
const kpi = (saldoArs, saldoUsd) => p.evaluate(([sa, su]) => {
  ingGeneral = []; facturas = []; alquileres = []; ventas = []; servicios = []; datos = []; documentos = [];
  cuentasBancarias = [{ id: 'K-ARS', banco: 'Kpi Pesos', tipo: 'Cuenta Corriente', moneda: 'ARS', saldo: sa }, { id: 'K-USD', banco: 'Kpi Dolares', tipo: 'Caja de Ahorros USD', moneda: 'USD', saldo: su }];
  _hKPIs(); return { v: document.getElementById('kpiSaldoV').textContent, s: document.getElementById('kpiSaldoSub').textContent };
}, [saldoArs, saldoUsd]);
const k1 = await kpi(1000000, 5000);
ok('S7: Inicio → Saldo total: pesos arriba ($1.000.000,00) y los dólares aparte (+ USD 5.000,00)', /\$1\.000\.000,00/.test(k1.v) && /USD 5\.000,00/.test(k1.s) && !/USD/.test(k1.v), JSON.stringify(k1));
const k2 = await kpi(-500000, 5000);
ok('S7: con la cuenta en pesos en descubierto (−500.000) y dólares a favor, el descubierto se sigue viendo', /500\.000,00/.test(k2.v) && /USD 5\.000,00/.test(k2.s), JSON.stringify(k2));
const k3 = await kpi(0, 5000);
ok('S7: con pesos en cero y dólares a favor muestra los dólares (como siempre)', /USD 5\.000,00/.test(k3.v), JSON.stringify(k3));
const k4 = await kpi(1000000, -300);
ok('S7: con dólares en descubierto y pesos a favor, el descubierto en dólares se sigue viendo', /\$1\.000\.000,00/.test(k4.v) && /USD -300,00/.test(k4.s), JSON.stringify(k4));

// ───── S8: la pantalla de Bancos de la demo (datos reales de ejemplo) no tiene NaN ni undefined, y la cuenta en dólares no se mezcla ─────
await p.reload({ waitUntil: 'domcontentloaded' });
await entrarAlSistema(p);
await p.evaluate(() => { window.alert = () => {}; window.confirm = () => true; });
await irA(p, 'CuentasBancarias');
const demoTxt = await p.evaluate(() => document.getElementById('panelCuentasBancarias').innerText);
ok('S8: la demo muestra Bancos sin NaN ni undefined', !/NaN|undefined|Infinity/.test(demoTxt), demoTxt.slice(0, 300));
const demoCards = await p.evaluate(() => ['cbIngresosBancarios', 'cbEgresosBancarios', 'cbSaldoTotal'].map(i => document.getElementById(i).closest('.stat-card').innerText.replace(/\s+/g, ' ').trim()));
const demoCuentas = await p.evaluate(() => cuentasBancarias.map(c => ({ id: c.id, moneda: c.moneda })));
const hayUsd = demoCuentas.some(c => c.moneda === 'USD');
ok('S8: la demo tiene una cuenta en dólares y las tarjetas muestran el total en USD aparte', hayUsd && demoCards.every(t => /USD/.test(t)), JSON.stringify(demoCards));
// el saldo neto por moneda coincide con la suma de los saldos actuales de las cuentas de esa moneda + los movimientos sin cuenta
const cuadra = await p.evaluate(() => {
  const num = s => Number(String(s).replace(/[^\d,\-]/g, '').replace(',', '.'));
  const filas = [...document.querySelectorAll('#cbBody tr')].map(tr => { const t = [...tr.children].map(td => td.innerText.trim()); return { mon: t[3], act: num(t[6]) }; });
  const suma = m => filas.filter(f => f.mon === m).reduce((s, f) => s + f.act, 0);
  const txt = document.getElementById('cbSaldoTotal').closest('.stat-card').innerText;
  const mArs = /\$(-?[\d\.]+,\d\d)/.exec(txt), mUsd = /USD (-?[\d\.]+,\d\d)/.exec(txt);
  return { ars: mArs ? num(mArs[1]) : null, usd: mUsd ? num(mUsd[1]) : null, sumaArs: suma('ARS'), sumaUsd: suma('USD') };
});
ok('S8: en la demo el saldo neto en dólares es exactamente la suma de las cuentas en dólares', cuadra.usd != null && Math.abs(cuadra.usd - cuadra.sumaUsd) < 0.011, JSON.stringify(cuadra));
ok('S8: y el saldo neto en pesos es exactamente la suma de las cuentas en pesos (antes se llevaba los USD 12.100 de una factura en dólares)', cuadra.ars != null && Math.abs(cuadra.ars - cuadra.sumaArs) < 0.011, JSON.stringify(cuadra));

const malos = res.filter(x => x[0] === 'FALLA');
res.forEach(x => console.log(x.join(' ')));
const errs = errores.filter(e => !/gsi|Failed to load resource|tradingview/.test(e));
console.log(`\n${res.length - malos.length}/${res.length} OK` + (errs.length ? '\nerrores de página: ' + JSON.stringify(errs.slice(0, 5)) : ''));
await b.close();
process.exit(malos.length || errs.length ? 1 : 0);
