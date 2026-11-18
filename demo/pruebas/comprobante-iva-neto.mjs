// Comprobantes recibidos (v589): el panel «IVA y percepciones» se maneja desde el NETO GRAVADO (el IVA y el importe total salen de ahí),
// el detalle de ítems alimenta el neto (no el importe total) y, con varias alícuotas, se elige sobre cuál se calcula la retención.
// Corre contra la demo (base en memoria). Uso: node comprobante-iva-neto.mjs   (ver README: hace falta bajar-cdn.sh antes)
import { abrirDemo, entrarAlSistema } from './demo-lib.mjs';
const { b, p, errores } = await abrirDemo();
const res = [];
const ok = (n, c, x) => res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]);
// si algo revienta a mitad de camino (p. ej. con el código anterior, donde no existe el selector) se muestra lo que alcanzó a medirse
process.on('uncaughtException', (e) => { res.forEach(x => console.log(x.join(' · '))); console.log('\nCORTADA: ' + e.message); process.exit(1); });
await entrarAlSistema(p);
await p.evaluate(() => { window.__alerts = []; window.alert = m => window.__alerts.push(String(m)); window.confirm = () => true; });
const cerca = (x, y, t = 0.005) => Math.abs(x - y) <= t;
const poner = (id, v, ev) => p.evaluate(({ id, v, ev }) => { const el = document.getElementById(id); if (!el) return; el.value = v; el.dispatchEvent(new Event(ev || 'input', { bubbles: true })); }, { id, v, ev });
const val = (id) => p.evaluate((id) => { const e = document.getElementById(id); return e ? e.value : null; }, id);
const vis = (id) => p.evaluate((id) => { const e = document.getElementById(id); return !!e && e.style.display !== 'none' && e.offsetParent !== null; }, id);
const est = (pfx) => p.evaluate((pfx) => { const e = _impEst[pfx]; return { modo: e.modo, retSolo: e.retSolo, filas: e.filas.map(f => [f.alic, f.neto, f.iva]) }; }, pfx);
const resolver = (pfx) => p.evaluate((pfx) => _impResolver(_impEst[pfx], parseFloat(document.getElementById(_IMP_CTX[pfx].importe).value) || 0), pfx);
const alic = (i, v) => p.evaluate(({ i, v }) => { const s = document.querySelectorAll('#factImpGrupo .imp-fila select')[i]; s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); }, { i, v });

await p.evaluate(() => {
  proveedores.push({ id: 'pv_neto', razonSocial: 'Ferretería Neto SA', cuit: '30-50000001-9', ret78: true });
  return persistirProveedores();
});
await p.waitForTimeout(200);

