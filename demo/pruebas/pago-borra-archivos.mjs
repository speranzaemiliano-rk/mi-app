// Borrar un pago (desaplicar, eliminar, borrar el comprobante o el presupuesto que lo contiene) se lleva los archivos que colgaban de él
// (comprobante de la transferencia, DDJJ y acuse de un VEP, guardados en REF_DOCS): antes quedaban huérfanos ocupando lugar en la base.
// Un archivo que otro pago sigue usando (el pago de varias facturas juntas comparte UN comprobante) NO se borra hasta que se va el último.
// Y reemplazar un comprobante borra el viejo recién DESPUÉS de guardar el nuevo. Corre contra la demo (base en memoria).
// Uso: node pago-borra-archivos.mjs   (ver README: hace falta bajar-cdn.sh antes)
import { abrirDemo, entrarAlSistema, irA } from './demo-lib.mjs';
const { b, p, errores } = await abrirDemo();
const res = [];
const ok = (n, c, x) => res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]);
await entrarAlSistema(p);
await p.evaluate(() => {
  window.__alerts = []; window.__confirms = []; window.__conf = true; window.__cola = [];
  window.alert = m => window.__alerts.push(String(m));
  window.confirm = m => { window.__confirms.push(String(m)); return window.__cola.length ? window.__cola.shift() : window.__conf; };
});
await irA(p, 'Facturas');

// ───── ayudas dentro de la app ─────
await p.evaluate(() => {
  window.__T = {
    // crea un archivo en REF_DOCS (como lo dejan _subirComprobantePago y adjuntarCompPago)
    arch: async (id) => { await REF_DOCS.child(id).set({ nombre: id + '.pdf', tipo: 'application/pdf', contenido: 'data:application/pdf;base64,JVBERi0xLjQK' }); },
    existe: (id) => __demoDB.leer(DEMO.base + '/documentos/' + id) != null,
    // pago de factura/documento: monto 500, con los archivos que se pidan
    pago: (pagoId, files, extra) => Object.assign({ pagoId, fecha: '2098-01-02', modalidad: 'B', monto: 500, baseImponible: 0, retenciones: [], totalRet: 0, tipoAB: 'B' }, files || {}, extra || {}),
    comp: (id) => ({ comprobanteId: id, comprobanteNombre: id + '.pdf', comprobanteTipo: 'application/pdf' }),
    ddjj: (id) => ({ ddjjId: id, ddjjNombre: id + '.pdf', ddjjTipo: 'application/pdf' }),
    acuse: (id) => ({ acuseId: id, acuseNombre: id + '.pdf', acuseTipo: 'application/pdf' }),
    fact: async (id, pagos) => {
      const tot = pagos.reduce((s, x) => s + x.monto, 0);
      facturas.push({ id, proveedor: 'PROVEEDOR PRUEBA', numero: id, fecha: '2098-01-01', descripcion: id, importe: 1000, moneda: 'ARS', tipo: 'directo', computaARCA: true, pagado: tot, estado: tot >= 1000 ? 'pagada' : 'parcial', pagosHistorial: pagos });
      await persistirFacturas();
    },
    doc: async (id, pagos) => {
      const tot = pagos.reduce((s, x) => s + x.monto, 0);
      await REF_DOCS.child(id).set({ id, proveedor: 'PROVEEDOR PRUEBA', tipo: 'factura', numero: id, descripcion: id, fecha: '2098-01-01', importe: 1000, moneda: 'ARS', pagado: tot, pagosHistorial: pagos });
    },
    presup: async (id, pagos) => {
      datos.push({ id, proveedor: 'PROVEEDOR PRUEBA', concepto: id, fecha: '2098-01-01', presupuesto: 10000, pagado: 0, pagadoPresupuesto: 0, pagadoMayores: 0, modalidad: 'B', pagosHistorial: pagos });
      await persistir();
    },
    iF: (id) => facturas.findIndex(f => f.id === id),
    iP: (id) => datos.findIndex(d => d.id === id),
    f: (id) => facturas.find(f => f.id === id),
    d: (id) => documentos.find(d => d.id === id),
    pr: (id) => datos.find(d => d.id === id),
  };
});
const esp = (ms = 250) => p.waitForTimeout(ms);
const ex = (id) => p.evaluate(i => __T.existe(i), id);
const todos = async (ids) => { const r = []; for (const i of ids) r.push(await ex(i)); return r; };
const arch = (...ids) => p.evaluate(async (l) => { for (const i of l) await __T.arch(i); }, ids);
const confirmes = () => p.evaluate(() => window.__confirms.slice());
const limpiar = () => p.evaluate(() => { window.__confirms = []; window.__alerts = []; window.__cola = []; window.__conf = true; });
const PDF = { name: 'nuevo.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF') };

