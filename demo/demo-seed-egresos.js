/* Versión de prueba — datos de ejemplo: EGRESOS (proveedores, presupuestos, facturas y comprobantes X recibidos).

   Qué siembra (todo inventado):
     global/proveedores · global/grupos · global/creditosProveedor · global/contadoresProvComp
     <proyecto principal>/datos (presupuestos de proveedores) · /facturas · /documentos (comprobantes X + adjuntos PDF)
     <proyecto principal>/contadorOP · /contadoresComprobante/OP_A · OP_B

   ⚠️ El ORDEN de `datos` importa: las facturas apuntan a su presupuesto por posición (`presupuestoIdx`), igual que la app real.
      0 Hormigonera (cerrado) · 1 Hierros · 2 Ladrillera (por facturas) · 3 Sanitarios (sin pagos) · 4 Electro · 5 Ascensores
      6 Aberturas (por facturas) · 7 Pintura (efectivo) · 8 Estudio de arquitectura (por facturas) · 9 Seguros (cerrado)

   Cómo está armado: los pagos se DECLARAN primero (pagarFact / pagarPres / pagarGrupo / pagarDoc) y recién al final se aplican en
   orden cronológico. Así las retenciones salen con la MISMA fórmula que calcularRetenciones() de la app (acumulado mensual por
   régimen), cada pago cumple totalRet = suma de retenciones[], y los totales (pagado, estado, pagado del presupuesto, pago-espejo)
   se derivan de los pagos y nunca quedan desfasados. Todas las fechas son relativas a hoy. */
