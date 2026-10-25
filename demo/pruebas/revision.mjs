// Regresión de la revisión independiente de la demo (v562).
import { abrirDemo, entrarAlSistema, irA } from './demo-lib.mjs';
let ok = 0, fail = 0; const t = (n, c, x) => { if (c) { ok++; console.log('✓', n); } else { fail++; console.log('✗', n, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } };
const { b, p, red, errores } = await abrirDemo({ viewport: { width: 1440, height: 900 }, init: () => { window.emailjs = { init() {}, send() { return Promise.resolve('REAL'); } }; } });
const J = (f, a) => p.evaluate(f, a);
await entrarAlSistema(p);
await p.waitForTimeout(2500);   // la pasada final del «Saldo total» corre 1,5 s después de la última carga

// 1) Saldo total del Inicio = Caja General + aperturas de bancos, al entrar y después de cambiar de empresa
const esperado = () => J(() => { renderCajaGeneral(); const ap = (cuentasBancarias || []).reduce((s, c) => ({ ars: s.ars + (c.moneda !== 'USD' ? c.saldo || 0 : 0), usd: s.usd + (c.moneda === 'USD' ? c.saldo || 0 : 0) }), { ars: 0, usd: 0 });
  return { ars: Math.round((window._cgSaldos.ars + ap.ars) * 100) / 100, usd: Math.round((window._cgSaldos.usd + ap.usd) * 100) / 100 }; });
const mostrado = () => J(() => ({ v: document.getElementById('kpiSaldoV').textContent, s: document.getElementById('kpiSaldoSub').textContent }));
const num = s => Number(String(s).replace(/[^\d,-]/g, '').replace(',', '.'));
let e = await esperado(), m = await mostrado();
t('Inicio: «Saldo total» en pesos coincide con Caja General + aperturas al entrar', Math.abs(num(m.v) - e.ars) < 1, { e, m });
t('...y suma los dólares', Math.abs(num(m.s) - e.usd) < 1, { e, m });
await J(async () => { const x = empresas.find(z => z.id === 'emp_demo_2'); empresaActual = x; proyectoActual = x.proyectos[0]; desconectarListeners(); actualizarRefs(); datosInicializado = false; cargarDatos(); });
await p.waitForTimeout(2500); await irA(p, 'Home'); await p.waitForTimeout(2200);
e = await esperado(); m = await mostrado();
t('Inicio de la inmobiliaria: «Saldo total» coincide con su Caja General + aperturas', Math.abs(num(m.v) - e.ars) < 1 || (e.ars === 0 && /0,00/.test(m.v)), { e, m });
t('...y no es el saldo en dólares tratado como pesos', !/^\$?\s?\d{3}\.\d{3},00$/.test(m.v) || e.ars > 0, { e, m });
await J(async () => { const x = empresas.find(z => z.id === 'emp_demo_1'); empresaActual = x; proyectoActual = x.proyectos[0]; desconectarListeners(); actualizarRefs(); datosInicializado = false; cargarDatos(); });
await p.waitForTimeout(2500); await irA(p, 'Home'); await p.waitForTimeout(2200);
e = await esperado(); m = await mostrado();
t('Volviendo a la constructora, el «Saldo total» vuelve a ser el correcto', Math.abs(num(m.v) - e.ars) < 1, { e, m });
t('«Cobrado este mes» del Inicio no es $0,00', await J(() => !/^\$0,00$/.test(document.getElementById('kpiCobradoV') ? document.getElementById('kpiCobradoV').textContent : document.querySelector('[id^=kpiCobr]').textContent)), await J(() => [...document.querySelectorAll('[id^=kpi]')].map(x => x.id + '=' + x.textContent.slice(0, 20))));

// 2) la música no está y no se puede salir hacia Spotify
t('el widget de música (🎵) está escondido', await J(() => { const b = document.getElementById('rk-music-btn'); return !b || getComputedStyle(b).display === 'none'; }));
// 3) la demo no es instalable
t('sin <link rel=manifest> y con el cartel de instalación descartado', await J(() => !document.querySelector('link[rel="manifest"]') && localStorage.getItem('rk_pwa_install_dismiss') === '1'));
// 4) EmailJS (stub real del arnés) devuelve el mensaje amigable
const em = await J(async () => { try { await emailjs.send('s', 't', {}, {}); return 'envió'; } catch (x) { return x; } });
t('enviar un mail falla con el texto «no disponible en la versión de prueba», no con JSON crudo', em && em.text && /no está disponible en la versión de prueba/.test(em.text) && !/^\{/.test(em.text), em);
// 5) IA: aviso inmediato
const ia = await J(async () => { const al = []; const old = window.alert; window.alert = m => al.push(String(m)); const t0 = Date.now(); abrirLeerFacturaPDF(); abrirLeerPresup(); procesarVencimientoPDF(); window.alert = old; return { al, ms: Date.now() - t0 }; });
t('«Leer con IA» (facturas, presupuestos, vencimientos) avisa de entrada que no está disponible', ia.al.length === 3 && ia.al.every(x => /no está disponible en la versión de prueba/.test(x)) && ia.ms < 500, ia);
const gem = await J(async () => { const t0 = Date.now(); const r = await _geminiProxy('gemini-2.5-flash', {}); const j = await r.json(); return { ok: r.ok, msg: j.error && j.error.message, ms: Date.now() - t0, auth: geminiEsErrorAuth(j.error && j.error.message) }; });
t('_geminiProxy responde de inmediato «no disponible» y corta los reintentos', !gem.ok && /versión de prueba/.test(gem.msg) && gem.ms < 300 && gem.auth === true, gem);
// 6) ARCA / Belvo llegan al aviso amigable
const urls = await J(async () => { const r = {}; for (const id of ['emp_demo_1', 'emp_demo_2']) { const x = empresas.find(z => z.id === id); empresaActual = x; r[id] = _afipUrlEmpresaActual(); } empresaActual = empresas[0]; return r; });
t('cada empresa tiene una dirección de ARCA (inválida a propósito): «Emitir» no pide pegar la URL de Railway', /backend-demo\.invalid/.test(urls.emp_demo_1) && /backend-demo\.invalid/.test(urls.emp_demo_2), urls);
// 7) apóstrofe en el nombre de un proveedor
await irA(p, 'Proveedores');
const apo = await J(async () => {
  proveedores.push({ id: 'prov_apo', razonSocial: "Ferretería D'Angelo S.A.", cuit: '30-50000001-7', condicionIVA: 'Responsable Inscripto', rubro: 'Ferretería' });
  renderProveedores();
  const btn = [...document.querySelectorAll('button')].find(x => /D'Angelo|D&#39;Angelo/.test(x.getAttribute('title') || '') && /abrirCargarComprobante/.test(x.getAttribute('onclick') || ''));
  if (!btn) return { err: 'no hay botón' };
  window.__pe = []; window.addEventListener('error', ev => window.__pe.push(ev.message));
  btn.click(); await new Promise(r => setTimeout(r, 400));
  return { modal: document.getElementById('modalCargarComp') && document.getElementById('modalCargarComp').classList.contains('active'), errs: window.__pe, onclick: btn.getAttribute('onclick') };
});
t('un proveedor con apóstrofe (D\'Angelo) abre «Cargar comprobante» sin error de sintaxis', apo.modal === true && !apo.errs.length, apo);
// 8) panel de detalle: líneas de una celda separadas
await J(() => { const e1 = empresas.find(z => z.id === 'emp_demo_1'); }); await irA(p, 'Alquileres'); await p.waitForTimeout(500);
await p.evaluate(() => { const tr = document.querySelector('#alquileresBody tr'); if (tr) tr.click(); });
await p.waitForTimeout(500);
const panel = await J(() => { const a = document.querySelector('.densa-panel, aside.densa-panel, #panelAlquileres aside, .c-panel'); const t = [...document.querySelectorAll('.c-kv')].map(x => x.innerText.replace(/\s+/g, ' ')); const tit = [...document.querySelectorAll('.c-titulo + div')].map(x => x.innerText); return { t, tit }; });
t('el panel de detalle no pega líneas («Cochera S-21 · Av. …», «1/1/2026 · 31/12/2027»)', panel.tit.length && !/[a-z0-9]Av\.|20\d\d\d{1,2}\/\d/.test(panel.tit.join(' ') + panel.t.join(' ')) && /·/.test(panel.tit.join(' ') + panel.t.join(' ')), panel);
// 9) Remuneraciones sin empleados no deja el aviso de caja
await J(async () => { const x = empresas.find(z => z.id === 'emp_demo_2'); empresaActual = x; proyectoActual = x.proyectos[0]; desconectarListeners(); actualizarRefs(); datosInicializado = false; cargarDatos(); });
await p.waitForTimeout(2500); await irA(p, 'Remuneraciones'); await p.waitForTimeout(1200);
t('Remuneraciones de una empresa sin empleados no muestra «Hay $X pagado que todavía no entró en Caja/Banco»', await J(() => { const b = document.getElementById('remMesConsolPend'); return !b || getComputedStyle(b).display === 'none'; }));
// 10) textos «RK»
t('no quedan textos «RK» fijos en el asistente ni en el alta de cuentas', await J(() => !/\bRK\b/.test(document.getElementById('rk-agente-btn').title + document.getElementById('rk-agente-input').placeholder + document.getElementById('rk-agente-restore').title + (document.getElementById('cuentaAlias') || {}).placeholder)));
console.log('errores de JS:', errores.filter(x => !/gsi|Failed to load resource|tradingview/.test(x)).slice(0, 6));
console.log(`\n${ok} ok, ${fail} fallas`);
await b.close();
