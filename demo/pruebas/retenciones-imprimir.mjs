// Reportes → Retenciones: el botón 🖨️ Imprimir del encabezado imprime lo TILDADO (p. ej. con «1ª quincena (pago a cuenta)»), no todo el período;
// sin nada tildado imprime todo, como siempre. Los textos que nombran el corte de la quincena dicen 1 al 15 (el día 15 va en la 1ª), y la fecha
// «a hoy» del plan de pagos de alquiler sale con el día LOCAL. Corre contra la demo (base en memoria).
// Uso: node retenciones-imprimir.mjs   (ver README: hace falta bajar-cdn.sh antes)
import { abrirDemo, entrarAlSistema } from './demo-lib.mjs';
const { b, p, errores } = await abrirDemo();
const res = [];
const ok = (n, c, x) => res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]);
await entrarAlSistema(p);
await p.evaluate(() => { window.__alerts = []; window.alert = m => window.__alerts.push(String(m)); window.confirm = () => true; window.__prints = []; window.open = () => ({ document: { write: h => window.__prints.push(String(h)), close() {} } }); });

// Retenciones en enero del año en curso: día 3 (Ganancias), 10 (SUSS), 15 (Ganancias), 16 (Ganancias), 28 (SUSS, proveedor con HTML adentro)
await p.evaluate(() => {
  const anio = new Date().getFullYear(), f = d => anio + '-01-' + String(d).padStart(2, '0');
  const pago = (d, cod, monto, id) => ({ id, fecha: f(d), monto: monto * 20, retenciones: [{ codigo: cod, monto, desc: 'Ret. ' + cod }] });
  facturas.push({ id: 'rt_a', proveedor: 'Proveedor Uno SA', numero: '0001-00000001', fecha: f(2), importe: 100000, pagado: 100000, pagosHistorial: [pago(3, '78', 1000, 'p1'), pago(15, '94', 2000, 'p3'), pago(16, '78', 3000, 'p4')] });
  facturas.push({ id: 'rt_b', proveedor: 'Constructora <b>Dos</b> SRL', numero: '0002-00000002', fecha: f(9), importe: 100000, pagado: 100000, pagosHistorial: [pago(10, 'SUSS-Ing', 500, 'p2'), pago(28, 'SUSS-Con', 4000, 'p5')] });
  mostrarTab('Reportes');
  document.getElementById('rptAnio').value = String(anio); document.getElementById('rptMes').value = '0'; document.getElementById('rptQuincena').value = '0';
  rptActualizar();
});
await p.waitForTimeout(200);
const filas = () => p.evaluate(() => _rptRetFilas.map(r => ({ d: parseInt(r.fecha.slice(8, 10)), ret: r.retencion })));
const imprimir = async (fn) => { await p.evaluate(() => { window.__prints.length = 0; }); await p.evaluate(fn); return p.evaluate(() => window.__prints.slice(-1)[0] || ''); };
const total = (html) => { const m = html.match(/TOTAL[^<]*<\/td><td class="r ret">\$?\s?([\d.,]+)/); return m ? m[1] : ''; };
const nFilas = (html) => (html.match(/<tbody>([\s\S]*?)<\/tbody>/) || ['', ''])[1].split('<tr>').length - 1;
const base = await filas();
ok('A0: hay 5 retenciones en el período de prueba (días 3, 10, 15, 16 y 28)', base.length === 5 && base.map(x => x.d).join() === '3,10,15,16,28', JSON.stringify(base));

// ═════════ A: tildar la 1ª quincena e imprimir ═════════
await p.evaluate(() => rptRetSelQuincena(1));
const btn1 = await p.evaluate(() => document.getElementById('btnRptRetImprimir').textContent);
const h1 = await imprimir(() => rptImprimir('retenciones'));
ok('A1: con la 1ª quincena tildada el botón del encabezado dice «Imprimir lo tildado (3)»', /Imprimir lo tildado \(3\)/.test(btn1), btn1);
ok('A2: «Imprimir» saca sólo lo tildado: 3 renglones (días 3, 10 y 15 — el 15 va en la 1ª), total $ 3.500,00, sin el 16 ni el 28', h1.includes('Retenciones seleccionadas') && nFilas(h1) === 3 && total(h1) === '3.500,00' && !h1.includes('16/01/') && !h1.includes('28/01/') && h1.includes('15/01/'), JSON.stringify({ n: nFilas(h1), t: total(h1) }));
ok('A3: el papel dice qué es: «1ª quincena, del 1 al 15 — pago a cuenta (3)»', /1ª quincena, del 1 al 15 — pago a cuenta \(3\)/.test(h1), (h1.match(/<h3>.*?<\/h3>/) || [''])[0]);

