// IVA del canon de un alquiler: la «parte con IVA» es un importe que YA INCLUYE el IVA (se desagrega dividiendo por 1,21); el canon es el total a facturar.
// Antes se la tomaba como neto y se le sumaba el IVA encima (canon $5.260.905 → «total a facturar» $5.865.790,05). Corre contra la demo (base en memoria).
// Uso: node alquiler-iva-incluido.mjs   (ver README: hace falta bajar-cdn.sh antes)
import { abrirDemo, entrarAlSistema, irA } from './demo-lib.mjs';
const { b, p, errores } = await abrirDemo();
const res = [];
const ok = (n, c, x) => res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]);
await entrarAlSistema(p);
await p.evaluate(() => { window.__alerts = []; window.__confirms = []; window.alert = m => window.__alerts.push(String(m)); window.confirm = m => { window.__confirms.push(String(m)); return true; };
  window.__recs = []; window.open = () => ({ document: { write(h) { window.__rec = h; window.__recs.push(h); }, close() {} } }); window._imprimirDocHTML = h => { window.__rec = h; window.__recs.push(h); }; });
await irA(p, 'Alquileres');

// los números del dueño: canon 5.260.905,00 de los cuales 2.880.404,99 llevan IVA (incluido) y 2.380.500,01 no
const CANON = 5260905, GRAV = 2880404.99;
const PCT = Math.round(GRAV / CANON * 100 * 1e6) / 1e6;
const per = new Date().toISOString().substring(0, 7);
const nuevo = (o) => p.evaluate((o) => { var c = Object.assign({ id: 'iva_' + Math.random().toString(36).slice(2, 8), unidad: 'IVA-1', tipo: 'local', inquilino: 'Inquilino IVA', direccion: 'Calle 1', moneda: 'ARS', canon: 5260905, canonActual: 5260905,
  inicio: (new Date().getFullYear() - 1) + '-01-01', fin: (new Date().getFullYear() + 1) + '-12-31', indice: 'FIJO', frecuencia: 3, diaPago: 10, deposito: 0, depMoneda: 'ARS', depMeses: 1, cobrosHistorial: [],
  ivaActivo: true, ivaAlicuota: 21, ivaPctGravado: 0 }, o);
  alquileres.push(c); persistirAlquileres(); renderAlquileres(); return alquileres.findIndex(x => x.id === c.id); }, o);
const abrirCobro = async (idx) => { await p.evaluate(i => abrirModalCobroAlquiler(i), idx); await p.waitForTimeout(250); };
const campos = () => p.evaluate(() => ({ grav: document.getElementById('cobroAlqGravado').value, iva: document.getElementById('cobroAlqIvaMonto').value, nog: document.getElementById('cobroAlqNoGravado').value,
  monto: document.getElementById('cobroAlqMonto').value, prev: document.getElementById('cobroAlqDesglosePreview').innerText, des: document.getElementById('cobroAlqDesglose').checked, hint: document.getElementById('cobroAlqSaldo').innerText }));
const guardar = async () => { await p.evaluate(() => guardarCobroAlquiler()); await p.waitForTimeout(600); };
const cobros = (idx) => p.evaluate(i => alquileres[i].cobrosHistorial.map(c => ({ parte: c.parteIva, monto: c.monto, neto: c.montoGravado, iva: c.iva, incl: !!c.ivaIncluido, periodo: c.periodo, tipoAB: c.tipoAB })), idx);
const cerca = (x, y, t = 0.011) => Math.abs(x - y) <= t;

// ───── S1: el cálculo con los números del dueño ─────
const r = await p.evaluate(([canon, pct]) => _alqCalcIVA({ ivaActivo: true, ivaPctGravado: pct, ivaAlicuota: 21 }, canon), [CANON, PCT]);
ok('S1: la parte con IVA incluido es $ 2.880.404,99', cerca(r.gravado, 2880404.99), JSON.stringify(r));
ok('S1: el neto sale de dividir por 1,21 (≈ 2.380.500,00), no es la parte entera', cerca(r.neto, 2380500, 0.011) && r.neto < r.gravado, JSON.stringify(r));
ok('S1: el IVA es lo que sobra de desagregar (≈ 499.905,00), no el 21% encima (604.885,05)', cerca(r.iva, 499905, 0.011) && !cerca(r.iva, 604885.05), JSON.stringify(r));
ok('S1: neto + IVA = la parte con IVA, al centavo', Math.round((r.neto + r.iva) * 100) === Math.round(r.gravado * 100), JSON.stringify(r));
ok('S1: la parte sin IVA es $ 2.380.500,01', cerca(r.noGravado, 2380500.01), JSON.stringify(r));
ok('S1: el total a facturar es el canon ($ 5.260.905,00), no $ 5.865.790,05', r.total === CANON && Math.round((r.gravado + r.noGravado) * 100) === CANON * 100, JSON.stringify(r));
const r105 = await p.evaluate(() => _alqCalcIVA({ ivaActivo: true, ivaPctGravado: 100, ivaAlicuota: 10.5 }, 110500));
ok('S1: con otra alícuota (10,5%) también: 110.500 = 100.000 + 10.500', r105.neto === 100000 && r105.iva === 10500 && r105.total === 110500, JSON.stringify(r105));
const rSin = await p.evaluate(() => _alqCalcIVA({ ivaActivo: false }, 1000));
ok('S1: sin IVA activo no cambia nada', rSin.activo === false && rSin.total === 1000 && rSin.iva === 0);

