// Comprobantes recibidos: elegir la alícuota de IVA (21 % / 10,5 % / varias) y cargar percepciones (IIBB CABA, Buenos Aires, otras…).
// Corre contra la demo (base en memoria). Uso: node comprobante-iva-percepciones.mjs   (ver README: hace falta bajar-cdn.sh antes)
import { abrirDemo, entrarAlSistema } from './demo-lib.mjs';
const { b, p, errores } = await abrirDemo();
const res = [];
const ok = (n, c, x) => res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]);
await entrarAlSistema(p);
await p.evaluate(() => { window.__alerts = []; window.alert = m => window.__alerts.push(String(m)); window.confirm = () => true; });
const cerca = (x, y, t = 0.011) => Math.abs(x - y) <= t;
const poner = (id, v, ev) => p.evaluate(({ id, v, ev }) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event(ev || 'input', { bubbles: true })); }, { id, v, ev });
const vis = (id) => p.evaluate((id) => { const e = document.getElementById(id); return !!e && e.style.display !== 'none' && e.offsetParent !== null; }, id);
const num = (id) => p.evaluate((id) => { const e = document.getElementById(id); return e ? e.value : null; }, id);
const resolver = (pfx) => p.evaluate((pfx) => { const est = _impEst[pfx], tot = parseFloat(document.getElementById(_IMP_CTX[pfx].importe).value) || 0; return _impResolver(est, tot); }, pfx);

await p.evaluate(() => {
  proveedores.push({ id: 'pv_iva', razonSocial: 'Ferretería Doble IVA SA', cuit: '30-50000000-9' });
  return persistirProveedores();
});
await p.waitForTimeout(200);

// ═════════ A: formulario manual ═════════
await p.evaluate(() => agregarFactura());
await p.waitForTimeout(150);
ok('A1: en una Factura A el panel «IVA y percepciones» está a la vista y propone 21 %', await vis('factImpGrupo') && (await p.evaluate(() => _impEst.fact.filas[0].alic)) === 21);
await poner('factClase', 'fact|C', 'change');
ok('A2: la Factura C propone 0 % (no discrimina IVA)', (await p.evaluate(() => _impEst.fact.filas[0].alic)) === 0);
await poner('factClase', 'fact|A', 'change');
ok('A3: volver a la A propone 21 % otra vez mientras nadie tocó el panel', (await p.evaluate(() => _impEst.fact.filas[0].alic)) === 21);
for (const c of ['factx|X', 'vep|X']) { await poner('factClase', c, 'change'); ok('A4: con «' + c + '» el panel se esconde (no hay crédito fiscal)', !(await vis('factImpGrupo'))); }
await poner('factClase', 'fact|A', 'change');
ok('A5: y vuelve a mostrarse con la Factura A', await vis('factImpGrupo'));

await poner('factProveedor', 'Ferretería Doble IVA SA');
await poner('factImporte', '1210');
let r = await resolver('fact');
ok('A6: importe 1.210 al 21 % → neto 1.000,00 + IVA 210,00', cerca(r.neto, 1000) && cerca(r.iva, 210), JSON.stringify(r));
ok('A7: los campos de pantalla muestran el neto y el IVA calculados', parseFloat(await num('factImpN0')) === 1000 && parseFloat(await num('factImpI0')) === 210, await num('factImpN0') + ' / ' + await num('factImpI0'));
await poner('factImpGrupo', '', 'input').catch(() => {});
await p.evaluate(() => { const s = document.querySelector('#factImpGrupo .imp-fila select'); s.value = '10.5'; s.dispatchEvent(new Event('change', { bubbles: true })); });
r = await resolver('fact');
ok('A8: elegir 10,5 % → neto 1.095,02 + IVA 114,98 (cierra al centavo con el total)', cerca(r.neto, 1095.02) && cerca(r.iva, 114.98) && cerca(r.neto + r.iva, 1210), JSON.stringify(r));
await p.evaluate(() => _impPercAgregar('fact', 'iibb_caba'));
await p.evaluate(() => { const i = document.querySelector('#factImpGrupo .imp-perc input[type=number]'); i.value = '30'; i.dispatchEvent(new Event('input', { bubbles: true })); });
r = await resolver('fact');
ok('A9: con una percepción de IIBB CABA de 30 el neto baja: (1.210 − 30) / 1,105 = 1.067,87 y el IVA 112,13', cerca(r.neto, 1067.87) && cerca(r.iva, 112.13) && cerca(r.percTot, 30) && cerca(r.neto + r.iva + r.percTot, 1210), JSON.stringify(r));
// escribir en un campo no repinta el panel: el foco sigue donde estaba
const foco = await p.evaluate(() => { const i = document.querySelector('#factImpGrupo .imp-perc input[type=number]'); i.focus(); i.value = '31'; i.dispatchEvent(new Event('input', { bubbles: true })); return document.activeElement === i; });
ok('A10: tipear un importe no le saca el foco al campo (el panel no se repinta)', foco === true);
await p.evaluate(() => { const i = document.querySelector('#factImpGrupo .imp-perc input[type=number]'); i.value = '30'; i.dispatchEvent(new Event('input', { bubbles: true })); });

