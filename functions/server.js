const express = require('express');
const cors    = require('cors');
const Afip    = require('@afipsdk/afip.js');

const app  = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Variables de entorno:
//   AFIP_CUIT   → tu CUIT sin guiones
//   AFIP_CERT   → contenido del archivo .crt (con \n reales)
//   AFIP_KEY    → contenido del archivo .key (con \n reales)
//   AFIP_ENV    → "production" o "testing" (default: testing)
//   PORT        → puerto (Railway/Render lo inyectan automático)

// Lee un PEM de una env var. Acepta 3 formatos:
//  1) PEM con saltos de línea reales
//  2) PEM con \n literales (Railway/Firebase a veces los guarda así)
//  3) base64 del archivo completo (lo más robusto, sin problemas de saltos)
function leerPem(valor) {
    if (!valor) return '';
    var v = valor.trim();
    if (v.indexOf('-----BEGIN') !== -1) {
        return v.replace(/\\n/g, '\n');
    }
    try {
        return Buffer.from(v, 'base64').toString('utf8');
    } catch (_) {
        return v;
    }
}

// Crea la instancia de Afip con las credenciales de entorno. Lanza si faltan.
function crearAfip() {
    const cuit = process.env.AFIP_CUIT;
    const cert = leerPem(process.env.AFIP_CERT);
    const key  = leerPem(process.env.AFIP_KEY);
    const env  = process.env.AFIP_ENV || 'testing';
    const token = process.env.AFIP_ACCESS_TOKEN || '';
    if (!cuit || !cert || !key) {
        const err = new Error('Faltan credenciales. Configurá AFIP_CUIT, AFIP_CERT y AFIP_KEY.');
        err.faltanCreds = true;
        throw err;
    }
    const afipOpts = { CUIT: cuit, cert, key, production: env === 'production' };
    if (token) afipOpts.access_token = token;
    return new Afip(afipOpts);
}

function detalleError(e) {
    var detalle = '';
    var fuente = e.data || (e.response && e.response.data);
    if (fuente) {
        detalle = typeof fuente === 'string' ? fuente : JSON.stringify(fuente);
    }
    if (e.status) detalle = '[HTTP ' + e.status + '] ' + detalle;
    return detalle;
}

app.get('/', (req, res) => res.json({ status: 'ok', service: 'RK AFIP Backend' }));

// Importa todos los comprobantes emitidos.
// Si se pasan ptoVta y tipoComp como query params, filtra por ellos.
// Sin parámetros: trae TODOS los puntos de venta activos y todos los tipos habituales.
// GET /afip/importar
// GET /afip/importar?ptoVta=3&tipoComp=1
const TIPOS_COMP_HABITUALES = [1, 2, 3, 6, 7, 8, 11, 12, 13]; // FA, NDA, NCA, FB, NDB, NCB, FC, NDC, NCC

async function importarComprobantes(afip, ptoVta, tipoComp) {
    const lista = [];
    const ultimo = await afip.ElectronicBilling.getLastVoucher(ptoVta, tipoComp);
    if (!ultimo) return lista;
    for (let nro = 1; nro <= ultimo; nro++) {
        try {
            const v = await afip.ElectronicBilling.getVoucherInfo(nro, ptoVta, tipoComp);
            if (v && v.CodAutorizacion) {
                lista.push({
                    tipoComp, ptoVta, nro,
                    fecha:     String(v.CbteFch || ''),
                    moneda:    v.MonId || 'PES',
                    cuitRecep: String(v.DocNro || ''),
                    condIva:   v.CondicionIVAReceptorId || 5,
                    razon: '', dom: '',
                    impNeto:  v.ImpNeto  || 0,
                    impIVA:   v.ImpIVA   || 0,
                    impTotal: v.ImpTotal || 0,
                    descripcion: '',
                    cae:    v.CodAutorizacion,
                    caeVto: v.FchVto || '',
                    emitidaEn: 0,
                    importada: true
                });
            }
        } catch (_) { /* comprobante sin info, saltar */ }
    }
    return lista;
}

