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
ok('I6: el texto de ayuda del detalle en «Leer PDF» ya no dice que el total completa el importe (y nombra el cuadro de IVA)', await p.evaluate(() => { const h = document.getElementById('lfItemsLista').closest('.form-group').querySelector('.form-hint').textContent; return !/El total completa el importe\./.test(h) && /neto gravado/.test(h) && /Comprobante X/.test(h); }));

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

// ═════════ K: retoques de la revisión de la v590 (v591) ═════════
await p.evaluate(() => {
  proveedores.push({ id: 'pv_k', razonSocial: 'Cementos K SA', cuit: '30-50000002-7', ret78: true });
  window.open = () => null;   // la Orden de Pago imprime: sin ventanas
  facturas.push({ id: 'fc_k1', proveedor: 'Cementos K SA', numero: '0002-00000001', fecha: '2026-10-09', importe: 1210, tipoComprobante: 'A', computaARCA: true, estado: 'pendiente', pagado: 0,
    netoGravado: 1000, importeIVA: 210, ivaDetalle: [{ alic: 21, neto: 1000, iva: 210 }], items: [{ detalle: 'Cemento', cantidad: 10, precioUnit: 100, signo: 1, subtotal: 1000 }] });
  facturas.push({ id: 'fc_k2', proveedor: 'Cementos K SA', numero: '0002-00000002', fecha: '2026-10-10', importe: 5000, tipoComprobante: 'A', computaARCA: true, estado: 'pendiente', pagado: 0 });
  facturas.push({ id: 'fc_k8', proveedor: 'Cementos K SA', numero: '0002-00000008', fecha: '2026-10-11', importe: 1210.5, tipoComprobante: 'A', computaARCA: true, estado: 'pendiente', pagado: 0, ivaDetalle: [{ alic: 21, neto: 1000, iva: 210.5 }] });
  facturas.push({ id: 'fc_k13', proveedor: 'Cementos K SA', numero: '0002-00000013', fecha: '2026-10-12', importe: 1210, tipoComprobante: 'A', computaARCA: true, estado: 'pendiente', pagado: 0, netoGravado: 1000, importeIVA: 210, ivaDetalle: [{ alic: 21, neto: 1000, iva: 210 }] });
  facturas.push({ id: 'fc_k14a', proveedor: 'Cementos K SA', numero: '0002-00000014', fecha: '2026-10-13', importe: 3, moneda: 'USD', tipoComprobante: 'A', computaARCA: true, estado: 'pendiente', pagado: 0, items: [{ detalle: 'Suscripción', cantidad: 1, precioUnit: 3, signo: 1, subtotal: 3 }] });
  facturas.push({ id: 'fc_k14c', proveedor: 'Cementos K SA', numero: '0002-00000016', fecha: '2026-10-13', importe: 1210, tipoComprobante: 'A', computaARCA: true, estado: 'pendiente', pagado: 0, items: [{ detalle: 'Obra', cantidad: 1, precioUnit: 1210, signo: 1, subtotal: 1210 }] });
  facturas.push({ id: 'fc_k14b', proveedor: 'Cementos K SA', numero: '0002-00000015', fecha: '2026-10-13', importe: 3.63, moneda: 'USD', tipoComprobante: 'A', computaARCA: true, estado: 'pendiente', pagado: 0, netoGravado: 3, importeIVA: 0.63, ivaDetalle: [{ alic: 21, neto: 3, iva: 0.63 }], items: [{ detalle: 'Suscripción', cantidad: 1, precioUnit: 3, signo: 1, subtotal: 3 }] });
  return persistirProveedores();
});
await p.waitForTimeout(200);
const sobre = (id, sel) => p.evaluate(({ id, sel }) => { const e = document.getElementById(id); const o = sel ? e.querySelector(sel) : e; return !!o; }, { id, sel });

