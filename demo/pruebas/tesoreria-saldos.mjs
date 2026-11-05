// Tesorería interempresa: los saldos tienen que ser LOS MISMOS que muestran Caja General (Caja ARS / USD) y Cuentas Bancarias (Banco), para cada proyecto.
// Antes la tabla sumaba sólo la rama ingGeneral (sin cobros de ventas/alquileres/servicios ni pagos de presupuestos/facturas/documentos), tomaba un
// «mov_banco_salida» como ingreso y leía el «Banco» de una rama que nadie escribe (global/banco/movimientos, siempre $0).
// Corre contra la demo (base en memoria). Uso: node tesoreria-saldos.mjs   (ver README: hace falta bajar-cdn.sh antes)
import { abrirDemo, entrarAlSistema, irA } from './demo-lib.mjs';
const { b, p, errores } = await abrirDemo();
const res = [];
const ok = (n, c, x) => res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]);
await entrarAlSistema(p);
await p.evaluate(() => { window.__alerts = []; window.alert = m => window.__alerts.push(String(m)); window.confirm = () => true; window.open = () => ({ document: { write() {}, close() {} } }); window._imprimirDocHTML = () => {}; });

const EMP1 = 'Constructora Los Álamos S.A.', EMP2 = 'Inmobiliaria Del Plata S.R.L.';
// '$170.982.871,66' → 170982871.66 · 'USD 473,770' → 473770
const pesos = s => Number(String(s).replace(/[^\d,\-]/g, '').replace(',', '.'));
const dolares = s => Number(String(s).replace(/USD\s*/, '').replace(/,/g, ''));
const cerca = (x, y, t = 0.011) => Math.abs(x - y) <= t;

// lo que dice la Tesorería (tabla + pie + nota), después de dejar que terminen las lecturas
const tes = async () => { await irA(p, 'Tesoreria'); await p.waitForTimeout(1800);
  return p.evaluate(() => ({ filas: [...document.querySelectorAll('#tesSaldosBody tr')].map(tr => [...tr.children].map(td => td.innerText.replace(/\s+/g, ' ').trim())),
    foot: [...document.querySelectorAll('#tesSaldosFoot td')].map(td => td.innerText.replace(/\s+/g, ' ').trim()), nota: (document.getElementById('tesSaldosNota') || {}).innerText || '' })); };
const fila = (t, emp) => t.filas.find(f => f[0].indexOf(emp) !== -1);
// lo que dicen las pantallas del proyecto ACTIVO
const pantallas = async () => { await irA(p, 'CajaGeneral');
  const cg = await p.evaluate(() => [document.getElementById('cgSaldoARS').textContent, document.getElementById('cgSaldoUSD').textContent]);
  await irA(p, 'CuentasBancarias');
  const cb = await p.evaluate(() => document.getElementById('cbSaldoTotal').textContent);
  return { ars: cg[0], usd: cg[1], banco: cb }; };
const cambiarA = async (eid) => { await p.evaluate(e => { document.getElementById('selEmpresa').value = e; cambiarEmpresa(); }, eid);
  await p.waitForFunction(e => empresaActual.id === e && typeof _docsCargados !== 'undefined' && _docsCargados, eid, { timeout: 20000 }); await p.waitForTimeout(1500); };
const hoy = new Date().toISOString().slice(0, 10), mes = hoy.slice(0, 7);

// ───── S1: el proyecto ACTIVO coincide con Caja General y Cuentas Bancarias ─────
let t1 = await tes();
const f1 = fila(t1, EMP1), fP0 = fila(t1, EMP2);
ok('S1: la tabla lista los dos proyectos de las dos empresas', t1.filas.length === 2 && f1 && fP0, JSON.stringify(t1.filas));
const pan1 = await pantallas();
ok('S1: Caja ARS de la Tesorería = saldo de Caja General (' + pan1.ars + ')', f1 && f1[2] === pan1.ars, f1 && f1[2] + ' vs ' + pan1.ars);
ok('S1: Caja USD de la Tesorería = saldo de Caja General (' + pan1.usd + ')', f1 && f1[3] === pan1.usd, f1 && f1[3] + ' vs ' + pan1.usd);
ok('S1: Banco de la Tesorería = «Saldo neto» de Cuentas Bancarias (' + pan1.banco + ')', f1 && f1[4] === pan1.banco, f1 && f1[4] + ' vs ' + pan1.banco);
ok('S1: el Banco ya no es $0 (antes leía una rama que nadie escribe)', f1 && pesos(f1[4]) > 0, f1 && f1[4]);
ok('S1: la fila del proyecto activo lo dice', f1 && /proyecto activo/.test(f1[1]), f1 && f1[1]);