// ═════════ A: el neto manda, el IVA y el total salen de ahí ═════════
await p.evaluate(() => agregarFactura());
await p.waitForTimeout(150);
await poner('factProveedor', 'Ferretería Neto SA');
ok('A1: el campo «Neto gravado» de la primera línea es editable (ya no es de sólo lectura)', await p.evaluate(() => { const n = document.getElementById('factImpN0'); return !!n && !n.readOnly; }));
ok('A2: una carga nueva arranca en modo «neto»', (await est('fact')).modo === 'neto');
await poner('factImpN0', '1000');
let r = await resolver('fact');
ok('A3: neto 1.000 al 21 % → IVA 210,00 y el importe total se completa solo con 1.210,00', cerca(r.iva, 210) && cerca(r.total, 1210) && parseFloat(await val('factImporte')) === 1210 && parseFloat(await val('factImpI0')) === 210, JSON.stringify(r) + ' / ' + await val('factImporte'));
ok('A4: el «importe a pagar» sigue al importe total que escribió el panel', parseFloat(await val('factMontoPago')) === 1210, await val('factMontoPago'));
await alic(0, '10.5');
r = await resolver('fact');
ok('A5: cambiar a 10,5 % no toca el neto: IVA 105,00 y total 1.105,00', cerca(r.neto, 1000) && cerca(r.iva, 105) && parseFloat(await val('factImporte')) === 1105, JSON.stringify(r) + ' / ' + await val('factImporte'));
await alic(0, '21');
await poner('factImpI0', '210.5');
r = await resolver('fact');
ok('A6: escribir el IVA (210,50, como figura en la factura) NO mueve el neto: queda 1.000 y el total pasa a 1.210,50', cerca(r.neto, 1000) && cerca(r.iva, 210.5) && parseFloat(await val('factImporte')) === 1210.5 && parseFloat(await val('factImpN0')) === 1000, JSON.stringify(r) + ' / ' + await val('factImporte') + ' / ' + await val('factImpN0'));
await poner('factImpI0', '');
await p.evaluate(() => _impPercAgregar('fact', 'iibb_caba'));
await p.evaluate(() => { const i = document.querySelector('#factImpGrupo .imp-perc input[type=number]'); i.value = '30'; i.dispatchEvent(new Event('input', { bubbles: true })); });
r = await resolver('fact');
ok('A7: una percepción de 30 se SUMA al total (neto 1.000 + IVA 210 + 30 = 1.240); el neto no baja', cerca(r.neto, 1000) && cerca(r.total, 1240) && parseFloat(await val('factImporte')) === 1240, JSON.stringify(r));
await p.evaluate(() => _impPercQuitar('fact', 0));
// tipear el importe total de la factura: ese total manda y se despeja el neto (como antes)
await poner('factImporte', '1210');
r = await resolver('fact');
ok('A8: tipear el importe total (1.210) pasa el mando al total: neto 1.000 + IVA 210 despejados', (await est('fact')).modo === 'total' && cerca(r.neto, 1000) && cerca(r.iva, 210), JSON.stringify([await est('fact'), r]));
await poner('factImporte', '1100');
r = await resolver('fact');
ok('A9: con el total mandando, 1.100 → neto 909,09 + IVA 190,91', cerca(r.neto, 909.09) && cerca(r.iva, 190.91) && cerca(r.neto + r.iva, 1100), JSON.stringify(r));
await poner('factImpN0', '500');
r = await resolver('fact');
ok('A10: y volver a tipear el neto (500) devuelve el mando al neto: IVA 105 y total 605', (await est('fact')).modo === 'neto' && cerca(r.iva, 105) && parseFloat(await val('factImporte')) === 605, JSON.stringify(r));
const foco = await p.evaluate(() => { const n = document.getElementById('factImpN0'); n.focus(); n.value = '700'; n.dispatchEvent(new Event('input', { bubbles: true })); return document.activeElement === n && n.value === '700'; });
ok('A11: tipear el neto no le saca el foco ni le cambia el valor al campo', foco === true);

// ═════════ B: el detalle de ítems alimenta el NETO, no el importe total (era el «lo calcula mal») ═════════
await p.evaluate(() => { _impIniciar('fact', null); factAgregarItem({ detalle: 'Cemento', cantidad: 10, precioUnit: 100, signo: 1 }); });
r = await resolver('fact');
ok('B1: un ítem de 1.000 (neto) da neto 1.000 + IVA 210 = 1.210 (antes el 1.000 se tomaba por total y salía neto 826,45 + IVA 173,55)', cerca(r.neto, 1000) && cerca(r.iva, 210) && parseFloat(await val('factImporte')) === 1210, JSON.stringify(r) + ' / ' + await val('factImporte'));
await p.evaluate(() => factAgregarItem({ detalle: 'Descuento', cantidad: 1, precioUnit: 200, signo: -1 }));
r = await resolver('fact');
ok('B2: un ítem que resta (−200) baja el neto a 800 y el total a 968', cerca(r.neto, 800) && cerca(r.iva, 168) && parseFloat(await val('factImporte')) === 968, JSON.stringify(r));
await alic(0, '10.5');
await p.evaluate(() => _impAgregarFila('fact'));
await alic(1, '21');
await poner('factImpN1', '300');
r = await resolver('fact');
ok('B3: con dos alícuotas el detalle es el neto de TODAS: ítems 800 = 500 al 10,5 % + 300 al 21 %', cerca(r.filas[0].neto, 500) && cerca(r.filas[1].neto, 300) && cerca(r.neto, 800), JSON.stringify(r));
await p.evaluate(() => { _renderFactItems([]); _impIniciar('fact', null); });
await poner('factClase', 'factx|X', 'change');
await p.evaluate(() => factAgregarItem({ detalle: 'Varios', cantidad: 2, precioUnit: 50, signo: 1 }));
ok('B4: en un Comprobante X (sin panel de IVA) el total del detalle sigue completando el importe', !(await vis('factImpGrupo')) && parseFloat(await val('factImporte')) === 100, await val('factImporte'));
await poner('factClase', 'fact|A', 'change');
await p.evaluate(() => { _renderFactItems([]); });