// sanidad del arnés: un archivo creado existe, uno que no creamos no
await arch('COMPPAGO-sanidad');
ok('arnés: el archivo de prueba se ve en REF_DOCS y uno inexistente no', await ex('COMPPAGO-sanidad') && !(await ex('COMPPAGO-nada')));
ok('arnés: el archivo NO entra a la lista de comprobantes X (no tiene proveedor)', await p.evaluate(() => documentos.every(d => d.id !== 'COMPPAGO-sanidad')));
await arch('COMPPAGO-ajeno');   // no lo usa ningún pago: no se tiene que tocar nunca

// ───── S1: desaplicar el pago de una factura (comprobante + DDJJ + acuse) ─────
await arch('COMPPAGO-s1', 'DDJJ-s1', 'ACUSE-s1');
await p.evaluate(async () => { await __T.fact('T-S1', [__T.pago('FD-s1', Object.assign({}, __T.comp('COMPPAGO-s1'), __T.ddjj('DDJJ-s1'), __T.acuse('ACUSE-s1')))]); });
ok('S1: parte con los tres archivos en la base', (await todos(['COMPPAGO-s1', 'DDJJ-s1', 'ACUSE-s1'])).every(Boolean));
await limpiar();
await p.evaluate(() => desaplicarPagoFactura(__T.iF('T-S1'), 0));
await esp();
ok('S1: desaplicar el pago borra el comprobante, la DDJJ y el acuse', (await todos(['COMPPAGO-s1', 'DDJJ-s1', 'ACUSE-s1'])).every(x => !x), JSON.stringify(await todos(['COMPPAGO-s1', 'DDJJ-s1', 'ACUSE-s1'])));
ok('S1: la factura vuelve a Pendiente sin pagos', await p.evaluate(() => { const f = __T.f('T-S1'); return f.pagado === 0 && (f.pagosHistorial || []).length === 0; }));
ok('S1: el aviso de confirmar dice que se borran los adjuntos', (await confirmes()).some(m => /archivos adjuntos/.test(m)), JSON.stringify(await confirmes()));
ok('S1: un archivo que ningún pago usaba no se toca', await ex('COMPPAGO-ajeno'));

// ───── S2: pago de DOS facturas con el MISMO comprobante (grupo) ─────
await arch('COMPPAGO-g2', 'DDJJ-g2');
await p.evaluate(async () => {
  const mk = (n) => __T.pago('FD-g2-' + n, Object.assign({}, __T.comp('COMPPAGO-g2'), __T.ddjj('DDJJ-g2')), { grupoPagoId: 'GRUPO-S2' });
  await __T.fact('T-S2A', [mk('a')]);
  await __T.fact('T-S2B', [mk('b')]);
});
await limpiar();
await p.evaluate(() => desaplicarPagoFactura(__T.iF('T-S2A'), 0));
await esp();
ok('S2: desaplicar UNA de las dos facturas deja el archivo (la otra lo sigue usando)', (await todos(['COMPPAGO-g2', 'DDJJ-g2'])).every(Boolean), JSON.stringify(await todos(['COMPPAGO-g2', 'DDJJ-g2'])));
ok('S2: y ese primer aviso NO promete borrar archivos (no se iba ninguno)', !(await confirmes()).some(m => /archivos adjuntos/.test(m)), JSON.stringify(await confirmes()));
await limpiar();
await p.evaluate(() => desaplicarPagoFactura(__T.iF('T-S2B'), 0));
await esp();
ok('S2: desaplicar la ÚLTIMA sí borra el archivo', (await todos(['COMPPAGO-g2', 'DDJJ-g2'])).every(x => !x), JSON.stringify(await todos(['COMPPAGO-g2', 'DDJJ-g2'])));
ok('S2: y este aviso sí lo anuncia', (await confirmes()).some(m => /archivos adjuntos/.test(m)));

