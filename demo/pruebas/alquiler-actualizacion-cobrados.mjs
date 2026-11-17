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

console.log(res.map(x => x.join(' · ')).join('\n'));
const mal = res.filter(x => x[0] === 'FALLA').length;
console.log(`\n${res.length - mal}/${res.length} OK`);
if (errores.length) console.log('errores de JS:', errores.slice(0, 5));
await b.close();
process.exit(mal || errores.length ? 1 : 0);
