// Alquileres: el primer / último mes proporcional se OFRECE al cargar el contrato (bloque debajo de las fechas, botones de opción con el importe de cada una).
// Corre contra la demo (base en memoria). Uso: node alquiler-proporcional-form.mjs   (ver README: hace falta bajar-cdn.sh antes)
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
ok('A1: al abrir un contrato nuevo no hay nada marcado de entrada (la fecha por defecto es hoy)', !e.ini && !e.fin, JSON.stringify(e));
await poner('alqCanon', '310000');
await poner('alqDuracion', '24');
await poner('alqInicio', '2026-10-15', 'change');
e = await estado();
ok('A2: con inicio el 15/10 aparece el bloque y queda elegido «proporcional» (casilla del estado y botón de opción)', e.wrap && e.ini && !e.iniDis && e.radI.length === 2 && e.radI[0] === true && e.radI[1] === false, JSON.stringify(e));
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
ok('A5c: sin duración el texto no inventa un número', /primer y el último mes suman una cuota/.test(e.txtF) && !/\d+ meses son/.test(e.txtF), e.txtF);
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
ok('C4: sin fecha de inicio no ofrece el primer mes', !e.radI.length || !/empieza/.test(e.txtI), JSON.stringify(e));

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

console.log(res.map(x => x.join(' · ')).join('\n'));
const mal = res.filter(x => x[0] === 'FALLA').length;
console.log(`\n${res.length - mal}/${res.length} OK`);
if (errores.length) console.log('errores de JS:', errores.slice(0, 5));
await b.close();
process.exit(mal || errores.length ? 1 : 0);