app.get('/afip/importar', async (req, res) => {
    try {
        const afip = crearAfip();
        const ptoVtaParam  = parseInt(req.query.ptoVta)  || 0;
        const tipoCompParam = parseInt(req.query.tipoComp) || 0;

        // Si se especificó punto de venta y tipo, importar solo eso
        if (ptoVtaParam && tipoCompParam) {
            const lista = await importarComprobantes(afip, ptoVtaParam, tipoCompParam);
            return res.json(lista);
        }

        // Sin parámetros: traer todos los puntos de venta activos
        const puntosDeVenta = await afip.ElectronicBilling.getSalesPoints();
        const ptosActivos = (puntosDeVenta || [])
            .filter(p => p.Bloqueado === 'N' && p.FchBaja === 'NULL')
            .map(p => p.Nro);

        if (!ptosActivos.length) return res.json([]);

        const tipos = tipoCompParam ? [tipoCompParam] : TIPOS_COMP_HABITUALES;
        const lista = [];
        for (const pto of ptosActivos) {
            for (const tipo of tipos) {
                try {
                    const parcial = await importarComprobantes(afip, pto, tipo);
                    lista.push(...parcial);
                } catch (_) { /* tipo sin comprobantes, ignorar */ }
            }
        }
        return res.json(lista);
    } catch (e) {
        return res.status(500).json({ error: e.message, detalle: detalleError(e) });
    }
});

// ──────────────────────────────────────────────────────────────────────
// COMPROBANTES RECIBIDOS — automatización "mis-comprobantes" de AFIP SDK
// ──────────────────────────────────────────────────────────────────────
// A diferencia de los emitidos (web service con certificado), los recibidos
// se obtienen automatizando el portal "Mis Comprobantes" de ARCA. Eso requiere:
//   AFIP_SDK_TOKEN   → access token de tu cuenta AFIP SDK (o reutiliza AFIP_ACCESS_TOKEN)
//   ARCA_USER        → usuario de clave fiscal (default: AFIP_CUIT)
//   ARCA_PASS        → contraseña de clave fiscal
// La automatización es asíncrona: se crea con POST y se consulta con GET hasta
// que deja de estar "in_process".
const AFIPSDK_BASE = 'https://app.afipsdk.com/api/v1';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function fechaDMY(iso) {
    // 'YYYY-MM-DD' → 'DD/MM/YYYY'
    if (!iso) return '';
    const p = String(iso).split('-');
    return p.length === 3 ? (p[2] + '/' + p[1] + '/' + p[0]) : iso;
}

// Ejecuta la automatización "mis-comprobantes" para un tipo ('R' recibidos /
// 'E' emitidos) y un rango de fechas. Devuelve el array crudo de comprobantes.
// Lanza un Error con .httpStatus y .faltanCreds según corresponda.
async function misComprobantes(tipo, desde, hasta) {
    const token = process.env.AFIP_SDK_TOKEN || process.env.AFIP_ACCESS_TOKEN || '';
    const cuit  = process.env.AFIP_CUIT || '';
    const user  = process.env.ARCA_USER || cuit;
    const pass  = process.env.ARCA_PASS || '';
    if (!token || !cuit || !pass) {
        const err = new Error('Configurá en Railway: AFIP_SDK_TOKEN (o AFIP_ACCESS_TOKEN), ARCA_USER (o se usa AFIP_CUIT) y ARCA_PASS (contraseña de clave fiscal).');
        err.httpStatus = 400; err.faltanCreds = true;
        throw err;
    }

    // fechaEmision es obligatorio para el SDK — si no viene, usar el último mes
    if (!desde && !hasta) {
        const hoy = new Date();
        const hace30 = new Date(hoy); hace30.setDate(hoy.getDate() - 30);
        const pad = n => String(n).padStart(2,'0');
        desde = hace30.getFullYear() + '-' + pad(hace30.getMonth()+1) + '-' + pad(hace30.getDate());
        hasta = hoy.getFullYear() + '-' + pad(hoy.getMonth()+1) + '-' + pad(hoy.getDate());
    }
    const filters = { t: tipo, fechaEmision: (fechaDMY(desde) || '') + ' - ' + (fechaDMY(hasta) || '') };
    const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

    // 1) Crear la automatización
    const crear = await fetch(AFIPSDK_BASE + '/automations', {
        method: 'POST',
        headers,
        body: JSON.stringify({ automation: 'mis-comprobantes', params: { cuit: user, username: user, password: pass, filters } })
    });
    const crearJson = await crear.json().catch(() => ({}));
    if (!crear.ok) {
        const err = new Error('AFIP SDK rechazó la solicitud: ' + JSON.stringify(crearJson));
        err.httpStatus = crear.status;
        throw err;
    }
    const id = crearJson.id || crearJson._id || (crearJson.data && crearJson.data.id);
    if (!id) { const err = new Error('AFIP SDK no devolvió un id de automatización: ' + JSON.stringify(crearJson)); err.httpStatus = 502; throw err; }

    // 2) Poll hasta que termine (máx ~3 min)
    let resultado = null;
    for (let intento = 0; intento < 36; intento++) {
        await sleep(5000);
        const r = await fetch(AFIPSDK_BASE + '/automations/' + id, { headers });
        const j = await r.json().catch(() => ({}));
        const status = (j.status || (j.data && j.data.status) || '').toLowerCase();
        if (status && status !== 'in_process' && status !== 'pending' && status !== 'processing') {
            resultado = j;
            break;
        }
    }
    if (!resultado) { const err = new Error('La automatización tardó demasiado. Probá de nuevo o reducí el rango de fechas.'); err.httpStatus = 504; throw err; }

    const status = (resultado.status || (resultado.data && resultado.data.status) || '').toLowerCase();
    if (status === 'error' || status === 'failed') {
        const err = new Error('La automatización falló (¿usuario/contraseña de ARCA correctos?): ' + JSON.stringify(resultado));
        err.httpStatus = 502;
        throw err;
    }

    // 3) Extraer el array de comprobantes (la forma exacta puede variar)
    let data = resultado.data;
    if (data && !Array.isArray(data) && Array.isArray(data.data)) data = data.data;
    if (!Array.isArray(data)) data = resultado.result || resultado.comprobantes || [];
    if (!Array.isArray(data)) data = [];
    return data;
}