// ═════════ C: base de retención con varias alícuotas ═════════
await p.evaluate(() => { cerrarFactura(); agregarFactura(); });
await p.waitForTimeout(150);
await poner('factProveedor', 'Ferretería Neto SA');
await poner('factNumero', '0010-00000777');
ok('C1: con una sola alícuota no aparece el selector de base de retención', !(await p.evaluate(() => !!document.getElementById('factImpRet'))));
await poner('factImpN0', '1000');
await p.evaluate(() => _impAgregarFila('fact'));
await alic(1, '10.5');
await poner('factImpN1', '500');
ok('C2: con dos alícuotas aparece el selector «Base para la retención» con 3 opciones (todas / sólo 21 % / sólo 10,5 %)', await p.evaluate(() => { const s = document.getElementById('factImpRetSel'); return !!s && s.options.length === 3 && /Todas/.test(s.options[0].text) && /21 %/.test(s.options[1].text) && /10,5 %/.test(s.options[2].text); }));
r = await resolver('fact');
const sel0 = await p.evaluate(() => ({ v: (document.getElementById('factImpRetSel') || { options: [] }).value, base: _impBaseRet('fact'), t: Array.from((document.getElementById('factImpRetSel') || { options: [] }).options).map(o => o.text) }));
ok('C3: por defecto «todas»: la base es el neto total 1.500 (= importe 1.762,50 − IVA 262,50)', sel0.v === 'todas' && cerca(sel0.base, 1500) && cerca(r.total, 1762.5), JSON.stringify(sel0));
ok('C4: las opciones muestran el neto de cada línea (1.000,00 y 500,00)', /1\.000,00/.test(sel0.t[1]) && /500,00/.test(sel0.t[2]), JSON.stringify(sel0.t));
await p.evaluate(() => { const s = document.getElementById('factImpRetSel'); if (!s) return; s.value = '1'; s.dispatchEvent(new Event('change', { bubbles: true })); });
const sel1 = await p.evaluate(() => ({ base: _impBaseRet('fact'), solo: _impEst.fact.retSolo, res: (document.getElementById('factImpResumen') || {}).innerText || '' }));
ok('C5: elegir «sólo la de 10,5 %» → la base de retención es 500 y el resumen lo dice', cerca(sel1.base, 500) && sel1.solo === 1 && /Base para la retención/.test(sel1.res) && /10,5/.test(sel1.res), JSON.stringify(sel1));
ok('C6: el total y el IVA no cambian (1.762,50): la elección sólo afecta a la retención', parseFloat(await val('factImporte')) === 1762.5);
// el pago directo usa esa base
await p.evaluate(() => selFactPagoInmediato(true));
await poner('factModalidadPago', 'A', 'change');
await p.waitForTimeout(150);
await poner('factImpN1', '600');
const baseDirecta = await val('factRetBase');
ok('C7: el pago directo por banco propone como base de retención el neto elegido (600), no el de todas las alícuotas', Math.abs(parseFloat(baseDirecta) - 600) <= 1, baseDirecta);
await poner('factImpN1', '500');
await p.evaluate(() => selFactPagoInmediato(false));   // se carga pendiente: el pago se registra después
await p.evaluate(() => { window.__alerts.length = 0; document.getElementById('formFact').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); });
await p.waitForTimeout(500);
const f = await p.evaluate(() => { const x = facturas.find(y => y.numero === '0010-00000777'); return x ? JSON.parse(JSON.stringify(x)) : null; });
ok('C8: se guardó con las dos alícuotas y la línea del 21 % marcada «sinRet»', f && f.ivaDetalle && f.ivaDetalle.length === 2 && f.ivaDetalle[0].sinRet === true && !f.ivaDetalle[1].sinRet && cerca(f.importe, 1762.5), JSON.stringify(f && [f.ivaDetalle, f.importe, await p.evaluate(() => window.__alerts)]));
ok('C9: la base de retención guardada es el 28,37 % del importe (500 / 1.762,50)', f && cerca(await p.evaluate((id) => _facRatioNeto(facturas.find(x => x.id === id)), f.id), 500 / 1762.5, 0.0001));
// registrar pago
const iF = await p.evaluate((id) => facturas.findIndex(x => x.id === id), f.id);
await p.evaluate((i) => abrirPagoFD('fact', String(i)), iF);
await p.waitForTimeout(200);
const basePago = await val('pagoFDBase');
ok('C10: «Registrar pago» propone como base 500 (no 1.500)', Math.abs(parseFloat(basePago) - 500) <= 1, basePago);
await p.evaluate(() => { const m = document.getElementById('modalPagoFD'); if (m) m.classList.remove('active'); });
// editar: vuelve la elección
await p.evaluate((i) => editarFactura(i), iF);
await p.waitForTimeout(150);
const ed = await p.evaluate(() => ({ solo: _impEst.fact.retSolo, modo: _impEst.fact.modo, v: (document.getElementById('factImpRetSel') || {}).value, importe: document.getElementById('factImporte').value }));
ok('C11: al editar vuelve «sólo la de 10,5 %» elegida y manda el importe cargado (modo total)', ed.solo === 1 && ed.v === '1' && ed.modo === 'total' && parseFloat(ed.importe) === 1762.5, JSON.stringify(ed));
await p.evaluate(() => { const s = document.getElementById('factImpRetSel'); if (!s) return; s.value = 'todas'; s.dispatchEvent(new Event('change', { bubbles: true })); });
await p.evaluate(() => { document.getElementById('formFact').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); });
await p.waitForTimeout(500);
const f2 = await p.evaluate((id) => JSON.parse(JSON.stringify(facturas.find(x => x.id === id))), f.id);
ok('C12: volver a «todas» y guardar borra las marcas (la base vuelve a importe − IVA)', f2.ivaDetalle.every(x => !x.sinRet) && cerca(await p.evaluate((id) => _facRatioNeto(facturas.find(x => x.id === id)), f.id), 1500 / 1762.5, 0.0001), JSON.stringify(f2.ivaDetalle));
// quitar la línea elegida
await p.evaluate((i) => editarFactura(i), iF);
await p.evaluate(() => { const s = document.getElementById('factImpRetSel'); if (!s) return; s.value = '1'; s.dispatchEvent(new Event('change', { bubbles: true })); _impQuitarFila('fact', 1); });
const q = await p.evaluate(() => ({ solo: _impEst.fact.retSolo, hay: !!document.getElementById('factImpRetSel'), base: _impBaseRet('fact') }));
ok('C13: quitar la línea elegida deja «todas» y esconde el selector', q.solo === null && q.hay === false, JSON.stringify(q));
await p.evaluate(() => cerrarFactura());