// ───── S2: OTRO proyecto (que no está cargado en memoria) coincide con lo que mostrará su propia Caja General ─────
ok('S2: la Tesorería no cambió el proyecto activo al leer el otro', await p.evaluate(() => empresaActual.id === 'emp_demo_1' && proyectoActual.id === 'proy_alamos'));
await cambiarA('emp_demo_2');
const panP = await pantallas();
ok('S2: Caja ARS de la otra empresa (leída de la nube) = su Caja General', fP0[2] === panP.ars, fP0[2] + ' vs ' + panP.ars);
ok('S2: Caja USD de la otra empresa = su Caja General', fP0[3] === panP.usd, fP0[3] + ' vs ' + panP.usd);
ok('S2: Banco de la otra empresa = su Cuentas Bancarias', fP0[4] === panP.banco, fP0[4] + ' vs ' + panP.banco);
ok('S2: la otra empresa tiene alquileres (en la rama vieja de la Tesorería su Caja era $0)', pesos(fP0[2]) > 0, fP0[2]);
const t2 = await tes();
ok('S2: con el proyecto activo cambiado, las dos filas siguen igual (una de memoria, la otra de la nube)', fila(t2, EMP2)[2] === panP.ars && fila(t2, EMP1)[2] === f1[2] && fila(t2, EMP1)[4] === f1[4], JSON.stringify(t2.filas));
ok('S2: ahora la marcada como activa es la otra', /proyecto activo/.test(fila(t2, EMP2)[1]) && !/proyecto activo/.test(fila(t2, EMP1)[1]));
await cambiarA('emp_demo_1');

// ───── S3: pie de totales = suma de las filas, cada moneda por separado ─────
const tt = await tes();
const sA = tt.filas.reduce((a, f) => a + pesos(f[2]), 0), sU = tt.filas.reduce((a, f) => a + dolares(f[3]), 0), sB = tt.filas.reduce((a, f) => a + pesos(f[4]), 0);
ok('S3: el pie suma las filas (ARS, USD y Banco por separado)', cerca(pesos(tt.foot[1]), sA) && cerca(dolares(tt.foot[2]), sU) && cerca(pesos(tt.foot[3]), sB), JSON.stringify(tt.foot) + ' vs ' + [sA, sU, sB]);
ok('S3: los dólares no se mezclan con los pesos (la Caja USD del activo es sólo lo de USD)', cerca(dolares(f1[3]), 473770) || dolares(f1[3]) !== pesos(f1[2]), f1[3]);

// ───── S4: el pedido de la Tesorería no toca el estado del proyecto activo ─────
const antes = await p.evaluate(() => ({ e: empresaActual.id, pr: proyectoActual.id, snap: JSON.stringify(_colSnap), nIng: ingGeneral.length, nAlq: alquileres.length, nFact: facturas.length, nDocs: documentos.length }));
await tes();
const despues = await p.evaluate(() => ({ e: empresaActual.id, pr: proyectoActual.id, snap: JSON.stringify(_colSnap), nIng: ingGeneral.length, nAlq: alquileres.length, nFact: facturas.length, nDocs: documentos.length }));
ok('S4: no cambió empresa/proyecto activo ni las colecciones en memoria', antes.e === despues.e && antes.pr === despues.pr && antes.nIng === despues.nIng && antes.nAlq === despues.nAlq && antes.nFact === despues.nFact && antes.nDocs === despues.nDocs, JSON.stringify([antes, despues]).slice(0, 300));
ok('S4: no tocó el «estado conocido» del guardado por diferencia (_colSnap): si lo pisara, el próximo guardado borraría datos', antes.snap === despues.snap);

