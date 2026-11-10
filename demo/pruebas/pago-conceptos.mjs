// Pagar un comprobante repartido por CONCEPTOS, cada uno con su régimen de retención (venta de bienes → Reg.78, servicios de colocación → Reg.94…).
// Corre contra la demo (base en memoria). Uso: node pago-conceptos.mjs   (ver README: hace falta bajar-cdn.sh antes)
import { abrirDemo, entrarAlSistema } from './demo-lib.mjs';
const { b, p, errores } = await abrirDemo();
const res = [];
const ok = (n, c, x) => res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]);
await entrarAlSistema(p);
await p.evaluate(() => { window.__alerts = []; window.alert = m => window.__alerts.push(String(m)); window.confirm = () => false; window.__xss = undefined; window.__op = null;
  window.imprimirFacturaMasOP = function () { window.__op = Array.prototype.slice.call(arguments); }; });
const cerca = (x, y, t = 0.011) => Math.abs(x - y) <= t;
const fx = () => p.evaluate(() => ({ mes: (document.getElementById('pagoFDFecha').value || '').slice(0, 7) }));

// ── datos: un proveedor con Reg.78 y Reg.94, tres facturas ──
await p.evaluate(() => {
  proveedores.push({ id: 'pv_conc', razonSocial: 'Colocaciones SA', cuit: '30-50000000-1', ret78: true, ret94: true });
  proveedores.push({ id: 'pv_exe', razonSocial: 'Exento SA', cuit: '30-50000000-2', ret78: true, exentoRetenciones: true });
  const base = { proveedor: 'Colocaciones SA', fecha: '2026-11-01', moneda: 'ARS', pagosHistorial: [], estado: 'pendiente', tipoComprobante: 'A', pagado: 0 };
  facturas.push(Object.assign({}, base, { id: 'fc_1', numero: 'A-0001', descripcion: 'Bienes y colocación', importe: 1210000, netoGravado: 1000000,
    items: [{ detalle: 'Placas de cerámica', cantidad: 10, precioUnit: 60000 }, { detalle: 'Colocación', cantidad: 1, precioUnit: 400000 }] }));
  facturas.push(Object.assign({}, base, { id: 'fc_2', numero: 'A-0002', descripcion: 'Otra', importe: 121000, netoGravado: 100000 }));
  facturas.push(Object.assign({}, base, { id: 'fc_3', numero: 'A-0003', descripcion: 'Tres', importe: 1210000, netoGravado: 1000000 }));
  facturas.push(Object.assign({}, base, { id: 'fc_x', proveedor: 'Exento SA', numero: 'X-1', descripcion: 'Exento', importe: 100000 }));
  facturas.push(Object.assign({}, base, { id: 'fc_sr', numero: 'S-1', descripcion: 'Sin ret', importe: 100000, sinRetencion: true }));
  return Promise.all([persistirProveedores(), persistirFacturas()]);
});
await p.waitForTimeout(300);
const idx = (id) => p.evaluate((id) => facturas.findIndex(f => f.id === id), id);
const abrir = async (id) => { const i = await idx(id); await p.evaluate((i) => { abrirPagoFD('fact', String(i)); }, i); await p.waitForTimeout(150); };
const estado = () => p.evaluate(() => ({
  boxVisible: document.getElementById('pagoFDConcBox').style.display !== 'none',
  panelVisible: document.getElementById('pagoFDConcPanel').style.display !== 'none',
  lineas: document.querySelectorAll('#pagoFDConcLineas .pago-conc-fila').length,
  base: document.getElementById('pagoFDBase').value, baseRO: document.getElementById('pagoFDBase').readOnly,
  rets: _pagoFDRetsCalculadas.map(r => ({ c: r.codigo, m: Math.round(r.monto * 100) / 100, b: r.baseReg, s: r.sobre })),
  total: document.getElementById('pagoFDRetTotal').textContent,
  aviso: document.getElementById('pagoFDRegAviso').textContent }));

// ═════════ A: aparece el bloque y arranca igual que siempre ═════════
await abrir('fc_1');
let e = await estado();
ok('A1: con un comprobante de un proveedor con retenciones aparece «Repartir el pago por conceptos»', e.boxVisible && !e.panelVisible, JSON.stringify(e));
ok('A2: sin prender el reparto la retención es la de siempre (Reg.78 y Reg.94 sobre la base única)', e.rets.length === 2 && !e.rets[0].s, JSON.stringify(e.rets));
const baseAuto = Number(e.base);
ok('A3: la base calculada del comprobante es el neto gravado (1.000.000)', cerca(baseAuto, 1000000), e.base);