// K1/K2: «Monto a pagar» al EDITAR arranca en el saldo (la suma de los ítems —el neto— o lo de la apertura anterior hacían que «Pagar ahora» pagara de menos)
await p.evaluate((i) => editarFactura(i), await idx('fc_k1'));
await p.waitForTimeout(150);
ok('K1: editar una factura con ítems (importe 1.210, ítem 1.000 neto): «Monto a pagar» = 1.210 (no el 1.000 del neto)', parseFloat(await val('factMontoPago')) === 1210, await val('factMontoPago'));
await p.evaluate(() => cerrarFactura());
await p.evaluate(() => { agregarFactura(); });
await poner('factImpN0', '777');
await p.evaluate(() => cerrarFactura());
await p.evaluate((i) => editarFactura(i), await idx('fc_k2'));
await p.waitForTimeout(150);
ok('K2: editar una factura de 5.000 sin ítems tras un alta: «Monto a pagar» = 5.000 (no el 940,17 del alta)', parseFloat(await val('factMontoPago')) === 5000, await val('factMontoPago'));
await p.evaluate(() => cerrarFactura());
// K3: y «Pagar ahora: Sí» sin tocar nada paga el saldo completo
await p.evaluate((i) => editarFactura(i), await idx('fc_k1'));
await p.waitForTimeout(100);
await p.evaluate(() => { selFactPagoInmediato(true); selFactModalidad('B'); });
await guardarForm();
const k3 = await p.evaluate(() => { const f = facturas.find(x => x.id === 'fc_k1'); return { pagado: f.pagado, estado: f.estado, importe: f.importe }; });
ok('K3: «Pagar ahora: Sí» al editar paga el saldo completo (1.210), no el neto: la factura queda pagada', k3.pagado === 1210 && k3.estado === 'pagada', JSON.stringify([k3, await p.evaluate(() => window.__alerts)]));
await p.evaluate(() => { const m = document.getElementById('modalFact'); if (m) m.classList.remove('active'); });

// K4: Gmail: cada lectura arranca limpia (importe e ítems de la anterior no se heredan)
const gmail = (resp) => p.evaluate(async (resp) => {
  window._geminiProxy = async () => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(resp) }] } }] }) });
  document.getElementById('leerFactClase').value = 'fact|A'; lfClaseChange();
  window._leerFactArchivoDB64 = 'AAAA'; window._leerFactArchivoTipo = 'application/pdf';
  await procesarFacturaPDFDesdeBase64();
  return { imp: document.getElementById('leerFactImporte').value, modo: _impEst.lf.modo, items: Array.from(document.querySelectorAll('#lfItemsLista .fi-detalle')).map(e => e.value), perc: _impEst.lf.perc.map(x => x.desc || x.tipo), aviso: _impEst.lf.aviso, venc: document.getElementById('leerFactVenc').value };
}, resp);
await p.evaluate(() => { abrirLeerFacturaPDF(); _mostrarPreviewFactura({ proveedor: 'Cementos K SA', numero: '0009-00000001', fecha: '2026-11-01', vencimiento: '2026-12-01', importe: 9999, items: [{ detalle: 'Previo', cantidad: 1, precioUnitario: 9999, importe: 9999 }] }); });
const gm1 = await gmail({ proveedor: 'Cementos K SA', tipoComprobante: 'A', receptor: 'Constructora Los Álamos S.A.', numero: '0009-00000002', fecha: '2026-11-02', netoGravado: 1000, importeIVA: 210, importe: null, moneda: 'ARS' });
ok('K4: importar de Gmail una factura sin importe tras otra leída: el importe sale del neto + IVA (1.210), sin ítems ni percepción inventada de la anterior', parseFloat(gm1.imp) === 1210 && gm1.items.length === 0 && gm1.perc.length === 0 && gm1.venc === '', JSON.stringify(gm1));
await p.evaluate(() => { document.getElementById('lfMontoPago').value = '300'; cerrarLeerFactPDF && cerrarLeerFactPDF(); });
await p.evaluate(() => { abrirLeerFacturaPDF(); _mostrarPreviewFactura({ proveedor: 'Cementos K SA', numero: '0009-00000003', fecha: '2026-11-03', importe: 7777, items: [{ detalle: 'Otro previo', cantidad: 1, precioUnitario: 7777, importe: 7777 }] }); });
const gm2 = await gmail({ proveedor: 'Cementos K SA', tipoComprobante: 'A', receptor: 'Constructora Los Álamos S.A.', numero: '0009-00000004', fecha: '2026-11-04', importe: 1210, netoGravado: 1000, importeIVA: 210, items: [{ detalle: 'Real', cantidad: 1, precioUnitario: 1000, importe: 1000 }] });
ok('K4b: con importe e ítems propios la lectura de Gmail usa ESOS (importe 1.210, ítem «Real») y no el «Otro previo»', parseFloat(gm2.imp) === 1210 && gm2.items.length === 1 && gm2.items[0] === 'Real', JSON.stringify(gm2));
ok('K4c: y el «Monto a pagar» de la lectura anterior (300) no se hereda', (await val('lfMontoPago')) === '', await val('lfMontoPago'));
await p.evaluate(() => cerrarLeerFactPDF && cerrarLeerFactPDF());

