// Alquileres: al actualizar el canon, si alcanza a meses YA COBRADOS se pregunta si se actualizan (lo cobrado queda a cuenta y queda un saldo) o no.
// Corre contra la demo (base en memoria). Uso: node alquiler-actualizacion-cobrados.mjs   (ver README: hace falta bajar-cdn.sh antes)
import fs from 'fs';
import { abrirDemo, entrarAlSistema } from './demo-lib.mjs';
const { b, p, errores } = await abrirDemo();
const res = [];
const ok = (n, c, x) => res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]);
await entrarAlSistema(p);
await p.evaluate(() => { window.__alerts = []; window.alert = m => window.__alerts.push(String(m)); window.confirm = () => true; });
const cerca = (x, y, t = 0.011) => Math.abs(x - y) <= t;
const poner = (id, v, ev) => p.evaluate(({ id, v, ev }) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event(ev || 'input', { bubbles: true })); }, { id, v, ev });

// un contrato de 300.000 por mes (2026-01 a 2027-12) con cobros completos de los meses indicados
const crear = (id, meses, extra) => p.evaluate(async ({ id, meses, extra }) => {
  const cobros = meses.map((m, i) => ({ id: id + '_c' + i, periodo: m[0], concepto: 'alquiler', monto: m[1], fecha: m[0] + '-05' }));
  alquileres.push(Object.assign({ id, unidad: id.toUpperCase(), inquilino: 'Inq ' + id, moneda: 'ARS', canon: 300000, canonActual: 300000, inicio: '2026-01-01', fin: '2027-12-31', diaPago: 5, cobrosHistorial: cobros, tipo: 'local', direccion: 'Calle ' + id }, extra || {}));
  await persistirAlquileres();
}, { id, meses, extra });
const meses = (desde, hasta, monto) => { const out = []; for (let m = desde; m <= hasta; m++) out.push(['2026-' + String(m).padStart(2, '0'), monto || 300000]); return out; };
const get = (id) => p.evaluate((id) => JSON.parse(JSON.stringify(alquileres.find(a => a.id === id))), id);
const abrir = async (id) => { await p.evaluate((id) => abrirModalAlquiler(alquileres.findIndex(a => a.id === id)), id); await p.waitForTimeout(100); };
// guarda y devuelve lo que se vio del diálogo (o null si no apareció); `resp` = 'si' | 'no' | 'cancel' | 'x' | null (no tocarlo)
const guardar = async (resp) => {
  await p.evaluate(() => { window.__g = guardarAlquiler(); window.__gFin = false; window.__g.then(() => { window.__gFin = true; }); });
  const dlg = await p.waitForSelector('#modalActCobrados', { timeout: 1200 }).catch(() => null);
  if (!dlg) { await p.evaluate(() => window.__g); await p.waitForTimeout(250); return null; }
  const vista = await p.evaluate(() => ({ filas: Array.from(document.querySelectorAll('#modalActCobrados tbody tr')).map(t => t.innerText.replace(/\s+/g, ' ')), tit: document.getElementById('actCobTit').textContent, txt: document.getElementById('modalActCobrados').innerText }));
  if (resp) {
    await p.evaluate((r) => document.getElementById({ si: 'alqActCobSi', no: 'alqActCobNo', cancel: 'alqActCobCancel', x: 'alqActCobX' }[r]).click(), resp);
    await p.evaluate(() => window.__g); await p.waitForTimeout(250);
  }
  return vista;
};
const ajustar = (aj, actual) => p.evaluate(({ aj, actual }) => { _alqAjustesCanonWorking = aj.slice(); _renderAjustesCanonLista(); document.getElementById('alqCanonActual').value = actual; }, { aj, actual });
const esp = (id, per) => p.evaluate(({ id, per }) => { const a = alquileres.find(x => x.id === id); return { esp: _alqCanonEsperado(a, per), sp: _alqSaldoPeriodo(a, per) }; }, { id, per });

