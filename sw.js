// Service Worker — RK Gestión PWA
const CACHE = 'rk-v170';
const BASE  = '/mi-app/';

// Archivos que se cachean al instalar (shell de la app)
const SHELL = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'icons/icon-192.png',
  BASE + 'icons/icon-512.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) { return c.addAll(SHELL); })
  );
  // NO llamamos skipWaiting() acá: el SW nuevo queda "en espera" para no recargar
  // la app en medio del uso. Se activa recién cuando el usuario toca "Actualizar"
  // (la página le manda el mensaje SKIP_WAITING).
});

// La página avisa cuando el usuario aceptó actualizar → activamos el SW nuevo.
self.addEventListener('message', function(e) {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

// Network-first para index.html (siempre la última versión), cache-first para el resto
self.addEventListener('fetch', function(e) {
  var url = e.request.url;
  // Peticiones a Firebase, Railway y fuentes externas: siempre red, sin cache
  if (url.includes('firebaseio.com') || url.includes('firebase') ||
      url.includes('railway.app') || url.includes('googleapis.com') ||
      url.includes('gstatic.com') || url.includes('emailjs.com')) {
    return;
  }
  e.respondWith(
    fetch(e.request).then(function(resp) {
      // Actualizar cache con respuesta fresca
      var copy = resp.clone();
      caches.open(CACHE).then(function(c) { c.put(e.request, copy); });
      return resp;
    }).catch(function() {
      // Sin red: servir desde cache
      return caches.match(e.request).then(function(r) { return r || caches.match(BASE + 'index.html'); });
    })
  );
});
