// Remuneraciones → «Liquidar y pagar»: facturas y comprobantes de la Parte A y de la Parte B. Se guardan dentro del recibo del mes
// (remunRecibos[].papeles): borrador si el recibo todavía no existe, guardado en el acto si ya existe; se ven en las listas de
// recibos, se quitan, se borran con el recibo y se avisa antes de descartar lo que no se guardó. Corre contra la demo (base en memoria).
// Uso: node remun-papeles.mjs   (ver README: hace falta bajar-cdn.sh antes)
import { abrirDemo, entrarAlSistema, irA } from './demo-lib.mjs';
const { b, p, errores } = await abrirDemo();
const res = [];
const ok = (n, c, x) => res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]);
await entrarAlSistema(p);
await p.evaluate(() => { window.__alerts = []; window.__confirms = []; window.__conf = true;
  window.alert = m => window.__alerts.push(String(m));
  window.confirm = m => { window.__confirms.push(String(m)); return window.__conf; };
  window.open = () => { window.__abierto = (window.__abierto || 0) + 1; return null; }; });
await irA(p, 'Remuneraciones');

const PDF = { name: 'factura-prueba.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF') };
const PNG = { name: 'transferencia.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64') };
const subir = async (parte, clase, archivo) => {
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('#liqPapeles' + parte + ' button[onclick*="\'' + clase + '\'"]')]);
  await fc.setFiles(archivo);
  await p.waitForFunction(() => !document.querySelector('#liqPapelesA, #liqPapelesB').innerText.includes('Procesando'), null, { timeout: 8000 }).catch(() => {});
  await p.waitForTimeout(350);
};
const recDe = (mes) => p.evaluate(m => { const e = remuneraciones[0]; const r = remunRecibos.find(x => x.empleadoId === e.id && x.mes === m); return r ? { id: r.id, papeles: (r.papeles || []).map(x => ({ id: x.id, parte: x.parte, clase: x.clase, nombre: x.nombre, tipo: x.tipo, nro: x.nro, largo: (x.contenido || '').length })) } : null; }, mes);
const enNube = (id) => p.evaluate(i => { const v = __demoDB.leer('remuneracionesRecibos/' + i); return v ? { n: (v.papeles || []).length, nros: (v.papeles || []).map(x => x.nro || '') } : null; }, id);
const textoPartes = () => p.evaluate(() => ({ a: document.getElementById('liqPapelesA').innerText, b: document.getElementById('liqPapelesB').innerText }));
const setMes = async (m) => { await p.evaluate(m => { const el = document.getElementById('empLiqMes'); el.value = m; el.dispatchEvent(new Event('change')); }, m); await p.waitForTimeout(250); };

const M1 = '2098-03', M2 = '2098-04';
ok('hay empleados en la demo', await p.evaluate(() => remuneraciones.length) >= 2);
await p.evaluate(() => liquidarSueldoEmpleado(0));
await p.waitForTimeout(500);
await setMes(M1);
ok('el modal tiene el bloque de la Parte A y de la Parte B, cada uno con sus dos botones', await p.evaluate(() => ['A', 'B'].every(x => { const c = document.getElementById('liqPapeles' + x); return c && c.querySelectorAll('button').length === 2 && /Factura/.test(c.innerText) && /Comprobante/.test(c.innerText); })));
const t0 = await textoPartes();
ok('cada bloque se rotula con su parte y avisa que es opcional', /Parte A/.test(t0.a) && /Parte B/.test(t0.b) && /Opcional/.test(t0.a) && /Opcional/.test(t0.b), JSON.stringify(t0));
ok('el mes elegido no tiene recibo todavía', (await recDe(M1)) === null);

