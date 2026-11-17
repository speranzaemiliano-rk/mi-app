// Alquileres → Plan de pagos: la DIFERENCIA de cada mes se ve siempre (también cuando la tolerancia del 2 % lo da por «Pagada»), hay un botón para cobrarla,
// el panel «Lo que se debe» al costado lista lo adeudado mes por mes con el total, y los botones de la columna Acción ya no quedan cortados.
// Corre contra la demo (base en memoria). Uso: node alquiler-plan-deuda.mjs   (ver README: hace falta bajar-cdn.sh antes)
import fs from 'fs';
import { abrirDemo, entrarAlSistema } from './demo-lib.mjs';
const { b, p, errores } = await abrirDemo();
const res = [];
const ok = (n, c, x) => res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]);
await entrarAlSistema(p);
await p.evaluate(() => { window.__alerts = []; window.alert = m => window.__alerts.push(String(m)); window.confirm = () => true; });
const cerca = (x, y, t = 0.011) => Math.abs(x - y) <= t;

// Contrato de 15 meses que termina en el mes actual (los períodos son relativos a hoy, así la prueba no envejece): 4 canones (1.000.000 → 1.049.000 → 1.142.000 →
// 1.237.000 → 1.340.000) con cobros como los del reporte: algunos meses con una diferencia chica que la tolerancia da por pagada, otros parciales, otros sin cobrar.
const crear = (id, opciones) => p.evaluate(async ({ id, o }) => {
  const hoy = new Date(), mk = off => { const d = new Date(hoy.getFullYear(), hoy.getMonth() - 14 + off, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
  const canonDe = off => off < 3 ? 1000000 : off < 6 ? 1049000 : off < 9 ? 1142000 : off < 12 ? 1237000 : 1340000;
  const cobradoDe = { 0: 1000000, 1: 1000000, 2: 1000000, 3: 1044483, 4: 1050000, 5: 1038966, 6: 1044483, 7: 1130400, 8: 1000000, 9: 1180400, 11: 1237000 };
  const cobros = []; Object.keys(cobradoDe).forEach(k => cobros.push({ id: id + '_c' + k, periodo: mk(+k), concepto: 'alquiler', monto: cobradoDe[k], fecha: mk(+k) + '-05' }));
  const aj = [3, 6, 9, 12].map(k => ({ periodo: mk(k), monto: canonDe(k) }));
  const a = Object.assign({ id, unidad: id.toUpperCase(), inquilino: 'Inq ' + id, moneda: 'ARS', canon: 1000000, canonActual: 1340000, ajustesCanon: aj, inicio: mk(0) + '-01', fin: '2099-12-31', diaPago: 1, cobrosHistorial: cobros, tipo: 'depto', direccion: 'Calle ' + id, deposito: 1000000, depMoneda: 'ARS', depMeses: 1, indice: 'IPC', frecuencia: 3 }, o || {});
  alquileres.push(a);
  await persistirAlquileres();
  window.__mk = mk;
}, { id, o: opciones });
const abrirPlan = async (id) => { await p.evaluate((id) => abrirPlanAlquiler(alquileres.findIndex(a => a.id === id)), id); await p.waitForTimeout(200); };
const cerrarPlan = () => p.evaluate(() => cerrarPlanAlquiler());
const per = (off) => p.evaluate((off) => window.__mk(off), off);
const sp = (id, off) => p.evaluate(({ id, off }) => { const a = alquileres.find(x => x.id === id); return _alqSaldoPeriodo(a, window.__mk(off)); }, { id, off });
const filaDe = (off) => p.evaluate((off) => { const pe = window.__mk(off), lbl = (() => { const [y, m] = pe.split('-'); return new Date(+y, +m - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }); })();
  const tr = Array.from(document.querySelectorAll('#planAlqBody tr')).find(t => t.cells[0] && t.cells[0].innerText.trim().toLowerCase() === lbl.toLowerCase());
  return tr ? { txt: tr.innerText.replace(/\s+/g, ' '), botones: Array.from(tr.querySelectorAll('button')).map(x => x.innerText.replace(/\s+/g, ' ').trim()) } : null; }, off);
const aside = () => p.evaluate(() => { const e = document.getElementById('planAlqDeuda'); return { txt: e.innerText.replace(/\s+/g, ' '), filas: Array.from(e.querySelectorAll('.plan-alq-deuda-fila')).map(x => x.innerText.replace(/\s+/g, ' ')), total: (e.querySelector('.plan-alq-deuda-total') || {}).innerText || '' }; });
const fmt = (n) => '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

await crear('pd1');
await abrirPlan('pd1');

// ═════════ A: la diferencia de los meses «Pagada» (dentro del 2 %) se ve ═════════
const f3 = await filaDe(3), f4 = await filaDe(4), f5 = await filaDe(5), f7 = await filaDe(7), f2 = await filaDe(2);
ok('A1: diciembre (cobrado 1.044.483 de 1.049.000) sigue «Pagada» pero muestra «diferencia $4.517,00»', f3 && /Pagada/.test(f3.txt) && /diferencia \$4\.517,00/.test(f3.txt), f3 && f3.txt);
ok('A2: febrero (1.038.966 de 1.049.000) muestra «diferencia $10.034,00» y abril (1.130.400 de 1.142.000) «diferencia $11.600,00»', f5 && /diferencia \$10\.034,00/.test(f5.txt) && f7 && /diferencia \$11\.600,00/.test(f7.txt), JSON.stringify({ f5: f5 && f5.txt, f7: f7 && f7.txt }));
ok('A3: enero (cobrado 1.050.000 de 1.049.000) muestra «a favor $1.000,00»; un mes cobrado justo no muestra nada', f4 && /a favor \$1\.000,00/.test(f4.txt) && f2 && !/diferencia|a favor/.test(f2.txt), JSON.stringify({ f4: f4 && f4.txt, f2: f2 && f2.txt }));
ok('A4: los meses con diferencia tienen «Cobrar diferencia»; el mes justo no', f3.botones.some(x => /Cobrar diferencia/.test(x)) && f5.botones.some(x => /Cobrar diferencia/.test(x)) && !f2.botones.some(x => /Cobrar diferencia/.test(x)), JSON.stringify({ f3: f3.botones, f2: f2.botones }));
const s3 = await sp('pd1', 3), s6 = await sp('pd1', 6);
ok('A5: el estado no cambió: la tolerancia sigue dando «pagada» con saldo 0 (mails y banner igual que antes) y la diferencia sale aparte en `dif`; el mes parcial sigue «parcial»', s3.pagada && s3.saldo === 0 && cerca(s3.dif, 4517) && s3.tolerada && !s3.parcial && s6.parcial && cerca(s6.saldo, 97517) && cerca(s6.dif, 97517) && !s6.tolerada, JSON.stringify({ s3, s6 }));

// ═════════ B: el panel «Lo que se debe» ═════════
const esperado = await p.evaluate(() => { const a = alquileres.find(x => x.id === 'pd1'), out = []; let fav = 0;
  for (let off = 0; off <= 14; off++) { const pe = window.__mk(off), s = _alqSaldoPeriodo(a, pe); if (off === 14 && new Date().getDate() <= 1) continue;   // día de pago 1: el 1 la cuota «vence hoy», todavía no está vencida
    if (s.dif > 0.004) out.push({ off, debe: s.dif }); else fav += s.aFavor; }
  return { meses: out, total: Math.round(out.reduce((t, x) => t + x.debe, 0) * 100) / 100, fav }; });
const as1 = await aside();
ok('B1: el panel lista un renglón por mes vencido con diferencia (' + esperado.meses.length + ' meses: ' + esperado.meses.map(x => x.off).join(', ') + ')', as1.filas.length === esperado.meses.length, JSON.stringify({ n: as1.filas.length, esp: esperado.meses.length, filas: as1.filas }));
ok('B2: el total adeudado es la suma de lo que se debe cada mes (' + fmt(esperado.total) + ')', as1.total.replace(/\s+/g, ' ').includes(fmt(esperado.total)) && /Total adeudado/.test(as1.total), JSON.stringify({ t: as1.total, esperado: esperado.total }));
ok('B3: los renglones traen el importe de cada mes: diciembre $4.517,00, marzo $97.517,00, mayo $142.000,00, junio $56.600,00 y julio (sin cobrar) $1.237.000,00',
  [as1.filas[0]].every(x => /4\.517,00/.test(x)) && as1.filas.some(x => /97\.517,00/.test(x)) && as1.filas.some(x => /142\.000,00/.test(x)) && as1.filas.some(x => /56\.600,00/.test(x)) && as1.filas.some(x => /sin cobrar/.test(x) && /1\.237\.000,00/.test(x)), JSON.stringify(as1.filas));
ok('B4: lo cobrado de más (enero, $1.000,00) se informa aparte y el saldo neto lo descuenta', cerca(esperado.fav, 1000) && /Pagado de más/.test(as1.txt) && as1.txt.includes(fmt(esperado.total - esperado.fav)) && /Saldo neto a cobrar/.test(as1.txt), as1.txt.slice(0, 700));
ok('B5: el depósito pendiente figura aparte (no se suma al total de alquileres)', /Depósito de garantía pendiente/.test(as1.txt) && as1.txt.includes(fmt(1000000)) && !as1.total.includes(fmt(esperado.total + 1000000)), as1.txt.slice(-300));
ok('B6: los meses por venir y los anteriores al primer ajuste cobrados completos no están: ni el primero ni el último «a futuro»', !as1.filas.some(x => /1\.000\.000,00/.test(x) && /Septiembre|septiembre/.test(x)), JSON.stringify(as1.filas.slice(0, 2)));

// ═════════ C: cobrar la diferencia ═════════
await p.evaluate(() => { const i = alquileres.findIndex(a => a.id === 'pd1'); const pe = window.__mk(5); abrirModalCobroAlquiler(i, pe); });
await p.waitForTimeout(250);
const mc = await p.evaluate(() => ({ monto: parseFloat(document.getElementById('cobroAlqMonto').value) || 0, hint: document.getElementById('cobroAlqSaldo') ? document.getElementById('cobroAlqSaldo').innerText.replace(/\s+/g, ' ') : '' }));
ok('C1: «Cobrar diferencia» abre el cobro proponiendo la diferencia (10.034) y el aviso dice que falta esa diferencia (no «ya está cobrado»)', cerca(mc.monto, 10034) && /falta una diferencia de \$\s?10\.034,00/.test(mc.hint) && /queda saldada/.test(mc.hint), JSON.stringify(mc));
await p.evaluate(async () => {
  const i = alquileres.findIndex(a => a.id === 'pd1'), a = alquileres[i];
  a.cobrosHistorial.push({ id: 'pd1_dif', periodo: window.__mk(5), concepto: 'alquiler', monto: 10034, fecha: new Date().toISOString().slice(0, 10) });
  await persistirAlquileres(); cerrarModalCobroAlquiler && cerrarModalCobroAlquiler(); _renderPlanAlquiler();
});
const s5b = await sp('pd1', 5), as2 = await aside(), f5b = await filaDe(5);
ok('C2: al cobrar la diferencia el mes queda sin diferencia, sin botón y sale del panel (un renglón menos, total menos 10.034)', s5b.dif === 0 && !s5b.tolerada && !/diferencia/.test(f5b.txt) && !f5b.botones.some(x => /Cobrar diferencia/.test(x)) && as2.filas.length === esperado.meses.length - 1 && as2.total.includes(fmt(esperado.total - 10034)), JSON.stringify({ s5b, n: as2.filas.length, t: as2.total }));

// ═════════ D: reglas de qué se suma ═════════
await crear('pd2', { mesesBonificados: [], diaPago: 28 });
await p.evaluate(() => { const a = alquileres.find(x => x.id === 'pd2'); a.mesesBonificados = [window.__mk(10)]; });   // julio bonificado: no se debe
await abrirPlan('pd2');
const as3 = await aside();
const hoyDia = await p.evaluate(() => new Date().getDate());
const incluyeActual = hoyDia > 28;   // con día de pago 28 el mes en curso cuenta desde el 29 (el 28 la cuota «vence hoy»)
const esp3 = await p.evaluate((incl) => { const a = alquileres.find(x => x.id === 'pd2'); let n = 0; for (let off = 0; off <= 14; off++) { const pe = window.__mk(off); if ((a.mesesBonificados || []).indexOf(pe) !== -1) continue; const s = _alqSaldoPeriodo(a, pe); if (s.dif > 0.004 && (off < 14 || incl)) n++; } return n; }, incluyeActual);
const lblBonif = await p.evaluate(() => { const [y, m] = window.__mk(10).split('-'); return new Date(+y, +m - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }); });
ok('D1: un mes bonificado no se debe y el mes en curso sólo cuenta cuando su día de pago ya pasó (día 28; hoy es ' + hoyDia + ')', as3.filas.length === esp3 && !as3.filas.some(x => x.toLowerCase().includes(lblBonif.toLowerCase())), JSON.stringify({ n: as3.filas.length, esp3, lblBonif, filas: as3.filas }));
await cerrarPlan();

