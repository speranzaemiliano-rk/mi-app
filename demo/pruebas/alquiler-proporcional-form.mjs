// Alquileres: el primer / último mes proporcional se OFRECE al cargar el contrato (bloque debajo de las fechas, botones de opción con el importe de cada una),
// y también se puede pactar OTRO importe (alquiler 1000 que empezó el 15 → se cobra 500).
// Corre contra la demo (base en memoria). Uso: node alquiler-proporcional-form.mjs   (ver README: hace falta bajar-cdn.sh antes)
import fs from 'fs';
import { abrirDemo, entrarAlSistema } from './demo-lib.mjs';
const { b, p, errores } = await abrirDemo();
const res = [];
const ok = (n, c, x) => res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]);
await entrarAlSistema(p);
await p.evaluate(() => { window.__alerts = []; window.alert = m => window.__alerts.push(String(m)); window.confirm = () => true; });
const cerca = (x, y, t = 0.011) => Math.abs(x - y) <= t;

// Carga el formulario como lo haría una persona: valor + evento (los date/number del modal escuchan change/input).
const poner = (id, v, ev) => p.evaluate(({ id, v, ev }) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event(ev || 'input', { bubbles: true })); }, { id, v, ev });
const estado = () => p.evaluate(() => {
  const vis = (id) => { const e = document.getElementById(id); return !!e && e.offsetParent !== null; };
  const q = (id) => document.getElementById(id);
  const rad = (id) => Array.from(q(id).querySelectorAll('input[type=radio]')).map(r => r.checked);
  return {
    wrap: vis('alqProrrataWrap'), ini: q('alqPropInicio').checked, iniDis: q('alqPropInicio').disabled, fin: q('alqPropFin').checked, finDis: q('alqPropFin').disabled,
    radI: rad('alqProrrataIni'), radF: rad('alqProrrataFin'), finVis: vis('alqProrrataFin'),
    txtI: q('alqProrrataIni').innerText, txtF: q('alqProrrataFin').innerText
  };
});
const abrirNuevo = () => p.evaluate(() => { abrirModalAlquiler(); });

// ═════════ A: contrato NUEVO que empieza el 15 de octubre ═════════
await abrirNuevo();
let e = await estado();
const hoyDia = await p.evaluate(() => new Date().getDate());
ok('A1: al abrir un contrato nuevo la fecha por defecto (hoy) se trata IGUAL que cualquier otra: a mitad de mes queda el proporcional, el día 1 no ofrece nada', e.ini === (hoyDia > 1) && e.wrap === (hoyDia > 1) && !e.fin, JSON.stringify({ hoyDia, e: { wrap: e.wrap, ini: e.ini, fin: e.fin } }));
await poner('alqCanon', '310000');
await poner('alqDuracion', '24');
await poner('alqInicio', '2026-10-15', 'change');
e = await estado();
ok('A2: con inicio el 15/10 aparece el bloque y queda elegido «proporcional» (casilla del estado y botón de opción)', e.wrap && e.ini && !e.iniDis && e.radI.length === 3 && e.radI[0] === true && e.radI[1] === false && e.radI[2] === false, JSON.stringify(e));
ok('A3: el texto del primer mes dice 17 de 31 días y $ 170.000,00, y ofrece el mes entero $ 310.000,00', /17 de 31 días/.test(e.txtI) && /170\.000,00/.test(e.txtI) && /310\.000,00/.test(e.txtI) && /empieza el 15\/10\/2026/.test(e.txtI), e.txtI);
ok('A4: el último mes acompaña al primero (24 meses → termina el 14/10/2028, 14 de 31 días = $ 140.000,00)', e.fin && e.finVis && e.radF[0] === true && /14 de 31 días/.test(e.txtF) && /140\.000,00/.test(e.txtF) && /24 cuotas/.test(e.txtF), JSON.stringify(e));
r = await p.evaluate(() => document.getElementById('alqFin').value);
ok('A5: la fecha de fin calculada es 2028-10-14', r === '2028-10-14', r);
// el texto «N meses son N cuotas» usa la duración REAL (en la v579 quedó fijo en «24 meses»)
await poner('alqDuracion', '18');
e = await estado();
ok('A5b: con 18 meses el texto del último mes dice «18 meses son 18 cuotas y no 19» (no un 24 fijo)', /18 meses son 18 cuotas y no 19/.test(e.txtF) && !/24/.test(e.txtF), e.txtF);
await poner('alqDuracion', '');
e = await estado();
ok('A5c: sin duración el texto no inventa un número', !/\d+ meses son/.test(e.txtF) && !/cuotas/.test(e.txtF), e.txtF);
await poner('alqDuracion', '24');