// ═════════ A: la actualización rige desde un mes ya cobrado (Oct) ═════════
await crear('ac1', meses(1, 10));
await abrir('ac1');
await ajustar([{ periodo: '2026-10', monto: 330000 }], 330000);
let v = await guardar('si');
ok('A1: aparece el diálogo con UN solo mes (octubre: los anteriores no cambian de canon)', v && v.filas.length === 1 && /Octubre 2026/.test(v.filas[0]), JSON.stringify(v));
ok('A2: el diálogo dice cobrado $ 300.000,00, se espera $ 330.000,00 y saldo $ 30.000,00', v && /300\.000,00/.test(v.filas[0]) && /330\.000,00/.test(v.filas[0]) && /saldo \$ 30\.000,00/.test(v.filas[0]), v && v.filas[0]);
let c = await get('ac1'); let e = await esp('ac1', '2026-10');
ok('A3: respondiendo «Sí» queda el ajuste desde octubre y octubre figura Parcial con saldo 30.000 (lo cobrado a cuenta)', JSON.stringify(c.ajustesCanon) === JSON.stringify([{ periodo: '2026-10', monto: 330000 }]) && e.sp.parcial && cerca(e.sp.saldo, 30000) && cerca(e.sp.cobrado, 300000), JSON.stringify({ c: c.ajustesCanon, e }));
ok('A4: guardó (el modal del contrato se cerró)', await p.evaluate(() => !document.getElementById('modalAlquiler').classList.contains('active')));

await crear('ac2', meses(1, 10));
await abrir('ac2');
await ajustar([{ periodo: '2026-10', monto: 330000 }], 330000);
v = await guardar('no');
c = await get('ac2');
ok('A5: respondiendo «No» el nuevo canon pasa a regir desde noviembre (el primer mes sin cobrar)', JSON.stringify(c.ajustesCanon) === JSON.stringify([{ periodo: '2026-11', monto: 330000 }]), JSON.stringify(c.ajustesCanon));
let o = await esp('ac2', '2026-10'), n = await esp('ac2', '2026-11'), d = await esp('ac2', '2027-03');
ok('A6: octubre queda en 300.000 y PAGADA, noviembre y los siguientes en 330.000', cerca(o.esp, 300000) && o.sp.pagada && cerca(n.esp, 330000) && cerca(d.esp, 330000), JSON.stringify({ o, n, d }));

await crear('ac3', meses(1, 10));
await abrir('ac3');
await ajustar([{ periodo: '2026-10', monto: 330000 }], 330000);
await poner('alqObs', 'no se guarda si cancelo');
v = await guardar('cancel');
c = await get('ac3');
ok('A7: «Cancelar» no guarda nada y el contrato sigue abierto', (c.ajustesCanon || []).length === 0 && c.obs !== 'no se guarda si cancelo' && await p.evaluate(() => document.getElementById('modalAlquiler').classList.contains('active')), JSON.stringify({ aj: c.ajustesCanon, obs: c.obs }));
v = await guardar('x');
c = await get('ac3');
ok('A8: la ✕ del diálogo también cancela (no queda colgado el guardado)', (c.ajustesCanon || []).length === 0 && await p.evaluate(() => window.__gFin === true), JSON.stringify(c.ajustesCanon));
await p.evaluate(() => cerrarModalAlquiler());

// ═════════ B: no hay nada que preguntar ═════════
await crear('ac4', meses(1, 10));
await abrir('ac4');
await ajustar([{ periodo: '2026-12', monto: 330000 }], 330000);
v = await guardar(null);
c = await get('ac4');
ok('B1: una actualización desde diciembre (todavía sin cobrar) no pregunta y se guarda', v === null && JSON.stringify(c.ajustesCanon) === JSON.stringify([{ periodo: '2026-12', monto: 330000 }]), JSON.stringify({ v, aj: c.ajustesCanon }));
await p.evaluate(() => abrirModalAlquiler());
await poner('alqUnidad', 'NUEVO-AC'); await poner('alqInquilino', 'Inq nuevo'); await poner('alqCanon', '100000'); await poner('alqInicio', '2026-01-01', 'change');
v = await guardar(null);
ok('B2: un contrato nuevo no pregunta', v === null && !!(await get(await p.evaluate(() => (alquileres.find(a => a.unidad === 'NUEVO-AC') || {}).id))));
// sin cambios de canon: tampoco
await crear('ac5', meses(1, 6));
await abrir('ac5'); await poner('alqObs', 'cambio de obs');
v = await guardar(null);
ok('B3: editar otra cosa (sin tocar el canon) no pregunta', v === null && (await get('ac5')).obs === 'cambio de obs');

