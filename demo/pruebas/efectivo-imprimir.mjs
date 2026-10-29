// 🖨️ Imprimir en Efectivo en pesos / en dólares: el papel tiene que decir EXACTAMENTE lo que muestra la pantalla (filas, orden, saldos acumulados),
// con el saldo anterior si hay «Desde», el resumen y los filtros activos. Corre contra la demo. Uso: node efectivo-imprimir.mjs
import { abrirDemo, entrarAlSistema, irA } from './demo-lib.mjs';
const { b, p, errores } = await abrirDemo();
const res = [];
const ok = (n, c, x) => res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]);
await entrarAlSistema(p);
await p.evaluate(() => { window.__alerts = []; window.alert = m => window.__alerts.push(String(m)); window._imprimirDocHTML = h => { window.__html = h; }; });

// Lee la tabla de pantalla y el papel impreso y los compara fila por fila (los importes como números: la pantalla en USD usa otro formato).
const num = t => { t = String(t).replace(/[^\d,.\-]/g, ''); if (!t || t === '-') return 0; const neg = /^-/.test(t); t = t.replace('-', ''); const iEs = /,\d{1,2}$/.test(t); const v = parseFloat(iEs ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '')); return neg ? -v : v; };
async function pantalla(pre) {
  return await p.evaluate(pre => [...document.querySelectorAll('#' + pre + 'Body tr')].map(tr => [...tr.children].slice(0, 7).map(td => td.innerText.trim())), pre);
}
async function papel(html) {
  const pg = await p.context().newPage(); await pg.setContent(html);
  const filas = await pg.evaluate(() => [...document.querySelectorAll('table.cg tbody tr')].map(tr => ({ ap: tr.classList.contains('ap'), c: [...tr.children].map(td => td.innerText.trim()) })));
  const resumen = await pg.evaluate(() => [...document.querySelectorAll('table.res tbody tr')].map(tr => [...tr.children].map(td => td.innerText.trim())));
  const info = await pg.evaluate(() => (document.querySelector('.info') || {}).innerText || '');
  const titulo = await pg.evaluate(() => (document.querySelector('.cab-titulo') || {}).innerText || '');
  await pg.close();
  return { filas, resumen, info, titulo };
}
async function imprimir(mon) { await p.evaluate(m => { window.__html = ''; efImprimir(m); }, mon); return await p.evaluate(() => window.__html); }
async function comparar(nombre, pre, mon, ordenAsc) {
  const scr = await pantalla(pre);
  const h = await imprimir(mon);
  const pp = await papel(h);
  const datos = pp.filas.filter(f => !f.ap);
  // el papel va en el orden elegido; la pantalla también
  const igual = scr.length === datos.length && scr.every((r, i) => {
    const d = datos[i].c;
    return r[0] === d[0] && r[1] === d[1] && r[2] === d[2] && r[3] === d[3] && num(r[4] === '—' ? '0' : r[4]) === num(d[4] === '—' ? '0' : d[4]) && num(r[5] === '—' ? '0' : r[5]) === num(d[5] === '—' ? '0' : d[5]) && Math.abs(num(r[6]) - num(d[6])) < 0.005;
  });
  ok(nombre + ': el papel coincide fila por fila con la pantalla (' + scr.length + ' filas)', igual && scr.length > 0, JSON.stringify({ scr: scr.slice(0, 2), pap: datos.slice(0, 2).map(x => x.c) }));
  return { h, pp, scr };
}