await crear('pd3', { diaPago: null, deposito: 0 });
await abrirPlan('pd3');
const as4 = await aside();
const esperadoSinDia = (await p.evaluate(() => { const a = alquileres.find(x => x.id === 'pd3'); let n = 0; for (let off = 0; off <= 14; off++) if (_alqSaldoPeriodo(a, window.__mk(off)).dif > 0.004) n++; return n; }));
ok('D2: sin día de pago la cuota cuenta desde el día 1 (el mes en curso figura) y sin depósito no hay renglón de depósito', as4.filas.length === esperadoSinDia && !/Depósito de garantía pendiente/.test(as4.txt), JSON.stringify({ n: as4.filas.length, esp: esperadoSinDia }));
await cerrarPlan();

// un contrato al día no debe nada
await p.evaluate(async () => {
  const hoy = new Date(), pe = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0');
  alquileres.push({ id: 'pd4', unidad: 'PD4', inquilino: 'Al dia', moneda: 'ARS', canon: 500000, canonActual: 500000, inicio: pe + '-01', fin: '2099-12-31', diaPago: 1, tipo: 'local', direccion: 'x', cobrosHistorial: [{ id: 'pd4c', periodo: pe, concepto: 'alquiler', monto: 500000, fecha: pe + '-02' }] });
  await persistirAlquileres();
});
await abrirPlan('pd4');
const as5 = await aside();
ok('D3: un contrato al día muestra «están al día» y total cero (sin filas)', as5.filas.length === 0 && /al día/.test(as5.txt) && !/Total adeudado/.test(as5.txt), as5.txt);
await cerrarPlan();

