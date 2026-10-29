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

// ───── Hallazgos de la revisión independiente (v566 → v567) ─────
// (extracto) un depósito en dólares de un contrato en pesos, cobrado por BANCO en pesos al TC: el extracto suma lo que entró ($ 6.000.000), no los 5.000 crudos
let iB = await nuevo({ unidad: 'DEP-BCO', deposito: 5000, depMoneda: 'USD' });
await p.evaluate(i => abrirModalCobroAlquiler(i, '', 'deposito'), iB); await p.waitForTimeout(200);
await p.evaluate(() => { document.getElementById('cobroAlqModalidad').value = 'A'; _cobroAlqAdjuntosToggle(); document.getElementById('cobroAlqMonedaCobro').value = 'ARS'; _cobroAlqRefrescarMoneda(); document.getElementById('cobroAlqTc').value = 1200; _cobroAlqRefrescarMoneda(); });
await guardar();
const ext = await p.evaluate(() => { renderExtractoBancario(); return [...document.querySelectorAll('#cbExtBody tr')].map(tr => tr.innerText.replace(/\s+/g, ' ')).filter(x => /DEP-BCO/.test(x)); });
ok('extracto: el depósito cobrado por banco entra por lo recibido ($ 6.000.000), no por los USD 5.000', ext.length === 1 && /6\.000\.000,00/.test(ext[0]) && !/\b5\.000,00/.test(ext[0]), JSON.stringify(ext));
// (excel) el total del contrato no mezcla un cobro en otra moneda
ok('Excel: el «TotalCobrado» del contrato no suma el depósito en dólares como pesos', await p.evaluate(i => { var a = alquileres[i]; var f = (a.cobrosHistorial || []).reduce(function (s, x) { return _alqMonedaMonto(a, x) === (a.moneda || 'ARS') ? s + (x.monto || 0) : s; }, 0); return f === 0; }, iB));
// (confirmar eliminar) rotula la moneda del cobro
await p.evaluate(() => { window.__confirms = []; window.__conf = false; });
await p.evaluate(i => eliminarCobroAlquiler(i, 0), iB);
ok('eliminar un cobro: el confirm dice «USD 5.000,00», no «$»', (await p.evaluate(() => window.__confirms)).some(x => /Eliminar este cobro de USD 5\.000,00\?/.test(x)), JSON.stringify(await p.evaluate(() => window.__confirms)));
await p.evaluate(() => { window.__conf = true; });
// (adjuntos huérfanos) cobrar de más por banco, con archivo, y cancelar el confirm: no se sube nada
let iC = await nuevo({ unidad: 'DEP-ORF', deposito: 1000 });
await p.evaluate(i => abrirModalCobroAlquiler(i, '', 'deposito'), iC); await p.waitForTimeout(200);
await p.evaluate(() => { window.__subidas = 0; var ref0 = REF_DOCS; var orig = REF_DOCS.child.bind(REF_DOCS); REF_DOCS.child = function (id) { var r = orig(id); var s0 = r.set.bind(r); r.set = function (v) { window.__subidas++; return s0(v); }; return r; };
  document.getElementById('cobroAlqModalidad').value = 'A'; _cobroAlqAdjuntosToggle(); document.getElementById('cobroAlqMonto').value = 5000; window.__conf = false; });
