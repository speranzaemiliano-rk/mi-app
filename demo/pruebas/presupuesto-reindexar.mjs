// Borrar un presupuesto NO debe dejar mal los vínculos posicionales (`presupuestoIdx`) de los comprobantes ni los ítems del Plan de Trabajo.
// El vínculo factura → presupuesto es el ÍNDICE de datos[]: `eliminarFila` y `aprobarSolicitud` hacían datos.splice sin reindexar, así que
// los comprobantes de los presupuestos de más abajo quedaban apuntando al presupuesto de arriba (o a ninguno) y los del borrado apuntaban a otro.
// Corre contra la demo (base en memoria).  Uso: DEMO_CDN=.../demo/pruebas/cdn node presupuesto-reindexar.mjs
import { abrirDemo, entrarAlSistema, irA } from './demo-lib.mjs';
const { b, p, errores } = await abrirDemo();
const res = [];
const ok = (n, c, x) => res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]);
await entrarAlSistema(p);
await p.evaluate(() => { window.__alerts = []; window.__confirms = []; window.alert = m => window.__alerts.push(String(m)); window.confirm = m => { window.__confirms.push(String(m)); return true; }; });
await irA(p, 'Home');
// la demo carga documentos y emitidos "por detrás": esperar a que lleguen
await p.waitForFunction(() => _docsCargados && _emitidosCargados && datos.length && facturas.length, null, { timeout: 20000 }).catch(() => {});
const espera = (ms = 500) => p.waitForTimeout(ms);
const raw = (ruta) => p.evaluate(async (r) => { const s = await db.ref(getBasePath() + '/' + r).once('value'); return s.val(); }, ruta);

// «A quién apunta» cada comprobante / ítem del plan, mirando el presupuesto por su ID (no por la posición): lo que NO tiene que cambiar al borrar otro.
const vinculos = () => p.evaluate(() => {
  const pid = (e) => (e.presupuestoIdx != null && e.presupuestoIdx !== '' && datos[e.presupuestoIdx]) ? datos[e.presupuestoIdx].id : '(sin presupuesto)';
  const local = (e) => !e._compartidoDe || e.presupuestoLocal === true;
  const o = {};
  facturas.forEach(f => { if (local(f) && f.presupuestoIdx != null && f.presupuestoIdx !== '') o['f:' + f.id] = pid(f); });
  documentos.forEach(d => { if (local(d) && d.presupuestoIdx != null && d.presupuestoIdx !== '') o['d:' + d.id] = pid(d); });
  comprobantesEmitidos.forEach(e => { if (local(e) && e.presupuestoIdx != null && e.presupuestoIdx !== '') o['e:' + e.id] = pid(e); });
  planTrabajo.forEach(et => (et.items || []).forEach(it => { if (it.src === 'presup') o['p:' + et.id + ':' + it.proveedor + '|' + it.concepto] = (datos[it.idx] ? datos[it.idx].id : '(sin presupuesto)'); }));
  return o;
});
// lo esperado tras borrar el presupuesto `idBorrado`: todo igual, salvo lo que apuntaba a él (los de comprobantes quedan sin vínculo; los del plan se van)
const esperado = (antes, idBorrado) => {
  const o = {};
  Object.keys(antes).forEach(k => { if (antes[k] === idBorrado) { if (!k.startsWith('p:')) o[k] = null; } else o[k] = antes[k]; });
  return o;
};
const diferencias = (antes, despues, idBorrado) => {
  const esp = esperado(antes, idBorrado), mal = [];
  Object.keys(esp).forEach(k => { const real = (k in despues) ? despues[k] : null; const want = esp[k]; if (want === null ? (real !== null && real !== '(sin presupuesto)') : real !== want) mal.push(k + ' → esperaba ' + want + ' y apunta a ' + real); });
  Object.keys(despues).forEach(k => { if (!(k in esp) && despues[k] !== '(sin presupuesto)') mal.push(k + ' apareció apuntando a ' + despues[k]); });
  return mal;
};

