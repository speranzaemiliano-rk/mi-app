// Alquileres: bonificar PARTE de un mes (la mitad, una semana, ciertos días), además de bonificar el mes entero.
// Corre contra la demo (base en memoria). Uso: node alquiler-bonif-parcial.mjs   (ver README: hace falta bajar-cdn.sh antes)
import fs from 'fs';
import { abrirDemo, entrarAlSistema } from './demo-lib.mjs';
const { b, p, errores } = await abrirDemo();
const res = [];
const ok = (n, c, x) => res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]);
await entrarAlSistema(p);
await p.evaluate(() => { window.__alerts = []; window.alert = m => window.__alerts.push(String(m)); window.confirm = () => true; });
const cerca = (x, y, t = 0.011) => Math.abs(x - y) <= t;

// contrato de prueba: $310.000 por mes (31 días en enero/marzo/mayo), 2026-01 a 2027-12
await p.evaluate(async () => {
  alquileres.push({ id: 'bp_1', unidad: 'BP-1', inquilino: 'Inq Bonif', moneda: 'ARS', canon: 310000, canonActual: 310000, inicio: '2026-01-01', fin: '2027-12-31', diaPago: 5, cobrosHistorial: [], tipo: 'local', direccion: 'Calle 1' });
  alquileres.push({ id: 'bp_2', unidad: 'BP-2', inquilino: 'Inq Prop', moneda: 'ARS', canon: 310000, canonActual: 310000, inicio: '2026-03-20', fin: '2027-12-31', diaPago: 5, proporcionalInicio: true, cobrosHistorial: [], tipo: 'local', direccion: 'Calle 2' });
  await persistirAlquileres();
});
await p.waitForTimeout(300);
const idx = (id) => p.evaluate((id) => alquileres.findIndex(a => a.id === id), id);
const i1 = await idx('bp_1'), i2 = await idx('bp_2');
const A = (id) => `alquileres.find(a => a.id === '${id}')`;

// ═════════ A: la cuenta ═════════
let r = await p.evaluate(() => { const a = alquileres.find(x => x.id === 'bp_1'); return { sin: _alqFraccionPeriodo(a, '2026-03'), esp: _alqCanonEsperado(a, '2026-03') }; });
ok('A1: sin bonificación un mes entero se cobra entero (sin fracción)', r.sin === null && cerca(r.esp, 310000), JSON.stringify(r));
r = await p.evaluate(() => { const a = alquileres.find(x => x.id === 'bp_1'); a.bonifParcial = { '2026-03': { dias: 15 } }; const f = _alqFraccionPeriodo(a, '2026-03'); return { f, esp: _alqCanonEsperado(a, '2026-03'), otroMes: _alqCanonEsperado(a, '2026-04'), texto: _alqTextoFraccion(f, '2026-03') }; });
ok('A2: 15 días bonificados de 31 → se cobran 16 de 31 = $160.000 (310.000 × 16/31)', r.f && r.f.dias === 16 && r.f.bonif === 15 && r.f.diasMes === 31 && cerca(r.esp, 160000), JSON.stringify(r));
ok('A3: los otros meses no cambian', cerca(r.otroMes, 310000));
ok('A4: el texto dice «16 de 31 días (15 bonificados)»', r.texto === '16 de 31 días (15 bonificados)', r.texto);
r = await p.evaluate(() => { const a = alquileres.find(x => x.id === 'bp_1'); a.cobrosHistorial = []; const sp0 = _alqSaldoPeriodo(a, '2026-03'); a.cobrosHistorial.push({ id: 'bc1', periodo: '2026-03', concepto: 'alquiler', monto: 100000, fecha: '2026-03-02' });
  const sp1 = _alqSaldoPeriodo(a, '2026-03'), sug1 = _alqMontoSugerido(a, '2026-03'); a.cobrosHistorial.push({ id: 'bc2', periodo: '2026-03', concepto: 'alquiler', monto: 60000, fecha: '2026-03-03' }); const sp2 = _alqSaldoPeriodo(a, '2026-03'); a.cobrosHistorial = []; return { sp0, sp1, sug1, sp2 }; });
