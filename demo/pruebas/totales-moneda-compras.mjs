// Totales de compras / egresos: (a) las notas de crédito RESTAN en el Libro de Compras (pantalla, resumen de IVA, impresión y Excel) y
// (b) los comprobantes en USD no se suman como si fueran pesos: cada total se separa por moneda (o, en el libro fiscal en pesos, se deja
// afuera con un aviso). Corre contra la demo (base en memoria); los datos se arman en memoria desde la prueba, sin tocar las semillas.
// Uso: node totales-moneda-compras.mjs   (ver README: hace falta bajar-cdn.sh antes)
import { abrirDemo, entrarAlSistema, irA } from './demo-lib.mjs';
const { b, p, errores } = await abrirDemo();
const res = [];
const ok = (n, c, x) => res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]);
await entrarAlSistema(p);
await p.evaluate(() => { window.__alerts = []; window.alert = m => window.__alerts.push(String(m)); window.confirm = () => true;
  window.__html = ''; window.open = () => ({ document: { write(h) { window.__html = h; }, close() {} } }); window._imprimirDocHTML = h => { window.__html = h; }; });

// ───── Datos: pesos, dólares y una nota de crédito (todo con fecha de este mes) ─────
const hoy = await p.evaluate(() => new Date().toISOString().slice(0, 10));
await p.evaluate((hoy) => {
  datos = []; ingGeneral = []; compRecibidos = []; comprobantesEmitidos = []; creditosProveedor = [];
  const pago = (id, mod, monto) => ({ pagoId: id, fecha: hoy, modalidad: mod, monto, totalRet: 0, baseImponible: monto });
  facturas = [
    { id: 'F1', proveedor: 'Prov Pesos', numero: '0001-00000001', fecha: hoy, importe: 121000, netoGravado: 100000, moneda: 'ARS', tipoComprobante: 'A', computaARCA: true, pagado: 0, estado: 'pendiente', pagosHistorial: [] },
    { id: 'F2', proveedor: 'Prov Pesos', numero: '0001-00000002', fecha: hoy, importe: 242000, netoGravado: 200000, moneda: 'ARS', tipoComprobante: 'A', computaARCA: true, pagado: 100000, estado: 'parcial', pagosHistorial: [pago('P2', 'A', 100000)] },
    { id: 'F3', proveedor: 'Prov Dólares', numero: '0002-00000003', fecha: hoy, importe: 1000, netoGravado: 826.45, moneda: 'USD', tipoComprobante: 'A', computaARCA: true, pagado: 400, estado: 'parcial', pagosHistorial: [pago('P3', 'B', 400)] },
    { id: 'NC1', proveedor: 'Prov Pesos', numero: '0001-00000009', fecha: hoy, importe: 12100, moneda: 'ARS', tipoComprobante: 'A', computaARCA: true, esNotaCredito: true, notaCreditoDe: 'F1', notaCreditoKind: 'fact', pagado: 0, estado: 'pagada' },
    { id: 'FM1', proveedor: 'Prov Mixto', numero: 'X-1', fecha: hoy, importe: 100000, moneda: 'ARS', tipoComprobante: 'X', computaARCA: false, pagado: 0, estado: 'pendiente', pagosHistorial: [] },
    { id: 'FM2', proveedor: 'Prov Mixto', numero: 'X-2', fecha: hoy, importe: 500, moneda: 'USD', tipoComprobante: 'X', computaARCA: false, pagado: 200, estado: 'parcial', pagosHistorial: [pago('P4', 'B', 200)] }
  ];
  documentos = [
    { id: 'D1', proveedor: 'Prov Pesos', numero: 'D-1', fecha: hoy, importe: 50000, moneda: 'ARS', pagado: 20000, pagosHistorial: [pago('P5', 'B', 20000)] },
    { id: 'D2', proveedor: 'Prov Dólares', numero: 'D-2', fecha: hoy, importe: 200, moneda: 'USD', pagado: 50, pagosHistorial: [pago('P6', 'B', 50)] }
  ];
}, hoy);
const txt = (sel) => p.evaluate((s) => { const e = document.querySelector(s); return e ? e.innerText.replace(/\s+/g, ' ').trim() : '(no existe ' + s + ')'; }, sel);
const fila = (tbody, re) => p.evaluate(([t, re]) => { const r = [...document.querySelectorAll(t + ' tr')].find(x => new RegExp(re).test(x.innerText)); return r ? r.innerText.replace(/\s+/g, ' ').trim() : '(sin fila ' + re + ')'; }, [tbody, re]);