// ═════════ C: contrato sin ajustes: editar el «Canon actual» ═════════
await crear('ac6', meses(1, 3));
await abrir('ac6');
await poner('alqCanonActual', '330000');
v = await guardar('no');
c = await get('ac6');
ok('C1: editar «Canon actual» 300.000 → 330.000 en un contrato con 3 meses cobrados pregunta por esos 3 meses', v && v.filas.length === 3 && /Enero/.test(v.filas[0]) && /Marzo/.test(v.filas[2]), JSON.stringify(v));
let m1 = await esp('ac6', '2026-01'), m3 = await esp('ac6', '2026-03'), m4 = await esp('ac6', '2026-04');
ok('C2: «No» → enero a marzo siguen en 300.000 y pagados; abril en adelante 330.000 (un solo ajuste desde abril)', JSON.stringify(c.ajustesCanon) === JSON.stringify([{ periodo: '2026-04', monto: 330000 }]) && m1.sp.pagada && m3.sp.pagada && cerca(m4.esp, 330000) && c.canonActual === 330000, JSON.stringify({ aj: c.ajustesCanon, m1: m1.sp, m4 }));
await crear('ac7', meses(1, 3));
await abrir('ac7'); await poner('alqCanonActual', '330000');
await guardar('si');
c = await get('ac7'); m1 = await esp('ac7', '2026-01');
ok('C3: «Sí» → se mantiene el canon plano: los tres meses quedan Parciales con saldo 30.000 cada uno', (c.ajustesCanon || []).length === 0 && m1.sp.parcial && cerca(m1.sp.saldo, 30000), JSON.stringify({ aj: c.ajustesCanon, m1 }));

// ═════════ D: meses salteados, mes parcial, baja de canon ═════════
await crear('ac8', [['2026-01', 300000], ['2026-03', 300000]]);
await abrir('ac8'); await poner('alqCanonActual', '330000');
v = await guardar('no');
c = await get('ac8');
const por = {}; for (const per of ['2026-01', '2026-02', '2026-03', '2026-04', '2026-09']) por[per] = (await esp('ac8', per)).esp;
ok('D1: cobrados enero y marzo (febrero sin cobrar): «No» deja enero y marzo en 300.000 y febrero y abril en 330.000 (tres ajustes, sin huecos)', cerca(por['2026-01'], 300000) && cerca(por['2026-02'], 330000) && cerca(por['2026-03'], 300000) && cerca(por['2026-04'], 330000) && cerca(por['2026-09'], 330000) && c.ajustesCanon.length === 3, JSON.stringify({ por, aj: c.ajustesCanon }));
await crear('ac9', [['2026-01', 300000], ['2026-02', 100000]]);
await abrir('ac9'); await poner('alqCanonActual', '330000');
v = await guardar('si');
ok('D2: un mes cobrado sólo en parte (100.000) también se pregunta: saldo 230.000 si se actualiza', v && v.filas.length === 2 && /saldo \$ 230\.000,00/.test(v.filas[1]), JSON.stringify(v && v.filas));
await crear('ac10', meses(1, 3), { canonActual: 330000, ajustesCanon: [{ periodo: '2026-01', monto: 330000 }] });
await p.evaluate(async () => { const a = alquileres.find(x => x.id === 'ac10'); a.cobrosHistorial.forEach(c => { c.monto = 330000; }); await persistirAlquileres(); });
await abrir('ac10'); await ajustar([], 300000); await poner('alqCanon', '300000');
v = await guardar('si');
ok('D3: quitar la actualización (baja de 330.000 a 300.000) con meses cobrados por 330.000 pregunta y dice «cobrado de más 30.000»', v && v.filas.length === 3 && /cobrado de más \$ 30\.000,00/.test(v.filas[0]), JSON.stringify(v && v.filas));
await crear('ac11', meses(1, 2));
await abrir('ac11'); await poner('alqCanonActual', '304500');
v = await guardar('si');
ok('D4: una suba de menos del 2 % avisa que el plan lo da por pagado (tolerancia de siempre)', v && /menos del 2 %/.test(v.filas[0]), JSON.stringify(v && v.filas));