await p.evaluate(() => rptRetSelQuincena(2));
const h2 = await imprimir(() => rptImprimir('retenciones'));
ok('A4: con la 2ª quincena tildada saca los días 16 y 28 ($ 7.000,00) y dice «2ª quincena, del 16 a fin de mes — saldo de la DDJJ (2)»', nFilas(h2) === 2 && total(h2) === '7.000,00' && /2ª quincena, del 16 a fin de mes — saldo de la DDJJ \(2\)/.test(h2), JSON.stringify({ n: nFilas(h2), t: total(h2) }));

// ═════════ B: selección a mano, todas, ninguna ═════════
await p.evaluate(() => { rptRetSelTodas(false); const c = document.querySelectorAll('#rptRetencionesBody .rpt-ret-chk'); c[1].checked = true; c[3].checked = true; _rptRetActualizarSel(); });
const h3 = await imprimir(() => rptImprimir('retenciones'));
ok('B1: dos filas tildadas a mano → imprime esas dos y lo dice («selección: 2 de 5 retenciones»)', nFilas(h3) === 2 && /selección: 2 de 5 retenciones/.test(h3) && total(h3) === '3.500,00', JSON.stringify({ n: nFilas(h3), t: total(h3), h3: (h3.match(/<h3>.*?<\/h3>/) || [''])[0] }));
await p.evaluate(() => rptRetSelTodas(false));
const btn0 = await p.evaluate(() => document.getElementById('btnRptRetImprimir').textContent.trim());
const h4 = await imprimir(() => rptImprimir('retenciones'));
ok('B2: sin nada tildado el botón vuelve a «Imprimir» y saca TODO el período (5 renglones, $ 10.500,00), como siempre', btn0 === '🖨️ Imprimir' && h4.includes('Retenciones AFIP/ARCA') && !h4.includes('Retenciones seleccionadas') && nFilas(h4) === 5 && total(h4) === '10.500,00', JSON.stringify({ btn0, n: nFilas(h4), t: total(h4) }));
await p.evaluate(() => rptRetSelTodas(true));
const h5 = await imprimir(() => rptImprimir('retenciones'));
ok('B3: tildando todas imprime las 5 y lo dice («todas las del período (5)»)', nFilas(h5) === 5 && /todas las del período \(5\)/.test(h5), JSON.stringify({ n: nFilas(h5) }));
const h6 = await imprimir(() => rptImprimirRetSeleccion());
ok('B4: el botón «Imprimir lo tildado» de la barra de abajo sigue funcionando igual', nFilas(h6) === 5 && h6.includes('Retenciones seleccionadas'), nFilas(h6));
await p.evaluate(() => rptRetSelTodas(false));

// ═════════ C: el filtro por tipo y el selector de arriba ═════════
await p.evaluate(() => { document.getElementById('rptTipoRet').value = 'suss'; rptActualizar(); rptRetSelTodas(true); });
const h7 = await imprimir(() => rptImprimir('retenciones'));
ok('C1: con «Solo SUSS» y todo tildado imprime sólo las 2 de SUSS ($ 4.500,00) y el título lo dice', nFilas(h7) === 2 && total(h7) === '4.500,00' && /Solo SUSS/.test(h7), JSON.stringify({ n: nFilas(h7), t: total(h7) }));
await p.evaluate(() => { document.getElementById('rptTipoRet').value = ''; document.getElementById('rptQuincena').value = '1'; rptActualizar(); });
const h8 = await imprimir(() => rptImprimir('retenciones'));
ok('C2: el selector de arriba «1ª quincena (1–15)» sin nada tildado imprime sólo esa quincena (3 renglones, $ 3.500,00)', nFilas(h8) === 3 && total(h8) === '3.500,00' && /1ª Quincena/.test(h8), JSON.stringify({ n: nFilas(h8), t: total(h8) }));
await p.evaluate(() => { document.getElementById('rptQuincena').value = '0'; rptActualizar(); });