// ───── S1: Libro de Compras en pantalla ─────
await irA(p, 'Reportes');
await p.evaluate(() => { document.getElementById('rptQuincena').value = '0'; rptActualizar(); });
await p.waitForTimeout(200);
const foot = await txt('#rptComprasFoot');
ok('S1: el total del Libro de Compras RESTA la nota de crédito (neto 300.000 − 10.000 = $ 290.000,00)', /\$ 290\.000,00/.test(foot) && !/\$ 310\.000,00/.test(foot), foot);
ok('S1: el IVA del libro resta el de la NC ($ 63.000 − 2.100 = $ 60.900,00)', /\$ 60\.900,00/.test(foot) && !/\$ 65\.100,00/.test(foot), foot);
ok('S1: el total con IVA resta la NC ($ 363.000 − 12.100 = $ 350.900,00)', /\$ 350\.900,00/.test(foot) && !/\$ 375\.100,00/.test(foot), foot);
ok('S1: la fila de la nota de crédito sale en negativo', /-12\.100,00/.test(await fila('#rptComprasBody', '0001-00000009')), await fila('#rptComprasBody', '0001-00000009'));
ok('S1: la fila en dólares se ve como USD (no como pesos)', /USD 1\.000,00/.test(await fila('#rptComprasBody', '0002-00000003')), await fila('#rptComprasBody', '0002-00000003'));
ok('S1: el pie avisa que 1 comprobante en USD no está incluido en los totales', /1 comprobante en USD no incluido/.test(foot), foot);
ok('S1: el total en pesos no suma los 1.000 dólares (nada de $ 351.900,00)', !/351\.900,00/.test(foot), foot);

// ───── S2: resumen de IVA ─────
const st = await txt('#rptStats');
ok('S2: «IVA Compras (crédito fiscal)» resta el IVA de la nota de crédito ($ 60.900,00)', /IVA Compras[^$]*\$ 60\.900,00/.test(st), st);
ok('S2: el subtítulo suma el total neto de NC y deja afuera los dólares ($ 350.900,00)', /Total \$ 350\.900,00/.test(st) && /USD/.test(st), st);