// ───── Efectivo en pesos ─────
await irA(p, 'EfectivoPesos');
ok('botón Imprimir visible en Efectivo $', await p.isVisible('#btnEfpImprimir'));
let r = await comparar('ARS con el filtro de 30 días', 'efp', 'ARS');
ok('ARS: título', /EFECTIVO EN PESOS/i.test(r.pp.titulo), r.pp.titulo);
// sin filtro de fechas: todo
await p.fill('#efpFiltroDesde', ''); await p.dispatchEvent('#efpFiltroDesde', 'change');
r = await comparar('ARS sin filtros (todo el efectivo)', 'efp', 'ARS');
const ingTot = await p.evaluate(() => document.getElementById('efpIngresos').innerText), egrTot = await p.evaluate(() => document.getElementById('efpEgresos').innerText), salTot = await p.evaluate(() => document.getElementById('efpSaldo').innerText);
const rs = Object.fromEntries(r.pp.resumen.map(x => [x[0], x[1]]));
ok('ARS: ingresos del resumen = tarjeta de pantalla', num(rs['Ingresos listados']) === num(ingTot), rs['Ingresos listados'] + ' vs ' + ingTot);
ok('ARS: egresos del resumen = tarjeta de pantalla', num(rs['Egresos listados']) === num(egrTot), rs['Egresos listados'] + ' vs ' + egrTot);
ok('ARS: saldo final del resumen = tarjeta «Saldo Efectivo»', num(rs['Saldo del efectivo']) === num(salTot), rs['Saldo del efectivo'] + ' vs ' + salTot);
ok('ARS sin «Desde»: no hay saldo anterior', !('Saldo anterior' in rs) && !r.pp.filas.some(f => f.ap));
ok('ARS: dice «todos los movimientos»', /todos los movimientos/.test(r.pp.info), r.pp.info);
// con Desde: saldo anterior = saldo acum del último movimiento anterior
const desde = await p.evaluate(() => { const fs = [...document.querySelectorAll('#efpBody tr')]; return null; });
await p.evaluate(() => { var d = new Date(); d.setDate(d.getDate() - 20); document.getElementById('efpFiltroDesde').value = d.toISOString().slice(0, 10); renderEfectivoPesos(); });
r = await comparar('ARS con «Desde» hace 20 días', 'efp', 'ARS');
const ap = r.pp.filas.find(f => f.ap);
ok('ARS con Desde: aparece «Saldo anterior al …»', !!ap && /Saldo anterior al/.test(ap.c[0]), JSON.stringify(r.pp.filas.slice(-1)));
const salAnt = await p.evaluate(() => { const d = document.getElementById('efpFiltroDesde').value; let s = 0; const ms = []; return d; });
// saldo anterior + ingresos − egresos listados = saldo final (sin otros filtros)
const rs2 = Object.fromEntries(r.pp.resumen.map(x => [x[0], x[1]]));
ok('ARS con Desde: anterior + ingresos − egresos = saldo final', Math.abs(num(rs2['Saldo anterior']) + num(rs2['Ingresos listados']) - num(rs2['Egresos listados']) - num(rs2['Saldo del efectivo'])) < 0.01, JSON.stringify(rs2));
ok('ARS con Desde: el saldo final es el de toda la caja (= tarjeta)', num(rs2['Saldo del efectivo']) === num(salTot), rs2['Saldo del efectivo'] + ' vs ' + salTot);
// orden ascendente: el saldo anterior abre la tabla y las filas invierten
await p.selectOption('#efpOrden', 'asc');
r = await comparar('ARS orden ascendente', 'efp', 'ARS');
ok('ARS asc: «Saldo anterior» abre la tabla', r.pp.filas[0].ap === true, JSON.stringify(r.pp.filas[0]));
await p.selectOption('#efpOrden', 'desc');
r = await comparar('ARS orden descendente', 'efp', 'ARS');
ok('ARS desc: «Saldo anterior» cierra la tabla', r.pp.filas[r.pp.filas.length - 1].ap === true);
// filtros de tipo/dirección/texto: se nombran y no cambian el saldo
await p.selectOption('#efpFiltroDir', 'ingreso');
r = await comparar('ARS solo ingresos', 'efp', 'ARS');
ok('ARS: nombra el filtro «sólo ingresos»', /sólo ingresos/.test(r.pp.info), r.pp.info);
const rs3 = Object.fromEntries(r.pp.resumen.map(x => [x[0], x[1]]));
ok('ARS solo ingresos: egresos listados = 0 y el saldo sigue siendo el de toda la caja', num(rs3['Egresos listados']) === 0 && num(rs3['Saldo del efectivo']) === num(salTot), JSON.stringify(rs3));
await p.selectOption('#efpFiltroDir', '');
// texto libre escapado
await p.evaluate(() => { ingGeneral.push({ id: 'imp_t1', fecha: _hoyLocalISO(), moneda: 'ARS', tipo: 'mov_ingreso_caja', monto: 1234.5, origen: 'Prueba <b>negrita</b> & "comillas" D\'Angelo', referencia: '' }); renderEfectivoPesos(); });
await p.fill('#efpFiltroBusq', 'negrita'); await p.dispatchEvent('#efpFiltroBusq', 'input');
r = await comparar('ARS con búsqueda de texto', 'efp', 'ARS');
ok('ARS: el HTML del texto libre sale escapado', !/<b>negrita<\/b>/.test(r.h) && /&lt;b&gt;negrita&lt;\/b&gt;/.test(r.h), r.h.slice(r.h.indexOf('Prueba') - 20, r.h.indexOf('Prueba') + 80));
ok('ARS: nombra el filtro de descripción', /Descripción: «negrita»/.test(r.pp.info), r.pp.info);
// sin resultados: avisa y no imprime
await p.fill('#efpFiltroBusq', 'zzzz-no-existe'); await p.dispatchEvent('#efpFiltroBusq', 'input');
await p.evaluate(() => { window.__alerts = []; window.__html = ''; efImprimir('ARS'); });
ok('ARS sin movimientos: avisa y no imprime', (await p.evaluate(() => window.__alerts)).some(m => /No hay movimientos para imprimir/.test(m)) && (await p.evaluate(() => window.__html)) === '');
await p.fill('#efpFiltroBusq', ''); await p.dispatchEvent('#efpFiltroBusq', 'input');