// ───── S1: borrador (el recibo del mes no existe) ─────
await subir('A', 'factura', PDF);
await subir('B', 'comprobante', PNG);
let t = await textoPartes();
ok('S1: la factura queda en el bloque de la Parte A, marcada «se guarda junto con el recibo»', /Factura/.test(t.a) && /factura-prueba\.pdf/.test(t.a) && /se guarda junto con el recibo/.test(t.a), t.a);
ok('S1: el comprobante queda en la Parte B, no en la A', /transferencia\.png/.test(t.b) && !/transferencia\.png/.test(t.a), JSON.stringify(t));
ok('S1: el borrador NO creó el recibo', (await recDe(M1)) === null);
await p.fill('#liqPapelesA input.liq-papel-nro', 'A-0001-00000123');
await p.dispatchEvent('#liqPapelesA input.liq-papel-nro', 'change');
ok('S1: sólo la factura pide N° de factura (el comprobante no)', await p.evaluate(() => document.querySelectorAll('#liqPapelesA input.liq-papel-nro').length === 1 && document.querySelectorAll('#liqPapelesB input.liq-papel-nro').length === 0));
// cerrar con archivos sin guardar: pregunta; si dice que no, el modal sigue
await p.evaluate(() => { window.__conf = false; window.__confirms = []; cerrarModalLiquidar(); });
ok('S1: cerrar con archivos sin guardar pregunta antes', (await p.evaluate(() => window.__confirms)).some(m => /NO se guardaron/.test(m)) && await p.isVisible('#modalLiquidar'));
ok('S1: al decir que no, el borrador sigue ahí', /factura-prueba\.pdf/.test((await textoPartes()).a));
// cambiar de mes: el borrador viaja (es del empleado, se guarda con el mes que se elija al guardar)
await setMes(M2); await setMes(M1);
ok('S1: cambiar de mes no pierde el borrador', /factura-prueba\.pdf/.test((await textoPartes()).a) && /transferencia\.png/.test((await textoPartes()).b));
// guardar sólo el recibo
await p.evaluate(() => { window.__conf = true; window.__alerts = []; guardarReciboMes(); });
await p.waitForTimeout(700);
let r1 = await recDe(M1);
ok('S1: «Guardar recibo solo» crea el recibo con los dos archivos', r1 && r1.papeles.length === 2, JSON.stringify(r1));
const fa = r1 && r1.papeles.find(x => x.clase === 'factura'), cb = r1 && r1.papeles.find(x => x.clase === 'comprobante');
ok('S1: la factura es de la Parte A, con su N°, tipo y contenido', fa && fa.parte === 'A' && fa.nro === 'A-0001-00000123' && fa.tipo === 'application/pdf' && fa.largo > 20, JSON.stringify(fa));
ok('S1: el comprobante es de la Parte B', cb && cb.parte === 'B' && cb.nombre === 'transferencia.png', JSON.stringify(cb));
const n1 = r1 && await enNube(r1.id);
ok('S1: quedó en la base (con el N° de la factura)', n1 && n1.n === 2 && n1.nros.includes('A-0001-00000123'), JSON.stringify(n1));
t = await textoPartes();
ok('S1: pasó de borrador a guardado (ya no dice «se guarda junto con…»)', !/se guarda junto con el recibo/.test(t.a + t.b) && /factura-prueba\.pdf/.test(t.a), JSON.stringify(t));
ok('S1: el borrador quedó vacío (cerrar el modal ya no pregunta)', await p.evaluate(() => _liqPapelesBorrador.length === 0));