// ───── S3: impresión ─────
await p.evaluate(() => rptImprimir('compras'));
const imp = await p.evaluate(() => window.__html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
ok('S3: la impresión del libro también resta la NC ($ 350.900,00) y avisa de los USD', /\$ 350\.900,00/.test(imp) && /en USD no incluido/.test(imp), imp.slice(-400));

// ───── S4: Excel ─────
const xl = await p.evaluate(() => { let wb = null; const w = XLSX.writeFile; XLSX.writeFile = (b2) => { wb = b2; }; rptExportar('compras'); XLSX.writeFile = w; return XLSX.utils.sheet_to_json(wb.Sheets['IVA Compras']); });
const nc = xl.find(r => r['Nro Factura'] === '0001-00000009'), fu = xl.find(r => r['Nro Factura'] === '0002-00000003'), f1 = xl.find(r => r['Nro Factura'] === '0001-00000001');
ok('S4: en el Excel la nota de crédito va en negativo (neto −10.000, IVA −2.100, total −12.100)', nc && nc['Total'] === -12100 && nc['IVA $'] === -2100 && nc['Neto Gravado'] === -10000, JSON.stringify(nc));
ok('S4: el Excel trae la columna Moneda: la factura en dólares dice USD y las demás ARS', fu && fu['Moneda'] === 'USD' && f1 && f1['Moneda'] === 'ARS', JSON.stringify([fu, f1]));

// ───── S5: Facturas ─────
await irA(p, 'Facturas');
await p.evaluate(() => renderFacturas());
const kf = await txt('#facturasTotal');
ok('S5: «Total a pagar» de Facturas suma sólo los pesos ($350.900,00) y muestra los dólares aparte (USD 900,00)', /\$350\.900,00/.test(kf) && /USD 900,00/.test(kf) && !/351\.800,00/.test(kf), kf);
ok('S5: lo «Pagado» de una factura en dólares se rotula USD', /USD 400,00/.test(await fila('#facturasBody', '0002-00000003')), await fila('#facturasBody', '0002-00000003'));

// ───── S6: Pagos a proveedores ─────
await irA(p, 'Pagos');
await p.evaluate(() => renderPagos());
const tp = await txt('#pagTotalPagado'), tb = await txt('#pagTotalBanco'), te = await txt('#pagTotalEfectivo'), tn = await txt('#pagTotalNeto');
ok('S6: «Total pagado» = $120.000,00 en pesos y USD 650,00 aparte (no 120.650)', /\$120\.000,00/.test(tp) && /USD 650,00/.test(tp) && !/120\.650/.test(tp), tp);
ok('S6: Bancarizado = $100.000,00 (sin dólares)', /\$100\.000,00/.test(tb) && !/USD/.test(tb), tb);
ok('S6: Efectivo = $20.000,00 y USD 650,00 aparte', /\$20\.000,00/.test(te) && /USD 650,00/.test(te), te);
ok('S6: Neto pagado separa pesos y dólares', /\$120\.000,00/.test(tn) && /USD 650,00/.test(tn), tn);
ok('S6: el renglón de un pago en dólares se rotula USD', /USD 400,00/.test(await fila('#pagosBody', '0002-00000003|Fact\\.0002')), await fila('#pagosBody', '0002-00000003|Fact\\.0002'));

// ───── S7: Documentos ─────
await irA(p, 'Documentos');
await p.evaluate(() => renderDocumentos());
const dt = await txt('#docsTotal'), pie = await txt('#documentosFoot');
ok('S7: «Total documentado» en pesos resta la NC ($500.900,00) y los dólares van aparte (USD 1.700,00)', /\$500\.900,00/.test(dt) && /USD 1\.700,00/.test(dt), dt);
ok('S7: el pie de la lista coincide con la tarjeta (la NC resta, no suma)', /\$500\.900,00/.test(pie) && /USD 1\.700,00/.test(pie) && !/525\.100,00/.test(pie), pie);

// ───── S8: Resumen de egresos ─────
await irA(p, 'Egresos');
await p.evaluate(() => renderEgresos());
const eA = await txt('#egresosTotalARS'), eU = await txt('#egresosTotalUSD');
const eUesp = await p.evaluate(() => (120000 / exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 2 }));
ok('S8: «Total Egresos (ARS)» = $120.000,00: los pagos en dólares no se suman como pesos', /\$120\.000,00/.test(eA) && !/120\.650/.test(eA), eA);
ok('S8: el subtítulo aclara que además se pagaron USD 650,00', /USD 650,00/.test(await txt('#egresosSubARS')), await txt('#egresosSubARS'));
ok('S8: «Total Egresos (USD)» es el equivalente del total en pesos (no el de pesos + dólares convertidos otra vez)', eU.indexOf('USD ' + eUesp) >= 0, eU + ' / esperado USD ' + eUesp);
const rPesos = await fila('#egresosBody', 'Prov Pesos'), rDol = await fila('#egresosBody', 'Prov Dólares'), rMix = await fila('#egresosBody', 'Prov Mixto');
ok('S8: el proveedor en pesos queda en $120.000,00 y sin USD', /\$120\.000,00/.test(rPesos) && !/USD/.test(rPesos), rPesos);
ok('S8: el proveedor en dólares muestra sus USD 450,00 y $0,00 en pesos', /USD 450,00/.test(rDol) && !/\$[1-9]/.test(rDol.replace(/\$0,00/g, '')), rDol);
ok('S8: el proveedor con comprobantes de las dos monedas los muestra separados ($0,00 + USD 200,00)', /USD 200,00/.test(rMix), rMix);