// ═════════ E: el aviso al aplicar el IPC, y el backend ═════════
await crear('ac12', meses(1, 10));
await abrir('ac12');
await p.evaluate(() => { window.__alerts.length = 0; _alqIPCNuevoCanon = 330000; document.getElementById('alqIPCVigDesdeMes').value = '10'; document.getElementById('alqIPCVigDesdeAnio').value = '2026'; aplicarIPCAlCanon(); });
let al = await p.evaluate(() => window.__alerts.slice());
ok('E1: «Aplicar al canon» desde un mes cobrado avisa que alcanza a octubre y que se pregunta al guardar (ya no dice «los meses ya cobrados no se modifican»)', al.length === 1 && /ya se cobró/.test(al[0]) && /Oct 2026/.test(al[0]) && /Al guardar/.test(al[0]) && !/ya cobrados no se modifican/.test(al[0]), JSON.stringify(al));
await p.evaluate(() => cerrarModalAlquiler());
await crear('ac13', meses(1, 10));
await abrir('ac13');
await p.evaluate(() => { window.__alerts.length = 0; _alqIPCNuevoCanon = 330000; document.getElementById('alqIPCVigDesdeMes').value = '12'; document.getElementById('alqIPCVigDesdeAnio').value = '2026'; aplicarIPCAlCanon(); });
al = await p.evaluate(() => window.__alerts.slice());
ok('E2: aplicado desde diciembre no avisa nada de meses cobrados', al.length === 1 && !/ya se cobró/.test(al[0]), JSON.stringify(al));
await p.evaluate(() => cerrarModalAlquiler());
// el backend lee el MISMO historial de ajustes: mismo canon en cada mes que el frontend
const srv = fs.readFileSync(new URL('../../functions/server.js', import.meta.url), 'utf8');
const mB = srv.match(/function _alqCanonVigenteEnPeriodo\(a, periodo\) \{[\s\S]*?\n\}\n/);
const fnB = new Function(mB[0] + '; return _alqCanonVigenteEnPeriodo;')();
const dif = [];
for (const id of ['ac2', 'ac6', 'ac8', 'ac1']) {
  const a = await get(id), front = await p.evaluate(({ id }) => { const a = alquileres.find(x => x.id === id), out = {}; for (let y = 2026; y <= 2027; y++) for (let m = 1; m <= 12; m++) { const per = y + '-' + String(m).padStart(2, '0'); out[per] = _canonVigenteEnPeriodo(a.canon, a.canonActual, a.ajustesCanon, per); } return out; }, { id });
  for (const per of Object.keys(front)) if (Math.abs(fnB(a, per) - front[per]) > 0.005) dif.push([id, per, front[per], fnB(a, per)]);
}
ok('E3: el backend (server.js) calcula el mismo canon por mes que la app en los contratos congelados (' + 4 * 24 + ' meses)', dif.length === 0, JSON.stringify(dif.slice(0, 3)));


