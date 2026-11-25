// Recibos de retenciones, fondos y recuperos de una unidad (v594): tilde «aplica» por edificio y por unidad,
// importes en la ficha, emisión «un recibo por concepto» / «todo junto», Caja y Banco, «ya emitido», edición y permisos.
// Corre contra la demo (base en memoria). Uso: node unidad-conceptos-recibos.mjs   (ver README: hace falta bajar-cdn.sh antes)
import { abrirDemo, entrarAlSistema, irA } from './demo-lib.mjs';
const { b, p, red, errores } = await abrirDemo();
const res = [];
const ok = (n, c, x) => { res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]); };
// Si algo revienta (un clic que ya no encuentra el botón, por ejemplo), se muestra lo que se llegó a verificar antes de salir.
const _volcar = e => { console.log(res.map(r => r.join(' ')).join('\n')); console.log('ABORTÓ:', String((e && e.message) || e).split('\n')[0]); process.exit(1); };
process.on('uncaughtException', _volcar); process.on('unhandledRejection', _volcar);
await entrarAlSistema(p);
await p.evaluate(() => {
  window.__alerts = []; window.__confirms = []; window.__html = []; window.__open = [];
  window.alert = m => window.__alerts.push(String(m));
  window.__confirmRet = true;
  window.confirm = m => { window.__confirms.push(String(m)); return window.__confirmRet !== false; };
  window._imprimirDocHTML = h => window.__html.push(h);
  window.open = () => ({ document: { write: h => window.__open.push(h), close() {} } });
});
await irA(p, 'Ventas');
const JS = x => JSON.stringify(x);
const alertas = () => p.evaluate(() => window.__alerts);
const limpiar = () => p.evaluate(() => { window.__alerts = []; window.__confirms = []; window.__html = []; window.__open = []; });
const venta = uf => p.evaluate(u => { const v = ventas.find(x => x.uf === u); return v ? JSON.parse(JSON.stringify(v)) : null; }, uf);
const idxDe = uf => p.evaluate(u => ventas.findIndex(x => x.uf === u), uf);
const emit = () => p.evaluate(() => JSON.parse(JSON.stringify(comprobantesEmitidos)));
const nroNum = n => parseInt(String(n).split('-').pop(), 10);

// ── A. Valores del edificio ──────────────────────────────────────────────────
ok('A1 botón «Conceptos del edificio» visible', await p.isVisible('#btnCufEdificio'));
ok('A2 sin configurar, todo aplica', await p.evaluate(() => CUF_CONCEPTOS.length === 7 && CUF_CONCEPTOS.every(c => _cufEdAplica(c.k))));
ok('A3 los 7 conceptos pedidos', await p.evaluate(() => CUF_CONCEPTOS.map(c => c.k).join()) === 'gan,iibb,adm,res,alh,rec,cdi');
await p.click('#btnCufEdificio'); await p.waitForTimeout(300);
ok('A4 modal del edificio con 7 tildes, todos marcados', await p.isVisible('#modalCufEdificio') && await p.evaluate(() => document.querySelectorAll('#cufEdFilas input:checked').length) === 7);
ok('A5 el título nombra el edificio', /Los Álamos/.test(await p.innerText('#cufEdNombre')));
for (const k of ['gan', 'iibb', 'rec', 'cdi']) await p.uncheck('#cufEdChk_' + k);
await p.click('#cufEdGuardar'); await p.waitForTimeout(500);
ok('A6 guardar cierra el modal', !(await p.isVisible('#modalCufEdificio')));
const ed7 = await p.evaluate(() => new Promise(r => db.ref('empresas/emp_demo_1/proyectos/proy_alamos/conceptosUF').once('value', s => r(s.val()))));
ok('A7 queda en la base POR PROYECTO, sólo con lo que se cambió (las 4 casillas destildadas)', JS(Object.keys(ed7 || {}).sort()) === JS(['cdi', 'gan', 'iibb', 'rec']) && ['cdi', 'gan', 'iibb', 'rec'].every(k => ed7[k] === false), JS(ed7));
ok('A7b no se escribe en ninguna otra parte', await p.evaluate(() => new Promise(r => db.ref('global/conceptosUF').once('value', s => r(s.val() === null)))) && await p.evaluate(() => new Promise(r => db.ref('empresas/emp_demo_2/proyectos/proy_plata/conceptosUF').once('value', s => r(s.val() === null)))));
ok('A8 «consorcio»: sólo aplican los fondos', await p.evaluate(() => CUF_CONCEPTOS.filter(c => _cufEdAplica(c.k)).map(c => c.k).join()) === 'adm,res,alh');

// ── B. Ficha de la unidad ────────────────────────────────────────────────────
let i3a = await idxDe('3A');
await p.evaluate(i => abrirModalVenta(i), i3a); await p.waitForTimeout(400);
ok('B0 sin datos propios la sección arranca plegada, con el título visible', await p.isVisible('#ventaConcDet > summary') && !(await p.evaluate(() => document.getElementById('ventaConcDet').open)) && !(await p.isVisible('#cufAp_gan')));
await p.click('#ventaConcDet > summary'); await p.waitForTimeout(150);
ok('B1 la sección existe en la ficha', await p.isVisible('#ventaConcBox') && await p.evaluate(() => document.querySelectorAll('#ventaConcFilas input[type=checkbox]').length) === 7 && await p.isVisible('#cufAp_gan'));
ok('B2 hereda del edificio (fondos sí, retenciones no)', await p.evaluate(() => CUF_CONCEPTOS.map(c => document.getElementById('cufAp_' + c.k).checked ? c.k : '').filter(Boolean).join()) === 'adm,res,alh');
ok('B3 resumen «aplican 3 de 7»', /aplican 3 de 7/.test(await p.innerText('#ventaConcResumen')), await p.innerText('#ventaConcResumen'));
ok('B4 lo que no aplica tiene el importe bloqueado', await p.evaluate(() => document.getElementById('cufMonto_gan').disabled && !document.getElementById('cufMonto_adm').disabled));
ok('B5 moneda por defecto = pesos (UF 3A sólo tiene precio en pesos)', await p.inputValue('#ventaConcMoneda') === 'ARS');
await p.check('#cufAp_gan');
ok('B6 tildar algo distinto del edificio avisa «sólo esta unidad»', /sólo esta unidad/.test(await p.innerText('#cufTag_gan')), await p.innerText('#cufTag_gan'));
await p.click('#cufGanBtn');
ok('B7 el botón 3 % propone el 3 % del precio', Number(await p.inputValue('#cufMonto_gan')) === 3564000, await p.inputValue('#cufMonto_gan'));
await p.fill('#cufMonto_adm', '150000');
const cobros3a = (await venta('3A')).cobrosHistorial.length;
await p.evaluate(() => guardarVenta()); await p.waitForTimeout(600);
let v3a = await venta('3A');
ok('B8 guarda sólo lo que se aparta del edificio + los importes', JS(v3a.conceptosUF) === JS({ aplica: { gan: true }, montos: { gan: 3564000, adm: 150000 }, moneda: 'ARS' }), JS(v3a.conceptosUF));
ok('B9 no pierde los cobros ni el resto de la unidad', v3a.cobrosHistorial.length === cobros3a && v3a.comprador === 'Nicolás Echeverría' && v3a.modalidad === 'total_ars');
ok('B10 otra unidad sigue heredando (sin clave)', (await venta('1B')).conceptosUF === undefined);
// reabrir y guardar sin tocar: no cambia nada
await p.evaluate(i => abrirModalVenta(i), await idxDe('3A')); await p.waitForTimeout(300);
ok('B11 al reabrir se ve el override y los importes', await p.isChecked('#cufAp_gan') && await p.inputValue('#cufMonto_adm') === '150000' && await p.evaluate(() => document.getElementById('ventaConcDet').open));
await p.evaluate(() => guardarVenta()); await p.waitForTimeout(500);
ok('B12 guardar sin tocar deja lo mismo', JS((await venta('3A')).conceptosUF) === JS(v3a.conceptosUF));
// volver a lo del edificio borra el override
await p.evaluate(i => abrirModalVenta(i), await idxDe('3A')); await p.waitForTimeout(300);
await p.uncheck('#cufAp_gan');
await p.evaluate(() => guardarVenta()); await p.waitForTimeout(500);
v3a = await venta('3A');
ok('B13 destildar lo que coincide con el edificio saca el override; los importes se conservan (el input sólo queda deshabilitado)', JS(v3a.conceptosUF) === JS({ montos: { gan: 3564000, adm: 150000 }, moneda: 'ARS' }), JS(v3a.conceptosUF));
// dejar la UF como la usan los pasos siguientes (gan aplica, con importe)
await p.evaluate(i => abrirModalVenta(i), await idxDe('3A')); await p.waitForTimeout(300);
await p.check('#cufAp_gan'); await p.click('#cufGanBtn');
await p.evaluate(() => guardarVenta()); await p.waitForTimeout(500);
// UF nueva: no se puede emitir antes de guardar
await p.evaluate(() => abrirModalVenta()); await p.waitForTimeout(300);
ok('B14 en una UF nueva el botón de emitir está deshabilitado y avisa', await p.evaluate(() => document.getElementById('ventaConcEmitirBtn').disabled) && /Guardá la unidad/.test(await p.evaluate(() => document.getElementById('ventaConcEmitirHint').textContent)));
ok('B15 una UF nueva arranca con lo del edificio', await p.evaluate(() => CUF_CONCEPTOS.map(c => document.getElementById('cufAp_' + c.k).checked ? c.k : '').filter(Boolean).join()) === 'adm,res,alh');
await p.evaluate(() => cerrarModalVenta());

