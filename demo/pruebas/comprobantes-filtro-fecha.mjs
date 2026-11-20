// Comprobantes recibidos (v592): filtro por FECHA (Desde / Hasta) en «Comprobantes recibidos» (panelDocumentos) y en «Facturas de proveedores».
// Corre contra la demo (base en memoria). Uso: node comprobantes-filtro-fecha.mjs   (ver README: hace falta bajar-cdn.sh antes)
import { abrirDemo, entrarAlSistema } from './demo-lib.mjs';
const { b, p, errores } = await abrirDemo();
const res = [];
const ok = (n, c, x) => res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]);
process.on('uncaughtException', (e) => { res.forEach(x => console.log(x.join(' · '))); console.log('\nCORTADA: ' + e.message); process.exit(1); });
await entrarAlSistema(p);
await p.evaluate(() => { window.alert = () => {}; window.confirm = () => true; });
const poner = (id, v) => p.evaluate(({ id, v }) => { const el = document.getElementById(id); if (!el) return; el.value = v; el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); if (el.type === 'date') el.dispatchEvent(new Event('change', { bubbles: true })); }, { id, v });
const vis = (id) => p.evaluate((id) => { const e = document.getElementById(id); return !!e && e.style.display !== 'none' && e.offsetParent !== null; }, id);
// proveedores (columna 2) de las filas que están en pantalla; todo lo mío lleva «ZZF» para aislarlo de los datos de ejemplo
const provs = (body) => p.evaluate((body) => Array.from(document.querySelectorAll('#' + body + ' tr')).map(tr => (tr.children[1] || {}).textContent || '').filter(t => /ZZF/.test(t)).map(t => (t.match(/ZZF-\w+/) || [''])[0]).sort(), body);
const cuerpo = (body) => p.evaluate((body) => document.getElementById(body).textContent.replace(/\s+/g, ' ').trim(), body);
const names = (body) => p.evaluate((body) => Array.from(document.querySelectorAll('#' + body + ' tr')).map(tr => (tr.children[1] || {}).textContent || '').map(t => (t.match(/ZZ[FGH]-\w+/) || [''])[0]).filter(Boolean).sort(), body);
const namesDOM = (body) => p.evaluate((body) => Array.from(document.querySelectorAll('#' + body + ' tr')).map(tr => (tr.children[1] || {}).textContent || '').map(t => (t.match(/ZZ[FGH]-\w+/) || [''])[0]).filter(Boolean), body);
const aviso = (id) => p.evaluate((id) => { const e = document.getElementById(id); return (e && e.style.display !== 'none') ? e.textContent.replace(/\s+/g, ' ').trim() : ''; }, id);
const pie = () => p.evaluate(() => document.getElementById('documentosFoot').textContent.replace(/\s+/g, ' ').trim());