// ───── S2: el formulario del contrato ─────
await p.evaluate(() => abrirModalAlquiler());
await p.waitForTimeout(250);
await p.evaluate(([canon, gravado]) => { document.getElementById('alqCanon').value = canon; document.getElementById('alqCanonActual').value = canon; var c = document.getElementById('alqIvaActivo'); c.checked = true; _alqIvaToggle();
  document.getElementById('alqIvaConIva').value = gravado; _alqIvaSync('con'); }, [CANON, GRAV]);
const f2 = await p.evaluate(() => ({ prev: document.getElementById('alqIvaPreview').innerText, sin: document.getElementById('alqIvaSinIva').value, pct: document.getElementById('alqIvaPct').value, lbl: document.getElementById('alqIvaPanel').textContent }));
ok('S2: el aviso del contrato dice «total a facturar $ 5.260.905,00»', /total a facturar \$ 5\.260\.905,00/.test(f2.prev), f2.prev);
ok('S2: lo rotula «con IVA incluido» y muestra neto + IVA', /con IVA incluido \$ 2\.880\.404,99/.test(f2.prev) && /neto \$ 2\.380\.499,99/.test(f2.prev) && /IVA \$ 499\.905,00/.test(f2.prev) && /sin IVA \$ 2\.380\.500,01/.test(f2.prev), f2.prev);
ok('S2: el campo se llama «Parte con IVA incluido» y la ayuda explica el 1,21', /Parte con IVA incluido/.test(f2.lbl) && /1,21/.test(f2.lbl), f2.lbl.slice(0, 300));
await p.evaluate(() => { if (typeof cerrarModalAlquiler === 'function') cerrarModalAlquiler(); });

// ───── S3: cobrar el mes con desglose ─────
const i1 = await nuevo({ unidad: 'IVA-A', ivaPctGravado: PCT });
await abrirCobro(i1);
let c1 = await campos();
ok('S3: el desglose viene prendido y el total a cobrar es el canon', c1.des && Number(c1.monto) === CANON, JSON.stringify(c1));
ok('S3: «parte con IVA incluido» = 2.880.404,99 y la parte sin IVA = 2.380.500,01', cerca(Number(c1.grav), 2880404.99) && cerca(Number(c1.nog), 2380500.01), JSON.stringify(c1));
ok('S3: el IVA incluido es 499.905,00', cerca(Number(c1.iva), 499905), JSON.stringify(c1));
ok('S3: la vista previa dice «Total a cobrar $ 5.260.905,00» y no suma IVA encima', /Total a cobrar: \$ 5\.260\.905,00/.test(c1.prev) && /neto \$ 2\.380\.499,99/.test(c1.prev) && !/5\.865\.790/.test(c1.prev), c1.prev);
ok('S3: el aviso de saldo no ve un cobro de más', !/se pasa/.test(c1.hint), c1.hint);
await guardar();
const k1 = await cobros(i1);
const rA = k1.find(x => x.parte === 'gravada'), rB = k1.find(x => x.parte === 'nograv');
ok('S3: se emitieron dos recibos, A (con IVA incluido) y B (sin IVA)', k1.length === 2 && rA && rB, JSON.stringify(k1));
ok('S3: el recibo A cobra la parte con IVA INCLUIDO (no neto + IVA aparte) y guarda neto e IVA', cerca(rA.monto, 2880404.99) && cerca(rA.iva, 499905) && cerca(rA.neto, rA.monto - rA.iva) && rA.incl === true, JSON.stringify(rA));
ok('S3: el recibo B cobra la parte sin IVA', cerca(rB.monto, 2380500.01), JSON.stringify(rB));
ok('S3: entre los dos se cobró EXACTAMENTE el canon', Math.round((rA.monto + rB.monto) * 100) === CANON * 100, String(rA.monto + rB.monto));
const sp1 = await p.evaluate(([i, per]) => { const s = _alqSaldoPeriodo(alquileres[i], per); return s; }, [i1, per]);
ok('S3: el mes queda «pagada», sin saldo ni cobro de más', sp1.pagada && sp1.saldo === 0 && cerca(sp1.cobrado, CANON), JSON.stringify(sp1));
await p.evaluate(i => abrirPlanAlquiler(i), i1); await p.waitForTimeout(250);
const plan1 = await p.evaluate(() => { const tr = [...document.querySelectorAll('#planAlqBody tr')].find(x => /Pagada/.test(x.innerText)); return tr ? tr.innerText.replace(/\s+/g, ' ') : document.getElementById('planAlqBody').innerText.slice(0, 300); });
ok('S3: el plan de pagos lo muestra «Pagada» y aclara que el IVA va incluido', /Pagada/.test(plan1) && /incl\. IVA/.test(plan1), plan1);
await p.evaluate(() => cerrarPlanAlquiler());
const recibos = await p.evaluate(() => window.__recs.slice());
const reA = recibos.find(h => /Neto gravado/.test(h)) || '';
ok('S3: el recibo impreso de la parte A muestra neto, IVA y el total con IVA incluido (2.880.404,99)', /Neto gravado/.test(reA) && /IVA/.test(reA) && /2\.880\.404,99/.test(reA) && !/3\.485\.290/.test(reA), reA.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 300));