// ═════════ B: prender el reparto ═════════
await p.evaluate(() => { const c = document.getElementById('pagoFDConcOn'); c.checked = true; pagoFDConcToggle(true); });
e = await estado();
ok('B1: se abre el panel con dos conceptos y la base pasa a ser la suma (sólo lectura)', e.panelVisible && e.lineas === 2 && e.baseRO && cerca(Number(e.base), 1000000), JSON.stringify(e));
const ids = await p.evaluate(() => _pagoFDConc.lineas.map(l => l.id));
const regs0 = await p.evaluate(() => _pagoFDConc.lineas.map(l => l.regs.slice()));
ok('B2: el primer concepto arranca con los regímenes del proveedor y el segundo sin ninguno (= como siempre)', JSON.stringify(regs0) === JSON.stringify([['78', '94'], []]), JSON.stringify(regs0));

// bienes (Reg.78) 600.000 y colocación (Reg.94) 400.000
await p.evaluate(([a, b]) => { pagoFDConcCampo(a, 'desc', 'Venta de bienes'); pagoFDConcCampo(a, 'base', '600000'); pagoFDConcReg(a, '94'); pagoFDConcCampo(b, 'desc', 'Servicios de colocación'); pagoFDConcReg(b, '94'); }, ids);
e = await estado();
const l2 = await p.evaluate(() => _pagoFDConc.lineas.map(l => ({ d: l.desc, b: l.base, r: l.regs.slice() })));
ok('B3: el segundo concepto toma el RESTO (400.000) y la base total sigue siendo 1.000.000', cerca(l2[1].b, 400000) && cerca(Number(e.base), 1000000), JSON.stringify(l2) + e.base);
ok('B4: cada concepto retiene por su régimen: bienes → Reg.78, colocación → Reg.94', JSON.stringify(l2.map(l => l.r)) === JSON.stringify([['78'], ['94']]), JSON.stringify(l2));
const r78 = e.rets.find(r => r.c === '78'), r94 = e.rets.find(r => r.c === '94');
ok('B5: Reg.78 se calcula sólo sobre los bienes: (600.000 − 224.000) × 2% = 7.520', r78 && cerca(r78.m, 7520) && cerca(r78.b, 600000), JSON.stringify(e.rets));
ok('B6: Reg.94 se calcula sólo sobre la colocación: (400.000 − 67.170) × 2% = 6.656,60', r94 && cerca(r94.m, 6656.6) && cerca(r94.b, 400000), JSON.stringify(e.rets));
ok('B7: cada retención dice de qué concepto sale', /Venta de bienes/.test(r78.s) && /colocaci/i.test(r94.s) && !/colocaci/i.test(r78.s), JSON.stringify(e.rets));
ok('B8: el aviso explica la base por régimen', /Retención por concepto/.test(e.aviso) && /600\.000/.test(e.aviso) && /400\.000/.test(e.aviso), e.aviso);

// tildar/destildar: una línea sin régimen no retiene
await p.evaluate(([a]) => { pagoFDConcReg(a, '78'); }, ids);
e = await estado();
ok('B9: sin Reg.78 en ningún concepto la retención de bienes desaparece y queda sólo Reg.94', e.rets.length === 1 && e.rets[0].c === '94', JSON.stringify(e.rets));
await p.evaluate(([a]) => { pagoFDConcReg(a, '78'); }, ids);

// tipear la última a mano: manda lo tipeado y avisa que no cierra con el comprobante
await p.evaluate(([a, b]) => { pagoFDConcCampo(b, 'base', '300000'); }, ids);
e = await estado();
const res1 = await p.evaluate(() => document.getElementById('pagoFDConcResumen').textContent);
ok('B10: tipear el último concepto a mano cambia la base total (900.000) y avisa la diferencia con el comprobante', cerca(Number(e.base), 900000) && /completar con el resto/.test(res1), e.base + ' | ' + res1);
await p.evaluate(() => pagoFDConcResto());
e = await estado();
ok('B11: «completar con el resto» vuelve a cerrar en 1.000.000', cerca(Number(e.base), 1000000), e.base);