// ═════════ D: el texto escapado y los rótulos del corte ═════════
await p.evaluate(() => rptRetSelTodas(true));
const h9 = await imprimir(() => rptImprimir('retenciones'));
ok('D1: el proveedor con HTML («Constructora <b>Dos</b> SRL») sale escapado en el papel (no se interpreta)', h9.includes('Constructora &lt;b&gt;Dos&lt;/b&gt; SRL') && !h9.includes('Constructora <b>Dos</b>'), (h9.match(/Constructora[^<]{0,40}/) || [''])[0]);
const tx = await p.evaluate(() => ({ q1: document.getElementById('rptRetBtnQ1').title, q2: document.getElementById('rptRetBtnQ2').title, nota: document.getElementById('rptRetNota').innerText }));
ok('D2: los rótulos dicen 1 al 15 / 16 en adelante (antes «1 al 14» y «el día 15 entra en la 2ª quincena»)', /del 1 al 15/.test(tx.q1) && /del 16 en adelante/.test(tx.q2) && /1 al 15/.test(tx.nota) && !/entra en la 2ª/.test(tx.nota) && !/1 al 14/.test(tx.q1), JSON.stringify(tx));
const corte = await p.evaluate(() => { const antes = RPT_CORTE_RET; RPT_CORTE_RET = 14; rptActualizar(); const t = document.getElementById('rptRetBtnQ1').title; RPT_CORTE_RET = antes; rptActualizar(); return t; });
ok('D3: los rótulos salen de la constante RPT_CORTE_RET (con 14 dirían «1 al 14»)', /del 1 al 14/.test(corte), corte);

// ═════════ E: la fecha «a hoy» del panel de lo adeudado es la LOCAL (no la UTC) ═════════
const fecha = await p.evaluate(async () => {
  alquileres.push({ id: 'rt_alq', unidad: 'RT', inquilino: 'X', moneda: 'ARS', canon: 1000, canonActual: 1000, inicio: '2020-01-01', fin: '2099-12-31', diaPago: 5, cobrosHistorial: [], tipo: 'local', direccion: 'y' });
  abrirPlanAlquiler(alquileres.findIndex(a => a.id === 'rt_alq'));
  const real = Date.prototype.toISOString; Date.prototype.toISOString = function() { return '2099-01-01T00:00:00.000Z'; };   // si el panel usara el día UTC saldría 2099
  _renderPlanAlquiler();
  Date.prototype.toISOString = real;
  return { txt: document.querySelector('.plan-alq-deuda-tit span').innerText, esperada: formatearFecha(_hoyLocalISO()) };
});
ok('E1: «a hoy, dd/mm/aaaa» usa el día local aunque toISOString dé otra fecha (entre las 21 y las 24 hs en Argentina mostraba la de mañana)', fecha.txt.includes(fecha.esperada) && !/2099/.test(fecha.txt), JSON.stringify(fecha));
// día de pago: «vence hoy» no es «vencida»
const vence = await p.evaluate(() => {
  const hoy = new Date(), pe = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0'), dia = hoy.getDate();
  const mk = dp => { const a = { diaPago: dp, inicio: '2020-01-01' }; const v = _alqVencePeriodo(a, pe); v.setHours(0, 0, 0, 0); const h = new Date(); h.setHours(0, 0, 0, 0); return { vence: v.getTime() === h.getTime(), pasado: v < h }; };
  return { hoyEsDiaDePago: mk(dia), ayer: dia > 1 ? mk(dia - 1) : null };
});
ok('E2: el helper de vencimiento: el día de pago coincide con hoy (el panel no lo cuenta todavía) y el día anterior ya pasó', vence.hoyEsDiaDePago.vence && (vence.ayer === null || vence.ayer.pasado), JSON.stringify(vence));


