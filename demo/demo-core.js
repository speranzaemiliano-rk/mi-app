/* ════════════════════════════════════════════════════════════════════════
   VERSIÓN DE PRUEBA (DEMO) — núcleo de aislamiento
   ────────────────────────────────────────────────────────────────────────
   Se carga SÓLO si la dirección trae ?demo (ver el portero de index.html,
   justo después de config.js). Convierte la app en una maqueta que se puede
   mostrar a cualquiera:

     · Firebase se reemplaza por una base EN MEMORIA, con datos de ejemplo
       (demo/demo-seed-*.js). Lo que se cargue vive sólo en esa pestaña y
       desaparece al recargar. No existe ningún camino hacia la base real:
       la configuración apunta a un dominio inválido y el SDK real nunca se
       inicializa.
     · localStorage / sessionStorage también son en memoria, así no se
       mezcla nada con la sesión real de quien lo abra en su propio navegador.
     · La red queda cerrada: fetch / XHR / sendBeacon / WebSocket sólo dejan
       pasar lecturas públicas (cotización del dólar, índices) y el propio
       sitio. El backend (ARCA, IA, mails, bancos), Gmail, Spotify y EmailJS
       reciben una respuesta «no disponible en la versión de prueba».

   ⚠️ Es el ÚNICO archivo que garantiza que la demo no toca datos reales.
   Cualquier cambio acá se prueba con demo-t*.mjs (ver CLAUDE.md, sección
   «Versión de prueba»).
   ════════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';
    if (window.__RK_DEMO) return;
    window.__RK_DEMO = true;

    var MSG_NO_DISP = 'Esta función no está disponible en la versión de prueba.';

    // ── 1) Almacenamiento en memoria ───────────────────────────────────────
    // Un Proxy para que también ande el acceso por propiedad (storage.clave) y
    // Object.keys(storage), igual que el Storage real.
    function memStorage() {
        var d = Object.create(null);
        var api = {
            getItem: function (k) { k = String(k); return (k in d) ? d[k] : null; },
            setItem: function (k, v) { d[String(k)] = String(v); },
            removeItem: function (k) { delete d[String(k)]; },
            clear: function () { d = Object.create(null); },
            key: function (i) { var ks = Object.keys(d); return i < ks.length ? ks[i] : null; }
        };
        return new Proxy(api, {
            get: function (t, p) {
                if (p === 'length') return Object.keys(d).length;
                if (typeof p === 'string' && p in api) return api[p];
                return (typeof p === 'string' && p in d) ? d[p] : undefined;
            },
            set: function (t, p, v) { if (typeof p === 'string') d[p] = String(v); return true; },
            deleteProperty: function (t, p) { delete d[p]; return true; },
            has: function (t, p) { return p in api || p in d; },
            ownKeys: function () { return Object.keys(d); },
            getOwnPropertyDescriptor: function (t, p) {
                return (p in d) ? { value: d[p], writable: true, enumerable: true, configurable: true } : undefined;
            }
        });
    }
    ['localStorage', 'sessionStorage'].forEach(function (nombre) {
        var mem = memStorage();
        try { Object.defineProperty(window, nombre, { configurable: true, get: function () { return mem; } }); }
        catch (e) { console.warn('[demo] no se pudo aislar ' + nombre + ':', e); }
    });

    // ── 1b) No instalable ──────────────────────────────────────────────
    // El manifest de la app (id y start_url = la raíz de la instalación real) haría que «Agregar a inicio» instalara la app REAL, no la demo.
    // Sin manifest el navegador no ofrece instalarla, y se marca descartado el cartel «Instalala como app» que sale en iPhone.
    try { var _mf = document.querySelector('link[rel="manifest"]'); if (_mf) _mf.parentNode.removeChild(_mf); } catch (e) {}
    try { window.localStorage.setItem('rk_pwa_install_dismiss', '1'); } catch (e) {}
    window.addEventListener('beforeinstallprompt', function (ev) { ev.preventDefault(); ev.stopImmediatePropagation(); }, true);

    // ── 2) Red cerrada ─────────────────────────────────────────────────────
    // Sólo lecturas públicas (GET) de estos orígenes, que dan vida al tablero
    // (dólar, inflación, riesgo país…) y no llevan credenciales de nadie.
    var LECTURAS_PUBLICAS = [
        /^https:\/\/dolarapi\.com\//,
        /^https:\/\/api\.argentinadatos\.com\//,
        /^https:\/\/apis\.datos\.gob\.ar\//,
        /^https:\/\/(geocoding-)?api\.open-meteo\.com\//,
        /^https:\/\/query1\.finance\.yahoo\.com\//,       // cotizaciones del tablero
        /^https:\/\/api\.rss2json\.com\//                   // titulares de noticias del tablero
    ];
    function permitido(url, metodo) {
        var u;
        try { u = new URL(url, location.href); } catch (e) { return false; }
        if (u.origin === location.origin) return true;                 // el propio sitio (logos, json estáticos)
        if (u.protocol === 'data:' || u.protocol === 'blob:') return true;
        if (String(metodo || 'GET').toUpperCase() !== 'GET') return false;
        return LECTURAS_PUBLICAS.some(function (rx) { return rx.test(u.href); });
    }
    window.__demoBloqueados = [];
    function bloqueado(url) { try { window.__demoBloqueados.push(String(url)); } catch (e) {} }

    var fetchReal = window.fetch ? window.fetch.bind(window) : null;
    window.fetch = function (input, init) {
        var url = (typeof input === 'string') ? input : (input && input.url) || String(input || '');
        var metodo = (init && init.method) || (input && input.method) || 'GET';
        if (fetchReal && permitido(url, metodo)) return fetchReal(input, init);
        bloqueado(url);
        // EmailJS: la app muestra el cuerpo de la respuesta tal cual («Error al enviar el mail: …»): va en texto plano, no en JSON.
        if (/emailjs\.com/.test(String(url))) return Promise.resolve(new Response(MSG_NO_DISP, { status: 503, headers: { 'Content-Type': 'text/plain' } }));
        return Promise.resolve(new Response(JSON.stringify({ ok: false, demo: true, error: MSG_NO_DISP }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }));
    };

    var xhrOpen = XMLHttpRequest.prototype.open, xhrSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (metodo, url) {
        this.__demoUrl = url; this.__demoMetodo = metodo;
        return xhrOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function () {
        if (!permitido(this.__demoUrl, this.__demoMetodo)) {
            bloqueado(this.__demoUrl);
            var self = this;
            setTimeout(function () {
                try { if (typeof self.onerror === 'function') self.onerror(new Event('error')); } catch (e) {}
                try { self.dispatchEvent(new Event('error')); } catch (e) {}
                try { self.dispatchEvent(new Event('loadend')); } catch (e) {}
            }, 0);
            return;
        }
        return xhrSend.apply(this, arguments);
    };
    try { navigator.sendBeacon = function (url) { bloqueado(url); return false; }; } catch (e) {}
    window.WebSocket = function (url) { bloqueado(url); throw new Error(MSG_NO_DISP); };
    window.EventSource = function (url) { bloqueado(url); throw new Error(MSG_NO_DISP); };
    // Google Identity Services (Gmail, Drive): abriría un consentimiento real de Google con la
    // aplicación del dueño. En la demo la librería «no existe».
    try { Object.defineProperty(window, 'google', { configurable: true, get: function () { return undefined; }, set: function () {} }); } catch (e) {}

    // ── 3) Configuración de la instalación ────────────────────────────────
    var cfg = window.APP_CONFIG = window.APP_CONFIG || {};
    cfg.firebaseConfig = {
        apiKey: 'demo', authDomain: 'mess-demo.invalid', databaseURL: 'https://mess-demo.firebaseio.invalid',
        projectId: 'mess-demo', storageBucket: 'mess-demo.invalid', messagingSenderId: '0', appId: 'demo'
    };
    cfg.adminEmail = 'demo@mess.app';
    cfg.backendUrl = 'https://backend-demo.invalid';
    cfg.msLogin = false; cfg.msTenant = ''; cfg.spotifyClientId = ''; cfg.emailjs = {};
    try { window.localStorage.setItem('rk_belvo_function_url', cfg.backendUrl); } catch (e) {}
    cfg.brand = Object.assign({}, cfg.brand || {}, { logoEmpresa: '' });   // sólo la marca del producto

    // ── 4) Base de datos en memoria con la API de Firebase Realtime Database ──
    var DB_URL = cfg.firebaseConfig.databaseURL;

    function clonar(v) { return (v === null || typeof v !== 'object') ? v : JSON.parse(JSON.stringify(v)); }

    // Mismas reglas que Firebase al guardar: undefined es error; null borra; los arreglos se guardan
    // como objetos con clave de índice; lo vacío no se guarda.
    function normalizar(v, ruta) {
        if (v === undefined) throw new Error('Reference.set failed: First argument contains undefined in property \'' + ruta + '\'');
        if (v === null) return null;
        var t = typeof v;
        if (t === 'function' || t === 'symbol') throw new Error('Reference.set failed: First argument contains a function in property \'' + ruta + '\'');
        if (t === 'number') { if (!isFinite(v)) throw new Error('Reference.set failed: First argument contains ' + v + ' in property \'' + ruta + '\''); return v; }
        if (t !== 'object') return v;
        if (v && v['.sv'] === 'timestamp') return Date.now();   // ServerValue.TIMESTAMP
        var out = {}, n = 0, k;
        if (Array.isArray(v)) {
            for (var i = 0; i < v.length; i++) { var x = normalizar(v[i], ruta + '/' + i); if (x !== null) { out[i] = x; n++; } }
        } else {
            for (k in v) { if (Object.prototype.hasOwnProperty.call(v, k)) { var y = normalizar(v[k], ruta + '/' + k); if (y !== null) { out[k] = y; n++; } } }
        }
        return n ? out : null;
    }
    // Al leer, un objeto cuyas claves son índices y más de la mitad están ocupadas vuelve como arreglo.
    function denorm(v) {
        if (v === null || typeof v !== 'object') return v;
        var keys = Object.keys(v), todosIdx = keys.length > 0, max = -1, i;
        for (i = 0; i < keys.length; i++) {
            if (!/^(0|[1-9]\d*)$/.test(keys[i])) { todosIdx = false; break; }
            if (+keys[i] > max) max = +keys[i];
        }
        if (todosIdx && keys.length > (max + 1) / 2) {
            var arr = [];
            for (i = 0; i <= max; i++) arr.push(v[i] === undefined ? null : denorm(v[i]));
            return arr;
        }
        var o = {};
        keys.forEach(function (k) { o[k] = denorm(v[k]); });
        return o;
    }
    function partes(p) { return String(p == null ? '' : p).split('/').filter(Boolean); }

    var raiz = {};
    var oyentes = [];          // { partes, consulta, cb, ultimo }
    var colaEventos = [], despachando = false;

    function leer(ps) {
        var n = raiz;
        for (var i = 0; i < ps.length; i++) {
            if (n === null || typeof n !== 'object') return null;
            n = n[ps[i]];
            if (n === undefined) return null;
        }
        return n;
    }
    function escribir(ps, valor) {
        if (!ps.length) { raiz = (valor === null) ? {} : valor; return; }
        var n = raiz, pila = [];
        for (var i = 0; i < ps.length - 1; i++) {
            if (n[ps[i]] === undefined || n[ps[i]] === null || typeof n[ps[i]] !== 'object') n[ps[i]] = {};
            pila.push([n, ps[i]]);
            n = n[ps[i]];
        }
        if (valor === null) delete n[ps[ps.length - 1]]; else n[ps[ps.length - 1]] = valor;
        // limpia padres que quedaron vacíos (Firebase no guarda nodos vacíos)
        for (var j = pila.length - 1; j >= 0; j--) {
            var hijo = pila[j][0][pila[j][1]];
            if (hijo && typeof hijo === 'object' && !Object.keys(hijo).length) delete pila[j][0][pila[j][1]]; else break;
        }
    }

    function instantanea(ps, valor) {
        var key = ps.length ? ps[ps.length - 1] : null;
        var snap = {
            key: key,
            val: function () { return denorm(clonar(valor)); },
            exportVal: function () { return denorm(clonar(valor)); },
            exists: function () { return valor !== null && valor !== undefined; },
            hasChildren: function () { return !!valor && typeof valor === 'object' && Object.keys(valor).length > 0; },
            numChildren: function () { return (valor && typeof valor === 'object') ? Object.keys(valor).length : 0; },
            child: function (p) { var sub = partes(p); var v = valor; sub.forEach(function (s) { v = (v && typeof v === 'object' && s in v) ? v[s] : null; }); return instantanea(ps.concat(sub), v === undefined ? null : v); },
            forEach: function (cb) {
                if (!valor || typeof valor !== 'object') return false;
                var ks = Object.keys(valor);
                for (var i = 0; i < ks.length; i++) { if (cb(instantanea(ps.concat([ks[i]]), valor[ks[i]])) === true) return true; }
                return false;
            }
        };
        return snap;
    }

    function valorDeConsulta(ps, consulta) {
        var v = leer(ps);
        if (!consulta || v === null || typeof v !== 'object') return v;
        var ks = Object.keys(v);
        if (consulta.hijo) {
            var c = consulta, conLimites = (c.desde !== undefined || c.hasta !== undefined || c.igual !== undefined);
            var val = function (k) { var x = v[k] && typeof v[k] === 'object' ? v[k][c.hijo] : undefined; return x === undefined ? null : x; };
            if (conLimites) ks = ks.filter(function (k) {
                var x = val(k);
                if (x === null) return false;
                if (c.desde !== undefined && !(typeof x === typeof c.desde && x >= c.desde)) return false;
                if (c.hasta !== undefined && !(typeof x === typeof c.hasta && x <= c.hasta)) return false;
                if (c.igual !== undefined && x !== c.igual) return false;
                return true;
            });
            ks.sort(function (a, b) {
                var x = val(a), y = val(b);
                if (x === null || y === null) return x === y ? (a < b ? -1 : 1) : (x === null ? -1 : 1);
                return x < y ? -1 : x > y ? 1 : (a < b ? -1 : 1);
            });
        }
        if (consulta.primeros != null) ks = ks.slice(0, consulta.primeros);
        if (consulta.ultimos != null) ks = ks.slice(Math.max(0, ks.length - consulta.ultimos));
        var out = {}; ks.forEach(function (k) { out[k] = v[k]; });
        return Object.keys(out).length ? out : null;
    }

    // Las primeras lecturas se entregan recién cuando la página terminó de cargar: con el SDK real hay una ida y vuelta al
    // servidor de por medio, y el código de la app da por hecho que todo su HTML ya existe cuando llegan los datos. Sin esto,
    // un oyente registrado mientras se leía el <head> recibía los datos antes de que existieran los modales de más abajo.
    function cuandoListo(fn) {
        var ir = function () { setTimeout(fn, 0); };
        if (document.readyState === 'complete') ir(); else window.addEventListener('load', ir);
    }

    function encolar(fn) {
        colaEventos.push(fn);
        if (despachando) return;
        despachando = true;
        try { while (colaEventos.length) { var f = colaEventos.shift(); try { f(); } catch (e) { console.error(e); } } }
        finally { despachando = false; }
    }
    // Una escritura avisa a todos los oyentes cuyo camino sea ascendiente, igual o descendiente del escrito,
    // y sólo si lo que ven cambió (Firebase no repite un 'value' idéntico).
    function avisar(psEscrito) {
        oyentes.slice().forEach(function (o) {
            var n = Math.min(o.partes.length, psEscrito.length), roza = true;
            for (var i = 0; i < n; i++) if (o.partes[i] !== psEscrito[i]) { roza = false; break; }
            if (!roza) return;
            var v = valorDeConsulta(o.partes, o.consulta), s = JSON.stringify(v === undefined ? null : v);
            if (s === o.ultimo) return;
            o.ultimo = s;
            encolar(function () { if (oyentes.indexOf(o) >= 0) o.cb(instantanea(o.partes, v === undefined ? null : clonar(v))); });
        });
    }

    function hacerConsulta(ps, consulta) {
        var q = {
            on: function (evento, cb) {
                if (evento !== 'value') throw new Error('[demo] sólo se soporta on(\'value\')');
                var o = { partes: ps, consulta: consulta, cb: cb, ultimo: undefined };
                oyentes.push(o);
                // la primera entrega es asíncrona, como la del SDK real (llega «del servidor»)
                cuandoListo(function () {
                    if (oyentes.indexOf(o) < 0 || o.ultimo !== undefined) return;   // ya lo recibió por una escritura
                    var v = valorDeConsulta(ps, consulta); o.ultimo = JSON.stringify(v === undefined ? null : v);
                    encolar(function () { if (oyentes.indexOf(o) >= 0) cb(instantanea(ps, v === undefined ? null : clonar(v))); });
                });
                return cb;
            },
            off: function (evento, cb) {
                oyentes = oyentes.filter(function (o) { return !(o.partes.join('/') === ps.join('/') && JSON.stringify(o.consulta || null) === JSON.stringify(consulta || null) && (!cb || o.cb === cb)); });
            },
            once: function (evento, cb) {
                var p = new Promise(function (res) {
                    cuandoListo(function () { var v = valorDeConsulta(ps, consulta); res(instantanea(ps, v === undefined ? null : clonar(v))); });
                });
                if (typeof cb === 'function') p.then(cb);
                return p;
            },
            orderByChild: function (k) { return hacerConsulta(ps, Object.assign({}, consulta, { hijo: k })); },
            startAt: function (v) { return hacerConsulta(ps, Object.assign({}, consulta, { desde: v })); },
            endAt: function (v) { return hacerConsulta(ps, Object.assign({}, consulta, { hasta: v })); },
            equalTo: function (v) { return hacerConsulta(ps, Object.assign({}, consulta, { igual: v })); },
            limitToFirst: function (n) { return hacerConsulta(ps, Object.assign({}, consulta, { primeros: n })); },
            limitToLast: function (n) { return hacerConsulta(ps, Object.assign({}, consulta, { ultimos: n })); },
            toString: function () { return DB_URL + (ps.length ? '/' + ps.join('/') : ''); }
        };
        return q;
    }

    var CARACTERES = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
    var ultimoPush = 0, ultimoAzar = [];
    function nuevaClave() {
        var ahora = Date.now(), repetido = (ahora === ultimoPush), ts = [], i;
        ultimoPush = ahora;
        for (i = 7; i >= 0; i--) { ts[i] = CARACTERES.charAt(ahora % 64); ahora = Math.floor(ahora / 64); }
        var id = ts.join('');
        if (!repetido) { for (i = 0; i < 12; i++) ultimoAzar[i] = Math.floor(Math.random() * 64); }
        else { for (i = 11; i >= 0 && ultimoAzar[i] === 63; i--) ultimoAzar[i] = 0; ultimoAzar[i]++; }
        for (i = 0; i < 12; i++) id += CARACTERES.charAt(ultimoAzar[i]);
        return id;
    }

    function hacerRef(ps) {
        var ref = hacerConsulta(ps, null);
        ref.key = ps.length ? ps[ps.length - 1] : null;
        ref.child = function (p) { return hacerRef(ps.concat(partes(p))); };
        ref.set = function (valor, cb) {
            return new Promise(function (res, rej) {
                try {
                    var v = normalizar(valor, '/' + ps.join('/'));
                    escribir(ps, v); avisar(ps);
                    if (typeof cb === 'function') cb(null);
                    res();
                } catch (e) { if (typeof cb === 'function') cb(e); rej(e); }
            });
        };
        ref.update = function (cambios, cb) {
            return new Promise(function (res, rej) {
                try {
                    var lista = [];
                    Object.keys(cambios || {}).forEach(function (k) {
                        var sub = ps.concat(partes(k));
                        lista.push([sub, normalizar(cambios[k], '/' + sub.join('/'))]);
                    });
                    lista.forEach(function (par) { escribir(par[0], par[1]); });
                    lista.forEach(function (par) { avisar(par[0]); });
                    if (typeof cb === 'function') cb(null);
                    res();
                } catch (e) { if (typeof cb === 'function') cb(e); rej(e); }
            });
        };
        ref.remove = function () { return ref.set(null); };
        ref.push = function (valor) {
            var hijo = hacerRef(ps.concat([nuevaClave()]));
            if (valor === undefined) return hijo;
            var p = hijo.set(valor);
            hijo.then = function (a, b) { return p.then(a, b); }; hijo.catch = function (b) { return p.catch(b); };
            return hijo;
        };
        ref.transaction = function (fn, cb) {
            return new Promise(function (res, rej) {
                try {
                    var actual = leer(ps), nuevo = fn(actual === null ? null : denorm(clonar(actual)));
                    if (nuevo === undefined) { var s0 = instantanea(ps, actual === null ? null : clonar(actual)); if (cb) cb(null, false, s0); res({ committed: false, snapshot: s0 }); return; }
                    var v = normalizar(nuevo, '/' + ps.join('/'));
                    escribir(ps, v); avisar(ps);
                    var s1 = instantanea(ps, v === null ? null : clonar(v));
                    if (cb) cb(null, true, s1);
                    res({ committed: true, snapshot: s1 });
                } catch (e) { if (cb) cb(e, false, null); rej(e); }
            });
        };
        ref.onDisconnect = function () { return { set: function () { return Promise.resolve(); }, remove: function () { return Promise.resolve(); }, cancel: function () { return Promise.resolve(); } }; };
        Object.defineProperty(ref, 'parent', { get: function () { return ps.length ? hacerRef(ps.slice(0, -1)) : null; } });
        Object.defineProperty(ref, 'root', { get: function () { return hacerRef([]); } });
        return ref;
    }

    var dbStub = {
        ref: function (p) {
            var ps = partes(p);
            if (ps[0] === '.info') return { once: function () { return Promise.resolve(instantanea(ps, true)); }, on: function (e, cb) { cuandoListo(function () { cb(instantanea(ps, true)); }); }, off: function () {} };
            return hacerRef(ps);
        },
        goOffline: function () {}, goOnline: function () {}
    };

    // Ayudas para escribir los datos de ejemplo. Las fechas son RELATIVAS a hoy (la demo siempre se ve «de esta semana»),
    // y los ids son fijos y legibles para que una semilla pueda apuntar a lo que sembró otra.
    window.DEMO = {
        EMP: 'emp_demo_1', PROY: 'proy_alamos',            // empresa y proyecto principales
        EMP2: 'emp_demo_2', PROY2: 'proy_plata',           // segunda empresa (inmobiliaria)
        base: 'empresas/emp_demo_1/proyectos/proy_alamos',
        base2: 'empresas/emp_demo_2/proyectos/proy_plata',
        TC: 1180,                                          // tipo de cambio del proyecto (ARS por USD)
        // cuentas bancarias del proyecto principal (las siembra demo-seed-ingresos.js; las usan los pagos y cobros con banco)
        CTA_GALICIA: 'cta_galicia_ars', CTA_SANTANDER: 'cta_santander_ars', CTA_GALICIA_USD: 'cta_galicia_usd',
        // 'YYYY-MM-DD' de hoy + n días (n negativo = pasado)
        dia: function (n) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + (n || 0)); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); },
        // 'YYYY-MM' del mes actual + n meses
        mes: function (n) { var d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + (n || 0)); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2); },
        // 'YYYY-MM-DD' del día `dia` del mes actual + n meses (para contratos y vencimientos)
        fecha: function (n, dia) { var d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + (n || 0)); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + (dia || 1)).slice(-2); },
        // asigna r[a][b][c] = valor creando los niveles que falten: DEMO.set(r, 'global/proveedores', {...})
        set: function (r, ruta, valor) {
            var ps = String(ruta).split('/').filter(Boolean), n = r;
            for (var i = 0; i < ps.length - 1; i++) { if (!n[ps[i]] || typeof n[ps[i]] !== 'object') n[ps[i]] = {}; n = n[ps[i]]; }
            n[ps[ps.length - 1]] = valor; return valor;
        },
        // lista de objetos con id -> objeto indexado por id (la forma en que la app guarda sus colecciones)
        porId: function (lista) { var o = {}; (lista || []).forEach(function (x) { o[x.id] = x; }); return o; }
    };

    // Carga inicial: cada módulo de datos (demo-seed-*.js) aporta con window.DEMO_SEEDS.push(function(raiz){...}).
    window.DEMO_SEEDS = window.DEMO_SEEDS || [];
    function sembrar() {
        raiz = {};
        window.DEMO_SEEDS.forEach(function (fn) {
            var parcial = {};
            try { fn(parcial); } catch (e) { console.error('[demo] falló una semilla:', e); return; }
            // mezcla en profundidad: dos semillas pueden aportar al mismo nodo (p. ej. usuarios/)
            (function mezclar(dest, src) {
                Object.keys(src).forEach(function (k) {
                    if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k]) && dest[k] && typeof dest[k] === 'object') mezclar(dest[k], src[k]);
                    else dest[k] = src[k];
                });
            })(raiz, normalizar(parcial, '') || {});
        });
    }
    window.__demoDB = {
        sembrar: sembrar,
        leer: function (p) { return denorm(clonar(leer(partes(p)))); },
        escribir: function (p, v) { var ps = partes(p); escribir(ps, normalizar(v, '/' + ps.join('/'))); avisar(ps); }
    };

    // ── 5) Autenticación simulada: siempre «adentro» como el usuario de la demo ──
    var USUARIO = {
        uid: 'demo-user', email: 'demo@mess.app', displayName: 'Usuario de prueba', emailVerified: true, isAnonymous: false,
        providerData: [], photoURL: null,
        getIdToken: function () { return Promise.resolve('demo-token'); },
        reload: function () { return Promise.resolve(); },
        updateProfile: function () { return Promise.resolve(); }
    };
    window.__demoUsuario = USUARIO;
    var authObservadores = [];
    function noDisponible() { var e = new Error(MSG_NO_DISP); e.code = 'auth/operation-not-allowed'; return Promise.reject(e); }
    var authStub = {
        currentUser: USUARIO,
        onAuthStateChanged: function (cb) {
            authObservadores.push(cb);
            var entregar = function () { setTimeout(function () { cb(authStub.currentUser); }, 30); };
            if (document.readyState === 'complete') entregar(); else window.addEventListener('load', entregar);
            return function () { authObservadores = authObservadores.filter(function (x) { return x !== cb; }); };
        },
        getRedirectResult: function () { return Promise.resolve({ user: null }); },
        setPersistence: function () { return Promise.resolve(); },
        // «Salir» en la demo = volver a empezar con los datos de ejemplo
        signOut: function () { try { location.href = location.pathname + '?demo=1'; } catch (e) {} return Promise.resolve(); },
        signInWithEmailAndPassword: noDisponible, createUserWithEmailAndPassword: noDisponible, signInWithPopup: noDisponible,
        signInWithRedirect: noDisponible, signInWithCredential: noDisponible, sendPasswordResetEmail: noDisponible,
        fetchSignInMethodsForEmail: function () { return Promise.resolve([]); }
    };
    function Proveedor(id) { this.providerId = id; this.addScope = function () { return this; }; this.setCustomParameters = function () { return this; }; }
    var authFn = function () { return authStub; };
    authFn.GoogleAuthProvider = function () { return new Proveedor('google.com'); };
    authFn.OAuthProvider = function (id) { return new Proveedor(id); };
    authFn.EmailAuthProvider = { credential: function () { return {}; } };
    authFn.Auth = { Persistence: { LOCAL: 'local', SESSION: 'session', NONE: 'none' } };

    var dbFn = function () { return dbStub; };
    dbFn.ServerValue = { TIMESTAMP: { '.sv': 'timestamp' } };

    // El SDK real puede haberse cargado: se lo reemplaza entero, así nada puede inicializarlo.
    window.firebase = {
        apps: [], SDK_VERSION: 'demo',
        initializeApp: function (c) { var app = { name: '[DEFAULT]', options: c }; this.apps.push(app); return app; },
        app: function () { return { name: '[DEFAULT]', options: cfg.firebaseConfig }; },
        auth: authFn, database: dbFn
    };

    // ── 6) Cartel «versión de prueba» + reinicio ─────────────────────────
    function ponerCartel() {
        if (document.getElementById('demoCartel')) return;
        var st = document.createElement('style');
        st.textContent =
            '#demoCartel{position:fixed;left:12px;bottom:12px;z-index:2147483000;display:flex;align-items:center;gap:8px;' +
            'background:#1D1D1F;color:#fff;border-radius:999px;padding:7px 8px 7px 12px;font:600 12px/1.2 "Space Grotesk",system-ui,sans-serif;' +
            'box-shadow:0 6px 22px rgba(0,0,0,.35);max-width:calc(100vw - 24px);}' +
            '#demoCartel .dc-txt{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
            '#demoCartel .dc-sub{font-weight:400;color:#c9c9d1;}' +
            '#demoCartel button{background:#7C5CFF;color:#fff;border:0;border-radius:999px;padding:5px 11px;font:600 12px "Space Grotesk",system-ui,sans-serif;cursor:pointer;flex-shrink:0;}' +
            '#demoCartel .dc-x{background:transparent;color:#c9c9d1;padding:2px 6px;}' +
            '@media (min-width:769px){#demoCartel{left:268px;}}' +   // al costado del menú lateral, que en escritorio ocupa el borde izquierdo
            '@media (max-width:768px){#demoCartel{bottom:74px;left:8px;font-size:11px;}#demoCartel .dc-sub{display:none;}}' +
            '@media print{#demoCartel{display:none!important;}}';
        document.head.appendChild(st);
        var c = document.createElement('div');
        c.id = 'demoCartel';
        c.innerHTML = '<span class="dc-txt">🧪 Versión de prueba <span class="dc-sub">· datos de ejemplo, nada se guarda</span></span>' +
            '<button type="button" id="demoReiniciar" title="Vuelve a los datos de ejemplo originales">↺ Reiniciar</button>' +
            '<button type="button" class="dc-x" id="demoCerrarCartel" title="Ocultar este cartel">✕</button>';
        document.body.appendChild(c);
        document.getElementById('demoReiniciar').onclick = function () { if (confirm('¿Volver a los datos de ejemplo originales? Se pierde lo que cargaste en esta prueba.')) location.href = location.pathname + '?demo=1'; };
        document.getElementById('demoCerrarCartel').onclick = function () { c.remove(); };
    }
    if (document.body) ponerCartel(); else document.addEventListener('DOMContentLoaded', ponerCartel);
    window.__demoPonerCartel = ponerCartel;

    // ── 7) Archivos de datos de ejemplo + arranque ──────────────────────
    // Se cargan en el mismo orden que están acá; la base se siembra recién cuando están todos.
    ['demo-seed-base', 'demo-seed-egresos', 'demo-seed-ingresos', 'demo-seed-alquileres', 'demo-seed-obra', 'demo-post'].forEach(function (f) { document.write('<script src="demo/' + f + '.js"><\/script>'); });
    document.write('<script>__demoDB.sembrar();<\/script>');
})();