// ───── S4: un recibo ANTERIOR (IVA aparte del canon) se sigue leyendo como antes ─────
const legacy = [{ fecha: new Date().toISOString().slice(0, 10), periodo: per, monto: 2880404.99 + 604885.05, concepto: 'alquiler', tipoAB: 'A', parteIva: 'gravada', montoGravado: 2880404.99, iva: 604885.05, nroRecibo: 'A-0001' },
               { fecha: new Date().toISOString().slice(0, 10), periodo: per, monto: 2380500.01, concepto: 'alquiler', tipoAB: 'B', parteIva: 'nograv', nroRecibo: 'B-0001' }];
const i2 = await nuevo({ unidad: 'IVA-LEG', ivaPctGravado: PCT, cobrosHistorial: legacy });
const sp2 = await p.evaluate(([i, per]) => _alqSaldoPeriodo(alquileres[i], per), [i2, per]);
ok('S4: un cobro anterior (monto = neto + IVA) sigue contando como canon sólo su neto: el mes figura pagado', sp2.pagada && cerca(sp2.cobrado, CANON), JSON.stringify(sp2));
const cc = await p.evaluate(() => [_alqCobroCanon({ monto: 1210, iva: 210 }), _alqCobroCanon({ monto: 1210, iva: 210, ivaIncluido: true }), _alqCobroCanon({ monto: 500 }), _alqCobroCanon(null)]);
ok('S4: _alqCobroCanon: anterior 1000, nuevo 1210, sin IVA 500, vacío 0', cc[0] === 1000 && cc[1] === 1210 && cc[2] === 500 && cc[3] === 0, JSON.stringify(cc));

// ───── S5: pago parcial con desglose ─────
const i3 = await nuevo({ unidad: 'IVA-PARC', ivaPctGravado: PCT });
await abrirCobro(i3);
await p.evaluate(() => { document.getElementById('cobroAlqGravado').value = 1210000; _cobroAlqGravadoChange(); document.getElementById('cobroAlqNoGravado').value = 790000; _cobroAlqPreview(); });
const c3 = await campos();
ok('S5: al cambiar la parte con IVA el IVA se recalcula desagregando (1.210.000 → IVA 210.000)', Number(c3.iva) === 210000, JSON.stringify(c3));
ok('S5: el total es la suma de las dos partes (2.000.000) y avisa cuánto queda', Number(c3.monto) === 2000000 && /quedan \$ 3\.260\.905,00 a cobrar/.test(c3.hint), JSON.stringify(c3));
await guardar();
const sp3 = await p.evaluate(([i, per]) => _alqSaldoPeriodo(alquileres[i], per), [i3, per]);
ok('S5: el mes queda en «parcial» por lo cobrado (2.000.000, con el IVA adentro) y falta el resto', sp3.parcial && cerca(sp3.cobrado, 2000000) && cerca(sp3.saldo, 3260905), JSON.stringify(sp3));
// el siguiente cobro propone el saldo, partido con la misma proporción
await abrirCobro(i3);
const c3b = await campos();
ok('S5: el siguiente cobro propone el saldo ($ 3.260.905,00) y no un monto con IVA de más', Number(c3b.monto) === 3260905, JSON.stringify(c3b));
await p.evaluate(() => cerrarModalCobroAlquiler());