await p.setInputFiles('#cobroAlqTransfArchivo', { name: 'transf.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64') });
await guardar();
ok('cobrar de más y cancelar: no se subió ningún archivo y no hay cobro', (await p.evaluate(() => window.__subidas)) === 0 && (await estado(iC)).cobros.length === 0, String(await p.evaluate(() => window.__subidas)));
await p.evaluate(() => { window.__conf = true; cerrarModalCobroAlquiler(); });
// (modal) ir y volver entre Alquiler y Depósito en un contrato con IVA restaura EXACTAMENTE lo que había (desglose, destinos, monto a mano, período)
let iD = await nuevo({ unidad: 'DEP-RES', deposito: 500000, ivaActivo: true, ivaAlicuota: 21, ivaPctGravado: 50, ajustesCanon: [{ periodo: (new Date().getFullYear()) + '-12', monto: 2000000 }] });
await p.evaluate(([i, pr]) => abrirModalCobroAlquiler(i, pr), [iD, per]); await p.waitForTimeout(250);
await p.evaluate(() => { document.getElementById('cobroAlqMedioA').value = 'A'; _cobroAlqPreview(); document.getElementById('cobroAlqFacturaNro').value = 'A 0001-00000042'; document.getElementById('cobroAlqGravado').value = 400000; _cobroAlqGravadoChange(); });
const antes = await p.evaluate(() => ({ monto: document.getElementById('cobroAlqMonto').value, grav: document.getElementById('cobroAlqGravado').value, medioA: document.getElementById('cobroAlqMedioA').value, chk: document.getElementById('cobroAlqDesglose').checked, nro: document.getElementById('cobroAlqFacturaNro').value, per: document.getElementById('cobroAlqPeriodo').value, banco: getComputedStyle(document.getElementById('cobroAlqBancoWrap')).display }));
await p.evaluate(() => { var s = document.getElementById('cobroAlqConcepto'); s.value = 'deposito'; _cobroAlqConceptoChange(); document.getElementById('cobroAlqMonto').value = 123456; document.getElementById('cobroAlqMonto').dispatchEvent(new Event('input')); });
await p.evaluate(() => { var s = document.getElementById('cobroAlqConcepto'); s.value = 'alquiler'; _cobroAlqConceptoChange(); });
const desp = await p.evaluate(() => ({ monto: document.getElementById('cobroAlqMonto').value, grav: document.getElementById('cobroAlqGravado').value, medioA: document.getElementById('cobroAlqMedioA').value, chk: document.getElementById('cobroAlqDesglose').checked, nro: document.getElementById('cobroAlqFacturaNro').value, per: document.getElementById('cobroAlqPeriodo').value, banco: getComputedStyle(document.getElementById('cobroAlqBancoWrap')).display, amano: _cobroAlqMontoAMano }));
ok('modal: volver de «Depósito» restaura el desglose, sus destinos, el neto editado, el N° de factura y el período', antes.monto === desp.monto && antes.grav === desp.grav && antes.medioA === desp.medioA && antes.chk === desp.chk && antes.nro === desp.nro && antes.per === desp.per && antes.banco === desp.banco && desp.amano === false, JSON.stringify({ antes, desp }));
// el monto tipeado a mano en el depósito no congela el recálculo: cambiar el período a diciembre (con ajuste de canon) da lo mismo que sin haber pasado por el depósito
const dic = (new Date().getFullYear()) + '-12';
const montoDic = async (conDesvio) => { await p.evaluate(() => cerrarModalCobroAlquiler()); await p.evaluate(([i, pr]) => abrirModalCobroAlquiler(i, pr), [iD, per]); await p.waitForTimeout(150);
  if (conDesvio) await p.evaluate(() => { var s = document.getElementById('cobroAlqConcepto'); s.value = 'deposito'; _cobroAlqConceptoChange(); document.getElementById('cobroAlqMonto').value = 123456; document.getElementById('cobroAlqMonto').dispatchEvent(new Event('input')); s.value = 'alquiler'; _cobroAlqConceptoChange(); });
  return await p.evaluate(d => { document.getElementById('cobroAlqPeriodo').value = d; _cobroAlqPeriodoChange(); return document.getElementById('cobroAlqMonto').value; }, dic); };