ok('A5: el saldo se calcula contra lo que se cobra (160.000): con 100.000 cobrados quedan 60.000 y el monto sugerido es el saldo', cerca(r.sp0.esperado, 160000) && r.sp1.parcial && cerca(r.sp1.saldo, 60000) && cerca(r.sug1, 60000), JSON.stringify(r));
ok('A6: con 160.000 cobrados el mes queda pagado', r.sp2.pagada && r.sp2.saldo === 0, JSON.stringify(r.sp2));

// bonificación + primer mes proporcional (arranca el 20: 12 días en marzo)
r = await p.evaluate(() => { const a = alquileres.find(x => x.id === 'bp_2'); const f0 = _alqFraccionPeriodo(a, '2026-03'); a.bonifParcial = { '2026-03': { dias: 5 } }; const f1 = _alqFraccionPeriodo(a, '2026-03'); a.bonifParcial = { '2026-03': { dias: 40 } }; const f2 = _alqFraccionPeriodo(a, '2026-03'); delete a.bonifParcial; return { f0, f1, f2, t: _alqTextoFraccion(f1, '2026-03') }; });
ok('A7: con el primer mes proporcional (12 días) y 5 bonificados se cobran 7 de 31', r.f0.dias === 12 && r.f1.dias === 7 && r.f1.bonif === 5 && r.f1.diasBase === 12 && cerca(r.f1.factor, 7 / 31), JSON.stringify(r));
ok('A8: nunca bonifica TODOS los días: un valor de más se acota (queda 1 día a cobrar)', r.f2.dias === 1 && r.f2.bonif === 11, JSON.stringify(r.f2));
ok('A9: el texto cuenta las dos cosas (tramo y bonificados)', /12 del 20 al 31\/03\/2026, 5 bonificados/.test(r.t), r.t);