// guardar: queda proporcionalInicio/Fin y las cuotas dan lo esperado (primer mes proporcional, el resto entero)
await poner('alqUnidad', 'PF-1');
await poner('alqInquilino', 'Inquilino 15 de octubre');
await p.evaluate(async () => { await guardarAlquiler(); });
await p.waitForTimeout(300);
var r = await p.evaluate(() => { const a = alquileres.find(x => x.unidad === 'PF-1'); return a ? { pi: a.proporcionalInicio, pf: a.proporcionalFin, oct: _alqCanonEsperado(a, '2026-10'), nov: _alqCanonEsperado(a, '2026-11'), oct28: _alqCanonEsperado(a, '2028-10'), sep28: _alqCanonEsperado(a, '2028-09') } : null; });
ok('A6: se guardó con proporcionalInicio y proporcionalFin', r && r.pi === true && r.pf === true, JSON.stringify(r));
ok('A7: octubre 2026 se espera 170.000, noviembre 2026 en adelante la cuota entera (310.000), octubre 2028 140.000', r && cerca(r.oct, 170000) && cerca(r.nov, 310000) && cerca(r.sep28, 310000) && cerca(r.oct28, 140000), JSON.stringify(r));

// ═════════ B: elegir «mes entero» y que la fecha ya no lo pise ═════════
await abrirNuevo();
await poner('alqCanon', '310000'); await poner('alqDuracion', '24'); await poner('alqInicio', '2026-10-15', 'change');
await p.evaluate(() => { document.querySelectorAll('#alqProrrataIni input[type=radio]')[1].click(); });
e = await estado();
ok('B1: tocar «mes entero» destilda el primer mes y el último lo sigue (nadie lo eligió a mano)', !e.ini && !e.fin && e.radI[1] === true && e.radF[1] === true, JSON.stringify(e));
await poner('alqInicio', '2026-10-20', 'change');
e = await estado();
ok('B2: cambiar la fecha después de elegir «mes entero» NO vuelve a marcar el proporcional', !e.ini && e.radI[1] === true && /empieza el 20\/10\/2026/.test(e.txtI) && /12 de 31 días/.test(e.txtI), JSON.stringify(e));
await p.evaluate(() => { document.querySelectorAll('#alqProrrataIni input[type=radio]')[0].click(); });
e = await estado();
ok('B3: elegir «proporcional» a mano lo marca (y el último lo acompaña)', e.ini && e.fin && e.radI[0] === true, JSON.stringify(e));
await p.evaluate(() => { document.querySelectorAll('#alqProrrataFin input[type=radio]')[1].click(); });
await poner('alqInicio', '2026-10-10', 'change');
e = await estado();
ok('B4: si el último mes se eligió a mano ya no sigue al primero', e.ini && !e.fin && e.radF[1] === true, JSON.stringify(e));

// ═════════ C: cuando no corresponde, el bloque no estorba ═════════
await abrirNuevo();
await poner('alqCanon', '310000'); await poner('alqDuracion', '24'); await poner('alqInicio', '2026-10-01', 'change');
e = await estado();
ok('C1: empieza el 1 y termina a fin de mes (30/9/2028) → el bloque no aparece y no hay nada marcado', !e.wrap && !e.ini && !e.fin && e.iniDis && e.finDis, JSON.stringify(e));
await poner('alqInicio', '2026-10-15', 'change');
e = await estado();
ok('C2: al pasar el inicio al 15 aparece y se marca solo', e.wrap && e.ini && e.fin, JSON.stringify(e));
await poner('alqInicio', '2026-10-01', 'change');
e = await estado();
ok('C3: y al volver al día 1 desaparece y se desmarca (no queda un proporcional fantasma)', !e.wrap && !e.ini && !e.fin, JSON.stringify(e));
await p.evaluate(() => { document.getElementById('alqInicio').value = ''; _alqProrrataPreview(); });
e = await estado();
ok('C4: sin fecha de inicio (y el fin a fin de mes) el bloque no se ofrece', !e.wrap, JSON.stringify(e));

