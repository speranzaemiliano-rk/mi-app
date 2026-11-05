// Remuneraciones → «Liquidar y pagar» y las consolidaciones a Caja/Banco: el pago tiene que quedar MARCADO como consolidado.
// El listener de Firebase reemplaza los objetos de remunPagos en cada evento (incluido el eco de la propia escritura), así que el
// objeto que se tenía en la mano antes de un await ya no es el que está en el array: marcarlo no cambiaba nada ni se guardaba,
// el pago figuraba «pendiente de consolidar» con su movimiento ya hecho y consolidar de nuevo duplicaba el egreso.
// Cubre: Liquidar y pagar (banco + efectivo, sólo efectivo, sólo banco, dos pagos del mismo mes), la consolidación por tildado y el
// «Mandar a Caja/Banco» del tablero con un reemplazo de objetos EN MEDIO de la escritura, los pagos que ya habían quedado
// sin marca (movimiento hecho) —se marcan sin duplicar y se pueden borrar con su movimiento—, y el adjunto de una consolidación.
// Corre contra la demo (base en memoria). Uso: node liquidar-pago-consolidado.mjs   (ver README: hace falta bajar-cdn.sh antes)
import { abrirDemo, entrarAlSistema, irA } from './demo-lib.mjs';
const { b, p, errores } = await abrirDemo();
const res = [];
const ok = (n, c, x) => res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]);
await entrarAlSistema(p);
await p.evaluate(() => { window.__alerts = []; window.__confirms = []; window.__conf = true;
  window.alert = m => window.__alerts.push(String(m));
  // la pregunta de «¿Imprimir el recibo ahora?» se contesta que no (abriría una ventana de impresión)
  window.confirm = m => { window.__confirms.push(String(m)); return /Imprimir el recibo/.test(String(m)) ? false : window.__conf; };
  window.open = () => null; });
await irA(p, 'Remuneraciones');

// ───── ayudas dentro de la página ─────
await p.evaluate(() => {
  const val = async (ref) => { const s = await ref.once('value'); return s.val(); };
  window.__T = {
    // el pago tal como está en memoria
    mem: (id) => { const x = remunPagos.find(y => y && y.id === id); return x ? { consolidado: !!x.consolidado, consId: x.consolidadoId || null, fecha: x.consolidadoFecha || null } : null; },
    // el pago tal como quedó en la base
    nube: async (id) => { const v = await val(REF_REMUN_PAGOS.child(id)); return v ? { consolidado: !!v.consolidado, consId: v.consolidadoId || null } : null; },
    // los movimientos de «Remuneraciones» de una consolidación, en memoria y en la base
    movsMem: (consId) => ingGeneral.filter(m => m && m.referencia === consId).map(m => ({ id: m.id, tipo: m.tipo, monto: m.monto })),
    movsNube: async (consId) => { const v = await val(REF_ING_GENERAL); return Object.values(v || {}).filter(m => m && m.referencia === consId).map(m => ({ id: m.id, tipo: m.tipo, monto: m.monto })); },
    todosRemun: () => ingGeneral.filter(m => m && m.origen === 'Remuneraciones').length,
    cons: (consId) => { const c = remunConsolidados.find(x => x && x.id === consId); return c ? { pagoIds: c.pagoIds, banco: c.totalBanco, efe: c.totalEfectivo, adj: (c.adjuntos || []).length } : null; },
    consNube: async (consId) => { const v = await val(REF_REMUN_CONSOL.child(consId)); return v ? { pagoIds: Object.values(v.pagoIds || {}), adj: Object.values(v.adjuntos || {}).length } : null; },
    // un pago nuevo, sin consolidar
    nuevoPago: async (id, mes, banco, efe) => {
      remunPagos.push({ id, nombre: remuneraciones[0].nombre, mes, fecha: '2098-01-10', montoBanco: banco, montoEfectivo: efe, tipo: 'pago', detalle: '', adjunto: null,
        empresaId: empresaActual.id, proyectoId: proyectoActual.id, consolidado: false, creadoEn: Date.now() });
      await persistirRemunPagos();
    },
    // el estado en que el error dejaba las cosas: el movimiento y la consolidación existen, el pago quedó sin marca
    danado: async (id, consId, mes, efe) => {
      ingGeneral.push({ id: consId + '-CAJA', tipo: 'mov_egreso_caja', fecha: '2098-01-10', origen: 'Remuneraciones', referencia: consId, moneda: 'ARS', monto: efe, obs: 'Remuneraciones', esEgreso: true, tipoAB: 'B' });
      await persistirIngGeneral();
      await window.__T.nuevoPago(id, mes, 0, efe);
      remunConsolidados.push({ id: consId, fecha: '2098-01-10', cuentaId: '', cuentaNombre: '', totalBanco: 0, totalEfectivo: efe, pagoIds: [id], cajaMovId: consId + '-CAJA', bancoMovId: '',
        empresaId: empresaActual.id, proyectoId: proyectoActual.id, adjuntos: [], creadoEn: Date.now() });
      await persistirRemunConsolidados();
    }
  };
});
const alertas = () => p.evaluate(() => window.__alerts.slice());
const limpiar = () => p.evaluate(() => { window.__alerts = []; window.__confirms = []; window.__conf = true; });
const setMes = async (m) => { await p.evaluate(m => { const el = document.getElementById('empLiqMes'); el.value = m; el.dispatchEvent(new Event('change')); }, m); await p.waitForTimeout(250); };