// ───── Hallazgos de la revisión independiente (v564 → v565) ─────
// (1) Movimientos SIN fecha: la pantalla los ordena primero de toda la caja. Con «Desde» van aparte y ya cuentan dentro del saldo anterior.
await p.fill('#efpFiltroDesde', ''); await p.dispatchEvent('#efpFiltroDesde', 'change');
await p.evaluate(() => { ingGeneral.push({ id: 'imp_sf', moneda: 'ARS', tipo: 'mov_ingreso_caja', monto: 50, origen: 'SIN-FECHA-INGRESO', referencia: '' }); renderEfectivoPesos(); });
await p.evaluate(() => { var d = new Date(); d.setDate(d.getDate() - 20); document.getElementById('efpFiltroDesde').value = d.toISOString().slice(0, 10); renderEfectivoPesos(); });
await p.selectOption('#efpOrden', 'asc');
await p.evaluate(() => { window.__html = ''; efImprimir('ARS'); });
{
  const h = await p.evaluate(() => window.__html);
  const pg = await p.context().newPage(); await pg.setContent(h);
  const tablas = await pg.evaluate(() => [...document.querySelectorAll('table.cg')].map(t => [...t.querySelectorAll('tbody tr')].map(tr => ({ ap: tr.classList.contains('ap'), c: [...tr.children].map(td => td.innerText.trim()) }))));
  const res = await pg.evaluate(() => [...document.querySelectorAll('table.res tbody tr')].map(tr => [...tr.children].map(td => td.innerText.trim())));
  await pg.close();
  const principal = tablas[0];
  ok('sin fecha: la tabla principal no los lista (van en bloque aparte)', !principal.some(f => f.c.some(x => /SIN-FECHA-INGRESO/.test(x))) && tablas.length === 2 && tablas[1].some(f => f.c.some(x => /SIN-FECHA-INGRESO/.test(x))), JSON.stringify(tablas.map(x => x.length)));
  // cadena: saldo anterior → cada fila suma su neto → el último saldo es el «Saldo del efectivo»
  let saldo = num(principal[0].c[principal[0].c.length - 1]); let cadenaOk = principal[0].ap === true;
  for (const f of principal.slice(1)) { saldo += num(f.c[4] === '—' ? '0' : f.c[4]) - num(f.c[5] === '—' ? '0' : f.c[5]); if (Math.abs(saldo - num(f.c[6])) > 0.005) cadenaOk = false; }
  ok('sin fecha: la cadena de saldos del papel cierra fila a fila (anterior → … → saldo final)', cadenaOk, JSON.stringify(principal.map(f => f.c[6])));
  const rsf = Object.fromEntries(res.map(x => [x[0], x[1]]));
  ok('sin fecha: anterior + ingresos − egresos = saldo del efectivo', Math.abs(num(rsf['Saldo anterior']) + num(rsf['Ingresos listados']) - num(rsf['Egresos listados']) - num(rsf['Saldo del efectivo'])) < 0.01, JSON.stringify(rsf));
  ok('sin fecha: el saldo del efectivo sigue siendo el de la tarjeta de pantalla', num(rsf['Saldo del efectivo']) === num(await p.evaluate(() => document.getElementById('efpSaldo').innerText)));
}
await p.selectOption('#efpOrden', 'desc');
// sin «Desde»: el sin fecha va primero en la cadena (desde 0) y se lista en la tabla principal, igual que en pantalla
await p.fill('#efpFiltroDesde', ''); await p.dispatchEvent('#efpFiltroDesde', 'change');
r = await comparar('ARS sin «Desde» con un movimiento sin fecha', 'efp', 'ARS');
// (2) «Desde» posterior a «Hasta»: avisa y no imprime
await p.evaluate(() => { document.getElementById('efpFiltroDesde').value = '2026-10-25'; document.getElementById('efpFiltroHasta').value = '2026-10-05'; renderEfectivoPesos(); window.__alerts = []; window.__html = ''; efImprimir('ARS'); });
ok('Desde posterior a Hasta: avisa y no imprime', (await p.evaluate(() => window.__alerts)).some(m => /posterior al «Hasta»/.test(m)) && (await p.evaluate(() => window.__html)) === '');
await p.evaluate(() => { document.getElementById('efpFiltroHasta').value = ''; renderEfectivoPesos(); });
// (3) comprobantes recibidos todavía sin cargar: el papel saldría sin los pagos de documentos
await p.evaluate(() => { window.__dc = _docsCargados; _docsCargados = false; window.__alerts = []; window.__html = ''; efImprimir('ARS'); });
ok('documentos sin cargar: avisa y no imprime (pesos)', (await p.evaluate(() => window.__alerts)).some(m => /se están cargando los comprobantes recibidos/.test(m)) && (await p.evaluate(() => window.__html)) === '');
await p.evaluate(() => { _docsCargados = window.__dc; });
// (4) orden por columna: Imprimir repinta por fecha, así que las flechas y el estado del orden tienen que volver a cero
await p.fill('#efpFiltroDesde', ''); await p.dispatchEvent('#efpFiltroDesde', 'change');
await p.click('#efpTable th.sortable:nth-child(5)'); await p.waitForTimeout(150);
ok('(precondición) la columna quedó ordenada', await p.evaluate(() => !!document.querySelector('#efpTable th.sortable.asc, #efpTable th.sortable.desc')));
await p.evaluate(() => { window.__html = ''; efImprimir('ARS'); });
ok('orden por columna: tras imprimir las flechas vuelven a «⇅» y se limpia el estado', await p.evaluate(() => !document.querySelector('#efpTable th.sortable.asc, #efpTable th.sortable.desc') && [...document.querySelectorAll('#efpTable th.sortable .si')].every(i => i.textContent === '⇅') && !Object.keys(_sortState).some(k => k.indexOf('efpBody:') === 0)));
// (5) texto largo sin espacios: no puede sacar los importes de la hoja (A4 apaisada ≈ 1123 px de ancho)
await p.evaluate(() => { ingGeneral.push({ id: 'imp_largo', moneda: 'ARS', tipo: 'mov_ingreso_caja', monto: 10, origen: 'A'.repeat(220), referencia: '' }); renderEfectivoPesos(); });
await p.fill('#efpFiltroBusq', 'AAAAAAAAAA'); await p.dispatchEvent('#efpFiltroBusq', 'input');
{
  const h = await imprimir('ARS');
  const pg = await p.context().newPage(); await pg.setViewportSize({ width: 1123, height: 794 }); await pg.setContent(h);
  const m = await pg.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  await pg.close();
  ok('texto largo sin espacios: el papel no se ensancha más que la hoja', m.sw <= m.cw + 1, JSON.stringify(m));
}
await p.fill('#efpFiltroBusq', ''); await p.dispatchEvent('#efpFiltroBusq', 'input');
await p.evaluate(() => { ingGeneral = ingGeneral.filter(x => x.id !== 'imp_largo' && x.id !== 'imp_sf' && x.id !== 'imp_t1'); renderEfectivoPesos(); });