// ═════════ D: el importe sigue al formulario ═════════
await abrirNuevo();
await poner('alqInicio', '2026-10-15', 'change');
e = await estado();
ok('D1: sin canon cargado avisa que falta el canon en vez de mostrar 0', /cargá el canon/.test(e.txtI), e.txtI);
await poner('alqCanon', '31000');
e = await estado();
ok('D2: al cargar el canon aparece el importe (17/31 de 31.000 = 17.000,00)', /17\.000,00/.test(e.txtI) && /31\.000,00/.test(e.txtI), e.txtI);
await p.evaluate(() => { const m = document.getElementById('alqMoneda'); m.value = 'USD'; m.dispatchEvent(new Event('change', { bubbles: true })); });
e = await estado();
ok('D3: en dólares el importe sale con USD', /USD 17\.000,00/.test(e.txtI), e.txtI);
// repintar sin cambios no destruye los botones (se navega con el teclado)
var r = await p.evaluate(() => { const a = document.querySelector('#alqProrrataIni input[type=radio]'); _alqProrrataPreview(); _alqProrrataPreview(); return a.isConnected && a === document.querySelector('#alqProrrataIni input[type=radio]'); });
ok('D4: repintar sin cambios conserva los mismos botones (no pierde el foco)', r === true);

// ═════════ E: un contrato YA cargado no se toca solo ═════════
await p.evaluate(async () => {
  alquileres.push({ id: 'pf_e1', unidad: 'PF-E1', inquilino: 'Viejo entero', moneda: 'ARS', canon: 310000, canonActual: 310000, inicio: '2026-10-15', fin: '2028-10-14', diaPago: 5, cobrosHistorial: [], tipo: 'local', direccion: 'Calle E1' });
  alquileres.push({ id: 'pf_e2', unidad: 'PF-E2', inquilino: 'Viejo prop', moneda: 'ARS', canon: 310000, canonActual: 310000, inicio: '2026-10-15', fin: '2028-10-14', diaPago: 5, proporcionalInicio: true, cobrosHistorial: [], tipo: 'local', direccion: 'Calle E2' });
  await persistirAlquileres();
});
await p.waitForTimeout(300);
await p.evaluate(() => abrirModalAlquiler(alquileres.findIndex(a => a.id === 'pf_e1')));
e = await estado();
ok('E1: editar un contrato que empieza el 15 pero se cargó entero lo muestra como «mes entero» (no lo cambia por su cuenta)', e.wrap && !e.ini && !e.fin && e.radI[1] === true, JSON.stringify(e));
await poner('alqInicio', '2026-10-16', 'change');
e = await estado();
ok('E2: ni siquiera al cambiarle la fecha en edición (lo cargado manda)', !e.ini && e.radI[1] === true, JSON.stringify(e));
await p.evaluate(() => abrirModalAlquiler(alquileres.findIndex(a => a.id === 'pf_e2')));
e = await estado();
ok('E3: un contrato cargado como proporcional lo muestra marcado y el último mes queda como estaba (entero)', e.ini && !e.fin && e.radI[0] === true && e.radF[1] === true, JSON.stringify(e));
await p.evaluate(async () => { await guardarAlquiler(); });
await p.waitForTimeout(300);
r = await p.evaluate(() => { const a = alquileres.find(x => x.id === 'pf_e2'); return { pi: a.proporcionalInicio, pf: !!a.proporcionalFin }; });
ok('E4: guardar sin tocar nada conserva lo que tenía', r.pi === true && r.pf === false, JSON.stringify(r));