(window.DEMO_SEEDS = window.DEMO_SEEDS || []).push(function (r) {
    var D = DEMO.dia;
    var CTA_G = DEMO.CTA_GALICIA, CTA_S = DEMO.CTA_SANTANDER, CTA_U = DEMO.CTA_GALICIA_USD;
    var PREF_OP = 'CLA-EDIFIC-OP-';          // <código empresa>-<código proyecto>-OP-<A|B>-00001 (ver obtenerProximoComprobante)
    var PREF_INT = 'CLA-EDIFIC-';             // numeración interna de los comprobantes X

    // ── utilidades ─────────────────────────────────────────────────────
    function red2(n) { return Math.round(n * 100) / 100; }
    function pad(n, w) { var s = String(n); while (s.length < w) s = '0' + s; return s; }
    function ext(a, b) { for (var k in b) { if (Object.prototype.hasOwnProperty.call(b, k)) a[k] = b[k]; } return a; }
    function suma(lista, fn) { return lista.reduce(function (s, x) { return s + fn(x); }, 0); }
    function ymd(f) { return String(f).replace(/-/g, ''); }
    function fm(n) { return Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    // CUIT con dígito verificador válido (módulo 11) pero del rango 5xxxxxxx, que no corresponde a nadie real.
    function cuit(pref, cuerpo) {
        var mult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
        for (var n = cuerpo; ; n++) {
            var s = pref + String(n), t = 0, i;
            for (i = 0; i < 10; i++) t += parseInt(s.charAt(i), 10) * mult[i];
            var dv = 11 - (t % 11);
            if (dv === 11) dv = 0;
            if (dv === 10) continue;
            return pref + '-' + n + '-' + dv;
        }
    }
    // números de transferencia / cupón repetibles pero de aspecto aleatorio
    var _lcg = 48271;
    function nroTransf() { _lcg = (_lcg * 1103515245 + 12345) % 2147483648; return String(4000000000 + (_lcg % 5999999999)).slice(0, 10); }

    // ── PDF mínimo de una página (Helvetica) para los adjuntos de ejemplo ──────
    function pdfTexto(t) {
        return String(t == null ? '' : t).replace(/[\r\n]+/g, ' ').replace(/[^\x20-\xFF]/g, '-').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    }
    // filas: [[izquierda, derecha], ...]; cab: renglones del encabezado; pie: texto chico al final
    function pdfDoc(titulo, cab, filas, totales, pie) {
        var c = [], y = 792;
        c.push('BT /F2 20 Tf 56 ' + y + ' Td (' + pdfTexto(titulo) + ') Tj ET');
        y -= 22;
        cab.forEach(function (t) { c.push('BT /F1 10 Tf 56 ' + y + ' Td (' + pdfTexto(t) + ') Tj ET'); y -= 14; });
        y -= 4; c.push('0.6 w 56 ' + y + ' m 539 ' + y + ' l S'); y -= 18;
        filas.forEach(function (f) {
            c.push('BT /F1 10 Tf 56 ' + y + ' Td (' + pdfTexto(f[0]) + ') Tj ET');
            if (f[1] !== undefined && f[1] !== '') c.push('BT /F1 10 Tf 410 ' + y + ' Td (' + pdfTexto(f[1]) + ') Tj ET');
            y -= 16;
        });
        y -= 2; c.push('0.6 w 56 ' + y + ' m 539 ' + y + ' l S'); y -= 18;
        (totales || []).forEach(function (f, i) {
            var neg = (i === totales.length - 1) ? '/F2 11' : '/F1 10';
            c.push('BT ' + neg + ' Tf 300 ' + y + ' Td (' + pdfTexto(f[0]) + ') Tj ET');
            c.push('BT ' + neg + ' Tf 410 ' + y + ' Td (' + pdfTexto(f[1]) + ') Tj ET');
            y -= 16;
        });
        if (pie) c.push('BT /F1 8 Tf 56 50 Td (' + pdfTexto(pie) + ') Tj ET');
        var tx = c.join('\n');
        var objs = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
            '<< /Length ' + tx.length + ' >>\nstream\n' + tx + '\nendstream'
        ];
        var out = '%PDF-1.4\n', offs = [];
        objs.forEach(function (o, i) { offs.push(out.length); out += (i + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
        var xref = out.length;
        out += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + offs.map(function (o) { return pad(o, 10) + ' 00000 n \n'; }).join('');
        out += 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF';
        return 'data:application/pdf;base64,' + btoa(out);
    }
    var ADJ = {};   // adjuntos: id -> { nombre, tipo, contenido } (viven en <proyecto>/documentos junto a los comprobantes X)
    function adjuntar(id, nombre, contenido) { ADJ[id] = { nombre: nombre, tipo: 'application/pdf', contenido: contenido }; return { id: id, nombre: nombre, tipo: 'application/pdf' }; }

    // ── Proveedores ────────────────────────────────────────────────────
    var PROVS = [], PV = {};
    function addProv(k, o) {
        var p = ext({
            id: 'P-demo-' + k, grupo: '', condicionIVA: 'Responsable Inscripto', provincia: 'Buenos Aires',
            ret78: false, ret94: false, ret119: false, ret30: false, retSUSSIng: false, retSUSSConst: false, retSUSSLimp: false,
            exentoRetenciones: false
        }, o);
        if (p.banco && !p.titular) p.titular = p.razonSocial;
        PROVS.push(p); PV[k] = p; return p;
    }
    addProv('hormi', { grupo: 'Obra gruesa', razonSocial: 'Hormigonera del Plata S.A.', nombreFantasia: 'HormiPlata', cuit: cuit('30', 51234567), rubro: 'Hormigón elaborado',
        telefono: '11 4642-1180', direccion: 'Ruta 4 km 12,5', localidad: 'Ciudad Evita', codigoPostal: 'B1778', email: 'cobranzas@hormiplata-demo.com',
        banco: 'Banco Galicia', sucursal: '021', nroCuenta: '4012345-6 021-1', cbu: '0070021320004012345617', alias: 'hormiplata.cobros', ret78: true });
    addProv('hierro', { grupo: 'Obra gruesa', razonSocial: 'Hierros Don Aníbal S.R.L.', nombreFantasia: 'Don Aníbal Hierros', cuit: cuit('30', 51877310), rubro: 'Hierros y aceros',
        telefono: '11 4709-3350', direccion: 'Av. Mitre 3480', localidad: 'Avellaneda', codigoPostal: 'B1870', email: 'ventas@donanibal-demo.com',
        banco: 'Banco Santander', sucursal: '112', nroCuenta: '0123-9 112-3', cbu: '0720112420000001239376', alias: 'donanibal.hierros', ret78: true });
    addProv('ladri', { grupo: 'Obra gruesa', razonSocial: 'Ladrillera San Cayetano S.A.', nombreFantasia: 'San Cayetano', cuit: cuit('30', 52004419), rubro: 'Ladrillos y cerámicos',
        telefono: '11 4455-8721', direccion: 'Camino Gral. Belgrano 5210', localidad: 'Berazategui', codigoPostal: 'B1884', email: 'pedidos@sancayetano-demo.com',
        banco: 'Banco Galicia', sucursal: '078', nroCuenta: '5509871-2 078-4', cbu: '0070078120005509871240', alias: 'sancayetano.ladrillos', ret78: true });
    addProv('sanit', { grupo: 'Terminaciones', razonSocial: 'Sanitarios Rioplatense S.A.', nombreFantasia: 'Rioplatense Sanitarios', cuit: cuit('30', 51390266), rubro: 'Sanitarios y grifería',
        telefono: '11 4583-2290', direccion: 'Av. Warnes 1425', localidad: 'CABA', provincia: 'Ciudad Autónoma de Buenos Aires', codigoPostal: 'C1414', email: 'proyectos@rioplatense-demo.com',
        banco: 'Banco Santander', sucursal: '044', nroCuenta: '7712-1 044-6', cbu: '0720044220000007712164', alias: 'rioplatense.cobros', ret78: true });
    addProv('electro', { grupo: 'Instalaciones', razonSocial: 'Electro Instalaciones Méndez S.R.L.', nombreFantasia: 'Méndez Electricidad', cuit: cuit('30', 52176804), rubro: 'Instalaciones eléctricas',
        telefono: '11 4921-7743', direccion: 'Hipólito Yrigoyen 2210', localidad: 'Lanús', codigoPostal: 'B1824', email: 'obras@mendez-demo.com',
        banco: 'Banco Galicia', sucursal: '033', nroCuenta: '3345120-8 033-2', cbu: '0070033120003345120827', alias: 'mendez.electro', ret94: true, retSUSSConst: true });
    addProv('ascen', { grupo: 'Instalaciones', razonSocial: 'Ascensores Norte-Sur S.A.', nombreFantasia: 'Norte-Sur Ascensores', cuit: cuit('30', 51562981), rubro: 'Ascensores',
        telefono: '11 4793-6600', direccion: 'Ing. Maschwitz 450', localidad: 'San Martín', codigoPostal: 'B1650', email: 'comercial@nortesur-demo.com',
        banco: 'Banco Santander', sucursal: '097', nroCuenta: '2204-7 097-5', cbu: '0720097520000002204759', alias: 'nortesur.asc', ret78: true });
    addProv('abert', { grupo: 'Terminaciones', razonSocial: 'Aberturas Patagonia S.A.', nombreFantasia: 'Patagonia Aberturas', cuit: cuit('30', 52248533), rubro: 'Aberturas de aluminio',
        telefono: '11 4756-9012', direccion: 'Ruta 8 km 31', localidad: 'Pilar', codigoPostal: 'B1629', email: 'cobranzas@patagonia-aberturas-demo.com',
        banco: 'Banco Galicia', sucursal: '052', nroCuenta: '6623408-1 052-9', cbu: '0070052120006623408190', alias: 'patagonia.alum', ret78: true });
    addProv('pintu', { grupo: 'Terminaciones', razonSocial: 'Pinturas y Revestimientos Alfa S.R.L.', nombreFantasia: 'Alfa Pinturas', cuit: cuit('30', 51710947), rubro: 'Pintura y revestimientos',
        telefono: '11 4658-3377', direccion: 'Av. San Martín 1890', localidad: 'Caseros', codigoPostal: 'B1678', email: 'cuentas@alfapinturas-demo.com',
        banco: 'Banco Santander', sucursal: '061', nroCuenta: '8841-3 061-7', cbu: '0720061320000008841372', alias: 'alfa.pinturas', ret94: true });
    addProv('arq', { grupo: 'Honorarios profesionales', razonSocial: 'Estudio Lavalle & Asociados S.R.L.', nombreFantasia: 'Lavalle Arquitectos', cuit: cuit('30', 52091675), rubro: 'Arquitectura y dirección de obra',
        telefono: '11 4812-5509', direccion: 'Juncal 2840, Piso 5', localidad: 'CABA', provincia: 'Ciudad Autónoma de Buenos Aires', codigoPostal: 'C1425', email: 'estudio@lavalle-demo.com',
        banco: 'Banco Galicia', sucursal: '007', nroCuenta: '1177340-5 007-8', cbu: '0070007120001177340582', alias: 'lavalle.estudio', ret119: true });
    addProv('ing', { grupo: 'Honorarios profesionales', razonSocial: 'Ingeniería Estructural Quiroga S.R.L.', nombreFantasia: 'Quiroga Ingeniería', cuit: cuit('30', 51944108), rubro: 'Cálculo estructural e ingeniería',
        telefono: '11 4372-1046', direccion: 'Tucumán 1540, Piso 2', localidad: 'CABA', provincia: 'Ciudad Autónoma de Buenos Aires', codigoPostal: 'C1050', email: 'proyectos@quiroga-ing-demo.com',
        banco: 'Banco Santander', sucursal: '015', nroCuenta: '3092-6 015-1', cbu: '0720015120000003092618', alias: 'quiroga.ing', ret94: true, retSUSSIng: true });
    addProv('seg', { grupo: 'Seguros e impuestos', razonSocial: 'Seguros del Sur Compañía de Seguros S.A.', nombreFantasia: 'Seguros del Sur', cuit: cuit('30', 50886220), rubro: 'Seguros',
        telefono: '11 5239-4000', direccion: 'Av. Corrientes 880, Piso 9', localidad: 'CABA', provincia: 'Ciudad Autónoma de Buenos Aires', codigoPostal: 'C1043', email: 'empresas@segurosdelsur-demo.com',
        banco: 'Banco Galicia', sucursal: '001', nroCuenta: '9001122-4 001-3', cbu: '0070001120009001122437', alias: 'segurosdelsur.cobros', exentoRetenciones: true });
    addProv('equip', { grupo: 'Equipos y alquileres', razonSocial: 'Alquileres de Equipos Pampa S.R.L.', nombreFantasia: 'Equipos Pampa', cuit: cuit('30', 51483752), rubro: 'Alquiler de equipos y andamios',
        telefono: '11 4620-8815', direccion: 'Colectora Oeste 3120', localidad: 'Moreno', codigoPostal: 'B1744', email: 'alquileres@equipospampa-demo.com',
        banco: 'Banco Galicia', sucursal: '094', nroCuenta: '4470213-9 094-6', cbu: '0070094120004470213962', alias: 'equipospampa.cobros', ret30: true });
    addProv('clima', { grupo: 'Instalaciones', razonSocial: 'Climatización Austral S.A.', nombreFantasia: 'Austral Clima', cuit: cuit('30', 52317889), rubro: 'Aire acondicionado y climatización',
        telefono: '11 4574-2003', direccion: 'Av. Gaona 3350', localidad: 'CABA', provincia: 'Ciudad Autónoma de Buenos Aires', codigoPostal: 'C1416', email: 'ventas@australclima-demo.com',
        banco: 'Banco Galicia', sucursal: '029', nroCuenta: '5513490-7 029-0', cbu: '0070029120005513490709', alias: 'australclima.usd' });
    addProv('corra', { grupo: 'Obra gruesa', razonSocial: 'Corralón El Ceibo - Salvatierra Ricardo', nombreFantasia: 'Corralón El Ceibo', cuit: cuit('20', 50128467), condicionIVA: 'Monotributista', rubro: 'Materiales de construcción',
        telefono: '11 4666-0419', direccion: 'Ruta 3 km 28', localidad: 'González Catán', codigoPostal: 'B1759', email: 'elceibo.corralon@correo-demo.com' });
    addProv('arca', { grupo: 'Seguros e impuestos', razonSocial: 'ARCA - Impuestos y aportes', nombreFantasia: 'ARCA', condicionIVA: 'Exento', rubro: 'Impuestos y cargas sociales',
        provincia: 'Ciudad Autónoma de Buenos Aires', localidad: 'CABA', exentoRetenciones: true });

    // ── Motor de retenciones (misma fórmula que calcularRetenciones() de la app) ──────
    function escala119(x) {
        if (x <= 0) return 0;
        if (x <= 71000) return x * 0.05;
        if (x <= 142000) return 3550 + (x - 71000) * 0.09;
        if (x <= 213000) return 9940 + (x - 142000) * 0.12;
        if (x <= 284000) return 18460 + (x - 213000) * 0.15;
        if (x <= 426000) return 29110 + (x - 284000) * 0.19;
        if (x <= 568000) return 56090 + (x - 426000) * 0.23;
        if (x <= 852000) return 88750 + (x - 568000) * 0.27;
        return 165430 + (x - 852000) * 0.31;
    }
    var REGIMENES = [
        { key: 'ret78', codigo: '78', min: 224000, fn: function (x) { return x * 0.02; }, desc: 'Ganancias Reg.78 — Bienes muebles/cambio (2% s/excedente $224.000)' },
        { key: 'ret94', codigo: '94', min: 67170, fn: function (x) { return x * 0.02; }, desc: 'Ganancias Reg.94 — Locaciones de obra/servicios (2% s/excedente $67.170)' },
        { key: 'ret119', codigo: '119', min: 160000, fn: escala119, desc: 'Ganancias Reg.119 — Honorarios profesionales (escala 5%–31% s/excedente $160.000)' },
        { key: 'ret30', codigo: '30/31/32', min: 11200, fn: function (x) { return x * 0.06; }, minimo240: true, desc: 'Ganancias Reg.30/31/32 — Alquileres (6% s/excedente $11.200, mínimo $240)' },
        { key: 'retSUSSIng', codigo: 'SUSS-Ing', tasa: 0.012, desc: 'SUSS Obras de ingeniería (1,2% s/pago)' },
        { key: 'retSUSSConst', codigo: 'SUSS-Const', tasa: 0.025, desc: 'SUSS Obras de construcción (2,5% s/pago)' },
        { key: 'retSUSSLimp', codigo: 'SUSS-Limp', tasa: 0.06, desc: 'SUSS Empresa de limpieza (6% s/pago)' }
    ];
    var ACUM = {};   // proveedor|mes|régimen -> { base, ret }: lo ya practicado en el mes, como acumuladoMensual()
    function calcRets(prov, fecha, base) {
        var out = [];
        if (!prov || prov.exentoRetenciones) return out;
        var mes = fecha.substring(0, 7);
        REGIMENES.forEach(function (g) {
            if (!prov[g.key]) return;
            if (g.tasa) { out.push({ codigo: g.codigo, desc: g.desc, monto: red2(base * g.tasa) }); return; }
            var k = prov.id + '|' + mes + '|' + g.codigo, a = ACUM[k] || (ACUM[k] = { base: 0, ret: 0 });
            var monto = Math.max(g.fn(Math.max(a.base + base - g.min, 0)) - a.ret, 0);
            if (g.minimo240 && monto > 0 && monto < 240 && a.ret === 0) monto = 240;
            monto = red2(monto);
            a.base += base; a.ret += monto;
            out.push({ codigo: g.codigo, desc: g.desc, monto: monto });
        });
        return out;
    }

    // ── Presupuestos de proveedores (colección «datos») ───────────────────────
    var PRES = [];
    // Índice de costo de la construcción de ejemplo: +2,4% por mes
    function cacEn(dias) { return red2(1795.4 * (1 + 0.024 * (dias + 200) / 30)); }
    function addPres(k, o) {
        var items = o.lineas.map(function (l) {
            var it = { detalle: l[0], cantidad: l[1], precioUnit: l[2], subtotal: red2(l[1] * l[2]) };
            if (l[3]) it.noAjustar = true;
            return it;
        });
        var total = red2(suma(items, function (i) { return i.subtotal; }));
        var d = {
            id: 'pre_' + pad(PRES.length + 1, 2) + '_' + k,
            fecha: D(o.d), proveedor: PV[o.prov].razonSocial, concepto: o.concepto, rubro: o.rubro, subrubro: o.subrubro,
            presupuesto: total, items: items, entrega: D(o.ent), modalidad: o.mod || 'A',
            pagadoPresupuesto: 0, pagadoMayores: 0, pagado: 0,
            indiceTipo: o.indice ? o.indice : 'CAC', indiceCACActual: 0,
            recibo: 'REC-' + ymd(D(o.d)) + '-' + pad(2100 + PRES.length * 137, 4),
            _d: o.d, _conIndice: !!o.indice
        };
        if (o.indice) { d.indiceCACBase = cacEn(o.d); d.indiceCACActual = cacEn(0); }
        PRES.push(d); return d;
    }
    // proporción del presupuesto que se actualiza por índice (ítems sin «noAjustar»)
    function fraccion(d) {
        var tot = suma(d.items, function (i) { return i.subtotal; }), aj = suma(d.items, function (i) { return i.noAjustar ? 0 : i.subtotal; });
        return tot > 0 ? aj / tot : 1;
    }

    addPres('hormi', { prov: 'hormi', d: -165, ent: 12, indice: 'CAC', rubro: 'Estructura', subrubro: 'Hormigón elaborado',
        concepto: 'Hormigón elaborado H-30 — estructura de la torre (1.100 m³)',
        lineas: [['Hormigón H-30 para losas y vigas', 800, 185000], ['Hormigón H-30 para columnas y tabiques', 300, 195000], ['Servicio de bombeo y pluma', 1, 8000000]] });
    addPres('hierro', { prov: 'hierro', d: -150, ent: -5, indice: 'CAC', rubro: 'Estructura', subrubro: 'Hierros',
        concepto: 'Hierros ADN 420 y mallas electrosoldadas — estructura',
        lineas: [['Hierro ADN 420 Ø8 a Ø12 (82 t)', 82, 1450000], ['Hierro ADN 420 Ø16 a Ø25 (26 t)', 26, 1520000], ['Mallas Q188 (1.360 u)', 1360, 6500], ['Flete y descarga', 1, 740000]] });
    addPres('ladri', { prov: 'ladri', d: -120, ent: 25, indice: 'CAC', rubro: 'Mampostería', subrubro: 'Ladrillos y bloques',
        concepto: 'Mampostería — ladrillos huecos, bloques y cerámicos (22.000 m²)',
        lineas: [['Ladrillo hueco 18x18x33 (40.000 u)', 40000, 780], ['Ladrillo hueco 12x18x33 (30.000 u)', 30000, 690], ['Bloque de cemento 19x19x39 (9.000 u)', 9000, 1050], ['Cerámico 8 agujeros (12.000 u)', 12000, 760], ['Fletes a obra', 1, 1530000]] });
    addPres('sanit', { prov: 'sanit', d: -70, ent: 60, rubro: 'Terminaciones', subrubro: 'Sanitarios y grifería',
        concepto: 'Sanitarios, griferías y accesorios — 48 unidades funcionales',
        lineas: [['Juego de sanitarios (inodoro, bidet, lavatorio)', 48, 430000], ['Grifería monocomando baño y cocina', 48, 295000], ['Accesorios y flexibles', 48, 40000], ['Flete y descarga', 1, 3280000]] });
    addPres('electro', { prov: 'electro', d: -110, ent: 50, indice: 'CAC', rubro: 'Instalaciones', subrubro: 'Instalación eléctrica',
        concepto: 'Instalación eléctrica completa — materiales y mano de obra',
        lineas: [['Canalizaciones y cajas (48 UF + palieres)', 1, 21400000], ['Cableado y tableros seccionales', 1, 33200000], ['Artefactos y tomas', 48, 345000], ['Puesta a tierra y pararrayos', 1, 5100000], ['Mano de obra y dirección técnica', 1, 20740000]] });
    addPres('ascen', { prov: 'ascen', d: -140, ent: 120, indice: 'CAC', rubro: 'Instalaciones', subrubro: 'Ascensores',
        concepto: 'Ascensores (2 equipos de 8 pasajeros) — suministro y montaje',
        lineas: [['Equipos importados (precio fijo)', 2, 52000000, true], ['Montaje y puesta en marcha', 2, 14000000], ['Habilitación y certificación', 1, 6000000]] });
    addPres('abert', { prov: 'abert', d: -95, ent: 35, indice: 'CAC', rubro: 'Carpinterías', subrubro: 'Aberturas de aluminio',
        concepto: 'Aberturas de aluminio con DVH — 96 unidades',
        lineas: [['Ventanas y balcones DVH', 96, 668000], ['Herrajes, mosquiteros y burletes', 96, 52000], ['Colocación y sellado', 1, 3780000]] });
    addPres('pintu', { prov: 'pintu', d: -40, ent: 80, mod: 'B', rubro: 'Terminaciones', subrubro: 'Pintura',
        concepto: 'Pintura interior y exterior + revestimientos texturados',
        lineas: [['Pintura látex interior (2 manos)', 1, 14200000], ['Pintura frente y revestimiento texturado', 1, 15800000], ['Mano de obra', 1, 8500000]] });
    addPres('arq', { prov: 'arq', d: -180, ent: 200, indice: 'IPC', rubro: 'Honorarios', subrubro: 'Arquitectura',
        concepto: 'Honorarios — proyecto ejecutivo y dirección de obra (8 cuotas)',
        lineas: [['Cuota de honorarios (IVA incluido)', 8, 6050000]] });
    addPres('seg', { prov: 'seg', d: -130, ent: 170, rubro: 'Seguros', subrubro: 'Seguro técnico',
        concepto: 'Seguro técnico de obra y responsabilidad civil',
        lineas: [['Prima seguro técnico de obra', 1, 9100000], ['Prima responsabilidad civil', 1, 5100000]] });
    // el índice de los presupuestos con «indice» arranca en el de su fecha; el «actual» se fija al aplicar los pagos
    var PI = {};
    PRES.forEach(function (p, i) { PI[p.id.substring(7)] = i; });

    // ── Facturas recibidas ─────────────────────────────────────────────
    var FACTS = [];
    // lineas: [detalle, cantidad, precioUnit] (todo neto de IVA); la factura A suma el IVA 21% como un renglón más
    function addFact(k, o) {
        var prov = PV[o.prov];
        var items = o.lineas.map(function (l) { return { detalle: l[0], cantidad: l[1], precioUnit: l[2], signo: 1, subtotal: red2(l[1] * l[2]) }; });
        var neto = red2(suma(items, function (i) { return i.subtotal; }));
        var letra = o.letra || 'A', iva = 0;
        if (letra === 'A') {
            iva = red2(neto * 0.21);
            items.push({ detalle: 'IVA 21%', cantidad: 1, precioUnit: iva, signo: 1, subtotal: iva });
        }
        var f = {
            id: 'fact_' + ymd(D(o.d)) + '_' + k + '_' + pad(FACTS.length + 1, 2), proveedor: prov.razonSocial, numero: o.nro, fecha: D(o.d), vencimiento: D(o.v),
            descripcion: o.desc, importe: red2(neto + iva), items: items, fondoReparoPct: o.fr || 0, moneda: o.mon || 'ARS',
            pagado: 0, estado: 'pendiente', tipo: o.pres != null ? 'presup' : 'directo', netoGravado: neto,
            computaARCA: o.arca !== false, tipoComprobante: letra, esNotaDebito: false, esVEP: !!o.vep
        };
        if (o.pres != null) {
            f.presupuestoIdx = o.pres;
            f.presupuestoPorcentaje = null;   // se completa abajo con lo que representa del presupuesto
            f.presupuestoComentario = o.coment || '';
        }
        // Una factura oficial lleva su CAE: sin él, el listado de Documentos la rotula «No oficial» (ver _facEsArca)
        if (o.arca !== false) { f.cae = String(70000000000000 + (FACTS.length + 1) * 3719 + 41850231).slice(0, 14); f.vencimientoCae = D(o.d + 10); }
        if (o.ia) {   // las que se cargaron «leyendo el PDF con IA» traen además lo que dice el comprobante
            f.cuit = prov.cuit || ''; f.condicionIva = prov.condicionIVA; f.direccionEmisor = prov.direccion + ', ' + prov.localidad;
        }
        f._pv = prov; f._mon = o.mon || 'ARS';
        FACTS.push(f); return f;
    }

    // ── Pagos: se declaran acá y se aplican al final, en orden cronológico ───────
    var PAGOS = [], _seq = 0;
    function agendar(o) { o.seq = _seq++; o.fecha = D(o.d); PAGOS.push(o); return o; }
    function pagarFact(f, o) { return agendar(ext({ tipo: 'fact', f: f }, o)); }
    function pagarDoc(doc, o) { return agendar(ext({ tipo: 'doc', f: doc }, o)); }
    function pagarPres(p, o) { return agendar(ext({ tipo: 'pres', p: p }, o)); }
    function pagarGrupo(fs, o) { return agendar(ext({ tipo: 'grupo', fs: fs }, o)); }

    var NC = [];
    function addNC(k, o) {
        var prov = PV[o.prov];
        var n = {
            id: 'nc_' + ymd(D(o.d)) + '_' + k + '_' + pad(NC.length + 1, 2), esNotaCredito: true, notaCreditoDe: o.contra.id, notaCreditoKind: 'fact', proveedor: prov.razonSocial,
            numero: o.nro, fecha: D(o.d), importe: o.importe, moneda: 'ARS', tipoComprobante: 'A', computaARCA: true, pagado: 0, estado: 'pagada', tipo: 'directo'
        };
        o.contra._nc = (o.contra._nc || 0) + o.importe;
        NC.push(n); return n;
    }

    // ── Hormigonera ──
    var F_hormi1 = addFact('hormi', { prov: 'hormi', d: -74, v: -44, nro: '0006-00041873', ia: true, desc: 'Hormigón de limpieza y contrapisos — 160 m³',
        lineas: [['Hormigón de limpieza H-8 (fundaciones)', 60, 112000], ['Hormigón H-13 contrapisos subsuelo y planta baja', 100, 121000], ['Servicio de bombeo (pluma)', 1, 1450000]] });
    var F_hormi2 = addFact('hormi', { prov: 'hormi', d: -26, v: 4, nro: '0006-00043120', ia: true, desc: 'Hormigón H-21 losa de terraza y tanque de reserva — 95 m³',
        lineas: [['Hormigón H-21 losa de terraza y tanque', 95, 164000], ['Aditivo hidrófugo', 95, 6800], ['Bombeo y pluma', 1, 1180000]] });
    // ── Hierros ──
    var F_hierro1 = addFact('hierro', { prov: 'hierro', d: -48, v: -18, nro: '0002-00019456', desc: 'Hierro ADN 420 Ø10 y Ø12 — 18 t entregadas en obra',
        lineas: [['Hierro ADN 420 Ø10 y Ø12 en barras de 12 m (t)', 18, 1480000]] });
    var F_hierro2 = addFact('hierro', { prov: 'hierro', d: -12, v: 18, nro: '0002-00019877', ia: true, desc: 'Hierro Ø8 para estribos y accesorios',
        lineas: [['Hierro ADN 420 Ø8 para estribos (t)', 9, 1495000], ['Alambre de atar y separadores', 1, 640000]] });
    // ── Ladrillera (aplicadas al presupuesto de mampostería) ──
    var F_ladri1 = addFact('ladri', { prov: 'ladri', d: -62, v: -32, nro: '0011-00005231', pres: PI.ladri, coment: 'Primera entrega — mampostería de subsuelo a piso 3', desc: 'Ladrillos huecos y bloques — primera entrega',
        lineas: [['Ladrillo hueco 18x18x33', 14000, 780], ['Bloque de cemento 19x19x39', 3500, 1050], ['Flete y descarga en obra', 1, 905000]] });
    var F_ladri2 = addFact('ladri', { prov: 'ladri', d: -29, v: 1, nro: '0011-00005702', pres: PI.ladri, coment: 'Segunda entrega — pisos 4 a 8', ia: true, desc: 'Ladrillos huecos y cerámicos — segunda entrega',
        lineas: [['Ladrillo hueco 12x18x33', 16000, 690], ['Cerámico 8 agujeros 12x18x33 (tabiques)', 5200, 760], ['Flete y descarga en obra', 1, 840000]] });
    // ── Sanitarios ──
    var F_sanit1 = addFact('sanit', { prov: 'sanit', d: -35, v: -5, nro: '0008-00027714', desc: 'Tanques de agua y bombas presurizadoras',
        lineas: [['Tanque de agua 2.500 l tricapa', 6, 385000], ['Bomba presurizadora 1,5 HP', 4, 420000], ['Colectores y válvulas', 1, 1250000]] });
    // ── Electricidad (dos regímenes: Reg.94 y SUSS construcción) ──
    var F_electro1 = addFact('electro', { prov: 'electro', d: -47, v: -17, nro: '0003-00009138', fr: 5, ia: true, desc: 'Materiales eléctricos — cables, caños y tableros (certificado 1)',
        lineas: [['Cable unipolar 2,5 mm² y 4 mm² (rollos)', 120, 38500], ['Caños, cajas de pase y accesorios', 1, 2180000], ['Tableros seccionales (12 u)', 12, 285000]] });
    var F_electro2 = addFact('electro', { prov: 'electro', d: -9, v: 21, nro: '0003-00009455', fr: 5, desc: 'Certificado de avance N°2 — instalación eléctrica pisos 1 a 6',
        lineas: [['Certificado N°2 — mano de obra pisos 1 a 6', 1, 9800000], ['Puesta a tierra y pararrayos (avance)', 1, 1650000]] });
    // ── Ascensores ──
    var F_ascen1 = addFact('ascen', { prov: 'ascen', d: -33, v: -3, nro: '0015-00002210', desc: 'Guías, cables de tracción y contrapesos',
        lineas: [['Guías, cables de tracción y contrapesos (2 equipos)', 1, 9600000]] });
    // ── Aberturas (aplicadas al presupuesto de carpinterías) ──
    var F_abert1 = addFact('abert', { prov: 'abert', d: -58, v: -28, nro: '0007-00003398', pres: PI.abert, coment: 'Anticipo 30%', ia: true, desc: 'Anticipo 30% — aberturas de aluminio con DVH (96 u)',
        lineas: [['Anticipo 30% — aberturas de aluminio con DVH (96 u)', 1, 18000000]] });
    var F_abert2 = addFact('abert', { prov: 'abert', d: -22, v: 8, nro: '0007-00003721', pres: PI.abert, coment: 'Entrega de pisos 1 a 6', desc: 'Entrega parcial — aberturas de pisos 1 a 6 (36 u)',
        lineas: [['Ventanas y balcones DVH — pisos 1 a 6', 36, 421000], ['Herrajes y mosquiteros', 36, 38000]] });
    // ── Pintura ──
    var F_pintu1 = addFact('pintu', { prov: 'pintu', d: -20, v: 10, nro: '0009-00011064', desc: 'Látex interior y selladores — acopio de materiales',
        lineas: [['Látex interior premium 20 l (balde)', 140, 82000], ['Sellador y fijador', 40, 41500]] });
    // ── Arquitectura: honorarios en cuotas mensuales (aplicadas al presupuesto de honorarios) ──
    var F_arq1 = addFact('arq', { prov: 'arq', d: -85, v: -70, nro: '0001-00000214', pres: PI.arq, coment: 'Cuota 1/8 de honorarios', desc: 'Honorarios dirección de obra — cuota 1/8',
        lineas: [['Honorarios dirección de obra — cuota 1/8', 1, 5000000]] });
    var F_arq2 = addFact('arq', { prov: 'arq', d: -55, v: -40, nro: '0001-00000233', pres: PI.arq, coment: 'Cuota 2/8 de honorarios', desc: 'Honorarios dirección de obra — cuota 2/8',
        lineas: [['Honorarios dirección de obra — cuota 2/8', 1, 5000000]] });
    var F_arq3 = addFact('arq', { prov: 'arq', d: -25, v: -10, nro: '0001-00000251', pres: PI.arq, coment: 'Cuota 3/8 de honorarios', desc: 'Honorarios dirección de obra — cuota 3/8',
        lineas: [['Honorarios dirección de obra — cuota 3/8', 1, 5000000]] });
    // ── Ingeniería (Reg.94 + SUSS ingeniería) ──
    var F_ing1 = addFact('ing', { prov: 'ing', d: -44, v: -14, nro: '0001-00000087', desc: 'Honorarios — memoria de cálculo y planos de estructura (entrega final)',
        lineas: [['Honorarios — memoria de cálculo y planos de estructura', 1, 8200000]] });
    // ── Seguros ──
    var F_seg1 = addFact('seg', { prov: 'seg', d: -18, v: 12, nro: '0020-00015583', desc: 'Endoso — ampliación de suma asegurada de responsabilidad civil',
        lineas: [['Endoso ampliación de suma asegurada — responsabilidad civil', 1, 2350000]] });
    // ── Equipos: alquileres mensuales (los tres primeros se pagan juntos, en un solo pago) ──
    var F_equip1 = addFact('equip', { prov: 'equip', d: -58, v: -28, nro: '0005-00006102', desc: 'Alquiler de grúa torre autoportante — mes 1',
        lineas: [['Alquiler grúa torre autoportante — mes 1', 1, 4200000]] });
    var F_equip3 = addFact('equip', { prov: 'equip', d: -35, v: -5, nro: '0005-00006301', desc: 'Alquiler de andamios tubulares multidireccionales (400 m²)',
        lineas: [['Alquiler de andamios tubulares multidireccionales (400 m²)', 1, 3150000]] });
    var F_equip2 = addFact('equip', { prov: 'equip', d: -27, v: 3, nro: '0005-00006388', desc: 'Alquiler de grúa torre autoportante — mes 2',
        lineas: [['Alquiler grúa torre autoportante — mes 2 (ajuste +5%)', 1, 4410000]] });
    var F_equip4 = addFact('equip', { prov: 'equip', d: 0, v: 30, nro: '0005-00006650', desc: 'Alquiler de grúa torre autoportante — mes 3',
        lineas: [['Alquiler grúa torre autoportante — mes 3', 1, 4410000]] });
    // ── Climatización (en dólares) ──
    var F_clima1 = addFact('clima', { prov: 'clima', d: -27, v: 3, nro: '0012-00000781', mon: 'USD', ia: true, desc: 'Equipos VRF y unidades interiores importados — anticipo 50%',
        lineas: [['Equipos VRF y unidades interiores (importados) — anticipo 50%', 1, 20000]] });
    var F_clima2 = addFact('clima', { prov: 'clima', d: -14, v: 16, nro: '0012-00000802', mon: 'USD', desc: 'Rejillas, difusores y conductos (importados)',
        lineas: [['Rejillas, difusores y conductos (importados)', 1, 3000]] });
    // ── Corralón (monotributista: Factura C, sin IVA discriminado) ──
    var F_corra1 = addFact('corra', { prov: 'corra', d: -8, v: -8, nro: '0003-00007781', letra: 'C', desc: 'Cemento, cal, arena y piedra — materiales de obra',
        lineas: [['Cemento, cal, arena y piedra — materiales de obra', 1, 3185000]] });
    var F_corra2 = addFact('corra', { prov: 'corra', d: -1, v: 9, nro: '0003-00007904', letra: 'C', desc: 'Ladrillos comunes y hierro de armado — pedido urgente',
        lineas: [['Ladrillos comunes y hierro de armado — pedido urgente', 1, 2640000]] });
    // ── VEP (cargas sociales): comprobante sin crédito fiscal, con DDJJ y acuse del pago ──
    var F_vep1 = addFact('arca', { prov: 'arca', d: -9, v: -9, nro: '0200004822', letra: 'X', arca: false, vep: true, desc: 'VEP F.931 — contribuciones y aportes de seguridad social de obra',
        lineas: [['F.931 — contribuciones y aportes de seguridad social de obra', 1, 8416500]] });
    F_vep1.nroProv = 1;

    // Nota de crédito de la hierrería por un faltante de 1,1 t en la entrega (baja el saldo de F_hierro1)
    addNC('hierro', { prov: 'hierro', contra: F_hierro1, d: -41, nro: '0002-00001845', importe: red2(1.1 * 1480000 * 1.21) });

    // % del presupuesto que representa cada factura aplicada
    FACTS.forEach(function (f) {
        if (f.presupuestoIdx != null) f.presupuestoPorcentaje = Math.round(f.importe / PRES[f.presupuestoIdx].presupuesto * 1000) / 10;
    });

    // ── Comprobantes X recibidos (colección «documentos»: recibos, tickets, VEP…) ───
    var DOCS = [], _nroInt = { A: 80, B: 80 }, _nroProv = {};
    function addDoc(k, o) {
        var prov = PV[o.prov], mod = o.mod || 'B';
        _nroInt[mod]++;
        _nroProv[prov.id] = (_nroProv[prov.id] || (prov.id === PV.arca.id ? 1 : 0)) + 1;
        var d = {
            id: 'doc_' + pad(DOCS.length + 1, 2) + '_' + k, proveedor: prov.razonSocial, fecha: D(o.d), numero: o.nro || '',
            nro: PREF_INT + mod + '-' + pad(_nroInt[mod], 5), tipo: o.tipo, descripcion: o.desc, moneda: 'ARS', importe: o.importe,
            pagado: 0, modalidad: mod, observaciones: o.obs || '', nroProv: _nroProv[prov.id]
        };
        d._pv = prov;
        DOCS.push(d); return d;
    }
    var DOC_ticket = addDoc('corra', { prov: 'corra', d: -52, tipo: 'ticket', nro: 'T-0457', importe: 1180000, desc: 'Ticket de compra — cemento, cal y arena para trabajos de albañilería' });
    var DOC_flete = addDoc('corra', { prov: 'corra', d: -17, tipo: 'comprobante_x', nro: 'X-0062', importe: 960000, desc: 'Flete y volquetes de escombro (3 viajes)', obs: 'Se paga contra entrega del remito conformado.' });
    var DOC_andamio = addDoc('equip', { prov: 'equip', d: -30, tipo: 'recibo', nro: 'R-0214', importe: 4650000, desc: 'Recibo — alquiler de andamios tubulares, cuota 2/3', obs: 'Acordado: 50% a los 8 días y el resto contra desarme.' });
    var DOC_sena = addDoc('pintu', { prov: 'pintu', d: -41, tipo: 'recibo', nro: 'R-0031', importe: 380000, desc: 'Seña por muestras de color y ensayo de rendimiento' });
    var DOC_honor = addDoc('ing', { prov: 'ing', d: -21, tipo: 'recibo', nro: 'R-0112', importe: 1400000, desc: 'Recibo de honorarios — visita de obra y relevamiento adicional' });
    // VEP de retenciones (SICORE): el importe se completa al final con lo realmente retenido en el período anterior
    var DOC_vep = addDoc('arca', { prov: 'arca', d: -3, tipo: 'vep', nro: 'VEP-0200004931', mod: 'A', importe: 0, desc: 'VEP SICORE — retenciones de Ganancias practicadas en el período anterior', obs: 'Vence en los próximos días. Pagar con la DDJJ presentada.' });

    // ── Pagos de presupuestos (pagos directos, sin factura) ───────────────
    var PR = function (k) { return PRES[PI[k]]; };
    // Hormigonera: cerrado al 100% en cuatro pagos
    pagarPres(PR('hormi'), { d: -88, pct: 0.30, cta: CTA_G, comp: true });
    pagarPres(PR('hormi'), { d: -61, pct: 0.25, cta: CTA_G });
    pagarPres(PR('hormi'), { d: -33, pct: 0.25, cta: CTA_S });
    pagarPres(PR('hormi'), { d: -9, pct: 0.20, cta: CTA_G, comp: true });
    // Hierros: anticipo + dos avances (72%)
    pagarPres(PR('hierro'), { d: -82, pct: 0.30, cta: CTA_G });
    pagarPres(PR('hierro'), { d: -47, pct: 0.25, cta: CTA_S });
    pagarPres(PR('hierro'), { d: -9, pct: 0.17, cta: CTA_G, comp: true });
    // Electricidad: Reg.94 + SUSS construcción
    pagarPres(PR('electro'), { d: -55, pct: 0.25, cta: CTA_G });
    pagarPres(PR('electro'), { d: -21, pct: 0.20, cta: CTA_G });
    // Ascensores: anticipo del 40%
    pagarPres(PR('ascen'), { d: -75, pct: 0.40, cta: CTA_S, comp: true });
    // Pintura: adelanto en efectivo
    pagarPres(PR('pintu'), { d: -14, pct: 0.20, mod: 'B' });
    // Seguros: cerrado en dos cuotas (exento de retenciones)
    pagarPres(PR('seg'), { d: -75, pct: 0.50, cta: CTA_G });
    pagarPres(PR('seg'), { d: -45, pct: 0.50, cta: CTA_G });
    // El resto de los presupuestos (ladrillera, aberturas, arquitectura) se paga a través de sus facturas; sanitarios no tiene pagos.

    // ── Pagos de facturas ───────────────────────────────────────────────
    pagarFact(F_hormi1, { d: -44, monto: 'saldo', cta: CTA_G });
    pagarFact(F_hormi2, { d: -3, monto: 10000000, cta: CTA_G });                       // pago parcial, queda saldo por vencer
    pagarFact(F_ladri1, { d: -40, monto: 'saldo', cta: CTA_S, comp: true });
    pagarFact(F_ladri2, { d: -6, monto: 12000000, cta: CTA_S });                       // parcial, vence mañana con saldo
    pagarFact(F_electro1, { d: -20, monto: 'saldo', cta: CTA_G, medio: 'Cheque', nro: '00487215', fr: true });   // con fondo de reparo
    pagarFact(F_abert1, { d: -50, monto: 'saldo', cta: CTA_S, comp: true });
    pagarFact(F_abert2, { d: -4, monto: 12000000, cta: CTA_G });
    pagarFact(F_pintu1, { d: -12, monto: 'saldo', cta: CTA_S, medio: 'Tarjeta corporativa', nro: '738214' });
    pagarFact(F_arq1, { d: -80, monto: 'saldo', cta: CTA_S });
    pagarFact(F_arq2, { d: -50, monto: 'saldo', cta: CTA_S });
    pagarFact(F_arq3, { d: -20, monto: 'saldo', cta: CTA_S, comp: true });
    pagarFact(F_ing1, { d: -27, monto: 'saldo', cta: CTA_G });
    pagarGrupo([F_equip1, F_equip3, F_equip2], { prov: 'equip', d: -20, cta: CTA_G, nro: '8812047731', comp: true });   // UNA transferencia para tres facturas
    pagarFact(F_clima1, { d: -10, monto: 12100, cta: CTA_U, nro: 'T-9904213' });                                     // anticipo en dólares por banco
    pagarFact(F_clima2, { d: -11, monto: 'saldo', mod: 'B' });                                                         // dólares en efectivo
    pagarFact(F_corra1, { d: -8, monto: 'saldo', mod: 'B' });
    pagarFact(F_vep1, { d: -9, monto: 'saldo', cta: CTA_G, medio: 'Débito', nro: 'VEP 0200004822', vepDocs: true });
    // comprobantes X
    pagarDoc(DOC_ticket, { d: -52, monto: 'saldo', mod: 'B' });
    pagarDoc(DOC_andamio, { d: -22, monto: 2325000, mod: 'B' });                                                       // parcial
    pagarDoc(DOC_sena, { d: -41, monto: 'saldo', mod: 'B' });
    pagarDoc(DOC_honor, { d: -21, monto: 'saldo', mod: 'B' });

    // ── Aplicación de los pagos en orden cronológico ──────────────────────
    var _opN = { A: 0, B: 0 };
    function proxOP(mod) { _opN[mod]++; return PREF_OP + mod + '-' + pad(_opN[mod], 5); }
    function saldoDe(x) { return Math.max(0, red2(x.importe - (x.pagado || 0) - (x._nc || 0))); }
    function datosPagoBanco(o, mod) {
        if (mod !== 'A') return { cuentaId: '', medioBancario: '', nroComprobante: '' };
        return { cuentaId: o.cta || CTA_G, medioBancario: o.medio || 'Transferencia', nroComprobante: o.nro || nroTransf() };
    }
    function adjComp(entry, o, prov, monto, mon) {
        if (!o.comp) return;
        var id = 'COMP-' + entry.pagoId, nom = 'Comprobante de transferencia ' + entry.nroComprobante + '.pdf';
        adjuntar(id, nom, pdfDoc('Comprobante de transferencia', ['Banco Galicia - Home banking empresas', 'Fecha: ' + o.fecha + '    Operación: ' + entry.nroComprobante],
            [['Ordenante', 'Constructora Los Álamos S.A.'], ['Beneficiario', prov.razonSocial], ['CBU destino', prov.cbu || ''], ['Alias', prov.alias || ''], ['Concepto', 'Pago a proveedores']],
            [['Importe transferido', (mon === 'USD' ? 'USD ' : '$ ') + fm(monto)]], 'Comprobante de ejemplo - versión de prueba. No tiene validez.'));
        entry.comprobanteId = id; entry.comprobanteNombre = nom; entry.comprobanteTipo = 'application/pdf';
    }
    PAGOS.sort(function (a, b) { return a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : a.seq - b.seq; });
    PAGOS.forEach(function (o) {
        var mod = o.mod || 'A', i, entry, rets, base, nro;
        if (o.tipo === 'pres') {
            var p = o.p;
            var capital = Math.round(p.presupuesto * o.pct);
            var mayores = 0, idxPago = 0;
            if (p._conIndice && p.indiceCACBase) {
                idxPago = cacEn(o.d);
                mayores = Math.round(capital * fraccion(p) * Math.max(idxPago / p.indiceCACBase - 1, 0));
                p.indiceCACActual = idxPago;
            }
            base = Math.round((capital + mayores) / 1.21);
            rets = mod === 'A' ? calcRets(PROVS.filter(function (x) { return x.razonSocial === p.proveedor; })[0], o.fecha, base) : [];
            nro = proxOP(mod);
            entry = { pagoId: 'PG-' + ymd(o.fecha) + '-' + pad(o.seq, 2), fecha: o.fecha, modalidad: mod, capital: capital, mayores: mayores,
                baseImponible: mod === 'A' ? base : 0, retenciones: rets.map(function (x) { return { codigo: x.codigo, monto: x.monto }; }),
                totalRet: red2(suma(rets, function (x) { return x.monto; })) };
            if (mod === 'A') ext(entry, datosPagoBanco(o, mod));
            entry.nroCorrelativo = nro; entry.tipoAB = mod;
            if (mod === 'A') adjComp(entry, o, PROVS.filter(function (x) { return x.razonSocial === p.proveedor; })[0], capital + mayores, 'ARS');
            (p.pagosHistorial = p.pagosHistorial || []).push(entry);
            p.reciboCorrelativo = nro;
        } else if (o.tipo === 'fact' || o.tipo === 'doc') {
            var f = o.f, prov = f._pv, esDoc = o.tipo === 'doc';
            var monto = o.monto === 'saldo' ? saldoDe(f) : Math.min(o.monto, saldoDe(f));
            if (mod === 'A') {
                base = f.netoGravado > 0 ? Math.round(monto * f.netoGravado / f.importe) : Math.round(monto / 1.21);
                rets = (f.sinRetencion || f.esVEP) ? [] : calcRets(prov, o.fecha, base);
            } else { base = 0; rets = []; }
            nro = proxOP(mod);
            entry = { pagoId: 'FD-' + ymd(o.fecha) + '-' + pad(o.seq, 2), fecha: o.fecha, modalidad: mod, monto: monto, baseImponible: base,
                retenciones: rets, totalRet: red2(suma(rets, function (x) { return x.monto; })) };
            if (o.fr && f.fondoReparoPct > 0) { entry.fondoReparo = red2(monto * f.fondoReparoPct / 100); entry.fondoReparoPct = f.fondoReparoPct; }
            if (mod === 'A') ext(entry, datosPagoBanco(o, mod));
            entry.nroCorrelativo = nro; entry.tipoAB = mod;
            if (mod === 'A') adjComp(entry, o, prov, monto, f._mon || 'ARS');
            if (o.vepDocs) {
                var ddjj = adjuntar('DDJJ-' + entry.pagoId, 'DDJJ F.931 presentada.pdf', pdfDoc('Declaración jurada F.931', ['Constructora Los Álamos S.A.', 'Período: mes anterior    Presentada: ' + o.fecha],
                    [['Remuneraciones imponibles', '$ ' + fm(41230000)], ['Contribuciones patronales', '$ ' + fm(7113500)], ['Aportes de los trabajadores', '$ ' + fm(7040000)]],
                    [['Total a ingresar', '$ ' + fm(f.importe)]], 'Constancia de ejemplo - versión de prueba.'));
                var acuse = adjuntar('ACUSE-' + entry.pagoId, 'Acuse de presentación F.931.pdf', pdfDoc('Acuse de presentación', ['Formulario 931 - Aplicativo SICOSS', 'Presentación aceptada: ' + o.fecha],
                    [['Constancia N°', '0200004822'], ['Estado', 'Presentada y aceptada']], [['VEP generado', '$ ' + fm(f.importe)]], 'Constancia de ejemplo - versión de prueba.'));
                entry.ddjjId = ddjj.id; entry.ddjjNombre = ddjj.nombre; entry.ddjjTipo = ddjj.tipo;
                entry.acuseId = acuse.id; entry.acuseNombre = acuse.nombre; entry.acuseTipo = acuse.tipo;
            }
            (f.pagosHistorial = f.pagosHistorial || []).push(entry);
            f.pagado = red2((f.pagado || 0) + monto);
        } else if (o.tipo === 'grupo') {
            var gprov = PV[o.prov], gid = 'GP-' + ymd(o.fecha) + '-' + pad(o.seq, 2);
            var xs = o.fs.map(function (f) { var pend = saldoDe(f); return { f: f, pend: pend, neto: Math.round(pend * f.netoGravado / f.importe) }; });
            var total = suma(xs, function (x) { return x.pend; }), baseT = suma(xs, function (x) { return x.neto; });
            rets = mod === 'A' ? calcRets(gprov, o.fecha, baseT) : [];
            nro = proxOP(mod);
            var bancoG = datosPagoBanco(o, mod), acumReg = [];
            xs.forEach(function (x, k) {
                // cada régimen se reparte entre las facturas en proporción a su monto; la última absorbe el redondeo
                var retsF = rets.map(function (rr, j) {
                    var prev = acumReg[j] || 0;
                    var m = (k === xs.length - 1) ? red2(rr.monto - prev) : red2(rr.monto * (x.pend / total));
                    acumReg[j] = red2(prev + m);
                    return { codigo: rr.codigo, desc: rr.desc, monto: m };
                });
                var e = { pagoId: 'FD-' + ymd(o.fecha) + '-' + pad(o.seq, 2) + '-' + k, fecha: o.fecha, modalidad: mod, monto: x.pend, baseImponible: x.neto,
                    retenciones: retsF, totalRet: red2(suma(retsF, function (z) { return z.monto; })), nroCorrelativo: nro, tipoAB: mod, grupoPagoId: gid };
                ext(e, bancoG);
                if (k === 0) adjComp(e, o, gprov, total, 'ARS');
                else if (o.comp && xs[0]) { var e0 = xs[0].f.pagosHistorial[xs[0].f.pagosHistorial.length - 1]; e.comprobanteId = e0.comprobanteId; e.comprobanteNombre = e0.comprobanteNombre; e.comprobanteTipo = e0.comprobanteTipo; }
                (x.f.pagosHistorial = x.f.pagosHistorial || []).push(e);
                x.f.pagado = red2((x.f.pagado || 0) + x.pend);
            });
        }
    });

    // ── Cierre: estados, pago-espejo en los presupuestos y totales ───────────
    function retenido(x) { return suma(x.pagosHistorial || [], function (p) { return p.totalRet || 0; }); }
    function estadoDe(x) {
        if (x.esNotaCredito) return 'pagada';
        if (x.importe > 0 && saldoDe(x) <= 0) return 'pagada';
        return (x.pagado > 0 || retenido(x) > 0) ? 'parcial' : 'pendiente';
    }
    function totalesPres(p) {
        var h = p.pagosHistorial || [];
        p.pagado = red2(suma(h, function (x) { return ((x.capital || 0) + (x.mayores || 0) + (x.canjeCapital || 0)) || (x.montoPagado || 0); }));
        p.pagadoPresupuesto = red2(suma(h, function (x) { return (x.capital || 0) + (x.canjeCapital || 0); }));
        p.pagadoMayores = red2(suma(h, function (x) { return x.mayores || 0; }));
    }
    FACTS.forEach(function (f) { f.estado = estadoDe(f); });
    // El «pago-espejo» (ver CLAUDE.md): una entrada sintética en el presupuesto con el total pagado de la factura aplicada.
    FACTS.concat(DOCS).forEach(function (x) {
        if (x.presupuestoIdx == null || !(x.pagado > 0)) return;
        var p = PRES[x.presupuestoIdx];
        (p.pagosHistorial = p.pagosHistorial || []).push({
            pagoId: 'FACT-' + x.id, origenFacturaId: x.id, fecha: x.fecha, modalidad: 'A', capital: x.pagado, mayores: 0, baseImponible: 0,
            retenciones: [], totalRet: 0, cuentaId: '', medioBancario: '', nroComprobante: x.numero || '', nroCorrelativo: '', tipoAB: ''
        });
    });
    PRES.forEach(function (p) {
        totalesPres(p);
        // los presupuestos sin índice no actualizan mayores costos; los que lo tienen quedan al índice de HOY (como «Actualizar CAC»)
        if (p._conIndice && !(p.pagado >= p.presupuesto)) p.indiceCACActual = cacEn(0);
        // cada presupuesto viene con su PDF
        var adj = adjuntar('PRES-' + p.id, 'Presupuesto ' + p.proveedor + '.pdf', pdfDoc('Presupuesto', [p.proveedor, 'Fecha: ' + p.fecha + '    Obra: Edificio Los Álamos'],
            p.items.map(function (it) { return [it.detalle + (it.cantidad > 1 ? '  (x ' + it.cantidad + ')' : ''), '$ ' + fm(it.subtotal)]; }),
            [['Total presupuestado', '$ ' + fm(p.presupuesto)]], 'Presupuesto de ejemplo - versión de prueba.'));
        p.docId = adj.id; p.docNombre = adj.nombre; p.docTipo = adj.tipo;
    });
    // VEP de SICORE: lo retenido (Ganancias, sin SUSS) en el período anterior (los 30 días previos al mes en curso, aprox.)
    var sicore = 0;
    FACTS.concat(PRES).forEach(function (x) { (x.pagosHistorial || []).forEach(function (p) { (p.retenciones || []).forEach(function (rr) { if (String(rr.codigo).indexOf('SUSS') !== 0 && p.fecha >= D(-58) && p.fecha <= D(-28)) sicore += rr.monto || 0; }); }); });
    DOC_vep.importe = Math.max(480000, Math.round(sicore / 100) * 100);
    DOCS.forEach(function (d) {
        // estado y adjunto de cada comprobante X
        d.pagado = red2(d.pagado || 0);
        var a = adjuntar('ADJ-' + d.id, (d.tipo === 'ticket' ? 'Ticket ' : d.tipo === 'vep' ? 'VEP ' : 'Recibo ') + (d.numero || d.id) + '.pdf', pdfDoc(d.tipo === 'ticket' ? 'Ticket' : d.tipo === 'vep' ? 'Volante Electrónico de Pago' : 'Recibo',
            [d._pv.razonSocial, 'Fecha: ' + d.fecha + '    N° ' + (d.numero || '')], [[d.descripcion, '$ ' + fm(d.importe)]], [['Total', '$ ' + fm(d.importe)]], 'Comprobante de ejemplo - versión de prueba.'));
        d.adjuntoId = a.id; d.adjuntoNombre = a.nombre; d.adjuntoTipo = a.tipo;
    });
    // PDF de cada factura (la factura A discrimina el IVA)
    FACTS.forEach(function (f) {
        var sim = f._mon === 'USD' ? 'USD ' : '$ ';
        // el IVA va abajo, en los totales; en el cuerpo sólo los renglones de detalle
        var filas = f.items.filter(function (it) { return it.detalle !== 'IVA 21%'; }).map(function (it) { return [it.detalle + (it.cantidad > 1 ? '  (x ' + it.cantidad + ')' : ''), sim + fm(it.subtotal)]; });
        var tot = f.esVEP ? [['Total a pagar', sim + fm(f.importe)]] : (f.tipoComprobante === 'A' ? [['Neto gravado', sim + fm(f.netoGravado)], ['IVA 21%', sim + fm(f.importe - f.netoGravado)], ['TOTAL', sim + fm(f.importe)]] : [['TOTAL', sim + fm(f.importe)]]);
        var a = adjuntar('FACT-' + f.id, (f.esVEP ? 'VEP ' : 'Factura ' + f.tipoComprobante + ' ') + f.numero + '.pdf',
            pdfDoc(f.esVEP ? 'Volante Electrónico de Pago' : 'FACTURA ' + f.tipoComprobante, [f._pv.razonSocial + (f._pv.cuit ? '    CUIT ' + f._pv.cuit : ''), 'N° ' + f.numero + '    Fecha: ' + f.fecha,
                'Cliente: Constructora Los Álamos S.A.    CUIT 30-71234567-8'], filas, tot, f.cae ? 'CAE ' + f.cae + '    Vto. CAE ' + f.vencimientoCae + '    (comprobante de ejemplo - versión de prueba)' : 'Comprobante de ejemplo - versión de prueba.'));
        f.docId = a.id; f.docNombre = a.nombre; f.docTipo = a.tipo;
    });
    NC.forEach(function (n) {
        var a = adjuntar('NC-PDF-' + n.id, 'Nota de crédito ' + n.numero + '.pdf', pdfDoc('NOTA DE CREDITO A', [n.proveedor, 'N° ' + n.numero + '    Fecha: ' + n.fecha],
            [['Bonificación por faltante de 1,1 t en la entrega', '$ ' + fm(n.importe)]], [['TOTAL', '$ ' + fm(n.importe)]], 'Comprobante de ejemplo - versión de prueba.'));
        n.docId = a.id; n.docNombre = a.nombre; n.docTipo = a.tipo;
    });

    // ── Crédito a favor (anticipo no ejecutado) ────────────────────────────
    var CREDITOS = [{ id: 'CR-demo-01', proveedor: PV.abert.razonSocial, monto: 1850000, usado: 0, moneda: 'ARS', fecha: D(-33), origen: 'anticipo',
        ref: 'Saldo a favor por 4 aberturas anuladas del pedido original' }];

    // ── Limpieza de las marcas internas y escritura ───────────────────────
    function limpio(x) { var o = {}; for (var k in x) { if (Object.prototype.hasOwnProperty.call(x, k) && k.charAt(0) !== '_') o[k] = x[k]; } return o; }
    var provsOut = PROVS.map(function (p) { var o = limpio(p); Object.keys(o).forEach(function (k) { if (o[k] === '' ) delete o[k]; }); return o; });
    // los proveedores sin cuit/teléfono simplemente no llevan la clave
    var gruposObj = {}, gruposVistos = {};
    PROVS.forEach(function (p) { if (p.grupo && !gruposVistos[p.grupo]) { gruposVistos[p.grupo] = 1; } });
    Object.keys(gruposVistos).sort().forEach(function (g) { gruposObj['grp_' + g.toLowerCase().replace(/[^a-z]+/g, '_')] = g; });

    DEMO.set(r, 'global/proveedores', DEMO.porId(provsOut));
    DEMO.set(r, 'global/grupos', gruposObj);
    DEMO.set(r, 'global/creditosProveedor', DEMO.porId(CREDITOS));
    var contProv = {};
    Object.keys(_nroProv).forEach(function (id) { contProv[id] = _nroProv[id]; });
    contProv[PV.arca.id] = Math.max(_nroProv[PV.arca.id] || 0, 2);
    DEMO.set(r, 'global/contadoresProvComp', contProv);

    DEMO.set(r, DEMO.base + '/datos', DEMO.porId(PRES.map(limpio)));
    DEMO.set(r, DEMO.base + '/facturas', DEMO.porId(FACTS.concat(NC).sort(function (a, b) { return a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : (a.id < b.id ? -1 : 1); }).map(limpio)));
    var docsObj = DEMO.porId(DOCS.map(limpio));
    Object.keys(ADJ).forEach(function (id) { docsObj[id] = ADJ[id]; });
    DEMO.set(r, DEMO.base + '/documentos', docsObj);
    DEMO.set(r, DEMO.base + '/contadorOP', _opN.A + _opN.B);
    DEMO.set(r, DEMO.base + '/contadoresComprobante/OP_A', _opN.A);
    DEMO.set(r, DEMO.base + '/contadoresComprobante/OP_B', _opN.B);
});
