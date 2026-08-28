// Service Worker — Parte de obra
// Vive dentro de /obra/, así que su alcance (scope) es sólo esta carpeta:
// no se pisa con el sw.js de la app principal, que cubre la raíz.
// Objetivo: que la planilla abra en la obra aunque no haya señal.
const CACHE = 'parte-obra-v4';
// La ruta base se deriva de dónde está servido este archivo (ej. /mi-app/obra/sw.js → /mi-app/obra/).
const BASE  = self.location.pathname.replace(/[^/]*$/, '');
const SHELL = [BASE, BASE + 'index.html', BASE + 'config.js', BASE + 'manifest.json',
               BASE + '../assets/mess-logo.svg'];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c){ return c.addAll(SHELL); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys()
      .then(function(keys){
        return Promise.all(keys.filter(function(k){ return k !== CACHE; })
                               .map(function(k){ return caches.delete(k); }));
      })
      .then(function(){ return self.clients.claim(); })
  );
});

// Red primero (así una versión nueva de la planilla se ve al recargar),
// caché sólo como respaldo cuando no hay señal.
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  // Firebase y sus scripts van siempre por red, sin pasar por la caché:
  // si no, una respuesta guardada rompería la sincronización.
  var u = e.request.url;
  if (u.indexOf('firebaseio.com') >= 0 || u.indexOf('firebasedatabase.app') >= 0 ||
      u.indexOf('gstatic.com') >= 0 || u.indexOf('googleapis.com') >= 0) return;
  var esHTML = e.request.mode === 'navigate' ||
               (e.request.headers.get('accept') || '').includes('text/html');
  // cache:'no-store' evita que la caché HTTP de GitHub Pages (max-age=600)
  // siga devolviendo el HTML viejo después de un deploy.
  var opts = esHTML ? { cache: 'no-store' } : undefined;
  e.respondWith(
    fetch(e.request, opts).then(function(resp){
      if (resp && resp.status === 200 && resp.type === 'basic') {
        var copia = resp.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copia); });
      }
      return resp;
    }).catch(function(){
      return caches.match(e.request).then(function(r){
        return r || caches.match(BASE + 'index.html');
      });
    })
  );
});