// ═════════ F: «Otro importe» — alquiler 1000, empezó el 15, se cobra 500 ═════════
const idxDe = (id) => p.evaluate((id) => alquileres.findIndex(a => a.id === id), id);
await abrirNuevo();
await poner('alqCanon', '1000'); await poner('alqDuracion', '24'); await poner('alqInicio', '2026-10-15', 'change');
e = await estado();
ok('F1: hay tres opciones por extremo (proporcional, mes entero, otro importe) y el campo del importe está vacío', e.radI.length === 3 && e.radF.length === 3, JSON.stringify(e));
await p.evaluate(() => document.querySelectorAll('#alqProrrataIni input[type=radio]')[2].click());
let f = await p.evaluate(() => ({ v: document.getElementById('alqImporteInicio').value, otro: document.getElementById('alqOtroInicio').checked, prop: document.getElementById('alqPropInicio').checked, foco: document.activeElement && document.activeElement.id }));
ok('F2: elegir «otro importe» propone lo que daría el proporcional (548,39), lo deja editable y le da el foco', f.v === '548.39' && f.otro && !f.prop && f.foco === 'alqImporteInicio', JSON.stringify(f));
await poner('alqImporteInicio', '500');
e = await estado(); f = await p.evaluate(() => document.getElementById('alqProrrataIniPct').textContent);
ok('F3: tipear 500 lo deja elegido y dice que es el 50 % del canon', e.radI[2] === true && !e.ini && /50 % del canon/.test(f), JSON.stringify({ r: e.radI, f }));
ok('F4: al elegir otro importe el último mes sigue acompañando (proporcional hasta el 14)', e.fin && e.radF[0] === true, JSON.stringify(e.radF));
// tipear directamente en el campo también lo elige (sin tocar el botón), y tabular hasta el campo NO lo elige
await p.evaluate(() => document.querySelectorAll('#alqProrrataIni input[type=radio]')[1].click());
await poner('alqImporteInicio', '');
await p.evaluate(() => { document.getElementById('alqImporteInicio').focus(); });
e = await estado();
ok('F5: con el foco en el campo (sin tipear) sigue «mes entero»: tabular por el formulario no cambia la elección', e.radI[1] === true && !e.ini, JSON.stringify(e.radI));
await poner('alqImporteInicio', '700');
e = await estado();
ok('F6: tipear en el campo elige «otro importe» solo', e.radI[2] === true, JSON.stringify(e.radI));
await poner('alqImporteInicio', '500');
// validación: otro importe sin importe no se guarda
await poner('alqUnidad', 'PF-OTRO'); await poner('alqInquilino', 'Inquilino otro importe');
await p.evaluate(() => { document.querySelectorAll('#alqProrrataIni input[type=radio]')[1].click(); document.querySelectorAll('#alqProrrataIni input[type=radio]')[2].click(); document.getElementById('alqImporteInicio').value = ''; window.__alerts.length = 0; });
await p.evaluate(async () => { await guardarAlquiler(); });
r = await p.evaluate(() => ({ al: window.__alerts.slice(), hay: alquileres.some(a => a.unidad === 'PF-OTRO') }));
ok('F7: «otro importe» sin importe avisa y no guarda', r.al.length === 1 && /importe a cobrar del primer mes/.test(r.al[0]) && !r.hay, JSON.stringify(r));
await poner('alqImporteInicio', '0');
await p.evaluate(async () => { window.__alerts.length = 0; await guardarAlquiler(); });
r = await p.evaluate(() => ({ al: window.__alerts.slice(), hay: alquileres.some(a => a.unidad === 'PF-OTRO') }));
ok('F8: un importe de 0 tampoco (para no cobrar un mes se bonifica)', r.al.length === 1 && !r.hay, JSON.stringify(r));
await poner('alqImporteInicio', '500');
await p.evaluate(async () => { window.__alerts.length = 0; await guardarAlquiler(); });
await p.waitForTimeout(300);
r = await p.evaluate(() => { const a = alquileres.find(x => x.unidad === 'PF-OTRO'); return a ? { ii: a.importeInicio, pi: a.proporcionalInicio, pf: a.proporcionalFin, oct: _alqCanonEsperado(a, '2026-10'), nov: _alqCanonEsperado(a, '2026-11'), oct28: _alqCanonEsperado(a, '2028-10'), fr: _alqFraccionPeriodo(a, '2026-10'), fijo: _alqImporteFijo(a, '2026-10'), sp: _alqSaldoPeriodo(a, '2026-10'), sug: _alqMontoSugerido(a, '2026-10') } : null; });
ok('F9: se guardó importeInicio 500 (sin proporcional en el primer mes) y el último mes quedó proporcional', r && r.ii === 500 && r.pi === false && r.pf === true, JSON.stringify(r));
ok('F10: octubre 2026 se espera 500, noviembre 1000, octubre 2028 (14 de 31 días) 451,61', r && cerca(r.oct, 500) && cerca(r.nov, 1000) && cerca(r.oct28, 451.61), JSON.stringify(r));
ok('F11: el mes con importe pactado no tiene fracción de días y el monto sugerido es 500', r && r.fr === null && r.fijo === 500 && cerca(r.sug, 500) && cerca(r.sp.esperado, 500), JSON.stringify(r));

