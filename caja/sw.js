const CACHE = 'caja-diaria-v128';
const ASSETS = ['./', './index.html', './app.html', './manifest.json', './icon-192.png', './icon-512.png', './biletes.avif', './logo.svg'];

// El SDK de Firebase se precachea aparte. Desde que el candado exige la cuenta
// dueña para abrir la caja (no alcanza con los 4 dígitos), si estos scripts no
// cargan no hay forma de verificar la sesión y el dueño se queda afuera de sus
// propios datos. Con esto, una vez que entró online alguna vez, la verificación
// sigue andando sin internet: Firebase Auth guarda la sesión en el dispositivo
// y la restaura sin pegarle a la red, lo único que faltaba era el script.
// gstatic responde con Access-Control-Allow-Origin:* así que cache.add() (que
// pide en modo cors) puede guardarlos.
// Van con allSettled y APARTE del addAll de ASSETS a propósito: si gstatic está
// caído, la instalación del service worker tiene que seguir funcionando igual.
const EXTERNOS = [
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c =>
    c.addAll(ASSETS).then(() => Promise.allSettled(EXTERNOS.map(u => c.add(u))))
  ));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const isHTML = e.request.mode === 'navigate' || (e.request.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    // Red primero para el shell de la app: así los arreglos se ven apenas se recargue,
    // en vez de quedar pegado a lo último cacheado. cache:'no-store' evita que la
    // caché HTTP del navegador (GitHub Pages manda cache-control: max-age=600)
    // devuelva una copia vieja sin siquiera llegar a la red — sin esto, recargar
    // podía seguir mostrando la versión anterior hasta por 10 minutos después de
    // un deploy, aunque el fetch() ya "pedía red primero". Cache solo como
    // respaldo offline (ver más abajo, caches.match si falla la red).
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // ignoreVary: los scripts de Firebase vienen con `vary: Accept-Encoding`, así
  // que sin esto un Accept-Encoding distinto entre el cache.add() del install y
  // el <script src> de la página daría un fallo de match — justo el caso en que
  // hace falta el cacheado, sin conexión. Los assets propios no varían, para
  // ellos es indistinto.
  e.respondWith(
    caches.match(e.request, { ignoreVary: true }).then(cached => {
      const fetchPromise = fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