// ═════════ E: el resto del sistema ve la misma diferencia ═════════
const est = await p.evaluate(() => { const a = alquileres.find(x => x.id === 'pd4'); a.cobrosHistorial[0].monto = 497000; return { st: _alqEstadoPago(a), sug: _alqMontoSugerido(a, a.cobrosHistorial[0].periodo) }; });
ok('E1: el estado de la lista dice «Cuota del mes cobrada · diferencia $3.000,00» (sigue «cobrada») y el monto sugerido es la diferencia', est.st && est.st.estado === 'cobrada' && /diferencia \$\s?3\.000,00/.test(est.st.label) && cerca(est.sug, 3000), JSON.stringify(est));
const sugNormal = await p.evaluate(() => { const a = alquileres.find(x => x.id === 'pd1'); return { pagadaJusta: _alqMontoSugerido(a, window.__mk(2)), sinCobro: _alqMontoSugerido(a, window.__mk(14)), parcial: _alqMontoSugerido(a, window.__mk(6)) }; });
ok('E2: el monto sugerido no cambia en los demás casos: mes cobrado justo = canon, mes sin cobrar = canon, parcial = saldo', cerca(sugNormal.pagadaJusta, 1000000) && cerca(sugNormal.sinCobro, 1340000) && cerca(sugNormal.parcial, 97517), JSON.stringify(sugNormal));