// plan de pagos, modal de cobro, recibo y saldo
const iO = await idxDe((await p.evaluate(() => alquileres.find(x => x.unidad === 'PF-OTRO').id)));
await p.evaluate((i) => abrirPlanAlquiler(i), iO);
await p.waitForTimeout(400);
const fila = (mes) => p.evaluate((mes) => { const tr = Array.from(document.querySelectorAll('#modalPlanAlq tr, #planAlqBody tr, tr')).find(t => new RegExp(mes, 'i').test(t.cells && t.cells[0] ? t.cells[0].textContent : '') && /2026/.test(t.cells[0].textContent)); return tr ? { txt: tr.innerText, html: tr.innerHTML } : null; }, mes);
const fo = await fila('octubre');
ok('F12: el plan muestra el importe 500,00 con «💲 importe acordado» y SIN el botón 🎁½ (no se bonifican días de un importe fijo)', fo && /500,00/.test(fo.txt) && /importe acordado/.test(fo.txt) && !/🎁½/.test(fo.txt) && /💵 Cobrar/.test(fo.txt), JSON.stringify(fo && fo.txt));
const fn = await fila('noviembre');
ok('F13: noviembre sigue entero (1.000,00) y con sus botones de siempre', fn && /1\.000,00/.test(fn.txt) && !/importe acordado/.test(fn.txt) && /🎁½/.test(fn.txt), JSON.stringify(fn && fn.txt));
await p.evaluate(() => { window.__alerts.length = 0; });
await p.evaluate((i) => _alqBonifParcialAbrir(i, '2026-10'), iO);
r = await p.evaluate(() => ({ al: window.__alerts.slice(), modal: !!document.getElementById('bpDias') }));
ok('F14: intentar bonificar días de ese mes avisa que tiene un importe acordado y no abre el diálogo', r.al.length === 1 && /importe acordado/.test(r.al[0]) && !r.modal, JSON.stringify(r));
await p.evaluate((i) => abrirModalCobroAlquiler(i, '2026-10'), iO);
await p.waitForTimeout(300);
r = await p.evaluate(() => ({ monto: document.getElementById('cobroAlqMonto').value, hint: (document.getElementById('cobroAlqProrrata') || {}).textContent, vis: (document.getElementById('cobroAlqProrrata') || {}).style.display }));
ok('F15: el modal de cobro propone 500 y lo explica («Importe acordado para el primer mes… el canon es $ 1.000,00»)', parseFloat(r.monto) === 500 && /Importe acordado para el primer mes: \$ 500,00/.test(r.hint) && /1\.000,00/.test(r.hint) && r.vis !== 'none', JSON.stringify(r));
await p.evaluate(() => { const m = document.getElementById('modalCobroAlquiler'); if (m) m.classList.remove('active'); });
// cobro parcial: el saldo se mide contra 500
r = await p.evaluate(() => { const a = alquileres.find(x => x.unidad === 'PF-OTRO'); a.cobrosHistorial = [{ id: 'fo1', periodo: '2026-10', concepto: 'alquiler', monto: 200, fecha: '2026-10-16' }]; const s1 = _alqSaldoPeriodo(a, '2026-10'); a.cobrosHistorial.push({ id: 'fo2', periodo: '2026-10', concepto: 'alquiler', monto: 300, fecha: '2026-10-20' }); const s2 = _alqSaldoPeriodo(a, '2026-10'); a.cobrosHistorial = []; return { s1, s2 }; });
ok('F16: con 200 cobrados quedan 300 (parcial) y con 500 el mes queda pagado', r.s1.parcial && cerca(r.s1.saldo, 300) && r.s2.pagada && r.s2.saldo === 0, JSON.stringify(r));
// recibo impreso
await p.evaluate(() => { window.__html = ''; window.open = () => ({ document: { write: h => { window.__html += h; }, close() {} }, focus() {}, print() {}, close() {} }); });
await p.evaluate((i) => { const a = alquileres[i]; imprimirComprobanteAlquiler(a, 500, '2026-10-16', '2026-10', 'alquiler', '', 'REC-1', { fecha: '2026-10-16', monto: 500 }); }, iO);
const rec = await p.evaluate(() => window.__html || '');
ok('F17: el recibo dice «importe acordado para el primer mes»', /importe acordado para el primer mes/.test(rec), rec.slice(0, 200));