// «Liquidar y pagar» de verdad (con el modal): devuelve el id del pago que se creó
const liquidar = async (mes, banco, efe, empIdx = 0) => {
  await limpiar();
  await p.evaluate(i => liquidarSueldoEmpleado(i), empIdx);
  await p.waitForTimeout(400);
  await setMes(mes);
  await p.evaluate(([bn, ef]) => {
    document.getElementById('liqPagoBanco').value = bn || '';
    document.getElementById('liqPagoEfectivo').value = ef || '';
    document.getElementById('liqPagoFecha').value = '2098-01-15';
    const s = document.getElementById('liqPagoCuenta'); if (s && s.options.length) s.value = s.options[0].value;
  }, [banco, efe]);
  const antes = await p.evaluate(() => remunPagos.map(x => x.id));
  await p.evaluate(() => liquidarYPagar());
  await p.waitForTimeout(300);
  const nuevo = await p.evaluate(a => remunPagos.filter(x => !a.includes(x.id)).map(x => x.id), antes);
  await p.evaluate(() => { window.__conf = true; if (document.getElementById('modalLiquidar') && getComputedStyle(document.getElementById('modalLiquidar')).display !== 'none') cerrarModalLiquidar(); });
  return nuevo;
};
// lo que se ve en el tablero «Sueldos del mes» y en la lista de pagos de ese mes
const pantalla = (mes) => p.evaluate(m => {
  const sel = document.getElementById('remMesSelector'); sel.value = m; _renderSueldosMes();
  const d = document.getElementById('remPagoMesFiltro'), h = document.getElementById('remPagoMesHasta'); d.value = m; h.value = m; _renderRemunPagos();
  const t = document.getElementById('remPagosBody').innerText;
  d.value = ''; h.value = '';
  return { recuadro: getComputedStyle(document.getElementById('remMesConsolPend')).display, txtRecuadro: document.getElementById('remMesConsolPendTxt').innerText,
           consolidados: (t.match(/Consolidado/g) || []).length, pendientes: (t.match(/Pendiente/g) || []).length };
}, mes);

ok('hay empleados y cuentas bancarias en la demo', await p.evaluate(() => remuneraciones.length >= 2 && cuentasBancarias.length >= 1));
ok('el usuario de la demo es el dueño (ve Remuneraciones)', await p.evaluate(() => _esDuenoRemun()));