// el monto a pagar cambia: el aviso «la base supera el monto» se pone al día solo
await p.evaluate(() => { document.getElementById('pagoFDMonto').value = 500000; pagoFDRecalcRet(); });
const res2 = await p.evaluate(() => document.getElementById('pagoFDConcResumen').textContent);
ok('B12: si la base neta supera el monto a pagar avisa (aunque se haya tocado sólo el monto)', /supera el monto/.test(res2), res2);
await p.evaluate(() => { document.getElementById('pagoFDMonto').value = 1210000; pagoFDRecalcRet(); });

// ═════════ C: guardar ═════════
await p.evaluate(() => { document.getElementById('pagoFDMonto').value = 1210000; });
await p.evaluate(() => { _pagoFDConcSync(); });
const fechaMes = (await fx()).mes;
await p.evaluate(() => _guardarPagoFDInterno());
await p.waitForTimeout(400);
const pg = await p.evaluate(() => { const f = facturas.find(x => x.id === 'fc_1'); return JSON.parse(JSON.stringify(f.pagosHistorial[0] || null)); });
ok('C1: el pago se guardó con su reparto (conceptosRet)', pg && Array.isArray(pg.conceptosRet) && pg.conceptosRet.length === 2, JSON.stringify(pg));
ok('C2: conceptosRet lleva nombre, base y régimen de cada uno', pg && pg.conceptosRet[0].desc === 'Venta de bienes' && cerca(pg.conceptosRet[0].base, 600000) && JSON.stringify(pg.conceptosRet[0].regimenes) === '["78"]'
  && /colocaci/i.test(pg.conceptosRet[1].desc) && JSON.stringify(pg.conceptosRet[1].regimenes) === '["94"]', JSON.stringify(pg && pg.conceptosRet));
ok('C3: basesReg guarda la base de CADA régimen (78 → 600.000 y 94 → 400.000) y baseImponible la suma', pg && JSON.stringify(pg.basesReg.map(x => [x.codigo, x.base])) === JSON.stringify([['78', 600000], ['94', 400000]]) && cerca(pg.baseImponible, 1000000), JSON.stringify(pg));
ok('C4: cada retención guarda su base y de qué concepto sale', pg && pg.retenciones.length === 2 && cerca(pg.retenciones[0].base, 600000) && /Venta de bienes/.test(pg.retenciones[0].sobre) && /colocaci/i.test(pg.retenciones[1].sobre), JSON.stringify(pg && pg.retenciones));
ok('C5: totalRet = suma de las retenciones (14.176,60)', pg && cerca(pg.totalRet, 14176.6) && cerca(pg.retenciones.reduce((s, r) => s + r.monto, 0), pg.totalRet), JSON.stringify(pg && pg.totalRet));
const op = await p.evaluate(() => window.__op && { rets: window.__op[4] });
ok('C6: la Orden de Pago recibe cada retención con su concepto', op && op.rets.length === 2 && /Venta de bienes/.test(op.rets[0].sobre), JSON.stringify(op));
const acum = await p.evaluate((mes) => ({ a78: acumuladoMensual('Colocaciones SA', mes, '78'), a94: acumuladoMensual('Colocaciones SA', mes, '94'), a119: acumuladoMensual('Colocaciones SA', mes, '119') }), fechaMes);
ok('C7: el acumulado del mes lleva la base de cada régimen por separado (78: 600.000 / 94: 400.000 / 119: 0)', cerca(acum.a78.baseAcum, 600000) && cerca(acum.a94.baseAcum, 400000) && acum.a119.baseAcum === 0, JSON.stringify(acum));

// ═════════ D: el siguiente pago del mes acumula POR RÉGIMEN ═════════
await abrir('fc_2');
e = await estado();
const r78b = e.rets.find(r => r.c === '78'), r94b = e.rets.find(r => r.c === '94');
// base 100.000 más lo acumulado: 78 → (700.000 − 224.000) × 2% − 7.520 = 2.000 ; 94 → (500.000 − 67.170) × 2% − 6.656,60 = 2.000
ok('D1: un pago común del mismo mes suma a cada régimen SU base acumulada (78 y 94 retienen $2.000 cada uno)', r78b && r94b && cerca(r78b.m, 2000) && cerca(r94b.m, 2000), JSON.stringify(e.rets));