// ───── S9: Proveedores → comprobantes pendientes ─────
await irA(p, 'Proveedores');
await p.evaluate(() => { setProvPendVista('ambos'); });
const pp = await fila('#provPendientesBody', 'Saldo pendiente total');
ok('S9: el total de pendientes de proveedores muestra pesos ($380.900,00) y dólares aparte (USD 1.050,00)', /\$380\.900,00/.test(pp) && /USD 1\.050,00/.test(pp), pp);

// ───── S10: cuenta corriente de un proveedor con las dos monedas ─────
const cc = await p.evaluate(() => { const c = _ctaCteProvMovs('Prov Mixto'); return { debe: c.totalDebe, haber: c.totalHaber, saldo: c.saldoComprob, pagado: c.totalPagado, usd: c.usd ? { debe: c.usd.totalDebe, haber: c.usd.totalHaber, saldo: c.usd.saldoComprob, pagado: c.usd.totalPagado } : null }; });
ok('S10: la cuenta corriente deja en pesos sólo lo de pesos (debe 100.000, saldo 100.000)', cc.debe === 100000 && cc.saldo === 100000 && cc.pagado === 0, JSON.stringify(cc));
ok('S10: y lleva aparte lo de dólares (debe 500, pagado 200, saldo 300)', cc.usd && cc.usd.debe === 500 && cc.usd.pagado === 200 && cc.usd.saldo === 300, JSON.stringify(cc));
await irA(p, 'CuentaCorriente');
await p.evaluate(() => { renderCuentaCorriente(); const s = document.getElementById('ccProvSelect'); s.value = [...s.options].find(o => o.textContent === 'Prov Mixto').value; ccOnSelect(); });
const ccp = await txt('#ccContenido');
ok('S10: el panel muestra «Adeudado» en pesos ($100.000,00) y en dólares (USD 300,00), sin mezclar', /\$100\.000,00/.test(ccp) && /USD 300,00/.test(ccp) && !/\$100\.300,00/.test(ccp) && !/\$100\.500,00/.test(ccp), ccp.slice(0, 500));
const filasExt = await p.evaluate(() => [...document.querySelectorAll('#ccContenido table')].pop().innerText.replace(/\s+/g, ' '));
ok('S10: el extracto lleva el saldo corrido de cada moneda por separado (USD 500,00 → USD 300,00)', /USD 500,00/.test(filasExt) && /USD 300,00/.test(filasExt) && !/\$100\.500,00/.test(filasExt), filasExt);
await p.evaluate(() => _ccImprimir('Prov Mixto'));
const ccimp = await p.evaluate(() => window.__html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
ok('S10: la cuenta corriente impresa también separa las monedas', /USD 300,00/.test(ccimp) && !/100\.300,00/.test(ccimp), ccimp.slice(0, 500));

// ───── S11: ficha del proveedor ─────
await p.evaluate(() => verFichaProveedor('Prov Mixto'));
const fi = await txt('#fichaProv_contenido');
ok('S11: la ficha del proveedor no mezcla: adeudado $100.000,00 + USD 300,00', /\$100\.000,00/.test(fi) && /USD 300,00/.test(fi) && !/\$100\.300,00/.test(fi), fi.slice(0, 600));
await p.evaluate(() => document.getElementById('modalFichaProv').classList.remove('active'));

// ───── S13: pestaña Pagos de la ficha del proveedor + ficha impresa ─────
const pg = await p.evaluate(() => buildProvPagosHTML('Prov Mixto').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
ok('S13: «Total pagado al proveedor» no mezcla: $0,00 en pesos y USD 200,00 aparte', /Total pagado al proveedor:\s*\$0,00\s*USD 200,00/.test(pg), pg.slice(-300));
ok('S13: el pago en dólares se ve como USD 200,00 (no como $200,00)', /USD 200,00/.test(pg) && !/\$200,00/.test(pg), pg);
await p.evaluate(() => imprimirFichaProvPDF('Prov Mixto'));
const fp = await p.evaluate(() => window.__html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
ok('S13: la ficha impresa lleva los totales en dólares aparte (USD 500,00 facturados · USD 300,00 de saldo)', /USD 500,00/.test(fp) && /USD 300,00/.test(fp) && !/\$100\.500,00/.test(fp) && !/\$100\.300,00/.test(fp), fp.slice(fp.indexOf('Estado de cuenta'), fp.indexOf('Estado de cuenta') + 700));

// ───── S14: posición de IVA con la NC ─────
await irA(p, 'Reportes'); await p.evaluate(() => rptActualizar());
const pos = await txt('#rptStats');
ok('S14: la posición de IVA queda «a favor» por $ 60.900,00 (el crédito fiscal neto de la NC)', /Posición IVA del período \$ 60\.900,00 A favor/.test(pos), pos);

// ───── S15: un pago grupal que mezcla pesos y dólares no se junta en un solo renglón ─────
await p.evaluate((hoy) => {
  const g = (id, mon, monto) => ({ pagoId: id, fecha: hoy, modalidad: 'A', monto, totalRet: 0, grupoPagoId: 'G1', nroCorrelativo: 'OP-1' });
  facturas.push({ id: 'G_A', proveedor: 'Prov Grupo', numero: 'G-1', fecha: hoy, importe: 1000, moneda: 'ARS', computaARCA: false, tipoComprobante: 'X', pagado: 1000, estado: 'pagada', pagosHistorial: [g('PG1', 'ARS', 1000)] });
  facturas.push({ id: 'G_B', proveedor: 'Prov Grupo', numero: 'G-2', fecha: hoy, importe: 10, moneda: 'USD', computaARCA: false, tipoComprobante: 'X', pagado: 10, estado: 'pagada', pagosHistorial: [g('PG2', 'USD', 10)] });
}, hoy);
await irA(p, 'Pagos'); await p.evaluate(() => { document.getElementById('pagBuscador').value = 'Prov Grupo'; renderPagos(); });
const filasG = await p.evaluate(() => [...document.querySelectorAll('#pagosBody tr')].map(r => r.innerText.replace(/\s+/g, ' ').trim()));
const tG = await txt('#pagTotalPagado');
ok('S15: el pago grupal con una factura en pesos y otra en dólares sale en DOS renglones (uno por moneda)', filasG.length === 2 && filasG.some(r => /USD 10,00/.test(r)) && filasG.some(r => /\$1\.000,00/.test(r) && !/USD/.test(r)), JSON.stringify(filasG));
ok('S15: el total de ese filtro: $1.000,00 y USD 10,00 por separado (nada de 1.010)', /\$1\.000,00/.test(tG) && /USD 10,00/.test(tG) && !/1\.010/.test(tG), tG);
await p.evaluate(() => { document.getElementById('pagBuscador').value = ''; renderPagos(); });
await p.evaluate(() => { facturas = facturas.filter(f => f.proveedor !== 'Prov Grupo'); });

// ───── S16: otros casos del Libro de Compras ─────
await p.evaluate((hoy) => {
  facturas.push({ id: 'NCU', proveedor: 'Prov Dólares', numero: '0002-00000010', fecha: hoy, importe: 121, moneda: 'USD', tipoComprobante: 'A', computaARCA: true, esNotaCredito: true, notaCreditoDe: 'F3', pagado: 0, estado: 'pagada' });
  facturas.push({ id: 'NCX', proveedor: 'Prov Pesos', numero: 'X-NC', fecha: hoy, importe: 5000, moneda: 'ARS', tipoComprobante: 'X', computaARCA: false, esNotaCredito: true, pagado: 0, estado: 'pagada' });
  facturas.push({ id: 'NCN', proveedor: 'Prov Pesos', numero: '0001-00000011', fecha: hoy, importe: -2420, moneda: 'ARS', tipoComprobante: 'A', computaARCA: true, esNotaCredito: true, pagado: 0, estado: 'pagada' });
}, hoy);
await irA(p, 'Reportes'); await p.evaluate(() => rptActualizar());
const foot2 = await txt('#rptComprasFoot');
ok('S16: una NC en USD tampoco entra al total en pesos ($ 350.900,00 − 2.420 de la NC cargada con signo = $ 348.480,00) y suma a los comprobantes en USD', /\$ 348\.480,00/.test(foot2) && /2 comprobantes en USD no incluidos/.test(foot2), foot2);
ok('S16: una NC cargada con importe negativo resta igual (una sola vez, no suma)', !/\$ 353\.320,00/.test(foot2), foot2);
ok('S16: una NC «X» (no computa para ARCA) no figura en el libro', !(await txt('#rptComprasBody')).includes('X-NC'), await txt('#rptComprasBody'));
const stat2 = await txt('#rptStats');
ok('S16: el resumen de IVA cuenta 2 comprobantes en USD afuera', /2 en USD no incluidos/.test(stat2), stat2);

// ───── S17: egresos de Caja/Banco en dólares ─────
await p.evaluate((hoy) => {
  ingGeneral = [
    { id: 'E1', tipo: 'mov_egreso_caja', fecha: hoy, origen: 'Compra de insumos', moneda: 'ARS', monto: 700, esEgreso: true, tipoAB: 'B' },
    { id: 'E2', tipo: 'mov_egreso_caja', fecha: hoy, origen: 'Gasto en dólares', moneda: 'USD', monto: 300, esEgreso: true, tipoAB: 'B' }
  ];
}, hoy);
await irA(p, 'Egresos'); await p.evaluate(() => renderEgresos());
ok('S17: un egreso de caja en dólares no suma a los pesos ($120.700,00) y se agrega a lo pagado en USD (USD 950,00)', /\$120\.700,00/.test(await txt('#egresosTotalARS')) && /USD 950,00/.test(await txt('#egresosSubARS')), (await txt('#egresosTotalARS')) + ' / ' + (await txt('#egresosSubARS')));
const rCaja = await fila('#egresosBody', 'Movimientos de Caja');
ok('S17: y en la tabla por proveedor la fila de Caja/Banco separa $700,00 de USD 300,00', /\$700,00/.test(rCaja) && /USD 300,00/.test(rCaja), rCaja);

// ───── S12: sin comprobantes en dólares nada cambia (ni aparece «USD» de más) ─────
await p.evaluate(() => { facturas = facturas.filter(f => f.moneda !== 'USD'); documentos = documentos.filter(d => d.moneda !== 'USD'); });
await irA(p, 'Facturas'); await p.evaluate(() => renderFacturas());
ok('S12: sin dólares, «Total a pagar» queda sólo en pesos', !/USD/.test(await txt('#facturasTotal')) && /\$350\.600,00|\$350\.900,00/.test(await txt('#facturasTotal')), await txt('#facturasTotal'));
await irA(p, 'Reportes'); await p.evaluate(() => rptActualizar());
ok('S12: sin dólares, el libro no avisa nada de USD', !/USD/.test(await txt('#rptComprasFoot')), await txt('#rptComprasFoot'));
await irA(p, 'Pagos'); await p.evaluate(() => renderPagos());
ok('S12: sin dólares, Pagos no muestra USD', !/USD/.test(await txt('#pagTotalPagado')), await txt('#pagTotalPagado'));

const malos = res.filter(x => x[0] === 'FALLA');
res.forEach(x => console.log(x.join(' ')));
const errs = errores.filter(e => !/gsi|Failed to load resource|tradingview/.test(e));
console.log(`\n${res.length - malos.length}/${res.length} OK` + (errs.length ? '\nerrores de página: ' + JSON.stringify(errs.slice(0, 5)) : ''));
await b.close();
process.exit(malos.length || errs.length ? 1 : 0);