// ── datos: una de cada fuente, alrededor de octubre de 2026 ──
await p.evaluate(() => {
  const base = { moneda: 'ARS', pagado: 0, estado: 'pendiente' };
  documentos.push(Object.assign({ id: 'zzf_d1', proveedor: 'ZZF-DocSep30', descripcion: 'x', numero: '1', fecha: '2026-09-30', importe: 100, modalidad: 'B' }, base));
  documentos.push(Object.assign({ id: 'zzf_d2', proveedor: 'ZZF-DocOct01', descripcion: 'x', numero: '2', fecha: '2026-10-01', importe: 200, modalidad: 'B' }, base));
  documentos.push(Object.assign({ id: 'zzf_d3', proveedor: 'ZZF-DocOct15', descripcion: 'x', numero: '3', fecha: '2026-10-15', importe: 300, modalidad: 'B' }, base));
  documentos.push(Object.assign({ id: 'zzf_d4', proveedor: 'ZZF-DocOct31', descripcion: 'x', numero: '4', fecha: '2026-10-31', importe: 400, modalidad: 'B' }, base));
  documentos.push(Object.assign({ id: 'zzf_d5', proveedor: 'ZZF-DocNov01', descripcion: 'x', numero: '5', fecha: '2026-11-01', importe: 500, modalidad: 'B' }, base));
  documentos.push(Object.assign({ id: 'zzf_d6', proveedor: 'ZZF-DocSinFecha', descripcion: 'x', numero: '6', fecha: '', importe: 600, modalidad: 'B' }, base));
  facturas.push(Object.assign({ id: 'zzf_f1', proveedor: 'ZZF-FacSep', numero: '0001-00000001', fecha: '2026-09-15', importe: 1000, tipoComprobante: 'A', computaARCA: true, cae: '12345678901234' }, base));
  facturas.push(Object.assign({ id: 'zzf_f2', proveedor: 'ZZF-FacOct', numero: '0001-00000002', fecha: '2026-10-20', importe: 2000, tipoComprobante: 'A', computaARCA: true, cae: '12345678901235' }, base));
  facturas.push(Object.assign({ id: 'zzf_f3', proveedor: 'ZZF-FacXOct', numero: '0001-00000003', fecha: '2026-10-05', importe: 3000, tipoComprobante: 'X', computaARCA: false }, base));
  compRecibidos.push({ fecha: '2026-10-10', tipo: 'Factura A', ptoVta: '9', numero: '9-1', cuit: '30-1', proveedor: 'ZZF-ArcaIso', total: 4000 });
  compRecibidos.push({ fecha: '12/10/2026', tipo: 'Factura A', ptoVta: '9', numero: '9-2', cuit: '30-2', proveedor: 'ZZF-ArcaDMA', total: 5000 });
  compRecibidos.push({ fecha: '12/11/2026', tipo: 'Factura A', ptoVta: '9', numero: '9-3', cuit: '30-3', proveedor: 'ZZF-ArcaNov', total: 6000 });
  comprobantesEmitidos.push({ id: 'zzf_e1', movTipo: 'egreso', proveedorNombre: 'ZZF-EmitOct', nro: 'X-1', fecha: '2026-10-22', total: 7000, concepto: 'x', tipoAB: 'B' });
  comprobantesEmitidos.push({ id: 'zzf_e2', movTipo: 'egreso', proveedorNombre: 'ZZF-EmitSep', nro: 'X-2', fecha: '2026-09-22', total: 8000, concepto: 'x', tipoAB: 'B' });
  mostrarTab('Documentos');
});
await p.waitForTimeout(250);
await poner('buscadorDoc', 'zzf-');
const TODOS = ['ZZF-ArcaDMA', 'ZZF-ArcaIso', 'ZZF-ArcaNov', 'ZZF-DocNov01', 'ZZF-DocOct01', 'ZZF-DocOct15', 'ZZF-DocOct31', 'ZZF-DocSep30', 'ZZF-DocSinFecha', 'ZZF-EmitOct', 'ZZF-EmitSep', 'ZZF-FacOct', 'ZZF-FacSep', 'ZZF-FacXOct'];
const eq = (a, b2) => JSON.stringify(a) === JSON.stringify(b2);

ok('A1: la pantalla tiene los campos «Fecha desde» y «hasta»', await p.evaluate(() => !!document.getElementById('docFiltroDesde') && !!document.getElementById('docFiltroHasta')));
ok('A2: sin filtro de fechas se ven los 14 comprobantes de prueba (todas las fuentes)', eq(await provs('documentosBody'), TODOS), JSON.stringify(await provs('documentosBody')));

// ── rango cerrado: octubre ──
await poner('docFiltroDesde', '2026-10-01');
await poner('docFiltroHasta', '2026-10-31');
const oct = await provs('documentosBody');
ok('B1: del 1/10 al 31/10 quedan los de octubre —con los dos extremos incluidos— y no los de septiembre ni noviembre', eq(oct, ['ZZF-ArcaDMA', 'ZZF-ArcaIso', 'ZZF-DocOct01', 'ZZF-DocOct15', 'ZZF-DocOct31', 'ZZF-EmitOct', 'ZZF-FacOct', 'ZZF-FacXOct']), JSON.stringify(oct));
ok('B2: un comprobante importado de ARCA con la fecha en dd/mm/aaaa (12/10/2026) también entra', oct.indexOf('ZZF-ArcaDMA') !== -1 && oct.indexOf('ZZF-ArcaNov') === -1);
ok('B3: los facturas y comprobantes X de proveedores (facturas), y los X emitidos como egreso, se filtran igual', oct.indexOf('ZZF-FacOct') !== -1 && oct.indexOf('ZZF-FacSep') === -1 && oct.indexOf('ZZF-FacXOct') !== -1 && oct.indexOf('ZZF-EmitOct') !== -1 && oct.indexOf('ZZF-EmitSep') === -1);
ok('B4: el comprobante sin fecha no entra mientras el filtro de fechas está puesto', oct.indexOf('ZZF-DocSinFecha') === -1);
const f1 = await pie();
ok('B5: el pie dice cuántos son y el período («8 comprobantes · del 1/10/2026 al 31/10/2026») y el importe suma sólo esos (200+300+400+2000+3000+4000+5000+7000 = 21.900)', /TOTAL \(8 comprobantes · del 1\/10\/2026 al 31\/10\/2026\)/.test(f1) && /21\.900,00/.test(f1), f1);
const av1 = await aviso('docFechaAviso');
ok('B6: bajo los filtros avisa que 1 comprobante sin fecha legible no entra (y el aviso ya no va en el pie)', /^ℹ️ 1 comprobante sin fecha legible no entra en el filtro de fechas\.$/.test(av1) && !/sin fecha/.test(f1), JSON.stringify([av1, f1]));
ok('B7: aparece el botón «Limpiar filtros»', await vis('btnDocLimpiarFiltros'));