// K5: la segunda factura de una tanda de «leer PDF» no hereda el «Monto a pagar» tipeado en la anterior
await p.evaluate(() => { abrirLeerFacturaPDF(); document.getElementById('leerFactPaso1').style.display = 'none'; document.getElementById('leerFactPaso2').style.display = ''; document.getElementById('lfMontoPago').value = '300'; lfInicializarPaso2('Cementos K SA', { importe: 1210, ivaDetalle: [{ alicuota: 21, neto: 1000, iva: 210 }] }); });
ok('K5: lfInicializarPaso2 vacía «Monto a pagar» (no paga la nueva factura con el monto de la anterior)', (await val('lfMontoPago')) === '', await val('lfMontoPago'));
// K5b: base de retención de «leer PDF» con pago parcial: proporcional al monto a pagar (1.000 × 500 / 1.210 = 413)
await p.evaluate(() => { document.getElementById('lfProveedor') ; lfSelMod('A'); });
await poner('lfMontoPago', '500');
const k5b = await val('lfRetBase');
ok('K5b: pagando sólo 500 de 1.210 la base de retención propuesta es 413 (no el neto completo de 1.000)', Math.abs(parseFloat(k5b) - 413) <= 1, k5b);
await p.evaluate(() => cerrarLeerFactPDF && cerrarLeerFactPDF());

// K6: un comprobante que abre con el panel oculto no deja las filas del anterior a la vista
await p.evaluate(() => { agregarFactura(); });
await poner('factImpN0', '1000');
await p.evaluate(() => { _impAgregarFila('fact'); _impPercAgregar('fact', 'iibb_caba'); });
await p.evaluate(() => cerrarFactura());
await p.evaluate(() => { facturas.push({ id: 'fc_k6', proveedor: 'Cementos K SA', numero: '0002-00000006', fecha: '2026-10-14', importe: 500, tipoComprobante: 'X', computaARCA: false, estado: 'pendiente', pagado: 0 }); });
await p.evaluate((i) => editarFactura(i), await idx('fc_k6'));
await poner('factClase', 'fact|A', 'change');
const k6 = await p.evaluate(() => ({ filasDOM: document.querySelectorAll('#factImpGrupo .imp-fila:not(.imp-perc):not(.imp-ngex)').length, filasEst: _impEst.fact.filas.length, percDOM: document.querySelectorAll('#factImpGrupo .imp-perc').length, percEst: _impEst.fact.perc.length }));
ok('K6: pasar un Comprobante X a factura A muestra las filas del estado actual (1 fila, sin percepción), no las de un alta anterior', k6.filasDOM === k6.filasEst && k6.percDOM === k6.percEst, JSON.stringify(k6));
await p.evaluate(() => cerrarFactura());

// K7: «leer PDF» con panel oculto (Comprobante X) y la IA sin importe: al pasar a «computa» el importe se completa solo
await p.evaluate(() => { abrirLeerFacturaPDF(); document.getElementById('leerFactPaso1').style.display = 'none'; document.getElementById('leerFactPaso2').style.display = ''; document.getElementById('leerFactImporte').value = ''; document.getElementById('leerFactClase').value = 'factx|X'; lfClaseChange(); _impIniciar('lf', null); _impCargarIA('lf', { netoGravado: 1000, importeIVA: 210 }); });
await p.evaluate(() => { document.getElementById('leerFactClase').value = 'fact|A'; lfClaseChange(); document.getElementById('leerFactComputaARCA').value = 'true'; _impSync('lf'); });   // el toggle «¿Computa ARCA?» no vuelve solo a «Sí»
ok('K7: al mostrarse el panel (X → factura A) con el neto que leyó la IA, el importe queda en 1.210 y no vacío', parseFloat(await val('leerFactImporte')) === 1210, await val('leerFactImporte'));
await p.evaluate(() => cerrarLeerFactPDF && cerrarLeerFactPDF());