// ═════════ F: retoques de la v584 (revisión independiente de la v583) ═════════
const canonDe = (id, per) => p.evaluate(({ id, per }) => { const a = alquileres.find(x => x.id === id); return _alqCanonDe(a, per); }, { id, per });
const sinDlg = () => p.evaluate(() => document.querySelectorAll('#modalActCobrados').length);
// F1: lista de ajustes que se vaciaría (todo vale el canon inicial) con un «Canon actual» tipeado distinto → no debe subir todo al plano
await crear('af1', [['2026-02', 300000]], { canonActual: 0 });
await abrir('af1');
await ajustar([{ periodo: '2026-02', monto: 330000 }, { periodo: '2026-03', monto: 300000 }], 330000);
v = await guardar('no');
c = await get('af1');
const fv = {}; for (const per of ['2026-01', '2026-02', '2026-03', '2026-04', '2026-12', '2027-06']) fv[per] = await canonDe('af1', per);
ok('F1: «No» con una lista que daría vacía deja un ancla: todos los meses siguen en 300.000 (antes subían a 330.000) y febrero queda pagado', v && (c.ajustesCanon || []).length >= 1 && Object.values(fv).every(x => cerca(x, 300000)) && (await esp('af1', '2026-02')).sp.pagada, JSON.stringify({ aj: c.ajustesCanon, fv }));

// F2: un cobro ANTERIOR al primer mes afectado (o al inicio) no cambia de canon en silencio con «No»
await crear('af2', [['2025-10', 300000], ['2026-09', 360000]], { canon: 300000, canonActual: 330000, ajustesCanon: [{ periodo: '2025-07', monto: 330000 }, { periodo: '2026-02', monto: 360000 }] });
await abrir('af2');
await ajustar([], 330000);
v = await guardar('no');
c = await get('af2');
const e25 = await esp('af2', '2025-10'), e09 = await esp('af2', '2026-09'), e10 = await esp('af2', '2026-10');
const resto = await p.evaluate(() => { const a = alquileres.find(x => x.id === 'af2'); return _alqMesesCobradosAfectados(Object.assign({}, a, { ajustesCanon: [{ periodo: '2025-07', monto: 330000 }, { periodo: '2026-02', monto: 360000 }] }), a).length; });
ok('F2: el diálogo lista sólo septiembre (360.000 → 330.000); con «No» octubre 2025 sigue esperando 330.000 (Parcial, falta 30.000), septiembre 360.000 pagado y octubre 2026 330.000',
  v && v.filas.length === 1 && /Septiembre 2026/.test(v.filas[0]) && cerca(e25.esp, 330000) && e25.sp.parcial && cerca(e25.sp.saldo, 30000) && cerca(e09.esp, 360000) && e09.sp.pagada && cerca(e10.esp, 330000), JSON.stringify({ v: v && v.filas, aj: c.ajustesCanon, e25: e25.sp, e09: e09.esp, e10: e10.esp }));
ok('F2b: con el historial resultante ya no queda ningún mes afectado (el congelado es exacto)', resto === 0, resto);
await crear('af2b', [['0202-03', 300000], ['2026-01', 300000]]);
await abrir('af2b'); await poner('alqCanonActual', '330000');
v = await guardar('no');
c = await get('af2b');
ok('F2c: un cobro con período mal tipeado (0202-03) se ignora: no cuelga el guardado ni mete un ajuste en el año 202', v && v.filas.length === 1 && (c.ajustesCanon || []).every(x => /^20/.test(x.periodo)), JSON.stringify({ v: v && v.filas, aj: c.ajustesCanon }));

// F3: «Aplicar al canon» busca el contrato por id aunque el listener cambie la lista
await crear('af3', meses(1, 10));
await abrir('af3');
await p.evaluate(() => { alquileres.unshift({ id: 'otro_af3', unidad: 'OTRO', inquilino: 'Otro', moneda: 'ARS', canon: 100, canonActual: 100, inicio: '2026-01-01', fin: '2027-12-31', diaPago: 5, cobrosHistorial: [], tipo: 'local' }); });
await p.evaluate(() => { window.__alerts.length = 0; _alqIPCNuevoCanon = 330000; document.getElementById('alqIPCVigDesdeMes').value = '10'; document.getElementById('alqIPCVigDesdeAnio').value = '2026'; aplicarIPCAlCanon(); });
al = await p.evaluate(() => window.__alerts.slice());
ok('F3: aunque otro contrato se haya colado antes en la lista, el aviso habla del contrato en edición (octubre cobrado)', al.length === 1 && /ya se cobró/.test(al[0]) && /Oct 2026/.test(al[0]), JSON.stringify(al));
await p.evaluate(() => { alquileres = alquileres.filter(x => x.id !== 'otro_af3'); cerrarModalAlquiler(); });