// ═════════ D: comprobante anterior (sin detalle) y «leer PDF» ═════════
await p.evaluate(() => { facturas.push({ id: 'fc_old_n', proveedor: 'Ferretería Neto SA', numero: '0001-00000042', fecha: '2026-10-05', importe: 1210, netoGravado: 1000, tipoComprobante: 'A', computaARCA: true, estado: 'pendiente', pagado: 0 }); });
const iOld = await p.evaluate(() => facturas.findIndex(x => x.id === 'fc_old_n'));
await p.evaluate((i) => editarFactura(i), iOld);
await p.waitForTimeout(150);
const legacy = await p.evaluate(() => ({ modo: _impEst.fact.modo, legacy: _impEst.fact.legacy, imp: _impLeer('fact') }));
ok('D1: un comprobante anterior sin detalle se abre en modo «total» y sin tocar no se modifica', legacy.modo === 'total' && legacy.legacy === true && legacy.imp === null, JSON.stringify(legacy));
await poner('factImpN0', '2000');
r = await resolver('fact');
ok('D2: tipearle un neto (2.000) lo pasa al modelo nuevo: IVA 420 y total 2.420', parseFloat(await val('factImporte')) === 2420 && cerca(r.iva, 420) && (await p.evaluate(() => _impEst.fact.tocado)) === true, JSON.stringify(r));
await p.evaluate(() => cerrarFactura());
// leer PDF: con el total de la IA manda el total; sin total manda el neto
await p.evaluate(() => { abrirLeerFacturaPDF && abrirLeerFacturaPDF(); });
await p.waitForTimeout(150);
await p.evaluate(() => {
  document.getElementById('leerFactPaso1').style.display = 'none'; document.getElementById('leerFactPaso2').style.display = '';
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
  set('leerFactProv', 'Ferretería Neto SA'); set('leerFactImporte', '1210');
  const cl = document.getElementById('leerFactClase'); cl.value = 'fact|A'; lfClaseChange();
  lfInicializarPaso2('Ferretería Neto SA', { importe: 1210, ivaDetalle: [{ alicuota: 21, neto: 1000, iva: 210 }] });
});
const lf1 = await p.evaluate(() => ({ modo: _impEst.lf.modo, imp: document.getElementById('leerFactImporte').value }));
ok('D3: «leer PDF» con el total de la IA (1.210): manda el total del papel y el importe no se pisa', lf1.modo === 'total' && parseFloat(lf1.imp) === 1210, JSON.stringify(lf1));
await p.evaluate(() => {
  document.getElementById('leerFactImporte').value = '';
  lfInicializarPaso2('Ferretería Neto SA', { ivaDetalle: [{ alicuota: 21, neto: 1000, iva: 210 }] });
});
const lf2 = await p.evaluate(() => ({ modo: _impEst.lf.modo, imp: document.getElementById('leerFactImporte').value }));
ok('D4: «leer PDF» sin total pero con neto e IVA: el importe se completa solo con 1.210', lf2.modo === 'neto' && parseFloat(lf2.imp) === 1210, JSON.stringify(lf2));
await poner('lfImpN0', '2000');
ok('D5: en «leer PDF» también se puede corregir el neto: total 2.420', parseFloat(await val('leerFactImporte')) === 2420, await val('leerFactImporte'));
// nota de crédito
await p.evaluate(() => { const m = document.getElementById('modalLeerFact') || document.getElementById('modalLeerFactura'); if (m) m.classList.remove('active'); });
await p.evaluate(() => abrirNotaCredito('Ferretería Neto SA'));
await p.waitForTimeout(150);
await p.evaluate(() => { const n = document.getElementById('ncImpN0'); n.value = '100'; n.dispatchEvent(new Event('input', { bubbles: true })); });
ok('D6: la nota de crédito también calcula el importe desde el neto (100 + IVA 21 = 121)', parseFloat(await val('ncImporte')) === 121, await val('ncImporte'));


