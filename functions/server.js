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

// Importa todos los comprobantes emitidos para un punto de venta + tipo
// GET /afip/importar?ptoVta=3&tipoComp=1
app.get('/afip/importar', async (req, res) => {
    try {
        const afip   = crearAfip();
        const ptoVta  = parseInt(req.query.ptoVta)  || 1;
        const tipoComp = parseInt(req.query.tipoComp) || 1;
        const ultimo  = await afip.ElectronicBilling.getLastVoucher(ptoVta, tipoComp);
        if (!ultimo) return res.json([]);
        const lista = [];
        for (let nro = 1; nro <= ultimo; nro++) {
            try {
                const v = await afip.ElectronicBilling.getVoucherInfo(nro, ptoVta, tipoComp);
                if (v && v.CodAutorizacion) {
                    lista.push({
                        tipoComp,
                        ptoVta,
                        nro,
                        fecha:    String(v.CbteFch || ''),
                        moneda:   v.MonId || 'PES',
                        cuitRecep: String(v.DocNro || ''),
                        condIva:  v.CondicionIVAReceptorId || 5,
                        razon:    '',
                        dom:      '',
                        impNeto:  v.ImpNeto || 0,
                        impIVA:   v.ImpIVA  || 0,
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
        return res.json(lista);
    } catch (e) {
        return res.status(500).json({ error: e.message, detalle: detalleError(e) });
    }
});

// Diagnóstico: abrí esta URL en el navegador para ver qué puntos de venta
// tenés habilitados y si la conexión con ARCA funciona.
app.get('/diag', async (req, res) => {
    try {
        const afip = crearAfip();
        const out = {};
        try {
            out.serverStatus = await afip.ElectronicBilling.getServerStatus();
        } catch (e) { out.serverStatusError = e.message + ' ' + detalleError(e); }
        try {
            out.puntosDeVenta = await afip.ElectronicBilling.getSalesPoints();
        } catch (e) { out.puntosDeVentaError = e.message + ' ' + detalleError(e); }
        return res.json(out);
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`RK Backend (AFIP + Belvo) corriendo en puerto ${PORT}`));