// varias alícuotas: 500 de neto al 21 % y el resto al 10,5 %
await p.evaluate(() => _impPercQuitar('fact', 0));
await poner('factImporte', '1240');
await p.evaluate(() => { const s = document.querySelector('#factImpGrupo .imp-fila select'); s.value = '10.5'; s.dispatchEvent(new Event('change', { bubbles: true })); _impAgregarFila('fact'); });
const sel2 = await p.evaluate(() => _impEst.fact.filas.map(f => f.alic));
ok('A11: «Otra alícuota» agrega una fila con otra alícuota (21 %) distinta de la ya usada', sel2.length === 2 && sel2[0] === 10.5 && sel2[1] === 21, JSON.stringify(sel2));
await poner('factImpN1', '568.18');
r = await resolver('fact');
ok('A12: 568,18 al 21 % (IVA 119,32) y el resto al 10,5 %: neto 500 + IVA 52,50; cierra el total 1.240', cerca(r.filas[1].neto, 568.18) && cerca(r.filas[1].iva, 119.32) && cerca(r.filas[0].neto, 500, 0.02) && cerca(r.neto + r.iva, 1240), JSON.stringify(r));
// IVA copiado a mano de la factura (redondeo)
await p.evaluate(() => _impQuitarFila('fact', 1));
await poner('factImporte', '1210');
await p.evaluate(() => { const s = document.querySelector('#factImpGrupo .imp-fila select'); s.value = '21'; s.dispatchEvent(new Event('change', { bubbles: true })); });
await poner('factImpI0', '210.01');
r = await resolver('fact');
ok('A13: un IVA tipeado a mano (210,01) queda fijo y el neto NO se mueve (1.000): el que absorbe es el total (1.210,01)', cerca(r.iva, 210.01, 0.001) && cerca(r.neto, 1000, 0.001) && cerca(r.neto + r.iva, 1210.01, 0.001) && parseFloat(await num('factImporte')) === 1210.01, JSON.stringify(r) + ' / ' + await num('factImporte'));
await poner('factImpI0', '');
r = await resolver('fact');
ok('A14: vaciar el IVA vuelve al cálculo automático', cerca(r.iva, 210, 0.001) && cerca(r.neto, 1000, 0.001), JSON.stringify(r));
await poner('factImporte', '1210');   // se vuelve a tipear el total de la factura: ese total manda de nuevo

// guardar una factura al 10,5 % con percepciones de CABA y de Buenos Aires
await p.evaluate(() => { const s = document.querySelector('#factImpGrupo .imp-fila select'); s.value = '10.5'; s.dispatchEvent(new Event('change', { bubbles: true })); _impPercAgregar('fact', 'iibb_caba'); _impPercAgregar('fact', 'iibb_pba'); });
await p.evaluate(() => { const i = document.querySelectorAll('#factImpGrupo .imp-perc input[type=number]'); i[0].value = '20'; i[0].dispatchEvent(new Event('input', { bubbles: true })); i[1].value = '10'; i[1].dispatchEvent(new Event('input', { bubbles: true })); });
await poner('factNumero', '0007-00001111');
await p.evaluate(() => { window.__alerts.length = 0; document.getElementById('formFact').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); });
await p.waitForTimeout(500);
let f1 = await p.evaluate(() => { const f = facturas.find(x => x.numero === '0007-00001111'); return f ? JSON.parse(JSON.stringify(f)) : null; });
ok('A15: se guardó con ivaDetalle al 10,5 % y las dos percepciones', f1 && f1.ivaDetalle && f1.ivaDetalle.length === 1 && f1.ivaDetalle[0].alic === 10.5 && f1.percepciones && f1.percepciones.length === 2, JSON.stringify(f1 && { d: f1.ivaDetalle, p: f1.percepciones, al: await p.evaluate(() => window.__alerts) }));
ok('A16: neto 1.082,36 (1.180 / 1,105 = 1.067,87 no: 1.210 − 30 percepciones) → neto + IVA + percepciones = 1.210; netoGravado e importeIVA sincronizados',
  f1 && cerca(f1.ivaDetalle[0].neto + f1.ivaDetalle[0].iva + 30, 1210) && cerca(f1.netoGravado, f1.ivaDetalle[0].neto) && cerca(f1.importeIVA, f1.ivaDetalle[0].iva) && cerca(f1.netoGravado, 1067.87), JSON.stringify(f1 && [f1.netoGravado, f1.importeIVA]));
ok('A17: tipos de percepción guardados (iibb_caba 20, iibb_pba 10)', f1 && f1.percepciones[0].tipo === 'iibb_caba' && f1.percepciones[0].monto === 20 && f1.percepciones[1].tipo === 'iibb_pba' && f1.percepciones[1].monto === 10, JSON.stringify(f1 && f1.percepciones));

// editar: vuelve tal cual se cargó, y guardar sin tocar conserva todo
const i1 = await p.evaluate(() => facturas.findIndex(x => x.numero === '0007-00001111'));
await p.evaluate((i) => editarFactura(i), i1);
await p.waitForTimeout(150);
const ed = await p.evaluate(() => ({ alic: _impEst.fact.filas.map(f => f.alic), perc: _impEst.fact.perc.map(x => [x.tipo, x.monto]), vis: document.getElementById('factImpGrupo').style.display !== 'none', legacy: _impEst.fact.legacy }));
ok('A18: al editar aparecen la alícuota (10,5 %) y las dos percepciones cargadas', JSON.stringify(ed.alic) === '[10.5]' && JSON.stringify(ed.perc) === JSON.stringify([['iibb_caba', 20], ['iibb_pba', 10]]) && ed.vis && !ed.legacy, JSON.stringify(ed));
await p.evaluate(() => { window.__alerts.length = 0; document.getElementById('formFact').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); });
await p.waitForTimeout(500);
const f1b = await p.evaluate(() => JSON.parse(JSON.stringify(facturas.find(x => x.numero === '0007-00001111'))));
ok('A19: guardar sin tocar nada conserva el detalle (mismos importes)', JSON.stringify(f1b.ivaDetalle) === JSON.stringify(f1.ivaDetalle) && JSON.stringify(f1b.percepciones) === JSON.stringify(f1.percepciones) && f1b.importe === f1.importe, JSON.stringify([f1b.ivaDetalle, f1b.percepciones]));
// sacar una percepción al editar: no reaparece
await p.evaluate((i) => editarFactura(i), i1);
await p.evaluate(() => _impPercQuitar('fact', 1));
await p.evaluate(() => { document.getElementById('formFact').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); });
await p.waitForTimeout(500);
const f1c = await p.evaluate(() => JSON.parse(JSON.stringify(facturas.find(x => x.numero === '0007-00001111'))));
ok('A20: quitar una percepción al editar la borra de verdad (no vuelve de la versión anterior)', f1c.percepciones && f1c.percepciones.length === 1 && f1c.percepciones[0].tipo === 'iibb_caba', JSON.stringify(f1c.percepciones));
// pasarla a Comprobante X quita todo el detalle
await p.evaluate((i) => editarFactura(i), i1);
await poner('factClase', 'factx|X', 'change');
await p.evaluate(() => { document.getElementById('formFact').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); });
await p.waitForTimeout(500);
const f1d = await p.evaluate(() => JSON.parse(JSON.stringify(facturas.find(x => x.numero === '0007-00001111'))));
ok('A21: pasarla a Comprobante X (sin crédito fiscal) borra el detalle de IVA y percepciones', f1d.computaARCA === false && f1d.ivaDetalle === undefined && f1d.percepciones === undefined && f1d.importeIVA === undefined, JSON.stringify(f1d));

