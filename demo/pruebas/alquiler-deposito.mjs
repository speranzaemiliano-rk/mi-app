// Depósito de garantía en el plan de pagos de un alquiler: fila propia con pactado / cobrado / estado, cobro en una o varias veces, en la moneda del
// depósito (que puede no ser la del contrato), sin desglose de IVA, con recibo, y que Caja/Efectivo lo cuenten donde corresponde. Corre contra la demo.
import { abrirDemo, entrarAlSistema, irA } from './demo-lib.mjs';
const { b, p, errores } = await abrirDemo();
const res = [];
const ok = (n, c, x) => res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]);
await entrarAlSistema(p);
await p.evaluate(() => { window.__alerts = []; window.__confirms = []; window.__conf = true; window.alert = m => window.__alerts.push(String(m)); window.confirm = m => { window.__confirms.push(String(m)); return window.__conf; };
  window.open = () => ({ document: { write(h) { window.__rec = h; }, close() {} } }); });
await irA(p, 'Alquileres');

const hoy = new Date(); const per = hoy.toISOString().substring(0, 7);
const nuevo = (o) => p.evaluate((o) => { var c = Object.assign({ id: 'dep_' + Math.random().toString(36).slice(2, 8), unidad: 'T-1', tipo: 'departamento', inquilino: 'Inquilino Prueba', direccion: 'Calle 1', moneda: 'ARS', canon: 1000000, canonActual: 1000000,
  inicio: (new Date().getFullYear() - 1) + '-01-01', fin: (new Date().getFullYear() + 1) + '-12-31', indice: 'FIJO', frecuencia: 3, diaPago: 10, deposito: 0, depMoneda: 'ARS', depMeses: 1, cobrosHistorial: [] }, o);
  alquileres.push(c); persistirAlquileres(); renderAlquileres(); return alquileres.findIndex(x => x.id === c.id); }, o);
const plan = async (idx) => { await p.evaluate(i => abrirPlanAlquiler(i), idx); await p.waitForTimeout(150); return await p.evaluate(() => { var tr = document.querySelector('#planAlqBody tr'); return { txt: tr.innerText.replace(/\s+/g, ' ').trim(), html: tr.innerHTML, filas: document.querySelectorAll('#planAlqBody tr').length }; }); };
const cerrarTodo = () => p.evaluate(() => { cerrarModalCobroAlquiler(); cerrarPlanAlquiler(); });
const guardar = async () => { await p.evaluate(() => guardarCobroAlquiler()); await p.waitForTimeout(500); };
const estado = (idx) => p.evaluate(i => { var a = alquileres[i]; return { cobros: (a.cobrosHistorial || []).map(c => ({ concepto: c.concepto, periodo: c.periodo, monto: c.monto, montoMoneda: c.montoMoneda, monedaCobro: c.monedaCobro, montoCobrado: c.montoCobrado, tc: c.tc, parteIva: c.parteIva, tipoAB: c.tipoAB, nro: c.nroRecibo })) }; }, idx);

// ───── S1: contrato en pesos, depósito en pesos ─────
let i1 = await nuevo({ unidad: 'DEP-A', deposito: 1000000, depMeses: 2 });
let r = await plan(i1);
ok('S1: la primera fila del plan es el depósito de garantía', /Depósito de garantía/.test(r.txt) && /equivale a 2 meses/.test(r.txt), r.txt);
ok('S1: muestra el monto pactado y «Pendiente»', /\$ 1\.000\.000,00/.test(r.txt) && /Pendiente/.test(r.txt), r.txt);
ok('S1: tiene el botón 💵 Cobrar', /Cobrar/.test(r.txt) && !/Completar/.test(r.txt), r.txt);
let i0 = await nuevo({ unidad: 'DEP-SIN', deposito: 0 });
r = await plan(i0);
ok('contrato sin depósito: no aparece la fila (la primera es un mes)', !/Depósito de garantía/.test(r.txt), r.txt);
await cerrarTodo();
r = await plan(i1);
await p.evaluate(() => { var b = [...document.querySelectorAll('#planAlqBody tr:first-child button')].find(x => /Cobrar/.test(x.innerText)); b.click(); });
await p.waitForTimeout(250);
let m = await p.evaluate(() => ({ conc: document.getElementById('cobroAlqConcepto').value, monto: document.getElementById('cobroAlqMonto').value, perVis: getComputedStyle(document.getElementById('cobroAlqPeriodo').closest('.form-group')).visibility,
  per: document.getElementById('cobroAlqPeriodo').value, lbl: document.getElementById('cobroAlqMonedaContrato').textContent, hint: document.getElementById('cobroAlqSaldo').innerText, iva: getComputedStyle(document.getElementById('cobroAlqIvaWrap')).display, selMon: document.getElementById('cobroAlqMonedaCobro').value }));