// ── un solo extremo ──
await poner('docFiltroHasta', '');
const desde = await provs('documentosBody');
ok('C1: sólo «desde» 1/10: todo lo de octubre en adelante (incluye noviembre)', eq(desde, ['ZZF-ArcaDMA', 'ZZF-ArcaIso', 'ZZF-ArcaNov', 'ZZF-DocNov01', 'ZZF-DocOct01', 'ZZF-DocOct15', 'ZZF-DocOct31', 'ZZF-EmitOct', 'ZZF-FacOct', 'ZZF-FacXOct']), JSON.stringify(desde));
ok('C2: el pie dice «desde el 1/10/2026»', /desde el 1\/10\/2026/.test(await pie()), await pie());
await poner('docFiltroDesde', '');
await poner('docFiltroHasta', '2026-09-30');
const hasta = await provs('documentosBody');
ok('C3: sólo «hasta» 30/9: lo de septiembre y antes (el 30/9 inclusive)', eq(hasta, ['ZZF-DocSep30', 'ZZF-EmitSep', 'ZZF-FacSep']), JSON.stringify(hasta));
ok('C4: el pie dice «hasta el 30/9/2026»', /hasta el 30\/9\/2026/.test(await pie()), await pie());

// ── un solo día ──
await poner('docFiltroDesde', '2026-10-15'); await poner('docFiltroHasta', '2026-10-15');
ok('C5: un solo día (15/10 a 15/10) deja ese comprobante', eq(await provs('documentosBody'), ['ZZF-DocOct15']), JSON.stringify(await provs('documentosBody')));

// ── combinado con los otros filtros ──
await poner('docFiltroDesde', '2026-10-01'); await poner('docFiltroHasta', '2026-10-31');
await poner('filtroDocOrigen', 'arca');
const arca = await provs('documentosBody');
ok('D1: con «Facturas ARCA» + octubre quedan sólo las oficiales de octubre (factura con CAE e importados de ARCA)', eq(arca, ['ZZF-ArcaDMA', 'ZZF-ArcaIso', 'ZZF-FacOct']), JSON.stringify(arca));
await poner('filtroDocOrigen', '');
await poner('buscadorDoc', 'zzf-doc');
ok('D2: la búsqueda por texto sigue funcionando junto con las fechas', eq(await provs('documentosBody'), ['ZZF-DocOct01', 'ZZF-DocOct15', 'ZZF-DocOct31']), JSON.stringify(await provs('documentosBody')));
await poner('filtroDocEstado', 'pagado');
ok('D3: y con el estado «Pagado» no queda ninguno (todos están pendientes) y el cartel lo dice', /No hay comprobantes que coincidan con los filtros \(fecha del 1\/10\/2026 al 31\/10\/2026\)/.test(await cuerpo('documentosBody')), await cuerpo('documentosBody'));
await poner('filtroDocEstado', '');

// ── rango imposible ──
await poner('buscadorDoc', 'zzf-');
await poner('docFiltroDesde', '2026-10-31'); await poner('docFiltroHasta', '2026-10-01');
ok('E1: «desde» posterior a «hasta» avisa en vez de mostrar una lista vacía sin explicación', /es posterior a «Hasta»/.test(await cuerpo('documentosBody')), await cuerpo('documentosBody'));

// ── limpiar ──
await poner('buscadorDoc', 'zzf-'); await poner('filtroDocOrigen', 'arca'); await poner('filtroDocEstado', 'pagado'); await poner('docFiltroDesde', '2026-10-01'); await poner('docFiltroHasta', '2026-10-31');
ok('F0: antes de limpiar están puestos los cinco filtros', await p.evaluate(() => ['docFiltroDesde', 'docFiltroHasta', 'buscadorDoc', 'filtroDocOrigen', 'filtroDocEstado'].every(id => document.getElementById(id).value !== '')));
await p.evaluate(() => docLimpiarFiltros());
ok('F1: «Limpiar filtros» vacía fechas, búsqueda, origen y estado', await p.evaluate(() => ['docFiltroDesde', 'docFiltroHasta', 'buscadorDoc', 'filtroDocOrigen', 'filtroDocEstado'].every(id => document.getElementById(id).value === '')));
ok('F2: y el botón se vuelve a esconder', !(await vis('btnDocLimpiarFiltros')));
await poner('docFiltroHasta', '2026-10-31');
ok('F5: con SÓLO una fecha puesta (sin búsqueda, origen ni estado) el botón «Limpiar filtros» aparece', await vis('btnDocLimpiarFiltros') && (await p.evaluate(() => document.getElementById('buscadorDoc').value + document.getElementById('filtroDocOrigen').value + document.getElementById('filtroDocEstado').value)) === '');
await p.evaluate(() => docLimpiarFiltros());
await poner('buscadorDoc', 'zzf-');
ok('F3: sin filtro de fechas vuelve a verse todo (incluido el comprobante sin fecha)', eq(await provs('documentosBody'), TODOS), JSON.stringify(await provs('documentosBody')));
ok('F4: sin filtro de fechas el pie no menciona período y el aviso de «sin fecha» desaparece', !/·\s*(del|desde|hasta)/.test(await pie()) && (await aviso('docFechaAviso')) === '', await pie());

