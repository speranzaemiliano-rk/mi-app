// Arnés para la versión de prueba: levanta la app REAL (index.html + demo/*.js del repo) con las librerías de CDN
// servidas desde disco (cdn/) y registra todo pedido de red que se intente.
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
const _req = createRequire(import.meta.url);
// Playwright: el de la carpeta de módulos global (PLAYWRIGHT_MODULE) o el que resuelva Node
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || (() => { try { return _req.resolve('playwright'); } catch (e) { return '/opt/node22/lib/node_modules/playwright/index.mjs'; } })());
import fs from 'fs';
import path from 'path';
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.ROOT || path.resolve(AQUI, '../..');
const CDN = process.env.DEMO_CDN || path.join(AQUI, 'cdn');   // librerías y fuentes de CDN bajadas con bajar-cdn.sh
const MAPA = { 'chart.min.js': 'chart.min.js', 'Sortable.min.js': 'Sortable.min.js', 'xlsx.full.min.js': 'xlsx.full.min.js', 'pdf.min.js': 'pdf.min.js', 'jspdf.umd.min.js': 'jspdf.umd.min.js' };
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };
export async function abrirDemo(opts = {}) {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const c = await b.newContext({ viewport: opts.viewport || { width: 1400, height: 900 } });
  const p = await c.newPage();
  const red = [];            // pedidos que llegaron a la red (fuera del sitio y de los CDN permitidos)
  const errores = [];
  p.on('pageerror', e => errores.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errores.push('console.error: ' + m.text().slice(0, 300)); });
  await p.route('**/*', async r => {
    const u = r.request().url();
    if (u.startsWith('http://localhost:8099/__fonts/')) return r.fulfill({ status: 200, contentType: 'font/woff2', body: fs.readFileSync(path.join(CDN, u.split('/__fonts/')[1])) });
    if (u.startsWith('http://localhost:8099')) {
      let rel = decodeURIComponent(new URL(u).pathname).replace(/^\/(mi-app\/)?/, '');
      if (!rel) rel = 'index.html';
      const f = path.join(ROOT, rel);
      if (fs.existsSync(f) && fs.statSync(f).isFile()) return r.fulfill({ status: 200, contentType: MIME[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) });
      return r.fulfill({ status: 404, body: '' });
    }
    const base = u.split('?')[0].split('/').pop();
    if (MAPA[base]) return r.fulfill({ status: 200, contentType: 'application/javascript', body: fs.existsSync(path.join(CDN, MAPA[base])) ? fs.readFileSync(path.join(CDN, MAPA[base])) : '' });
    // fuentes reales servidas desde disco (para que las capturas se vean como en un navegador normal)
    if (/fonts\.googleapis\.com\/css2/.test(u)) {
      const k = /Material\+Symbols/.test(u) ? 'ms' : /Space\+Grotesk/.test(u) ? 'sg' : /Raleway/.test(u) ? 'raleway' : null;
      if (k && fs.existsSync(path.join(CDN, k + '.local.css'))) return r.fulfill({ status: 200, contentType: 'text/css', body: fs.readFileSync(path.join(CDN, k + '.local.css')) });
    }
    if (/\.css(\?|$)/.test(u) || /fonts\.(googleapis|gstatic)\.com/.test(u)) return r.fulfill({ status: 200, contentType: 'text/css', body: '' });
    if (/\.js(\?|$)/.test(u) && /(gstatic\.com\/firebasejs|cdn\.|cdnjs|accounts\.google|jsdelivr)/.test(u)) return r.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
    red.push(r.request().method() + ' ' + u);
    return r.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  if (opts.init) await p.addInitScript(opts.init);   // script que corre antes que cualquier otro de la página
  await p.goto('http://localhost:8099/' + (opts.search ?? '?demo=1'), { waitUntil: 'domcontentloaded' });
  return { b, p, red, errores };
}
// espera a que la app termine de entrar (menú visible) o devuelve el estado para diagnosticar
export async function esperarApp(p, ms = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const ok = await p.evaluate(() => { const a = document.getElementById('app'); return !!a && !a.classList.contains('app-hidden'); }).catch(() => false);
    if (ok) return true;
    await p.waitForTimeout(250);
  }
  return false;
}
// Entra al sistema como lo haría una persona: splash → «Entrar al sistema» → empresa y proyecto ya elegidos → «Ingresar».
// Devuelve cuando la app (#app) está visible. Después se navega con irA(p, 'CajaGeneral') = mostrarTab(...).
export async function entrarAlSistema(p) {
  await p.waitForSelector('#sp-enter', { timeout: 15000 });
  await p.click('#sp-enter');
  await p.waitForSelector('#obEnterBtn:not([disabled])', { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(800);
  await p.click('#obEnterBtn', { timeout: 15000 });
  const ok = await esperarApp(p, 15000);
  await p.waitForTimeout(1500);
  return ok;
}
export async function irA(p, tab) { await p.evaluate(t => mostrarTab(t), tab); await p.waitForTimeout(700); }
