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

app.get('/', (req, res) => res.json({ status: 'ok', service: 'RK AFIP Backend' }));

app.post('/afip', async (req, res) => {
    try {
        const cuit = process.env.AFIP_CUIT;
        const cert = (process.env.AFIP_CERT || '').replace(/\\n/g, '\n');
        const key  = (process.env.AFIP_KEY  || '').replace(/\\n/g, '\n');
        const env  = process.env.AFIP_ENV || 'testing';
        const token = process.env.AFIP_ACCESS_TOKEN || '';

        if (!cuit || !cert || !key) {
            return res.status(500).json({
                error: 'Faltan credenciales. Configurá AFIP_CUIT, AFIP_CERT y AFIP_KEY como variables de entorno.'
            });
        }

        const afipOpts = { CUIT: cuit, cert, key, production: env === 'production' };
        if (token) afipOpts.access_token = token;
        const afip = new Afip(afipOpts);

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
            Iva: alicuotas.length ? { AlicIva: alicuotas } : null
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
        // afip.js guarda el detalle real en e.data y e.status (ver interceptor de Afip.js)
        var detalle = '';
        var fuente = e.data || (e.response && e.response.data);
        if (fuente) {
            detalle = typeof fuente === 'string' ? fuente : JSON.stringify(fuente);
        }
        if (e.status) detalle = '[HTTP ' + e.status + '] ' + detalle;
        return res.status(500).json({
            error: e.message || String(e),
            detalle: detalle
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`RK AFIP Backend corriendo en puerto ${PORT}`));