// ───── S1: con los datos de la demo (presupuestos, facturas, comprobantes X y plan ya vinculados por posición) ─────
const hay = await p.evaluate(() => ({ datos: datos.length, f: facturas.filter(f => f.presupuestoIdx != null).length, d: documentos.filter(d => d.presupuestoIdx != null).length, plan: planTrabajo.reduce((s, et) => s + (et.items || []).filter(i => i.src === 'presup').length, 0) }));
ok('S1: la demo trae presupuestos con facturas, documentos y plan vinculados', hay.datos >= 8 && hay.f >= 5 && hay.plan >= 3, JSON.stringify(hay));
for (const pos of [0, 4, -1]) {
  const antes = await vinculos();
  const info = await p.evaluate((pos) => { const i = pos < 0 ? datos.length - 1 : pos; return { i, id: datos[i].id, concepto: datos[i].concepto, n: datos.length }; }, pos);
  const nVinc = Object.keys(antes).filter(k => antes[k] === info.id).length;
  await p.evaluate(i => eliminarFila(i), info.i);
  await espera(700);
  const despues = await vinculos();
  const mal = diferencias(antes, despues, info.id);
  ok('S1: borrar «' + info.concepto + '» (posición ' + info.i + ', ' + nVinc + ' vínculos suyos) deja cada comprobante en SU presupuesto', mal.length === 0, mal.slice(0, 5).join(' | '));
  ok('S1: ... y el presupuesto se fue (' + info.n + ' → ' + (info.n - 1) + ')', await p.evaluate(([id, n]) => datos.length === n - 1 && !datos.some(d => d.id === id), [info.id, info.n]));
}
// el índice que quedó guardado en la base coincide con el que hay en memoria (se persistió, no quedó sólo en pantalla)
const enBase = await p.evaluate(async () => {
  const leer = async (r) => (await db.ref(getBasePath() + '/' + r).once('value')).val() || {};
  const F = await leer('facturas'), DC = await leer('documentos'), EM = await leer('comprobantesEmitidos'), PL = await leer('planTrabajo');
  const mal = [];
  facturas.forEach(f => { const g = F[f.id]; if (g && String(g.presupuestoIdx) !== String(f.presupuestoIdx == null ? 'undefined' : f.presupuestoIdx)) mal.push('factura ' + f.id + ': base=' + g.presupuestoIdx + ' memoria=' + f.presupuestoIdx); });
  documentos.forEach(d => { const g = DC[d.id]; if (g && String(g.presupuestoIdx) !== String(d.presupuestoIdx == null ? 'undefined' : d.presupuestoIdx)) mal.push('doc ' + d.id + ': base=' + g.presupuestoIdx + ' memoria=' + d.presupuestoIdx); });
  comprobantesEmitidos.forEach(e => { const g = EM[e.id]; if (g && String(g.presupuestoIdx) !== String(e.presupuestoIdx == null ? 'undefined' : e.presupuestoIdx)) mal.push('emitido ' + e.id + ': base=' + g.presupuestoIdx + ' memoria=' + e.presupuestoIdx); });
  return mal;
});
ok('S1: lo guardado en la base coincide con lo que hay en memoria', enBase.length === 0, enBase.slice(0, 4).join(' | '));
// el pago-espejo sigue donde tiene que estar: cada comprobante con pagos y vínculo ve SU presupuesto
const espejosMal = await p.evaluate(() => {
  const mal = [];
  [...facturas, ...documentos].forEach(x => {
    if (!x.id || x.presupuestoIdx == null || x._compartidoDe) return;
    const d = datos[x.presupuestoIdx]; if (!d) { mal.push(x.id + ' apunta a un índice vacío'); return; }
    const tiene = (d.pagosHistorial || []).some(h => h.origenFacturaId === x.id);
    if ((x.pagado || 0) > 0 && !tiene) mal.push(x.id + ' (pagado ' + x.pagado + ') ya no tiene su espejo en «' + d.concepto + '»');
  });
  return mal;
});
ok('S1: cada comprobante pagado sigue teniendo su pago-espejo en el presupuesto al que apunta', espejosMal.length === 0, espejosMal.slice(0, 4).join(' | '));