// K8: cambiar la letra suelta el IVA fijado a mano (era el de otra alícuota)
await p.evaluate((i) => editarFactura(i), await idx('fc_k8'));
await poner('factClase', 'fact|C', 'change');
const k8 = await p.evaluate(() => ({ f: _impEst.fact.filas[0], r: _impResolver(_impEst.fact, parseFloat(document.getElementById('factImporte').value) || 0) }));
ok('K8: pasar de A a C (0 %) con un IVA fijo de 210,50 lo suelta: la línea queda 0 % sin IVA (no «0 % con IVA 210,50»)', k8.f.alic === 0 && k8.f.iva == null && k8.r.filas[0].iva === 0, JSON.stringify(k8));
await p.evaluate(() => cerrarFactura());
// K8b: NC: elegir otra factura suelta el IVA fijo y no pisa un detalle de varias alícuotas
await p.evaluate(() => { facturas.push({ id: 'fc_k8b', proveedor: 'Cementos K SA', numero: '0002-00000088', fecha: '2026-10-15', importe: 1105, tipoComprobante: 'A', computaARCA: true, estado: 'pendiente', pagado: 0, ivaDetalle: [{ alic: 10.5, neto: 1000, iva: 105 }] }); abrirNotaCredito('Cementos K SA'); });
await p.waitForTimeout(100);
const k8b = await p.evaluate(() => {
  const sel = document.getElementById('ncFactura'); const o = document.createElement('option'); o.value = 'fact:fc_k8b'; o.textContent = 'x'; sel.appendChild(o); sel.value = 'fact:fc_k8b';
  _impEst.nc.filas[0].iva = 210.5; _impEst.nc.tocado = false; _impPrecargarNC('nc');
  const a = { alic: _impEst.nc.filas[0].alic, iva: _impEst.nc.filas[0].iva };
  _impEst.nc.filas = [{ alic: 21, neto: 1000, iva: null }, { alic: 10.5, neto: 500, iva: null }]; _impEst.nc.tocado = false; _impPrecargarNC('nc');
  return { a, n: _impEst.nc.filas.length, alic1: _impEst.nc.filas[0].alic };
});
ok('K8b: nota de crédito sobre una factura al 10,5 %: propone 10,5 % y suelta el IVA fijo; con dos líneas no las pisa', k8b.a.alic === 10.5 && k8b.a.iva == null && k8b.n === 2 && k8b.alic1 === 21, JSON.stringify(k8b));

// K9: la base de retención no se elige en una nota de crédito (no se retiene) y no queda `sinRet` inerte
await p.evaluate(() => { _impIniciar('nc', null); });
await p.evaluate(() => { const n = document.getElementById('ncImpN0'); n.value = '1000'; n.dispatchEvent(new Event('input', { bubbles: true })); _impAgregarFila('nc'); });
await p.evaluate(() => { const n = document.getElementById('ncImpN1'); n.value = '500'; n.dispatchEvent(new Event('input', { bubbles: true })); _impEst.nc.retSolo = 1; _impRefrescar('nc', true); });
const k9 = await p.evaluate(() => ({ sel: !!document.getElementById('ncImpRetSel'), vis: (() => { const e = document.getElementById('ncImpRet'); return !!e && e.style.display !== 'none'; })(), sinRet: (_impLeer('nc').ivaDetalle || []).some(x => x.sinRet) }));
ok('K9: en una nota de crédito con dos alícuotas no hay selector de base de retención visible ni se guarda `sinRet`', !k9.vis && !k9.sinRet, JSON.stringify(k9));
await p.evaluate(() => { const m = document.getElementById('modalNotaCredito'); if (m) m.classList.remove('active'); });