// ───── S1: Liquidar y pagar con parte por banco y parte en efectivo ─────
const M1 = '2098-03';
const ids1 = await liquidar(M1, 80000, 20000);
ok('S1: «Liquidar y pagar» creó UN pago', ids1.length === 1, JSON.stringify(ids1));
const id1 = ids1[0];
// la consolidación se busca por el pago (no por la marca del pago, que es justamente lo que se está comprobando)
const consId1 = await p.evaluate(i => ((remunConsolidados.find(c => c && (c.pagoIds || []).includes(i))) || {}).id || null, id1);
ok('S1: existe la consolidación del pago', !!consId1);
const m1 = await p.evaluate(i => __T.mem(i), id1);
ok('S1: el pago figura CONSOLIDADO en memoria, con fecha e id de consolidación', m1 && m1.consolidado === true && !!m1.consId && m1.fecha === '2098-01-15', JSON.stringify(m1));
const n1 = await p.evaluate(i => __T.nube(i), id1);
ok('S1: y también en la base', n1 && n1.consolidado === true && n1.consId === m1.consId, JSON.stringify(n1));
const mv1 = consId1 ? await p.evaluate(c => __T.movsMem(c), consId1) : [];
const mvN1 = consId1 ? await p.evaluate(c => __T.movsNube(c), consId1) : [];
ok('S1: el movimiento de Caja/Banco existe UNA sola vez (1 egreso de caja + 1 salida de banco) en memoria', mv1.length === 2 && mv1.filter(x => x.tipo === 'mov_egreso_caja').length === 1 && mv1.filter(x => x.tipo === 'mov_banco_salida').length === 1, JSON.stringify(mv1));
ok('S1: y en la base, con los importes del reparto', mvN1.length === 2 && mvN1.find(x => x.tipo === 'mov_egreso_caja').monto === 20000 && mvN1.find(x => x.tipo === 'mov_banco_salida').monto === 80000, JSON.stringify(mvN1));
const c1 = consId1 ? await p.evaluate(c => __T.cons(c), consId1) : null;
ok('S1: hay UNA consolidación que apunta a ese pago', c1 && c1.pagoIds.length === 1 && c1.pagoIds[0] === id1 && c1.banco === 80000 && c1.efe === 20000, JSON.stringify(c1));
const pan1 = await pantalla(M1);
ok('S1: el recuadro «falta mandar a Caja/Banco» NO aparece', pan1.recuadro === 'none', JSON.stringify(pan1));
ok('S1: la lista de pagos del mes lo muestra «✓ Consolidado» y ninguno «Pendiente»', pan1.consolidados >= 1 && pan1.pendientes === 0, JSON.stringify(pan1));
ok('S1: ningún pago del mes quedó pendiente de consolidar', await p.evaluate(m => _remPagosDelProyecto().filter(r => r.mes === m && !r.consolidado).length === 0, M1));
// «Mandar a Caja/Banco» de un clic no tiene nada que mandar: no duplica el egreso
const antes1 = await p.evaluate(() => __T.todosRemun());
await limpiar();
await p.evaluate(m => { document.getElementById('remMesSelector').value = m; return consolidarMesTodo(); }, M1);
ok('S1: consolidar el mes de nuevo avisa que no hay pendientes y NO agrega movimientos', (await alertas()).some(a => /No hay pagos pendientes/.test(a)) && await p.evaluate(() => __T.todosRemun()) === antes1, JSON.stringify(await alertas()));

// ───── S2: sólo efectivo / sólo banco ─────
const [idE] = await liquidar('2098-04', 0, 50000);
const mE = await p.evaluate(i => __T.mem(i), idE);
const consDe = (i) => p.evaluate(i => ((remunConsolidados.find(c => c && (c.pagoIds || []).includes(i))) || {}).id || null, i);
const mvE = await p.evaluate(c => __T.movsNube(c), await consDe(idE));
ok('S2: sólo efectivo → consolidado, y un único movimiento de caja en la base', mE && mE.consolidado && mvE.length === 1 && mvE[0].tipo === 'mov_egreso_caja' && mvE[0].monto === 50000, JSON.stringify([mE, mvE]));
ok('S2: sólo efectivo → en la base el pago también está consolidado', (await p.evaluate(i => __T.nube(i), idE)).consolidado === true);
const [idB] = await liquidar('2098-05', 60000, 0);
const mB = await p.evaluate(i => __T.mem(i), idB);
const mvB = await p.evaluate(c => __T.movsNube(c), await consDe(idB));
ok('S2: sólo banco → consolidado, y una única salida de banco en la base', mB && mB.consolidado && mvB.length === 1 && mvB[0].tipo === 'mov_banco_salida' && mvB[0].monto === 60000, JSON.stringify([mB, mvB]));
ok('S2: sólo banco → en la base el pago también está consolidado', (await p.evaluate(i => __T.nube(i), idB)).consolidado === true);
ok('S2: los tres meses quedan sin recuadro de pendiente', (await pantalla('2098-04')).recuadro === 'none' && (await pantalla('2098-05')).recuadro === 'none');