// ───── S3: ccDesaplicarPago de un grupo (factura + comprobante X comparten el comprobante) ─────
await arch('COMPPAGO-g3');
await p.evaluate(async () => {
  await __T.fact('T-S3F', [__T.pago('FD-g3-f', __T.comp('COMPPAGO-g3'), { grupoPagoId: 'GRUPO-S3' })]);
  await __T.doc('T-S3D', [__T.pago('FD-g3-d', __T.comp('COMPPAGO-g3'), { grupoPagoId: 'GRUPO-S3' })]);
});
await esp();
ok('S3: arranca con el documento cargado', await p.evaluate(() => !!__T.d('T-S3D')));
// desaplicar sólo el documento: el archivo queda (lo usa la factura)
await limpiar();
await p.evaluate(() => desaplicarPagoDoc('T-S3D', 0));
await esp();
ok('S3: desaplicar el pago del comprobante X deja el archivo (lo usa la factura del grupo)', await ex('COMPPAGO-g3'));
// ahora el grupo de una factura sola
await p.evaluate(async () => { await __T.doc('T-S3D', [__T.pago('FD-g3-d2', __T.comp('COMPPAGO-g3'), { grupoPagoId: 'GRUPO-S3' })]); });
await esp();
await limpiar();
await p.evaluate(() => ccDesaplicarPago('fact', __T.iF('T-S3F'), 0, 'GRUPO-S3'));
await esp();
ok('S3: ccDesaplicarPago del grupo completo borra el archivo compartido', !(await ex('COMPPAGO-g3')));
ok('S3: las dos patas quedaron sin pagos', await p.evaluate(() => (__T.f('T-S3F').pagosHistorial || []).length === 0 && (__T.d('T-S3D').pagosHistorial || []).length === 0));

// ───── S4: desaplicar el pago de un comprobante X solo ─────
await arch('COMPPAGO-s4', 'ACUSE-s4');
await p.evaluate(async () => { await __T.doc('T-S4', [__T.pago('FD-s4', Object.assign({}, __T.comp('COMPPAGO-s4'), __T.acuse('ACUSE-s4')))]); });
await esp();
await limpiar();
await p.evaluate(() => desaplicarPagoDoc('T-S4', 0));
await esp();
ok('S4: desaplicar el pago de un comprobante X borra sus archivos', (await todos(['COMPPAGO-s4', 'ACUSE-s4'])).every(x => !x));