// K10/K11: base de retención del pago directo: editable y proporcional al monto a pagar
await p.evaluate(() => { agregarFactura(); });
await poner('factProveedor', 'Cementos K SA');
await p.evaluate(() => { selFactPagoInmediato(true); });
await poner('factModalidadPago', 'A', 'change');
await poner('factImpN0', '1000');
ok('K10a: pago directo por banco: la base propuesta es el neto (1.000)', Math.abs(parseFloat(await val('factRetBase')) - 1000) <= 1, await val('factRetBase'));
await poner('factRetBase', '777');
ok('K10: la base de retención se puede corregir a mano (777) y no se pisa', (await val('factRetBase')) === '777', await val('factRetBase'));
await poner('factImpN0', '1200');
ok('K10b: y una base tipeada a mano tampoco se pisa cuando cambia el neto', (await val('factRetBase')) === '777', await val('factRetBase'));
await p.evaluate(() => { agregarFactura(); });
ok('K10c: abrir otra alta devuelve la base al cálculo (no arrastra lo tipeado)', (await val('factRetBase')) === '', await val('factRetBase'));
await poner('factProveedor', 'Cementos K SA');
await p.evaluate(() => { selFactPagoInmediato(true); });
await poner('factModalidadPago', 'A', 'change');
await poner('factImpN0', '10000000');
await poner('factMontoPago', '6050000');
ok('K11: pagando 6.050.000 de 12.100.000 la base de retención propuesta es 5.000.000 (la mitad del neto), no 10.000.000', Math.abs(parseFloat(await val('factRetBase')) - 5000000) <= 1, await val('factRetBase'));
await p.evaluate(() => cerrarFactura());

// K12: reclasificar a Comprobante X con otro importe descarta el neto gravado viejo; y el ratio nunca pasa de 1
ok('K12: _facRatioNeto con un neto mayor que el importe devuelve a lo sumo 1', await p.evaluate(() => _facRatioNeto({ importe: 500, netoGravado: 1000 }) <= 1));
await p.evaluate((i) => editarFactura(i), await idx('fc_k13'));
await poner('factClase', 'factx|X', 'change');
await poner('factImporte', '500');
await guardarForm();
const k12 = await p.evaluate(() => { const f = facturas.find(x => x.id === 'fc_k13'); return { importe: f.importe, neto: f.netoGravado, computa: f.computaARCA }; });
ok('K12b: la factura A reclasificada a X con otro importe (500) no queda con el neto 1.000 de antes', k12.importe === 500 && !k12.neto && k12.computa === false, JSON.stringify([k12, await p.evaluate(() => window.__alerts)]));
await p.evaluate(() => { const m = document.getElementById('modalFact'); if (m) m.classList.remove('active'); });

// K13: ítems de un comprobante ANTERIOR de pocos dólares (sumaban el total) no se toman por netos
await p.evaluate((i) => editarFactura(i), await idx('fc_k14a'));
await p.waitForTimeout(100);
ok('K13: un comprobante anterior de 3 USD con un ítem de 3: los ítems NO son netos (siguen completando el importe)', (await p.evaluate(() => _impEst.fact.itemsNeto)) === false, String(await p.evaluate(() => _impEst.fact.itemsNeto)));
await p.evaluate(() => cerrarFactura());
await p.evaluate((i) => editarFactura(i), await idx('fc_k14b'));
await p.waitForTimeout(100);
ok('K13b: uno de la v589 en adelante (neto 3 + IVA 0,63 = 3,63) sí tiene ítems netos', (await p.evaluate(() => _impEst.fact.itemsNeto)) === true, String(await p.evaluate(() => _impEst.fact.itemsNeto)));
await p.evaluate(() => cerrarFactura());

// K13c: y los ítems de un comprobante anterior que sumaban el TOTAL siguen completando el importe cuando se edita uno (sin sumarle IVA otra vez)
await p.evaluate((i) => editarFactura(i), await idx('fc_k14c'));
await p.waitForTimeout(100);
await p.evaluate(() => { const c = document.querySelector('#factItemsLista .fi-precio'); c.value = '1310'; c.dispatchEvent(new Event('input', { bubbles: true })); });
ok('K13c: un comprobante anterior con ítems por el total (1.210): editar el ítem a 1.310 deja el importe en 1.310 (no 1.585,10)', parseFloat(await val('factImporte')) === 1310, await val('factImporte'));
await p.evaluate(() => cerrarFactura());