// ───── S5: un contrato en USD cobrado en PESOS es plata en pesos (como en Caja General) ─────
const base5 = await tes(); const b5 = fila(base5, EMP1);
await p.evaluate(([hoy, mes]) => { alquileres.push({ id: 'tes_usd', unidad: 'TES-1', tipo: 'local', inquilino: 'Inquilino Tesorería', direccion: 'Calle 9', moneda: 'USD', canon: 1000, canonActual: 1000,
    inicio: hoy.slice(0, 4) + '-01-01', fin: (Number(hoy.slice(0, 4)) + 1) + '-12-31', indice: 'FIJO', frecuencia: 3, diaPago: 10, deposito: 0, depMoneda: 'USD', depMeses: 1,
    cobrosHistorial: [{ id: 'tes_c1', fecha: hoy, periodo: mes, monto: 1000, concepto: 'alquiler', tipoAB: 'B', monedaCobro: 'ARS', tc: 1200, montoCobrado: 1200000, nroRecibo: 'B-9001' }] });
  persistirAlquileres(); }, [hoy, mes]);
await p.waitForTimeout(400);
const t5 = await tes(); const f5 = fila(t5, EMP1);
ok('S5: la Caja ARS sube 1.200.000 (lo que ENTRÓ, en pesos)', cerca(pesos(f5[2]) - pesos(b5[2]), 1200000), b5[2] + ' → ' + f5[2]);
ok('S5: la Caja USD no se mueve (el contrato es en USD pero la plata entró en pesos)', f5[3] === b5[3], b5[3] + ' → ' + f5[3]);
ok('S5: el Banco no se mueve (el cobro fue en efectivo, tipo B)', f5[4] === b5[4], b5[4] + ' → ' + f5[4]);
const pan5 = await pantallas();
ok('S5: sigue igual a Caja General', f5[2] === pan5.ars && f5[3] === pan5.usd && f5[4] === pan5.banco, JSON.stringify([f5, pan5]));

// ───── S6: una salida del banco (sin la marca esEgreso) resta, en Caja y en Banco ─────
const cta = await p.evaluate(() => (cuentasBancarias.find(c => c.moneda !== 'USD') || cuentasBancarias[0]).id);
await p.evaluate(([hoy, cta]) => { ingGeneral.push({ id: 'tes_bs', tipo: 'mov_banco_salida', esBancario: true, cuentaId: cta, fecha: hoy, origen: 'Pago de prueba Tesorería', moneda: 'ARS', monto: 50000, tipoAB: 'A', medio: 'Transferencia' }); persistirIngGeneral(); }, [hoy, cta]);
await p.waitForTimeout(400);
const t6 = await tes(); const f6 = fila(t6, EMP1);
ok('S6: la salida del banco RESTA 50.000 de la Caja ARS (antes sumaba, porque el signo sólo miraba que el tipo dijera «egreso»)', cerca(pesos(f6[2]) - pesos(f5[2]), -50000), f5[2] + ' → ' + f6[2]);
ok('S6: y también del Banco', cerca(pesos(f6[4]) - pesos(f5[4]), -50000), f5[4] + ' → ' + f6[4]);
const pan6 = await pantallas();
ok('S6: sigue igual a Caja General y Cuentas Bancarias', f6[2] === pan6.ars && f6[3] === pan6.usd && f6[4] === pan6.banco, JSON.stringify([f6, pan6]));