ok('S1: el modal abre como depósito, con el pactado como monto y sin período', m.conc === 'deposito' && m.monto === '1000000' && m.perVis === 'hidden' && m.per === '', JSON.stringify(m));
ok('S1: dice que la moneda es la del depósito', /moneda del depósito/.test(m.lbl), m.lbl);
ok('S1: el aviso de saldo habla del depósito', /Depósito pactado/.test(m.hint), m.hint);
// cobro parcial
await p.evaluate(() => { document.getElementById('cobroAlqMonto').value = 400000; document.getElementById('cobroAlqMonto').dispatchEvent(new Event('input')); });
m = await p.evaluate(() => document.getElementById('cobroAlqSaldo').innerText);
ok('S1: avisa que con 400.000 quedan 600.000', /quedan \$ 600\.000,00/.test(m), m);
await guardar();
let e1 = await estado(i1);
ok('S1: el cobro quedó como depósito, sin período y en la moneda del contrato (sin marcas de otra moneda)', e1.cobros.length === 1 && e1.cobros[0].concepto === 'deposito' && !e1.cobros[0].periodo && e1.cobros[0].monto === 400000 && !e1.cobros[0].montoMoneda && !e1.cobros[0].monedaCobro && !e1.cobros[0].parteIva, JSON.stringify(e1));
ok('S1: avisó cuánto queda del depósito', (await p.evaluate(() => window.__alerts)).some(x => /quedan \$ 600\.000,00 por cobrar/.test(x)), JSON.stringify(await p.evaluate(() => window.__alerts)));
ok('S1: el recibo dice el saldo pendiente del depósito', /Depósito de garantía<\/strong>: cobrado a la fecha \$ 400\.000 de \$ 1\.000\.000/.test(await p.evaluate(() => window.__rec || '')) && /saldo pendiente \$ 600\.000/.test(await p.evaluate(() => window.__rec || '')), (await p.evaluate(() => window.__rec || '')).slice(0, 0));
r = await plan(i1);
ok('S1: el plan muestra «Parcial · falta $ 600.000,00» y 💵 Completar', /Parcial · falta \$ 600\.000,00/.test(r.txt) && /Completar/.test(r.txt), r.txt);
await p.evaluate(() => { var b = [...document.querySelectorAll('#planAlqBody tr:first-child button')].find(x => /Completar/.test(x.innerText)); b.click(); });
await p.waitForTimeout(250);
m = await p.evaluate(() => document.getElementById('cobroAlqMonto').value);
ok('S1: «Completar» propone el saldo (600.000)', m === '600000', m);
// pasarse del pactado: pide confirmación y, si se dice que no, no registra
await p.evaluate(() => { document.getElementById('cobroAlqMonto').value = 700000; window.__conf = false; window.__confirms = []; });
await guardar();
e1 = await estado(i1);
ok('S1: cobrar de más pide confirmar y, sin confirmar, no registra', e1.cobros.length === 1 && (await p.evaluate(() => window.__confirms)).some(x => /se pasa por \$ 100\.000,00/.test(x)), JSON.stringify(await p.evaluate(() => window.__confirms)));
await p.evaluate(() => { window.__conf = true; document.getElementById('cobroAlqMonto').value = 600000; });
await guardar();
e1 = await estado(i1);
ok('S1: segundo cobro registrado', e1.cobros.length === 2 && e1.cobros[1].monto === 600000, JSON.stringify(e1));
r = await plan(i1);
ok('S1: el plan muestra «Cobrado» y ya no hay botón de cobrar; sí ✏️ por cada cobro y desaplicar', /✓ Cobrado/.test(r.txt) && !/Cobrar|Completar/.test(r.txt) && /✏️1/.test(r.txt) && /✏️2/.test(r.txt) && /↩️ \(2\)/.test(r.txt), r.txt);
ok('S1: el último recibo dice que el depósito quedó cobrado completo', /Depósito de garantía cobrado completo/.test(await p.evaluate(() => window.__rec || '')));
// Efectivo en pesos / Caja General: dos movimientos «— Depósito de garantía» que suman 1.000.000
await cerrarTodo();
const movs = await p.evaluate(() => { renderEfectivoPesos(); var u = _efUltimo.ARS; return u.filas.filter(x => /DEP-A — Depósito de garantía/.test(x.desc)).map(x => x.ingreso); });
ok('S1: Efectivo en pesos lista los dos cobros como «DEP-A — Depósito de garantía» por 1.000.000', movs.length === 2 && movs.reduce((a, c) => a + c, 0) === 1000000, JSON.stringify(movs));
ok('S1: la Caja General también lo describe así', await p.evaluate(() => { renderCajaGeneral(); return _cgUltimo.filas.some(x => /DEP-A — Depósito de garantía/.test(x.desc)); }));
// contrato impreso y ficha no revientan
ok('S1: imprimir el contrato y mostrar el historial de cobros no fallan', await p.evaluate(i => { try { window.__rec = ''; imprimirContratoAlquiler(i); abrirHistorialCobrosAlquiler(i); var t = document.getElementById('_mhistAlq').innerText; document.getElementById('_mhistAlq').remove(); return /Depósito de garantía/.test(t) && /\$ 400\.000,00/.test(t) && /Depósito/.test(window.__rec); } catch (e) { return String(e); } }, i1));
// editar un cobro del depósito y desaplicar todo
await plan(i1);
await p.evaluate(() => document.querySelector('#planAlqBody tr:first-child button[onclick^="abrirEditarCobroAlquiler"]').click());
await p.waitForTimeout(200);
ok('S1: ✏️ abre el cobro como depósito', await p.evaluate(() => document.getElementById('ecaConcepto').value === 'deposito' && document.getElementById('ecaMonto').value === '400000'));
await p.evaluate(() => { document.getElementById('ecaMonto').value = 300000; guardarEdicionCobroAlquiler(); });
await p.waitForTimeout(200);
r = await plan(i1);
ok('S1: tras editar a 300.000 el depósito queda «Parcial · falta $ 100.000,00»', /Parcial · falta \$ 100\.000,00/.test(r.txt), r.txt);
await p.evaluate(() => { window.__conf = true; document.querySelector('#planAlqBody tr:first-child button[onclick^="desaplicarDepositoAlquiler"]').click(); });
await p.waitForTimeout(250);
e1 = await estado(i1); r = await plan(i1);
ok('S1: desaplicar quita todos los cobros del depósito y vuelve a «Pendiente»', e1.cobros.length === 0 && /Pendiente/.test(r.txt) && /Cobrar/.test(r.txt), JSON.stringify(e1) + r.txt);
await cerrarTodo();