// ───── S5: ✏ Editar pago → reemplazar el comprobante ─────
await arch('COMPPAGO-viejo5', 'COMPPAGO-viejo5g');
await p.evaluate(async () => {
  await __T.fact('T-S5', [__T.pago('FD-s5', __T.comp('COMPPAGO-viejo5'))]);
  // otro pago del mismo grupo que NO se edita: comparte el comprobante viejo
  await __T.fact('T-S5B', [__T.pago('FD-s5b', __T.comp('COMPPAGO-viejo5g'), { grupoPagoId: 'GRUPO-S5' })]);
  await __T.fact('T-S5C', [__T.pago('FD-s5c', __T.comp('COMPPAGO-viejo5g'), { grupoPagoId: 'GRUPO-S5' })]);
});
await limpiar();
await p.evaluate(() => abrirEditarPago('factura', __T.iF('T-S5'), 0));
await p.setInputFiles('#editPagoComprobante', PDF);
await p.evaluate(() => { window.__antes5 = Object.keys(__demoDB.leer(DEMO.base + '/documentos') || {}); });
await p.evaluate(() => guardarEditarPago());
await p.waitForTimeout(700);
const nuevo5 = await p.evaluate(() => __T.f('T-S5').pagosHistorial[0].comprobanteId);
ok('S5: el pago quedó apuntando a un archivo NUEVO', nuevo5 && nuevo5 !== 'COMPPAGO-viejo5' && await ex(nuevo5), String(nuevo5));
ok('S5: el comprobante viejo se borró (después de guardar el nuevo)', !(await ex('COMPPAGO-viejo5')));
// editar uno de los pagos del grupo: el viejo lo usa el otro, queda
await limpiar();
await p.evaluate(() => abrirEditarPago('factura', __T.iF('T-S5B'), 0));
await p.setInputFiles('#editPagoComprobante', PDF);
await p.evaluate(() => guardarEditarPago());
await p.waitForTimeout(700);
ok('S5: reemplazar el comprobante de UNA factura del grupo deja el viejo (lo usa la otra)', await ex('COMPPAGO-viejo5g'));
await limpiar();
await p.evaluate(() => abrirEditarPago('factura', __T.iF('T-S5C'), 0));
await p.setInputFiles('#editPagoComprobante', PDF);
await p.evaluate(() => guardarEditarPago());
await p.waitForTimeout(700);
ok('S5: y al reemplazarlo también en la última, recién ahí se borra', !(await ex('COMPPAGO-viejo5g')));
// editar sin elegir archivo nuevo no toca nada
await arch('COMPPAGO-s5sin');
await p.evaluate(async () => { await __T.fact('T-S5D', [__T.pago('FD-s5d', __T.comp('COMPPAGO-s5sin'))]); });
await p.evaluate(() => abrirEditarPago('factura', __T.iF('T-S5D'), 0));
await p.evaluate(() => { document.getElementById('editPagoFecha').value = '2098-02-02'; guardarEditarPago(); });
await p.waitForTimeout(500);
ok('S5: editar el pago sin elegir archivo nuevo conserva el comprobante', await ex('COMPPAGO-s5sin') && await p.evaluate(() => __T.f('T-S5D').pagosHistorial[0].comprobanteId === 'COMPPAGO-s5sin'));

// ───── S6: ✏ Editar pago → 🗑 Eliminar pago (factura, comprobante X y presupuesto) ─────
await arch('COMPPAGO-s6f', 'DDJJ-s6f', 'COMPPAGO-s6d', 'COMPPAGO-s6p');
await p.evaluate(async () => {
  await __T.fact('T-S6F', [__T.pago('FD-s6f', Object.assign({}, __T.comp('COMPPAGO-s6f'), __T.ddjj('DDJJ-s6f')))]);
  await __T.doc('T-S6D', [__T.pago('FD-s6d', __T.comp('COMPPAGO-s6d'))]);
  await __T.presup('T-S6P', [{ pagoId: 'PG-s6p', fecha: '2098-01-02', modalidad: 'B', capital: 500, mayores: 0, baseImponible: 0, retenciones: [], totalRet: 0, tipoAB: 'B', ...__T.comp('COMPPAGO-s6p') }]);
});
await esp();
await limpiar();
await p.evaluate(() => { abrirEditarPago('factura', __T.iF('T-S6F'), 0); eliminarPagoEditado(); });
await esp();
ok('S6: eliminar el pago de una factura borra su comprobante y su DDJJ', (await todos(['COMPPAGO-s6f', 'DDJJ-s6f'])).every(x => !x));
await p.evaluate(() => { abrirEditarPago('doc', 'T-S6D', 0); eliminarPagoEditado(); });
await esp();
ok('S6: eliminar el pago de un comprobante X borra su comprobante', !(await ex('COMPPAGO-s6d')));
await p.evaluate(() => { abrirEditarPago('presup', __T.iP('T-S6P'), 0); eliminarPagoEditado(); });
await esp();
ok('S6: eliminar el pago de un presupuesto borra su comprobante', !(await ex('COMPPAGO-s6p')));
ok('S6: los tres avisos de confirmar anuncian el borrado de adjuntos', (await confirmes()).filter(m => /archivos adjuntos/.test(m)).length === 3, JSON.stringify(await confirmes()));

