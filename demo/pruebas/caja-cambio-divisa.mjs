// Caja diaria (caja/app.html) — «Cambio de divisa»: la venta/compra de dólares tiene que dejar los DOS movimientos (US$ y $) aunque quien carga el día no toque
// «＋ Sumar»; a medio cargar frena el guardado; y cargada a mano como movimiento común avisa que la otra caja no se entera. No usa la demo: abre la Caja directo.
// Uso: node caja-cambio-divisa.mjs   (PLAYWRIGHT_MODULE / ROOT como en demo-lib)
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
const _req = createRequire(import.meta.url);
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || (() => { try { return _req.resolve('playwright'); } catch (e) { return '/opt/node22/lib/node_modules/playwright/index.mjs'; } })());
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.ROOT || path.resolve(AQUI, '../..');
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' };

const hoy = new Date(); const ISO = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
const mk = (iso, si, movs) => { const p = iso.split('-').map(Number); const ing = movs.filter(m => m.imp > 0).reduce((s, m) => s + m.imp, 0), egr = movs.filter(m => m.imp < 0).reduce((s, m) => s + m.imp, 0); return { src: 'user', sheet: 'USER-' + iso, y: p[0], m: p[1], d: p[2], date: p[2] + '/' + p[1] + '/' + p[0], iso, wd: 'lun', si, sf: si + ing + egr, ing, egr, nmov: movs.length, dif: null, fis: null, chq: null, empty: false, caja: [], movs }; };
const semilla = (cur) => ({
  caja_contexts_v1: [{ id: 'fk', empresa: 'FEKOMP', proyecto: 'Alquileres' }, { id: 'ot', empresa: 'FEKOMP', proyecto: 'Obra' }],
  caja_active_context_v1: 'fk', caja_active_currency_v1: cur,
  'caja_user_days_v2::fk::USD': [mk('2026-10-01', 0, [{ imp: 5000, cpt: 'Cobro alquiler USD', ref: '' }])],
  'caja_user_days_v2::fk::ARS': [mk('2026-10-01', 0, [{ imp: 800000, cpt: 'Cobro alquiler', ref: '' }])],
});

const res = [];
const ok = (n, c, x) => res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
async function abrir(cur) {
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const p = await ctx.newPage(); const errores = [];
  p.on('pageerror', e => errores.push('pageerror: ' + e.message));
  await p.route('**/*', r => { const u = r.request().url();
    if (u.startsWith('http://localhost:8099')) { const f = path.join(ROOT, decodeURIComponent(new URL(u).pathname)); if (fs.existsSync(f) && fs.statSync(f).isFile()) return r.fulfill({ status: 200, contentType: MIME[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) }); return r.fulfill({ status: 404, body: '' }); }
    return r.fulfill({ status: 200, contentType: /\.js(\?|$)/.test(u) ? 'application/javascript' : 'text/plain', body: '' }); });
  await p.addInitScript(s => { if (!sessionStorage.getItem('__seeded')) { Object.keys(s).forEach(k => localStorage.setItem(k, typeof s[k] === 'string' ? s[k] : JSON.stringify(s[k]))); sessionStorage.setItem('__seeded', '1'); } }, semilla(cur));
  await p.goto('http://localhost:8099/caja/app.html', { waitUntil: 'load' }); await p.waitForTimeout(1200);
  p.__alerts = []; await p.evaluate(() => { window.__al = []; window.alert = m => window.__al.push(m); window.confirm = () => true; });
  return { p, errores, ctx };
}
const dias = (p, cur) => p.evaluate(c => JSON.parse(localStorage.getItem('caja_user_days_v2::fk::' + c) || '[]').filter(d => !d.empty).map(d => ({ iso: d.iso, si: d.si, sf: d.sf, movs: d.movs })), cur);
const hoyDia = async (p, cur) => (await dias(p, cur)).find(d => d.iso === ISO);
const llenarFx = (p, usd, rate, tipo) => p.evaluate(([u, r, t]) => { document.getElementById('ed_fxType').value = t || 'venta'; document.getElementById('ed_fxUsd').value = u; document.getElementById('ed_fxRate').value = r; document.getElementById('ed_fxUsd').dispatchEvent(new Event('input')); document.getElementById('ed_fxRate').dispatchEvent(new Event('input')); }, [usd, rate, tipo]);
const guardar = async (p) => { await p.evaluate(() => document.getElementById('saveDay').click()); await p.waitForTimeout(700); };