// ───── S3: dos pagos del mismo mes (parcial + resto): cada uno su movimiento, sin pisarse ─────
const [idP1] = await liquidar('2098-06', 0, 30000);
const [idP2] = await liquidar('2098-06', 0, 20000);
const mP1 = await p.evaluate(i => __T.mem(i), idP1), mP2 = await p.evaluate(i => __T.mem(i), idP2);
ok('S3: los dos pagos del mes quedan consolidados, cada uno con su consolidación', mP1 && mP2 && mP1.consolidado && mP2.consolidado && mP1.consId !== mP2.consId, JSON.stringify([mP1, mP2]));
const mvP = [...await p.evaluate(c => __T.movsNube(c), await consDe(idP1)), ...await p.evaluate(c => __T.movsNube(c), await consDe(idP2))];
ok('S3: hay exactamente 2 movimientos (30.000 y 20.000), no 3 ni 4', mvP.length === 2 && mvP.map(x => x.monto).sort().join() === '20000,30000', JSON.stringify(mvP));
ok('S3: el mes no muestra pendientes', (await pantalla('2098-06')).recuadro === 'none');

// ───── S4: consolidación por tildado, con otra persona tocando el pago EN MEDIO de la escritura ─────
// (el listener reemplaza los objetos de remunPagos mientras _remConsolidarCore espera a que se guarde el movimiento)
const instalarPing = (fn, refExpr, idExpr) => p.evaluate(([fn, refExpr, idExpr]) => {
  window.__orig = window.__orig || {};
  if (!window.__orig[fn]) window.__orig[fn] = (0, eval)(fn);
  const orig = window.__orig[fn];
  window.__pingFn = async function () { const r = await orig.apply(this, arguments); await (0, eval)(refExpr).child((0, eval)(idExpr)).child('ping').set(Date.now()); return r; };
  (0, eval)(fn + ' = window.__pingFn');
}, [fn, refExpr, idExpr]);
const quitarPing = (fn) => p.evaluate(fn => { if (window.__orig && window.__orig[fn]) { window.__pingFn = window.__orig[fn]; (0, eval)(fn + ' = window.__pingFn'); } }, fn);

await p.evaluate(() => { window.__pingId = 'RP-T4'; });
await p.evaluate(() => __T.nuevoPago('RP-T4', '2098-07', 70000, 30000));
await instalarPing('persistirIngGeneral', 'REF_REMUN_PAGOS', 'window.__pingId');
await limpiar();
const objViejo4 = await p.evaluate(() => { window.__viejo = remunPagos.find(x => x.id === 'RP-T4'); return true; });
await p.evaluate(() => { _renderRemunPagos(); document.getElementById('remConsolFecha').value = '2098-02-01'; const s = document.getElementById('remConsolCuenta'); s.value = s.options[0].value; remPagoToggleUno('RP-T4', true); });
await p.evaluate(() => consolidarRemunPagos());
await p.waitForTimeout(300);
ok('S4: el listener reemplazó el objeto durante la escritura (la prueba reproduce la condición)', await p.evaluate(() => remunPagos.find(x => x.id === 'RP-T4') !== window.__viejo));
const m4 = await p.evaluate(() => __T.mem('RP-T4'));
ok('S4: consolidación por tildado → el pago figura consolidado en memoria y en la base', m4 && m4.consolidado && m4.fecha === '2098-02-01' && (await p.evaluate(() => __T.nube('RP-T4'))).consolidado === true, JSON.stringify(m4));
const mv4 = await p.evaluate(c => __T.movsNube(c), await consDe('RP-T4'));
ok('S4: un solo movimiento de caja y uno de banco', mv4.length === 2, JSON.stringify(mv4));
ok('S4: lo tildado se destildó (ya no queda seleccionado)', await p.evaluate(() => !_remPagoSel['RP-T4']));

// ───── S5: «Mandar a Caja/Banco» de un clic desde Sueldos del mes, con el mismo reemplazo en medio ─────
await p.evaluate(() => { window.__pingId = 'RP-T5a'; });
await p.evaluate(() => __T.nuevoPago('RP-T5a', '2098-08', 0, 11000));
await p.evaluate(() => __T.nuevoPago('RP-T5b', '2098-08', 0, 22000));
await limpiar();
await p.evaluate(() => { document.getElementById('remMesSelector').value = '2098-08'; _renderSueldosMes(); });
await p.evaluate(() => consolidarMesTodo());
await p.waitForTimeout(300);
const a5 = await p.evaluate(() => __T.mem('RP-T5a')), b5 = await p.evaluate(() => __T.mem('RP-T5b'));
ok('S5: «Mandar a Caja/Banco» deja los DOS pagos consolidados (aunque se reemplazó el objeto de uno)', a5 && b5 && a5.consolidado && b5.consolidado && a5.consId === b5.consId, JSON.stringify([a5, b5]));
ok('S5: y también en la base', (await p.evaluate(() => __T.nube('RP-T5a'))).consolidado === true && (await p.evaluate(() => __T.nube('RP-T5b'))).consolidado === true);
const mv5 = await p.evaluate(c => __T.movsNube(c), await consDe('RP-T5a'));
ok('S5: un único movimiento de caja por 33.000 (la suma de los dos)', mv5.length === 1 && mv5[0].monto === 33000, JSON.stringify(mv5));
ok('S5: el tablero no muestra el recuadro de pendiente', (await pantalla('2098-08')).recuadro === 'none');
await quitarPing('persistirIngGeneral');