// ═════════ E: un concepto sin régimen y todos sin régimen ═════════
await abrir('fc_3');
await p.evaluate(() => { document.getElementById('pagoFDConcOn').checked = true; pagoFDConcToggle(true); });
const ids3 = await p.evaluate(() => _pagoFDConc.lineas.map(l => l.id));
await p.evaluate(([a, b]) => { pagoFDConcCampo(a, 'desc', 'Materiales exentos'); pagoFDConcCampo(a, 'base', '500000'); pagoFDConcReg(a, '78'); pagoFDConcReg(a, '94'); pagoFDConcCampo(b, 'desc', 'Mano de obra'); pagoFDConcReg(b, '94'); }, ids3);
e = await estado();
ok('E1: un concepto sin ningún régimen (materiales) no retiene y el otro sí: sólo Reg.94 sobre 500.000', e.rets.length === 1 && e.rets[0].c === '94' && cerca(e.rets[0].b, 500000), JSON.stringify(e.rets));
await p.evaluate(() => { document.getElementById('pagoFDMonto').value = 1210000; });
await p.evaluate(() => _guardarPagoFDInterno());
await p.waitForTimeout(300);
const pg3 = await p.evaluate(() => JSON.parse(JSON.stringify(facturas.find(x => x.id === 'fc_3').pagosHistorial[0] || null)));
ok('E2: basesReg sólo tiene Reg.94 (500.000) y baseImponible es la suma de los dos conceptos (1.000.000)', pg3 && JSON.stringify(pg3.basesReg.map(x => [x.codigo, x.base])) === JSON.stringify([['94', 500000]]) && cerca(pg3.baseImponible, 1000000), JSON.stringify(pg3));
ok('E3: el concepto sin régimen no guarda «regimenes» (Firebase no guarda arreglos vacíos)', pg3 && pg3.conceptosRet.some(c => c.regimenes === undefined) && !pg3.sinRetencion, JSON.stringify(pg3 && pg3.conceptosRet));

// todos sin régimen: el pago se marca «sin retención» y no suma base a ningún régimen
await p.evaluate(async () => { facturas.push({ id: 'fc_4', proveedor: 'Colocaciones SA', fecha: '2026-11-02', numero: 'A-4', descripcion: 'Cuatro', importe: 121000, netoGravado: 100000, moneda: 'ARS', pagosHistorial: [], estado: 'pendiente', tipoComprobante: 'A', pagado: 0 }); await persistirFacturas(); });
await abrir('fc_4');
await p.evaluate(() => { document.getElementById('pagoFDConcOn').checked = true; pagoFDConcToggle(true); const l = _pagoFDConc.lineas[0]; l.regs = []; _pagoFDConcRender(); _pagoFDConcSync(); document.getElementById('pagoFDMonto').value = 121000; });
e = await estado();
ok('E4: con todos los conceptos sin régimen no se calcula ninguna retención', e.rets.length === 0 && /ningún concepto lleva retención/i.test(e.aviso), JSON.stringify(e));
const antes78 = await p.evaluate((mes) => acumuladoMensual('Colocaciones SA', mes, '78').baseAcum, fechaMes);
await p.evaluate(() => _guardarPagoFDInterno());
await p.waitForTimeout(300);
const pg4 = await p.evaluate(() => JSON.parse(JSON.stringify(facturas.find(x => x.id === 'fc_4').pagosHistorial[0] || null)));
const desp78 = await p.evaluate((mes) => acumuladoMensual('Colocaciones SA', mes, '78').baseAcum, fechaMes);
ok('E5: queda marcado «sin retención» y NO le suma base a ningún régimen (el acumulado de Reg.78 no se mueve)', pg4 && pg4.sinRetencion === true && pg4.basesReg === undefined && cerca(antes78, desp78), JSON.stringify({ pg4, antes78, desp78 }));