// validación: percepciones mayores que el total no se guardan
await p.evaluate(() => agregarFactura());
await poner('factProveedor', 'Ferretería Doble IVA SA'); await poner('factImporte', '100'); await poner('factNumero', '0007-00002222');
await p.evaluate(() => { _impPercAgregar('fact', 'iibb_caba'); const i = document.querySelector('#factImpGrupo .imp-perc input[type=number]'); i.value = '500'; i.dispatchEvent(new Event('input', { bubbles: true })); });
await p.evaluate(() => { window.__alerts.length = 0; document.getElementById('formFact').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); });
await p.waitForTimeout(300);
r = await p.evaluate(() => ({ al: window.__alerts.slice(), hay: facturas.some(x => x.numero === '0007-00002222') }));
ok('A22: percepciones por 500 sobre un total de 100 avisan y no guardan', r.al.length === 1 && /supera el importe total/.test(r.al[0]) && !r.hay, JSON.stringify(r));
await p.evaluate(() => cerrarFactura());

// ═════════ B: comprobante ANTERIOR (sin detalle) ═════════
await p.evaluate(() => {
  facturas.push({ id: 'fc_old', proveedor: 'Ferretería Doble IVA SA', numero: '0001-00000001', fecha: '2026-11-03', moneda: 'ARS', importe: 1105, netoGravado: 1000, tipoComprobante: 'A', computaARCA: true, pagado: 0, estado: 'pendiente', tipo: 'directo', pagosHistorial: [] });
  facturas.push({ id: 'fc_old2', proveedor: 'Ferretería Doble IVA SA', numero: '0001-00000002', fecha: '2026-11-04', moneda: 'ARS', importe: 500, tipoComprobante: 'A', computaARCA: true, pagado: 0, estado: 'pendiente', tipo: 'directo', pagosHistorial: [] });
  return persistirFacturas();
});
await p.waitForTimeout(300);
const iOld = await p.evaluate(() => facturas.findIndex(x => x.id === 'fc_old'));
await p.evaluate((i) => editarFactura(i), iOld);
const old = await p.evaluate(() => ({ legacy: _impEst.fact.legacy, alic: _impEst.fact.filas[0].alic, aviso: _impEst.fact.aviso }));
ok('B1: un comprobante anterior con neto 1.000 sobre 1.105 se abre al 10,5 % (deducido) y marcado como anterior', old.legacy === true && old.alic === 10.5, JSON.stringify(old));
await poner('factDescripcion', 'cambio de concepto');
await p.evaluate(() => { document.getElementById('formFact').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); });
await p.waitForTimeout(500);
const fo = await p.evaluate(() => JSON.parse(JSON.stringify(facturas.find(x => x.id === 'fc_old'))));
ok('B2: editarlo sin tocar el panel NO le inventa un detalle (sigue sin ivaDetalle y conserva su neto)', fo.ivaDetalle === undefined && fo.netoGravado === 1000 && fo.descripcion === 'cambio de concepto', JSON.stringify(fo));
const iOld2 = await p.evaluate(() => facturas.findIndex(x => x.id === 'fc_old2'));
await p.evaluate((i) => editarFactura(i), iOld2);
ok('B3: uno sin neto cargado muestra el aviso de que se estimaba al 21 %', /estimaba al 21/.test(await p.evaluate(() => _impEst.fact.aviso)));
await p.evaluate((i) => { _impAlic('fact', 0, '10.5'); document.getElementById('formFact').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); }, iOld2);
await p.waitForTimeout(500);
const fo2 = await p.evaluate(() => JSON.parse(JSON.stringify(facturas.find(x => x.id === 'fc_old2'))));
ok('B4: elegir la alícuota en uno anterior sí guarda el detalle (500 al 10,5 %: neto 452,49 + IVA 47,51)', fo2.ivaDetalle && fo2.ivaDetalle[0].alic === 10.5 && cerca(fo2.ivaDetalle[0].neto, 452.49) && cerca(fo2.ivaDetalle[0].iva, 47.51), JSON.stringify(fo2.ivaDetalle));