// 1) camino de siempre: con «＋ Sumar»
for (const cur of ['USD', 'ARS']) {
  const { p, errores, ctx } = await abrir(cur);
  await p.evaluate(() => openEditor(null)); await p.waitForTimeout(250);
  await p.evaluate(iso => { document.getElementById('f_date').value = iso; edState.iso = iso; }, ISO);
  await llenarFx(p, '1000', '1200'); await p.evaluate(() => document.getElementById('ed_fxAdd').click());
  await guardar(p);
  const u = await hoyDia(p, 'USD'), a = await hoyDia(p, 'ARS');
  ok('vista ' + cur + ' con «＋ Sumar»: sale US$ 1.000 de la caja en dólares y entran $ 1.200.000 a la caja en pesos', !!u && !!a && u.movs.some(m => m.imp === -1000 && m.ref === 'Cambio') && a.movs.some(m => m.imp === 1200000 && m.ref === 'Cambio') && u.sf === 4000 && a.sf === 2000000, JSON.stringify({ u, a }));
  ok('vista ' + cur + ': sin errores de JS', errores.length === 0, JSON.stringify(errores));
  await ctx.close();
}
// 2) lo que pasaba: completar el cuadro y guardar SIN tocar «＋ Sumar» → antes no se registraba nada; ahora se suma solo
{
  const { p, errores, ctx } = await abrir('USD');
  await p.evaluate(() => openEditor(null)); await p.waitForTimeout(250);
  await p.evaluate(iso => { document.getElementById('f_date').value = iso; edState.iso = iso; }, ISO);
  await llenarFx(p, '1000', '1200');
  await guardar(p);
  const u = await hoyDia(p, 'USD'), a = await hoyDia(p, 'ARS');
  ok('sin tocar «＋ Sumar»: el cambio de divisa se suma solo y los pesos llegan a la caja en pesos', !!u && !!a && u.movs.some(m => m.imp === -1000) && a.movs.some(m => m.imp === 1200000 && /Venta de divisa/.test(m.cpt)), JSON.stringify({ u, a }));
  ok('sin tocar «＋ Sumar»: el cuadro queda vacío y el editor se cierra', await p.evaluate(() => !document.getElementById('edOverlay').classList.contains('on')));
  // compra (doy pesos, recibo dólares) sin «＋ Sumar», editando el día ya guardado
  await p.evaluate(iso => editDay(iso), ISO); await p.waitForTimeout(300);
  await llenarFx(p, '200', '1300', 'compra');
  await guardar(p);
  const u2 = await hoyDia(p, 'USD'), a2 = await hoyDia(p, 'ARS');
  ok('compra sin «＋ Sumar» sobre un día existente: entran US$ 200 y salen $ 260.000', u2.movs.some(m => m.imp === 200 && /Compra de divisa/.test(m.cpt)) && a2.movs.some(m => m.imp === -260000), JSON.stringify({ u2, a2 }));
  ok('sin errores de JS', errores.length === 0, JSON.stringify(errores));
  await ctx.close();
}
// 3) a medio cargar: frena el guardado y dice qué falta (no se guarda nada por la mitad)
{
  const { p, ctx } = await abrir('USD');
  await p.evaluate(() => openEditor(null)); await p.waitForTimeout(250);
  await p.evaluate(iso => { document.getElementById('f_date').value = iso; edState.iso = iso; }, ISO);
  await llenarFx(p, '1000', '');   // falta la cotización
  await guardar(p);
  ok('con la cotización sin completar: no se guarda el día y se avisa', !(await hoyDia(p, 'USD')) && !(await hoyDia(p, 'ARS')) && /cambio de divisa a medio cargar/.test(await p.evaluate(() => document.getElementById('edErr').textContent)) && /cotización/.test(await p.evaluate(() => document.getElementById('ed_fxErr').textContent)), await p.evaluate(() => document.getElementById('edErr').textContent));
  ok('el editor sigue abierto con lo tipeado', await p.evaluate(() => document.getElementById('edOverlay').classList.contains('on') && document.getElementById('ed_fxUsd').value === '1000'));
  await p.evaluate(() => { document.getElementById('ed_fxUsd').value = ''; });
  await guardar(p);
  ok('vaciando los campos, el día se guarda sin cambio de divisa', !!(await hoyDia(p, 'USD')) && !(await hoyDia(p, 'ARS')));
  await ctx.close();
}
// 4) préstamo entre empresas escrito y sin sumar: también se suma solo
{
  const { p, ctx } = await abrir('ARS');
  await p.evaluate(() => openEditor(null)); await p.waitForTimeout(250);
  await p.evaluate(iso => { document.getElementById('f_date').value = iso; edState.iso = iso; document.getElementById('ed_loanTo').value = 'ot'; document.getElementById('ed_loanAmt').value = '50000'; }, ISO);
  await guardar(p);
  const a = await hoyDia(p, 'ARS');
  const ot = await p.evaluate(iso => JSON.parse(localStorage.getItem('caja_user_days_v2::ot::ARS') || '[]').find(d => d.iso === iso), ISO);
  ok('préstamo sin «＋ Sumar»: sale de esta caja y entra a la otra', !!a && a.movs.some(m => m.imp === -50000) && !!ot && ot.movs.some(m => m.imp === 50000), JSON.stringify({ a, ot }));
  await ctx.close();
}
// 5) aviso al cargar la venta de dólares como movimiento común
{
  const { p, ctx } = await abrir('USD');
  await p.evaluate(() => openEditor(null)); await p.waitForTimeout(250);
  const vis = () => p.evaluate(() => getComputedStyle(document.getElementById('ed_fxHint')).display !== 'none');
  ok('el aviso empieza oculto', !(await vis()));
  await p.evaluate(() => { var i = document.querySelector('#mvList .mvrow .cpt'); i.value = 'Venta de dólares'; i.dispatchEvent(new Event('input')); });
  ok('escribir «Venta de dólares» como concepto muestra el aviso de «Cambio de divisa»', await vis());
  await p.evaluate(() => { var i = document.querySelector('#mvList .mvrow .cpt'); i.value = 'Cobro alquiler local 3'; i.dispatchEvent(new Event('input')); });
  ok('un concepto cualquiera lo vuelve a ocultar', !(await vis()));
  for (const t of ['vendi usd', 'Compra de divisa', 'cambio de dolares', 'USD vendidos']) { await p.evaluate(t => { var i = document.querySelector('#mvList .mvrow .cpt'); i.value = t; i.dispatchEvent(new Event('input')); }, t); ok('«' + t + '» también lo muestra', await vis()); }
  await p.evaluate(() => { var i = document.querySelector('#mvList .mvrow .cpt'); i.value = 'Pago ABL'; i.dispatchEvent(new Event('input')); });
  ok('«Pago ABL» no lo muestra', !(await vis()));
  await ctx.close();
}
// 6) el aviso no confunde: ni las patas que ya generó «Cambio de divisa», ni conceptos comunes con USD; sí «US$» y «cambio dólares»
{
  const { p, ctx } = await abrir('USD');
  await p.evaluate(() => openEditor(null)); await p.waitForTimeout(250);
  const prueba = (t, ref) => p.evaluate(([t, ref]) => { edState.movs[0].cpt = t; edState.movs[0].ref = ref || ''; _edFxHint(); return getComputedStyle(document.getElementById('ed_fxHint')).display !== 'none'; }, [t, ref]);
  const positivos = ['Venta de dólares', 'Vendí US$ 100', 'Venta US$ 1000', 'Compré US$ 200', 'cambio dólares', 'Cambio USD 300', 'Vendí 1000 USD', 'USD vendidos', 'dólares comprados', 'Venta de divisa', 'venta u$s', 'Compra de dolares'];
  const negativos = ['Compra de insumos USD 50', 'Ventilador USD', 'Inventario USD', 'Evento USD', 'Comprobante dólar', 'Compromiso USD', 'Cobro venta depto USD', 'Pago a proveedor USD compra', 'cobro dólares alquiler', 'pago expensas', 'Cobro alquiler', 'Venta mostrador'];
  const falsos = []; for (const x of positivos) if (!(await prueba(x))) falsos.push('no avisa: ' + x); for (const x of negativos) if (await prueba(x)) falsos.push('avisa de más: ' + x);
  ok('el aviso distingue ventas/compras de dólares de conceptos comunes con USD', falsos.length === 0, JSON.stringify(falsos));
  ok('una pata ya generada por «Cambio de divisa» (ref «Cambio») no dispara el aviso', !(await prueba('Venta de divisa', 'Cambio')));
  // reabrir un día con un cambio bien cargado: sin aviso
  await p.evaluate(() => closeEditor());
  await p.evaluate(() => registerExchange(activeContext(), 'venta', 1000, 1200000, '', '2026-10-01'));
  await p.waitForTimeout(200);
  await p.evaluate(() => editDay('2026-10-01')); await p.waitForTimeout(250);
  ok('«Editar día» de un día con cambio de divisa bien cargado no muestra el aviso', await p.evaluate(() => getComputedStyle(document.getElementById('ed_fxHint')).display === 'none'));
  await ctx.close();
}
// 7) alta rápida del Resumen: «Venta de dólares» como movimiento común pide confirmar
{
  const { p, ctx } = await abrir('ARS');
  const rapida = (cpt, conf) => p.evaluate(async ([iso, cpt, conf]) => { window.__conf = []; window.confirm = m => { window.__conf.push(m); return conf; }; openDayIso(iso); await new Promise(r => setTimeout(r, 200)); { const bx = document.getElementById('dayQuickAdd'); bx.style.display = 'none'; bx.innerHTML = ''; } openQuickAdd(iso); document.getElementById('qaCpt').value = cpt; document.getElementById('qaAmt').value = '1000'; saveQuickMov(iso); return { conf: window.__conf.length, movs: JSON.parse(localStorage.getItem('caja_user_days_v2::fk::ARS')).find(d => d.iso === iso).movs.length }; }, ['2026-10-01', cpt, conf]);
  const a = await rapida('Venta de dólares', false);
  ok('alta rápida «Venta de dólares»: pregunta y, si se dice que no, no carga nada', a.conf === 1 && a.movs === 1, JSON.stringify(a));
  const b2 = await rapida('Venta de dólares', true);
  ok('alta rápida «Venta de dólares» confirmando: se carga como movimiento común', b2.conf === 1 && b2.movs === 2, JSON.stringify(b2));
  const c2 = await rapida('Cobro alquiler local 3', false);
  ok('alta rápida de un concepto común: no pregunta nada', c2.conf === 0 && c2.movs === 3, JSON.stringify(c2));
  await ctx.close();
}
// 8) fechas con lápida (día borrado): recrear o mover un día a esa fecha no deja dos entradas con la misma fecha, y el cambio de divisa queda donde se ve
{
  const lapida = (iso) => { const p = iso.split('-').map(Number); return { src: 'user', iso, y: p[0], m: p[1], d: p[2], date: p[2] + '/' + p[1] + '/' + p[0], wd: 'lun', empty: true, movs: [], credMovs: [], fisMovs: [], caja: [], ing: 0, egr: 0, nmov: 0, si: 0, sf: 0, dif: null, fis: null, chq: null, cred: 0, credSi: 0, credAdj: 0 }; };
  // recrear una fecha borrada con un cobro y un cambio de divisa
  {
    const { p, errores, ctx } = await abrir('ARS');
    await p.evaluate(([iso, l]) => { ['ARS', 'USD'].forEach(c => { const k = 'caja_user_days_v2::fk::' + c, a = JSON.parse(localStorage.getItem(k)); a.push(l); localStorage.setItem(k, JSON.stringify(a)); }); location.reload(); }, [ISO, lapida(ISO)]);
    await p.waitForLoadState('load'); await p.waitForTimeout(900);
    await p.evaluate(() => { window.__al = []; window.alert = m => window.__al.push(m); window.confirm = () => true; });
    await p.evaluate(() => openEditor(null)); await p.waitForTimeout(250);
    await p.evaluate(iso => { document.getElementById('f_date').value = iso; edState.iso = iso; edState.movs[0] = { type: 'in', amt: '500', cpt: 'Cobro', ref: '' }; renderMovRows(); }, ISO);
    await llenarFx(p, '1000', '1200'); await guardar(p);
    const ars = await p.evaluate(iso => JSON.parse(localStorage.getItem('caja_user_days_v2::fk::ARS')).filter(d => d.iso === iso), ISO);
    const usd = await p.evaluate(iso => JSON.parse(localStorage.getItem('caja_user_days_v2::fk::USD')).filter(d => d.iso === iso), ISO);
    ok('fecha borrada y recreada: queda UNA sola entrada por caja (la lápida se reemplaza)', ars.length === 1 && usd.length === 1 && !ars[0].empty, JSON.stringify({ ars: ars.length, usd: usd.length }));
    ok('fecha borrada y recreada: en la caja en pesos figuran el cobro y los $ 1.200.000 del cambio, y la pantalla los suma', ars[0].movs.length === 2 && ars[0].movs.some(m => m.imp === 1200000) && (await p.evaluate(iso => days.find(d => d.iso === iso).sf, ISO)) === 800000 + 500 + 1200000, JSON.stringify(ars));
    ok('sin errores de JS', errores.length === 0, JSON.stringify(errores));
    await ctx.close();
  }
  // mover un día existente a una fecha con lápida, con cambio de divisa
  {
    const { p, ctx } = await abrir('ARS');
    const F = '2026-10-05';
    await p.evaluate(([f, l]) => { ['ARS', 'USD'].forEach(c => { const k = 'caja_user_days_v2::fk::' + c, a = JSON.parse(localStorage.getItem(k)); a.push(l); localStorage.setItem(k, JSON.stringify(a)); }); location.reload(); }, [F, lapida(F)]);
    await p.waitForLoadState('load'); await p.waitForTimeout(900);
    await p.evaluate(() => { window.__al = []; window.alert = m => window.__al.push(m); window.confirm = () => true; });
    await p.evaluate(() => editDay('2026-10-01')); await p.waitForTimeout(250);
    await p.evaluate(f => { document.getElementById('f_date').value = f; edState.iso = f; }, F);
    await llenarFx(p, '1000', '1200'); await guardar(p);
    const ars = await p.evaluate(f => JSON.parse(localStorage.getItem('caja_user_days_v2::fk::ARS')).filter(d => d.iso === f || d.iso === '2026-10-01'), F);
    const visible = await p.evaluate(() => days.filter(d => !d.empty).map(d => d.iso + ':' + d.sf));
    ok('mover un día a una fecha con lápida + cambio de divisa: el día no desaparece y tiene el cobro y los pesos', ars.length === 1 && ars[0].iso === F && ars[0].movs.some(m => m.imp === 800000) && ars[0].movs.some(m => m.imp === 1200000) && visible.some(x => x.startsWith(F)), JSON.stringify({ ars, visible }));
    await ctx.close();
  }
}
console.log(res.map(x => x.join(' ')).join('\n'));
console.log(res.filter(x => x[0] !== 'OK ').length ? '\n❌ HAY FALLAS' : '\n✅ todo OK (' + res.length + ')');
await browser.close();
if (res.some(x => x[0] !== 'OK ')) process.exitCode = 1;