// ═════════ F: validaciones y casos donde no aplica ═════════
await p.evaluate(async () => { facturas.push({ id: 'fc_5', proveedor: 'Colocaciones SA', fecha: '2026-11-03', numero: 'A-5', descripcion: 'Cinco', importe: 121000, netoGravado: 100000, moneda: 'ARS', pagosHistorial: [], estado: 'pendiente', tipoComprobante: 'A', pagado: 0 }); await persistirFacturas(); });
await abrir('fc_5');
await p.evaluate(() => { document.getElementById('pagoFDConcOn').checked = true; pagoFDConcToggle(true); _pagoFDConc.lineas.forEach(l => { l.base = 0; l.aMano = true; }); _pagoFDConcSync(); window.__alerts = []; });
await p.evaluate(() => _guardarPagoFDInterno());
await p.waitForTimeout(200);
const f5 = await p.evaluate(() => ({ n: (facturas.find(x => x.id === 'fc_5').pagosHistorial || []).length, al: window.__alerts.slice() }));
ok('F1: con todos los importes en cero no deja guardar y avisa', f5.n === 0 && f5.al.some(a => /al menos un concepto/.test(a)), JSON.stringify(f5));

await p.evaluate(() => { _pagoFDConc.lineas[0].base = 100000; _pagoFDConcSync(); });
await p.evaluate(() => pagoFDSelMod('B'));
e = await estado();
ok('F2: pasando a Efectivo (B) el reparto se apaga, el bloque se esconde y la base vuelve a ser editable', !e.boxVisible && !e.baseRO, JSON.stringify(e));
await p.evaluate(() => pagoFDSelMod('A'));
e = await estado();
ok('F3: al volver a Bancarizado el bloque reaparece apagado', e.boxVisible && !e.panelVisible && e.rets.length >= 1, JSON.stringify(e));

await abrir('fc_5');
await p.evaluate(() => { document.getElementById('pagoFDConcOn').checked = true; pagoFDConcToggle(true); });
const i2 = await idx('fc_2');
await p.evaluate((i) => { document.getElementById('pagoFDItem').value = String(i); pagoFDActualizarItem(); }, i2);
e = await estado();
ok('F4: cambiar de comprobante descarta el reparto (era del anterior): apagado, base editable', e.boxVisible && !e.panelVisible && !e.baseRO, JSON.stringify(e));

await abrir('fc_x');
e = await estado();
ok('F5: un proveedor EXENTO de retenciones no ofrece el reparto', !e.boxVisible, JSON.stringify(e));
await abrir('fc_sr');
e = await estado();
ok('F6: una factura marcada «sin retención» no ofrece el reparto', !e.boxVisible, JSON.stringify(e));
await p.evaluate(() => { abrirPagoFD('fact'); pagoFDSelModo('varias'); });
e = await estado();
ok('F7: en «varias facturas del mismo proveedor» no se ofrece (cada factura trae su régimen)', !e.boxVisible, JSON.stringify(e));

// ═════════ G: ítems del comprobante ═════════
await p.evaluate(async () => { facturas.push({ id: 'fc_6', proveedor: 'Colocaciones SA', fecha: '2026-11-04', numero: 'A-6', descripcion: 'Con ítems', importe: 1210000, netoGravado: 1000000, moneda: 'ARS', pagosHistorial: [], estado: 'pendiente', tipoComprobante: 'A', pagado: 0,
  items: [{ detalle: 'Placas de cerámica', cantidad: 10, precioUnit: 60000 }, { detalle: 'Colocación', cantidad: 1, precioUnit: 400000 }] }); await persistirFacturas(); });
await abrir('fc_6');
await p.evaluate(() => { document.getElementById('pagoFDConcOn').checked = true; pagoFDConcToggle(true); });
const btn = await p.evaluate(() => document.getElementById('pagoFDConcItemsBtn').style.display !== 'none');
ok('G1: si el comprobante tiene ítems aparece «Traer los ítems del comprobante»', btn);
await p.evaluate(() => pagoFDConcDeItems());
const g = await p.evaluate(() => ({ l: _pagoFDConc.lineas.map(x => ({ d: x.desc, b: x.base })), base: document.getElementById('pagoFDBase').value }));
ok('G2: los ítems pasan a ser conceptos (con su nombre) y se escalan para sumar la base del comprobante (1.000.000)', g.l.length === 2 && g.l[0].d === 'Placas de cerámica' && cerca(g.l.reduce((s, x) => s + x.b, 0), 1000000) && cerca(g.l[0].b, 600000), JSON.stringify(g));