// ═════════ C: Libro de Compras ═════════
await p.evaluate(() => {
  const base = { proveedor: 'Ferretería Doble IVA SA', fecha: '2026-11-10', moneda: 'ARS', tipoComprobante: 'A', computaARCA: true, pagado: 0, estado: 'pendiente', tipo: 'directo', pagosHistorial: [] };
  facturas.push(Object.assign({}, base, { id: 'fc_lib1', numero: 'L-1', importe: 1240, netoGravado: 1000, importeIVA: 210, ivaDetalle: [{ alic: 21, neto: 1000, iva: 210 }], percepciones: [{ tipo: 'iibb_caba', monto: 30 }] }));
  facturas.push(Object.assign({}, base, { id: 'fc_lib2', numero: 'L-2', importe: 1240, netoGravado: 1087.5, importeIVA: 62.5, ivaDetalle: [{ alic: 21, neto: 500, iva: 105 }, { alic: 10.5, neto: 500, iva: 52.5 }], percepciones: [{ tipo: 'iibb_pba', monto: 37.5 }] }));
  facturas.push(Object.assign({}, base, { id: 'fc_lib3', numero: 'L-3', importe: 600, ivaDetalle: [{ alic: 21, neto: 450, iva: 94.5 }], netoNoGravado: 55.5, percepciones: [{ tipo: 'iibb_otra', monto: 0.01, desc: 'Córdoba' }] }));
  facturas.push(Object.assign({}, base, { id: 'fc_libnc', numero: 'NC-L', esNotaCredito: true, importe: 121, netoGravado: 100, importeIVA: 21, ivaDetalle: [{ alic: 21, neto: 100, iva: 21 }], pagado: 0, estado: 'pagada' }));
  facturas.push(Object.assign({}, base, { id: 'fc_libold', numero: 'L-OLD', importe: 1210, netoGravado: 1000 }));
  return persistirFacturas();
});
await p.waitForTimeout(300);
r = await p.evaluate(() => { const g = id => _rptIvaCompra(facturas.find(x => x.id === id)); return { a: g('fc_lib1'), b: g('fc_lib2'), c: g('fc_lib3'), nc: g('fc_libnc'), old: g('fc_libold') }; });
ok('C1: una factura con detalle usa el IVA cargado (210, no el que saldría por resta 210+30) y la percepción aparte', cerca(r.a.iva, 210) && cerca(r.a.neto, 1000) && cerca(r.a.percep, 30) && !r.a.estimado, JSON.stringify(r.a));
ok('C2: con dos alícuotas el IVA es la suma (105 + 52,50) y la etiqueta dice «21% / 10,5%»', cerca(r.b.iva, 157.5) && r.b.alicLabel === '21% / 10,5%' && cerca(r.b.neto, 1000), JSON.stringify(r.b));
ok('C3: no gravado y percepción de otra jurisdicción: no entran al IVA y suman al total (450 + 94,50 + 55,50 + 0,01 ≈ 600)', cerca(r.c.noGrav, 55.5) && cerca(r.c.percep, 0.01) && cerca(r.c.neto + r.c.iva + r.c.noGrav + r.c.percep, 600, 0.02), JSON.stringify(r.c));
ok('C4: la nota de crédito con detalle resta (neto −100, IVA −21)', cerca(r.nc.neto, -100) && cerca(r.nc.iva, -21), JSON.stringify(r.nc));
ok('C5: un comprobante anterior sin detalle sigue como siempre (IVA por resta, 21 %)', cerca(r.old.iva, 210) && r.old.tieneDetalle === false && r.old.alicLabel === '21%', JSON.stringify(r.old));
// pantalla del libro
await p.evaluate(() => { mostrarTab('Reportes'); });
await p.waitForTimeout(300);
await p.evaluate(() => { const f = rptFiltro(); window.__f = f; });
const lib = await p.evaluate(() => {
  const m = document.getElementById('rptMes'), a = document.getElementById('rptAnio'), q = document.getElementById('rptQuin');
  if (m) { m.value = '10'; m.dispatchEvent(new Event('change', { bubbles: true })); }
  if (a) { a.value = '2026'; a.dispatchEvent(new Event('change', { bubbles: true })); }
  if (q) { q.value = '0'; q.dispatchEvent(new Event('change', { bubbles: true })); }
  const f = rptFiltro(); rptRenderCompras(f);
  const tr = Array.from(document.querySelectorAll('#rptComprasBody tr')).find(t => /L-2/.test(t.textContent));
  const trNC = Array.from(document.querySelectorAll('#rptComprasBody tr')).find(t => /NC-L/.test(t.textContent));
  return { f, fila: tr ? tr.innerText.replace(/\s+/g, ' ') : null, html: tr ? tr.innerHTML : '', nc: trNC ? trNC.innerText.replace(/\s+/g, ' ') : null, cab: Array.from(document.querySelectorAll('#rptComprasBody')[0].closest('table').querySelectorAll('thead th')).map(t => t.textContent.trim()) };
});
ok('C6: el libro tiene la columna «Percep. / otros» (10 columnas) y la fila de dos alícuotas muestra «21% / 10,5%»', lib.cab.length === 10 && /Percep/.test(lib.cab[7]) && lib.fila && /21% \/ 10,5%/.test(lib.fila), JSON.stringify({ cab: lib.cab, fila: lib.fila, f: lib.f }));
ok('C7: la percepción de Buenos Aires figura en su celda con el detalle en el tooltip', lib.fila && /37,5/.test(lib.fila) && /title="IIBB Bs\. As\. /.test(lib.html), lib.html.slice(0, 400));
// tarjeta de percepciones
const st = await p.evaluate(() => { rptRenderStats(rptFiltro()); return document.getElementById('rptStats').innerText.replace(/\s+/g, ' '); });
ok('C8: la tarjeta «Percepciones sufridas» suma 67,51 y desglosa IIBB CABA / Bs. As. / Córdoba', /Percepciones sufridas/.test(st) && /67,51/.test(st) && /IIBB CABA/.test(st) && /IIBB Bs\. As\./.test(st) && /IIBB Córdoba/.test(st), st);
// Excel
const xl = await p.evaluate(() => {
  if (typeof XLSX === 'undefined') return null;
  let cap = null; const orig = XLSX.writeFile; XLSX.writeFile = (wb) => { cap = wb; };
  try { rptExportar('compras'); } finally { XLSX.writeFile = orig; }
  if (!cap) return { err: 'no escribió' };
  const hoja = cap.Sheets[cap.SheetNames[0]]; return XLSX.utils.sheet_to_json(hoja);
});
if (xl && !xl.err) {
  const x2 = xl.find(r => r['Nro Factura'] === 'L-2'), x1 = xl.find(r => r['Nro Factura'] === 'L-1'), x3 = xl.find(r => r['Nro Factura'] === 'L-3'), xo = xl.find(r => r['Nro Factura'] === 'L-OLD');
  ok('C9: el Excel separa percepciones por tipo y no gravado CON centavos (37,5 / 55,5 / 0,01: una percepción chica no desaparece) y el IVA % de varias alícuotas sale como texto', x1 && x1['Perc. IIBB CABA'] === 30 && x2 && x2['Perc. IIBB Bs. As.'] === 37.5 && x2['IVA %'] === '21% / 10,5%' && x3 && x3['No gravado'] === 55.5 && x3['Perc. IIBB otras'] === 0.01 && /Córdoba/.test(x3['Detalle percepciones'] || ''), JSON.stringify([x1, x2, x3]));
  ok('C10: y para una sola alícuota sigue siendo un número (21) como antes', x1 && x1['IVA %'] === 21 && xo && xo['IVA %'] === 21 && xo['Perc. IIBB CABA'] === 0, JSON.stringify([x1 && x1['IVA %'], xo]));
} else ok('C9: Excel disponible', false, JSON.stringify(xl));
// impresión del libro
const imp = await p.evaluate(() => { let html = ''; const wo = window.open; window.open = () => ({ document: { write: h => { html += h; }, close() {} }, focus() {}, print() {}, close() {} }); try { rptImprimir('compras'); } finally { window.open = wo; } return html; });
ok('C11: la impresión del libro trae la columna «Percep. / otros» y las dos alícuotas', /Percep\. \/ otros/.test(imp) && /21% \/ 10,5%/.test(imp), imp.slice(0, 300));

// ═════════ D: base de retención al pagar ═════════
r = await p.evaluate(() => { const g = id => _facRatioNeto(facturas.find(x => x.id === id)); return { b: g('fc_lib2'), old: g('fc_libold'), a: g('fc_lib1') }; });
ok('D1: la base de retención de una factura con detalle es importe − IVA − percepciones (1.240 − 157,50 − 37,50 = 1.045 → 84,27 %)', cerca(r.b, 1045 / 1240, 0.0001) && cerca(r.a, 1000 / 1240, 0.0001) && cerca(r.old, 1000 / 1210, 0.0001), JSON.stringify(r));
await p.evaluate(() => { proveedores.push({ id: 'pv_ret', razonSocial: 'Ferretería Doble IVA SA', ret78: true }); });
const iL2 = await p.evaluate(() => facturas.findIndex(x => x.id === 'fc_lib2'));
await p.evaluate((i) => abrirPagoFD('fact', String(i)), iL2);
await p.waitForTimeout(200);
const baseUI = await num('pagoFDBase');
ok('D2: el modal de pago propone como base 1.045 (no el 1.240 / 1,21 de antes = 1.025)', Math.abs(parseFloat(baseUI) - 1045) <= 1, baseUI);
await p.evaluate(() => { const m = document.getElementById('modalPagoFD'); if (m) m.classList.remove('active'); });

// ═════════ E: nota de crédito (modal propio) ═════════
await p.evaluate(() => abrirNotaCredito('Ferretería Doble IVA SA'));
await p.waitForTimeout(150);
ok('E1: el modal de nota de crédito muestra el panel con la letra A y lo esconde con NC X', await vis('ncImpGrupo') && (await poner('ncLetra', 'X', 'change'), !(await vis('ncImpGrupo'))));
await poner('ncLetra', 'A', 'change');
await poner('ncNumero', '0001-00009999'); await poner('ncImporte', '121');
await p.evaluate(() => { _impPercAgregar('nc', 'iibb_pba'); const i = document.querySelector('#ncImpGrupo .imp-perc input[type=number]'); i.value = '10'; i.dispatchEvent(new Event('input', { bubbles: true })); });
await p.evaluate(() => { const s = document.querySelector('#ncImpGrupo .imp-fila select'); s.value = '10.5'; s.dispatchEvent(new Event('change', { bubbles: true })); });
await p.evaluate(async () => { window.__alerts.length = 0; await guardarNotaCredito(); });
await p.waitForTimeout(400);
const nc = await p.evaluate(() => { const f = facturas.find(x => x.numero === '0001-00009999'); return f ? JSON.parse(JSON.stringify(f)) : null; });
ok('E2: la nota de crédito se guarda con el IVA al 10,5 % (neto 100,45 + IVA 10,55) y la percepción de Bs. As. de 10', nc && nc.esNotaCredito && nc.ivaDetalle && nc.ivaDetalle[0].alic === 10.5 && cerca(nc.ivaDetalle[0].neto + nc.ivaDetalle[0].iva + 10, 121) && nc.percepciones[0].tipo === 'iibb_pba', JSON.stringify(nc));
await p.evaluate((id) => abrirNotaCredito('', id), nc.id);
const ncEd = await p.evaluate(() => ({ alic: _impEst.nc.filas.map(f => f.alic), perc: _impEst.nc.perc.map(x => x.tipo) }));
ok('E3: al editar la nota de crédito vuelven la alícuota y la percepción', JSON.stringify(ncEd.alic) === '[10.5]' && JSON.stringify(ncEd.perc) === '["iibb_pba"]', JSON.stringify(ncEd));
await p.evaluate(() => { _impPercQuitar('nc', 0); });
await p.evaluate(async () => { await guardarNotaCredito(); });
await p.waitForTimeout(400);
const nc2 = await p.evaluate(() => JSON.parse(JSON.stringify(facturas.find(x => x.numero === '0001-00009999'))));
ok('E4: quitar la percepción al editar la nota de crédito la borra', nc2.percepciones === undefined && nc2.ivaDetalle[0].alic === 10.5 && cerca(nc2.ivaDetalle[0].neto + nc2.ivaDetalle[0].iva, 121), JSON.stringify(nc2));

// ═════════ F: lectura con IA ═════════
await p.evaluate(() => { _impIniciar('lf', null); });
await p.evaluate(() => { document.getElementById('leerFactImporte').value = '1240'; _impCargarIA('lf', { importe: 1240, netoGravado: 1000, importeIVA: 157.5, ivaDetalle: [{ alicuota: 21, neto: 500, iva: 105 }, { alicuota: 10.5, neto: 500, iva: 52.5 }], percepciones: [{ tipo: 'IIBB CABA', detalle: 'Perc. IIBB CABA', importe: 82.5 }] }); });
r = await resolver('lf');
const est = await p.evaluate(() => ({ alic: _impEst.lf.filas.map(f => f.alic), perc: _impEst.lf.perc.map(x => x.tipo) }));
ok('F1: la IA devuelve 21 % y 10,5 % con una percepción de CABA: el panel queda con las dos alícuotas y la percepción', est.alic.length === 2 && est.alic.indexOf(21) !== -1 && est.alic.indexOf(10.5) !== -1 && JSON.stringify(est.perc) === '["iibb_caba"]' && cerca(r.iva, 157.5) && cerca(r.neto + r.iva + r.percTot, 1240), JSON.stringify({ est, r }));
await p.evaluate(() => { document.getElementById('leerFactImporte').value = '1105'; _impIniciar('lf', null); _impCargarIA('lf', { importe: 1105, netoGravado: 1000, importeIVA: 105 }); });
r = await resolver('lf');
ok('F2: si la IA sólo trae neto 1.000 e IVA 105 se deduce el 10,5 %', (await p.evaluate(() => _impEst.lf.filas[0].alic)) === 10.5 && cerca(r.iva, 105) && cerca(r.neto, 1000), JSON.stringify(r));
const tp = await p.evaluate(() => ['Percepción IIBB Bs.As.', 'Perc. IIBB CABA', 'AGIP', 'ARBA', 'Percepción de IVA', 'Ingresos Brutos Córdoba', 'Imp. interno'].map(_impTipoPercDeTexto));
ok('F3: los textos de percepción se reconocen (Bs.As. → PBA, CABA/AGIP → CABA, ARBA → PBA, IVA, otras jurisdicciones, otros)', JSON.stringify(tp) === JSON.stringify(['iibb_pba', 'iibb_caba', 'iibb_caba', 'iibb_pba', 'iva', 'iibb_otra', 'otra']), JSON.stringify(tp));
ok('F4: el pedido a la IA incluye ivaDetalle, percepciones, no gravado y exento (lectura de facturas y de notas de crédito)', await p.evaluate(() => /ivaDetalle/.test(_IA_IMP_PROMPT) && /percepciones/.test(_IA_IMP_PROMPT) && /importeNoGravado/.test(_IA_IMP_PROMPT) && /importeExento/.test(_IA_IMP_PROMPT)));
// guardar desde «leer PDF con IA»
await p.evaluate(() => {
  abrirLeerFacturaPDF && abrirLeerFacturaPDF();
});
await p.waitForTimeout(150);
await p.evaluate(() => {
  document.getElementById('leerFactPaso1').style.display = 'none'; document.getElementById('leerFactPaso2').style.display = '';
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
  set('leerFactProv', 'Ferretería Doble IVA SA'); set('leerFactNumero', '0009-00003333'); set('leerFactFecha', '2026-11-12'); set('leerFactImporte', '1240');
  const cl = document.getElementById('leerFactClase'); cl.value = 'fact|A'; lfClaseChange();
  lfInicializarPaso2('Ferretería Doble IVA SA', { importe: 1240, ivaDetalle: [{ alicuota: 21, neto: 500, iva: 105 }, { alicuota: 10.5, neto: 500, iva: 52.5 }], percepciones: [{ tipo: 'IIBB Buenos Aires', importe: 37.5 }] });
});
await p.evaluate(async () => { window.__alerts.length = 0; window.confirmarSiDuplicado = () => true; await confirmarFacturaPDF(); });
await p.waitForTimeout(500);
const lf = await p.evaluate(() => { const f = facturas.find(x => x.numero === '0009-00003333'); return f ? JSON.parse(JSON.stringify(f)) : null; });
ok('F5: «Confirmar» de leer PDF con IA guarda las dos alícuotas y la percepción de Bs. As.', lf && lf.ivaDetalle && lf.ivaDetalle.length === 2 && lf.percepciones && lf.percepciones[0].tipo === 'iibb_pba' && cerca(lf.importeIVA, 157.5), JSON.stringify(lf && [lf.ivaDetalle, lf.percepciones, await p.evaluate(() => window.__alerts)]));

// ═════════ G: listas ═════════
const iR = await p.evaluate(() => { renderFacturas(); const tr = Array.from(document.querySelectorAll('#facturasBody tr')).find(t => /0009-00003333/.test(t.textContent)); return tr ? tr.innerText.replace(/\s+/g, ' ') : null; });
ok('G1: la lista de Facturas muestra «IVA 21 % + 10,5 %» y la percepción bajo el importe', iR && /IVA 21 \+ 10,5 %/.test(iR) && /Perc\. IIBB Bs\. As\./.test(iR), iR);

// ═════════ H: arreglos de la revisión de la v581 ═════════
// H1/H2: una nota de crédito computa según SU letra (no según el toggle que dejó un Comprobante X / VEP / «no computa»)
for (const clase of ['factx|X', 'vep|X']) {
  await p.evaluate(() => agregarFactura());
  await poner('factClase', clase, 'change');
  await poner('factClase', 'nc|A', 'change');
  ok('H1: «' + clase + '» → Nota de Crédito A: el panel de IVA se ve (antes quedaba escondido y la NC se guardaba sin detalle)', await vis('factImpGrupo'));
  await p.evaluate(() => cerrarFactura());
}
await p.evaluate(() => agregarFactura());
await p.evaluate(() => selFactComputaARCA(false));
await poner('factClase', 'nc|A', 'change');
ok('H2: con «no computa ARCA» elegido antes, la NC A igual muestra el panel', await vis('factImpGrupo'));
await poner('factClase', 'ncx|X', 'change');
ok('H3: y la NC X (no oficial) lo esconde', !(await vis('factImpGrupo')));
await p.evaluate(() => cerrarFactura());
// guardar la NC A después de X
await p.evaluate(() => agregarFactura());
await poner('factClase', 'factx|X', 'change'); await poner('factClase', 'nc|A', 'change');
await poner('factProveedor', 'Ferretería Doble IVA SA'); await poner('factImporte', '121'); await poner('factNumero', '0001-00007777');
await p.evaluate(async () => { document.getElementById('formFact').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); });
await p.waitForTimeout(400);
r = await p.evaluate(() => { const f = facturas.find(x => x.numero === '0001-00007777'); return f ? JSON.parse(JSON.stringify(f)) : null; });
ok('H4: esa NC A se guarda con su IVA discriminado (neto 100 + IVA 21), no estimada', r && r.esNotaCredito && r.ivaDetalle && cerca(r.ivaDetalle[0].neto, 100) && cerca(r.ivaDetalle[0].iva, 21), JSON.stringify(r));