// ───── S2: recibo existente → se guarda en el acto ─────
await subir('A', 'comprobante', PNG);
r1 = await recDe(M1);
ok('S2: con el recibo ya guardado, un archivo nuevo entra directo al recibo', r1.papeles.length === 3 && r1.papeles.filter(x => x.parte === 'A').length === 2, JSON.stringify(r1));
ok('S2: y quedó en la base sin tocar «Guardar»', (await enNube(r1.id)).n === 3);
ok('S2: no pasó por el borrador', await p.evaluate(() => _liqPapelesBorrador.length === 0));
// la lista de recibos del empleado y la general muestran los archivos
const listas = await p.evaluate(() => ({ emp: document.getElementById('empRecibosHist').innerHTML, gen: (typeof _renderRemunRecibosLista === 'function' && (_renderRemunRecibosLista(), document.getElementById('remRecibosBody').innerHTML)) }));
ok('S2: «Recibos guardados» del empleado muestra un botón por archivo', (listas.emp.match(/_remVerPapelRecibo/g) || []).length === 3, String((listas.emp.match(/_remVerPapelRecibo/g) || []).length));
ok('S2: la lista general de recibos también', (listas.gen.match(/_remVerPapelRecibo/g) || []).length === 3, String((listas.gen.match(/_remVerPapelRecibo/g) || []).length));
await p.evaluate(() => { window.__abierto = 0; const r = remunRecibos.find(x => (x.papeles || []).length); _remVerPapelRecibo(r.id, r.papeles[0].id); });
ok('S2: el botón abre el archivo', await p.evaluate(() => window.__abierto) === 1);
// editar el N° de una factura ya guardada
await p.fill('#liqPapelesA input.liq-papel-nro', 'B-0005-00000007');
await p.dispatchEvent('#liqPapelesA input.liq-papel-nro', 'change');
await p.waitForTimeout(250);
ok('S2: cambiar el N° de una factura guardada se persiste', (await enNube(r1.id)).nros.includes('B-0005-00000007'), JSON.stringify(await enNube(r1.id)));
// volver a guardar el recibo no pierde los archivos
await p.evaluate(() => { window.__conf = true; guardarReciboMes(); });
await p.waitForTimeout(600);
r1 = await recDe(M1);
ok('S2: re-guardar (reemplazar) el recibo conserva sus 3 archivos', r1.papeles.length === 3 && (await enNube(r1.id)).n === 3, JSON.stringify(r1));
// quitar uno
await p.evaluate(() => { window.__conf = true; window.__confirms = []; });
await p.click('#liqPapelesB button.btn-danger-sm');
await p.waitForTimeout(400);
r1 = await recDe(M1);
ok('S2: quitar el comprobante de la Parte B lo saca del recibo y de la base', r1.papeles.length === 2 && !r1.papeles.some(x => x.parte === 'B') && (await enNube(r1.id)).n === 2, JSON.stringify(r1));
ok('S2: pidió confirmación y avisó que se borra del recibo guardado', (await p.evaluate(() => window.__confirms)).some(m => /Quitar/.test(m) && /recibo guardado/.test(m)));
// mes sin recibo: no muestra los archivos de otro mes
await setMes(M2);
t = await textoPartes();
ok('S2: otro mes (sin recibo) no muestra los archivos del mes anterior', !/factura-prueba|transferencia/.test(t.a + t.b), JSON.stringify(t));

// ───── S3: «Liquidar y pagar» con archivos en las dos partes ─────
await subir('B', 'factura', PDF);
await subir('B', 'comprobante', PNG);
await subir('A', 'comprobante', PNG);
ok('S3: tres archivos en borrador (2 en B, 1 en A)', await p.evaluate(() => _liqPapelesBorrador.length === 3 && _liqPapelesBorrador.filter(x => x.parte === 'B').length === 2));
await p.evaluate(() => { window.__conf = true; window.__alerts = []; window.__confirms = []; _liqPagoRefrescar(true); });
const cuentas = await p.evaluate(() => document.getElementById('liqPagoCuenta').options.length);
await p.evaluate(() => { liquidarYPagar(); });
await p.waitForTimeout(1500);
const r2 = await recDe(M2);
const pago = await p.evaluate(m => { const e = remuneraciones[0]; const x = remunPagos.find(y => y.mes === m && y.nombre === e.nombre); return x ? { banco: x.montoBanco, efe: x.montoEfectivo, cons: x.consolidado } : null; }, M2);
ok('S3: «Liquidar y pagar» guardó el recibo con los 3 archivos', r2 && r2.papeles.length === 3 && r2.papeles.filter(x => x.parte === 'B').length === 2, JSON.stringify(r2) + ' alerts=' + JSON.stringify(await p.evaluate(() => window.__alerts)));
ok('S3: y registró el pago (los archivos no rompen el resto del flujo)', pago && (pago.banco + pago.efe) > 0, JSON.stringify(pago) + ' cuentas=' + cuentas);
ok('S3: el borrador quedó vacío y la base tiene los 3', await p.evaluate(() => _liqPapelesBorrador.length === 0) && (await enNube(r2.id)).n === 3);

// ───── S4: eliminar el recibo se lleva los archivos ─────
await p.evaluate(() => { window.__conf = true; window.__confirms = []; });
await p.evaluate(id => eliminarReciboGuardado(id), r2.id);
await p.waitForTimeout(400);
ok('S4: eliminar un recibo avisa que se borran sus 3 archivos', (await p.evaluate(() => window.__confirms)).some(m => /3 archivo/.test(m)), JSON.stringify(await p.evaluate(() => window.__confirms)));
ok('S4: el recibo y sus archivos desaparecen de la base', (await recDe(M2)) === null && (await enNube(r2.id)) === null);