// ═════════ E: abrir y guardar un comprobante EXISTENTE no le cambia el importe (revisión de la v589: lo corrompía) ═════════
const guardarForm = async () => { await p.evaluate(() => { window.__alerts.length = 0; document.getElementById('formFact').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); }); await p.waitForTimeout(450); };
await p.evaluate(() => {
  facturas.push({ id: 'fc_e1', proveedor: 'Ferretería Neto SA', numero: '0001-00000101', fecha: '2026-10-06', importe: 5000, tipoComprobante: 'A', computaARCA: true, estado: 'pendiente', pagado: 0 });
  facturas.push({ id: 'fc_e2', proveedor: 'Ferretería Neto SA', numero: '0001-00000102', fecha: '2026-10-07', importe: 6050000, tipoComprobante: 'A', computaARCA: true, estado: 'pendiente', pagado: 0,
    items: [{ detalle: 'Mano de obra', cantidad: 1, precioUnit: 4000000, signo: 1, subtotal: 4000000 }, { detalle: 'Materiales', cantidad: 1, precioUnit: 2050000, signo: 1, subtotal: 2050000 }] });
  facturas.push({ id: 'fc_e3', proveedor: 'Ferretería Neto SA', numero: '0001-00000103', fecha: '2026-10-08', importe: 1210, tipoComprobante: 'A', computaARCA: true, estado: 'pendiente', pagado: 0,
    netoGravado: 1000, importeIVA: 210, ivaDetalle: [{ alic: 21, neto: 1000, iva: 210 }], items: [{ detalle: 'Cemento', cantidad: 10, precioUnit: 100, signo: 1, subtotal: 1000 }] });
});
const idx = (id) => p.evaluate((id) => facturas.findIndex(x => x.id === id), id);
const imp = (id) => p.evaluate((id) => facturas.find(x => x.id === id).importe, id);
// E1: tras un alta que quedó en modo «neto», editar otra factura (5.000, sin ítems)
await p.evaluate(() => { agregarFactura(); });
await p.waitForTimeout(100);
await poner('factImpN0', '1000');
await p.evaluate(() => cerrarFactura());
await p.evaluate((i) => editarFactura(i), await idx('fc_e1'));
await p.waitForTimeout(150);
let e1 = await p.evaluate(() => ({ imp: document.getElementById('factImporte').value, modo: _impEst.fact.modo }));
ok('E1: editar una factura de 5.000 tras un alta en modo «neto»: el importe sigue en 5.000 (no el 1.210 del alta) y el panel manda el total', parseFloat(e1.imp) === 5000 && e1.modo === 'total', JSON.stringify(e1));
await guardarForm();
ok('E1b: guardar sin tocar nada deja el importe en 5.000', (await imp('fc_e1')) === 5000, String(await imp('fc_e1')));
await p.evaluate(() => cerrarFactura());
// E2: factura de antes de la v589 con ítems (la suma de los ítems ERA el importe total)
await p.evaluate((i) => editarFactura(i), await idx('fc_e2'));
await p.waitForTimeout(150);
let e2 = await p.evaluate(() => ({ imp: document.getElementById('factImporte').value, modo: _impEst.fact.modo, itemsNeto: _impEst.fact.itemsNeto }));
ok('E2: editar una factura anterior con ítems (suman el importe total 6.050.000): el importe se conserva (no ×1,21) y sus ítems no cuentan como netos', parseFloat(e2.imp) === 6050000 && e2.modo === 'total' && e2.itemsNeto === false, JSON.stringify(e2));
await guardarForm();
ok('E2b: guardar sin tocar nada conserva 6.050.000', (await imp('fc_e2')) === 6050000, String(await imp('fc_e2')));
await p.evaluate((i) => editarFactura(i), await idx('fc_e2'));
await p.waitForTimeout(100);
await p.evaluate(() => { const c = document.querySelectorAll('#factItemsLista .fi-precio')[1]; c.value = '2150000'; c.dispatchEvent(new Event('input', { bubbles: true })); });
ok('E2c: y si se edita un ítem de esa factura anterior, el total del detalle completa el importe como siempre (6.150.000), sin sumarle IVA', parseFloat(await val('factImporte')) === 6150000, await val('factImporte'));
await p.evaluate(() => cerrarFactura());
// E3: factura de la v589 con ítems netos
await p.evaluate((i) => editarFactura(i), await idx('fc_e3'));
await p.waitForTimeout(150);
let e3 = await p.evaluate(() => ({ imp: document.getElementById('factImporte').value, modo: _impEst.fact.modo, itemsNeto: _impEst.fact.itemsNeto }));
ok('E3: editar una factura de la v589 con ítems netos: importe 1.210 conservado y los ítems cuentan como netos', parseFloat(e3.imp) === 1210 && e3.modo === 'total' && e3.itemsNeto === true, JSON.stringify(e3));
await p.evaluate(() => factAgregarItem({ detalle: 'Arena', cantidad: 1, precioUnit: 100, signo: 1 }));
r = await resolver('fact');
ok('E3b: agregarle un ítem de 100 suma al neto: neto 1.100 + IVA 231 = 1.331', cerca(r.neto, 1100) && cerca(r.iva, 231) && parseFloat(await val('factImporte')) === 1331, JSON.stringify(r) + ' / ' + await val('factImporte'));
await p.evaluate(() => cerrarFactura());
// E4: la página recién abierta, sin ningún alta previa (un estado del panel que nadie inicializó)
await p.reload();
await entrarAlSistema(p);
await p.evaluate(() => { window.__alerts = []; window.alert = m => window.__alerts.push(String(m)); window.confirm = () => true; });
const iDemo = await p.evaluate(() => facturas.findIndex(x => (x.items || []).length > 1 && x.importe > 0));
const impDemo = await p.evaluate((i) => facturas[i].importe, iDemo);
await p.evaluate((i) => editarFactura(i), iDemo);
await p.waitForTimeout(200);
ok('E4: con la página recién cargada, editar una factura de la demo con ítems conserva su importe', iDemo >= 0 && parseFloat(await val('factImporte')) === impDemo, impDemo + ' / ' + await val('factImporte'));
await p.evaluate(() => cerrarFactura());

