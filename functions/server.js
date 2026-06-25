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
            impNeto, impIVA, impTotal, alicId, descripcion
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`RK AFIP Backend corriendo en puerto ${PORT}`));