// ───── S2: tres presupuestos con comprobantes en cada uno; se borra el del medio ─────
const hoy = new Date().toISOString().slice(0, 10);
const armar = () => p.evaluate((hoy) => {
  const n0 = datos.length;
  ['A', 'B', 'C'].forEach(L => datos.push({ id: 'tp_' + L, proveedor: 'Proveedor Test ' + L, concepto: 'Obra test ' + L, fecha: hoy, presupuesto: 1000, pagado: 0, pagosHistorial: [], rubro: '', subrubro: '', entrega: hoy }));
  persistir();
  return n0;
}, hoy);
const n0 = await armar(); await espera();
const idxDe = (L) => p.evaluate((L) => datos.findIndex(d => d.id === 'tp_' + L), L);
const iA = await idxDe('A'), iB = await idxDe('B'), iC = await idxDe('C');
ok('S2: los tres presupuestos quedaron seguidos al final', iA === n0 && iB === n0 + 1 && iC === n0 + 2, [iA, iB, iC].join(','));
await p.evaluate(([iA, iB, iC, hoy]) => {
  const mk = (L, i) => {
    facturas.push({ id: 'tf_' + L, proveedor: 'Proveedor Test ' + L, numero: '0001-0000' + L, fecha: hoy, importe: 100, pagado: 100, estado: 'pagado', moneda: 'ARS', presupuestoIdx: i, presupuestoPorcentaje: 30, presupuestoComentario: 'anticipo ' + L, pagosHistorial: [{ pagoId: 'pg_' + L, fecha: hoy, monto: 100, modalidad: 'A' }] });
    _reconciliarFacturaEnPresupuesto(i, { id: 'tf_' + L, pagado: 100, fecha: hoy, numero: '0001-0000' + L });
    REF_DOCS.child('td_' + L).set({ id: 'td_' + L, proveedor: 'Proveedor Test ' + L, tipo: 'x', fecha: hoy, numero: 'X-' + L, importe: 50, pagado: 0, presupuestoIdx: i, presupuestoPorcentaje: 20, presupuestoComentario: 'doc ' + L });
    comprobantesEmitidos.push({ id: 'te_' + L, tipoDoc: 'recibo', nro: 'R-' + L, fecha: hoy, total: 10, cliente: 'Cliente ' + L, presupuestoIdx: i, pagado: 0 });
    return i;
  };
  mk('A', iA); mk('B', iB); mk('C', iC);
  // un emitido CONFIDENCIAL también va con su presupuesto (se oculta en pantalla, no en los datos)
  comprobantesEmitidos.push({ id: 'te_Cconf', tipoDoc: 'recibo', nro: 'R-Cc', fecha: hoy, total: 10, cliente: 'Reservado', confidencial: true, presupuestoIdx: iC, pagado: 0 });
  comprobantesEmitidos.push({ id: 'te_Bconf', tipoDoc: 'recibo', nro: 'R-Bc', fecha: hoy, total: 10, cliente: 'Reservado', confidencial: true, presupuestoIdx: iB, pagado: 0 });
  // copias compartidas desde otro proyecto: su índice es el del ORIGEN; sólo la que se vinculó acá (presupuestoLocal) es de este proyecto
  facturas.push({ id: 'tf_Cshare', proveedor: 'Proveedor Test C', numero: 'S-1', fecha: hoy, importe: 10, pagado: 0, estado: 'pendiente', moneda: 'ARS', _compartidoDe: 'otro_proyecto', presupuestoIdx: iC });
  facturas.push({ id: 'tf_Clocal', proveedor: 'Proveedor Test C', numero: 'S-2', fecha: hoy, importe: 10, pagado: 0, estado: 'pendiente', moneda: 'ARS', _compartidoDe: 'otro_proyecto', presupuestoLocal: true, presupuestoIdx: iC });
  facturas.push({ id: 'tf_Bshare', proveedor: 'Proveedor Test B', numero: 'S-3', fecha: hoy, importe: 10, pagado: 0, estado: 'pendiente', moneda: 'ARS', _compartidoDe: 'otro_proyecto', presupuestoIdx: iB });
  persistirFacturas(); persistirEmitidos();
  planTrabajo.push({ id: 'tpl_test', nombre: 'Etapa test', fechaInicio: hoy, fechaFin: hoy, items: [
    { src: 'presup', idx: iA, proveedor: 'Proveedor Test A', concepto: 'Obra test A', presupuesto: 1000, pagado: 100 },
    { src: 'presup', idx: iB, proveedor: 'Proveedor Test B', concepto: 'Obra test B', presupuesto: 1000, pagado: 100 },
    { src: 'presup', idx: iC, proveedor: 'Proveedor Test C', concepto: 'Obra test C', presupuesto: 1000, pagado: 100 },
    { src: 'factura', idx: 0, proveedor: 'No es un presupuesto', concepto: 'ítem de factura con idx 2 posiciones', presupuesto: 5, pagado: 0 }] });
  persistirPlan();
}, [iA, iB, iC, hoy]);
await espera(900);
const s2 = await p.evaluate(() => {
  const gi = (L) => datos.findIndex(d => d.id === 'tp_' + L);
  return { iC: gi('C'), fC: facturas.find(f => f.id === 'tf_C').presupuestoIdx, dC: documentos.find(d => d.id === 'td_C').presupuestoIdx, eC: comprobantesEmitidos.find(e => e.id === 'te_C').presupuestoIdx, nDocs: documentos.filter(d => /^td_/.test(d.id)).length };
});
ok('S2: armado: las facturas, el documento y el emitido de C apuntan a su posición', s2.fC === s2.iC && s2.dC === s2.iC && s2.eC === s2.iC && s2.nDocs === 3, JSON.stringify(s2));