// ── C. Un recibo por concepto ────────────────────────────────────────────────
ok('C0 la lista de Ventas tiene el botón «Conceptos» por fila', (await p.innerHTML('#ventasBody')).split('🧾 Conceptos').length - 1 >= 5);
// click REAL en el botón de cada fila (primera, del medio, última): cada uno abre SU unidad
const clickFila = uf => p.evaluate(u => { const tr = [...document.querySelectorAll('#ventasBody tr')].find(t => ((t.querySelector('td strong') || {}).textContent || '').trim() === u); const b = tr && tr.querySelector('button[onclick^="cufAbrirEmitir"]'); if (!b) return false; b.click(); return true; }, uf);
const ufsLista = await p.evaluate(() => [...document.querySelectorAll('#ventasBody tr')].map(t => ((t.querySelector('td strong') || {}).textContent || '').trim()).filter(Boolean));
let filasOk = true;
for (const u of [ufsLista[0], ufsLista[Math.floor(ufsLista.length / 2)], ufsLista[ufsLista.length - 1]]) { await clickFila(u); await p.waitForTimeout(150); if (!(await p.isVisible('#modalCufEmitir')) || (await p.innerText('#cufEUF')).trim() !== 'UF ' + u) filasOk = false; await p.evaluate(() => cufCerrarEmitir()); }
ok('C0b el botón «🧾 Conceptos» de cada fila abre la emisión de ESA unidad', filasOk && ufsLista.length >= 5, JS(ufsLista));
await limpiar();
const e0 = (await emit()).length;
const mov0 = await p.evaluate(() => ingGeneral.length);
i3a = await idxDe('3A');
await p.evaluate(i => cufAbrirEmitir(i), i3a); await p.waitForTimeout(400);
ok('C1 abre el modal de emisión', await p.isVisible('#modalCufEmitir') && /3A/.test(await p.innerText('#cufEUF')));
ok('C2 sólo se ofrecen los conceptos que aplican (gan, adm, res, alh)', await p.evaluate(() => [...document.querySelectorAll('#cufEFilas input[type=checkbox]')].map(x => x.id.replace('cufEChk_', '')).join()) === 'gan,adm,res,alh');
ok('C3 dice cuáles no aplican', /No aplican a esta unidad: Retención de Ingresos Brutos, Recupero Bs\. Personales, Recupero CDI Edenor/.test(await p.innerText('#cufENoAplican')), await p.innerText('#cufENoAplican'));
ok('C4 con importe y sin emitir arrancan tildados; sin importe, no', await p.evaluate(() => ['gan', 'adm', 'res', 'alh'].map(k => document.getElementById('cufEChk_' + k).checked ? 1 : 0).join('')) === '1100');
ok('C5 Ganancias propone el importe de la ficha (3 % del precio)', await p.inputValue('#cufEMonto_gan') === '3564000');
ok('C6 moneda y fecha por defecto', await p.inputValue('#cufEMoneda') === 'ARS' && await p.inputValue('#cufEFecha') === await p.evaluate(() => _hoyLocalISO()));
ok('C7 por defecto, un recibo por concepto', await p.isChecked('#cufEModoCada'));
await p.fill('#cufEMonto_res', '50000');
ok('C8 tipear el importe tilda el concepto', await p.isChecked('#cufEChk_res'));
ok('C9 el resumen cuenta 3 recibos y el total', /3 recibos/.test(await p.innerText('#cufEResumen')) && /3\.764\.000/.test(await p.innerText('#cufEResumen')), await p.innerText('#cufEResumen'));
await p.click('#cufEBtn'); await p.waitForTimeout(900);
let em = await emit();
let nuevos = em.slice(e0);
ok('C10 emitió 3 recibos', nuevos.length === 3, JS(nuevos.map(x => x.concepto)));
ok('C10b la primera emisión no pregunta nada', (await p.evaluate(() => window.__confirms)).length === 0, JS(await p.evaluate(() => window.__confirms)));
ok('C11 cada uno con un solo concepto y su importe', nuevos.every(r => r.conceptosUF.length === 1 && r.total === r.conceptosUF[0].monto && r.tipoDoc === 'recibo') && nuevos.map(r => r.conceptosUF[0].k).join() === 'gan,adm,res');
ok('C12 números correlativos y distintos', new Set(nuevos.map(r => r.nro)).size === 3 && nroNum(nuevos[1].nro) === nroNum(nuevos[0].nro) + 1 && nroNum(nuevos[2].nro) === nroNum(nuevos[1].nro) + 1, JS(nuevos.map(r => r.nro)));
ok('C13 a nombre del comprador, con la UF y el edificio', nuevos.every(r => r.cliente === 'Nicolás Echeverría' && /UF 3A — Edificio Los Álamos/.test(r.clienteDetalle) && r.ventaId === 'vta_3a' && r.ventaUF === '3A'));
ok('C14 efectivo: serie B, afecta caja, ingreso, pesos', nuevos.every(r => r.tipoAB === 'B' && r.afectaCaja === true && r.movTipo === 'ingreso' && r.moneda === 'ARS' && r.estadoPago === 'pagado' && r.pagado === r.total));
const movs = await p.evaluate(() => ingGeneral.filter(m => m.origenEmitidoId).map(m => ({ id: m.origenEmitidoId, tipo: m.tipo, monto: m.monto, mon: m.moneda, origen: m.origen })));
const movsNuevos = movs.filter(m => nuevos.some(r => r.id === m.id));
ok('C15 3 movimientos de caja, uno por recibo, con el importe', movsNuevos.length === 3 && movsNuevos.every(m => m.tipo === 'mov_ingreso_caja' && m.mon === 'ARS' && m.monto === nuevos.find(r => r.id === m.id).total), JS(movsNuevos));
ok('C16 el movimiento dice qué concepto es', movsNuevos.every(m => /UF 3A/.test(m.origen)) && movsNuevos.some(m => /Retención de Ganancias/.test(m.origen)), JS(movsNuevos.map(m => m.origen)));
ok('C17 no quedó ninguna alerta', (await alertas()).length === 0, JS(await alertas()));
ok('C18 se guardó en la base', await p.evaluate(n => new Promise(r => REF_EMITIDOS.once('value', s => r(Object.values(s.val() || {}).filter(x => x.ventaId === 'vta_3a').length === n))), 3));
ok('C19 aparece el resultado con los números y los botones', /Se emitieron 3 recibos/.test(await p.innerText('#cufEResultado')) && (await p.innerText('#cufEResultado')).includes(nuevos[0].nro) && /Imprimir los 3/.test(await p.innerText('#cufEResultado')));
ok('C20 los emitidos figuran «ya emitido» y destildados', await p.evaluate(() => ['gan', 'adm', 'res'].every(k => !document.getElementById('cufEChk_' + k).checked)) && (await p.innerText('#cufEFilas')).split('ya emitido').length - 1 === 3);
// imprimir los tres juntos
await limpiar();
await p.click('#cufEResultado button.btn-gold'); await p.waitForTimeout(300);
const lote = await p.evaluate(() => window.__html);
ok('C21 imprime los 3 en un solo trabajo, una hoja cada uno', lote.length === 1 && (lote[0].match(/class="pg"/g) || []).length === 3 && (lote[0].match(/page-break-before:always/g) || []).length === 2);
ok('C22 cada hoja con su concepto, su número y su importe', ['Retención de Ganancias', 'Fondo de administración', 'Fondo de reserva'].every(t => lote[0].includes(t)) && nuevos.every(r => lote[0].includes(r.nro)) && /3\.564\.000/.test(lote[0]) && /Recibo de Cobro/.test(lote[0]));
await p.click('#cufEResultado button.btn-outline'); await p.waitForTimeout(200);
const uno = await p.evaluate(() => window.__open);
ok('C23 el 🖨️ de uno imprime ese recibo', uno.length === 1 && uno[0].includes(nuevos[0].nro) && uno[0].includes('Retención de Ganancias') && !uno[0].includes('Fondo de reserva'));