// H5: NC sobre una factura al 10,5 % propone el 10,5 % (si el panel no se tocó)
await p.evaluate(() => { facturas.push({ id: 'fc_105', proveedor: 'Ferretería Doble IVA SA', numero: '0003-00000105', fecha: '2026-11-05', moneda: 'ARS', importe: 1105, netoGravado: 1000, importeIVA: 105, ivaDetalle: [{ alic: 10.5, neto: 1000, iva: 105 }], tipoComprobante: 'A', computaARCA: true, pagado: 0, estado: 'pendiente', tipo: 'directo', pagosHistorial: [] }); return persistirFacturas(); });
await p.waitForTimeout(250);
await p.evaluate(() => agregarFactura());
await poner('factClase', 'nc|A', 'change');
await poner('factProveedor', 'Ferretería Doble IVA SA');
await p.evaluate(() => { _factPoblarNCFacturas(); const s = document.getElementById('factNCFactura'); s.value = 'fact:fc_105'; s.dispatchEvent(new Event('change', { bubbles: true })); });
ok('H5: al elegir la factura al 10,5 % que anula, la NC propone 10,5 % (no 21 %)', (await p.evaluate(() => _impEst.fact.filas[0].alic)) === 10.5);
await p.evaluate(() => cerrarFactura());
await p.evaluate(() => abrirNotaCredito('Ferretería Doble IVA SA'));
await p.evaluate(() => { const s = document.getElementById('ncFactura'); s.value = 'fact:fc_105'; s.dispatchEvent(new Event('change', { bubbles: true })); });
ok('H6: lo mismo en el modal de nota de crédito', (await p.evaluate(() => _impEst.nc.filas[0].alic)) === 10.5);
await p.evaluate(() => cerrarNotaCredito());