// backend: mismo importe esperado y misma regla de fracción que la app
const srv = fs.readFileSync(new URL('../../functions/server.js', import.meta.url), 'utf8');
const mF = srv.match(/function _alqImporteFijo\(a, periodo\) \{[\s\S]*?\n\}\n/), mR = srv.match(/function _alqFraccionPeriodo\(a, periodo\) \{[\s\S]*?\n\}\n/);
const fnB = new Function(mF[0] + mR[0] + '; return { fijo: _alqImporteFijo, fr: _alqFraccionPeriodo };')();
const casos2 = [];
for (const ii of [0, 500, 1234.56]) for (const iF of [0, 300]) for (const pi of [false, true]) for (const per of ['2026-10', '2026-11', '2028-10', '2028-09']) for (const bo of [0, 5]) casos2.push({ ii, iF, pi, per, bo });
const mk = (c) => { const a = { inicio: '2026-10-15', fin: '2028-10-14', proporcionalInicio: c.pi, proporcionalFin: c.pi }; if (c.ii) a.importeInicio = c.ii; if (c.iF) a.importeFin = c.iF; if (c.bo) a.bonifParcial = { [c.per]: { dias: c.bo } }; return a; };
const front2 = await p.evaluate((casos) => casos.map(c => { const a = { inicio: '2026-10-15', fin: '2028-10-14', proporcionalInicio: c.pi, proporcionalFin: c.pi }; if (c.ii) a.importeInicio = c.ii; if (c.iF) a.importeFin = c.iF; if (c.bo) a.bonifParcial = { [c.per]: { dias: c.bo } }; return { fijo: _alqImporteFijo(a, c.per), fr: _alqFraccionPeriodo(a, c.per) }; }), casos2);
const back2 = casos2.map(c => { const a = mk(c); return { fijo: fnB.fijo(a, c.per), fr: fnB.fr(a, c.per) }; });
const difs2 = casos2.filter((c, k) => JSON.stringify(front2[k]) !== JSON.stringify(back2[k]));
ok('F18: el backend (server.js) calcula el mismo importe pactado y la misma fracción que la app en ' + casos2.length + ' casos', difs2.length === 0, JSON.stringify(difs2.slice(0, 2)));