// ── D. Todo junto, sin mover caja ────────────────────────────────────────────
await limpiar();
await p.fill('#cufEMonto_alh', '20000');
await p.check('#cufEChk_adm');
await p.check('#cufEModoJunto');
await p.selectOption('#cufEDestino', 'no');
await p.fill('#cufEObs', 'Pago <b>en término</b>');
ok('D1 el resumen cuenta 1 recibo', /1 recibo/.test(await p.innerText('#cufEResumen')) && /170\.000/.test(await p.innerText('#cufEResumen')), await p.innerText('#cufEResumen'));
await p.click('#cufEBtn'); await p.waitForTimeout(800);
ok('D2 avisó que Fondo de administración ya tenía recibo y pidió confirmar', (await p.evaluate(() => window.__confirms)).some(m => /Ya hay recibo emitido de: Fondo de administración/.test(m)), JS(await p.evaluate(() => window.__confirms)));
em = await emit();
const junto = em.slice(e0 + 3);
ok('D3 emitió UN solo recibo', junto.length === 1, JS(junto.map(x => x.concepto)));
const rj = junto[0] || {};
ok('D4 con las dos líneas y el total', (rj.conceptosUF || []).map(c => c.k + ':' + c.monto).join() === 'adm:150000,alh:20000' && rj.total === 170000 && rj.monto === 170000 && rj.importe === 170000);
ok('D5 concepto armado con los nombres y la UF', rj.concepto === 'Fondo de administración, Fondo de alhajamiento — UF 3A', rj.concepto);
ok('D6 «no mueve caja»: documento, sin movimiento', rj.afectaCaja === false && rj.estadoPago === 'documento' && rj.pagado === 0 && rj.movTipo === '' && (await p.evaluate(id => ingGeneral.filter(m => m.origenEmitidoId === id).length, rj.id)) === 0);
ok('D7 numeración sigue de corrido', nroNum(rj.nro) === nroNum(nuevos[2].nro) + 1, rj.nro + ' vs ' + nuevos[2].nro);
await limpiar();
await p.evaluate(id => imprimirComprobanteEmitido(id), rj.id);
const hj = (await p.evaluate(() => window.__open))[0] || '';
ok('D8 el papel lista las dos líneas y el total', /Fondo de administración<\/td><td class="tr">\$ 150\.000/.test(hj) && /Fondo de alhajamiento<\/td><td class="tr">\$ 20\.000/.test(hj) && /<td>Total<\/td><td class="tr">\$ 170\.000/.test(hj), hj.slice(hj.indexOf('<table'), hj.indexOf('<table') + 400));
ok('D9 las observaciones del recibo no inyectan HTML', /Pago &lt;b&gt;en término&lt;\/b&gt;/.test(hj) && !/<b>en término/.test(hj));
ok('D9b el recibo individual abre el diálogo de impresión', /window\.print\(\)/.test(hj));
ok('D10 el cliente y la UF van en el encabezado', /Nicolás Echeverría/.test(hj) && /UF 3A/.test(hj));
// el texto de una línea se escapa
await p.evaluate(id => { const e = comprobantesEmitidos.find(x => x.id === id); e.conceptosUF[0].desc = 'Fondo <i>x</i> & "y"'; }, rj.id);
await limpiar();
await p.evaluate(id => imprimirComprobanteEmitido(id), rj.id);
const hx = (await p.evaluate(() => window.__open))[0] || '';
ok('D11 la descripción de una línea se escapa', /Fondo &lt;i&gt;x&lt;\/i&gt; &amp; &quot;y&quot;|Fondo &lt;i&gt;x&lt;\/i&gt; &amp; &#34;y&#34;/.test(hx) && !/<i>x<\/i>/.test(hx), hx.slice(hx.indexOf('<tbody>'), hx.indexOf('<tbody>') + 200));
await p.evaluate(id => { const e = comprobantesEmitidos.find(x => x.id === id); e.conceptosUF[0].desc = 'Fondo de administración'; }, rj.id);

// ── E. Banco y moneda ────────────────────────────────────────────────────────
await p.evaluate(() => cufCerrarEmitir());
await limpiar();
const i1b = await idxDe('1B');
await p.evaluate(i => cufAbrirEmitir(i), i1b); await p.waitForTimeout(400);
ok('E1 UF 1B en dólares: moneda USD y sólo los fondos', await p.inputValue('#cufEMoneda') === 'USD' && await p.evaluate(() => [...document.querySelectorAll('#cufEFilas input[type=checkbox]')].map(x => x.id.replace('cufEChk_', '')).join()) === 'adm,res,alh');
ok('E2 no se mezcla lo de otra unidad: ninguno figura «ya emitido»', !/ya emitido/.test(await p.innerText('#cufEFilas')));
await p.fill('#cufEMonto_adm', '1200'); await p.fill('#cufEMonto_res', '800');
await p.selectOption('#cufEDestino', 'banco');
ok('E3 al elegir banco aparece la cuenta', await p.isVisible('#cufECuenta'));
await p.click('#cufEBtn'); await p.waitForTimeout(300);
ok('E4 sin cuenta no emite', (await alertas()).some(m => /cuenta bancaria/.test(m)) && (await emit()).length === e0 + 4);
await limpiar();
await p.selectOption('#cufECuenta', 'cta_galicia_ars');
await p.click('#cufEBtn'); await p.waitForTimeout(300);
ok('E5 cuenta en otra moneda: frena', (await alertas()).some(m => /es en ARS y el recibo en USD/.test(m)) && (await emit()).length === e0 + 4, JS(await alertas()));
await limpiar();
await p.selectOption('#cufECuenta', 'cta_galicia_usd');
await p.check('#cufEModoJunto');
await p.click('#cufEBtn'); await p.waitForTimeout(900);
em = await emit();
const rb = em[em.length - 1];
ok('E6 un recibo por banco, serie A, en dólares', em.length === e0 + 5 && rb.tipoAB === 'A' && rb.cuentaId === 'cta_galicia_usd' && rb.moneda === 'USD' && rb.total === 2000 && /-A-/.test(rb.nro), JS(rb));
const mb = await p.evaluate(id => ingGeneral.filter(m => m.origenEmitidoId === id).map(m => ({ tipo: m.tipo, cuentaId: m.cuentaId, mon: m.moneda, monto: m.monto, banc: m.esBancario })), rb.id);
ok('E7 el movimiento entra al banco, a esa cuenta y en dólares', mb.length === 1 && mb[0].tipo === 'mov_banco_entrada' && mb[0].cuentaId === 'cta_galicia_usd' && mb[0].mon === 'USD' && mb[0].monto === 2000 && mb[0].banc === true, JS(mb));
ok('E8 la hoja imprime en dólares', await p.evaluate(id => { window.__open = []; imprimirComprobanteEmitido(id); return /USD 2\.000/.test(window.__open[0] || ''); }, rb.id));
// cambiar de moneda vuelve a proponer lo que no se tipeó
await p.evaluate(() => cufCerrarEmitir());
await p.evaluate(i => cufAbrirEmitir(i), await idxDe('3A')); await p.waitForTimeout(300);
await p.selectOption('#cufEMoneda', 'USD');
ok('E9 en otra moneda, lo cargado en pesos no se arrastra', await p.inputValue('#cufEMonto_gan') === '' && !(await p.isChecked('#cufEChk_gan')), await p.inputValue('#cufEMonto_gan'));
await p.selectOption('#cufEMoneda', 'ARS');
ok('E10 al volver a pesos se vuelve a proponer', await p.inputValue('#cufEMonto_gan') === '3564000');
await p.fill('#cufEMonto_gan', '3000000');
await p.selectOption('#cufEMoneda', 'USD'); await p.selectOption('#cufEMoneda', 'ARS');
ok('E11 lo tipeado a mano no se pisa al cambiar de moneda', await p.inputValue('#cufEMonto_gan') === '3000000');
await p.evaluate(() => cufCerrarEmitir());

// ── F. Editar un recibo de conceptos ─────────────────────────────────────────
await limpiar();
await p.evaluate(id => abrirModalEmitir(id), rj.id); await p.waitForTimeout(400);
await p.click('#modalEmitir .btn-gold'); await p.waitForTimeout(700);
let rj2 = (await emit()).find(x => x.id === rj.id);
ok('F1 editar sin tocar el importe conserva unidad y líneas', rj2.ventaId === 'vta_3a' && rj2.ventaUF === '3A' && (rj2.conceptosUF || []).length === 2 && rj2.nro === rj.nro, JS(rj2));
await p.evaluate(id => abrirModalEmitir(id), rj.id); await p.waitForTimeout(400);
await p.fill('#emitMonto', '180000');
await p.click('#modalEmitir .btn-gold'); await p.waitForTimeout(700);
rj2 = (await emit()).find(x => x.id === rj.id);
const lin2 = rj2.conceptosUF || [];
ok('F2 si cambia el total, las líneas se CONSERVAN repartidas en proporción y suman el total (queda el vínculo con la UF)', rj2.total === 180000 && lin2.length === 2 && lin2.map(c => c.k).join() === 'adm,alh' && Math.abs(lin2.reduce((a, c) => a + c.monto, 0) - 180000) < 0.005 && lin2[0].monto === 158823.53 && rj2.ventaId === 'vta_3a' && rj2.ventaUF === '3A', JS(rj2));
await limpiar();
await p.evaluate(id => imprimirComprobanteEmitido(id), rj.id);
const hF3 = (await p.evaluate(() => window.__open))[0] || '';
ok('F3 el papel sigue listando cada concepto y el total nuevo', /<td>Total<\/td><td class="tr">\$ 180\.000/.test(hF3) && /Fondo de administración<\/td><td class="tr">\$ 158\.823,53/.test(hF3) && /Fondo de alhajamiento<\/td><td class="tr">\$ 21\.176,47/.test(hF3), hF3.slice(hF3.indexOf('<tbody>'), hF3.indexOf('<tbody>') + 300));
await p.evaluate(i => cufAbrirEmitir(i), await idxDe('3A')); await p.waitForTimeout(300);
ok('F4 tras editar el importe los conceptos SIGUEN figurando «ya emitido» (no se puede repetir sin aviso)', (await p.innerText('#cufEFilas')).split('ya emitido').length - 1 >= 3 && /Fondo de alhajamiento[\s\S]*ya emitido/.test(await p.innerText('#cufEFilas')));
await p.evaluate(() => cufCerrarEmitir());
await limpiar();
await p.evaluate(id => abrirModalEmitir(id), rj.id); await p.waitForTimeout(300);
ok('F5 el concepto de un recibo con líneas no se edita (el papel sale de las líneas) y avisa por qué', await p.evaluate(() => document.getElementById('emitConcepto').readOnly) && await p.isVisible('#emitConceptoHint'));
await p.evaluate(() => { document.getElementById('emitConcepto').readOnly = false; document.getElementById('emitConcepto').value = 'Otro texto'; });
await p.click('#modalEmitir .btn-gold'); await p.waitForTimeout(600);
rj2 = (await emit()).find(x => x.id === rj.id);
ok('F6 aunque se fuerce el campo, el concepto guardado sigue siendo el de las líneas (papel y caja no se separan)', rj2.concepto === 'Fondo de administración, Fondo de alhajamiento — UF 3A', rj2.concepto);
await limpiar();

// ── G. Un recibo común no cambia ─────────────────────────────────────────────
await limpiar();
const comun = await p.evaluate(() => { const e = comprobantesEmitidos.find(x => x.tipoDoc === 'recibo' && !x.ventaId); return e ? { id: e.id, concepto: e.concepto, total: e.total } : null; });
ok('G0 la demo trae recibos comunes', !!comun);
await p.evaluate(id => imprimirComprobanteEmitido(id), comun.id);
const hc = (await p.evaluate(() => window.__open))[0] || '';
ok('G1 el recibo común sigue con su fila de concepto y su total', /<th>Concepto<\/th><th class="tr">Monto<\/th>/.test(hc) && hc.includes(String(comun.concepto || '—')) && (hc.match(/<tbody><tr>/g) || []).length === 1, hc.slice(hc.indexOf('<tbody>'), hc.indexOf('<tbody>') + 200));

// ── H. Borrar un recibo libera el concepto ───────────────────────────────────
await limpiar();
const rg = nuevos[0];
await p.evaluate(id => eliminarEmitido(id), rg.id); await p.waitForTimeout(500);
ok('H1 borrar el recibo borra también su movimiento de caja', (await p.evaluate(id => ingGeneral.filter(m => m.origenEmitidoId === id).length, rg.id)) === 0);
await p.evaluate(i => cufAbrirEmitir(i), await idxDe('3A')); await p.waitForTimeout(300);
ok('H2 y el concepto ya no figura como emitido', !/Retención de Ganancias.*ya emitido/s.test((await p.innerText('#cufEFilas')).split('Fondo de administración')[0]) && await p.isChecked('#cufEChk_gan'));
await p.evaluate(() => cufCerrarEmitir());

// ── I. Desde la ficha se emite lo que se ve (aunque no esté guardado) ───────
await limpiar();
await p.evaluate(i => abrirModalVenta(i), await idxDe('1B')); await p.waitForTimeout(300);
await p.click('#ventaConcDet > summary'); await p.waitForTimeout(150);
await p.check('#cufAp_iibb'); await p.fill('#cufMonto_iibb', '777');
await p.click('#ventaConcEmitirBtn'); await p.waitForTimeout(400);
ok('I1 el botón de la ficha abre la emisión de ESA unidad', await p.isVisible('#modalCufEmitir') && /1B/.test(await p.innerText('#cufEUF')));
ok('I2 con el tilde y el importe todavía sin guardar', await p.evaluate(() => [...document.querySelectorAll('#cufEFilas input[type=checkbox]')].map(x => x.id.replace('cufEChk_', '')).join()) === 'iibb,adm,res,alh' && await p.inputValue('#cufEMonto_iibb') === '777');
ok('I3 queda por encima de la ficha', await p.evaluate(() => +getComputedStyle(document.getElementById('modalCufEmitir')).zIndex > +getComputedStyle(document.getElementById('modalVenta')).zIndex));
ok('I4 sin guardar, la unidad no cambió', (await venta('1B')).conceptosUF === undefined);
await p.evaluate(() => { cufCerrarEmitir(); cerrarModalVenta(); });

// ── L. Quién firma «Recibí conforme»: el que RECIBE la plata ─────────────────
await limpiar();
const emp = await p.evaluate(() => getEmpresaParaRecibo().nombre);
const firmas = h => { const m = h.match(/<div class="firmas">(.*?)<\/div><\/div>/s); return m ? m[1].replace(/<[^>]+>/g, '|').replace(/\|+/g, '|') : ''; };
const imprimirCon = async (id, cambios) => { await limpiar(); await p.evaluate(([i, c]) => { const e = comprobantesEmitidos.find(x => x.id === i); window.__bak = JSON.parse(JSON.stringify(e)); Object.assign(e, c); imprimirComprobanteEmitido(i); Object.keys(c).forEach(k => { if (window.__bak[k] === undefined) delete e[k]; else e[k] = window.__bak[k]; }); }, [id, cambios]); return (await p.evaluate(() => window.__open))[0] || ''; };
const rIng = nuevos[1];   // recibo de la UF 3A que entró a caja (ingreso)
const fIng = firmas(await imprimirCon(rIng.id, {}));
ok('L1 ingreso: «Recibí conforme» lo firma la empresa y el comprador «Entregó»', fIng.includes('Recibí conforme — ' + emp) && fIng.includes('Entregó — Nicolás Echeverría') && !fIng.includes('Recibí conforme — Nicolás'), fIng);
const fSin = firmas(await imprimirCon(rj.id, {}));   // «no mueve caja»: movTipo vacío, sigue siendo un recibo de cobro
ok('L2 recibo que no mueve caja: también lo recibe la empresa', fSin.includes('Recibí conforme — ' + emp) && fSin.includes('Entregó — Nicolás Echeverría'), fSin);
const fEgr = firmas(await imprimirCon(rIng.id, { movTipo: 'egreso' }));
ok('L3 egreso: recibe la otra parte y la empresa figura como quien emitió', fEgr.includes('Recibí conforme — Nicolás Echeverría') && fEgr.includes('Emitió — ' + emp) && !fEgr.includes('Recibí conforme — ' + emp), fEgr);
const fFac = firmas(await imprimirCon(rIng.id, { tipoDoc: 'factura', items: [{ desc: 'Algo', cant: 1, precio: 10 }] }));
ok('L4 un comprobante tipo factura conserva su redacción de siempre', fFac.includes('Recibí conforme — Nicolás Echeverría') && fFac.includes('Emitió — ' + emp), fFac);
const comunId = comun.id;
const fCom = firmas(await imprimirCon(comunId, {}));
ok('L5 un recibo común de cobro también lo firma la empresa al recibir', fCom.includes('Recibí conforme — ' + emp), fCom);
await p.evaluate(() => { const e = comprobantesEmitidos.find(x => x.ventaId === 'vta_3a'); e.cliente = 'Pérez <b>&</b> Hijos'; });
const fEsc = await imprimirCon(rIng.id, {});
ok('L6 el nombre de la otra parte sale escapado en la firma', /Entregó — Pérez &lt;b&gt;&amp;&lt;\/b&gt; Hijos/.test(fEsc) && !/Entregó — Pérez <b>/.test(fEsc));
const lote2 = await p.evaluate(ids => { window.__html = []; cufImprimirLote(ids); return window.__html[0] || ''; }, [rIng.id]);
ok('L7 la impresión en lote usa las mismas firmas', lote2.includes('Recibí conforme — ' + emp));

// ── M. Retoques de la v596 (revisión independiente de la v594) ──────────────────
// M1. La ficha opera sobre SU unidad aunque otra persona borre una anterior (el índice se corre)
await limpiar();
const v1a = await venta('1A');
await p.evaluate(i => abrirModalVenta(i), await idxDe('3A')); await p.waitForTimeout(300);
await p.evaluate(() => { document.getElementById('ventaConcDet').open = true; });
await p.evaluate(async id => { await REF_VENTAS.child(id).remove(); }, v1a.id); await p.waitForTimeout(400);
await p.evaluate(() => { document.getElementById('cufMonto_gan').value = ''; });
await p.click('#cufGanBtn'); await p.waitForTimeout(150);
ok('M1 con una unidad anterior borrada, el «3 %» sigue siendo el de la UF de la ficha', Number(await p.inputValue('#cufMonto_gan')) === 3564000, await p.inputValue('#cufMonto_gan') + ' ' + JS(await alertas()));
await p.click('#ventaConcEmitirBtn'); await p.waitForTimeout(300);
ok('M1b «Emitir recibos…» abre la UF de la ficha y no la de al lado', await p.isVisible('#modalCufEmitir') && (await p.innerText('#cufEUF')).trim() === 'UF 3A' && /Nicolás Echeverría/.test(await p.innerText('#cufEInfo')), await p.innerText('#cufEUF'));
await p.evaluate(() => { cufCerrarEmitir(); cerrarModalVenta(); });
await p.evaluate(async v => { await REF_VENTAS.child(v.id).set(v); }, v1a); await p.waitForTimeout(400);
// si la que se borra es la propia UF de la ficha, avisa y no emite
await limpiar();
await p.evaluate(i => abrirModalVenta(i), await idxDe('1B')); await p.waitForTimeout(300);
const v1b = await venta('1B');
await p.evaluate(async id => { await REF_VENTAS.child(id).remove(); }, v1b.id); await p.waitForTimeout(400);
await p.evaluate(() => cufAbrirEmitir());
ok('M1c si borraron la propia unidad avisa que ya no existe y no abre la emisión', (await alertas()).some(m => /ya no existe/.test(m)) && !(await p.isVisible('#modalCufEmitir')), JS(await alertas()));
await p.evaluate(() => { cufCerrarEmitir(); cerrarModalVenta(); });
await p.evaluate(async v => { await REF_VENTAS.child(v.id).set(v); }, v1b); await p.waitForTimeout(400);

// M2. Lo heredado SIGUE al edificio aunque cambie con la ficha abierta; lo tocado a mano no
await limpiar();
await p.evaluate(i => abrirModalVenta(i), await idxDe('1B')); await p.waitForTimeout(300);
await p.evaluate(() => { document.getElementById('ventaConcDet').open = true; });
await p.uncheck('#cufAp_res');   // excepción propia de la unidad (el edificio dice que aplica)
await p.click('#ventaConcBox button[onclick*="cufAbrirEdificio"]'); await p.waitForTimeout(250);
await p.uncheck('#cufEdChk_adm'); await p.click('#cufEdGuardar'); await p.waitForTimeout(500);
ok('M2 al cambiar el edificio desde la ficha, la casilla heredada lo sigue y el resumen se actualiza', !(await p.isChecked('#cufAp_adm')) && /aplican 1 de 7/.test(await p.innerText('#ventaConcResumen')) && !/sólo esta unidad/.test(await p.innerText('#cufTag_adm')), await p.innerText('#ventaConcResumen') + ' / ' + await p.innerText('#cufTag_adm'));
ok('M2b la que se destildó a mano no se mueve', !(await p.isChecked('#cufAp_res')) && /sólo esta unidad/.test(await p.innerText('#cufTag_res')));
await p.evaluate(() => guardarVenta()); await p.waitForTimeout(500);
ok('M2c al guardar sólo queda la excepción propia (res:false), no lo heredado', JS((await venta('1B')).conceptosUF) === JS({ aplica: { res: false } }), JS((await venta('1B')).conceptosUF));
ok('M2d el edificio sólo cambió la casilla tocada', JS(await p.evaluate(() => Object.assign({}, _cufEdificio))) === JS({ gan: false, iibb: false, rec: false, cdi: false, adm: false }) || (await p.evaluate(() => _cufEdificio.adm)) === false);
// otra persona cambia el edificio con la ficha abierta
await p.evaluate(i => abrirModalVenta(i), await idxDe('1B')); await p.waitForTimeout(300);
await p.evaluate(async () => { await REF_CONC_UF.update({ adm: true }); }); await p.waitForTimeout(400);
ok('M2e si el cambio lo hace otra persona, la ficha abierta también lo sigue', await p.isChecked('#cufAp_adm'), '');
await p.check('#cufAp_res');   // volver a lo del edificio: no deja excepción
await p.evaluate(() => guardarVenta()); await p.waitForTimeout(500);
ok('M2f volver a lo del edificio deja la unidad sin datos propios', (await venta('1B')).conceptosUF === undefined, JS((await venta('1B')).conceptosUF));

// M3. Cerrar / reabrir mientras se numera no deja emitir dos veces ni cambia de unidad el resultado
await limpiar();
const eM = (await emit()).length;
await p.evaluate(() => { window.__opc = obtenerProximoComprobante; window.obtenerProximoComprobante = async (...a) => { await new Promise(r => setTimeout(r, 700)); return window.__opc(...a); }; });
await p.evaluate(i => cufAbrirEmitir(i), await idxDe('1B')); await p.waitForTimeout(300);
await p.fill('#cufEMonto_adm', '100'); await p.selectOption('#cufEDestino', 'no');
await p.click('#cufEBtn'); await p.waitForTimeout(150);
await p.evaluate(() => { cufCerrarEmitir(); cufAbrirEmitir(0); cufEmitir(); });
ok('M3 con una emisión en curso no deja cerrar, cambiar de unidad ni emitir de nuevo', (await alertas()).filter(m => /emisión en curso/.test(m)).length === 2 && await p.isVisible('#modalCufEmitir') && (await p.innerText('#cufEUF')).trim() === 'UF 1B', JS(await alertas()));
await p.waitForTimeout(1200);
ok('M3b se emitió UN solo recibo y el resultado quedó en SU unidad', (await emit()).length === eM + 1 && /Se emitió 1 recibo/.test(await p.innerText('#cufEResultado')), String((await emit()).length - eM));
await p.evaluate(() => { window.obtenerProximoComprobante = window.__opc; cufCerrarEmitir(); });

// M4. Si no se pudo guardar, el panel NO dice «Se emitió»
await limpiar();
await p.evaluate(() => { window.__pe = persistirEmitidos; window.persistirEmitidos = () => Promise.resolve(false); });
await p.evaluate(i => cufAbrirEmitir(i), await idxDe('1B')); await p.waitForTimeout(300);
await p.fill('#cufEMonto_res', '55'); await p.selectOption('#cufEDestino', 'no');
await p.click('#cufEBtn'); await p.waitForTimeout(600);
ok('M4 un guardado fallido se avisa en rojo y no se muestra «Se emitió»', /No se pudo guardar/.test(await p.innerText('#cufEResultado')) && !/Se emitió/.test(await p.innerText('#cufEResultado')) && !(await p.isDisabled('#cufEBtn')), await p.innerText('#cufEResultado'));
await p.evaluate(() => { window.persistirEmitidos = window.__pe; cufCerrarEmitir(); });
// ese recibo quedó sólo en memoria: se saca para no ensuciar lo que sigue
await p.evaluate(() => { comprobantesEmitidos = comprobantesEmitidos.filter(e => !(e.ventaId && /Fondo de reserva/.test(e.concepto || '') && e.total === 55)); });

// M5. «No mueve caja» es una decisión: los botones masivos no lo meten en la caja
await limpiar();
ok('M5 el recibo emitido «no mueve caja» queda marcado (sinCaja)', rj.id && (await emit()).find(x => x.id === rj.id).sinCaja === true);
await p.evaluate(() => { window.__confirmRet = false; });
const nSinRef = await p.evaluate(() => comprobantesEmitidos.filter(e => e && !e.afectaCaja && !e.sinCaja).length);
const nTodos = await p.evaluate(() => comprobantesEmitidos.filter(e => e && !e.afectaCaja).length);
await p.evaluate(() => reflejarEmitidosEnIngresos('ingreso'));
const msgRef = (await p.evaluate(() => window.__confirms)).join('|');
ok('M5b «Reflejar todos como ingreso» no cuenta los «sólo el recibo»', nTodos > nSinRef && new RegExp('reflejar ' + nSinRef + ' comprobante').test(msgRef), nSinRef + '/' + nTodos + ' ' + msgRef.slice(0, 80));
await p.evaluate(() => { window.__confirmRet = true; });

// M6. Pasar un recibo «no mueve caja» a «Sí» propone INGRESO (antes: egreso)
await limpiar();
await p.evaluate(id => abrirModalEmitir(id), rj.id); await p.waitForTimeout(300);
await p.selectOption('#emitAfectaCaja', 'si'); await p.evaluate(() => emitToggleAfectaCaja());
ok('M6 al pasar a «Sí» el movimiento propuesto es ingreso', await p.inputValue('#emitMovTipo') === 'ingreso', await p.inputValue('#emitMovTipo'));
await p.evaluate(() => cerrarModalEmitir());

// M7. Editar un recibo no deja la cuenta en otra moneda que el recibo
await limpiar();
await p.evaluate(id => abrirModalEmitir(id), rb.id); await p.waitForTimeout(300);
await p.selectOption('#emitMoneda', 'ARS');
await p.click('#modalEmitir .btn-gold'); await p.waitForTimeout(400);
ok('M7 cambiar la moneda del recibo con una cuenta en otra moneda frena', (await alertas()).some(m => /es en USD y el recibo en ARS/.test(m)) && (await emit()).find(x => x.id === rb.id).moneda === 'USD', JS(await alertas()));
await p.evaluate(() => cerrarModalEmitir());

// M8. Texto libre escapado: papel, tabla de Ventas
await limpiar();
const hostil = '<img src=x onerror="window.__PWNED=1">';
await p.evaluate(h => { const e = comprobantesEmitidos.find(x => x.ventaId === 'vta_3a'); window.__bk8 = { d: e.clienteDetalle, c: e.concepto, ls: e.conceptosUF }; e.clienteDetalle = 'UF ' + h + ' — ' + h; e.concepto = h; e.conceptosUF = null; }, hostil);
const idH = await p.evaluate(() => comprobantesEmitidos.find(x => x.ventaId === 'vta_3a').id);
await p.evaluate(id => imprimirComprobanteEmitido(id), idH);
const hh = (await p.evaluate(() => window.__open))[0] || '';
ok('M8 el encabezado y el concepto del papel salen escapados (nada vivo)', !/<img/i.test(hh) && /&lt;img/.test(hh) && (await p.evaluate(() => window.__PWNED)) === undefined, hh.slice(hh.indexOf('parte-dato'), hh.indexOf('parte-dato') + 160));
await p.evaluate(() => { const e = comprobantesEmitidos.find(x => x.ventaId === 'vta_3a'); e.clienteDetalle = window.__bk8.d; e.concepto = window.__bk8.c; e.conceptosUF = window.__bk8.ls; });
await p.evaluate(h => { const v = ventas.find(x => x.uf === '3A'); window.__bk8v = { uf: v.uf, c: v.comprador }; v.uf = h; v.comprador = h; renderVentas(); }, hostil);
ok('M8b la tabla de Ventas escapa UF y comprador', !(await p.evaluate(() => /<img/i.test(document.getElementById('ventasBody').innerHTML))) && (await p.evaluate(() => window.__PWNED)) === undefined);
await p.evaluate(() => { const v = ventas.find(x => x.uf && /^<img/.test(x.uf)); v.uf = window.__bk8v.uf; v.comprador = window.__bk8v.c; renderVentas(); });

// M9. UF nueva vendida en pesos: los importes se guardan y se proponen en pesos
await limpiar();
await p.evaluate(() => abrirModalVenta()); await p.waitForTimeout(300);
await p.evaluate(() => selModalidadVenta('total_ars'));
await p.fill('#ventaUF', 'ZZ9'); await p.fill('#ventaComprador', 'Prueba v596'); await p.fill('#ventaPrecioARSTotal', '10000000');
await p.evaluate(() => { document.getElementById('ventaConcDet').open = true; });
await p.fill('#cufMonto_adm', '500000');
await p.evaluate(() => guardarVenta()); await p.waitForTimeout(600);
const vz = await venta('ZZ9');
ok('M9 UF nueva en pesos: la moneda de los importes es ARS (no USD fijo)', !!vz && vz.conceptosUF && vz.conceptosUF.moneda === 'ARS' && vz.conceptosUF.montos.adm === 500000, JS(vz && vz.conceptosUF));
if (vz) {
  await p.evaluate(i => cufAbrirEmitir(i), await idxDe('ZZ9')); await p.waitForTimeout(300);
  ok('M9b y al emitir se propone en pesos', await p.inputValue('#cufEMoneda') === 'ARS' && await p.inputValue('#cufEMonto_adm') === '500000');
  await p.evaluate(() => cufCerrarEmitir());
  await p.evaluate(async id => { await REF_VENTAS.child(id).remove(); }, vz.id); await p.waitForTimeout(300);
}

// M10. El edificio es POR PROYECTO: al apuntar a otro no se arrastra el del anterior y no se abre hasta que llegue
await limpiar();
const edAntes = await p.evaluate(() => Object.assign({}, _cufEdificio));
await p.evaluate(() => actualizarRefsIngresos());
ok('M10 al cambiar de proyecto el edificio anterior se descarta hasta que llegue el nuevo', await p.evaluate(() => Object.keys(_cufEdificio).length === 0 && _cufEdificioCargado === false));
await p.evaluate(() => { cufAbrirEdificio(); cufAbrirEmitir(0); });
ok('M10b y mientras tanto no se abre el cuadro del edificio ni la emisión', (await alertas()).filter(m => /cargando los conceptos/.test(m)).length === 2 && !(await p.isVisible('#modalCufEdificio')) && !(await p.isVisible('#modalCufEmitir')), JS(await alertas()));
await p.evaluate(() => new Promise(r => REF_CONC_UF.once('value', s => { _cufEdificio = s.val() || {}; _cufEdificioCargado = true; r(); })));
ok('M10c al llegar vuelve el del proyecto', JS(await p.evaluate(() => Object.assign({}, _cufEdificio))) === JS(edAntes));
// guardar el edificio sin tocar nada no escribe nada
await p.evaluate(() => cufAbrirEdificio()); await p.waitForTimeout(200);
const antesRaw = await p.evaluate(() => new Promise(r => REF_CONC_UF.once('value', s => r(JSON.stringify(s.val())))));
await p.click('#cufEdGuardar'); await p.waitForTimeout(300);
ok('M10d guardar el edificio sin cambiar nada cierra y no escribe', !(await p.isVisible('#modalCufEdificio')) && antesRaw === await p.evaluate(() => new Promise(r => REF_CONC_UF.once('value', s => r(JSON.stringify(s.val()))))));

// M11. Validaciones del modal de emisión y fecha
await limpiar();
const eV = (await emit()).length;
await p.evaluate(i => cufAbrirEmitir(i), await idxDe('1B')); await p.waitForTimeout(300);
await p.check('#cufEChk_adm'); await p.fill('#cufEMonto_adm', '');
await p.check('#cufEChk_adm');
await p.click('#cufEBtn'); await p.waitForTimeout(200);
ok('M11 un concepto tildado sin importe frena y dice cuál', (await alertas()).some(m => /Cargá el importe de: Fondo de administración/.test(m)) && (await emit()).length === eV, JS(await alertas()));
await limpiar();
for (const k of ['adm', 'res', 'alh']) await p.uncheck('#cufEChk_' + k);
await p.click('#cufEBtn'); await p.waitForTimeout(200);
ok('M11b sin nada tildado frena', (await alertas()).some(m => /Tildá al menos un concepto/.test(m)) && (await emit()).length === eV);
await limpiar();
await p.fill('#cufEMonto_adm', '1234.567'); await p.fill('#cufEFecha', '');
await p.click('#cufEBtn'); await p.waitForTimeout(200);
ok('M11c sin fecha frena', (await alertas()).some(m => /Ingresá la fecha/.test(m)) && (await emit()).length === eV);
await limpiar();
await p.fill('#cufEFecha', '2026-03-15'); await p.selectOption('#cufEDestino', 'efvo');
await p.click('#cufEBtn'); await p.waitForTimeout(700);
const rF = (await emit())[eV] || {};
const mF = await p.evaluate(id => ingGeneral.filter(m => m.origenEmitidoId === id).map(m => m.fecha), rF.id);
ok('M11d la fecha elegida va al recibo y al movimiento de caja', rF.fecha === '2026-03-15' && mF.length === 1 && mF[0] === '2026-03-15', JS(rF.fecha) + JS(mF));
ok('M11e el importe se redondea a centavos (1234,567 → 1234,57)', rF.total === 1234.57 && rF.conceptosUF[0].monto === 1234.57, JS(rF.total));
// repetir un concepto: «No» no emite y deja el botón libre
await limpiar();
await p.evaluate(() => { window.__confirmRet = false; });
await p.check('#cufEChk_adm'); await p.fill('#cufEMonto_adm', '10');
await p.click('#cufEBtn'); await p.waitForTimeout(400);
ok('M11f «No» a «¿Emitir otro igual?» no emite y deja el botón libre', (await emit()).length === eV + 1 && !(await p.isDisabled('#cufEBtn')) && (await p.innerText('#cufEBtn')).includes('Emitir') && (await p.evaluate(() => window.__confirms)).length === 1, JS(await p.evaluate(() => window.__confirms)));
await p.evaluate(() => { window.__confirmRet = true; cufCerrarEmitir(); });
// ningún concepto aplica / alta sin guardar
await limpiar();
await p.evaluate(() => { const v = ventas.find(x => x.uf === '1B'); window.__aplica1b = v.conceptosUF; v.conceptosUF = { aplica: { gan: false, iibb: false, adm: false, res: false, alh: false, rec: false, cdi: false } }; cufAbrirEmitir(ventas.indexOf(v)); v.conceptosUF = window.__aplica1b; if (v.conceptosUF === undefined) delete v.conceptosUF; });
ok('M11g si ningún concepto aplica avisa y no abre el modal', (await alertas()).some(m => /Ningún concepto aplica/.test(m)) && !(await p.isVisible('#modalCufEmitir')), JS(await alertas()));
await limpiar();
await p.evaluate(() => abrirModalVenta()); await p.waitForTimeout(200);
await p.evaluate(() => cufAbrirEmitir());
ok('M11h una UF sin guardar no emite', (await alertas()).some(m => /Guardá primero la unidad/.test(m)) && !(await p.isVisible('#modalCufEmitir')), JS(await alertas()));
await p.evaluate(() => cerrarModalVenta());

// M12. Impresión en lote: estilos, título y recibos confidenciales
await limpiar();
const idsLote = (await emit()).filter(x => x.ventaId === 'vta_3a').slice(0, 3).map(x => x.id);
await p.evaluate(ids => { const e = comprobantesEmitidos.find(x => x.id === ids[1]); e.confidencial = true; window.__esSA = esSuperAdmin; esSuperAdmin = false; cufImprimirLote(ids); esSuperAdmin = window.__esSA; e.confidencial = false; }, idsLote);
const lt = (await p.evaluate(() => window.__html))[0] || '';
ok('M12 el lote lleva estilos, título «(+1)» y deja afuera el recibo confidencial a quien no es superadmin', /<style>/.test(lt) && /\(\+1\)<\/title>/.test(lt) && (lt.match(/class="pg"/g) || []).length === 2 && !/window\.print\(\)/.test(lt), (lt.match(/class="pg"/g) || []).length + '');

// ── J. Permisos ──────────────────────────────────────────────────────────────
await limpiar();
await p.evaluate(() => { puedeEditar = false; aplicarPermisos(); renderVentas(); });
ok('J1 sin permiso de edición se esconde «Conceptos del edificio»', await p.evaluate(() => getComputedStyle(document.getElementById('btnCufEdificio')).display) === 'none');
ok('J2 y no hay botón «Conceptos» en las filas', !(await p.innerHTML('#ventasBody')).includes('🧾 Conceptos'));
await p.evaluate(() => { cufAbrirEmitir(0); cufAbrirEdificio(); });
ok('J3 las funciones tampoco dejan abrir', (await alertas()).filter(m => /permiso/.test(m)).length === 2 && !(await p.isVisible('#modalCufEmitir')) && !(await p.isVisible('#modalCufEdificio')), JS(await alertas()));
await p.evaluate(() => { puedeEditar = true; aplicarPermisos(); renderVentas(); });

// ── K. Nada roto ─────────────────────────────────────────────────────────────
const errs = errores.filter(e => !/net::|Failed to load/.test(e));
ok('K1 sin errores de página', errs.length === 0, JS(errs));
ok('K2 ningún pedido que envíe datos a la red (sólo lecturas públicas de la demo)', red.filter(x => !/^GET /.test(x)).length === 0, JS(red.filter(x => !/^GET /.test(x))));
console.log(res.map(r => r.join(' ')).join('\n'));
console.log('errores de página:', errs);
console.log('red:', red.length);
const mal = res.filter(r => r[0] !== 'OK ').length;
console.log(mal ? `\n${mal} FALLAS de ${res.length}` : `\n${res.length}/${res.length} OK`);
await b.close();
if (mal || errs.length) process.exitCode = 1;