function handlerMisComprobantes(tipo) {
    return async (req, res) => {
        try {
            const data = await misComprobantes(tipo, req.query.desde || '', req.query.hasta || '');
            return res.json(data);
        } catch (e) {
            return res.status(e.httpStatus || 500).json({ error: e.message, faltanCreds: !!e.faltanCreds });
        }
    };
}

// GET /afip/recibidos?desde=YYYY-MM-DD&hasta=YYYY-MM-DD  (comprobantes recibidos)
app.get('/afip/recibidos', handlerMisComprobantes('R'));
// GET /afip/emitidos?desde=YYYY-MM-DD&hasta=YYYY-MM-DD   (emitidos, incluye los del portal)
app.get('/afip/emitidos', handlerMisComprobantes('E'));

// Diagnóstico: abrí esta URL en el navegador para ver qué puntos de venta
// tenés habilitados y si la conexión con ARCA funciona.
app.get('/diag', async (req, res) => {
    const env  = process.env.AFIP_ENV || 'testing';
    const cuit = process.env.AFIP_CUIT || '(no configurado)';
    const out  = {
        modo:            env === 'production' ? 'PRODUCCION' : 'TESTING/HOMOLOGACION',
        cuit,
        afipEnvVar:      env,
        certCargado:     !!(process.env.AFIP_CERT),
        keyCargada:      !!(process.env.AFIP_KEY),
        advertencia:     env !== 'production' ? 'ATENCION: estás en modo TESTING. Las facturas NO aparecen en AFIP real.' : null,
        recibidos: {
            sdkTokenCargado: !!(process.env.AFIP_SDK_TOKEN || process.env.AFIP_ACCESS_TOKEN),
            arcaUserCargado: !!(process.env.ARCA_USER || process.env.AFIP_CUIT),
            arcaPassCargada: !!(process.env.ARCA_PASS),
            listoParaUsar:   !!((process.env.AFIP_SDK_TOKEN || process.env.AFIP_ACCESS_TOKEN) && (process.env.ARCA_USER || process.env.AFIP_CUIT) && process.env.ARCA_PASS)
        }
    };
    try {
        const afip = crearAfip();
        try {
            out.serverStatus = await afip.ElectronicBilling.getServerStatus();
        } catch (e) { out.serverStatusError = e.message + ' ' + detalleError(e); }
        try {
            out.puntosDeVenta = await afip.ElectronicBilling.getSalesPoints();
        } catch (e) { out.puntosDeVentaError = e.message + ' ' + detalleError(e); }
    } catch (e) {
        out.errorCredenciales = e.message;
    }
    return res.json(out);
});

