// Aislamiento de la versión de prueba: nada sale a la red, nada toca el almacenamiento real, nada persiste.
import { abrirDemo, entrarAlSistema, irA } from './demo-lib.mjs';
let ok = 0, fail = 0; const t = (n, c, x) => { if (c) { ok++; console.log('✓', n); } else { fail++; console.log('✗', n, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } };
const { b, p, red, errores } = await abrirDemo();
await entrarAlSistema(p);
const J = (f, a) => p.evaluate(f, a);

// 1) Firebase real fuera de juego
const fb = await J(() => ({ v: firebase.SDK_VERSION, apps: firebase.apps.length, db: firebase.database().ref('x').toString(), cfg: firebaseConfig.databaseURL }));
t('el «Firebase» es el simulado y apunta a un dominio inválido', fb.v === 'demo' && /\.invalid/.test(fb.cfg) && /\.invalid/.test(fb.db), fb);

// 2) la red: lo que intenta salir y NO es lectura pública, vuelve «no disponible»
const intentos = await J(async () => {
  const out = {};
  const pr = async (k, f) => { try { const r = await f(); const txt = await r.clone().text(); out[k] = { s: r.status, j: await r.json().catch(() => null), txt }; } catch (e) { out[k] = { err: String(e) }; } };
  await pr('backend', () => fetch('https://mi-app-production-e1cd.up.railway.app/diag'));
  await pr('arca', () => fetch('https://mi-app-production-e1cd.up.railway.app/afip', { method: 'POST', body: '{}' }));
  await pr('firebaseReal', () => fetch('https://modo-prueba-bb8c2-default-rtdb.firebaseio.com/empresas.json?shallow=true'));
  await pr('gmail', () => fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages'));
  await pr('emailjs', () => fetch('https://api.emailjs.com/api/v1.0/email/send', { method: 'POST', body: '{}' }));
  await pr('spotify', () => fetch('https://accounts.spotify.com/api/token', { method: 'POST' }));
  await pr('postAunqueSeaPublico', () => fetch('https://dolarapi.com/v1/dolares/blue', { method: 'POST' }));
  const xhr = await new Promise(res => { const x = new XMLHttpRequest(); x.open('POST', 'https://api.emailjs.com/api/v1.0/email/send'); x.onerror = () => res('error'); x.onload = () => res('load'); x.send('{}'); });
  out.xhr = xhr;
  out.beacon = navigator.sendBeacon('https://example.com/x', 'x');
  try { new WebSocket('wss://modo-prueba-bb8c2-default-rtdb.firebaseio.com/.ws'); out.ws = 'abrió'; } catch (e) { out.ws = 'bloqueado'; }
  out.bk = await (async () => { try { const j = await _fetchBackend('/afip/importar?ptoVta=1'); return j; } catch (e) { return String(e); } })();
  return out;
});
for (const k of ['backend', 'arca', 'firebaseReal', 'gmail', 'spotify', 'postAunqueSeaPublico'])
  t('fetch ' + k + ' → 503 «no disponible en la versión de prueba»', intentos[k].s === 503 && intentos[k].j && intentos[k].j.demo === true && /no está disponible/.test(intentos[k].j.error), intentos[k]);
// EmailJS: el cuerpo va en texto plano porque la app muestra err.text tal cual
t('fetch emailjs → 503 con el aviso en texto plano', intentos.emailjs.s === 503 && /no está disponible en la versión de prueba/.test(intentos.emailjs.txt) && !/^\{/.test(intentos.emailjs.txt), intentos.emailjs);
t('XHR a EmailJS falla (onerror)', intentos.xhr === 'error', intentos.xhr);
t('sendBeacon devuelve false', intentos.beacon === false);
t('WebSocket no se abre', intentos.ws === 'bloqueado', intentos.ws);
t('_fetchBackend (el camino que usan ARCA, IA, mails, usuarios) devuelve el aviso y no sale', intentos.bk && intentos.bk.demo === true, intentos.bk);
const bloq = await J(() => window.__demoBloqueados);
t('todos esos intentos quedaron anotados como bloqueados', ['railway.app', 'firebaseio.com', 'gmail.googleapis.com', 'emailjs.com', 'spotify.com'].every(h => bloq.some(u => u.includes(h))), bloq.slice(0, 20));
const salioAlMundo = red.filter(u => !/dolarapi|argentinadatos|open-meteo|tradingview|accounts\.google\.com\/gsi|yahoo|rss2json|datos\.gob\.ar/.test(u));
t('NADA salió a la red fuera de las lecturas públicas permitidas y librerías estáticas', salioAlMundo.length === 0, salioAlMundo);
t('ningún pedido a firebaseio.com / railway.app llegó a la red real', !red.some(u => /firebaseio\.com|railway\.app|identitytoolkit|securetoken/.test(u)), red.filter(u => /firebaseio|railway/.test(u)));

// 3) almacenamiento: el de la demo es en memoria; el real (el de un iframe del mismo sitio) no se toca
await p.evaluate(() => { try { Storage.prototype.setItem.call(window.__realLS = (function () { const f = document.createElement('iframe'); f.src = '/manifest.json'; document.body.appendChild(f); return f; })(), 'x', 'y'); } catch (e) {} });
const alm = await J(async () => {
  const f = document.createElement('iframe'); f.src = '/manifest.json'; document.body.appendChild(f);
  await new Promise(r => { f.onload = r; setTimeout(r, 1500); });
  const real = f.contentWindow.localStorage, realS = f.contentWindow.sessionStorage;
  const antes = real.length;
  localStorage.setItem('rk_prueba_demo', '1'); sessionStorage.setItem('rk_prueba_demo_s', '1');
  localStorage.setItem('rk_brand', '{"nombre":"X"}');
  const out = { memLS: localStorage.getItem('rk_prueba_demo'), realLS: real.getItem('rk_prueba_demo'), realLSlen: real.length - antes, realSS: realS.getItem('rk_prueba_demo_s'), keysReal: Object.keys(real) };
  f.remove(); return out;
});
t('localStorage de la demo funciona en memoria', alm.memLS === '1', alm);
t('el localStorage REAL no recibe nada (ni la marca ni las claves de la app)', alm.realLS === null && alm.realLSlen === 0 && alm.realSS === null && alm.keysReal.length === 0, alm);

// 4) nada persiste: lo que se carga se pierde al reiniciar
await J(() => __demoDB.escribir('global/proveedores/prov_prueba_nueva', { id: 'prov_prueba_nueva', razonSocial: 'PRUEBA SA' }));
t('una escritura queda en la base en memoria', await J(() => !!__demoDB.leer('global/proveedores/prov_prueba_nueva')));
await p.goto('http://localhost:8099/?demo=1', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1500);
t('al recargar, la base vuelve a los datos de ejemplo (la escritura desapareció)', await J(() => __demoDB.leer('global/proveedores/prov_prueba_nueva') === null));

// 5) el cartel y el reinicio
await entrarAlSistema(p);
t('hay cartel de «Versión de prueba» con botón Reiniciar', await J(() => !!document.querySelector('#demoCartel #demoReiniciar') && /Versión de prueba/.test(document.getElementById('demoCartel').textContent)));
t('el service worker no se registra en la demo', await J(async () => (await navigator.serviceWorker.getRegistrations()).length === 0));

// 6) «Salir» reinicia la demo, no deja una pantalla de login muerta
const antesURL = await J(() => location.href);
await p.evaluate(() => { try { auth.signOut(); } catch (e) {} }); await p.waitForTimeout(1500);
t('«Salir» vuelve a la demo desde cero (sin pantalla de ingreso)', await J(() => document.getElementById('authOverlay').classList.contains('app-hidden') && /\?demo=1/.test(location.href)), await J(() => location.href));

// 7) sin ?demo la app es la de siempre: nada de la demo se carga
const r2 = await abrirDemo({ search: '' });
await r2.p.waitForTimeout(1500);
t('sin ?demo no existe __RK_DEMO ni se pidió demo/', await r2.p.evaluate(() => !window.__RK_DEMO && !window.DEMO && !document.getElementById('demoCartel')));
t('...y el firebase del arnés sin demo sigue siendo el real (SDK vacío del CDN stubeado: no es el simulado)', await r2.p.evaluate(() => !window.firebase || window.firebase.SDK_VERSION !== 'demo'));
await r2.b.close();

console.log('errores de JS:', errores.filter(e => !/gsi|Failed to load resource/.test(e)).slice(0, 8));
console.log(`\n${ok} ok, ${fail} fallas`);
await b.close();