// ───── S6: pagos que YA habían quedado sin marca (el error de antes): se marcan sin duplicar el movimiento ─────
await p.evaluate(() => __T.danado('RP-T6', 'CONS-T6', '2098-09', 45000));
ok('S6: el estado de partida es el del error (movimiento y consolidación hechos, pago pendiente)', await p.evaluate(() => __T.mem('RP-T6').consolidado === false && __T.movsMem('CONS-T6').length === 1 && !!__T.cons('CONS-T6')));
const antes6 = await p.evaluate(() => ({ movs: __T.todosRemun(), cons: remunConsolidados.length }));
await limpiar();
await p.evaluate(() => { document.getElementById('remMesSelector').value = '2098-09'; _renderSueldosMes(); });
await p.evaluate(() => consolidarMesTodo());
await p.waitForTimeout(300);
const m6 = await p.evaluate(() => __T.mem('RP-T6'));
ok('S6: consolidar lo marca con la consolidación que YA existía', m6 && m6.consolidado && m6.consId === 'CONS-T6' && m6.fecha === '2098-01-10', JSON.stringify(m6));
ok('S6: sin agregar ningún movimiento ni consolidación nueva', await p.evaluate(a => __T.todosRemun() === a.movs && remunConsolidados.length === a.cons, antes6));
ok('S6: queda guardado en la base', (await p.evaluate(() => __T.nube('RP-T6'))).consolidado === true);
ok('S6: avisa que el movimiento ya estaba', (await alertas()).some(a => /ya estaban? en Caja\/Banco/.test(a)), JSON.stringify(await alertas()));
ok('S6: el recuadro de pendiente desaparece', (await pantalla('2098-09')).recuadro === 'none');
// mezcla: uno sin marca + uno realmente pendiente → sólo el pendiente genera movimiento
await p.evaluate(() => __T.danado('RP-T7a', 'CONS-T7', '2098-10', 15000));
await p.evaluate(() => __T.nuevoPago('RP-T7b', '2098-10', 0, 9000));
const antes7 = await p.evaluate(() => ({ movs: __T.todosRemun(), cons: remunConsolidados.length }));
await limpiar();
await p.evaluate(() => { document.getElementById('remMesSelector').value = '2098-10'; _renderSueldosMes(); });
await p.evaluate(() => consolidarMesTodo());
await p.waitForTimeout(300);
const a7 = await p.evaluate(() => __T.mem('RP-T7a')), b7 = await p.evaluate(() => __T.mem('RP-T7b'));
ok('S6: mezcla → el viejo se marca con su consolidación y el nuevo con una consolidación NUEVA', a7 && b7 && a7.consolidado && b7.consolidado && a7.consId === 'CONS-T7' && b7.consId && b7.consId !== 'CONS-T7', JSON.stringify([a7, b7]));
ok('S6: mezcla → un solo movimiento nuevo, por 9.000 (no 24.000)', await p.evaluate(a => __T.todosRemun() === a.movs + 1 && remunConsolidados.length === a.cons + 1, antes7) && (await p.evaluate(c => __T.movsNube(c), b7.consId)).map(x => x.monto).join() === '9000');
ok('S6: mezcla → la consolidación nueva sólo lleva el pago nuevo', ((await p.evaluate(c => __T.cons(c), b7.consId)) || {}).pagoIds?.join() === 'RP-T7b');