// H7: la IA trae neto + IVA pero el total tiene algo más (una percepción que no leyó): no se la traga el neto
await p.evaluate(() => { _impIniciar('lf', null); document.getElementById('leerFactImporte').value = '1240'; _impCargarIA('lf', { importe: 1240, netoGravado: 1000, importeIVA: 210 }); });
r = await resolver('lf');
let aviso = await p.evaluate(() => ({ perc: _impEst.lf.perc, aviso: _impEst.lf.aviso, base: _impBaseRet('lf') }));
ok('H7: neto 1.000 + IVA 210 sobre un total de 1.240 → la diferencia de 30 queda como «Otro tributo · Sin identificar», el neto sigue en 1.000 y hay un aviso', cerca(r.neto, 1000) && cerca(r.iva, 210) && cerca(r.percTot, 30) && aviso.perc.length === 1 && aviso.perc[0].tipo === 'otra' && /Sin identificar/.test(aviso.perc[0].desc) && /diferencia/.test(aviso.aviso) && cerca(aviso.base, 1000), JSON.stringify({ r, aviso }));
await p.evaluate(() => { _impIniciar('lf', null); document.getElementById('leerFactImporte').value = '1210'; _impCargarIA('lf', { importe: 1210, ivaDetalle: [{ alicuota: 21, neto: 1000, iva: null }] }); });
r = await resolver('lf');
ok('H8: una entrada de la IA sin «iva» calcula el IVA (210), no lo fija en 0', cerca(r.iva, 210) && (await p.evaluate(() => _impEst.lf.filas[0].iva)) === null, JSON.stringify(r));
await p.evaluate(() => { _impIniciar('lf', null); document.getElementById('leerFactImporte').value = '1000'; _impCargarIA('lf', { importe: 1000, netoGravado: 900, importeIVA: 100, importeNoGravado: -50, percepciones: [{ tipo: 'IIBB CABA', importe: -20 }] }); });
aviso = await p.evaluate(() => ({ ng: _impEst.lf.ng, perc: _impEst.lf.perc.map(x => x.monto) }));
ok('H9: importes negativos que devuelva la IA se descartan (no sin IVA −50 ni percepción −20)', aviso.ng === 0 && aviso.perc.every(m => m >= 0), JSON.stringify(aviso));