const antes2 = await vinculos();
const idxB = await idxDe('B');
await p.evaluate(() => { window.__alerts.length = 0; window.__confirms.length = 0; });
await p.evaluate(i => eliminarFila(i), idxB);
await espera(900);
const d2 = await p.evaluate(() => {
  const gi = (L) => datos.findIndex(d => d.id === 'tp_' + L);
  const iA = gi('A'), iB = gi('B'), iC = gi('C');
  const tiene = (x) => (x.presupuestoIdx !== undefined && x.presupuestoIdx !== null);
  const F = (id) => facturas.find(f => f.id === id), D = (id) => documentos.find(d => d.id === id), E = (id) => comprobantesEmitidos.find(e => e.id === id);
  return { iA, iB, iC,
    fA: F('tf_A').presupuestoIdx, dA: D('td_A').presupuestoIdx, eA: E('te_A').presupuestoIdx,
    fC: F('tf_C').presupuestoIdx, dC: D('td_C').presupuestoIdx, eC: E('te_C').presupuestoIdx, eCconf: E('te_Cconf').presupuestoIdx,
    fB: tiene(F('tf_B')), fBpct: F('tf_B').presupuestoPorcentaje, fBcom: F('tf_B').presupuestoComentario, dB: tiene(D('td_B')), dBpct: D('td_B').presupuestoPorcentaje, eB: tiene(E('te_B')), eBconf: tiene(E('te_Bconf')),
    fCpct: F('tf_C').presupuestoPorcentaje, fCcom: F('tf_C').presupuestoComentario,
    share: F('tf_Cshare').presupuestoIdx, local: F('tf_Clocal').presupuestoIdx, bShare: F('tf_Bshare').presupuestoIdx, bShareLocal: F('tf_Bshare').presupuestoLocal,
    sinVinculo: facturas.filter(f => f.presupuestoIdx === undefined).length };
});
ok('S2: se borró el del medio (B)', d2.iB === -1 && d2.iA >= 0 && d2.iC === d2.iA + 1, JSON.stringify(d2));
ok('S2: lo de A queda igual (está por encima del borrado)', d2.fA === d2.iA && d2.dA === d2.iA && d2.eA === d2.iA, JSON.stringify(d2));
ok('S2: la factura, el documento y el emitido de C (el de ABAJO) bajaron una posición y SIGUEN en C', d2.fC === d2.iC && d2.dC === d2.iC && d2.eC === d2.iC, JSON.stringify(d2));
ok('S2: el emitido CONFIDENCIAL de C también se reindexó', d2.eCconf === d2.iC, JSON.stringify(d2));
ok('S2: lo de B quedó SIN vínculo (ni factura, ni documento, ni emitido, ni el confidencial)', !d2.fB && !d2.dB && !d2.eB && !d2.eBconf, JSON.stringify(d2));
ok('S2: ... y sin el % ni el comentario del vínculo que se fue', (d2.fBpct == null) && !d2.fBcom && (d2.dBpct == null), JSON.stringify(d2));
ok('S2: lo de C conserva su % y su comentario', d2.fCpct === 30 && d2.fCcom === 'anticipo C', JSON.stringify(d2));
ok('S2: la copia compartida de C (índice del ORIGEN) NO se tocó', d2.share === s2.iC, JSON.stringify(d2));
ok('S2: la copia compartida vinculada acá (presupuestoLocal) SÍ se reindexó', d2.local === d2.iC, JSON.stringify(d2));
ok('S2: la copia compartida que apuntaba a B (sin vínculo local) tampoco se tocó', d2.bShare === s2.iC - 1 && !d2.bShareLocal, JSON.stringify(d2));
const conf2 = await p.evaluate(() => window.__confirms.slice());
ok('S2: antes de borrar se le avisa lo que tiene aplicado (1 factura, 1 comprobante X, 2 emitidos —uno confidencial—, 1 ítem del plan)', conf2.length === 1 && /1 factura, 1 comprobante X recibido, 2 comprobantes emitidos, 1 ítem del Plan de Trabajo/.test(conf2[0]) && /sin presupuesto/.test(conf2[0]), JSON.stringify(conf2));
const despues2 = await vinculos();
const mal2 = diferencias(antes2, despues2, 'tp_B');
ok('S2: ningún otro vínculo de toda la base cambió de presupuesto', mal2.length === 0, mal2.slice(0, 5).join(' | '));
const plan2 = await p.evaluate(() => { const et = planTrabajo.find(e => e.id === 'tpl_test'); return et.items.map(i => i.src + ':' + (i.src === 'presup' ? (datos[i.idx] || {}).id : i.idx) + '/' + i.idx); });
ok('S2: el plan de trabajo: el ítem de B se fue, A y C siguen en sus presupuestos y el ítem de FACTURA no se tocó', plan2.length === 3 && plan2[0].startsWith('presup:tp_A') && plan2[1].startsWith('presup:tp_C') && plan2[2] === 'factura:0/0', JSON.stringify(plan2));
// el espejo de C (vive dentro del presupuesto, que se movió con su dato) sigue consistente
const esp2 = await p.evaluate(() => {
  const dC = datos.find(d => d.id === 'tp_C'), fC = facturas.find(f => f.id === 'tf_C');
  return { espejo: (dC.pagosHistorial || []).filter(h => h.origenFacturaId === 'tf_C').length, pagado: dC.pagado, deComp: (_presupDeComprobante(fC) || {}).id, vincDeC: _presupVinculados(datos.indexOf(dC)).facturas.map(o => o.f.id).sort().join(','), huerfano: (dC.pagosHistorial || []).some(h => _espejoHuerfano(h)) };
});
ok('S2: el pago-espejo de C sigue en C y la factura de C resuelve a C', esp2.espejo === 1 && esp2.pagado === 100 && esp2.deComp === 'tp_C' && !esp2.huerfano, JSON.stringify(esp2));
ok('S2: _presupVinculados(C) devuelve sus facturas (la propia y la compartida vinculada acá, no la del origen)', esp2.vincDeC === 'tf_C,tf_Clocal', esp2.vincDeC);
// lo mismo, leído de la BASE
const base2 = await p.evaluate(async () => {
  const leer = async (r) => (await db.ref(getBasePath() + '/' + r).once('value')).val() || {};
  const F = await leer('facturas'), DC = await leer('documentos'), EM = await leer('comprobantesEmitidos'), PL = await leer('planTrabajo');
  const iC = datos.findIndex(d => d.id === 'tp_C');
  const plan = Object.values(PL).find(e => e.id === 'tpl_test');
  return { fC: F.tf_C.presupuestoIdx, fB: F.tf_B.presupuestoIdx, fBpct: F.tf_B.presupuestoPorcentaje, fBcom: F.tf_B.presupuestoComentario, dC: DC.td_C.presupuestoIdx, dB: DC.td_B.presupuestoIdx, dBpct: DC.td_B.presupuestoPorcentaje, dBcom: DC.td_B.presupuestoComentario,
    docC: DC.td_C, eC: EM.te_C.presupuestoIdx, eB: EM.te_B.presupuestoIdx, eCc: EM.te_Cconf.presupuestoIdx, eBc: EM.te_Bconf.presupuestoIdx, share: F.tf_Cshare.presupuestoIdx, local: F.tf_Clocal.presupuestoIdx, iC,
    planIdx: (plan.items || []).map(i => i.src + i.idx).join(','), tpB: (await db.ref(getBasePath() + '/datos').once('value')).val() };
});
ok('S2 (base): C reindexado en facturas, documentos y emitidos (incluido el confidencial)', base2.fC === base2.iC && base2.dC === base2.iC && base2.eC === base2.iC && base2.eCc === base2.iC, JSON.stringify(base2).slice(0, 400));
ok('S2 (base): el documento reindexado conserva el resto de sus campos (no se reescribió entero ni quedó a medias)', base2.docC && base2.docC.proveedor === 'Proveedor Test C' && base2.docC.importe === 50 && base2.docC.numero === 'X-C' && base2.docC.presupuestoPorcentaje === 20 && base2.docC.presupuestoComentario === 'doc C', JSON.stringify(base2.docC));
ok('S2 (base): B sin vínculo en la base (también % y comentario)', base2.fB === undefined && base2.fBpct === undefined && base2.fBcom === undefined && base2.dB === undefined && base2.dBpct === undefined && base2.dBcom === undefined && base2.eB === undefined && base2.eBc === undefined, JSON.stringify(base2).slice(0, 400));
ok('S2 (base): las copias compartidas quedaron como estaban y la vinculada acá se reindexó', base2.share === s2.iC && base2.local === base2.iC, JSON.stringify(base2).slice(0, 300));
ok('S2 (base): el plan guardado ya no tiene el ítem de B y el de C bajó', /^presup\d+,presup\d+,factura0$/.test(base2.planIdx) && base2.planIdx.split(',')[1] === 'presup' + base2.iC, base2.planIdx);
ok('S2 (base): el presupuesto B ya no está en la base', !Object.values(base2.tpB || {}).some(d => d && d.id === 'tp_B'));