// ───── S7: movimientos confidenciales cuentan en el saldo igual que en Caja General (el detalle sigue oculto) ─────
await p.evaluate(hoy => { ingGeneral.push({ id: 'tes_conf', tipo: 'mov_ingreso_caja', fecha: hoy, origen: 'Detalle reservado', moneda: 'ARS', monto: 777000, tipoAB: 'B', confidencial: true }); persistirIngGeneral(); }, hoy);
await p.waitForTimeout(400);
const t7 = await tes(); const f7 = fila(t7, EMP1);
ok('S7: el confidencial suma 777.000 a la Caja ARS', cerca(pesos(f7[2]) - pesos(f6[2]), 777000), f6[2] + ' → ' + f7[2]);
await p.evaluate(() => { esSuperAdmin = false; });
const t7b = await tes(); const f7b = fila(t7b, EMP1);
const pan7b = await pantallas();
const detalle = await p.evaluate(() => { if (typeof _cgRecolectarMovs !== 'function') return null; const m = _cgRecolectarMovs().find(x => x.monto === 777000); return m ? m.desc : null; });
await p.evaluate(() => { esSuperAdmin = true; });
ok('S7: sin ser superadmin el saldo de la Tesorería sigue siendo el de Caja General', f7b[2] === pan7b.ars && f7b[3] === pan7b.usd, f7b[2] + ' vs ' + pan7b.ars);
ok('S7: y el detalle del movimiento sigue enmascarado (la Tesorería no lo muestra)', detalle === 'Movimiento de caja' && t7b.filas.join(' ').indexOf('reservado') === -1, String(detalle));

// ───── S8: un préstamo entre proyectos mueve la plata de uno al otro y el total no cambia ─────
await irA(p, 'Tesoreria'); await p.waitForTimeout(1500);
const t8a = await tes(); const a8 = fila(t8a, EMP1), pl8 = fila(t8a, EMP2);
const tot8a = pesos(t8a.foot[1]);
await p.evaluate(() => { abrirModalPrestamo(); document.getElementById('prestMonto').value = '1000000'; document.getElementById('prestConcepto').value = 'Préstamo de prueba'; guardarPrestamo(); });
await p.waitForTimeout(1800);
const t8b = await tes(); const a8b = fila(t8b, EMP1), pl8b = fila(t8b, EMP2);
ok('S8: el préstamo resta 1.000.000 de la caja de origen', cerca(pesos(a8b[2]) - pesos(a8[2]), -1000000), a8[2] + ' → ' + a8b[2]);
ok('S8: y lo suma a la del destino (otro proyecto, leído de la nube)', cerca(pesos(pl8b[2]) - pesos(pl8[2]), 1000000), pl8[2] + ' → ' + pl8b[2]);
ok('S8: el total de la Tesorería no cambia (la plata sólo cambió de proyecto)', cerca(pesos(t8b.foot[1]), tot8a), t8a.foot[1] + ' → ' + t8b.foot[1]);
ok('S8: el préstamo no toca el Banco de ninguno', a8b[4] === a8[4] && pl8b[4] === pl8[4]);
await cambiarA('emp_demo_2');
const panP8 = await pantallas();
ok('S8: la Caja General del destino dice lo mismo que la Tesorería', pl8b[2] === panP8.ars, pl8b[2] + ' vs ' + panP8.ars);
await cambiarA('emp_demo_1');

// ───── S9: sólo se listan las empresas que la persona puede ver ─────
await p.evaluate(() => { window.__empAll = empresas; empresas = empresas.filter(e => e.id !== 'emp_demo_2'); });
const t9 = await tes();
await p.evaluate(() => { empresas = window.__empAll; });
ok('S9: una empresa no visible para la persona no aparece en la Tesorería (antes se bajaba todo el árbol y se mostraba igual)', t9.filas.length === 1 && !fila(t9, EMP2), JSON.stringify(t9.filas));

// ───── S10: si no se puede leer un proyecto se avisa, no se muestra en cero ─────
await p.evaluate(() => { window.__refOrig = db.ref; db.ref = function (path) { const r = window.__refOrig.call(db, path); if (typeof path === 'string' && /proy_plata\/ingGeneral/.test(path)) r.once = () => Promise.reject(new Error('permission_denied')); return r; }; });
const t10 = await tes();
await p.evaluate(() => { db.ref = window.__refOrig; });
const fx = fila(t10, EMP2);
ok('S10: el proyecto que falló figura como «No se pudo leer» y no como $0', fx && /No se pudo leer/.test(fx.join(' ')) && fx[2] !== '$0,00', JSON.stringify(fx));
ok('S10: los totales quedan sólo con lo que sí se leyó', cerca(pesos(t10.foot[1]), pesos(fila(t10, EMP1)[2])), JSON.stringify(t10.foot));
ok('S10: la nota nombra el proyecto que no se pudo leer', /No se pudo leer: .*Cartera de alquileres/.test(t10.nota), t10.nota);
const t10b = await tes();
ok('S10: con 🔄 Actualizar vuelve a mostrarse bien', fila(t10b, EMP2) && !/No se pudo leer/.test(fila(t10b, EMP2).join(' ')), JSON.stringify(fila(t10b, EMP2)));