// ═════════ F: «Cargar factura» abre vacía aunque la anterior haya quedado en modo «neto» ═════════
await p.evaluate(() => { agregarFactura(); });
await p.waitForTimeout(100);
await poner('factImpN0', '1000');
await poner('factMontoPago', '300');
await p.evaluate(() => cerrarFactura());
await p.evaluate(() => { agregarFactura(); });
await p.waitForTimeout(150);
const fNuevo = await p.evaluate(() => ({ imp: document.getElementById('factImporte').value, mp: document.getElementById('factMontoPago').value, n0: document.getElementById('factImpN0').value, modo: _impEst.fact.modo }));
ok('F1: un alta nueva abre con el importe, el monto a pagar y el neto vacíos y en modo «neto» (no con los de la anterior)', fNuevo.imp === '' && fNuevo.mp === '' && fNuevo.n0 === '' && fNuevo.modo === 'neto', JSON.stringify(fNuevo));
await p.evaluate(() => cerrarFactura());

// ═════════ G: «leer PDF con IA» en tanda: cada papel conserva SU importe ═════════
await p.evaluate(() => { abrirLeerFacturaPDF && abrirLeerFacturaPDF(); });
await p.waitForTimeout(150);
const leer = (datos) => p.evaluate((datos) => {
  document.getElementById('leerFactPaso1').style.display = 'none'; document.getElementById('leerFactPaso2').style.display = '';
  _mostrarPreviewFactura(datos);
  return { imp: document.getElementById('leerFactImporte').value, modo: _impEst.lf.modo, est: _impResolver(_impEst.lf, parseFloat(document.getElementById('leerFactImporte').value) || 0) };
}, datos);
const base = { proveedor: 'Ferretería Neto SA', tipoComprobante: 'A', fecha: '2026-11-10', numero: '0001-00000900', moneda: 'ARS' };
let g1 = await leer({ ...base, importe: 1210, items: [{ detalle: 'Cemento', cantidad: 10, precioUnit: 100 }], ivaDetalle: [{ alicuota: 21, neto: 1000, iva: 210 }] });
ok('G1: primera lectura (importe 1.210): el campo queda en 1.210', parseFloat(g1.imp) === 1210 && g1.modo === 'total', JSON.stringify(g1.imp));
let g2 = await leer({ ...base, importe: 1240, items: [{ detalle: 'Cemento', cantidad: 10, precioUnit: 100 }], ivaDetalle: [{ alicuota: 21, neto: 1000, iva: 210 }], percepciones: [{ tipo: 'IIBB CABA', importe: 30 }] });
ok('G2: segunda lectura (importe 1.240 con percepción de 30): el campo queda en 1.240 y el panel dice neto 1.000 + IVA 210 + 30', parseFloat(g2.imp) === 1240 && cerca(g2.est.neto, 1000) && cerca(g2.est.iva, 210) && cerca(g2.est.percTot, 30), JSON.stringify(g2));
let g3 = await leer({ ...base, importe: 2210, items: [{ detalle: 'Obra', cantidad: 1, precioUnit: 2000 }], ivaDetalle: [{ alicuota: 10.5, neto: 2000, iva: 210 }] });
ok('G3: tercera lectura (10,5 %, importe 2.210): el campo queda en 2.210 (no 2.450)', parseFloat(g3.imp) === 2210 && cerca(g3.est.neto, 2000), JSON.stringify(g3));
await poner('lfImpN0', '500');   // el usuario corrige el neto: manda el neto
let g4 = await leer({ ...base, importe: 9999, items: [], ivaDetalle: [{ alicuota: 21, neto: 8264.46, iva: 1735.54 }] });
ok('G4: después de que el usuario tocó el neto, la lectura siguiente (importe 9.999) vuelve a mandar con SU importe', parseFloat(g4.imp) === 9999 && g4.modo === 'total', JSON.stringify(g4));
let g5 = await leer({ ...base, items: [], netoGravado: 1000, importeIVA: 210 });
ok('G5: una lectura sin importe pero con neto e IVA completa el importe con 1.210 (y no deja el de la lectura anterior)', parseFloat(g5.imp) === 1210 && g5.modo === 'neto', JSON.stringify(g5));
await p.evaluate(() => { const m = document.getElementById('modalLeerFact') || document.getElementById('modalLeerFactura'); if (m) m.classList.remove('active'); });