// ───── S3: el otro camino de borrado: aprobar la solicitud de un usuario que no es superadmin ─────
const antes3 = await vinculos();
const info3 = await p.evaluate(() => { const d = datos.find(x => x.id === 'tp_A'); return { id: d.id, proveedor: d.proveedor, concepto: d.concepto, fecha: d.fecha, presupuesto: d.presupuesto, idx: datos.indexOf(d), e: empresaActual.id, ep: empresaActual.nombre, py: proyectoActual.id, pn: proyectoActual.nombre }; });
await p.evaluate(async (i) => {
  await REF_SOLICITUDES.child('sol_test').set({ tipo: 'presupuesto', descripcion: 'Presupuesto test A', itemData: { proveedor: i.proveedor, concepto: i.concepto, fecha: i.fecha, presupuesto: i.presupuesto }, empresa: i.e, empresaNombre: i.ep, proyecto: i.py, proyectoNombre: i.pn, solicitadoPor: 'x@y.com', solicitadoUid: 'u', solicitadoEn: Date.now(), estado: 'pendiente', revisadoPor: null, revisadoEn: null, motivoRechazo: null });
  await aprobarSolicitud('sol_test');
}, info3);
await espera(900);
const despues3 = await vinculos();
const mal3 = diferencias(antes3, despues3, 'tp_A');
ok('S3: aprobarSolicitud también reindexa: borrar A (la primera de las tres) deja C en C', mal3.length === 0, mal3.slice(0, 5).join(' | '));
const s3 = await p.evaluate(() => ({ sigue: datos.some(d => d.id === 'tp_A'), fA: (facturas.find(f => f.id === 'tf_A') || {}).presupuestoIdx, fC: facturas.find(f => f.id === 'tf_C').presupuestoIdx, iC: datos.findIndex(d => d.id === 'tp_C')}));
ok('S3: el presupuesto A se borró, su factura quedó sin vínculo y la de C apunta a C', !s3.sigue && s3.fA === undefined && s3.fC === s3.iC, JSON.stringify(s3));