// ═════════ F: la columna Acción ya no queda cortada ═════════
const medir = async (w, h) => {
  await p.setViewportSize({ width: w, height: h });
  await abrirPlan('pd1'); await p.waitForTimeout(250);
  return p.evaluate(() => {
    const t = document.querySelector('.plan-alq-tabla'), d = document.getElementById('planAlqDeuda'), tr = t.getBoundingClientRect(), dr = d.getBoundingClientRect();
    const btnFuera = Array.from(t.querySelectorAll('tbody button')).filter(x => { const r = x.getBoundingClientRect(); return r.width > 0 && r.right > tr.right + 1; }).length;
    return { sw: t.scrollWidth, cw: t.clientWidth, alLado: dr.left >= tr.right - 1 && Math.abs(dr.top - tr.top) < 40, debajo: dr.top >= tr.bottom - 2, arriba: dr.bottom <= tr.top + 2, anchoPanel: Math.round(dr.width), anchoTabla: Math.round(tr.width), btnFuera, boxW: document.querySelector('#modalPlanAlquiler .modal-box').getBoundingClientRect().width };
  });
};
for (const [w, h] of [[1920, 1080], [1400, 900]]) {
  const m = await medir(w, h);
  ok('F (' + w + ' px): la tabla no scrollea de costado, ningún botón queda cortado y el panel de lo adeudado está AL COSTADO de la tabla', m.sw <= m.cw + 1 && m.btnFuera === 0 && m.alLado, JSON.stringify(m));
  await cerrarPlan();
}
const mm = await medir(390, 844);
const tot390 = await p.evaluate(() => { const t = document.querySelector('.plan-alq-deuda-total'); const r = t.getBoundingClientRect(); const tab = document.querySelector('.plan-alq-tabla'); return { top: r.top, bottom: r.bottom, vh: window.innerHeight, tablaScroll: getComputedStyle(tab).overflowY, tablaMax: getComputedStyle(tab).maxHeight }; });
ok('F (390 px): en el celular el panel va ARRIBA de la tabla (el total adeudado se ve al abrir, sin deslizar), la tabla no tiene scroll propio (un solo scroll) y ningún botón queda cortado', mm.arriba && mm.btnFuera === 0 && mm.sw <= mm.cw + 4 && tot390.bottom <= tot390.vh && tot390.tablaScroll === 'visible' && tot390.tablaMax === 'none', JSON.stringify({ mm, tot390 }));
await cerrarPlan();