// ───── S6: IVA tipeado a mano y su aviso ─────
const i4 = await nuevo({ unidad: 'IVA-MANO', ivaPctGravado: PCT });
await abrirCobro(i4);
await p.evaluate(() => { document.getElementById('cobroAlqIvaMonto').value = 500000; _cobroAlqIvaAMano = true; _cobroAlqPreview(); });
let c4 = await campos();
ok('S6: un IVA que no es el desagregado de su parte avisa y explica cuánto da', /El IVA no da: el IVA incluido en \$ 2\.880\.404,99 al 21% es \$ 499\.905,00/.test(c4.prev), c4.prev);
await p.evaluate(() => _cobroAlqCorregirIva());
c4 = await campos();
ok('S6: «Corregir» lo deja en el IVA desagregado', cerca(Number(c4.iva), 499905), JSON.stringify(c4));
await p.evaluate(() => { document.getElementById('cobroAlqIvaMonto').value = 3000000; _cobroAlqIvaAMano = true; _cobroAlqPreview(); });
await guardar();
ok('S6: un IVA mayor que la parte con IVA no se guarda', (await p.evaluate(() => window.__alerts)).some(m => /no puede ser mayor/.test(m)) && (await cobros(i4)).length === 0);
await p.evaluate(() => cerrarModalCobroAlquiler());

// ───── S7: editar el monto de un recibo A nuevo ─────
const i5 = await nuevo({ unidad: 'IVA-EDIT', ivaPctGravado: PCT });
await abrirCobro(i5); await guardar();
const idxA = await p.evaluate(i => alquileres[i].cobrosHistorial.findIndex(c => c.parteIva === 'gravada'), i5);
await p.evaluate(([i, ci]) => abrirEditarCobroAlquiler(i, ci), [i5, idxA]); await p.waitForTimeout(250);
await p.evaluate(() => { document.getElementById('ecaMonto').value = 1210000; });
await p.evaluate(() => guardarEdicionCobroAlquiler()); await p.waitForTimeout(400);
const kA = (await cobros(i5)).find(x => x.parte === 'gravada');
ok('S7: editar el monto del recibo A recalcula neto e IVA desagregando y conserva «IVA incluido»', kA.monto === 1210000 && kA.neto === 1000000 && kA.iva === 210000 && kA.incl === true, JSON.stringify(kA));

// ───── S8: contrato impreso ─────
await p.evaluate(i => imprimirContratoAlquiler(i), i1); await p.waitForTimeout(250);
const ctr = await p.evaluate(() => window.__rec || '');
ok('S8: el contrato impreso dice «Canon con IVA incluido», el neto, el IVA y «Total a facturar» = el canon', /Canon con IVA incluido/.test(ctr) && /Neto gravado/.test(ctr) && /Total a facturar/.test(ctr) && /5\.260\.905/.test(ctr) && !/5\.865\.790/.test(ctr), ctr.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 300));

// ───── S9: elegir otra «parte con IVA incluido» deja la parte sin IVA en «el resto» (el total no se recarga) ─────
const i6 = await nuevo({ unidad: 'IVA-RESTO', ivaPctGravado: PCT });
await abrirCobro(i6);
await p.evaluate(() => { document.getElementById('cobroAlqGravado').value = 3000000; _cobroAlqGravadoChange(); });
let c6 = await campos();
ok('S9: con 3.000.000 con IVA, la parte sin IVA pasa a ser el resto (2.260.905) y el total sigue siendo el canon', Number(c6.nog) === 2260905 && Number(c6.monto) === CANON && Number(c6.iva) === 520661.16, JSON.stringify(c6));
ok('S9: ya no avisa que se pasa del canon', !/se pasa/.test(c6.hint), c6.hint);
// tipear la parte sin IVA la suelta: las partes mandan (así se carga un pago parcial) y la parte con IVA ya no la mueve
await p.evaluate(() => { document.getElementById('cobroAlqNoGravado').value = 500000; document.getElementById('cobroAlqNoGravado').dispatchEvent(new Event('input')); });
await p.evaluate(() => { document.getElementById('cobroAlqGravado').value = 1000000; _cobroAlqGravadoChange(); });
c6 = await campos();
ok('S9: con la parte sin IVA tipeada a mano, cambiar la parte con IVA no la toca y el total es la suma (1.500.000)', Number(c6.nog) === 500000 && Number(c6.monto) === 1500000, JSON.stringify(c6));
await p.evaluate(() => cerrarModalCobroAlquiler());