// ── el filtro se puede escribir con el teclado (escritura real en el campo de fecha) ──
await p.fill('#docFiltroDesde', '2026-10-01');   // como un clic y tipeo real: dispara input y change
await p.waitForTimeout(150);
ok('G1: escribiendo la fecha en el campo (fill de Playwright) el filtro se aplica', (await p.evaluate(() => document.getElementById('docFiltroDesde').value)) === '2026-10-01' && !(await provs('documentosBody')).includes('ZZF-DocSep30'), await p.evaluate(() => document.getElementById('docFiltroDesde').value));
await p.evaluate(() => docLimpiarFiltros());

// ── helper de fechas ──
const h = await p.evaluate(() => ({ a: _docFechaISO('2026-10-05'), b: _docFechaISO('5/10/2026'), c: _docFechaISO('05-10-2026'), d: _docFechaISO('2026-10-05T10:00:00'), e: _docFechaISO(''), f: _docFechaISO(null), g: _docFechaISO('basura'), h: _docFechaISO('2026-1-5') }));
const hv = await p.evaluate(() => ['31/02/2026', '2026-02-31', '2026-13-45', '2026-10-155', '2026-10-1x', '10/15/2026', '29/02/2027', '0050-01-01', '15/10/26', '2026/10/15', '29/02/2028', '15.10.2026 08:00', '2026-10-05T23:30:00-03:00'].map(x => _docFechaISO(x)));
ok('H2: _docFechaISO rechaza lo que no es una fecha real (31/02, mes 13, sobrante pegado, m/d/aaaa, 29/02 de año no bisiesto) y lee dd/mm/aa y aaaa/mm/dd', JSON.stringify(hv) === JSON.stringify(['', '', '', '', '', '', '', '', '2026-10-15', '2026-10-15', '2028-02-29', '2026-10-15', '2026-10-05']), JSON.stringify(hv));
ok('H1: _docFechaISO lee AAAA-MM-DD, d/m/aaaa, dd-mm-aaaa y con hora, y devuelve vacío si no entiende', h.a === '2026-10-05' && h.b === '2026-10-05' && h.c === '2026-10-05' && h.d === '2026-10-05' && h.e === '' && h.f === '' && h.g === '' && h.h === '2026-01-05', JSON.stringify(h));

// ═════════ Facturas de proveedores (la otra lista de lo recibido) ═════════
await p.evaluate(() => mostrarTab('Facturas'));
await p.waitForTimeout(200);
await poner('buscadorFact', 'zzf-');
await poner('filtroFactEstado', 'pendiente');
await poner('factFiltroDesde', '2026-10-01');
await p.evaluate(() => factLimpiarFiltros());
await poner('buscadorFact', 'zzf-');
const FT = ['ZZF-FacOct', 'ZZF-FacSep', 'ZZF-FacXOct'];
ok('I1: Facturas tiene los campos de fecha y sin filtro muestra las tres', await p.evaluate(() => !!document.getElementById('factFiltroDesde') && !!document.getElementById('factFiltroHasta')) && eq(await provs('facturasBody'), FT), JSON.stringify(await provs('facturasBody')));
await poner('factFiltroDesde', '2026-10-01'); await poner('factFiltroHasta', '2026-10-31');
ok('I2: en Facturas, del 1/10 al 31/10 quedan las de octubre', eq(await provs('facturasBody'), ['ZZF-FacOct', 'ZZF-FacXOct']), JSON.stringify(await provs('facturasBody')));
ok('I3: y aparece «Limpiar filtros»', await vis('btnFactLimpiarFiltros'));
await poner('factFiltroDesde', '2026-12-01'); await poner('factFiltroHasta', '');
ok('I4: sin coincidencias, el cartel nombra el filtro de fecha', /No hay facturas que coincidan con los filtros \(fecha desde el 1\/12\/2026\)/.test(await cuerpo('facturasBody')), await cuerpo('facturasBody'));
await poner('factFiltroDesde', '2026-10-31'); await poner('factFiltroHasta', '2026-10-01');
ok('I5: «desde» posterior a «hasta» avisa', /es posterior a «Hasta»/.test(await cuerpo('facturasBody')), await cuerpo('facturasBody'));
await p.evaluate(() => factLimpiarFiltros());
const i6boton = !(await vis('btnFactLimpiarFiltros'));
await poner('buscadorFact', 'zzf-');
ok('I6: «Limpiar filtros» esconde el botón y, sin filtro de fechas, vuelven las tres', i6boton && eq(await provs('facturasBody'), FT), JSON.stringify([i6boton, await provs('facturasBody')]));
await p.evaluate(() => factLimpiarFiltros());
await poner('factFiltroDesde', '2026-10-01');
ok('I7: en Facturas, con SÓLO una fecha puesta el botón «Limpiar filtros» aparece y estado y búsqueda están vacíos', await vis('btnFactLimpiarFiltros') && (await p.evaluate(() => document.getElementById('buscadorFact').value + document.getElementById('filtroFactEstado').value)) === '');
await p.evaluate(() => factLimpiarFiltros());