// F4: el texto dice lo que realmente pasa (cobrado de más ≠ saldo, y «anteriores» sí se tocan)
await crear('af4', meses(1, 9, 330000), { canon: 300000, canonActual: 330000 });
await abrir('af4');
await p.evaluate(() => { window.__alerts.length = 0; _alqIPCNuevoCanon = 360000; document.getElementById('alqIPCVigDesdeMes').value = '10'; document.getElementById('alqIPCVigDesdeAnio').value = '2026'; aplicarIPCAlCanon(); });
al = await p.evaluate(() => window.__alerts.slice());
ok('F4: cuando el cambio alcanza a meses ANTERIORES no dice que no se modifican, y si hay cobrado de más no promete «queda un saldo»', al.length === 1 && !/Los meses anteriores no se modifican/.test(al[0]) && /cobrado de más/.test(al[0]) && !/queda un saldo/.test(al[0]), JSON.stringify(al));
v = await guardar('cancel');
ok('F4b: el diálogo con todo «cobrado de más» no dice «(queda un saldo)» ni «Parcial»: dice que no queda ningún saldo', v && !/queda un saldo/.test(v.txt) && /no queda ningún saldo/.test(v.txt) && !/Parcial/.test(v.txt), v && v.txt.slice(0, 600));
await p.evaluate(() => cerrarModalAlquiler());

// F5: un cobro que entra MIENTRAS el diálogo está abierto también se mantiene con «No»
await crear('af5', meses(1, 3));
await abrir('af5'); await poner('alqCanonActual', '330000');
await p.evaluate(() => { window.__g = guardarAlquiler(); window.__gFin = false; window.__g.then(() => { window.__gFin = true; }); });
await p.waitForSelector('#modalActCobrados');
await p.evaluate(() => { const i = alquileres.findIndex(x => x.id === 'af5'), a = alquileres[i]; alquileres[i] = Object.assign({}, a, { cobrosHistorial: a.cobrosHistorial.concat([{ id: 'af5_nuevo', periodo: '2026-04', concepto: 'alquiler', monto: 300000, fecha: '2026-04-05' }]) }); });
await p.evaluate(() => document.getElementById('alqActCobNo').click());
await p.evaluate(() => window.__g); await p.waitForTimeout(250);
const e4 = await esp('af5', '2026-04'); c = await get('af5');
ok('F5: abril se cobró mientras se contestaba: con «No» queda en 300.000 y pagado (antes quedaba Parcial sin haberlo preguntado) y el nuevo canon rige desde mayo', e4.sp.pagada && cerca(e4.esp, 300000) && JSON.stringify(c.ajustesCanon) === JSON.stringify([{ periodo: '2026-05', monto: 330000 }]), JSON.stringify({ e4: e4.sp, aj: c.ajustesCanon }));

// F6: un segundo «Guardar» con el diálogo abierto no apila otro diálogo
await crear('af6', meses(1, 3));
await abrir('af6'); await poner('alqCanonActual', '330000');
await p.evaluate(() => { window.__g = guardarAlquiler(); window.__gFin = false; window.__g.then(() => { window.__gFin = true; }); });
await p.waitForSelector('#modalActCobrados');
await p.evaluate(() => { window.__g2 = guardarAlquiler(); });
await p.waitForTimeout(250);
const nD = await sinDlg();
await p.evaluate(() => document.getElementById('alqActCobCancel').click());
await p.evaluate(() => Promise.all([window.__g, window.__g2])); await p.waitForTimeout(150);
ok('F6: el segundo guardado (Enter sobre el botón de atrás) no abre otro diálogo; Cancelar cierra todo y no queda nada colgado', nD === 1 && (await sinDlg()) === 0 && await p.evaluate(() => window._alqPreguntandoCob === false), nD);
await p.evaluate(() => cerrarModalAlquiler());