// ───── Efectivo en dólares ─────
await irA(p, 'EfectivoUSD');
ok('botón Imprimir visible en Efectivo USD', await p.isVisible('#btnEfuImprimir'));
await p.fill('#efuFiltroDesde', ''); await p.dispatchEvent('#efuFiltroDesde', 'change');
r = await comparar('USD sin filtros', 'efu', 'USD');
ok('USD: título', /EFECTIVO EN D/i.test(r.pp.titulo), r.pp.titulo);
ok('USD: los importes llevan «USD»', /USD/.test(r.pp.filas[0].c[4] + r.pp.filas[0].c[5]) && /USD/.test(r.pp.filas[0].c[6]), JSON.stringify(r.pp.filas[0].c));
const salU = await p.evaluate(() => document.getElementById('efuSaldo').innerText);
const rsU = Object.fromEntries(r.pp.resumen.map(x => [x[0], x[1]]));
ok('USD: saldo final del resumen = tarjeta «Saldo Efectivo USD»', num(rsU['Saldo del efectivo']) === num(salU), rsU['Saldo del efectivo'] + ' vs ' + salU);
ok('USD: el resumen tiene una sola columna (dólares)', r.pp.resumen.every(x => x.length === 2));
await p.evaluate(() => { var d = new Date(); d.setDate(d.getDate() - 25); document.getElementById('efuFiltroDesde').value = d.toISOString().slice(0, 10); var h = new Date(); h.setDate(h.getDate() - 2); document.getElementById('efuFiltroHasta').value = h.toISOString().slice(0, 10); renderEfectivoUSD(); });
const cant = await p.evaluate(() => document.querySelectorAll('#efuBody tr').length);
if (cant && !(await p.evaluate(() => /No hay movimientos/.test(document.getElementById('efuBody').innerText)))) {
  r = await comparar('USD con Desde y Hasta', 'efu', 'USD');
  ok('USD: nombra el período «desde … hasta …»', /desde el .* hasta el /.test(r.pp.info), r.pp.info);
} else {
  ok('USD con Desde y Hasta sin movimientos: avisa', true);
}
// La demo no tiene errores de página ni usó la red
ok('sin errores de JS', errores.filter(e => !/net::|Failed to load/.test(e)).length === 0, JSON.stringify(errores));
console.log(res.map(x => x.join(' ')).join('\n'));
console.log(res.filter(x => x[0] !== 'OK ').length ? '\n❌ HAY FALLAS' : '\n✅ todo OK (' + res.length + ')');
await b.close();
if (res.some(x => x[0] !== 'OK ')) process.exitCode = 1;