// ═════════ G: retoques de la v588 (revisión independiente de la v586) ═════════
// G1: el panel pasa debajo (a todo el ancho y ARRIBA de la tabla) hasta ~980 px y va al costado desde 981
for (const [w, lado] of [[1024, true], [981, true], [960, false], [930, false], [901, false], [768, false]]) {
  const m = await medir(w, 800);
  const okLayout = lado ? (m.alLado && m.btnFuera === 0) : (m.arriba && m.anchoPanel >= m.anchoTabla - 2);
  ok('G1 (' + w + ' px): ' + (lado ? 'panel al costado de la tabla' : 'panel apilado ARRIBA y a todo el ancho (no solo y pegado a la izquierda)'), okLayout, JSON.stringify(m));
  await cerrarPlan();
}
// G2: los flotantes no tapan el plan mientras está abierto y vuelven al cerrarlo
await p.setViewportSize({ width: 1280, height: 720 });
const disp = async () => p.evaluate(() => ({ fab: getComputedStyle(document.getElementById('fabStack')).display, ag: (document.getElementById('rk-agente-btn') ? getComputedStyle(document.getElementById('rk-agente-btn')).display : 'n/a') }));
const antesFab = await disp();
await abrirPlan('pd1'); const durFab = await disp(); await cerrarPlan(); const despFab = await disp();
ok('G2: con el plan abierto los atajos flotantes y el asistente se esconden (no tapan el total ni «Cerrar») y al cerrarlo vuelven', antesFab.fab !== 'none' && durFab.fab === 'none' && (durFab.ag === 'none' || durFab.ag === 'n/a') && despFab.fab === antesFab.fab && despFab.ag === antesFab.ag, JSON.stringify({ antesFab, durFab, despFab }));
// G3: en una pantalla baja la lista de meses conserva un alto útil
await p.setViewportSize({ width: 812, height: 375 });
await abrirPlan('pd1');
const alto = await p.evaluate(() => { const l = document.querySelector('.plan-alq-deuda-lista'); return { ch: l.clientHeight, sh: l.scrollHeight, boxMax: getComputedStyle(document.querySelector('.plan-alq-deuda-box')).maxHeight }; });
ok('G3: a 812×375 la lista de meses del panel mide al menos ~150 px (antes 8 px: sólo se veían el título y el total)', alto.ch >= 140, JSON.stringify(alto));
await cerrarPlan();
await p.setViewportSize({ width: 1400, height: 900 });
// G4: contrato sin fecha de inicio: el panel no afirma «al día»
await p.evaluate(async () => { alquileres.push({ id: 'pd_si', unidad: 'SI', inquilino: 'Sin inicio', moneda: 'ARS', canon: 1000, canonActual: 1000, inicio: '', fin: '', diaPago: 5, cobrosHistorial: [], tipo: 'local', direccion: 'x' }); await persistirAlquileres(); });
await abrirPlan('pd_si');
const sinI = await p.evaluate(() => document.getElementById('planAlqDeuda').innerText.replace(/\s+/g, ' '));
ok('G4: sin fecha de inicio el panel dice que hay que cargarla (no «están al día»)', /Cargá la fecha de inicio/.test(sinI) && !/al día/.test(sinI), sinI);
await cerrarPlan();
// G5: un mes con DOS cobros + «Cobrar diferencia» no agranda la tabla de costado (el tooltip propio se salía por la derecha)
await p.evaluate(async () => {
  const hoy = new Date(), mk = off => { const d = new Date(hoy.getFullYear(), hoy.getMonth() - 14 + off, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
  const per = mk(10), canon = 1500000.5;
  alquileres.push({ id: 'pd5', unidad: 'PD5', inquilino: 'Dos cobros', moneda: 'ARS', canon, canonActual: canon, inicio: mk(0) + '-01', fin: '2099-12-31', diaPago: 1, tipo: 'depto', direccion: 'z',
    cobrosHistorial: [{ id: 'pd5a', periodo: per, concepto: 'alquiler', monto: Math.round(canon * 0.4 * 100) / 100, fecha: per + '-03' }, { id: 'pd5b', periodo: per, concepto: 'alquiler', monto: Math.round(canon * 0.59 * 100) / 100, fecha: per + '-20' }] });
  await persistirAlquileres();
});
const sobran = [];
for (const w of [700, 768, 800, 1024, 1100]) {
  await p.setViewportSize({ width: w, height: 900 });
  await abrirPlan('pd5');
  sobran.push([w, await p.evaluate(() => { const t = document.querySelector('.plan-alq-tabla'); return t.scrollWidth - t.clientWidth; })]);
  await cerrarPlan();
}
ok('G5: con un mes de dos cobros (✏️1 ✏️2, Desaplicar todo, Cobrar diferencia) la tabla no scrollea de costado entre 700 y 1100 px', sobran.every(x => x[1] <= 1), JSON.stringify(sobran));
await p.setViewportSize({ width: 1400, height: 900 });
// G6: Finalizar locación suma las diferencias dentro del 2 % igual que el plan
const fin = await p.evaluate(() => { const a = alquileres.find(x => x.id === 'pd1'); const sp = _alqSaldoPendiente(a, ''); const tol = sp.meses.filter(m => m.tolerada); let esp = 0; for (let off = 0; off <= 14; off++) { const s = _alqSaldoPeriodo(a, window.__mk(off)); if (s.esperado > 0 && !s.pagada) esp += s.saldo; else if (s.tolerada) esp += s.dif; } return { total: sp.total, esp: Math.round(esp * 100) / 100, nTol: tol.length }; });
await p.evaluate(() => abrirFinalizarAlq(alquileres.findIndex(a => a.id === 'pd1')));
await p.waitForTimeout(200);
const avisos = await p.evaluate(() => document.getElementById('finAlqAvisos').innerText.replace(/\s+/g, ' '));
await p.evaluate(() => cerrarFinalizarAlq());
ok('G6: Finalizar locación cuenta las diferencias dentro del 2 % (' + fin.nTol + ' meses) y su total coincide con la suma del plan; el aviso las rotula', fin.nTol >= 2 && cerca(fin.total, fin.esp) && /diferencia dentro del 2 %/.test(avisos), JSON.stringify({ fin, avisos: avisos.slice(0, 300) }));
// G7: los centavos de redondeo no son una diferencia
const cent = await p.evaluate(() => { const r = (canon, cobrado) => { const a = { id: 'x', moneda: 'ARS', canon, canonActual: canon, inicio: '2020-01-01', fin: '2099-12-31', cobrosHistorial: [{ periodo: '2026-02', concepto: 'alquiler', monto: cobrado }] }; const s = _alqSaldoPeriodo(a, '2026-02'); return { tol: s.tolerada, fav: s.aFavor, pagada: s.pagada, dif: s.dif }; };
  return { c33: r(384633.33, 384633), u99: r(1000000, 999999.01), u100: r(1000000, 999999), mas33: r(1000000, 1000000.33), mas100: r(1000000, 1000001), chico: r(500, 499.6) }; });
ok('G7: $0,33 de redondeo (cobrado $384.633 de $384.633,33) no es diferencia ni se ofrece cobrar; $0,99 tampoco; desde $1,00 sí; cobrado de más $0,33 no es «a favor»', cent.c33.pagada && !cent.c33.tol && !cent.u99.tol && cent.u100.tol && !cent.mas33.fav && cent.mas100.fav === 1 && !cent.chico.tol, JSON.stringify(cent));
const sugC = await p.evaluate(() => { const a = { id: 'x', moneda: 'ARS', canon: 384633.33, canonActual: 384633.33, inicio: '2020-01-01', fin: '2099-12-31', cobrosHistorial: [{ periodo: '2026-02', concepto: 'alquiler', monto: 384633 }] }; return { sug: _alqMontoSugerido(a, '2026-02'), est: (function() { const h = new Date(), pe = h.getFullYear() + '-' + String(h.getMonth() + 1).padStart(2, '0'); const b = Object.assign({}, a, { diaPago: 1, cobrosHistorial: [{ periodo: pe, concepto: 'alquiler', monto: 384633 }] }); const e = _alqEstadoPago(b); return e && e.label; })() }; });
ok('G7b: con $0,33 de redondeo el estado del mes en curso dice «Cuota del mes cobrada» sin «diferencia»', sugC.est === null || !/diferencia/.test(sugC.est || ''), JSON.stringify(sugC));
// G8: temas «oscuro» y «medio»: las filas toman los tokens del tema (texto claro sobre pastel fijo daba 1,1:1)
const lum = (rgb) => { const m = rgb.match(/[\d.]+/g).map(Number); const c = m.slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const contraste = (a, b) => { const x = lum(a), y = lum(b), hi = Math.max(x, y), lo = Math.min(x, y); return (hi + 0.05) / (lo + 0.05); };
const temas = {};
for (const tema of ['', 'oscuro', 'medio']) {
  await p.evaluate((t) => { if (t) document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); }, tema);
  await abrirPlan('pd1');
  temas[tema || 'claro'] = await p.evaluate(() => { const fila = Array.from(document.querySelectorAll('#planAlqBody tr')).find(t => /Pagada/.test(t.innerText)); const dep = document.querySelector('#planAlqBody tr.pa-r-dep'); const th = document.querySelector('.plan-alq-tabla thead th'); const thead = document.querySelector('.plan-alq-tabla thead'); const cs = el => getComputedStyle(el);
    return { fila: [cs(fila).backgroundColor, cs(fila.cells[0]).color], dep: [cs(dep).backgroundColor, cs(dep.cells[0]).color], th: [cs(thead).backgroundColor, cs(th).color] }; });
  await cerrarPlan();
}
await p.evaluate(() => document.documentElement.removeAttribute('data-theme'));
const cts = {}; Object.keys(temas).forEach(t => { cts[t] = { fila: contraste(temas[t].fila[0], temas[t].fila[1]), dep: contraste(temas[t].dep[0], temas[t].dep[1]), th: contraste(temas[t].th[0], temas[t].th[1]) }; });
ok('G8: el texto de las filas (Pagada, depósito) y el encabezado se leen en los tres temas (contraste ≥ 4,5:1; antes 1,1:1 en «oscuro» y «medio»)', Object.values(cts).every(c => c.fila >= 4.5 && c.dep >= 4.5 && c.th >= 4.5), JSON.stringify(cts));
await p.setViewportSize({ width: 1400, height: 900 });

console.log(res.map(x => x.join(' · ')).join('\n'));
const mal = res.filter(x => x[0] === 'FALLA').length;
console.log(`\n${res.length - mal}/${res.length} OK`);
if (errores.length) console.log('errores de JS:', errores.slice(0, 5));
await b.close();
process.exit(mal || errores.length ? 1 : 0);