// F7: foco y scroll del diálogo con muchos meses; un Enter doble no confirma nada
await crear('af7', (() => { const o = []; for (let y = 2025; y <= 2026; y++) for (let m = 1; m <= 12; m++) o.push([y + '-' + String(m).padStart(2, '0'), 300000]); return o; })(), { inicio: '2025-01-01' });
await abrir('af7'); await poner('alqCanonActual', '330000');
await p.evaluate(() => { document.getElementById('alqGuardarBtn').focus(); });
await p.keyboard.press('Enter'); await p.waitForSelector('#modalActCobrados'); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
const st = await p.evaluate(() => { const d = document.querySelector('#modalActCobrados [role=dialog]'); const r = document.getElementById('actCobTit').getBoundingClientRect(); return { sc: d ? d.scrollTop : -1, foco: document.activeElement === d, tit: r.top >= 0, abierto: !!document.getElementById('modalActCobrados') }; });
ok('F7: con 24 meses el diálogo abre arriba (título a la vista), el foco queda en el cuadro y un segundo Enter no confirma «Sí»', st.sc === 0 && st.foco && st.tit && st.abierto && (await get('af7')).canonActual === 300000, JSON.stringify(st));

// F8: Esc cancela, el Tab queda adentro y el foco vuelve a «Guardar»
await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); await p.keyboard.press('Tab');
const dentro = await p.evaluate(() => document.getElementById('modalActCobrados').contains(document.activeElement));
await p.keyboard.press('Escape'); await p.evaluate(() => window.__g || 0); await p.waitForTimeout(250);
const f8 = await p.evaluate(() => ({ dlg: !!document.getElementById('modalActCobrados'), modalAlq: document.getElementById('modalAlquiler').classList.contains('active'), foco: document.activeElement && document.activeElement.id }));
ok('F8: Tab no se escapa del diálogo, Esc cancela sin cerrar el contrato de atrás y el foco vuelve a «Guardar Contrato»', dentro && !f8.dlg && f8.modalAlq && f8.foco === 'alqGuardarBtn' && (await get('af7')).canonActual === 300000, JSON.stringify({ dentro, f8 }));
await p.evaluate(() => cerrarModalAlquiler());

// F9: celular (390 px): la tabla no desborda, el saldo se ve y los botones flotantes no tapan el diálogo
await p.setViewportSize({ width: 390, height: 844 });
await crear('af9', meses(1, 3));
await abrir('af9'); await poner('alqCanonActual', '330000');
await p.evaluate(() => { window.__g = guardarAlquiler(); window.__gFin = false; window.__g.then(() => { window.__gFin = true; }); });
await p.waitForSelector('#modalActCobrados'); await p.waitForTimeout(250);
const mv = await p.evaluate(() => {
  const d = document.querySelector('#modalActCobrados [role=dialog]'), dr = d.getBoundingClientRect();
  const sal = Array.from(d.querySelectorAll('td[data-l="Si se actualiza"]')).map(t => { const r = t.getBoundingClientRect(); return r.left >= dr.left - 1 && r.right <= dr.right + 1 && r.width > 0; });
  const b = document.getElementById('alqActCobSi').getBoundingClientRect(), el = document.elementFromPoint(b.right - 6, b.top + b.height / 2);
  const z = parseInt(getComputedStyle(document.getElementById('modalActCobrados')).zIndex, 10);
  const fabs = ['fabStack', 'rk-agente-btn', 'rkCalcFab'].map(i => { const e = document.getElementById(i); return e ? parseInt(getComputedStyle(e).zIndex, 10) || 0 : 0; });
  return { sw: d.scrollWidth, cw: d.clientWidth, sal, enBoton: !!(el && document.getElementById('alqActCobSi').contains(el)), z, maxFab: Math.max.apply(null, fabs) };
});
ok('F9: a 390 px la tabla no desborda (se apila por mes), los tres saldos se ven dentro del cuadro y el toque en el borde del botón cae en el botón', mv.sw <= mv.cw && mv.sal.length === 3 && mv.sal.every(Boolean) && mv.enBoton, JSON.stringify(mv));
ok('F9b: el diálogo queda por encima de los botones flotantes (z-index)', mv.z > mv.maxFab, JSON.stringify(mv));
await p.evaluate(() => document.getElementById('alqActCobCancel').click());
await p.evaluate(() => window.__g); await p.waitForTimeout(150);
await p.evaluate(() => cerrarModalAlquiler());
await p.setViewportSize({ width: 1400, height: 900 });