// ═════════ el uso que se hace desde el menú: «Comprobantes recibidos → ARCA» ═════════
await p.evaluate(() => { mostrarTab('Documentos'); docLimpiarFiltros(); _verDocsProv('arca'); });
await poner('buscadorDoc', 'zzf-');
await poner('docFiltroDesde', '2026-10-01'); await poner('docFiltroHasta', '2026-10-31');
const menu = await p.evaluate(() => document.getElementById('filtroDocOrigen').value);
const menuFilas = await provs('documentosBody');
ok('J1: venir por «Comprobantes recibidos → Facturas ARCA» deja el origen en ARCA y el filtro de fechas convive con él: quedan sólo las oficiales de octubre', menu === 'arca' && eq(menuFilas, ['ZZF-ArcaDMA', 'ZZF-ArcaIso', 'ZZF-FacOct']), JSON.stringify([menu, menuFilas]));
await p.evaluate(() => docLimpiarFiltros());

// ═════════ v593: retoques de la revisión independiente de la v592 ═════════
// Todo lo nuevo lleva «v593» en el proveedor (para buscarlo junto) y ZZG- (fecha legible) o ZZH- (fecha NO legible) para aislarlo del resto.
await p.evaluate(() => {
  const base = { moneda: 'ARS', pagado: 0, estado: 'pendiente' };
  const fac = (id, prov, num, fecha, extra) => Object.assign({ id, proveedor: prov + ' v593', numero: num, fecha, importe: 1000, tipoComprobante: 'A', computaARCA: true, cae: '99999999999' + num.slice(-3) }, base, extra || {});
  facturas.push(fac('zzg_f1', 'ZZG-FacOct01', '0007-00000001', '2026-10-01'));
  facturas.push(fac('zzg_f2', 'ZZG-FacOct31', '0007-00000002', '2026-10-31'));
  facturas.push(fac('zzg_f3', 'ZZG-FacNov05', '0007-00000003', '2026-11-05'));
  facturas.push(fac('zzg_nc', 'ZZG-NCOct', '0007-00000004', '2026-10-18', { esNotaCredito: true, importe: 100 }));
  facturas.push(fac('zzh_f1', 'ZZH-FacSinFecha', '0007-00000005', ''));
  documentos.push(Object.assign({ id: 'zzg_d1', proveedor: 'ZZG-DocPag v593', descripcion: 'x', numero: '70', fecha: '2026-10-12', importe: 1000, modalidad: 'B' }, base, { pagado: 150, estado: 'parcial' }));
  documentos.push(Object.assign({ id: 'zzg_d2', proveedor: 'ZZG-DocPagFuera v593', descripcion: 'x', numero: '71', fecha: '2026-09-12', importe: 1000, modalidad: 'B' }, base, { pagado: 70, estado: 'parcial' }));
  const ar = (prov, num, fecha, extra) => Object.assign({ fecha, tipo: 'Factura A', ptoVta: '8', numero: '8-' + num, cuit: '30-9' + num, proveedor: prov + ' v593', total: 100 }, extra || {});
  compRecibidos.push(ar('ZZG-ArcaAA', 1, '15/10/26'));              // año de 2 dígitos
  compRecibidos.push(ar('ZZG-ArcaYMD', 2, '2026/10/20'));           // año primero con barras
  compRecibidos.push(ar('ZZG-ArcaNC', 3, '25/10/2026', { tipo: '3 - Nota de Crédito A', total: 700 }));
  compRecibidos.push(ar('ZZH-ArcaImposible', 4, '31/02/2026'));     // no existe
  compRecibidos.push(ar('ZZH-ArcaMDY', 5, '10/15/2026'));           // mes/día/año: día 10, mes 15
  comprobantesEmitidos.push({ id: 'zzg_e1', movTipo: 'egreso', proveedorNombre: 'ZZG-EmitDMA v593', nro: 'X-9', fecha: '5/10/2026', total: 50, concepto: 'x', tipoAB: 'B' });
  mostrarTab('Documentos');
});
await p.evaluate(() => docLimpiarFiltros());
await poner('buscadorDoc', 'v593');