// editar: el contrato guardado vuelve a abrirse con «otro importe» y el importe; pasarlo a «mes entero» saca la clave
await p.evaluate((i) => abrirModalAlquiler(i), iO);
e = await estado(); f = await p.evaluate(() => document.getElementById('alqImporteInicio').value);
ok('F19: al editar el contrato aparece «otro importe» elegido con el 500 guardado', e.radI[2] === true && f === '500' && !e.ini, JSON.stringify({ e: e.radI, f }));
await p.evaluate(() => document.querySelectorAll('#alqProrrataIni input[type=radio]')[1].click());
await p.evaluate(async () => { await guardarAlquiler(); });
await p.waitForTimeout(300);
r = await p.evaluate(() => { const a = alquileres.find(x => x.unidad === 'PF-OTRO'); return { tiene: 'importeInicio' in a, oct: _alqCanonEsperado(a, '2026-10'), pi: a.proporcionalInicio, pf: a.proporcionalFin }; });
ok('F20: pasarlo a «mes entero» y guardar BORRA el importe (la clave se va, no se conserva la anterior) y octubre vuelve a 1.000', r.tiene === false && cerca(r.oct, 1000) && r.pi === false && r.pf === true, JSON.stringify(r));
// llevar el inicio al día 1 limpia el importe del primer mes
await p.evaluate((i) => abrirModalAlquiler(i), iO);
await p.evaluate(() => document.querySelectorAll('#alqProrrataIni input[type=radio]')[2].click());
await poner('alqImporteInicio', '650');
await poner('alqInicio', '2026-10-01', 'change');
f = await p.evaluate(() => ({ v: document.getElementById('alqImporteInicio').value, o: document.getElementById('alqOtroInicio').checked }));
ok('F21: si el inicio pasa al día 1 el «otro importe» se descarta (ya no hay mes parcial al que aplicarlo)', f.v === '' && !f.o, JSON.stringify(f));
await p.evaluate(async () => { await guardarAlquiler(); });
await p.waitForTimeout(300);
r = await p.evaluate(() => { const a = alquileres.find(x => x.unidad === 'PF-OTRO'); return { tiene: 'importeInicio' in a }; });
ok('F22: y no se guarda', r.tiene === false, JSON.stringify(r));

// último mes con otro importe
await abrirNuevo();
await poner('alqCanon', '1000'); await poner('alqDuracion', '24'); await poner('alqInicio', '2026-10-01', 'change');
await poner('alqFin', '2028-09-20', 'change');
e = await estado();
ok('F23: contrato que empieza el 1 y termina el 20 ofrece sólo el último mes (con sus tres opciones)', e.wrap && !e.finDis && e.iniDis && e.radF.length === 3, JSON.stringify(e));
await p.evaluate(() => document.querySelectorAll('#alqProrrataFin input[type=radio]')[2].click());
await poner('alqImporteFin', '400');
await poner('alqUnidad', 'PF-FIN'); await poner('alqInquilino', 'Inquilino fin');
await p.evaluate(async () => { await guardarAlquiler(); });
await p.waitForTimeout(300);
r = await p.evaluate(() => { const a = alquileres.find(x => x.unidad === 'PF-FIN'); return a ? { ii: a.importeInicio, iF: a.importeFin, sep: _alqCanonEsperado(a, '2028-09'), ago: _alqCanonEsperado(a, '2028-08') } : null; });
ok('F24: queda importeFin 400: septiembre 2028 se espera 400 y agosto 1.000', r && r.iF === 400 && r.ii === undefined && cerca(r.sep, 400) && cerca(r.ago, 1000), JSON.stringify(r));

// ═════════ G: arreglos de la revisión de la v579 ═════════
// G1: «N meses son N cuotas» sólo cuando el último mes COMPLETA al primero (termina el día anterior al de inicio)
await abrirNuevo();
await poner('alqCanon', '310000'); await poner('alqDuracion', '24'); await poner('alqInicio', '2026-10-15', 'change');
e = await estado();
ok('G1: con fin = inicio + 24 meses − 1 día la leyenda dice «24 meses son 24 cuotas y no 25»', /24 meses son 24 cuotas y no 25/.test(e.txtF), e.txtF);
await poner('alqFin', '2028-10-20', 'change');
e = await estado();
ok('G2: con otro día de fin (20/10/2028) la leyenda no aparece: el último mes ya no completa al primero', e.finVis && !/cuotas/.test(e.txtF), e.txtF);

