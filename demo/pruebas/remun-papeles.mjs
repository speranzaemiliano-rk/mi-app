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

// ───── S6: un archivo demasiado pesado ─────
await p.evaluate(() => liquidarSueldoEmpleado(0));
await p.waitForTimeout(300);
await setMes('2098-06');
await p.evaluate(() => { window.__alerts = []; });
await subir('A', 'comprobante', { name: 'enorme.bin', mimeType: 'application/octet-stream', buffer: Buffer.alloc(9 * 1024 * 1024, 1) });
ok('S6: un archivo que pasa el límite se rechaza con aviso y no queda en el borrador', (await p.evaluate(() => window.__alerts)).some(m => /supera los/.test(m)) && await p.evaluate(() => _liqPapelesBorrador.length === 0));

const malos = res.filter(x => x[0] === 'FALLA');
res.forEach(x => console.log(x.join(' ')));
const errs = errores.filter(e => !/gsi|Failed to load resource|tradingview/.test(e));
console.log(`\n${res.length - malos.length}/${res.length} OK` + (errs.length ? '\nerrores de página: ' + JSON.stringify(errs.slice(0, 5)) : ''));
await b.close();
process.exit(malos.length || errs.length ? 1 : 0);