// ───── S2: contrato en PESOS con depósito en DÓLARES ─────
let i2 = await nuevo({ unidad: 'DEP-USD', deposito: 1000, depMoneda: 'USD' });
r = await plan(i2);
ok('S2: la fila muestra el depósito en dólares', /USD 1\.000,00/.test(r.txt), r.txt);
await p.evaluate(() => { [...document.querySelectorAll('#planAlqBody tr:first-child button')].find(x => /Cobrar/.test(x.innerText)).click(); });
await p.waitForTimeout(250);
m = await p.evaluate(() => ({ monto: document.getElementById('cobroAlqMonto').value, selMon: document.getElementById('cobroAlqMonedaCobro').value, lbl: document.getElementById('cobroAlqMonedaContrato').textContent, tcVis: getComputedStyle(document.getElementById('cobroAlqTcWrap')).display }));
ok('S2: el modal propone USD 1.000, cobra en dólares y no pide tipo de cambio', m.monto === '1000' && m.selMon === 'USD' && /USD, la moneda del depósito/.test(m.lbl) && m.tcVis === 'none', JSON.stringify(m));
await p.evaluate(() => { document.getElementById('cobroAlqMonto').value = 500; });
await guardar();
let e2 = await estado(i2);
ok('S2: el cobro guarda el monto en USD y lo marca (montoMoneda, monedaCobro y montoCobrado en USD)', e2.cobros.length === 1 && e2.cobros[0].monto === 500 && e2.cobros[0].montoMoneda === 'USD' && e2.cobros[0].monedaCobro === 'USD' && e2.cobros[0].montoCobrado === 500, JSON.stringify(e2));
ok('S2: la plata cuenta como DÓLARES para la caja (no como pesos)', await p.evaluate(i => { var a = alquileres[i], c = a.cobrosHistorial[0]; return _alqCobroMoneda(a, c) === 'USD' && _alqCobroImporte(a, c) === 500; }, i2));
// el resto, pagado en pesos al TC del día: 500 USD × 1200 = 600.000 pesos
await p.evaluate(i => abrirModalCobroAlquiler(i, '', 'deposito'), i2); await p.waitForTimeout(200);
await p.evaluate(() => { document.getElementById('cobroAlqMonto').value = 500; document.getElementById('cobroAlqMonedaCobro').value = 'ARS'; _cobroAlqRefrescarMoneda(); document.getElementById('cobroAlqTc').value = 1200; _cobroAlqRefrescarMoneda(); });
m = await p.evaluate(() => document.getElementById('cobroAlqConversion').innerText);
ok('S2: la conversión dice «Depósito de USD 500 × TC → entran $ 600.000»', /Depósito de USD 500,00 × TC \$1\.200,00 → entran \$600\.000,00 en pesos/.test(m), m);
await guardar();
e2 = await estado(i2);
ok('S2: el segundo cobro entró en pesos al TC (monto 500 USD, montoCobrado 600.000)', e2.cobros.length === 2 && e2.cobros[1].monto === 500 && e2.cobros[1].monedaCobro === 'ARS' && e2.cobros[1].montoCobrado === 600000 && e2.cobros[1].tc === 1200 && e2.cobros[1].montoMoneda === 'USD', JSON.stringify(e2));
r = await plan(i2);
ok('S2: el depósito figura «Cobrado» por USD 1.000 (500 + 500)', /✓ Cobrado/.test(r.txt) && /USD 1\.000,00/.test(r.txt), r.txt);
const mv = await p.evaluate(() => { renderEfectivoPesos(); renderEfectivoUSD(); return { ars: _efUltimo.ARS.filas.filter(x => /DEP-USD/.test(x.desc)).map(x => x.ingreso), usd: _efUltimo.USD.filas.filter(x => /DEP-USD/.test(x.desc)).map(x => x.ingreso) }; });
ok('S2: Efectivo en pesos recibió $ 600.000 y Efectivo en dólares USD 500', JSON.stringify(mv.ars) === '[600000]' && JSON.stringify(mv.usd) === '[500]', JSON.stringify(mv));
ok('S2: el recibo de un depósito en dólares de un contrato en pesos sale en USD', await p.evaluate(i => { window.__rec = ''; var a = alquileres[i], c = a.cobrosHistorial[0]; imprimirComprobanteAlquiler(a, c.monto, c.fecha, c.periodo, c.concepto, c.ref, c.nroRecibo, c); return /USD 500/.test(window.__rec) && !/\$ 500/.test(window.__rec.replace(/USD 500/g, '')); }, i2));
ok('S2: editar el cobro en pesos recalcula lo recibido con su TC (monto 400 → $ 480.000)', await p.evaluate(async (i) => { _editCobroAlqIdx = i; abrirEditarCobroAlquiler(i, 1); document.getElementById('ecaMonto').value = 400; guardarEdicionCobroAlquiler(); var c = alquileres[i].cobrosHistorial[1]; return c.montoCobrado === 480000 && c.monto === 400; }, i2));
ok('S2: ficha y total del contrato no mezclan monedas', await p.evaluate(i => { window.__rec = ''; imprimirContratoAlquiler(i); return /USD 500/.test(window.__rec) && /Total cobrado<\/strong><\/td><td class="tr"><strong>\$ 0</.test(window.__rec); }, i2));
await cerrarTodo();