// ═════════ F: retoques de la v588 (revisión independiente de la v587) ═════════
// F1: al volver a Reportes se repinta (antes quedaba la foto de la primera visita y «Imprimir lo tildado» la sacaba)
await p.evaluate(() => { document.getElementById('rptQuincena').value = '0'; rptActualizar(); rptRetSelQuincena(1); });
const antes = await p.evaluate(() => ({ filas: _rptRetFilas.length, btn: document.getElementById('btnRptRetImprimir').textContent }));
await p.evaluate(() => {
  const anio = new Date().getFullYear();
  facturas.push({ id: 'rt_c', proveedor: 'Proveedor Nuevo', numero: '0003-3', fecha: anio + '-01-11', importe: 1000, pagado: 1000, pagosHistorial: [{ id: 'p9', fecha: anio + '-01-12', monto: 7000, retenciones: [{ codigo: '78', monto: 700, desc: 'Ret. 78' }] }] });
  mostrarTab('Inicio'); mostrarTab('Reportes');
});
await p.waitForTimeout(200);
const desp = await p.evaluate(() => ({ filas: _rptRetFilas.length, tildadas: _rptRetSeleccionadas().length, btn: document.getElementById('btnRptRetImprimir').textContent.trim(), hayNuevo: document.getElementById('rptRetencionesBody').innerText.includes('Proveedor Nuevo') }));
ok('F1: al volver a Reportes la tabla se repinta con los datos nuevos (6 filas, con el pago cargado mientras tanto), las tildes se limpian y el botón vuelve a «Imprimir» (antes: foto vieja con la tilde puesta)', antes.filas === 5 && desp.filas === 6 && desp.hayNuevo && desp.tildadas === 0 && desp.btn === '🖨️ Imprimir', JSON.stringify({ antes, desp }));
// F2: con las ventanas emergentes bloqueadas se imprime igual (por un iframe), sin TypeError
await p.evaluate(() => { window.__iframe = []; window.__abierto = window.open; window.open = () => null; window.__origImp = window._imprimirDocHTML; window._imprimirDocHTML = h => window.__iframe.push(String(h)); rptRetSelTodas(true); });
const errs0 = errores.length;
await p.evaluate(() => rptImprimir('retenciones'));
await p.evaluate(() => { rptRetSelTodas(false); rptImprimir('retenciones'); });
const ifr = await p.evaluate(() => window.__iframe.slice());
ok('F2: con window.open bloqueado (null) «Imprimir» imprime por un iframe (lo tildado y también todo el período) y no revienta', ifr.length === 2 && /Retenciones seleccionadas/.test(ifr[0]) && /Retenciones AFIP\/ARCA/.test(ifr[1]) && errores.length === errs0, JSON.stringify({ n: ifr.length, errs: errores.slice(errs0) }));
await p.evaluate(() => { window.open = window.__abierto; window._imprimirDocHTML = window.__origImp; });
// F3: el botón de una quincena sin filas avisa en vez de no hacer nada
await p.evaluate(() => { document.getElementById('rptQuincena').value = '2'; rptActualizar(); rptRetSelQuincena(1); });
const av = await p.evaluate(() => ({ tild: _rptRetSeleccionadas().length, txt: document.getElementById('rptRetSelResumen').textContent }));
ok('F3: con el selector de arriba en «2ª quincena», «1ª quincena (pago a cuenta)» no tilda nada y lo dice («No hay retenciones de la 1ª quincena en este período…»)', av.tild === 0 && /No hay retenciones de la 1ª quincena/.test(av.txt), JSON.stringify(av));
await p.evaluate(() => { document.getElementById('rptQuincena').value = '0'; rptActualizar(); });

console.log(res.map(x => x.join(' · ')).join('\n'));
const mal = res.filter(x => x[0] === 'FALLA').length;
console.log(`\n${res.length - mal}/${res.length} OK`);
if (errores.length) console.log('errores de JS:', errores.slice(0, 5));
await b.close();
process.exit(mal || errores.length ? 1 : 0);