// H10: negativos tipeados: se frenan en 0 y la cuenta coincide con lo guardado
await p.evaluate(() => agregarFactura());
await poner('factProveedor', 'Ferretería Doble IVA SA'); await poner('factImporte', '1210');
await p.evaluate(() => { _impPercAgregar('fact', 'iibb_caba'); _impVerNGEX('fact'); });
await p.evaluate(() => { const i = document.querySelector('#factImpGrupo .imp-perc input[type=number]'); i.value = '-30'; i.dispatchEvent(new Event('input', { bubbles: true })); const n = document.querySelector('#factImpGrupo .imp-ngex input'); n.value = '-10'; n.dispatchEvent(new Event('input', { bubbles: true })); });
r = await resolver('fact');
const impL = await p.evaluate(() => _impLeer('fact'));
ok('H10: una percepción de −30 y un no gravado de −10 cuentan como 0: la cuenta (neto 1.000 + IVA 210) y lo que se guardaría coinciden', cerca(r.neto, 1000) && cerca(r.iva, 210) && r.percTot === 0 && impL && !impL.error && !impL.percepciones.length && !impL.netoNoGravado && cerca(impL.netoGravado, 1000), JSON.stringify({ r, impL }));

// H11/H12: el IVA tipeado a mano se suelta al cambiar la alícuota o el importe
await poner('factImpI0', '210.01');
ok('H11a: (control) el IVA a mano queda fijo', cerca((await resolver('fact')).iva, 210.01));
await p.evaluate(() => { const s = document.querySelector('#factImpGrupo .imp-fila select'); s.value = '10.5'; s.dispatchEvent(new Event('change', { bubbles: true })); });
r = await resolver('fact');
ok('H11: al cambiar la alícuota a 10,5 % el IVA a mano se suelta (105, no 210,01) y el neto sigue en 1.000 (el IVA nunca lo mueve)', cerca(r.iva, 105, 0.001) && cerca(r.neto, 1000, 0.001), JSON.stringify(r));
await poner('factImpI0', '115');
await poner('factImporte', '2210');
r = await resolver('fact');
ok('H12: al cambiar el importe también (2.210 al 10,5 % → neto 2.000 + IVA 210; no el 115 de antes)', cerca(r.iva, 210) && cerca(r.neto, 2000), JSON.stringify(r));
await p.evaluate(() => cerrarFactura());

