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
console.log(res.map(x => x.join(' ')).join('\n'));
console.log(res.filter(x => x[0] !== 'OK ').length ? '\n❌ HAY FALLAS' : '\n✅ todo OK (' + res.length + ')');
await browser.close();
if (res.some(x => x[0] !== 'OK ')) process.exitCode = 1;