// Verifica el último comprobante emitido para un punto de venta y tipo
// GET /afip/ultimo?ptoVta=3&tipoComp=1
app.get('/afip/ultimo', async (req, res) => {
    try {
        const afip    = crearAfip();
        const ptoVta  = parseInt(req.query.ptoVta)  || 1;
        const tipoComp = parseInt(req.query.tipoComp) || 1;
        const ultimo  = await afip.ElectronicBilling.getLastVoucher(ptoVta, tipoComp);
        return res.json({ ptoVta, tipoComp, ultimoNro: ultimo });
    } catch (e) {
        return res.status(500).json({ error: e.message, detalle: detalleError(e) });
    }
});

app.post('/afip', async (req, res) => {
    try {
        const afip = crearAfip();

        const {
            tipoComp, ptoVta, concepto, fecha, moneda,
            cuitRecep, condIva, razon, dom,
            impNeto, impIVA, impTotal, alicId, descripcion,
            cbtesAsoc
        } = req.body;

        const ultimoCbte = await afip.ElectronicBilling.getLastVoucher(ptoVta, tipoComp);
        const nroCbte    = ultimoCbte + 1;

        const alicuotas = [];
        if (impIVA > 0) {
            alicuotas.push({
                Id:      parseInt(alicId),
                BaseImp: impNeto,
                Importe: impIVA
            });
        }

        const data = {
            CantReg:    1,
            PtoVta:     ptoVta,
            CbteTipo:   tipoComp,
            Concepto:   concepto,
            DocTipo:    80,
            DocNro:     parseInt(cuitRecep),
            CbteDesde:  nroCbte,
            CbteHasta:  nroCbte,
            CbteFch:    fecha,
            ImpTotal:   impTotal,
            ImpTotConc: 0,
            ImpNeto:    impNeto,
            ImpOpEx:    0,
            ImpIVA:     impIVA,
            ImpTrib:    0,
            MonId:      moneda,
            MonCotiz:   1,
            CondicionIVAReceptorId: parseInt(condIva) || 5, // obligatorio desde RG 5616 (1=RI,4=Exento,5=CF,6=Monotributo)
            // afip.js envuelve este array en {AlicIva:...} internamente; pasar el array pelado
            Iva: alicuotas.length ? alicuotas : null
        };

        // Notas de crédito y débito requieren CbtesAsoc (comprobante original)
        if (cbtesAsoc && cbtesAsoc.length) {
            data.CbtesAsoc = cbtesAsoc;
        }

        // Concepto 2 (Servicios) o 3 (Productos y Servicios) exige fechas de servicio.
        // Si el frontend no las manda, usamos la fecha del comprobante como período.
        if (parseInt(concepto) === 2 || parseInt(concepto) === 3) {
            data.FchServDesde = req.body.fchServDesde || fecha;
            data.FchServHasta = req.body.fchServHasta || fecha;
            data.FchVtoPago   = req.body.fchVtoPago   || fecha;
        }

        const result = await afip.ElectronicBilling.createVoucher(data);

        return res.json({
            cae:       result.CAE,
            caeFchVto: result.CAEFchVto,
            cbteDesde: nroCbte,
            ptoVta,
            tipoComp
        });

    } catch (e) {
        console.error('AFIP Error:', e);
        if (e.faltanCreds) {
            return res.status(500).json({ error: e.message });
        }
        return res.status(500).json({
            error: e.message || String(e),
            detalle: detalleError(e)
        });
    }
});

// ═══════════════════════════════════════════════════════════════════
//  BELVO — Open Banking (conexión automática a bancos, ej: Santander AR)
//  Variables de entorno:
//    BELVO_SECRET_ID        → Secret Key ID del dashboard de Belvo
//    BELVO_SECRET_PASSWORD  → Secret Key Password (se muestra una sola vez)
//    BELVO_ENV              → "sandbox" (default), "development" o "production"
// ═══════════════════════════════════════════════════════════════════
function belvoBase() {
    var env = (process.env.BELVO_ENV || 'sandbox').toLowerCase();
    if (env === 'production')  return 'https://api.belvo.com';
    if (env === 'development') return 'https://development.belvo.com';
    return 'https://sandbox.belvo.com';
}

function belvoCreds() {
    var id = process.env.BELVO_SECRET_ID;
    var pw = process.env.BELVO_SECRET_PASSWORD;
    if (!id || !pw) {
        var err = new Error('Faltan credenciales de Belvo. Configurá BELVO_SECRET_ID y BELVO_SECRET_PASSWORD en Railway.');
        err.faltanCreds = true;
        throw err;
    }
    return { id: id, pw: pw, auth: 'Basic ' + Buffer.from(id + ':' + pw).toString('base64') };
}