// ═════════ H: nota de crédito leída con IA sin desglose de IVA conserva el importe ═════════
await p.evaluate(() => abrirNotaCredito('Ferretería Neto SA'));
await p.waitForTimeout(150);
const h1 = await p.evaluate(() => { document.getElementById('ncLetra').value = 'C'; document.getElementById('ncImporte').value = '5000'; _impCargarIA('nc', { importe: 5000, ivaDetalle: [] }); return { imp: document.getElementById('ncImporte').value, modo: _impEst.nc.modo }; });
ok('H1: nota de crédito C leída con IA sin ivaDetalle: el importe 5.000 se conserva y manda el total', parseFloat(h1.imp) === 5000 && h1.modo === 'total', JSON.stringify(h1));
const h2 = await p.evaluate(() => { document.getElementById('ncLetra').value = 'A'; document.getElementById('ncImporte').value = '1210'; _impCargarIA('nc', { importe: 1210 }); return { imp: document.getElementById('ncImporte').value, modo: _impEst.nc.modo }; });
ok('H2: y una NC A sin desglose (sólo el importe 1.210) también lo conserva', parseFloat(h2.imp) === 1210 && h2.modo === 'total', JSON.stringify(h2));
await p.evaluate(() => { const m = document.getElementById('modalNotaCredito'); if (m) m.classList.remove('active'); });

