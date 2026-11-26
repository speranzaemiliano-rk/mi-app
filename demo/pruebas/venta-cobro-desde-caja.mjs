// El ✏ de un «Cobro Venta UF» en Caja y Bancos abre ESE cobro (monto, fecha, forma de cobro…) y no la ficha de la unidad (v597).
// Antes el botón y el clic en la fila abrían `abrirModalVenta`, donde el importe de un cobro no se puede cambiar: la única salida
// era ir a Ventas → «🖨️ Cobros» → número → «2». Corre contra la demo (base en memoria). Uso: node venta-cobro-desde-caja.mjs
import { abrirDemo, entrarAlSistema, irA } from './demo-lib.mjs';
const { b, p, red, errores } = await abrirDemo();
const res = [];
const ok = (n, c, x) => { res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]); };
// Si algo revienta, se muestra lo que se llegó a verificar antes de salir.
const _volcar = e => { console.log(res.map(r => r.join(' ')).join('\n')); console.log('ABORTÓ:', String((e && e.message) || e).split('\n')[0]); process.exit(1); };
process.on('uncaughtException', _volcar); process.on('unhandledRejection', _volcar);
await entrarAlSistema(p);
await p.evaluate(() => {
  window.__alerts = [];
  window.alert = m => window.__alerts.push(String(m));
  window.confirm = () => true;
  window.open = () => ({ document: { write() {}, close() {} } });
});
const JS = x => JSON.stringify(x);
const alertas = () => p.evaluate(() => window.__alerts);
const modalActivo = id => p.evaluate(i => document.getElementById(i).classList.contains('active'), id);
const cerrarTodo = () => p.evaluate(() => { document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active')); const o = document.getElementById('_mVerEd'); if (o) o.remove(); window.__alerts = []; });
// Un cobro de venta que la Caja General muestra (sin canje): {vIdx, cIdx, uf, monto}
const cobros = () => p.evaluate(() => { const r = []; ventas.forEach((v, vi) => (v.cobrosHistorial || []).forEach((c, ci) => { if (c.formaPago !== 'canje') r.push({ vIdx: vi, cIdx: ci, uf: v.uf, monto: c.monto, fecha: c.fecha, tipoAB: c.tipoAB, usd: _ventaCobroMoneda(v, c) === 'USD' }); })); return r; });

// ── A. Caja General: el ✏ de la fila abre el cobro ──────────────────────────
await irA(p, 'CajaGeneral');
await p.evaluate(() => { document.getElementById('cgFiltroDesde').value = ''; renderCajaGeneral(); });
const todos = await cobros();
ok('A0 la demo trae cobros de ventas', todos.length >= 3, JS(todos.length));
// una fila de «Cobro Venta UF» con su botón ✏
const filaCobro = (vi, ci) => p.evaluate(([v, c]) => {
  const b = [...document.querySelectorAll('#cgBody tr button')].find(x => (x.getAttribute('onclick') || '').includes("_editarOrigenMovimiento('venta'," + v + "," + c + ")"));
  return b ? { onclick: b.getAttribute('onclick'), title: b.title, fila: b.closest('tr').textContent.replace(/\s+/g, ' ').slice(0, 80) } : null;
}, [vi, ci]);
const c1 = todos.find(c => !c.usd) || todos[0];
const f1 = await filaCobro(c1.vIdx, c1.cIdx);
ok('A1 la fila del cobro tiene su ✏ con el número de cobro', !!f1 && /Cobro Venta UF/.test(f1.fila) && /cobro/i.test(f1.title), JS(f1));
await p.evaluate(([vi, ci]) => { [...document.querySelectorAll('#cgBody tr')].forEach(tr => { const b = [...tr.querySelectorAll('button')].find(x => (x.getAttribute('onclick') || '').includes("_editarOrigenMovimiento('venta'," + vi + "," + ci + ")")); if (b) window.__btn = b; }); window.__btn && window.__btn.click(); }, [c1.vIdx, c1.cIdx]);
await p.waitForTimeout(250);
ok('A2 el ✏ abre el editor del COBRO y no la ficha de la unidad', await modalActivo('modalEditarCobroVenta') && !(await modalActivo('modalVenta')));
ok('A3 muestra la unidad y el número de cobro', (await p.innerText('#ecvUF')).includes(String(c1.uf)) && (await p.innerText('#ecvUF')).includes('cobro N°' + (c1.cIdx + 1)), await p.innerText('#ecvUF'));
ok('A4 el importe del cobro está cargado y se puede cambiar', Number(await p.inputValue('#ecvMonto')) === c1.monto, await p.inputValue('#ecvMonto') + ' vs ' + c1.monto);
// editar el importe y guardar: la Caja General lo muestra sin salir ni volver a entrar
const nuevoMonto = c1.monto + 1234.5;
await p.fill('#ecvMonto', String(nuevoMonto));
await p.click('#modalEditarCobroVenta button.btn-gold'); await p.waitForTimeout(500);
const tras = (await cobros()).find(c => c.vIdx === c1.vIdx && c.cIdx === c1.cIdx);
ok('A5 guardar cambia el importe del cobro', tras && Math.abs(tras.monto - nuevoMonto) < 0.005, JS(tras));
ok('A6 se cierra el editor y avisa que se actualizó', !(await modalActivo('modalEditarCobroVenta')) && (await alertas()).some(m => /Cobro actualizado/.test(m)), JS(await alertas()));
const fmt = n => n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
ok('A7 la Caja General ya muestra el importe nuevo (sin salir de la pantalla)', await p.evaluate(t => document.getElementById('cgBody').textContent.includes(t), fmt(nuevoMonto)), fmt(nuevoMonto));
ok('A8 y ya no muestra el viejo', !(await p.evaluate(t => document.getElementById('cgBody').textContent.includes(t), fmt(c1.monto))) || todos.filter(c => c.monto === c1.monto).length > 1);

// ── B. Clic en la fila → diálogo Ver/Editar → «Editar este cobro» ───────────
await cerrarTodo();
// lo que dispara el clic en la fila de la Caja General (la tabla es «densa»: el clic simple sólo selecciona, el doble clic abre)
await p.evaluate(([vi, ci]) => abrirOrigenMovimiento('venta', vi, ci), [c1.vIdx, c1.cIdx]);
await p.waitForTimeout(250);
ok('B1 el clic en la fila ofrece «Editar este cobro»', await p.isVisible('#_veBtnEd') && /Editar este cobro/.test(await p.innerText('#_veBtnEd')), await p.evaluate(() => (document.getElementById('_veBtnEd') || {}).textContent));
await p.click('#_veBtnEd'); await p.waitForTimeout(250);
ok('B2 y abre el editor de ESE cobro', await modalActivo('modalEditarCobroVenta') && !(await modalActivo('modalVenta')) && (await p.innerText('#ecvUF')).includes('cobro N°' + (c1.cIdx + 1)));
await cerrarTodo();

// ── C. Con un canje antes: el número de cobro es el de la lista ORIGINAL ────
const vc = todos.find(c => c.cIdx >= 0).vIdx;
await p.evaluate(vi => { const v = ventas[vi]; v.cobrosHistorial.unshift({ formaPago: 'canje', comp: 'usd', monto: 0, valorCanje: 1000, canjeCantidadM2: 1, fecha: '2026-01-02' }); renderCajaGeneral(); }, vc);
const ordenado = await cobros();
const delMismo = ordenado.filter(c => c.vIdx === vc);
ok('C0 el canje ocupa el lugar 0 y los cobros siguientes van desde el 1', delMismo.length >= 1 && delMismo.every(c => c.cIdx >= 1), JS(delMismo));
const cc = delMismo[0];
await p.evaluate(([vi, ci]) => { const tr = [...document.querySelectorAll('#cgBody tr')].find(t => [...t.querySelectorAll('button')].some(b => (b.getAttribute('onclick') || '').includes("_editarOrigenMovimiento('venta'," + vi + "," + ci + ")"))); tr && [...tr.querySelectorAll('button')].find(b => (b.getAttribute('onclick') || '').includes("_editarOrigenMovimiento('venta'")).click(); }, [cc.vIdx, cc.cIdx]);
await p.waitForTimeout(250);
ok('C1 con un canje delante, el ✏ abre el cobro correcto (no el de al lado)', await modalActivo('modalEditarCobroVenta') && Number(await p.inputValue('#ecvMonto')) === cc.monto && (await p.innerText('#ecvUF')).includes('cobro N°' + (cc.cIdx + 1)), await p.inputValue('#ecvMonto') + ' vs ' + cc.monto);
await cerrarTodo();
await p.evaluate(vi => { ventas[vi].cobrosHistorial.shift(); renderCajaGeneral(); }, vc);

// ── D. Las otras pantallas de Caja y Bancos ─────────────────────────────────
// Efectivo en pesos / en dólares / Banco: el mismo ✏ lleva el número de cobro
const probarPantalla = async (tab, cuerpo, filtroDesde, esUSD, medioA) => {
  await irA(p, tab);
  if (filtroDesde) await p.evaluate(id => { const e = document.getElementById(id); if (e) e.value = ''; }, filtroDesde);
  await p.evaluate(t => { ({ EfectivoPesos: renderEfectivoPesos, EfectivoUSD: renderEfectivoUSD, CuentasBancarias: () => { renderCuentasBancarias(); renderExtractoBancario(); } })[t](); }, tab);
  await p.waitForTimeout(200);
  const lista = (await cobros()).filter(c => (medioA ? c.tipoAB === 'A' : c.tipoAB !== 'A') && (esUSD === null ? true : c.usd === esUSD));
  if (!lista.length) return { sinDatos: true };
  const c = lista[0];
  const hay = await p.evaluate(([cu, vi, ci]) => !![...document.querySelectorAll(cu + ' button')].find(b => (b.getAttribute('onclick') || '').includes("_editarOrigenMovimiento('venta'," + vi + "," + ci + ")")), [cuerpo, c.vIdx, c.cIdx]);
  if (!hay) return { c, hay: false };
  await p.evaluate(([cu, vi, ci]) => [...document.querySelectorAll(cu + ' button')].find(b => (b.getAttribute('onclick') || '').includes("_editarOrigenMovimiento('venta'," + vi + "," + ci + ")")).click(), [cuerpo, c.vIdx, c.cIdx]);
  await p.waitForTimeout(250);
  const abre = await modalActivo('modalEditarCobroVenta') && !(await modalActivo('modalVenta'));
  await cerrarTodo();
  return { c, hay, abre };
};
const dp = await probarPantalla('EfectivoPesos', '#efpBody', 'efpFiltroDesde', false, false);
ok('D1 Efectivo en pesos: el ✏ del cobro abre el cobro', dp.hay && dp.abre, JS(dp));
const du = await probarPantalla('EfectivoUSD', '#efuBody', 'efuFiltroDesde', true, false);
ok('D2 Efectivo en dólares: el ✏ del cobro abre el cobro', du.hay && du.abre, JS(du));
const db_ = await probarPantalla('CuentasBancarias', '#cbBody, #extractoBody, #cbExtracto, table', 'cbDesde', null, true);
ok('D3 Banco (extracto): el ✏ del cobro abre el cobro', db_.hay && db_.abre, JS(db_));

// ── E. Lo demás no cambia ────────────────────────────────────────────────────
await cerrarTodo();
await p.evaluate(() => _editarOrigenMovimiento('venta', 0));
await p.waitForTimeout(200);
ok('E1 sin número de cobro, «venta» sigue abriendo la ficha de la unidad', await modalActivo('modalVenta') && !(await modalActivo('modalEditarCobroVenta')));
await cerrarTodo();
await irA(p, 'CajaGeneral');
await p.evaluate(() => { document.getElementById('cgFiltroDesde').value = ''; renderCajaGeneral(); });
const hayAlq = await p.evaluate(() => [...document.querySelectorAll('#cgBody tr')].some(tr => /Cobro Alquiler/.test(tr.textContent) && [...tr.querySelectorAll('button')].some(b => /_editarOrigenMovimiento\('alquiler',\d+\)/.test(b.getAttribute('onclick') || ''))));
ok('E2 el ✏ de un cobro de alquiler sigue igual (sin número de cobro)', hayAlq);
ok('E3 el ✏ de un pago a proveedor sigue igual', await p.evaluate(() => [...document.querySelectorAll('#cgBody button')].some(b => /_editarOrigenMovimiento\('(factura|documento|presupuesto)'/.test(b.getAttribute('onclick') || ''))));

// ── F. Borrar un cobro desde Ventas también repinta la Caja que está a la vista ─
await cerrarTodo();
const antesN = await p.evaluate(() => document.querySelectorAll('#cgBody tr').length);
const cDel = (await cobros()).find(c => !c.usd) || (await cobros())[0];
await p.evaluate(([vi, ci]) => eliminarCobroVenta(vi, ci), [cDel.vIdx, cDel.cIdx]);
await p.waitForTimeout(300);
const despN = await p.evaluate(() => document.querySelectorAll('#cgBody tr').length);
ok('F1 al borrar un cobro la Caja General (a la vista) se repinta sola', despN === antesN - 1, antesN + ' → ' + despN);

const errs = errores.filter(e => !/net::|Failed to load/.test(e));
ok('G1 sin errores de página', errs.length === 0, JS(errs));
ok('G2 ningún pedido que envíe datos a la red', red.filter(x => !/^GET /.test(x)).length === 0, JS(red.filter(x => !/^GET /.test(x))));
console.log(res.map(r => r.join(' ')).join('\n'));
console.log('errores de página:', errs);
const mal = res.filter(r => r[0] !== 'OK ').length;
console.log(mal ? `\n${mal} FALLAS de ${res.length}` : `\n${res.length}/${res.length} OK`);
await b.close();
if (mal || errs.length) process.exitCode = 1;