// ───── S11: dos 🔄 seguidos: la lectura vieja (lenta) no pisa a la nueva ─────
const bien = await tes();
await irA(p, 'Tesoreria'); await p.waitForTimeout(300);
await p.evaluate(() => {
  if (typeof window._tesLeerColsProyecto !== 'function') { renderTesoreria(); return; }
  window.__leerOrig = window._tesLeerColsProyecto; let n = 0;
  window._tesLeerColsProyecto = function (e, pr) { n++; const prom = window.__leerOrig(e, pr);
    return n <= 2 ? new Promise(r => setTimeout(() => prom.then(() => r({ ingGeneral: [], ventas: [], alquileres: [], servicios: [], datos: [], facturas: [], documentos: [], cuentasBancarias: [] })), 1000)) : prom; };
  renderTesoreria(); setTimeout(renderTesoreria, 150); });
await p.waitForTimeout(2500);
const t11 = await p.evaluate(() => [...document.querySelectorAll('#tesSaldosBody tr')].map(tr => [...tr.children].map(td => td.innerText.replace(/\s+/g, ' ').trim())));
await p.evaluate(() => { if (window.__leerOrig) window._tesLeerColsProyecto = window.__leerOrig; });
ok('S11: queda el resultado de la última lectura, no el de la lenta (que traía todo en cero)', t11.length === 2 && t11[0][2] === bien.filas[0][2] && t11[1][2] === bien.filas[1][2] && t11[0][2] !== '$0,00', JSON.stringify(t11));

// ───── S12: la pantalla explica de dónde sale cada columna ─────
const t12 = await tes();
ok('S12: la nota dice que Caja = Caja General y Banco = Cuentas Bancarias, y que no se suman', /Caja General/.test(t12.nota) && /Cuentas Bancarias/.test(t12.nota) && /no se suman/.test(t12.nota), t12.nota);
const heads = await p.evaluate(() => [...document.getElementById('tesSaldosBody').closest('table').querySelectorAll('thead th')].map(th => th.getAttribute('title') || ''));
ok('S12: las columnas de saldo tienen una ayuda con su fuente', heads.slice(2).every(h => h.length > 10), JSON.stringify(heads));

// ───── S13: la lógica compartida no cambió Caja General ni Cuentas Bancarias (mismas cifras que con el cálculo de siempre) ─────
const compartido = await p.evaluate(() => { if (typeof _cgRecolectarMovs !== 'function') return { cgA: NaN, cgU: NaN, cbS: NaN }; const t = _cgTotalesMovs(_cgRecolectarMovs()); const bt = _bancoTotales(); return { cgA: t.saldoARS, cgU: t.saldoUSD, cbS: bt.saldo }; });
await irA(p, 'CajaGeneral');
const scr = await p.evaluate(() => window._cgSaldos);
ok('S13: _cgRecolectarMovs()/_cgTotalesMovs() devuelven lo mismo que dejó la pantalla en window._cgSaldos', cerca(compartido.cgA, scr.ars) && cerca(compartido.cgU, scr.usd), JSON.stringify([compartido, scr]));
const pan13 = await pantallas();
ok('S13: _bancoTotales() = «Saldo neto» de la pantalla', pesos(pan13.banco) !== 0 && cerca(Math.round(compartido.cbS * 100) / 100, pesos(pan13.banco)), compartido.cbS + ' vs ' + pan13.banco);

ok('sin errores de JS durante la prueba', errores.length === 0, errores.join(' | ').slice(0, 400));
const bad = res.filter(r => r[0] === 'FALLA');
console.log(res.map(r => r[0] + ' ' + r[1] + (r[2] ? '  → ' + r[2] : '')).join('\n'));
console.log('\n' + (res.length - bad.length) + '/' + res.length + ' OK');
await b.close();
process.exit(bad.length ? 1 : 0);