// ───── S7: 🗑 en Caja General sobre el pago de un comprobante X (eliminarMovPagoDoc) ─────
await arch('COMPPAGO-s7a', 'COMPPAGO-s7b', 'ACUSE-s7b');
await p.evaluate(async () => { await __T.doc('T-S7', [__T.pago('FD-s7a', __T.comp('COMPPAGO-s7a')), __T.pago('FD-s7b', Object.assign({}, __T.comp('COMPPAGO-s7b'), __T.acuse('ACUSE-s7b')))]); });
await esp();
await limpiar();
await p.evaluate(() => { window.__cola = [true, false]; eliminarMovPagoDoc('T-S7', 'FD-s7a'); });   // quitar el pago a: sí · borrar también el documento: no
await esp();
ok('S7: quitar un pago del comprobante borra SU comprobante y deja el del otro pago', !(await ex('COMPPAGO-s7a')) && await ex('COMPPAGO-s7b') && await ex('ACUSE-s7b'));
await limpiar();
await p.evaluate(() => { window.__cola = [true, true]; eliminarMovPagoDoc('T-S7', 'FD-s7b'); });   // el último pago: sí · y el documento entero: sí
await esp();
ok('S7: quitar el último pago borra también sus archivos', (await todos(['COMPPAGO-s7b', 'ACUSE-s7b'])).every(x => !x));
// borrar el documento entero llevándose un pago que quedaba
await arch('COMPPAGO-s7c', 'COMPPAGO-s7d');
await p.evaluate(async () => { await __T.doc('T-S7B', [__T.pago('FD-s7c', __T.comp('COMPPAGO-s7c')), __T.pago('FD-s7d', __T.comp('COMPPAGO-s7d'))]); });
await esp();
await limpiar();
await p.evaluate(() => { window.__cola = [true, true]; eliminarMovPagoDoc('T-S7B', 'FD-s7c'); });
await esp(500);
ok('S7: si además se elige borrar el documento entero, los archivos de los pagos que quedaban también se van', (await todos(['COMPPAGO-s7c', 'COMPPAGO-s7d'])).every(x => !x) && await p.evaluate(() => !__T.d('T-S7B')), JSON.stringify(await todos(['COMPPAGO-s7c', 'COMPPAGO-s7d'])));

// ───── S8: eliminar la factura / el comprobante X / el presupuesto entero ─────
await arch('COMPPAGO-s8a', 'COMPPAGO-s8b', 'DDJJ-s8b', 'COMPPAGO-s8g');
await p.evaluate(async () => {
  await __T.fact('T-S8', [__T.pago('FD-s8a', __T.comp('COMPPAGO-s8a')), __T.pago('FD-s8b', Object.assign({}, __T.comp('COMPPAGO-s8b'), __T.ddjj('DDJJ-s8b'))), __T.pago('FD-s8g', __T.comp('COMPPAGO-s8g'), { grupoPagoId: 'GRUPO-S8' })]);
  await __T.fact('T-S8G', [__T.pago('FD-s8gg', __T.comp('COMPPAGO-s8g'), { grupoPagoId: 'GRUPO-S8' })]);
});
await limpiar();
await p.evaluate(() => eliminarFactura(__T.iF('T-S8')));
await esp(500);
ok('S8: eliminar la factura borra los archivos de TODOS sus pagos', (await todos(['COMPPAGO-s8a', 'COMPPAGO-s8b', 'DDJJ-s8b'])).every(x => !x));
ok('S8: pero deja el comprobante que comparte con otra factura del grupo', await ex('COMPPAGO-s8g'));
ok('S8: la factura ya no está', await p.evaluate(() => !__T.f('T-S8')));
ok('S8: el aviso de confirmar anuncia el borrado de adjuntos', (await confirmes()).some(m => /Eliminar esta factura/.test(m) && /archivos adjuntos/.test(m)), JSON.stringify(await confirmes()));
await p.evaluate(() => eliminarFactura(__T.iF('T-S8G')));
await esp(500);
ok('S8: al eliminar la otra factura del grupo, el comprobante compartido se va', !(await ex('COMPPAGO-s8g')));

