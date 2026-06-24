const express = require('express');
const cors    = require('cors');
const Afip    = require('afip.js');

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

        if (!cuit || !cert || !key) {
            return res.status(500).json({
                error: 'Faltan credenciales. Configurá AFIP_CUIT, AFIP_CERT y AFIP_KEY como variables de entorno.'
            });
        }

        const afip = new Afip({ CUIT: cuit, cert, key, production: env === 'production' });

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
        return res.status(500).json({ error: e.message || String(e) });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`RK AFIP Backend corriendo en puerto ${PORT}`));