// ───── S3: contrato con IVA: el depósito no se desglosa; cambiar de concepto restaura todo ─────
let i3 = await nuevo({ unidad: 'DEP-IVA', deposito: 500000, ivaActivo: true, ivaAlicuota: 21, ivaPctGravado: 50 });
await p.evaluate(([i, pr]) => abrirModalCobroAlquiler(i, pr), [i3, per]); await p.waitForTimeout(250);
let s0 = await p.evaluate(() => ({ iva: getComputedStyle(document.getElementById('cobroAlqIvaWrap')).display, chk: document.getElementById('cobroAlqDesglose').checked, monto: document.getElementById('cobroAlqMonto').value, dis: document.getElementById('cobroAlqMonto').disabled, per: document.getElementById('cobroAlqPeriodo').value }));
ok('S3: (precondición) cobro de alquiler con IVA abre con el desglose activo', s0.iva !== 'none' && s0.chk === true && s0.dis === true, JSON.stringify(s0));
await p.evaluate(() => { var s = document.getElementById('cobroAlqConcepto'); s.value = 'deposito'; _cobroAlqConceptoChange(); });
let s1 = await p.evaluate(() => ({ iva: getComputedStyle(document.getElementById('cobroAlqIvaWrap')).display, chk: document.getElementById('cobroAlqDesglose').checked, monto: document.getElementById('cobroAlqMonto').value, dis: document.getElementById('cobroAlqMonto').disabled, per: document.getElementById('cobroAlqPeriodo').value }));
ok('S3: al elegir «Depósito de garantía» se esconde el desglose de IVA, el monto queda editable y propone el pactado', s1.iva === 'none' && s1.chk === false && s1.dis === false && s1.monto === '500000' && s1.per === '', JSON.stringify(s1));
await p.evaluate(() => { var s = document.getElementById('cobroAlqConcepto'); s.value = 'alquiler'; _cobroAlqConceptoChange(); });
let s2 = await p.evaluate(() => ({ iva: getComputedStyle(document.getElementById('cobroAlqIvaWrap')).display, chk: document.getElementById('cobroAlqDesglose').checked, dis: document.getElementById('cobroAlqMonto').disabled, per: document.getElementById('cobroAlqPeriodo').value, vis: getComputedStyle(document.getElementById('cobroAlqPeriodo').closest('.form-group')).visibility, grav: document.getElementById('cobroAlqGravado').value }));
ok('S3: al volver a «Alquiler mensual» vuelve el desglose, el período del mes y su monto', s2.iva !== 'none' && s2.chk === true && s2.dis === true && s2.per === per && s2.vis !== 'hidden' && Number(s2.grav) > 0, JSON.stringify(s2));
// registrar el depósito de un contrato con IVA: un solo recibo, sin partes de IVA
await p.evaluate(() => { var s = document.getElementById('cobroAlqConcepto'); s.value = 'deposito'; _cobroAlqConceptoChange(); });
await guardar();
let e3 = await estado(i3);
ok('S3: el depósito de un contrato con IVA se registra en UN recibo, sin partes de IVA', e3.cobros.length === 1 && e3.cobros[0].concepto === 'deposito' && !e3.cobros[0].parteIva && e3.cobros[0].monto === 500000, JSON.stringify(e3));
await cerrarTodo();