// ───── S10: tildar el desglose después de tipear un monto a mano no congela el cambio de período ─────
const mesAnt = (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return d.toISOString().substring(0, 7); })();
const i7 = await nuevo({ unidad: 'IVA-PERIODO', canon: 1000000, canonActual: 1100000, ivaPctGravado: 60, ajustesCanon: [{ periodo: mesAnt, monto: 1000000 }, { periodo: per, monto: 1100000 }] });
await abrirCobro(i7);
await p.evaluate(() => { var d = document.getElementById('cobroAlqDesglose'); d.checked = false; _cobroAlqToggleDesglose(); var m = document.getElementById('cobroAlqMonto'); m.value = 600000; m.dispatchEvent(new Event('input')); d.checked = true; _cobroAlqToggleDesglose(); });
await p.evaluate(m => { document.getElementById('cobroAlqPeriodo').value = m; _cobroAlqPeriodoChange(); }, mesAnt);
const c7 = await campos();
ok('S10: al cambiar el período con el desglose prendido las partes se recalculan con el canon de ESE mes (1.000.000, no el del mes anterior)', Number(c7.monto) === 1000000 && Math.abs(Number(c7.grav) + Number(c7.nog) - 1000000) < 0.011, JSON.stringify(c7));
await p.evaluate(() => cerrarModalCobroAlquiler());

// ───── S11: el cuadro «entran $X» sigue a las partes cuando el cobro entra en otra moneda ─────
const i8 = await nuevo({ unidad: 'IVA-USD', moneda: 'USD', canon: 1000, canonActual: 1000, ivaPctGravado: 50 });
await abrirCobro(i8);
await p.evaluate(() => { var s = document.getElementById('cobroAlqMonedaCobro'); s.value = 'ARS'; document.getElementById('cobroAlqTc').value = 1000; _cobroAlqRefrescarMoneda(); });
await p.evaluate(() => { document.getElementById('cobroAlqGravado').value = 800; _cobroAlqGravadoChange(); document.getElementById('cobroAlqNoGravado').value = 400; document.getElementById('cobroAlqNoGravado').dispatchEvent(new Event('input')); });
const cv = await p.evaluate(() => ({ monto: document.getElementById('cobroAlqMonto').value, caja: document.getElementById('cobroAlqConversion').innerText }));
ok('S11: con las partes en 800 + 400 el cuadro dice USD 1.200 → entran $1.200.000 (no el importe del canon)', Number(cv.monto) === 1200 && /1\.200,00/.test(cv.caja) && /1\.200\.000,00/.test(cv.caja), JSON.stringify(cv));
await p.evaluate(() => cerrarModalCobroAlquiler());

// ───── S12: los datos de ejemplo de la demo usan el modelo nuevo ─────
const dm = await p.evaluate(() => {
  const a = alquileres.find(x => x.ivaActivo && (x.cobrosHistorial || []).some(c => c.parteIva === 'gravada'));
  if (!a) return null;
  const grav = a.cobrosHistorial.filter(c => c.parteIva === 'gravada');
  const meses = {}; a.cobrosHistorial.filter(c => c.periodo && (c.concepto === 'alquiler' || !c.concepto)).forEach(c => { meses[c.periodo] = (meses[c.periodo] || 0) + c.monto; });
  const sp = _alqSaldoPeriodo(a, per_());
  function per_() { return new Date().toISOString().substring(0, 7); }
  return { unidad: a.unidad, todosIncl: grav.every(c => c.ivaIncluido === true), cierra: grav.every(c => Math.abs(c.monto - c.montoGravado - c.iva) < 0.011), pagoMes: meses[per_()], esperado: _alqCanonEsperado(a, per_()), pagada: sp.pagada };
});
ok('S12: los recibos con IVA de la demo llevan «IVA incluido» y neto + IVA = lo cobrado', dm && dm.todosIncl && dm.cierra, JSON.stringify(dm));
ok('S12: en la demo lo cobrado de un mes con IVA es el canon (no el canon más IVA)', dm && (dm.pagoMes == null || Math.abs(dm.pagoMes - dm.esperado) < 0.011), JSON.stringify(dm));

const malos = res.filter(x => x[0] === 'FALLA');
res.forEach(x => console.log(x.join(' ')));
const errs = errores.filter(e => !/gsi|Failed to load resource|tradingview/.test(e));
console.log(`\n${res.length - malos.length}/${res.length} OK` + (errs.length ? '\nerrores de página: ' + JSON.stringify(errs.slice(0, 5)) : ''));
await b.close();
process.exit(malos.length || errs.length ? 1 : 0);