// ───── S7: borrar un pago que había quedado sin marca se lleva también su movimiento ─────
await p.evaluate(() => __T.danado('RP-T8', 'CONS-T8', '2098-11', 12000));
await limpiar();
await p.evaluate(() => _remBorrarPagoCompleto('RP-T8'));
await p.waitForTimeout(300);
ok('S7: el pago se borró', await p.evaluate(() => !remunPagos.some(x => x.id === 'RP-T8')) && (await p.evaluate(() => __T.nube('RP-T8'))) === null);
ok('S7: y se llevó su movimiento de Caja y su consolidación (si no, quedaba un egreso colgado)', await p.evaluate(() => __T.movsMem('CONS-T8').length === 0 && !__T.cons('CONS-T8')) && (await p.evaluate(() => __T.movsNube('CONS-T8'))).length === 0 && (await p.evaluate(() => __T.consNube('CONS-T8'))) === null);
ok('S7: avisó que también se borra el movimiento', (await p.evaluate(() => window.__confirms)).some(m => /También se borra su movimiento/.test(m)));
// un pago pendiente común (sin movimiento) se sigue borrando como siempre, sin tocar movimientos de otros
await p.evaluate(() => __T.nuevoPago('RP-T9', '2098-11', 0, 777));
const antes9 = await p.evaluate(() => __T.todosRemun());
await limpiar();
await p.evaluate(() => _remBorrarPagoCompleto('RP-T9'));
ok('S7: un pago pendiente común se borra sin tocar ningún movimiento', await p.evaluate(() => !remunPagos.some(x => x.id === 'RP-T9')) && await p.evaluate(() => __T.todosRemun()) === antes9 && !(await p.evaluate(() => window.__confirms)).some(m => /También se borra su movimiento/.test(m)));

// ───── S8: adjuntar el comprobante a una consolidación, con el reemplazo de objetos mientras se lee el archivo ─────
const consAdj = consId1;
await p.evaluate(c => { window.__leeOrig = leerArchivoBase64; window.__consAdj = c;
  leerArchivoBase64 = async function () { await new Promise(r => setTimeout(r, 50)); await REF_REMUN_CONSOL.child(window.__consAdj).child('ping').set(Date.now()); return 'QUFB'; }; }, consAdj);
await p.evaluate(c => { _remConsTarget = c; }, consAdj);
await limpiar();
await p.setInputFiles('#remConsAdjInput', { name: 'transferencia.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%%EOF') });
await p.waitForTimeout(800);
ok('S8: el comprobante queda en la consolidación en memoria', (await p.evaluate(c => __T.cons(c), consAdj)).adj === 1);
ok('S8: y se guardó en la base (no sólo en el objeto viejo)', (await p.evaluate(c => __T.consNube(c), consAdj)).adj === 1, JSON.stringify(await p.evaluate(c => __T.consNube(c), consAdj)));
await p.evaluate(() => { leerArchivoBase64 = window.__leeOrig; });

// ───── S9: revertir una consolidación hecha por «Liquidar y pagar» libera el pago y borra el movimiento ─────
await limpiar();
await p.evaluate(c => revertirConsolidado(c), consId1);
await p.waitForTimeout(300);
ok('S9: revertir deja el pago pendiente en memoria y en la base', (await p.evaluate(i => __T.mem(i), id1)).consolidado === false && (await p.evaluate(i => __T.nube(i), id1)).consolidado === false);
ok('S9: y se llevó los dos movimientos', (await p.evaluate(c => __T.movsNube(c), consId1)).length === 0);
// ahora SÍ es un pendiente real: consolidarlo de nuevo genera el movimiento una vez
await limpiar();
await p.evaluate(m => { document.getElementById('remMesSelector').value = m; _renderSueldosMes(); }, M1);
ok('S9: el recuadro de pendiente vuelve a aparecer (es un pendiente de verdad)', (await pantalla(M1)).recuadro !== 'none');
await p.evaluate(() => { const s = document.getElementById('remMesConsolCuenta'); s.value = s.options[0].value; });
await p.evaluate(() => consolidarMesTodo());
await p.waitForTimeout(300);
const m9 = await p.evaluate(i => __T.mem(i), id1);
ok('S9: consolidarlo de nuevo lo marca y genera el movimiento UNA vez', m9.consolidado && (await p.evaluate(c => __T.movsNube(c), m9.consId)).length === 2);

const malos = res.filter(x => x[0] === 'FALLA');
res.forEach(x => console.log(x.join(' ')));
const errs = errores.filter(e => !/gsi|Failed to load resource|tradingview/.test(e));
console.log(`\n${res.length - malos.length}/${res.length} OK` + (errs.length ? '\nerrores de página: ' + JSON.stringify(errs.slice(0, 5)) : ''));
await b.close();
process.exit(malos.length || errs.length ? 1 : 0);