// ═════════ I: IVA fijo de la línea 1, selector, USD y monto a pagar ═════════
await p.evaluate(() => { agregarFactura(); });
await p.waitForTimeout(100);
await p.evaluate(() => { document.getElementById('factImporte').value = '1763'; _impIniciar('fact', { importe: 1763, tipoComprobante: 'A', ivaDetalle: [{ alic: 21, neto: 1000, iva: 210.5 }, { alic: 10.5, neto: 500, iva: 52.5 }] }); });
await p.evaluate(() => { const i = document.getElementById('factImpI1'); i.value = '52.6'; i.dispatchEvent(new Event('input', { bubbles: true })); });
r = await resolver('fact');
ok('I1: con un IVA fijo de 210,50 en la línea 1, tipear el IVA de la línea 2 (52,60) lo conserva: total 1.763,10', cerca(r.filas[0].iva, 210.5) && cerca(r.filas[1].iva, 52.6) && parseFloat(await val('factImporte')) === 1763.1, JSON.stringify(r) + ' / ' + await val('factImporte'));
await p.evaluate(() => { _impIniciar('fact', null); });
await poner('factImpN0', '1000');
await p.evaluate(() => { _impAgregarFila('fact'); const s = document.getElementById('factImpRetSel'); s.value = '1'; s.dispatchEvent(new Event('change', { bubbles: true })); });
const j1 = await p.evaluate(() => ({ solo: _impEst.fact.retSolo, v: document.getElementById('factImpRetSel').value }));
ok('I2: elegir una línea que todavía no tiene neto vuelve a «Todas» y el estado interno también (no queda elegida a escondidas)', j1.solo === null && j1.v === 'todas', JSON.stringify(j1));
await alic(1, '10.5');
await poner('factImpN1', '500');
await poner('factMoneda', 'USD', 'change');
const k1 = await p.evaluate(() => Array.from(document.getElementById('factImpRetSel').options).map(o => o.text));
ok('I3: en un comprobante en USD las opciones del selector de base dicen «USD», no «$»', k1.every(t => /USD/.test(t) && !/\$/.test(t)), JSON.stringify(k1));
await poner('factMoneda', 'ARS', 'change');
await p.evaluate(() => { const m = document.getElementById('factMontoPago'); m.value = '500'; m.dispatchEvent(new Event('input', { bubbles: true })); });
await alic(0, '10.5');
ok('I4: un «importe a pagar» tipeado (500) no se pisa al tocar el panel de IVA', parseFloat(await val('factMontoPago')) === 500, await val('factMontoPago'));
await p.evaluate(() => { const m = document.getElementById('factMontoPago'); m.value = ''; m.dispatchEvent(new Event('input', { bubbles: true })); });
await poner('factImpN0', '1000.01');
ok('I5: vaciado, el «importe a pagar» vuelve a seguir al importe y conserva los centavos (1.657,51, no el entero 1.658)', parseFloat(await val('factMontoPago')) === 1657.51 && parseFloat(await val('factImporte')) === 1657.51, await val('factMontoPago') + ' / ' + await val('factImporte'));
await p.evaluate(() => cerrarFactura());
ok('I6: el texto de ayuda del detalle en «Leer PDF» ya no dice que el total completa el importe', await p.evaluate(() => { const t = document.documentElement.innerHTML; return !/El total completa el importe\./.test(t.slice(t.indexOf('lfItemsLista') - 900, t.indexOf('lfItemsLista') + 100)); }));

// ═════════ J: tipeo real (teclado), con el foco y el valor intactos ═════════
await p.evaluate(() => { agregarFactura(); });
await p.waitForTimeout(100);
await p.click('#factImpN0');
await p.keyboard.type('2000.5');
const t1 = await p.evaluate(() => ({ v: document.getElementById('factImpN0').value, foco: document.activeElement && document.activeElement.id, imp: document.getElementById('factImporte').value }));
ok('J1: tipeando 2000.5 con el teclado el campo conserva el valor y el foco, y el importe sale 2.420,61', t1.v === '2000.5' && t1.foco === 'factImpN0' && parseFloat(t1.imp) === 2420.61, JSON.stringify(t1));
await p.keyboard.press('Control+A'); await p.keyboard.type('300');
const t2 = await p.evaluate(() => ({ v: document.getElementById('factImpN0').value, foco: document.activeElement && document.activeElement.id, imp: document.getElementById('factImporte').value }));
ok('J2: reemplazando el neto por 300 queda 300, con el foco, e importe 363', t2.v === '300' && t2.foco === 'factImpN0' && parseFloat(t2.imp) === 363, JSON.stringify(t2));
await p.evaluate(() => cerrarFactura());

const falla = res.filter(x => x[0] === 'FALLA').length;
res.forEach(x => console.log(x.join(' · ')));
console.log('\n' + (res.length - falla) + '/' + res.length + ' OK');
if (errores && errores.length) console.log('ERRORES DE PÁGINA:', errores.slice(0, 5));
await b.close();
process.exit(falla ? 1 : 0);