// ───── S5: cambiar de empleado con archivos sin guardar ─────
await setMes('2098-05');
await subir('A', 'factura', PDF);
await p.evaluate(() => { window.__conf = false; window.__confirms = []; liquidarSueldoEmpleado(1); });
await p.waitForTimeout(300);
ok('S5: cambiar de empleado con archivos sin guardar pregunta', (await p.evaluate(() => window.__confirms)).some(m => /cambiás de empleado/.test(m)));
ok('S5: al decir que no se queda en el empleado y con el borrador', await p.evaluate(() => editandoEmpleadoIdx === 0 && _liqPapelesBorrador.length === 1));
await p.evaluate(() => { window.__conf = true; liquidarSueldoEmpleado(1); });
await p.waitForTimeout(400);
ok('S5: al decir que sí cambia y el borrador no viaja al otro empleado', await p.evaluate(() => editandoEmpleadoIdx === 1 && _liqPapelesBorrador.length === 0) && !/factura-prueba/.test((await textoPartes()).a));
await p.evaluate(() => { window.__conf = true; cerrarModalLiquidar(); });
ok('S5: sin borrador cerrar el modal no pregunta', !(await p.isVisible('#modalLiquidar')));

// ───── S6: se puede adjuntar cualquier archivo (PDF, foto, Excel, Word…); el límite es el peso ─────
await p.evaluate(() => liquidarSueldoEmpleado(0));
await p.waitForTimeout(300);
await setMes('2098-06');
await p.evaluate(() => { window.__alerts = []; });
const SVG = { name: 'factura.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="document.title=\'XSS\'"></svg>') };
const HTML = { name: 'factura.html', mimeType: 'text/html', buffer: Buffer.from('<script>document.title="XSS"</script>') };
const XLSX = { name: 'liquidacion.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: Buffer.from('PK\x03\x04 datos') };
const DOCX = { name: 'contrato.docx', mimeType: '', buffer: Buffer.from('PK\x03\x04 datos') };   // sin tipo: lo deduce el navegador (o queda octet-stream); se conserva el nombre
const BIN = { name: 'enorme.bin', mimeType: 'application/octet-stream', buffer: Buffer.alloc(9 * 1024 * 1024, 1) };
ok('S6: el selector de archivos no restringe el tipo (sin «accept»)', await p.evaluate(() => !document.getElementById('liqPapelFile').hasAttribute('accept')));
for (const f of [XLSX, DOCX, SVG, HTML]) await subir('A', 'comprobante', f);
let b6 = await p.evaluate(() => _liqPapelesBorrador.map(x => ({ n: x.nombre, t: x.tipo })));
ok('S6: un Excel, un Word, un SVG y un HTML entran al borrador con su tipo', b6.length === 4 && b6.find(x => x.n === 'liquidacion.xlsx').t === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && !!b6.find(x => x.n === 'contrato.docx').t, JSON.stringify(b6));   // el navegador deduce el tipo del .docx; si no, queda octet-stream
ok('S6: el rechazo por tipo ya no existe (ningún aviso de «no se puede adjuntar»)', !(await p.evaluate(() => window.__alerts)).some(m => /no se puede adjuntar/.test(m)));
await p.evaluate(() => { window.__blobs = []; window.__opens = 0; window.__descargas = [];
  const crear = URL.createObjectURL.bind(URL); URL.createObjectURL = (b) => { window.__blobs.push(b.type); return crear(b); };
  window.open = () => { window.__opens++; return null; }; HTMLAnchorElement.prototype.click = function () { window.__descargas.push(this.download || ''); };
  window.__ids = _liqPapelesBorrador.map(x => ({ n: x.nombre, id: x.id })); window.__ids.forEach(x => _liqPapelVer(x.id)); });
const v6 = await p.evaluate(() => ({ opens: window.__opens, blobs: window.__blobs.slice(), desc: window.__descargas.slice() }));
ok('S6: los 4 se DESCARGAN con su nombre (ninguno se abre en línea con el origen de la app)', v6.opens === 0 && v6.desc.length === 4 && v6.desc.includes('liquidacion.xlsx') && v6.desc.includes('contrato.docx') && v6.blobs.every(t => t === 'application/octet-stream'), JSON.stringify(v6));
await p.evaluate(() => { _liqPapelesBorrador = []; window.__alerts = []; });
await subir('A', 'comprobante', BIN);
ok('S6: un archivo que pasa los 8 MB se rechaza por peso y no entra al borrador', (await p.evaluate(() => window.__alerts)).some(m => /supera los/.test(m)) && await p.evaluate(() => _liqPapelesBorrador.length === 0));

// ───── S7: un adjunto viejo SVG/HTML nunca se abre en línea (XSS por blob con el origen de la app) ─────
await p.evaluate(() => {
  window.__blobs = []; window.__opens = 0; window.__descargas = [];
  const crear = URL.createObjectURL.bind(URL);
  URL.createObjectURL = (b) => { window.__blobs.push(b.type); return crear(b); };
  window.open = () => { window.__opens++; return null; };
  const clic = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () { window.__descargas.push({ dl: this.download || '', target: this.target || '' }); };
});
const abrir = (a) => p.evaluate(x => { window.__blobs = []; window.__opens = 0; window.__descargas = []; _remAbrirAdjunto(x); return { blobs: window.__blobs.slice(), opens: window.__opens, desc: window.__descargas.slice() }; }, a);
const b64 = (t) => 'data:text/plain;base64,' + Buffer.from(t).toString('base64');
let r7 = await abrir({ nombre: 'f.svg', tipo: 'image/svg+xml', contenido: b64('<svg onload="x"/>') });
ok('S7: un SVG se DESCARGA como octet-stream, no se abre en línea', r7.opens === 0 && r7.blobs[0] === 'application/octet-stream' && r7.desc.length === 1 && r7.desc[0].dl === 'f.svg', JSON.stringify(r7));
r7 = await abrir({ nombre: 'f.html', tipo: 'text/html', contenido: b64('<script>1</script>') });
ok('S7: un HTML se descarga igual', r7.opens === 0 && r7.blobs[0] === 'application/octet-stream' && r7.desc.length === 1, JSON.stringify(r7));
r7 = await abrir({ nombre: 'trampa.pdf', tipo: 'text/html', contenido: b64('<script>1</script>') });
ok('S7: «.pdf» con tipo text/html tampoco se abre en línea (manda el tipo, no el nombre)', r7.opens === 0 && r7.blobs[0] === 'application/octet-stream', JSON.stringify(r7));
r7 = await abrir({ nombre: 'f.pdf', tipo: 'application/pdf', contenido: b64('%PDF') });
ok('S7: un PDF se abre en una pestaña con su tipo', r7.opens === 1 && r7.blobs[0] === 'application/pdf' && r7.desc.length === 0, JSON.stringify(r7));
r7 = await abrir({ nombre: 'f.png', tipo: 'image/png', contenido: b64('x') });
ok('S7: una imagen de trama se abre en línea', r7.opens === 1 && r7.blobs[0] === 'image/png', JSON.stringify(r7));
r7 = await abrir({ nombre: 'viejo.pdf', tipo: '', contenido: b64('%PDF') });
ok('S7: un dato viejo sin tipo y con extensión .pdf se sigue viendo', r7.opens === 1 && r7.blobs[0] === 'application/pdf', JSON.stringify(r7));
// los otros dos visores de Remuneraciones (consolidaciones y recibo del pago) usan el mismo abridor
r7 = await p.evaluate(() => { window.__blobs = []; window.__opens = 0; window.__descargas = [];
  remunConsolidados.push({ id: 'C-X', adjuntos: [{ nombre: 'a.svg', tipo: 'image/svg+xml', contenido: 'PHN2Zy8+' }] });
  remunPagos.push({ id: 'P-X', adjunto: { nombre: 'a.html', tipo: 'text/html', contenido: 'PHA+' } });
  verAdjuntoConsolidado('C-X', 0); const a = { opens: window.__opens, blobs: window.__blobs.slice() };
  window.__blobs = []; window.__opens = 0; descargarReciboRemun('P-X');
  remunConsolidados = remunConsolidados.filter(x => x.id !== 'C-X'); remunPagos = remunPagos.filter(x => x.id !== 'P-X');
  return { cons: a, pago: { opens: window.__opens, blobs: window.__blobs.slice() } }; });
ok('S7: el adjunto de una consolidación y el recibo de un pago (SVG/HTML) también se descargan', r7.cons.opens === 0 && r7.cons.blobs[0] === 'application/octet-stream' && r7.pago.opens === 0 && r7.pago.blobs[0] === 'application/octet-stream', JSON.stringify(r7));

// ───── S8: el tope de peso se aplica también al sumar el borrador a un recibo existente ─────
const GRANDE = 'A'.repeat(5000000);
await setMes('2098-07');
await p.evaluate(g => { const e = remuneraciones[0]; window.__alerts = []; window.__confirms = [];
  _liqPapelesBorrador = [{ id: 'PAP-G1', parte: 'A', clase: 'comprobante', nombre: 'g1.pdf', tipo: 'application/pdf', contenido: g, nro: '', subidoEn: 1 }]; }, GRANDE);
await p.evaluate(() => { window.__conf = true; guardarReciboMes(); }); await p.waitForTimeout(700);
let rg = await recDe('2098-07');
ok('S8: el recibo nuevo con un archivo de 5 M de caracteres se guarda', rg && rg.papeles.length === 1, JSON.stringify(rg && rg.papeles.length));
await p.evaluate(g => { _liqPapelesBorrador = [{ id: 'PAP-G2', parte: 'B', clase: 'comprobante', nombre: 'g2.pdf', tipo: 'application/pdf', contenido: g, nro: '', subidoEn: 2 }]; window.__alerts = []; window.__conf = true; guardarReciboMes(); }, GRANDE);
await p.waitForTimeout(700);
rg = await recDe('2098-07');
ok('S8: sumar otro de 5 M a ese recibo (10 M en total) se corta con aviso del tope', (await p.evaluate(() => window.__alerts)).some(m => /tope/.test(m)) && rg.papeles.length === 1, JSON.stringify(await p.evaluate(() => window.__alerts)));
ok('S8: el borrador se conserva (no se perdió nada)', await p.evaluate(() => _liqPapelesBorrador.length === 1 && _liqPapelesBorrador[0].id === 'PAP-G2'));
await p.evaluate(() => { _liqPapelesBorrador = []; });

// ───── S9: si la base rechaza la escritura, el «guardado» no se canta y el borrador se conserva ─────
await p.evaluate(() => { window.__upd0 = REF_REMUN_RECIBOS.update; REF_REMUN_RECIBOS.update = () => Promise.reject(new Error('Write too large')); window.__alerts = []; window.__confs = [];
  _liqPapelesBorrador = [{ id: 'PAP-R1', parte: 'A', clase: 'factura', nombre: 'r1.pdf', tipo: 'application/pdf', contenido: 'AAAA', nro: '', subidoEn: 3 }]; window.__conf = true; guardarReciboMes(); });
await p.waitForTimeout(900);
const rr = await recDe('2098-07');
const al9 = await p.evaluate(() => window.__alerts);
ok('S9: la base rechazó el guardado → no se dijo «✅ guardado» y se avisó que no se guardó', !al9.some(m => /^✅ Recibo/.test(m)) && al9.some(m => /NO se guardó|NO quedaron|no quedaron/.test(m)), JSON.stringify(al9));
ok('S9: el borrador se conserva y el recibo en memoria no quedó con el archivo', await p.evaluate(() => _liqPapelesBorrador.length === 1) && rr.papeles.every(x => x.id !== 'PAP-R1'), JSON.stringify(rr));
// y un archivo que entra DIRECTO a un recibo existente, con la base rechazando
await p.evaluate(() => { _liqPapelesBorrador = []; window.__alerts = []; });
await subir('A', 'comprobante', PNG);
const al9b = await p.evaluate(() => window.__alerts);
ok('S9: un archivo directo a un recibo existente que la base rechaza se revierte y avisa', al9b.some(m => /NO quedaron guardados/.test(m)) && (await recDe('2098-07')).papeles.length === 1, JSON.stringify(al9b));
await p.evaluate(() => { REF_REMUN_RECIBOS.update = window.__upd0; });

// ───── S10: «Imprimir y guardar» con el recibo ya guardado suma el borrador ─────
await p.evaluate(() => { _imprimirReciboDe = () => {}; _liqPapelesBorrador = [{ id: 'PAP-I1', parte: 'B', clase: 'comprobante', nombre: 'i1.png', tipo: 'image/png', contenido: 'AAAA', nro: '', subidoEn: 4 }]; imprimirReciboActual(); });
await p.waitForTimeout(800);
rg = await recDe('2098-07');
ok('S10: «Imprimir y guardar» con el recibo existente suma el archivo del borrador', rg.papeles.some(x => x.id === 'PAP-I1') && (await enNube(rg.id)).n === 2 && await p.evaluate(() => _liqPapelesBorrador.length === 0), JSON.stringify(rg));

// ───── S11: mientras la base confirma, un archivo no se ve duplicado ─────
await p.evaluate(() => { const rec = _liqReciboActual(); const dup = rec.papeles[0]; _liqPapelesBorrador = [JSON.parse(JSON.stringify(dup))]; _liqPapelesRender(); });
const filas11 = await p.evaluate(() => document.querySelectorAll('#liqPapelesA .liq-papel, #liqPapelesB .liq-papel').length);
const nRec = (await recDe('2098-07')).papeles.length;
ok('S11: el archivo que está a la vez en el recibo y en el borrador se muestra UNA vez', filas11 === nRec, filas11 + ' vs ' + nRec);
await p.evaluate(() => { _liqPapelesBorrador = []; _liqPapelesRender(); });

// ───── S12: repintar no destruye el N° de factura que se está tipeando ─────
await subir('A', 'factura', PDF);
await p.click('#liqPapelesA input.liq-papel-nro');
await p.keyboard.type('0001-0');
const nodo = await p.evaluate(() => { window.__nodoNro = document.querySelector('#liqPapelesA input.liq-papel-nro'); return true; });
await p.evaluate(() => { for (let i = 0; i < 5; i++) { _liqPapelesRender(); _liqPapelEstadoPintar('A'); } if (typeof _renderRecibosEmpleadoActivo === 'function') _renderRecibosEmpleadoActivo(); });
await p.keyboard.type('0012');
const e12 = await p.evaluate(() => { const i = document.querySelector('#liqPapelesA input.liq-papel-nro'); return { mismo: i === window.__nodoNro, foco: document.activeElement === i, valor: i.value }; });
ok('S12: tras varios repintados el casillero sigue siendo el mismo nodo, con foco y con todo lo tipeado', e12.mismo && e12.foco && e12.valor === '0001-00012', JSON.stringify(e12));
// si el repintado SÍ hace falta (entra otro archivo mientras se tipea) se conserva valor y foco
await p.evaluate(() => { _liqPapelesBorrador = [{ id: 'PAP-S12', parte: 'A', clase: 'comprobante', nombre: 's12.png', tipo: 'image/png', contenido: 'AAAA', nro: '', subidoEn: 5 }]; _liqPapelesRender(); });
const e12b = await p.evaluate(() => { const i = document.querySelector('#liqPapelesA input.liq-papel-nro'); return { foco: document.activeElement === i, valor: i.value }; });
ok('S12: si hay que repintar de verdad, se conserva el valor tipeado y el foco', e12b.foco && e12b.valor === '0001-00012', JSON.stringify(e12b));
await p.keyboard.press('Tab');
await p.waitForTimeout(300);
ok('S12: al salir del casillero el N° se guarda en el recibo', (await recDe('2098-07')).papeles.some(x => x.nro === '0001-00012'));
await p.evaluate(() => { _liqPapelesBorrador = []; _liqPapelesRender(); });

// ───── S13: avance de la compresión legible y varias subidas a la vez ─────
await p.evaluate(() => { window.__lee0 = leerArchivoBase64; window.__esperas = {};
  leerArchivoBase64 = (file, cb) => new Promise(res => { if (cb) cb(3, 40); window.__esperas[file.name] = () => res('data:' + file.type + ';base64,AAAA'); }); });
await setMes('2098-08');
const [fcA] = await Promise.all([p.waitForEvent('filechooser'), p.click('#liqPapelesA button[onclick*="\'factura\'"]')]); await fcA.setFiles({ name: 'lenta-A.pdf', mimeType: 'application/pdf', buffer: PDF.buffer });
await p.waitForTimeout(200);
const [fcB] = await Promise.all([p.waitForEvent('filechooser'), p.click('#liqPapelesB button[onclick*="\'comprobante\'"]')]); await fcB.setFiles({ name: 'lenta-B.png', mimeType: 'image/png', buffer: PNG.buffer });
await p.waitForTimeout(200);
let est = await p.evaluate(() => ({ a: document.querySelector('#liqPapelesA .liq-papel-estado').innerText, b: document.querySelector('#liqPapelesB .liq-papel-estado').innerText }));
ok('S13: el avance dice «página 3 de 40», no un número suelto', /página 3 de 40/.test(est.a), JSON.stringify(est));
ok('S13: dos subidas a la vez muestran cada una su estado, en su parte', /lenta-A\.pdf/.test(est.a) && /lenta-B\.png/.test(est.b), JSON.stringify(est));
await p.evaluate(() => window.__esperas['lenta-B.png']()); await p.waitForTimeout(300);
est = await p.evaluate(() => ({ a: document.querySelector('#liqPapelesA .liq-papel-estado').innerText, b: document.querySelector('#liqPapelesB .liq-papel-estado').innerText }));
ok('S13: cuando termina la B, el estado de la A (que sigue procesando) no se apaga', /lenta-A\.pdf/.test(est.a) && est.b === '', JSON.stringify(est));
// guardar con un archivo procesándose se frena
await p.evaluate(() => { window.__alerts = []; guardarReciboMes(); liquidarYPagar(); });
ok('S13: «Guardar recibo» y «Liquidar y pagar» esperan a que termine el archivo en proceso', (await p.evaluate(() => window.__alerts)).filter(m => /procesando un archivo/.test(m)).length === 2);
// cerrar con un archivo procesándose avisa; si se cierra, el archivo no aparece después
await p.evaluate(() => { window.__conf = false; window.__confirms = []; });
const cerro1 = await p.evaluate(() => cerrarModalLiquidar());
ok('S13: cerrar con un archivo procesándose pregunta y, si dice que no, devuelve false y no cierra', cerro1 === false && await p.isVisible('#modalLiquidar') && (await p.evaluate(() => window.__confirms)).some(m => /procesándose/.test(m)));
await p.evaluate(() => { window.__conf = true; });
const cerro2 = await p.evaluate(() => cerrarModalLiquidar());
await p.evaluate(() => window.__esperas['lenta-A.pdf']()); await p.waitForTimeout(400);
ok('S13: si cierra igual, el archivo que terminaba de procesarse NO queda en un borrador invisible', cerro2 === true && await p.evaluate(() => _liqPapelesBorrador.length === 0 && Object.keys(_liqPapelOps).length === 0));
await p.evaluate(() => { leerArchivoBase64 = window.__lee0; });

// ───── S14: «Cargar un adelanto / pago» respeta el «no» al descartar archivos ─────
await p.evaluate(() => liquidarSueldoEmpleado(0)); await p.waitForTimeout(300);
await setMes('2098-09');
await p.evaluate(() => { _liqPapelesBorrador = [{ id: 'PAP-V1', parte: 'A', clase: 'factura', nombre: 'v1.pdf', tipo: 'application/pdf', contenido: 'AAAA', nro: '', subidoEn: 6 }]; window.__conf = false; window.__vista0 = localStorage.getItem('rk_rem_vista'); empIrACargarPago(); });
ok('S14: al decir que no, el modal sigue abierto y no se cambió de vista ni se abrió el formulario de pago', await p.isVisible('#modalLiquidar') && await p.evaluate(() => localStorage.getItem('rk_rem_vista') === window.__vista0 && getComputedStyle(document.getElementById('remPagoForm')).display === 'none'));
await p.evaluate(() => { window.__conf = true; cerrarModalLiquidar(); });

const malos = res.filter(x => x[0] === 'FALLA');
res.forEach(x => console.log(x.join(' ')));
// los console.error de S9 son los esperados: ahí se simula a propósito una escritura rechazada por la base
const errs = errores.filter(e => !/gsi|Failed to load resource|tradingview|Write too large|guardado en la nube|no se pudo guardar|no quedaron en la base/.test(e));
console.log(`\n${res.length - malos.length}/${res.length} OK` + (errs.length ? '\nerrores de página: ' + JSON.stringify(errs.slice(0, 5)) : ''));
await b.close();
process.exit(malos.length || errs.length ? 1 : 0);