// Llama a la API de Belvo con autenticación Basic (Node 22 trae fetch nativo).
async function belvoFetch(path, opts) {
    opts = opts || {};
    var c = belvoCreds();
    var resp = await fetch(belvoBase() + path, {
        method: opts.method || 'GET',
        headers: Object.assign({ 'Authorization': c.auth, 'Content-Type': 'application/json' }, opts.headers || {}),
        body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    var text = await resp.text();
    var json;
    try { json = text ? JSON.parse(text) : null; } catch (_) { json = text; }
    if (!resp.ok) {
        var err = new Error('Belvo respondió HTTP ' + resp.status);
        err.status = resp.status;
        err.data = json;
        throw err;
    }
    return json;
}

// Diagnóstico: confirma que las credenciales están cargadas.
app.get('/belvo/diag', (req, res) => {
    try {
        belvoCreds();
        res.json({ ok: true, env: (process.env.BELVO_ENV || 'sandbox'), base: belvoBase() });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// Token de acceso para abrir el Widget de conexión (Belvo Connect).
// El endpoint /api/token/ recibe id+password en el cuerpo (no usa Basic).
app.post('/belvo/widget-token', async (req, res) => {
    try {
        var c = belvoCreds();
        var resp = await fetch(belvoBase() + '/api/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: c.id,
                password: c.pw,
                scopes: 'read_institutions,write_links',
                fetch_resources: ['ACCOUNTS', 'TRANSACTIONS']
            })
        });
        var json = await resp.json().catch(function () { return null; });
        if (!resp.ok) return res.status(resp.status).json({ error: 'No se pudo generar el token de Belvo', detalle: json });
        res.json({ access: json.access, refresh: json.refresh });
    } catch (e) {
        if (e.faltanCreds) return res.status(500).json({ error: e.message });
        res.status(500).json({ error: e.message || String(e) });
    }
});

// Cuentas asociadas a un link (POST trae la info fresca del banco).
// GET /belvo/accounts?link=<id>
app.get('/belvo/accounts', async (req, res) => {
    try {
        var link = req.query.link;
        if (!link) return res.status(400).json({ error: 'Falta el parámetro link.' });
        var data = await belvoFetch('/api/accounts/', { method: 'POST', body: { link: link } });
        res.json(data);
    } catch (e) {
        if (e.faltanCreds) return res.status(500).json({ error: e.message });
        res.status(e.status || 500).json({ error: e.message, detalle: e.data });
    }
});

// Movimientos de un link. GET /belvo/transactions?link=<id>&date_from=&date_to=
app.get('/belvo/transactions', async (req, res) => {
    try {
        var link = req.query.link;
        if (!link) return res.status(400).json({ error: 'Falta el parámetro link.' });
        var body = { link: link };
        if (req.query.date_from) body.date_from = req.query.date_from;
        if (req.query.date_to)   body.date_to   = req.query.date_to;
        var data = await belvoFetch('/api/transactions/', { method: 'POST', body: body });
        res.json(data);
    } catch (e) {
        if (e.faltanCreds) return res.status(500).json({ error: e.message });
        res.status(e.status || 500).json({ error: e.message, detalle: e.data });
    }
});

// ═══════════════════════════════════════════════════════════════════
//  PROMETEO — Open Banking (plan B). Login directo con usuario/clave del
//  banco (no usa widget). Las credenciales del banco NO se guardan: viajan
//  una sola vez para abrir la sesión y se obtiene una "key" de sesión.
//  Variables de entorno:
//    PROMETEO_API_KEY  → API key del panel de Prometeo
//    PROMETEO_ENV      → "sandbox" (default) o "production"
// ═══════════════════════════════════════════════════════════════════
function prometeoBase() {
    var env = (process.env.PROMETEO_ENV || 'sandbox').toLowerCase();
    return env === 'production'
        ? 'https://banking.prometeoapi.net'
        : 'https://banking.sandbox.prometeoapi.net';
}

function prometeoApiKey() {
    var k = process.env.PROMETEO_API_KEY;
    if (!k) {
        var err = new Error('Falta la credencial de Prometeo. Configurá PROMETEO_API_KEY en Railway.');
        err.faltanCreds = true;
        throw err;
    }
    return k;
}

// Llama a la API de Prometeo. Para login usa form-urlencoded; el resto, query.
async function prometeoFetch(path, opts) {
    opts = opts || {};
    var resp = await fetch(prometeoBase() + path, {
        method: opts.method || 'GET',
        headers: Object.assign({ 'X-API-Key': prometeoApiKey() }, opts.headers || {}),
        body: opts.body || undefined
    });
    var text = await resp.text();
    var json;
    try { json = text ? JSON.parse(text) : null; } catch (_) { json = text; }
    if (!resp.ok) {
        var err = new Error('Prometeo respondió HTTP ' + resp.status);
        err.status = resp.status;
        err.data = json;
        throw err;
    }
    return json;
}

// Diagnóstico
app.get('/prometeo/diag', (req, res) => {
    try {
        prometeoApiKey();
        res.json({ ok: true, env: (process.env.PROMETEO_ENV || 'sandbox'), base: prometeoBase() });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// Lista de bancos disponibles
app.get('/prometeo/providers', async (req, res) => {
    try {
        var data = await prometeoFetch('/provider/');
        res.json(data);
    } catch (e) {
        if (e.faltanCreds) return res.status(500).json({ error: e.message });
        res.status(e.status || 500).json({ error: e.message, detalle: e.data });
    }
});

// Login al banco. body JSON { provider, username, password }
// Devuelve { status, key }. status puede pedir interacción (OTP) en algunos bancos.
app.post('/prometeo/login', async (req, res) => {
    try {
        var b = req.body || {};
        if (!b.provider || !b.username || !b.password) {
            return res.status(400).json({ error: 'Faltan provider, username o password.' });
        }
        var params = new URLSearchParams();
        params.set('provider', b.provider);
        params.set('username', b.username);
        params.set('password', b.password);
        if (b.type) params.set('type', b.type);
        if (b.otp)  params.set('otp', b.otp);
        var data = await prometeoFetch('/login/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });
        res.json(data);
    } catch (e) {
        if (e.faltanCreds) return res.status(500).json({ error: e.message });
        res.status(e.status || 500).json({ error: e.message, detalle: e.data });
    }
});

// Cuentas de la sesión. GET /prometeo/accounts?key=<session>
app.get('/prometeo/accounts', async (req, res) => {
    try {
        var key = req.query.key;
        if (!key) return res.status(400).json({ error: 'Falta el parámetro key (sesión).' });
        var data = await prometeoFetch('/account/?key=' + encodeURIComponent(key));
        res.json(data);
    } catch (e) {
        if (e.faltanCreds) return res.status(500).json({ error: e.message });
        res.status(e.status || 500).json({ error: e.message, detalle: e.data });
    }
});

// Movimientos. GET /prometeo/movements?key=&account=&currency=&date_start=&date_end=
// Fechas en formato DD/MM/YYYY (lo que pide Prometeo).
app.get('/prometeo/movements', async (req, res) => {
    try {
        var key = req.query.key, account = req.query.account;
        if (!key || !account) return res.status(400).json({ error: 'Faltan key y/o account.' });
        var qs = '?key=' + encodeURIComponent(key) +
            '&currency=' + encodeURIComponent(req.query.currency || 'ARS') +
            '&date_start=' + encodeURIComponent(req.query.date_start || '') +
            '&date_end=' + encodeURIComponent(req.query.date_end || '');
        var data = await prometeoFetch('/account/' + encodeURIComponent(account) + '/movement/' + qs);
        res.json(data);
    } catch (e) {
        if (e.faltanCreds) return res.status(500).json({ error: e.message });
        res.status(e.status || 500).json({ error: e.message, detalle: e.data });
    }
});

// Cierra la sesión del banco. GET /prometeo/logout?key=<session>
app.get('/prometeo/logout', async (req, res) => {
    try {
        var key = req.query.key;
        if (!key) return res.status(400).json({ error: 'Falta el parámetro key.' });
        var data = await prometeoFetch('/logout/?key=' + encodeURIComponent(key));
        res.json(data);
    } catch (e) {
        if (e.faltanCreds) return res.status(500).json({ error: e.message });
        res.status(e.status || 500).json({ error: e.message, detalle: e.data });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`RK Backend (AFIP + Belvo + Prometeo) corriendo en puerto ${PORT}`));