// K14: el «Monto a pagar» tipeado no puede pasar del importe: se repone si el importe baja y se frena al guardar
await p.evaluate(() => { agregarFactura(); });
await poner('factProveedor', 'Cementos K SA');
await poner('factImpN0', '1000');
await p.evaluate(() => { selFactPagoInmediato(true); selFactModalidad('B'); });
await poner('factMontoPago', '1210');
await poner('factImpN0', '500');
ok('K14: tipeado 1.210 y bajado el neto a 500 (importe 605), el monto a pagar vuelve a 605 (no queda un pago mayor que la factura)', parseFloat(await val('factMontoPago')) === 605, await val('factMontoPago'));
await p.evaluate(() => { document.getElementById('factMontoPago').value = '9999'; });
const cantAntes = await p.evaluate(() => facturas.length);
await guardarForm();
const k14 = await p.evaluate(() => ({ n: facturas.length, al: window.__alerts.join(' | ') }));
ok('K14b: un monto a pagar mayor que el saldo (9.999 contra 605) se frena al guardar con un aviso y no carga la factura', k14.n === cantAntes && /supera el saldo/.test(k14.al), JSON.stringify(k14));
await p.evaluate(() => cerrarFactura());

// K15: un panel oculto no bloquea el «Guardar» (neto con 3 decimales + Comprobante X): CLICK REAL, con la validación nativa
await p.evaluate(() => { agregarFactura(); });
await poner('factProveedor', 'Cementos K SA');
await poner('factNumero', '0002-00000099');
await poner('factImpN0', '826.4463');
await poner('factClase', 'factx|X', 'change');
const nAntes = await p.evaluate(() => facturas.length);
await p.evaluate(() => { window.__alerts.length = 0; });
await p.click('#factSubmitBtn');
await p.waitForTimeout(500);
const k15 = await p.evaluate(() => ({ n: facturas.length, abierto: document.getElementById('modalFact').classList.contains('active'), al: window.__alerts.join(' | '), inv: Array.from(document.getElementById('formFact').querySelectorAll(':invalid')).map(e => e.id || e.className) }));
ok('K15: con un neto de 3 decimales y el panel oculto (Comprobante X) el click real en «Guardar» carga la factura', k15.n === nAntes + 1, JSON.stringify(k15));
await p.evaluate(() => { const m = document.getElementById('modalFact'); if (m) m.classList.remove('active'); });
// K15b: el neto con muchos decimales ya no bloquea ni con el panel visible (step «any»): lo redondea el panel
await p.evaluate(() => { agregarFactura(); });
await poner('factProveedor', 'Cementos K SA');
await poner('factNumero', '0002-00000098');
await poner('factImpN0', '826.4463');
const n2 = await p.evaluate(() => facturas.length);
await p.click('#factSubmitBtn');
await p.waitForTimeout(500);
ok('K15b: con el panel visible un neto de 3 decimales (826,4463) se redondea y guarda (importe 1.000,00)', await p.evaluate((n) => facturas.length === n + 1 && facturas[facturas.length - 1].importe === 1000, n2), JSON.stringify(await p.evaluate(() => facturas[facturas.length - 1].importe)));
await p.evaluate(() => { const m = document.getElementById('modalFact'); if (m) m.classList.remove('active'); });

