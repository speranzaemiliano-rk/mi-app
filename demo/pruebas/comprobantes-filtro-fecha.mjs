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
ok('B5: el pie dice cuántos son y el período («8 comprobantes · del 1/10/2026 al 31/10/2026») y el importe suma sólo esos (31.900 = 200+300+400+2000+3000+4000+5000+7000 → 21.900)', /TOTAL \(8 comprobantes · del 1\/10\/2026 al 31\/10\/2026\)/.test(f1) && /21\.900,00/.test(f1), f1);
ok('B6: y avisa que hay comprobantes sin fecha que no entran en el filtro', /sin fecha no entra/.test(f1), f1);
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
await p.evaluate(() => docLimpiarFiltros());
ok('F1: «Limpiar filtros» vacía fechas, búsqueda, origen y estado', await p.evaluate(() => ['docFiltroDesde', 'docFiltroHasta', 'buscadorDoc', 'filtroDocOrigen', 'filtroDocEstado'].every(id => document.getElementById(id).value === '')));
ok('F2: y el botón se vuelve a esconder', !(await vis('btnDocLimpiarFiltros')));
await poner('buscadorDoc', 'zzf-');
ok('F3: sin filtro de fechas vuelve a verse todo (incluido el comprobante sin fecha)', eq(await provs('documentosBody'), TODOS), JSON.stringify(await provs('documentosBody')));
ok('F4: el pie sin filtro de fechas no menciona período ni «sin fecha»', !/·\s*(del|desde|hasta)/.test(await pie()) && !/sin fecha no entra/.test(await pie()), await pie());

// ── el filtro se puede escribir con el teclado (escritura real en el campo de fecha) ──
await p.fill('#docFiltroDesde', '2026-10-01');   // como un clic y tipeo real: dispara input y change
await p.waitForTimeout(150);
ok('G1: escribiendo la fecha en el campo (fill de Playwright) el filtro se aplica', (await p.evaluate(() => document.getElementById('docFiltroDesde').value)) === '2026-10-01' && !(await provs('documentosBody')).includes('ZZF-DocSep30'), await p.evaluate(() => document.getElementById('docFiltroDesde').value));
await p.evaluate(() => docLimpiarFiltros());

// ── helper de fechas ──
const h = await p.evaluate(() => ({ a: _docFechaISO('2026-10-05'), b: _docFechaISO('5/10/2026'), c: _docFechaISO('05-10-2026'), d: _docFechaISO('2026-10-05T10:00:00'), e: _docFechaISO(''), f: _docFechaISO(null), g: _docFechaISO('basura'), h: _docFechaISO('2026-1-5') }));
ok('H1: _docFechaISO lee AAAA-MM-DD, d/m/aaaa, dd-mm-aaaa y con hora, y devuelve vacío si no entiende', h.a === '2026-10-05' && h.b === '2026-10-05' && h.c === '2026-10-05' && h.d === '2026-10-05' && h.e === '' && h.f === '' && h.g === '' && h.h === '2026-01-05', JSON.stringify(h));

// ═════════ Facturas de proveedores (la otra lista de lo recibido) ═════════
await p.evaluate(() => mostrarTab('Facturas'));
await p.waitForTimeout(200);
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

// ═════════ el uso que se hace desde el menú: «Comprobantes recibidos → ARCA» ═════════
await p.evaluate(() => { mostrarTab('Documentos'); docLimpiarFiltros(); _verDocsProv('arca'); });
await poner('docFiltroDesde', '2026-10-01'); await poner('docFiltroHasta', '2026-10-31');
const menu = await p.evaluate(() => document.getElementById('filtroDocOrigen').value);
ok('J1: venir por «Comprobantes recibidos → Facturas ARCA» deja el origen en ARCA y el filtro de fechas convive con él', menu === 'arca' && (await vis('btnDocLimpiarFiltros')), menu);

const mal = res.filter(x => x[0] === 'FALLA').length;
console.log(res.map(x => x.join(' · ')).join('\n'));
console.log(`\n${res.length - mal}/${res.length} OK`);
if (errores && errores.length) console.log('errores de JS:', errores.slice(0, 5));
await b.close();
process.exit(mal || (errores && errores.length) ? 1 : 0);
