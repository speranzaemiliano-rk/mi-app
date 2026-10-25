/* Versión de prueba — ajustes que van DESPUÉS de que la app terminó de cargar (los pisan funciones que la app define sola).
   Se aplican en el evento load, antes de que llegue el primer estado de sesión (ver demo-core.js, authStub). */
window.addEventListener('load', function () {
    var NO_DISP = 'Esta función no está disponible en la versión de prueba.';
    var aviso = function (que) { return function () { alert((que ? que + ': ' : '') + NO_DISP); }; };

    // La app borra usuarios/<uid>/modulos al ingresar (REF_USUARIOS.child(uid).set({email, ultimoAcceso})), así que en la demo el
    // módulo habilitado no puede salir de la base: se fija acá. Un solo módulo = se entra derecho al Sistema.
    window._modulosDeUsuario = function () { return Promise.resolve(['sistema']); };

    // La pantalla «¿Con qué empresa y proyecto trabajamos hoy?» arranca con la empresa y el proyecto principales ya elegidos.
    window._obPendingEmpId = 'emp_demo_1';
    window._obPendingProyId = 'proy_alamos';

    var _st = document.createElement('style'); _st.textContent = '.demo-oculto{display:none !important;}'; document.head.appendChild(_st);
    // Config: se esconden los bloques que son de la instalación y no del producto (claves de IA, dirección y token del backend, EmailJS,
    // respaldo, lectura de Gmail, ingreso con Microsoft…). En la demo no harían nada y mostrarían cómo está armada la infraestructura.
    try {
        var card = document.querySelector('#panelConfig .table-card');
        var cont = card && [].slice.call(card.children).filter(function (c) { return !c.classList.contains('table-card-head') && c.children.length > 5; })[0];
        var OCULTAR = [/^\s*🤖\s*API Key de Anthropic/, /^\s*🔗\s*URL del backend/, /^\s*🔒\s*Clave para eliminar/, /^\s*🔐\s*Clave para entrar/, /^\s*🤖\s*Asistente\b/,
            /^\s*⚡\s*Velocidad de carga/, /^\s*🤖\s*API Key de Google Gemini/, /^\s*🔴\s*API Key de YouTube/, /^\s*🧠\s*Cerebro/, /^\s*🔒\s*Token del backend/,
            /^\s*🗑️\s*Borrar API Key/, /^\s*📧\s*EmailJS/, /^\s*💾\s*Respaldo/, /^\s*📥\s*Lectura automática de Gmail/, /^\s*🔐\s*Ingreso con Microsoft/, /^\s*📧\s*Cuenta de Gmail/];
        if (cont) [].slice.call(cont.children).forEach(function (blk) {
            var txt = (blk.textContent || '').replace(/\s+/g, ' ');
            if (OCULTAR.some(function (rx) { return rx.test(txt); })) blk.classList.add('demo-oculto');   // !important: la app prende y apaga algunos de estos bloques según el rol
        });
    } catch (e) { console.warn('[demo] no se pudo ordenar Config:', e); }

    // Asistente: en la demo no hay IA conectada (usaría la clave del dueño). Contesta siempre lo mismo, con el mismo aspecto de la app,
    // en vez de «Error al conectar con Gemini».
    window.rkAgenteEnviar = function () {
        var input = document.getElementById('rk-agente-input'), cont = document.getElementById('rk-agente-mensajes');
        var texto = input && (input.value || '').trim();
        if (!texto || !cont) return;
        input.value = ''; input.style.height = 'auto';
        var u = document.createElement('div'); u.className = 'rk-msg rk-msg-user'; u.textContent = texto; cont.appendChild(u);
        var b = document.createElement('div'); b.className = 'rk-msg rk-msg-bot';
        b.textContent = '👋 En la versión de prueba el asistente no está conectado. En la versión real le podés preguntar por tus facturas, proveedores, saldos y vencimientos, pedirle que cargue un proveedor o que te redacte un mail, y leer un PDF por vos.';
        cont.appendChild(b); cont.scrollTop = cont.scrollHeight;
    };

    // «Saldo total» del Inicio = nodo `caja` + saldos de apertura de los bancos. En la instalación real alguien mantiene `caja`; en la demo
    // sale siempre de la Caja General (así coincide con lo que se ve ahí aunque pase el tiempo o se carguen movimientos nuevos).
    if (typeof window._hKPIs === 'function') {
        var _kpisOriginal = window._hKPIs, _kpisTimer = null, _kpisRecalculando = false;
        var _calcularCaja = function () {
            try { renderCajaGeneral(); if (window._cgSaldos) caja = { ars: window._cgSaldos.ars, usd: window._cgSaldos.usd }; }
            catch (e) { console.warn('[demo] no se pudo calcular la caja:', e); }
        };
        window._hKPIs = function () {
            if (_kpisRecalculando) return _kpisOriginal.apply(this, arguments);
            _calcularCaja();
            // La app llama a _hKPIs cada vez que llega una colección: las primeras veces la Caja General todavía no tiene todo (movimientos,
            // pagos, documentos…). Una pasada final, cuando dejaron de llegar datos, deja el número definitivo.
            clearTimeout(_kpisTimer);
            _kpisTimer = setTimeout(function () {
                _kpisRecalculando = true;
                try { _calcularCaja(); _kpisOriginal(); } finally { _kpisRecalculando = false; }
            }, 1500);
            return _kpisOriginal.apply(this, arguments);
        };
    }

    // Actualización de sueldos pide crear una clave la primera vez: en la demo entra directo (la clave es una traba de pantalla, no seguridad).
    if (typeof window._actMostrarBloqueo === 'function') {
        window._actMostrarBloqueo = function () { window._actDesbloqueado = true; if (typeof _actPintar === 'function') _actPintar(); };
    }

    // Música (YouTube, radio, Spotify): no aporta a la demo, y «Conectar con Spotify» navega la pestaña a accounts.spotify.com con el client_id
    // del dueño y la devuelve a la raíz de la app REAL (sin ?demo): el visitante saldría de la demo en plena presentación. Se esconde el widget.
    var _stOculto = document.createElement('style');
    _stOculto.textContent = '[id^="rk-music"]{display:none !important;}' +
        '@media (max-width:768px){html,body{overflow-x:hidden;}}';   // la barra superior (tipo de cambio) desborda en celular
    document.head.appendChild(_stOculto);
    if (typeof window.rkSpotifyConnect === 'function') window.rkSpotifyConnect = aviso('Spotify');

    // Mails (EmailJS): enviar una factura o un recordatorio avisa en vez de mostrar un error técnico.
    if (window.emailjs) window.emailjs.send = function () { return Promise.reject({ status: 0, text: NO_DISP }); };

    // Lectura con IA (facturas, presupuestos, vencimientos, notas de crédito): sin backend no hay IA. Se avisa de entrada, en vez de dejar
    // 12 segundos de «Reintentando con gemini-2.5-flash…» y terminar en «Gemini está saturado».
    var avisoIA = function () { alert('Leer con IA: ' + NO_DISP + '\n\nEn la versión real subís el PDF o la foto y el sistema completa los datos solo.'); };
    ['abrirLeerPresup', 'abrirLeerFacturaPDF', 'procesarVencimientoPDF', '_ncLeerPDF'].forEach(function (n) {
        if (typeof window[n] === 'function') window[n] = avisoIA;
    });
    var _sinIA = function () { return Promise.resolve(new Response(JSON.stringify({ error: { message: NO_DISP } }), { status: 403, headers: { 'Content-Type': 'application/json' } })); };
    if (typeof window._geminiProxy === 'function') window._geminiProxy = _sinIA;
    if (typeof window._groqProxy === 'function') window._groqProxy = _sinIA;
    if (typeof window.geminiEsErrorAuth === 'function') {
        var _esAuthOrig = window.geminiEsErrorAuth;
        window.geminiEsErrorAuth = function (m) { return /versión de prueba/.test(m || '') || _esAuthOrig(m); };   // corta los reintentos con otros modelos
    }

    // Funciones que dependen de cuentas de Google reales (consentimiento OAuth con la aplicación del dueño).
    ['abrirImportarGmail', 'impExtLeerGmail', 'impExtLeerGmailTarjeta'].forEach(function (n) {
        if (typeof window[n] === 'function') window[n] = aviso('Importar desde Gmail');
    });
    // …y las que mandan mails por EmailJS.
    if (typeof window.enviarRecordatorioTarea === 'function') window.enviarRecordatorioTarea = aviso('Enviar recordatorio por mail');
});