// ═════════ B: plan de pagos ═════════
await p.evaluate((i) => { abrirPlanAlquiler(i); }, await idx('bp_1'));
await p.waitForTimeout(400);
const fila = (mes) => p.evaluate((mes) => { const trs = Array.from(document.querySelectorAll('#planAlqBody tr')); const t = trs.find(tr => tr.cells[0] && tr.cells[0].textContent.trim().toLowerCase().startsWith(mes)); return t ? { html: t.innerHTML, txt: t.textContent.replace(/\s+/g, ' ') } : null; }, mes);
let f = await fila('mayo');
ok('B1: cada mes pendiente o vencido trae el botón 🎁½ «Bonificar parte del mes»', f && /_alqBonifParcialAbrir/.test(f.html) && /🎁½/.test(f.txt), JSON.stringify(f && f.txt));
// abrir el modal, usar «La mitad» y guardar
await p.evaluate((i) => _alqBonifParcialAbrir(i, '2026-05'), await idx('bp_1'));
const modal = await p.evaluate(() => ({ visible: !!document.getElementById('bpDias'), presets: Array.from(document.querySelectorAll('#modalGenerico button')).map(b => b.textContent.trim()) }));
ok('B2: el modal ofrece «La mitad», «Una semana» y «Quincena»', modal.visible && modal.presets.some(t => /La mitad \(15 días\)/.test(t)) && modal.presets.some(t => /Una semana \(7 días\)/.test(t)) && modal.presets.some(t => /Quincena \(15 días\)/.test(t)), JSON.stringify(modal));
await p.evaluate(() => { const btn = Array.from(document.querySelectorAll('#modalGenerico button')).find(b => /La mitad/.test(b.textContent)); btn.click(); });
let prev = await p.evaluate(() => document.getElementById('bpPrev').textContent);
ok('B3: la vista previa dice cuánto se cobra (16 de 31 días → $160.000,00, en vez de $310.000,00)', /16 de 31 días/.test(prev) && /160\.000,00/.test(prev) && /310\.000,00/.test(prev), prev);
await p.evaluate(() => { document.getElementById('bpNota').value = 'del 1 al 15, obras en el local'; });
await p.evaluate((i) => _alqBonifParcialGuardar(i, '2026-05'), await idx('bp_1'));
await p.waitForTimeout(300);
const guardado = await p.evaluate(() => { const a = alquileres.find(x => x.id === 'bp_1'); return JSON.parse(JSON.stringify(a.bonifParcial || null)); });
ok('B4: queda guardado en el contrato (bonifParcial[2026-05] = {dias, nota})', guardado && guardado['2026-05'] && guardado['2026-05'].dias === 15 && /obras/.test(guardado['2026-05'].nota), JSON.stringify(guardado));
f = await fila('mayo');
ok('B5: la fila de mayo muestra $160.000,00 y «15 días bonificados · se cobran 16 de 31»', f && /160\.000,00/.test(f.txt) && /15 días bonificados/.test(f.txt) && /se cobran 16 de 31/.test(f.txt), JSON.stringify(f && f.txt));
ok('B6: la fila sigue «pendiente/vencida» (no es un mes bonificado entero) y el botón 🎁½ queda resaltado', f && !/Bonificado/.test(f.txt) && /background:#EDE7F6/.test(f.html), JSON.stringify(f && f.txt));
// validaciones
await p.evaluate((i) => { _alqBonifParcialAbrir(i, '2026-06'); window.__alerts = []; document.getElementById('bpDias').value = '31'; }, await idx('bp_1'));
await p.evaluate((i) => _alqBonifParcialGuardar(i, '2026-06'), await idx('bp_1'));
let v = await p.evaluate(() => ({ al: window.__alerts.slice(), hay: !!(alquileres.find(x => x.id === 'bp_1').bonifParcial || {})['2026-06'] }));
ok('B7: no deja bonificar todos los días del mes (30 de 30): avisa y no guarda', v.al.length === 1 && /de 1 hasta 29/.test(v.al[0]) && !v.hay, JSON.stringify(v));
await p.evaluate((i) => { window.__alerts = []; document.getElementById('bpDias').value = '7.5'; _alqBonifParcialGuardar(i, '2026-06'); }, await idx('bp_1'));
v = await p.evaluate(() => ({ al: window.__alerts.slice(), hay: !!(alquileres.find(x => x.id === 'bp_1').bonifParcial || {})['2026-06'] }));
ok('B8: tampoco acepta días con decimales ni vacíos', v.al.length === 1 && !v.hay, JSON.stringify(v));
await p.evaluate(() => { const m = document.getElementById('modalGenerico'); if (m) m.remove(); });

// el mes entero bonificado absorbe la parcial
await p.evaluate((i) => _alqToggleBonificado(i, '2026-05'), await idx('bp_1'));
v = await p.evaluate(() => { const a = alquileres.find(x => x.id === 'bp_1'); return { mes: (a.mesesBonificados || []).indexOf('2026-05') !== -1, parcial: a.bonifParcial ? JSON.stringify(a.bonifParcial) : null }; });
ok('B9: bonificar el mes ENTERO borra la bonificación parcial de ese mes', v.mes && v.parcial === JSON.stringify({ '2026-03': { dias: 15 } }), JSON.stringify(v));
await p.evaluate((i) => _alqToggleBonificado(i, '2026-05'), await idx('bp_1'));
v = await p.evaluate(() => (alquileres.find(x => x.id === 'bp_1').bonifParcial || {})['2026-05'] || null);
ok('B10: y al quitar el 🎁 no reaparece la parcial vieja', v === null, JSON.stringify(v));

// ═════════ C: cobro, recibo, quitar ═════════
await p.evaluate((i) => { abrirModalCobroAlquiler(i, '2026-03'); }, await idx('bp_1'));
await p.waitForTimeout(300);
const cob = await p.evaluate(() => ({ monto: document.getElementById('cobroAlqMonto').value, aviso: document.getElementById('cobroAlqProrrata').textContent, vis: document.getElementById('cobroAlqProrrata').style.display }));
ok('C1: el modal de cobro de marzo propone $160.000 y avisa de la bonificación parcial', cerca(Number(cob.monto), 160000) && cob.vis !== 'none' && /Bonificación parcial: 16 de 31 días \(15 bonificados\)/.test(cob.aviso), JSON.stringify(cob));
await p.evaluate(() => { const m = document.getElementById('modalCobroAlquiler'); if (m) m.classList.remove('active'); });
const rec = await p.evaluate(() => { const a = alquileres.find(x => x.id === 'bp_1'); let html = ''; const oldOpen = window.open; window.open = () => ({ document: { open() {}, write(h) { html += h; }, close() {} }, focus() {}, print() {} }); try { imprimirComprobanteAlquiler(a, 160000, '2026-03-10', '2026-03', 'alquiler', '', 'R-1', null); } catch (e) { html = 'ERR ' + e.message; } window.open = oldOpen; return html; });
ok('C2: el recibo lo dice («con bonificación parcial: 16 de 31 días (15 bonificados)»)', /con bonificación parcial: 16 de 31 días \(15 bonificados\)/.test(rec), (rec || '').slice(0, 200));
await p.evaluate((i) => _alqBonifParcialAbrir(i, '2026-03'), await idx('bp_1'));
const edit = await p.evaluate(() => ({ dias: document.getElementById('bpDias').value, quitar: Array.from(document.querySelectorAll('#modalGenerico button')).some(b => /Quitar la bonificación/.test(b.textContent)) }));
ok('C3: al reabrir un mes ya bonificado trae los días cargados y el botón «Quitar la bonificación»', edit.dias === '15' && edit.quitar, JSON.stringify(edit));
await p.evaluate((i) => _alqBonifParcialQuitar(i, '2026-03'), await idx('bp_1'));
v = await p.evaluate(() => { const a = alquileres.find(x => x.id === 'bp_1'); return { b: a.bonifParcial ? JSON.stringify(a.bonifParcial) : null, esp: _alqCanonEsperado(a, '2026-03') }; });
ok('C4: «Quitar» vuelve a cobrar el mes entero y, sin otras bonificaciones, borra el campo', v.b === null && cerca(v.esp, 310000), JSON.stringify(v));

// ═════════ D: Finalizar y backend ═════════
await p.evaluate(() => { const a = alquileres.find(x => x.id === 'bp_1'); a.bonifParcial = { '2026-02': { dias: 14 } }; });
const sp = await p.evaluate(() => { const a = alquileres.find(x => x.id === 'bp_1'); const r = _alqSaldoPendiente(a, '2026-02-28'); return r; });
ok('D1: «Finalizar» calcula la deuda de febrero sobre lo que se cobra (28 días, 14 bonificados → 155.000)', JSON.stringify(sp).indexOf('155000') >= 0 || (sp && cerca(Number(sp.saldo || sp.total || 0), 155000 + 310000)) , JSON.stringify(sp));
// el backend tiene la MISMA cuenta
const srv = fs.readFileSync(new URL('../../functions/server.js', import.meta.url), 'utf8');
const m = srv.match(/function _alqFraccionPeriodo\(a, periodo\) \{[\s\S]*?\n\}\n/);
const fnSrv = new Function('return ' + m[0])();
const casos = [];
for (const prop of [false, true]) for (const per of ['2026-01', '2026-02', '2026-03', '2027-12', '2028-02']) for (const bo of [0, 1, 5, 14, 15, 40]) casos.push({ prop, per, bo });
const front = await p.evaluate((casos) => casos.map(c => { const a = { inicio: '2026-03-20', fin: '2027-12-19', proporcionalInicio: c.prop, proporcionalFin: c.prop }; if (c.bo) a.bonifParcial = { [c.per]: { dias: c.bo } }; return _alqFraccionPeriodo(a, c.per); }), casos);
const back = casos.map(c => { const a = { inicio: '2026-03-20', fin: '2027-12-19', proporcionalInicio: c.prop, proporcionalFin: c.prop }; if (c.bo) a.bonifParcial = { [c.per]: { dias: c.bo } }; return fnSrv(a, c.per); });
const difs = casos.filter((c, k) => JSON.stringify(front[k]) !== JSON.stringify(back[k]));
ok('D2: el backend (server.js) calcula la misma fracción que la app en ' + casos.length + ' casos (proporcional, bonificaciones, meses de 28/30/31 días)', difs.length === 0, JSON.stringify(difs.slice(0, 2)) + JSON.stringify(front[0]) + JSON.stringify(back[0]));

// ═════════ E: arreglos de la revisión ═════════
// un mes cobrado en parte que la bonificación deja «Pagada»: avisa antes, y el botón sigue para cambiarla o quitarla
await p.evaluate(async () => { const a = alquileres.find(x => x.id === 'bp_1'); delete a.bonifParcial; a.cobrosHistorial = [{ id: 'ec1', periodo: '2026-04', concepto: 'alquiler', monto: 186000, fecha: '2026-04-02' }]; await persistirAlquileres(); });
await p.waitForTimeout(300);
await p.evaluate(async () => { window.__confirms = []; window.confirm = m => { window.__confirms.push(String(m)); return true; }; });
await p.evaluate((i) => { _alqBonifParcialAbrir(i, '2026-04'); document.getElementById('bpDias').value = '15'; _alqBonifParcialPrev(i, '2026-04'); }, await idx('bp_1'));
const pv = await p.evaluate(() => document.getElementById('bpPrev').textContent);
ok('E1: la vista previa avisa que ya hay $186.000 cobrados y que quedarían cobrados de más', /Ya se cobraron \$ 186\.000,00/.test(pv) && /cobrados de más/.test(pv) && /el mes queda pagado/.test(pv), pv);
await p.evaluate((i) => _alqBonifParcialGuardar(i, '2026-04'), await idx('bp_1'));
await p.waitForTimeout(300);
const cf = await p.evaluate(() => ({ c: window.__confirms.slice(), b: JSON.stringify((alquileres.find(x => x.id === 'bp_1').bonifParcial || {})['2026-04'] || null) }));
ok('E2: al guardar pide confirmación nombrando lo cobrado de más (31.000: abril tiene 30 días, se cobran 155.000) y, aceptada, guarda', cf.c.length === 1 && /31\.000,00/.test(cf.c[0]) && cf.b === JSON.stringify({ dias: 15 }), JSON.stringify(cf));
await p.evaluate((i) => { abrirPlanAlquiler(i); }, await idx('bp_1'));
await p.waitForTimeout(400);
const fa = await fila('abril');
ok('E3: aunque el mes quede «Pagada» la fila sigue ofreciendo 🎁½ (resaltado) para cambiar o quitar la bonificación', fa && /Pagada/.test(fa.txt) && /🎁½/.test(fa.txt) && /background:#EDE7F6/.test(fa.html), JSON.stringify(fa && fa.txt));
await p.evaluate((i) => _alqBonifParcialQuitar(i, '2026-04'), await idx('bp_1'));
const fb = await fila('abril');
ok('E4: quitándola vuelve a «Parcial» sin tocar los cobros y sin el botón resaltado', fb && /Parcial/.test(fb.txt) && !/background:#EDE7F6/.test(fb.html), JSON.stringify(fb && fb.txt));
// la vista previa usa la misma cuenta que el esperado (sin diferencias de un centavo)
const dif = await p.evaluate(() => { const out = []; for (const canon of [100007.31, 100043.86, 123456.78, 99999.99, 310000.01]) for (const dm of [28, 30, 31]) for (let n = 1; n < dm; n++) { const a = { inicio: '2026-01-01', canon, canonActual: canon, bonifParcial: { '2027-02': { dias: n } } };
  const per = dm === 28 ? '2027-02' : dm === 30 ? '2027-04' : '2027-03'; a.bonifParcial = { [per]: { dias: n } }; const esp = _alqCanonEsperado(a, per);
  const prev = _r2(canon * ((dm - n) / dm)); if (Math.abs(esp - prev) > 1e-9) out.push([canon, dm, n, esp, prev]); } return out; });
ok('E5: la vista previa y el esperado dan lo mismo al centavo (140 combinaciones con centavos)', dif.length === 0, JSON.stringify(dif.slice(0, 3)));

ok('Z: sin errores de JS durante toda la prueba', errores.length === 0, JSON.stringify(errores.slice(0, 3)));
for (const r of res) console.log(r.join(' '));
console.log('\n' + res.filter(r => r[0] === 'OK ').length + '/' + res.length + ' OK');
await b.close();
process.exit(res.some(r => r[0] !== 'OK ') ? 1 : 0);