await arch('COMPPAGO-s8d', 'ACUSE-s8d');
await p.evaluate(async () => { await __T.doc('T-S8D', [__T.pago('FD-s8d', Object.assign({}, __T.comp('COMPPAGO-s8d'), __T.acuse('ACUSE-s8d')))]); });
await esp();
await limpiar();
await p.evaluate(() => eliminarDoc('T-S8D'));
await esp(500);
ok('S8: eliminar el comprobante X borra los archivos de su pago', (await todos(['COMPPAGO-s8d', 'ACUSE-s8d'])).every(x => !x) && await p.evaluate(() => !__T.d('T-S8D')));

await arch('COMPPAGO-s8p1', 'COMPPAGO-s8p2');
await p.evaluate(async () => {
  await __T.presup('T-S8P', [
    { pagoId: 'PG-s8p1', fecha: '2098-01-02', modalidad: 'B', capital: 100, mayores: 0, baseImponible: 0, retenciones: [], totalRet: 0, tipoAB: 'B', ...__T.comp('COMPPAGO-s8p1') },
    { pagoId: 'PG-s8p2', fecha: '2098-01-03', modalidad: 'B', capital: 100, mayores: 0, baseImponible: 0, retenciones: [], totalRet: 0, tipoAB: 'B', ...__T.comp('COMPPAGO-s8p2') },
    { pagoId: 'FACT-x', origenFacturaId: 'x', fecha: '2098-01-04', modalidad: 'A', capital: 50, mayores: 0, retenciones: [], totalRet: 0 }   // pago-espejo: sin archivos
  ]);
});
await limpiar();
await p.evaluate(() => eliminarFila(__T.iP('T-S8P')));
await esp(500);
ok('S8: eliminar el presupuesto borra los archivos de sus pagos (el espejo no estorba)', (await todos(['COMPPAGO-s8p1', 'COMPPAGO-s8p2'])).every(x => !x) && await p.evaluate(() => !__T.pr('T-S8P')));

// ───── S9: aprobar una solicitud de borrado (admin → superadmin) ─────
await arch('COMPPAGO-s9f', 'COMPPAGO-s9p');
await p.evaluate(async () => {
  await __T.fact('T-S9F', [__T.pago('FD-s9f', __T.comp('COMPPAGO-s9f'))]);
  await __T.presup('T-S9P', [{ pagoId: 'PG-s9p', fecha: '2098-01-02', modalidad: 'B', capital: 100, mayores: 0, baseImponible: 0, retenciones: [], totalRet: 0, tipoAB: 'B', ...__T.comp('COMPPAGO-s9p') }]);
  const f = __T.f('T-S9F'), d = __T.pr('T-S9P');
  __demoDB.escribir('solicitudesBorrado/sol-s9f', { tipo: 'factura', descripcion: 'Factura T-S9F', estado: 'pendiente', itemData: { numero: f.numero, proveedor: f.proveedor, fecha: f.fecha, importe: f.importe } });
  __demoDB.escribir('solicitudesBorrado/sol-s9p', { tipo: 'presupuesto', descripcion: 'Presupuesto T-S9P', estado: 'pendiente', itemData: { proveedor: d.proveedor, concepto: d.concepto, fecha: d.fecha, presupuesto: d.presupuesto } });
});
await limpiar();
await p.evaluate(() => aprobarSolicitud('sol-s9f'));
await p.waitForTimeout(700);
await p.evaluate(() => aprobarSolicitud('sol-s9p'));
await p.waitForTimeout(700);
ok('S9: aprobar el borrado de una factura y de un presupuesto borra los archivos de sus pagos', (await todos(['COMPPAGO-s9f', 'COMPPAGO-s9p'])).every(x => !x) && await p.evaluate(() => !__T.f('T-S9F') && !__T.pr('T-S9P')), JSON.stringify(await p.evaluate(() => window.__alerts)));