// ═════════ H: lo que se ve después ═════════
const cert = await p.evaluate(() => _retBodyHTML('Colocaciones SA', facturas.find(x => x.id === 'fc_1').pagosHistorial[0], 'A-0001', 'ganancias'));
ok('H1: el certificado de retención muestra la base de cálculo de cada régimen y sobre qué concepto', /Base de cálculo/.test(cert) && /Sobre: Venta de bienes/.test(cert) && /600\.000/.test(cert), (cert || '').slice(0, 300));
const certViejo = await p.evaluate(() => _retBodyHTML('X', { fecha: '2026-11-01', monto: 1000, retenciones: [{ codigo: '78', monto: 20, desc: 'Reg.78' }], nroCorrelativo: 'OP-1' }, 'N', 'ganancias'));
ok('H2: el certificado de un pago anterior (sin reparto) sale como siempre, sin columna de base', certViejo && !/Base de cálculo/.test(certViejo));
const opHtml = await p.evaluate(() => { const f = facturas.find(x => x.id === 'fc_1'), pg = f.pagosHistorial[0]; return imprimirReciboFactura(f, pg.monto, pg.fecha, 'A', pg.retenciones.map(r => ({ codigo: r.codigo, monto: r.monto, desc: r.desc, sobre: r.sobre })), pg.totalRet, 'OP-9', '', true); });
ok('H3: la Orden de Pago dice sobre qué concepto va cada retención, en su propia línea (no parte el importe)', /Ret\. Reg\.78<\/span><span>- [^<]+<\/span><\/div><div[^>]*>sobre Venta de bienes/.test(opHtml), (opHtml || '').slice(0, 200));
await p.evaluate(() => { mostrarTab('Pagos'); });
await p.waitForTimeout(700);
const panel = await p.evaluate(() => { const i = _pagosRows.findIndex(r => r.conceptosRet && r.prov === 'Colocaciones SA'); if (i < 0) return null; pagosSeleccionar(i); return document.getElementById('pagosPanel').innerHTML; });
ok('H4: el panel de Pagos lista los conceptos con su régimen', panel && /CONCEPTOS Y RETENCI/.test(panel) && /Venta de bienes/.test(panel) && /Reg\.78/.test(panel) && /Reg\.94/.test(panel), (panel || '').slice(0, 200));
const xss = await p.evaluate(() => {
  const f = facturas.find(x => x.id === 'fc_1'); f.pagosHistorial[0].conceptosRet[0].desc = '<img src=x onerror="window.__xss=1">';
  f.pagosHistorial[0].retenciones[0].sobre = '<img src=x onerror="window.__xss=1">';
  renderPagos(); const i = _pagosRows.findIndex(r => r.conceptosRet && r.prov === 'Colocaciones SA'); pagosSeleccionar(i);
  const d = document.createElement('div'); d.innerHTML = document.getElementById('pagosPanel').innerHTML + _retBodyHTML('X', f.pagosHistorial[0], 'N', 'ganancias'); document.body.appendChild(d);
  const r = { imgs: d.querySelectorAll('img').length, xss: window.__xss }; d.remove(); return r; });
ok('H5: el nombre de un concepto con HTML no ejecuta nada (ni en el panel ni en el certificado)', xss.imgs === 0 && xss.xss === undefined, JSON.stringify(xss));

// ═════════ I: arreglos de la revisión ═════════
await p.evaluate(async () => { ['fc_7', 'fc_8', 'fc_u'].forEach((id, k) => facturas.push({ id, proveedor: 'Colocaciones SA', fecha: '2026-11-05', numero: 'R-' + k, descripcion: 'Rev ' + k, importe: 1210000, netoGravado: 1000000, moneda: id === 'fc_u' ? 'USD' : 'ARS', pagosHistorial: [], estado: 'pendiente', tipoComprobante: 'A', pagado: 0 })); await persistirFacturas(); });
// quitar un concepto: el que queda cierra contra el comprobante y «completar con el resto» funciona con una sola línea
await abrir('fc_7');
await p.evaluate(() => { document.getElementById('pagoFDConcOn').checked = true; pagoFDConcToggle(true); const ids = _pagoFDConc.lineas.map(l => l.id); pagoFDConcCampo(ids[0], 'base', '600000'); pagoFDConcQuitar(ids[1]); });
e = await estado();
ok('I1: al quitar un concepto el que queda toma la base del comprobante (1.000.000), no se queda a medias', e.lineas === 1 && cerca(Number(e.base), 1000000), JSON.stringify(e));
await p.evaluate(() => { const id = _pagoFDConc.lineas[0].id; pagoFDConcCampo(id, 'base', '300000'); });
const rs1 = await p.evaluate(() => document.getElementById('pagoFDConcResumen').textContent);
await p.evaluate(() => pagoFDConcResto());
e = await estado();
ok('I2: con una sola línea, «completar con el resto» vuelve a cerrar en 1.000.000', /completar con el resto/.test(rs1) && cerca(Number(e.base), 1000000), rs1 + ' | ' + e.base);