// F10: tras «No» en un contrato que no es de IPC, editar el «Canon actual» sigue teniendo efecto y la lista de ajustes se ve
await crear('af10', meses(1, 10), { indice: 'LIBRE' });
await abrir('af10'); await poner('alqCanonActual', '330000');
await guardar('no');
c = await get('af10');
ok('F10a: «No» deja un solo ajuste desde noviembre', JSON.stringify(c.ajustesCanon) === JSON.stringify([{ periodo: '2026-11', monto: 330000 }]), JSON.stringify(c.ajustesCanon));
await abrir('af10');
const vis = await p.evaluate(() => { const l = document.getElementById('alqAjustesLista'), sec = document.getElementById('alqIPCSector'); return { fuera: !sec.contains(l), txt: l.innerText, visible: l.offsetParent !== null }; });
ok('F10b: la lista «Ajustes de canon cargados» se ve aunque el índice no sea IPC (no está dentro del sector escondido)', vis.fuera && vis.visible && /Desde Nov 2026/.test(vis.txt), JSON.stringify(vis));
await poner('alqCanonActual', '360000');
v = await guardar(null);
c = await get('af10');
const d10 = await esp('af10', '2026-12'), n10 = await esp('af10', '2026-10');
ok('F10c: subir el «Canon actual» a 360.000 lleva el último ajuste a 360.000 (antes se ignoraba en silencio); diciembre espera 360.000 y octubre (cobrado) sigue en 300.000, sin diálogo', v === null && JSON.stringify(c.ajustesCanon) === JSON.stringify([{ periodo: '2026-11', monto: 360000 }]) && cerca(d10.esp, 360000) && cerca(n10.esp, 300000), JSON.stringify({ v, aj: c.ajustesCanon, d10: d10.esp, n10: n10.esp }));
await abrir('af10');
await ajustar([{ periodo: '2026-11', monto: 360000 }, { periodo: '2026-12', monto: 380000 }], 400000);
v = await guardar(null);
c = await get('af10');
ok('F10d: si se tocó la lista Y el «Canon actual», manda la lista (no se pisa lo que se cargó a mano)', JSON.stringify(c.ajustesCanon) === JSON.stringify([{ periodo: '2026-11', monto: 360000 }, { periodo: '2026-12', monto: 380000 }]), JSON.stringify(c.ajustesCanon));

// F11: la leyenda del formulario ya no promete que los meses cobrados no se tocan
const leyenda = await p.evaluate(() => document.getElementById('alqIPCAplicarWrap').innerText);
ok('F11: la leyenda junto a «Aplicar» dice que se pregunta al guardar (ya no «los meses ya cobrados no se tocan»)', /al guardar el contrato te pregunto/.test(leyenda) && !/no se tocan/.test(leyenda), leyenda);

console.log(res.map(x => x.join(' · ')).join('\n'));
const mal = res.filter(x => x[0] === 'FALLA').length;
console.log(`\n${res.length - mal}/${res.length} OK`);
if (errores.length) console.log('errores de JS:', errores.slice(0, 5));
await b.close();
process.exit(mal || errores.length ? 1 : 0);