// H13: comprobante ANTERIOR: si se le cambia el importe, el desglose que muestra el panel es el que se guarda
await p.evaluate(() => { facturas.push({ id: 'fc_old3', proveedor: 'Ferretería Doble IVA SA', numero: '0001-00000003', fecha: '2026-11-04', moneda: 'ARS', importe: 1105, netoGravado: 1000, tipoComprobante: 'A', computaARCA: true, pagado: 0, estado: 'pendiente', tipo: 'directo', pagosHistorial: [] }); return persistirFacturas(); });
await p.waitForTimeout(250);
const iO3 = await p.evaluate(() => facturas.findIndex(x => x.id === 'fc_old3'));
await p.evaluate((i) => editarFactura(i), iO3);
await poner('factImporte', '2210');
ok('H13: cambiar el importe de un comprobante anterior lo marca como tocado (el panel ya muestra un desglose nuevo)', (await p.evaluate(() => _impEst.fact.tocado)) === true);
await p.evaluate(() => { document.getElementById('formFact').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); });
await p.waitForTimeout(400);
r = await p.evaluate(() => JSON.parse(JSON.stringify(facturas.find(x => x.id === 'fc_old3'))));
ok('H14: y se guarda coherente (2.210 al 10,5 %: neto 2.000 + IVA 210; netoGravado ya no queda en 1.000)', r.importe === 2210 && r.ivaDetalle && cerca(r.ivaDetalle[0].neto, 2000) && cerca(r.ivaDetalle[0].iva, 210) && cerca(r.netoGravado, 2000), JSON.stringify(r));

// H15: Gmail: la letra, la clase y «¿computa ARCA?» salen de ESTA factura, y la IA pide el IVA por alícuota
await p.evaluate(() => { window._geminiProxy = async () => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ proveedor: 'Ferretería Doble IVA SA', tipoComprobante: 'C', receptor: 'Constructora Los Álamos S.A.', numero: '0005-00000009', fecha: '2026-11-12', importe: 500, moneda: 'ARS', netoGravado: 500, importeIVA: 0 }) }] } }] }) }); abrirLeerFacturaPDF(); window._leerFactArchivoDB64 = 'AAAA'; window._leerFactArchivoTipo = 'application/pdf'; });
await p.evaluate(async () => { document.getElementById('leerFactClase').value = 'nc|A'; lfClaseChange(); await procesarFacturaPDFDesdeBase64(); });
await p.waitForTimeout(300);
const gm = await p.evaluate(() => ({ clase: document.getElementById('leerFactClase').value, computa: document.getElementById('leerFactComputaARCA').value, alic: _impEst.lf.filas[0].alic, vis: document.getElementById('lfImpGrupo').style.display !== 'none' }));
ok('H15: importar desde Gmail una Factura C: la clase pasa a «fact|C» (no hereda la NC A anterior), computa ARCA y el panel propone 0 %', gm.clase === 'fact|C' && gm.computa === 'true' && gm.alic === 0 && gm.vis, JSON.stringify(gm));
// El Asistente RK está reemplazado en la demo (demo-post.js: contesta un aviso fijo), así que su pedido se lee del código fuente del sitio, no de la función en memoria.
const _srcIndex = (await import('fs')).readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
ok('H16: el pedido de Gmail (_IA_IMP_PROMPT) y el del Asistente RK (extractPayload de rkAgenteEnviar) piden ivaDetalle y percepciones', await p.evaluate(() => { const g = String(procesarFacturaPDFDesdeBase64); return /_IA_IMP_PROMPT/.test(g) && /ivaDetalle/.test(_IA_IMP_PROMPT) && /percepciones/.test(_IA_IMP_PROMPT); }) && /"tipo":"factura"[^\n]*"ivaDetalle"[^\n]*"importeNoGravado"[^\n]*"importeExento"[^\n]*"percepciones"/.test(_srcIndex));
await p.evaluate(() => cerrarLeerFactPDF && cerrarLeerFactPDF());

// H17: pantalla angosta: cada campo con su rótulo, y «Exento» / «Importe» con ancho útil
await p.evaluate(() => agregarFactura());
await poner('factProveedor', 'Ferretería Doble IVA SA'); await poner('factImporte', '1210');
await p.evaluate(() => { _impVerNGEX('fact'); _impPercAgregar('fact', 'iibb_caba'); });
await p.setViewportSize({ width: 390, height: 800 });
await p.waitForTimeout(200);
const mv = await p.evaluate(() => {
  const w = (sel) => { const e = document.querySelector(sel); return e ? Math.round(e.getBoundingClientRect().width) : null; };
  const lbl = Array.from(document.querySelectorAll('#factImpGrupo .imp-cl')).filter(e => getComputedStyle(e).display !== 'none').map(e => e.textContent);
  return { exento: w('#factImpGrupo .imp-ngex label:nth-of-type(2) input'), ng: w('#factImpGrupo .imp-ngex label:nth-of-type(1) input'), perc: w('#factImpGrupo .imp-perc input[type=number]'), lbl, scroll: document.documentElement.scrollWidth <= window.innerWidth + 1 };
});
ok('H17: a 390 px «No gravado», «Exento» y el importe de la percepción miden más de 100 px (antes «Exento» quedaba en 34) y todos tienen rótulo', mv.exento > 100 && mv.ng > 100 && mv.perc > 100 && ['Neto gravado', 'IVA', 'No gravado', 'Exento', 'Importe'].every(t => mv.lbl.indexOf(t) !== -1), JSON.stringify(mv));
await p.setViewportSize({ width: 1400, height: 900 });
await p.evaluate(() => cerrarFactura());

console.log(res.map(x => x.join(' · ')).join('\n'));
const mal = res.filter(x => x[0] === 'FALLA').length;
console.log(`\n${res.length - mal}/${res.length} OK`);
if (errores.length) console.log('errores de JS:', errores.slice(0, 5));
await b.close();
process.exit(mal || errores.length ? 1 : 0);