// ───── S4: si los comprobantes recibidos todavía no llegaron NO se borra (no se podría reindexar) ─────
const iCant = await idxDe('C');
await p.evaluate(() => { window.__alerts.length = 0; window.__docsAntes = _docsCargados; _docsCargados = false; });
await p.evaluate(i => eliminarFila(i), iCant);
await espera(400);
const s4 = await p.evaluate(() => ({ sigue: datos.some(d => d.id === 'tp_C'), alerts: window.__alerts.slice() }));
ok('S4: con los comprobantes recibidos sin cargar, el presupuesto NO se borra', s4.sigue, JSON.stringify(s4));
ok('S4: ... y se le avisa a la persona que espere', s4.alerts.some(a => /cargando|esper/i.test(a)), JSON.stringify(s4.alerts));
await p.evaluate(() => { _docsCargados = true; });
await p.evaluate(() => { window.__alerts.length = 0; _emitidosCargados = false; });
await p.evaluate(i => eliminarFila(i), iCant);
await espera(400);
const s4b = await p.evaluate(() => ({ sigue: datos.some(d => d.id === 'tp_C'), alerts: window.__alerts.slice() }));
ok('S4: lo mismo con los comprobantes emitidos sin cargar', s4b.sigue && s4b.alerts.some(a => /cargando|esper/i.test(a)), JSON.stringify(s4b));
await p.evaluate(() => { _emitidosCargados = true; });