// ── orden de la lista con fechas dd/mm/aaaa, dd/mm/aa y aaaa/mm/dd (se lee en el orden del DOM, sin ordenar) ──
const orden = await namesDOM('documentosBody');
const ordenEsperado = ['ZZG-FacNov05', 'ZZG-FacOct31', 'ZZG-ArcaNC', 'ZZG-ArcaYMD', 'ZZG-NCOct', 'ZZG-ArcaAA', 'ZZG-DocPag', 'ZZG-EmitDMA', 'ZZG-FacOct01', 'ZZG-DocPagFuera'];
ok('N1: la lista ordena por la fecha ya normalizada (los importados con dd/mm/aaaa, dd/mm/aa y aaaa/mm/dd y el emitido con d/m/aaaa quedan en su lugar)', JSON.stringify(orden.filter(x => /^ZZG/.test(x))) === JSON.stringify(ordenEsperado), JSON.stringify(orden));

// ── fechas que no se pueden leer: cuentan como «sin fecha legible» ──
await poner('docFiltroDesde', '2026-10-01'); await poner('docFiltroHasta', '2026-10-31');
const oct2 = await names('documentosBody');
ok('N2: en octubre entran también el dd/mm/aa (15/10/26) y el aaaa/mm/dd (2026/10/20)', oct2.indexOf('ZZG-ArcaAA') !== -1 && oct2.indexOf('ZZG-ArcaYMD') !== -1 && oct2.indexOf('ZZG-EmitDMA') !== -1, JSON.stringify(oct2));
ok('N3: 31/02/2026, 10/15/2026 y la factura sin fecha no entran y se cuentan: «3 comprobantes sin fecha legible no entran» bajo los filtros', oct2.indexOf('ZZH-ArcaImposible') === -1 && oct2.indexOf('ZZH-ArcaMDY') === -1 && oct2.indexOf('ZZH-FacSinFecha') === -1 && /^ℹ️ 3 comprobantes sin fecha legible no entran en el filtro de fechas\.$/.test(await aviso('docFechaAviso')), await aviso('docFechaAviso'));
await poner('buscadorDoc', 'zzh-facsinfecha');
ok('N4: si la lista queda vacía, el cartel y el aviso dicen «1 sin fecha legible no entra» (singular)', /No hay comprobantes que coincidan con los filtros \(fecha del 1\/10\/2026 al 31\/10\/2026\)\. 1 sin fecha legible no entra en el filtro de fechas\./.test(await cuerpo('documentosBody')) && /^ℹ️ 1 comprobante sin fecha legible no entra/.test(await aviso('docFechaAviso')), await cuerpo('documentosBody'));
await poner('buscadorDoc', 'v593');

// ── las tarjetas de arriba siguen siendo de todo; el pie suma sólo lo filtrado ──
const tarj = () => p.evaluate(() => ['totalDocs', 'docsTotal', 'docsPendientes'].map(id => document.getElementById(id).textContent.replace(/\s+/g, ' ').trim()).join(' | '));
const t1 = await tarj();
await poner('docFiltroDesde', ''); await poner('docFiltroHasta', '');
ok('N5: las tarjetas de arriba (cargados / total / pendientes) no cambian con el filtro de fechas', t1 === await tarj(), t1 + ' vs ' + await tarj());
await poner('docFiltroDesde', '2026-10-01'); await poner('docFiltroHasta', '2026-10-31');
await poner('buscadorDoc', 'zzg-doc');
const pieDocs = await p.evaluate(() => { const c = document.querySelectorAll('#documentosFoot tr:first-child td'); return { n: document.querySelector('#documentosFoot td').textContent, imp: c[1] && c[1].textContent, pag: c[2] && c[2].textContent }; });
ok('N6: el pie suma lo PAGADO sólo de lo filtrado (150,00 del documento de octubre; los 70 del de septiembre quedan afuera)', /150,00/.test(pieDocs.pag) && !/70,00/.test(pieDocs.pag) && /1\.000,00/.test(pieDocs.imp), JSON.stringify(pieDocs));

// ── notas de crédito importadas de ARCA: restan en el pie y se ven con signo ──
await poner('buscadorDoc', 'zzg-arcanc');
const ncp = await p.evaluate(() => ({ pie: document.getElementById('documentosFoot').textContent.replace(/\s+/g, ' '), fila: document.querySelector('#documentosBody tr td:nth-child(6)').textContent.replace(/\s+/g, ' ').trim() }));
ok('N7: una nota de crédito importada de ARCA (tipo «3 - Nota de Crédito A», importe 700 en positivo) resta en el pie (−700,00) y la fila la muestra con «−»', /-700,00/.test(ncp.pie) && /^−\s*\$700,00$/.test(ncp.fila), JSON.stringify(ncp));
await poner('buscadorDoc', 'v593');