// ───── S4: contrato sin fecha de inicio: el depósito igual figura; Finalizar lo resume ─────
let i4 = await nuevo({ unidad: 'DEP-SININI', inicio: '', fin: '', deposito: 250000 });
r = await plan(i4);
ok('S4: sin fecha de inicio el plan igual muestra el depósito (y el aviso del inicio)', /Depósito de garantía/.test(r.txt) && /\$ 250\.000,00/.test(r.txt) && /no tiene fecha de inicio/.test(await p.evaluate(() => document.getElementById('planAlqBody').innerText)), r.txt);
await cerrarTodo();
await p.evaluate(i => abrirFinalizarAlq(i), i1 + 0);
ok('S4: «Finalizar» resume el depósito con su estado de cobro', /sin cobrar/.test(await p.evaluate(() => document.getElementById('finAlqResumen').innerText)), await p.evaluate(() => document.getElementById('finAlqResumen').innerText));
await p.evaluate(() => cerrarFinalizarAlq());
// un cobro de depósito anterior (sin la marca nueva) sigue sumando como siempre
let i5 = await nuevo({ unidad: 'DEP-VIEJO', deposito: 800000, cobrosHistorial: [{ fecha: '2026-01-05', periodo: '', monto: 800000, concepto: 'deposito', nroRecibo: 'X-1', tipoAB: 'B' }] });
r = await plan(i5);
ok('S5: un depósito ya cobrado antes de esta función figura «Cobrado» en el plan', /✓ Cobrado/.test(r.txt) && !/Cobrar/.test(r.txt), r.txt);
await cerrarTodo();

ok('sin errores de JS', errores.filter(e => !/net::|Failed to load/.test(e)).length === 0, JSON.stringify(errores));
console.log(res.map(x => x.join(' ')).join('\n'));
console.log(res.filter(x => x[0] !== 'OK ').length ? '\n❌ HAY FALLAS' : '\n✅ todo OK (' + res.length + ')');
await b.close();
if (res.some(x => x[0] !== 'OK ')) process.exitCode = 1;