// ───── S10: 🔄 Reemplazar el comprobante después (adjuntarCompPago) ─────
await arch('COMPPAGO-viejo10', 'DDJJ-viejo10', 'COMPPAGO-viejo10g');
await p.evaluate(async () => {
  await __T.fact('T-S10', [__T.pago('FD-s10', Object.assign({}, __T.comp('COMPPAGO-viejo10'), __T.ddjj('DDJJ-viejo10')))]);
  await __T.fact('T-S10A', [__T.pago('FD-s10a', __T.comp('COMPPAGO-viejo10g'), { grupoPagoId: 'GRUPO-S10' })]);
  await __T.fact('T-S10B', [__T.pago('FD-s10b', __T.comp('COMPPAGO-viejo10g'), { grupoPagoId: 'GRUPO-S10' })]);
});
await limpiar();
await p.evaluate(() => adjuntarCompPago('factura', __T.iF('T-S10'), 0, null));
await p.setInputFiles('#_inpAdjCompPago', PDF);
await p.waitForTimeout(700);
const nuevo10 = await p.evaluate(() => __T.f('T-S10').pagosHistorial[0].comprobanteId);
ok('S10: reemplazar el comprobante con 🔄 borra el viejo y deja el nuevo', nuevo10 !== 'COMPPAGO-viejo10' && await ex(nuevo10) && !(await ex('COMPPAGO-viejo10')), String(nuevo10));
ok('S10: reemplazar el comprobante no toca la DDJJ del mismo pago', await ex('DDJJ-viejo10'));
await p.evaluate(() => adjuntarCompPago('factura', __T.iF('T-S10'), 0, null, 'ddjj'));
await p.setInputFiles('#_inpAdjCompPago', PDF);
await p.waitForTimeout(700);
ok('S10: reemplazar la DDJJ con 📋 borra la vieja', !(await ex('DDJJ-viejo10')) && await p.evaluate(() => { const x = __T.f('T-S10').pagosHistorial[0]; return !!x.ddjjId && x.ddjjId !== 'DDJJ-viejo10'; }));
// el pago de varias facturas juntas: el comprobante nuevo se cuelga de TODAS, así que el viejo no lo usa nadie
await p.evaluate(() => adjuntarCompPago('factura', __T.iF('T-S10A'), 0, 'GRUPO-S10'));
await p.setInputFiles('#_inpAdjCompPago', PDF);
await p.waitForTimeout(700);
ok('S10: reemplazar el comprobante de un pago de varias facturas borra el viejo (ya no lo usa ninguna)', !(await ex('COMPPAGO-viejo10g')) && await p.evaluate(() => { const a = __T.f('T-S10A').pagosHistorial[0].comprobanteId, b = __T.f('T-S10B').pagosHistorial[0].comprobanteId; return a && a === b && a !== 'COMPPAGO-viejo10g'; }));
// adjuntar el PRIMER comprobante a un pago que no tenía no borra nada
await p.evaluate(async () => { await __T.fact('T-S10C', [__T.pago('FD-s10c', {})]); });
const antes10 = await p.evaluate(() => Object.keys(__demoDB.leer(DEMO.base + '/documentos') || {}).length);
await p.evaluate(() => adjuntarCompPago('factura', __T.iF('T-S10C'), 0, null));
await p.setInputFiles('#_inpAdjCompPago', PDF);
await p.waitForTimeout(700);
ok('S10: adjuntar el primer comprobante a un pago que no tenía agrega el archivo y no borra otro', await p.evaluate(() => !!__T.f('T-S10C').pagosHistorial[0].comprobanteId) && (await p.evaluate(() => Object.keys(__demoDB.leer(DEMO.base + '/documentos') || {}).length)) === antes10 + 1);