const dControl = await montoDic(false), dDesvio = await montoDic(true);
ok('modal: el monto tipeado en el depósito no congela el recálculo del alquiler (diciembre, con ajuste de canon)', dControl === dDesvio && Number(dControl) > 2000000, JSON.stringify({ dControl, dDesvio }));
// (modal) Depósito → «Otro»: no arrastra el monto del depósito (otra moneda)
await p.evaluate(() => { cerrarModalCobroAlquiler(); });
let iE = await nuevo({ unidad: 'DEP-OTRO', deposito: 1000, depMoneda: 'USD', ivaActivo: true, ivaAlicuota: 21, ivaPctGravado: 50 });
await p.evaluate(([i, pr]) => abrirModalCobroAlquiler(i, pr), [iE, per]); await p.waitForTimeout(200);
const mAntes = await p.evaluate(() => document.getElementById('cobroAlqMonto').value);
await p.evaluate(() => { var s = document.getElementById('cobroAlqConcepto'); s.value = 'deposito'; _cobroAlqConceptoChange(); s.value = 'otro'; _cobroAlqConceptoChange(); });
const mDesp = await p.evaluate(() => ({ monto: document.getElementById('cobroAlqMonto').value, mon: document.getElementById('cobroAlqMonedaCobro').value }));
ok('modal: de «Depósito» a «Otro» vuelve el monto y la moneda de antes, no los USD 1.000', mDesp.monto === mAntes && mDesp.mon === 'ARS', JSON.stringify({ mAntes, mDesp }));
await p.evaluate(() => cerrarModalCobroAlquiler());
// (modal) reabrir: no queda período viejo de una apertura anterior
await p.evaluate(([i, pr]) => abrirModalCobroAlquiler(i, pr), [iE, '2026-03']); await p.waitForTimeout(150);
await p.evaluate(() => { var s = document.getElementById('cobroAlqConcepto'); s.value = 'deposito'; _cobroAlqConceptoChange(); });
await p.evaluate(() => cerrarModalCobroAlquiler());
await p.evaluate(([i, pr]) => abrirModalCobroAlquiler(i, pr), [iE, per]); await p.waitForTimeout(150);
await p.evaluate(() => { document.getElementById('cobroAlqPeriodo').value = ''; var s = document.getElementById('cobroAlqConcepto'); s.value = 'deposito'; _cobroAlqConceptoChange(); s.value = 'alquiler'; _cobroAlqConceptoChange(); });
ok('modal: al volver de «Depósito» el período es el de ESTA apertura (vacío), no uno de una anterior', (await p.evaluate(() => document.getElementById('cobroAlqPeriodo').value)) === '', await p.evaluate(() => document.getElementById('cobroAlqPeriodo').value));
await p.evaluate(() => cerrarModalCobroAlquiler());
// (plan) varias parcialidades: el contenedor del plan scrollea de costado, así que nada queda inalcanzable
let iF = await nuevo({ unidad: 'DEP-3P', deposito: 3000000 });
for (const mto of [500000, 500000, 500000]) { await p.evaluate(i => abrirModalCobroAlquiler(i, '', 'deposito'), iF); await p.waitForTimeout(100); await p.evaluate(m => { document.getElementById('cobroAlqMonto').value = m; }, mto); await guardar(); }
await plan(iF);
ok('plan: el contenedor del plan permite scroll horizontal', await p.evaluate(() => { var c = document.getElementById('planAlqBody').closest('div'); return getComputedStyle(c).overflowX === 'auto'; }));
await cerrarTodo();
// (editar) la «moneda del monto»: un cobro viejo ambiguo se corrige, y pasar un depósito a «alquiler» limpia las marcas de moneda
let iG = await nuevo({ unidad: 'DEP-AMB', deposito: 1000, depMoneda: 'USD', cobrosHistorial: [{ fecha: '2026-01-05', periodo: '', monto: 1200000, concepto: 'deposito', nroRecibo: 'V-1', tipoAB: 'B' }] });
r = await plan(iG);
ok('editar: un cobro viejo de depósito sin moneda se marca «revisar»', /revisar un cobro en otra moneda/.test(r.txt), r.txt);
await p.evaluate(() => document.querySelector('#planAlqBody tr:first-child button[onclick^="abrirEditarCobroAlquiler"]').click()); await p.waitForTimeout(150);
ok('editar: aparece «Moneda del monto» (el depósito está en otra moneda que el contrato) y el período queda deshabilitado', await p.evaluate(() => getComputedStyle(document.getElementById('ecaMonedaMontoWrap')).display !== 'none' && document.getElementById('ecaPeriodo').disabled));
await p.evaluate(() => { document.getElementById('ecaMonto').value = 1000; document.getElementById('ecaMonedaMonto').value = 'USD'; guardarEdicionCobroAlquiler(); });
await p.waitForTimeout(150);
let eG = await estado(iG); r = await plan(iG);
ok('editar: tras decir «1.000 USD» el cobro queda en dólares para Caja, el depósito «Cobrado» y sin aviso', eG.cobros[0].montoMoneda === 'USD' && eG.cobros[0].monedaCobro === 'USD' && eG.cobros[0].montoCobrado === 1000 && /✓ Cobrado/.test(r.txt) && !/revisar/.test(r.txt), JSON.stringify(eG) + r.txt);
await p.evaluate(() => { var i = alquileres.findIndex(x => x.unidad === 'DEP-AMB'); abrirEditarCobroAlquiler(i, 0); document.getElementById('ecaConcepto').value = 'alquiler'; _ecaConceptoChange(); document.getElementById('ecaPeriodo').value = new Date().toISOString().substring(0, 7); guardarEdicionCobroAlquiler(); });
await p.waitForTimeout(150);
eG = await estado(iG);
ok('editar: pasar el cobro a «Alquiler» le saca las marcas de moneda del depósito (queda en la moneda del contrato)', !eG.cobros[0].montoMoneda && !eG.cobros[0].monedaCobro && !eG.cobros[0].montoCobrado && eG.cobros[0].concepto === 'alquiler' && !!eG.cobros[0].periodo, JSON.stringify(eG));
await cerrarTodo();

ok('sin errores de JS', errores.filter(e => !/net::|Failed to load/.test(e)).length === 0, JSON.stringify(errores));
console.log(res.map(x => x.join(' ')).join('\n'));
console.log(res.filter(x => x[0] !== 'OK ').length ? '\n❌ HAY FALLAS' : '\n✅ todo OK (' + res.length + ')');
await b.close();
if (res.some(x => x[0] !== 'OK ')) process.exitCode = 1;