// ── selección masiva: queda limitada a lo visible ──
await p.evaluate(() => { toggleDocsSelMode(); });
await poner('docFiltroDesde', '2026-10-01'); await poner('docFiltroHasta', '2026-10-31');
await p.evaluate(() => _docsSelTodas());
const sel1 = await p.evaluate(() => Object.keys(_docsSelIds).sort());
ok('N8: «Seleccionar todas» marca las facturas de octubre y NO la nota de crédito (que no tiene casilla)', JSON.stringify(sel1) === JSON.stringify(['zzg_f1', 'zzg_f2']), JSON.stringify(sel1));
await poner('docFiltroDesde', '2026-11-01'); await poner('docFiltroHasta', '2026-11-30');
const sel2 = await p.evaluate(() => ({ ids: Object.keys(_docsSelIds), txt: document.getElementById('docsSelCount').textContent }));
ok('N9: al pasar a noviembre la selección de octubre se suelta (la barra dice 0): el lote no toca facturas que ya no se ven', sel2.ids.length === 0 && /^0 facturas/.test(sel2.txt), JSON.stringify(sel2));
await poner('docFiltroDesde', '2030-01-01'); await poner('docFiltroHasta', '');
await p.evaluate(() => toggleDocsSelMode());
const sel3 = await p.evaluate(() => ({ barra: document.getElementById('docsSelBar').style.display, boton: document.getElementById('btnDocsSel').textContent }));
ok('N10: con la lista vacía, salir del modo selección esconde la barra y devuelve el rótulo del botón', sel3.barra === 'none' && /Seleccionar facturas/.test(sel3.boton), JSON.stringify(sel3));
await p.evaluate(() => docLimpiarFiltros());

// ── Enter sobre «Limpiar filtros» es SU click, no la acción de la fila seleccionada ──
await poner('buscadorDoc', 'v593');
await poner('docFiltroDesde', '2026-10-01'); await poner('docFiltroHasta', '2026-10-31');
const antes = await p.evaluate(() => JSON.stringify(facturas.map(f => f.computaARCA)));
await p.focus('#btnDocLimpiarFiltros');
await p.keyboard.press('Enter');
await p.waitForTimeout(200);
const enter1 = await p.evaluate(() => ({ campos: ['docFiltroDesde', 'docFiltroHasta', 'buscadorDoc'].map(id => document.getElementById(id).value).join(''), computa: JSON.stringify(facturas.map(f => f.computaARCA)), foco: document.activeElement && document.activeElement.id }));
ok('N11: Enter sobre «Limpiar filtros» limpia y NO cambia «computa ARCA» de ninguna factura', enter1.campos === '' && enter1.computa === antes, JSON.stringify(enter1).slice(0, 300));
ok('N12: y el foco pasa al primer campo de fecha (no se pierde en <body> al esconderse el botón)', enter1.foco === 'docFiltroDesde', enter1.foco);

// ── un año a medio tipear no dispara el cartel «desde posterior a hasta» ──
await poner('buscadorDoc', 'v593');
await poner('docFiltroDesde', '2026-11-01'); await poner('docFiltroHasta', '0002-11-30');
const anio = await cuerpo('documentosBody');
ok('N13: con «hasta» a medio tipear (año 0002) no sale el cartel «es posterior a Hasta» y rige sólo «desde»', !/posterior/.test(anio) && /ZZG-FacNov05/.test(anio), anio.slice(0, 160));
await p.evaluate(() => docLimpiarFiltros());

// ── la lista vacía de verdad dice «no hay comprobantes cargados» (aunque haya filtro puesto) ──
const vacio = await p.evaluate(() => {
  const bak = { d: documentos.splice(0), f: facturas.splice(0), c: compRecibidos.splice(0), e: comprobantesEmitidos.splice(0) };
  document.getElementById('docFiltroDesde').value = '2026-10-01'; document.getElementById('factFiltroDesde').value = '2026-10-01';
  renderDocumentos(); renderFacturas();
  const r = { docs: document.getElementById('documentosBody').textContent.trim(), facs: document.getElementById('facturasBody').textContent.trim() };
  documentos.push(...bak.d); facturas.push(...bak.f); compRecibidos.push(...bak.c); comprobantesEmitidos.push(...bak.e);
  document.getElementById('docFiltroDesde').value = ''; document.getElementById('factFiltroDesde').value = '';
  return r;
});
ok('N14: sin ningún comprobante cargado, con filtro de fechas puesto, dice «No hay comprobantes cargados.» / «No hay facturas para mostrar.» (no «no coinciden con los filtros»)', vacio.docs === 'No hay comprobantes cargados.' && vacio.facs === 'No hay facturas para mostrar.', JSON.stringify(vacio));