// K16: cada manejador que cambia un importe del panel escribe el importe total (modo neto); se mide el campo, no sólo el resolvedor
await p.evaluate(() => { agregarFactura(); });
await poner('factImpN0', '1000');
await p.evaluate(() => { _impPercAgregar('fact', 'iibb_caba'); });
await p.evaluate(() => { const i = document.querySelector('#factImpGrupo .imp-perc input[type=number]'); i.value = '30'; i.dispatchEvent(new Event('input', { bubbles: true })); });
ok('K16a: neto 1.000 + percepción 30 → importe 1.240', parseFloat(await val('factImporte')) === 1240, await val('factImporte'));
await p.evaluate(() => _impPercQuitar('fact', 0));
ok('K16b: quitar la percepción lleva el importe a 1.210 (sin tipear nada más)', parseFloat(await val('factImporte')) === 1210, await val('factImporte'));
await p.evaluate(() => _impVerNGEX('fact'));
await p.evaluate(() => { const i = document.querySelectorAll('#factImpGrupo .imp-ngex input')[0]; i.value = '100'; i.dispatchEvent(new Event('input', { bubbles: true })); });
ok('K16c: un no gravado de 100 se suma al importe (1.310)', parseFloat(await val('factImporte')) === 1310, await val('factImporte'));
await p.evaluate(() => { const i = document.querySelectorAll('#factImpGrupo .imp-ngex input')[1]; i.value = '50'; i.dispatchEvent(new Event('input', { bubbles: true })); });
ok('K16d: y un exento de 50 también (1.360)', parseFloat(await val('factImporte')) === 1360, await val('factImporte'));
await p.evaluate(() => { _impIniciar('fact', null); document.getElementById('factImporte').value = ''; });
await poner('factImpN0', '1000');
await p.evaluate(() => { _impAgregarFila('fact'); });
await alic(1, '10.5');
await poner('factImpN1', '500');
ok('K16e: neto 1.000 al 21 % + 500 al 10,5 % → importe 1.762,50 (1.210 + 552,50)', parseFloat(await val('factImporte')) === 1762.5, await val('factImporte'));
await p.evaluate(() => _impQuitarFila('fact', 1));
ok('K16f: quitar la segunda alícuota lleva el importe a 1.210', parseFloat(await val('factImporte')) === 1210, await val('factImporte'));
// ítems: sumar, quitar y cambiar el signo siguen al neto
await p.evaluate(() => { _impIniciar('fact', null); document.getElementById('factImporte').value = ''; _renderFactItems([]); factAgregarItem({ detalle: 'A', cantidad: 1, precioUnit: 1000, signo: 1 }); factAgregarItem({ detalle: 'B', cantidad: 1, precioUnit: 200, signo: 1 }); });
ok('K16g: dos ítems (1.000 + 200) → neto 1.200, importe 1.452', parseFloat(await val('factImporte')) === 1452, await val('factImporte'));
await p.evaluate(() => factToggleSigno(document.querySelectorAll('#factItemsLista .fi-signo')[1]));
ok('K16h: invertir el signo del segundo ítem (1.000 − 200) lleva el importe a 968', parseFloat(await val('factImporte')) === 968, await val('factImporte'));
await p.evaluate(() => factQuitarItem(document.querySelectorAll('#factItemsLista .fi-quitar')[1]));
ok('K16i: quitar ese ítem deja el importe en 1.210', parseFloat(await val('factImporte')) === 1210, await val('factImporte'));
// «leer PDF» con ítems netos (importe 1.105 al 10,5 %): editar la cantidad suma el IVA (los ítems son netos)
await p.evaluate(() => { abrirLeerFacturaPDF(); document.getElementById('leerFactPaso1').style.display = 'none'; document.getElementById('leerFactPaso2').style.display = ''; _renderFactItems([{ detalle: 'X', cantidad: 10, precioUnit: 100, signo: 1 }], 'lf'); document.getElementById('leerFactImporte').value = '1105'; document.getElementById('leerFactClase').value = 'fact|A'; lfClaseChange(); document.getElementById('leerFactComputaARCA').value = 'true'; lfInicializarPaso2('Cementos K SA', { importe: 1105, ivaDetalle: [{ alicuota: 10.5, neto: 1000, iva: 105 }] }); });
const k16j0 = await p.evaluate(() => _impEst.lf.itemsNeto);
await p.evaluate(() => { const c = document.querySelector('#lfItemsLista .fi-cant'); c.value = '20'; c.dispatchEvent(new Event('input', { bubbles: true })); });
ok('K16j: «leer PDF» con ítems netos: editar la cantidad (20 × 100) da importe 2.210 y los ítems siguen siendo netos', k16j0 === true && parseFloat(await val('leerFactImporte')) === 2210, JSON.stringify([k16j0, await val('leerFactImporte')]));
await p.evaluate(() => cerrarLeerFactPDF && cerrarLeerFactPDF());
await p.evaluate(() => { const m = document.getElementById('modalFact'); if (m) m.classList.remove('active'); });

const falla = res.filter(x => x[0] === 'FALLA').length;
res.forEach(x => console.log(x.join(' · ')));
console.log('\n' + (res.length - falla) + '/' + res.length + ' OK');
if (errores && errores.length) console.log('ERRORES DE PÁGINA:', errores.slice(0, 5));
await b.close();
process.exit(falla || (errores && errores.length) ? 1 : 0);