// ───── S11: si la base rechaza el guardado, los archivos NO se borran ─────
await arch('COMPPAGO-s11');
await p.evaluate(async () => { await __T.fact('T-S11', [__T.pago('FD-s11', __T.comp('COMPPAGO-s11'))]); window.__persist0 = persistirFacturas; persistirFacturas = () => Promise.reject(new Error('guardado rechazado (simulado)')); });
await limpiar();
await p.evaluate(() => eliminarFactura(__T.iF('T-S11')));
await esp(500);
ok('S11: con el guardado rechazado, el comprobante sigue en la base (la factura aún lo referencia allá)', await ex('COMPPAGO-s11'));
await p.evaluate(() => { persistirFacturas = window.__persist0; });

// ───── S12: pagos viejos / sin archivos / datos raros no rompen nada ─────
await p.evaluate(async () => {
  await __T.fact('T-S12', [{ pagoId: 'FP-viejo', fecha: '2098-01-02', monto: 500, modalidad: 'B' }]);
  await __T.doc('T-S12D', [{ pagoId: 'FP-viejod', fecha: '2098-01-02', monto: 500, modalidad: 'B' }]);
});
await esp();
await limpiar();
await p.evaluate(() => desaplicarPagoFactura(__T.iF('T-S12'), 0));
await p.evaluate(() => desaplicarPagoDoc('T-S12D', 0));
await p.evaluate(() => eliminarFactura(__T.iF('T-S12')));
await esp();
ok('S12: pagos sin archivos se desaplican y eliminan sin error y sin avisar de borrado de adjuntos', !(await confirmes()).some(m => /archivos adjuntos/.test(m)) && await p.evaluate(() => !__T.f('T-S12')));
ok('S12: la ayuda tolera valores vacíos (pago nulo, lista vacía, id repetido)', await p.evaluate(() => {
  try { return _borrarArchivosDePago(null).length === 0 && _borrarArchivosDePago([]).length === 0 && _borrarArchivosDePago([null, undefined, {}]).length === 0 && _archivosDePago(null).length === 0 && _archivosDePago({ comprobanteId: 'X', ddjjId: 'X' }).length === 1; } catch (e) { return false; }
}).catch(() => false));
ok('S12: nunca borra un comprobante X (un registro con proveedor) aunque un pago lo nombrara por error', await p.evaluate(async () => {
  await __T.doc('T-S12X', []);
  await new Promise(r => setTimeout(r, 300));
  const borrados = _borrarArchivosDePago([{ comprobanteId: 'T-S12X' }]);
  await new Promise(r => setTimeout(r, 200));
  return borrados.length === 0 && __T.existe('T-S12X');
}).catch(() => false));

// ───── cierre: el archivo ajeno nunca se tocó ─────
ok('el archivo que ningún pago usaba sigue en la base después de todo', await ex('COMPPAGO-ajeno'));
ok('no quedó ningún archivo de prueba colgado (todos los de los pagos borrados se fueron)', await p.evaluate(() => {
  const restos = Object.keys(__demoDB.leer(DEMO.base + '/documentos') || {}).filter(k => /^(COMPPAGO|DDJJ|ACUSE)-/.test(k) && k !== 'COMPPAGO-ajeno' && k !== 'COMPPAGO-sanidad' && k !== 'COMPPAGO-s11');
  // los que quedan son los archivos NUEVOS que cuelgan de pagos que siguen existiendo (S5, S10)
  const enUso = new Set();
  [].concat(facturas, documentos, datos).forEach(it => (it.pagosHistorial || []).forEach(x => ['comprobanteId', 'ddjjId', 'acuseId'].forEach(k => x[k] && enUso.add(x[k]))));
  window.__restos = restos.filter(k => !enUso.has(k));
  return window.__restos.length === 0;
}), JSON.stringify(await p.evaluate(() => window.__restos)));

const malos = res.filter(x => x[0] === 'FALLA');
res.forEach(x => console.log(x.join(' ')));
// los console.error de S11 son los esperados: ahí se simula a propósito un guardado rechazado
const errs = errores.filter(e => !/gsi|Failed to load resource|tradingview|guardado rechazado/.test(e));
console.log(`\n${res.length - malos.length}/${res.length} OK` + (errs.length ? '\nerrores de página: ' + JSON.stringify(errs.slice(0, 5)) : ''));
await b.close();
process.exit(malos.length || errs.length ? 1 : 0);