// ── Facturas de proveedores: los extremos, sólo «hasta», sólo «desde» y el aviso de sin fecha (se escribe con fill real) ──
await p.evaluate(() => { mostrarTab('Facturas'); factLimpiarFiltros(); });
await poner('buscadorFact', 'v593');
await p.fill('#factFiltroHasta', '2026-10-31');
await p.fill('#factFiltroDesde', '2026-10-01');   // «desde» queda como el ÚLTIMO campo tocado
await p.waitForTimeout(150);
const fOct = await names('facturasBody');
ok('K1: en Facturas, del 1/10 al 31/10 entran los dos extremos (1/10 y 31/10) y la nota de crédito del 18/10, y no la del 5/11', JSON.stringify(fOct) === JSON.stringify(['ZZG-FacOct01', 'ZZG-FacOct31', 'ZZG-NCOct']), JSON.stringify(fOct));
ok('K2: y avisa bajo los filtros que 1 factura sin fecha legible no entra (también con la lista llena)', /^ℹ️ 1 factura sin fecha legible no entra en el filtro de fechas\.$/.test(await aviso('factFechaAviso')), await aviso('factFechaAviso'));
await p.fill('#factFiltroDesde', '');
await p.fill('#factFiltroHasta', '2026-10-01');
await p.waitForTimeout(150);
ok('K3: sólo «hasta» 1/10: entra la del 1/10 (inclusive) y ninguna posterior', JSON.stringify(await names('facturasBody')) === JSON.stringify(['ZZG-FacOct01']), JSON.stringify(await names('facturasBody')));
await p.fill('#factFiltroHasta', '');
await p.fill('#factFiltroDesde', '2026-10-31');
await p.waitForTimeout(150);
ok('K4: sólo «desde» 31/10: entran la del 31/10 (inclusive) y la de noviembre', JSON.stringify(await names('facturasBody')) === JSON.stringify(['ZZG-FacNov05', 'ZZG-FacOct31']), JSON.stringify(await names('facturasBody')));
await p.fill('#factFiltroDesde', '');
await p.waitForTimeout(100);
ok('K5: sin fechas el aviso desaparece', (await aviso('factFechaAviso')) === '');
// Enter sobre el botón de Facturas: no abre «Registrar pago» de la fila seleccionada
await poner('factFiltroDesde', '2026-10-01');
await p.focus('#btnFactLimpiarFiltros');
await p.keyboard.press('Enter');
await p.waitForTimeout(250);
const k6 = await p.evaluate(() => ({ campos: ['factFiltroDesde', 'factFiltroHasta', 'buscadorFact'].map(id => document.getElementById(id).value).join(''), pago: !!(document.getElementById('modalPagoFD') && document.getElementById('modalPagoFD').classList.contains('active')) }));
ok('K6: Enter sobre «Limpiar filtros» en Facturas limpia y no abre «Registrar pago»', k6.campos === '' && !k6.pago, JSON.stringify(k6));

// ── los dos campos de cada par quedan juntos en anchos de escritorio, y el rango de ARCA está rotulado ──
for (const w of [1280, 1366, 1440, 1536]) {
  await p.setViewportSize({ width: w, height: 900 });
  await p.evaluate(() => { mostrarTab('Documentos'); });
  await p.waitForTimeout(120);
  const yd = await p.evaluate(() => ({ a: document.getElementById('docFiltroDesde').getBoundingClientRect().y, b: document.getElementById('docFiltroHasta').getBoundingClientRect().y }));
  await p.evaluate(() => { mostrarTab('Facturas'); });
  await p.waitForTimeout(120);
  const yf = await p.evaluate(() => ({ a: document.getElementById('factFiltroDesde').getBoundingClientRect().y, b: document.getElementById('factFiltroHasta').getBoundingClientRect().y }));
  ok('L' + w + ': a ' + w + ' px «desde» y «hasta» quedan en la misma línea en Comprobantes recibidos y en Facturas', Math.abs(yd.a - yd.b) < 2 && Math.abs(yf.a - yf.b) < 2, JSON.stringify([yd, yf]));
}
await p.setViewportSize({ width: 1400, height: 900 });
await p.evaluate(() => { mostrarTab('Documentos'); });
const arcaRot = await p.evaluate(() => ['compRecDesde', 'compRecHasta'].map(id => { const l = document.getElementById(id).closest('label'); return l ? l.textContent.replace(/\s+/g, ' ').trim() : null; }));
ok('L1: los campos del rango que se le pide a ARCA (compRecDesde / compRecHasta) tienen rótulo propio («desde:» / «hasta:») y no ocupan todo el ancho', arcaRot[0] === 'desde:' && arcaRot[1] === 'hasta:' && (await p.evaluate(() => document.getElementById('compRecDesde').getBoundingClientRect().width)) < 250, JSON.stringify(arcaRot));

const mal = res.filter(x => x[0] === 'FALLA').length;
console.log(res.map(x => x.join(' · ')).join('\n'));
console.log(`\n${res.length - mal}/${res.length} OK`);
if (errores && errores.length) console.log('errores de JS:', errores.slice(0, 5));
await b.close();
process.exit(mal || (errores && errores.length) ? 1 : 0);