// G3-G9: contrato que empieza y termina en el MISMO mes (10 al 20 de marzo de 2027): un solo bloque, sin importes cruzados
await abrirNuevo();
await poner('alqCanon', '310000'); await poner('alqInicio', '2027-03-10', 'change'); await poner('alqFin', '2027-03-20', 'change');
e = await estado();
ok('G3: se ofrece UN solo bloque («Único mes — del 10/03/2027 al 20/03/2027») y el del último mes se esconde', e.wrap && !e.finVis && /Único mes/.test(e.txtI) && /10\/03\/2027 al 20\/03\/2027/.test(e.txtI), JSON.stringify({ finVis: e.finVis, t: e.txtI }));
ok('G4: «proporcional» = 11 de 31 días ($ 110.000,00) y «mes entero» = $ 310.000,00 (no el importe recortado por el otro extremo)', /11 de 31 días/.test(e.txtI) && /110\.000,00/.test(e.txtI) && /310\.000,00/.test(e.txtI) && !/200\.000|220\.000/.test(e.txtI) && !/Desde el mes siguiente/.test(e.txtI), e.txtI);
ok('G5: en un contrato nuevo queda elegido el proporcional en los dos extremos', e.ini && e.fin && e.radI[0] === true, JSON.stringify(e));
await p.evaluate(() => document.querySelectorAll('#alqProrrataIni input[type=radio]')[1].click());
e = await estado();
ok('G6: elegir «mes entero» lo aplica a los dos extremos (el importe anunciado es el que se cobra)', !e.ini && !e.fin && e.radI[1] === true, JSON.stringify(e));
await poner('alqUnidad', 'PF-MM'); await poner('alqInquilino', 'Inquilino un mes');
await p.evaluate(async () => { await guardarAlquiler(); });
await p.waitForTimeout(300);
r = await p.evaluate(() => { const a = alquileres.find(x => x.unidad === 'PF-MM'); return a ? { pi: a.proporcionalInicio, pf: a.proporcionalFin, esp: _alqCanonEsperado(a, '2027-03') } : null; });
ok('G7: guardado con «mes entero» se espera $310.000 en marzo de 2027', r && !r.pi && !r.pf && cerca(r.esp, 310000), JSON.stringify(r));
await p.evaluate(() => abrirModalAlquiler(alquileres.findIndex(a => a.unidad === 'PF-MM')));
await p.evaluate(() => document.querySelectorAll('#alqProrrataIni input[type=radio]')[0].click());
await p.evaluate(async () => { await guardarAlquiler(); });
await p.waitForTimeout(300);
r = await p.evaluate(() => { const a = alquileres.find(x => x.unidad === 'PF-MM'); return { pi: a.proporcionalInicio, pf: a.proporcionalFin, esp: _alqCanonEsperado(a, '2027-03') }; });
ok('G8: y con «proporcional» las dos marcas quedan juntas y marzo se espera $110.000 (11 de 31 días)', r.pi === true && r.pf === true && cerca(r.esp, 110000), JSON.stringify(r));
await p.evaluate(() => abrirModalAlquiler(alquileres.findIndex(a => a.unidad === 'PF-MM')));
await p.evaluate(() => document.querySelectorAll('#alqProrrataIni input[type=radio]')[2].click());
await poner('alqImporteInicio', '150');
await p.evaluate(async () => { await guardarAlquiler(); });
await p.waitForTimeout(300);
r = await p.evaluate(() => { const a = alquileres.find(x => x.unidad === 'PF-MM'); return { ii: a.importeInicio, iF: a.importeFin, pi: a.proporcionalInicio, pf: a.proporcionalFin, esp: _alqCanonEsperado(a, '2027-03') }; });
ok('G9: «otro importe» en un solo mes queda en importeInicio (150), sin importeFin ni proporcional, y marzo se espera 150', r.ii === 150 && r.iF === undefined && !r.pi && !r.pf && cerca(r.esp, 150), JSON.stringify(r));

// G10: accesibilidad: cada grupo de opciones es un radiogroup con nombre (los dos «Cobrar el mes entero» ya no se leen idénticos)
r = await p.evaluate(() => ['alqProrrataIni', 'alqProrrataFin'].map(id => { const g = document.getElementById(id), l = g.getAttribute('aria-labelledby'); return { role: g.getAttribute('role'), lbl: l, existe: !!document.getElementById(l), radios: g.querySelectorAll('input[type=radio]').length }; }));
ok('G10: los dos grupos son radiogroup, con aria-labelledby apuntando a su título', r.every(x => x.role === 'radiogroup' && x.existe && x.radios === 3), JSON.stringify(r));

console.log(res.map(x => x.join(' · ')).join('\n'));
const mal = res.filter(x => x[0] === 'FALLA').length;
console.log(`\n${res.length - mal}/${res.length} OK`);
if (errores.length) console.log('errores de JS:', errores.slice(0, 5));
await b.close();
process.exit(mal || errores.length ? 1 : 0);