// ───── S5: borrar uno que no tiene nada vinculado no toca las otras colecciones ─────
await p.evaluate(() => { datos.push({ id: 'tp_solo', proveedor: 'Sin nada', concepto: 'Presupuesto solo', fecha: new Date().toISOString().slice(0, 10), presupuesto: 10, pagado: 0, pagosHistorial: [] }); persistir(); });
await espera();
const antes5 = await vinculos();
const antesPlan = await raw('planTrabajo');
await p.evaluate(() => eliminarFila(datos.findIndex(d => d.id === 'tp_solo')));
await espera(600);
const despues5 = await vinculos();
ok('S5: borrar un presupuesto sin nada vinculado no cambia ningún vínculo', JSON.stringify(antes5) === JSON.stringify(despues5), '');
ok('S5: ... y la base del plan quedó idéntica', JSON.stringify(await raw('planTrabajo')) === JSON.stringify(antesPlan));

// ───── S5b: si la persona cancela el cartel de confirmación no se toca nada ─────
const antes5b = await vinculos();
const n5b = await p.evaluate(() => datos.length);
await p.evaluate(() => { window.confirm = () => false; });
await p.evaluate(() => eliminarFila(datos.findIndex(d => d.id === 'tp_C')));
await espera(500);
const despues5b = await vinculos();
ok('S5b: cancelar el borrado deja presupuestos y vínculos como estaban', (await p.evaluate(() => datos.length)) === n5b && JSON.stringify(antes5b) === JSON.stringify(despues5b), '');
await p.evaluate(() => { window.confirm = m => { window.__confirms.push(String(m)); return true; }; });

// ───── S6: sin errores de JS ─────
const err = errores.filter(e => !/favicon|manifest|net::ERR/i.test(e));
ok('S6: sin errores de JavaScript', err.length === 0, err.slice(0, 4).join(' | '));

await b.close();
const fallas = res.filter(r => r[0] !== 'OK ');
res.forEach(r => console.log(r[0] + ' ' + r[1] + (r[2] ? '   → ' + r[2] : '')));
console.log('\n' + (res.length - fallas.length) + '/' + res.length + ' OK');
process.exit(fallas.length ? 1 : 0);