// una retención destildada a mano sigue destildada al tocar el reparto
await abrir('fc_8');
await p.evaluate(() => { document.getElementById('pagoFDConcOn').checked = true; pagoFDConcToggle(true); const ids = _pagoFDConc.lineas.map(l => l.id); pagoFDConcCampo(ids[0], 'base', '600000'); pagoFDConcReg(ids[0], '94'); pagoFDConcReg(ids[1], '94'); });
const i94 = await p.evaluate(() => _pagoFDRetsCalculadas.findIndex(r => r.codigo === '94'));
await p.evaluate((i) => pagoFDToggleRet(i), i94);
let a94 = await p.evaluate(() => _pagoFDRetsCalculadas.find(r => r.codigo === '94').activa);
await p.evaluate(() => { const id = _pagoFDConc.lineas[0].id; pagoFDConcCampo(id, 'desc', 'Bienes'); });
const re = await p.evaluate(() => ({ activa: _pagoFDRetsCalculadas.find(r => r.codigo === '94').activa, checks: Array.from(document.querySelectorAll('#pagoFDRetDesglose input[type=checkbox]')).map(c => c.checked) }));
ok('I3: la retención destildada a mano (Reg.94) sigue destildada después de escribir el nombre de un concepto (y la casilla lo muestra)', a94 === false && re.activa === false && JSON.stringify(re.checks) === '[true,false]', JSON.stringify(re));
// tocar «Una» de nuevo no descarta el reparto del mismo comprobante
await p.evaluate(() => pagoFDSelModo('una'));
e = await estado();
ok('I4: apretar «Una» con el mismo comprobante NO descarta el reparto (sigue con sus 2 conceptos y la base suma)', e.panelVisible && e.lineas === 2 && e.baseRO && cerca(Number(e.base), 1000000), JSON.stringify(e));
// ...y el pago sale sin la retención destildada
await p.evaluate(() => { document.getElementById('pagoFDMonto').value = 1210000; });
await p.evaluate(() => _guardarPagoFDInterno());
await p.waitForTimeout(300);
const pg8 = await p.evaluate(() => JSON.parse(JSON.stringify(facturas.find(x => x.id === 'fc_8').pagosHistorial[0] || null)));
ok('I5: se guarda sin la retención que se destildó (sólo Reg.78)', pg8 && pg8.retenciones.length === 1 && pg8.retenciones[0].codigo === '78', JSON.stringify(pg8 && pg8.retenciones));

// factura en dólares: los importes del reparto salen con USD
await abrir('fc_u');
await p.evaluate(() => { document.getElementById('pagoFDConcOn').checked = true; pagoFDConcToggle(true); const ids = _pagoFDConc.lineas.map(l => l.id); pagoFDConcCampo(ids[0], 'desc', 'Bienes'); pagoFDConcCampo(ids[0], 'base', '600000'); pagoFDConcReg(ids[0], '94'); });
const usd = await p.evaluate(() => ({ res: document.getElementById('pagoFDConcResumen').textContent, sobre: _pagoFDRetsCalculadas.map(r => r.sobre).join(' | ') }));
ok('I6: en una factura en dólares el resumen y el «sobre» de cada retención dicen USD y no «$»', /USD 600\.000,00/.test(usd.res) && /USD 600\.000,00/.test(usd.sobre) && !/\$\s?600/.test(usd.res + usd.sobre), JSON.stringify(usd));

ok('Z: sin errores de JS durante toda la prueba', errores.length === 0, JSON.stringify(errores.slice(0, 3)));
for (const r of res) console.log(r.join(' '));
console.log('\n' + res.filter(r => r[0] === 'OK ').length + '/' + res.length + ' OK');
await b.close();
process.exit(res.some(r => r[0] !== 'OK ') ? 1 : 0);
