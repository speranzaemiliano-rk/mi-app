/* Versión de prueba — datos de ejemplo: ingresos, caja, bancos y ventas.
   Siembra, en el proyecto principal (Edificio Los Álamos): cuentas bancarias, movimientos de caja y de banco (ingGeneral, con dos
   operaciones de compra/venta de dólares como pares), ventas de unidades funcionales con su plan de cuotas y sus cobros,
   comprobantes emitidos, desarrollos, aportantes y metros de canje, más el tipo de cambio y el índice CAC.
   Todo es inventado. Las fechas son relativas a hoy (DEMO.dia / DEMO.fecha), así que la demo siempre se ve «de esta semana». */
(window.DEMO_SEEDS = window.DEMO_SEEDS || []).push(function (r) {
    var B = DEMO.base, TC = DEMO.TC;
    var GAL = DEMO.CTA_GALICIA, SAN = DEMO.CTA_SANTANDER, GALUSD = DEMO.CTA_GALICIA_USD;
    var PREF = 'CLA-EDIFIC';              // <código de empresa>-<código de proyecto> que arma obtenerProximoComprobante()
    var HOY = DEMO.dia(0);
    var ALAMOS = 'DES-ALAMOS', PARQUE = 'DES-PARQUE', NOGAL = 'DES-NOGAL';

    // ── Fechas ────────────────────────────────────────────────────────────
    function dos(n) { return ('0' + n).slice(-2); }
    function aIso(d) { return d.getFullYear() + '-' + dos(d.getMonth() + 1) + '-' + dos(d.getDate()); }
    function deIso(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
    function sumaDias(s, n) { var d = deIso(s); d.setDate(d.getDate() + n); return aIso(d); }
    function diasEntre(a, b) { return Math.round((deIso(b) - deIso(a)) / 86400000); }
    function mesesAtras(s) { var h = deIso(HOY), d = deIso(s); return (h.getFullYear() - d.getFullYear()) * 12 + h.getMonth() - d.getMonth(); }
    function dia(n) { return DEMO.dia(n); }

    // Dólar de cada fecha: sube ~1,1 % por mes hasta el valor de hoy (el de DEMO.TC)
    function tcEn(s) { return Math.round(TC / Math.pow(1.011, Math.max(0, diasEntre(s, HOY)) / 30.4)); }

    // Índice CAC mensual (sube entre 1,7 y 2,4 % por mes). cacDe(-1) = último índice ya publicado (el mes anterior al actual).
    var CAC_VAR = [2.1, 1.9, 2.3, 1.8, 2.0, 2.2, 1.7, 2.1, 1.9, 2.4, 2.0, 1.8];
    var CAC_ULT = 24185.60;
    function cacDe(n) {
        var v = CAC_ULT;
        for (var k = -1; k > n; k--) v = v / (1 + CAC_VAR[(-k - 1) % CAC_VAR.length] / 100);
        return Math.round(v * 100) / 100;
    }
    // Índice que corresponde a una fecha: el del mes anterior (el que ya estaba publicado ese día)
    function cacPara(s) { return cacDe(Math.min(-mesesAtras(s) - 1, -1)); }

    // ── Numeración de recibos ─────────────────────────────────────────────
    // Misma forma que obtenerProximoComprobante(): <EMP>-<PROY>-[SERIE-]<A|B>-00001, un contador por serie y por A/B.
    // Se numera al final, en orden de fecha, para que los números crezcan con el tiempo.
    var NUM = [];
    function numerar(obj, campo, tipoAB, serie) { NUM.push({ o: obj, c: campo, t: tipoAB === 'A' ? 'A' : 'B', s: serie || '', f: obj.fecha || '', n: NUM.length }); }
    function asignarNumeros() {
        NUM.sort(function (a, b) { return a.f < b.f ? -1 : a.f > b.f ? 1 : a.n - b.n; });
        var cont = {};
        NUM.forEach(function (x) {
            var key = x.s ? x.s + '_' + x.t : x.t;
            cont[key] = (cont[key] || 0) + 1;
            x.o[x.c] = PREF + '-' + (x.s ? x.s + '-' : '') + x.t + '-' + ('0000' + cont[key]).slice(-5);
        });
        Object.keys(cont).forEach(function (k) { DEMO.set(r, B + '/contadoresComprobante/' + k, cont[k]); });
    }

    // ── Cuentas bancarias ─────────────────────────────────────────────────
    // `saldo` es el saldo de apertura: el saldo actual de cada cuenta es esa apertura + todos los movimientos.
    var CUENTAS = [
        { id: GAL, banco: 'Banco Galicia', tipo: 'Cuenta Corriente', alias: 'ALAMOS.OBRA.GALICIA', cbu: '0070999099990000123456',
          moneda: 'ARS', saldo: 18400000, notas: 'Cuenta operativa de la obra: cobranzas, pago a proveedores y cuota del préstamo.', empresaId: DEMO.EMP },
        { id: SAN, banco: 'Banco Santander', tipo: 'Caja de Ahorros ARS', alias: 'ALAMOS.AHORRO.SANTANDER', cbu: '0720999099990000654321',
          moneda: 'ARS', saldo: 215000000, notas: 'Fondo de reserva y plazos fijos de 30 días; paga a parte de los proveedores.', empresaId: DEMO.EMP },
        { id: GALUSD, banco: 'Banco Galicia', tipo: 'Caja de Ahorros USD', alias: 'ALAMOS.DOLARES.GALICIA', cbu: '0070999099990000987654',
          moneda: 'USD', saldo: 20000, notas: 'Cobranzas de las unidades en dólares.', empresaId: DEMO.EMP }
    ];

    // ── Desarrollos, aportantes y metros de canje ─────────────────────────
    var DESARROLLOS = [
        { id: ALAMOS, nombre: 'Edificio Los Álamos', moneda: 'USD', m2Totales: 3200, valorTerreno: 1100000, m2Vendibles: 2450,
          costoM2Construccion: 850, costos: 2720000, valorM2Vendible: 2300,
          obs: 'Edificio de 8 pisos con 34 unidades, cocheras y amenities (SUM, parrilla y terraza). Entrega prevista en 14 meses.' },
        { id: PARQUE, nombre: 'Residencias del Parque', moneda: 'USD', m2Totales: 2100, valorTerreno: 780000, m2Vendibles: 1620,
          costoM2Construccion: 880, costos: 1848000, valorM2Vendible: 2450,
          obs: 'Torre de 6 pisos frente a la plaza. Pozo y estructura completos; en preventa avanzada.' },
        { id: NOGAL, nombre: 'Casas del Nogal', moneda: 'USD', m2Totales: 640, valorTerreno: 205000, m2Vendibles: 520,
          costoM2Construccion: 980, costos: 627200, valorM2Vendible: 2900,
          obs: 'Ocho casas en dúplex sobre lote propio. Obra por etapas, venta a terminar.' }
    ];
    var APORTANTES = [
        { id: 'APT-RINALDI-R', fecha: dia(-330), nombre: 'Ricardo Rinaldi', desarrolloId: ALAMOS, moneda: 'USD', capitalAportado: 170000,
          baseRentabilidad: 'porcentaje', baseMontoPct: 'ganancia', rentabilidadPct: 12, m2Asignados: 0, valorM2Asignado: 0,
          fechaVencimiento: DEMO.fecha(14, 20), obs: 'Socio fundador. Rentabilidad sobre la ganancia estimada del desarrollo.' },
        { id: 'APT-RINALDI-L', fecha: dia(-322), nombre: 'Lucía Rinaldi', desarrolloId: ALAMOS, moneda: 'USD', capitalAportado: 58000,
          baseRentabilidad: 'm2', baseMontoPct: 'ventaTotal', rentabilidadPct: 0, m2Asignados: 25, valorM2Asignado: 2300,
          fechaVencimiento: DEMO.fecha(14, 20), obs: 'Cobra su aporte en 25 m² de unidades a valor de lista.' },
        { id: 'APT-FONDONORTE', fecha: dia(-210), nombre: 'Fondo Norte Capital S.A.', desarrolloId: ALAMOS, moneda: 'USD', capitalAportado: 85000,
          baseRentabilidad: 'porcentaje', baseMontoPct: 'ganancia', rentabilidadPct: 5, m2Asignados: 0, valorM2Asignado: 0,
          fechaVencimiento: DEMO.fecha(18, 5), obs: 'Inversor institucional. Informe trimestral de avance.' },
        { id: 'APT-RUIZ', fecha: dia(-170), nombre: 'Pablo Ruiz', desarrolloId: PARQUE, moneda: 'USD', capitalAportado: 62000,
          baseRentabilidad: 'porcentaje', baseMontoPct: 'ventaTotal', rentabilidadPct: 1.8, m2Asignados: 0, valorM2Asignado: 0,
          fechaVencimiento: DEMO.fecha(18, 5), obs: '' },
        { id: 'APT-IBARRA', fecha: dia(-240), nombre: 'Daniel Ibarra', desarrolloId: NOGAL, moneda: 'USD', capitalAportado: 55000,
          baseRentabilidad: 'porcentaje', baseMontoPct: 'ganancia', rentabilidadPct: 12, m2Asignados: 0, valorM2Asignado: 0,
          fechaVencimiento: DEMO.fecha(10, 28), obs: 'Aporte para la compra del lote.' }
    ];
    var METROS = [];   // se completa con los canjes de las ventas y dos movimientos manuales

    // ── Ventas de unidades funcionales ────────────────────────────────────
    var VENTAS = [];
    function vencimientos(mes1, d, nc, paso) { var a = []; for (var i = 0; i < nc; i++) a.push(DEMO.fecha(mes1 + i * (paso || 1), d)); return a; }
    function ultimaVencida(fechas) { var u = -1; fechas.forEach(function (f, i) { if (f <= HOY) u = i; }); return u; }
    function fechaPago(venc, i) { var f = sumaDias(venc, [0, 1, 3, -1, 2, 0][i % 6]); return f > HOY ? HOY : f; }

    // 'E' = efectivo; cualquier otro valor es el id de la cuenta bancaria donde entró
    function cobroV(v, f, comp, monto, med, o) {
        o = o || {};
        var c = { fecha: f, comp: comp, monto: monto, cac: o.cac || 0, ref: o.ref || '', tipoAB: 'B', tc: tcEn(f) };
        if (o.nroCuota) c.nroCuota = o.nroCuota;
        if (med && med !== 'E') { c.tipoAB = 'A'; c.cuentaId = med; }
        numerar(c, 'nroRecibo', c.tipoAB);
        v.cobrosHistorial.push(c);
        return c;
    }
    // Cobro de m² (canje): monto 0 y el valor en valorCanje, no mueve la caja. Suma los m² al desarrollo de origen.
    function cobroCanje(v, f, desId, cant, valorM2, ref) {
        var c = { fecha: f, comp: 'usd', monto: 0, valorCanje: cant * valorM2, formaPago: 'canje', canjeTipo: 'm2', canjeDesarrolloId: desId,
                  canjeCantidadM2: cant, canjeValorM2: valorM2, canjeProveedor: '', ref: ref, tipoAB: 'B', inicial: true };
        numerar(c, 'nroRecibo', 'B');
        v.cobrosHistorial.push(c);
        METROS.push({ id: 'MC-' + v.id.replace(/^vta_/, ''), fecha: f, tipo: 'entrada', desarrolloId: desId, cantidadM2: cant, valorM2: valorM2, moneda: 'USD',
                      valorTotal: cant * valorM2, contraparte: v.comprador, referencia: 'Venta UF ' + v.uf, origen: 'venta', ventaId: v.id });
        return c;
    }
    // Totales cobrados a partir del historial (mismo criterio que _recalcCobrosVenta de la app)
    function recalc(v) {
        var terreno = 0, constr = 0, usd = 0, ars = 0, coch = 0;
        v.cobrosHistorial.forEach(function (c) {
            var m = (c.monto || 0) + (c.valorCanje || 0);
            if (c.comp === 'usd') { if (v.modalidad === 'cuotas_cac') terreno += m; else usd += m; }
            else if (c.comp === 'cuota') constr += m;
            else if (c.comp === 'ars_general' || c.comp === 'cuota_ars_simple') ars += m;
            else if (c.comp === 'cuota_usd_simple') usd += m;
            else if (c.comp === 'cochera_ars' || c.comp === 'cochera_usd') coch += m;
        });
        if (v.modalidad === 'cuotas_cac') { v.terrenoCobrado = terreno; v.construccionCobrado = constr; v.cacActual = cacDe(-1); }
        if (v.modalidad === 'total_usd' || v.modalidad === 'mixto') v.cobradoUSD = usd;
        if (v.modalidad === 'total_ars' || v.modalidad === 'mixto') v.cobradoARS = ars;
        if (v.incluyeCochera && v.cocheraValorTipo === 'aparte') v.cocheraCobrado = coch;
        v.cobrosHistorial.sort(function (a, b) { return a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0; });
        return v;
    }
    function ventaBase(o, mod) {
        return { id: o.id, uf: o.uf, tipo: o.tipo || 'departamento', comprador: o.comprador, modalidad: mod, fecha: o.fecha, obs: o.obs || '',
                 acuerdo: o.acuerdo || '', desarrolloId: ALAMOS, m2Unidad: o.m2, m2Amenities: o.m2a || 0, incluyeCochera: false, cocheraNro: '', cobrosHistorial: [] };
    }
    // Terreno en dólares + construcción en cuotas en pesos ajustadas por CAC
    function ventaCAC(o) {
        var v = ventaBase(o, 'cuotas_cac');
        var fechas = vencimientos(o.mes1, o.dia, o.nc);
        v.terrenoMoneda = 'usd'; v.cuotasMoneda = 'ars_cac'; v.terrenoUSD = o.terreno; v.terrenoCobrado = 0;
        v.construccionBase = o.base; v.cacBase = cacPara(o.fecha); v.cacDesde = 1; v.construccionCobrado = 0; v.cacActual = 0;
        v.cuota1Venc = fechas[0]; v.nroCuotas = o.nc; v.cuotaFechas = fechas;
        (o.terrenoCobros || []).forEach(function (t) { if (t.canje) cobroCanje(v, t.f, PARQUE, t.canje, 2450, 'Canje de m² (carga de UF)'); else cobroV(v, t.f, 'usd', t.monto, t.m, { ref: t.ref }); });
        var u = ultimaVencida(fechas);
        for (var i = 0; i <= u; i++) {
            if (o.debe && i === u) continue;            // la última cuota vencida queda sin cobrar
            var f = fechaPago(fechas[i], i), cac = cacPara(f);
            cobroV(v, f, 'cuota', Math.round(o.base * cac / v.cacBase), o.medioCuota(i), { cac: cac, nroCuota: i + 1, ref: 'Cuota ' + (i + 1) + '/' + o.nc });
        }
        if (o.cochera) {                                // cochera con valor aparte, en pesos y en cuotas iguales
            var c = o.cochera, cf = vencimientos(c.mes1, c.dia, c.nc, c.paso), cm = c.valor / c.nc;
            v.incluyeCochera = true; v.cocheraNro = c.nro; v.cocheraValorTipo = 'aparte'; v.cocheraMoneda = 'ars'; v.cocheraValor = c.valor;
            v.cocheraFormaPago = 'cuotas'; v.cocheraCobrado = 0; v.cocheraNroCuotas = c.nc; v.cocheraFecha1 = cf[0]; v.cocheraFechas = cf;
            var cu = ultimaVencida(cf);
            for (var j = 0; j <= cu; j++) cobroV(v, fechaPago(cf[j], j + 2), 'cochera_ars', cm, c.medioCuota(j), { nroCuota: j + 1, ref: 'Cochera ' + c.nro + ' · cuota ' + (j + 1) + '/' + c.nc });
        }
        return recalc(v);
    }
    // Precio en pesos pagado en cuotas fijas (sin ajuste); opcionalmente con una parte en dólares (mixto)
    function ventaSimple(o) {
        var v = ventaBase(o, o.mod), montos = [], acum = 0, i;
        for (i = 0; i < o.nc; i++) { var m = (i === o.nc - 1) ? o.totalARS - acum : Math.round(o.totalARS / o.nc); montos.push(m); acum += m; }
        var fechas = [];
        if (o.cadaDias) for (i = 0; i < o.nc; i++) fechas.push(sumaDias(o.primera, o.cadaDias * i)); else fechas = vencimientos(o.mes1, o.dia, o.nc);
        v.precioARS = o.totalARS; v.cobradoARS = 0;
        if (o.mod === 'mixto') { v.precioUSD = o.precioUSD; v.cobradoUSD = 0; }
        v.cuotasSimple = { activo: true, moneda: 'ars', nro: o.nc, fecha1: fechas[0], fechas: fechas, montos: montos, intervaloDias: o.cadaDias || 0 };
        (o.usdCobros || []).forEach(function (t) { cobroV(v, t.f, 'usd', t.monto, t.m, { ref: t.ref }); });
        var u = ultimaVencida(fechas);
        for (i = 0; i <= u; i++) {
            if (o.debe && i === u) continue;
            cobroV(v, fechaPago(fechas[i], i), 'cuota_ars_simple', montos[i], o.medioCuota(i), { nroCuota: i + 1, ref: 'Cuota ' + (i + 1) + '/' + o.nc });
        }
        return recalc(v);
    }
    // Precio total en dólares, cobrado en pagos sueltos
    function ventaUSD(o) {
        var v = ventaBase(o, 'total_usd');
        v.precioUSD = o.precio; v.cobradoUSD = 0;
        o.cobros.forEach(function (t) { cobroV(v, t.f, 'usd', t.monto, t.m, { ref: t.ref }); });
        return recalc(v);
    }

    // 1A · terreno en 4 pagos (el último, de USD 8.000, contra escritura) + 36 cuotas CAC; con la cuota de este mes vencida
    VENTAS.push(ventaCAC({ id: 'vta_1a', uf: '1A', comprador: 'Federico Salgado', fecha: DEMO.fecha(-13, 12), m2: 52, m2a: 8,
        acuerdo: 'Terreno en 4 pagos en dólares (el último contra escritura) y construcción en 36 cuotas ajustadas por CAC', terreno: 41000,
        terrenoCobros: [{ f: DEMO.fecha(-13, 12), monto: 8000, m: 'E', ref: 'Seña en efectivo' },
                        { f: DEMO.fecha(-12, 3), monto: 13000, m: GALUSD, ref: 'Transferencia en dólares' },
                        { f: DEMO.fecha(-10, 20), monto: 12000, m: GALUSD, ref: 'Transferencia en dólares' }],
        nc: 36, base: 2550000, mes1: -12, dia: 10, medioCuota: function (i) { return i % 4 === 3 ? 'E' : GAL; }, debe: true }));
    // 1B · contado en dólares, escriturada
    VENTAS.push(ventaUSD({ id: 'vta_1b', uf: '1B', comprador: 'María Inés Duarte', fecha: DEMO.fecha(-16, 5), m2: 74, m2a: 10, obs: 'Escriturada.',
        acuerdo: 'USD 192.000: seña, anticipo y saldo contra escritura', precio: 192000,
        cobros: [{ f: DEMO.fecha(-16, 5), monto: 15000, m: 'E', ref: 'Seña' },
                 { f: DEMO.fecha(-15, 12), monto: 60000, m: GALUSD, ref: 'Boleto de compraventa' },
                 { f: DEMO.fecha(-5, 18), monto: 117000, m: GALUSD, ref: 'Saldo contra escritura' }] }));
    // 2A · parte en dólares + 6 cuotas fijas en pesos cada 60 días, con una cuota vencida
    VENTAS.push(ventaSimple({ id: 'vta_2a', uf: '2A', comprador: 'Agustina Peralta y Lucas Domínguez', fecha: DEMO.fecha(-9, 8), m2: 55, m2a: 8,
        acuerdo: 'USD 92.000 (saldo de USD 18.000 contra escritura) y $ 54.000.000 en 6 cuotas fijas cada 60 días', mod: 'mixto', precioUSD: 92000, totalARS: 54000000,
        usdCobros: [{ f: DEMO.fecha(-9, 8), monto: 18000, m: 'E', ref: 'Seña' }, { f: DEMO.fecha(-8, 20), monto: 56000, m: GALUSD, ref: 'Boleto de compraventa' }],
        nc: 6, cadaDias: 60, primera: dia(-150), medioCuota: function (i) { return i === 0 ? 'E' : GAL; }, debe: true }));
    // L-01 · local en dólares, pagos sueltos con saldo pendiente
    VENTAS.push(ventaUSD({ id: 'vta_l01', uf: 'L-01', tipo: 'local', comprador: 'Sabores del Sur S.A.S.', fecha: dia(-210), m2: 96, m2a: 0,
        acuerdo: 'USD 248.000: seña, anticipo, refuerzos y saldo contra escritura', obs: 'Saldo contra escritura estimada en 4 meses.', precio: 248000,
        cobros: [{ f: dia(-210), monto: 20000, m: 'E', ref: 'Seña' }, { f: dia(-198), monto: 80000, m: GALUSD, ref: 'Boleto de compraventa' },
                 { f: dia(-95), monto: 22000, m: GALUSD, ref: 'Refuerzo 1' }, { f: dia(-41), monto: 20000, m: 'E', ref: 'Refuerzo 2 en efectivo' }] }));
    // 3A · todo en pesos: anticipo del 40 %, segundo pago del 25 % y saldo contra escritura
    (function () {
        var v = ventaBase({ id: 'vta_3a', uf: '3A', comprador: 'Nicolás Echeverría', fecha: dia(-110), m2: 38, m2a: 6,
            acuerdo: '$ 118.800.000: 40 % al boleto, 25 % a los 60 días y 35 % contra escritura', obs: 'Escritura estimada en 3 meses.' }, 'total_ars');
        v.precioARS = 118800000; v.cobradoARS = 0;
        cobroV(v, dia(-108), 'ars_general', 47520000, GAL, { ref: 'Anticipo 40 %' });
        cobroV(v, dia(-48), 'ars_general', 29700000, SAN, { ref: 'Segundo pago 25 %' });
        VENTAS.push(recalc(v));
    })();
    // 3B · terreno + 30 cuotas CAC + cochera aparte en 8 cuotas trimestrales
    VENTAS.push(ventaCAC({ id: 'vta_3b', uf: '3B', comprador: 'Sofía Bianchi', fecha: DEMO.fecha(-9, 10), m2: 78, m2a: 12,
        acuerdo: 'Terreno en 3 pagos (el último contra posesión), 30 cuotas CAC y cochera G-14 en 8 cuotas trimestrales', terreno: 56000,
        terrenoCobros: [{ f: DEMO.fecha(-9, 10), monto: 16000, m: 'E', ref: 'Seña en efectivo' }, { f: DEMO.fecha(-8, 2), monto: 30000, m: GALUSD, ref: 'Transferencia en dólares' }],
        nc: 30, base: 4900000, mes1: -8, dia: 15, medioCuota: function (i) { return i % 5 === 4 ? 'E' : (i % 2 ? SAN : GAL); },
        cochera: { nro: 'G-14', valor: 28800000, nc: 8, mes1: -6, paso: 3, dia: 20, medioCuota: function (j) { return j % 2 ? 'E' : GAL; } } }));
    // 4A · vendida hace poco, recién empieza a pagar
    VENTAS.push(ventaCAC({ id: 'vta_4a', uf: '4A', comprador: 'Gonzalo Ferreyra', fecha: dia(-65), m2: 55, m2a: 8,
        acuerdo: 'Terreno en 2 pagos y 48 cuotas ajustadas por CAC', terreno: 46000,
        terrenoCobros: [{ f: dia(-65), monto: 6000, m: 'E', ref: 'Seña' }, { f: dia(-63), monto: 20000, m: 'E', ref: 'Anticipo en dólares' }],
        nc: 48, base: 2200000, mes1: -1, dia: 10, medioCuota: function () { return GAL; } }));
    // 4B · pagada 100 % con m² de otro desarrollo (canje)
    (function () {
        var v = ventaBase({ id: 'vta_4b', uf: '4B', comprador: 'Estudio Contable Pereyra y Asociados', fecha: dia(-150), m2: 38, m2a: 6,
            acuerdo: 'Canje: 41 m² de Residencias del Parque a USD 2.450', obs: 'Los m² quedan en la cuenta corriente de metros del desarrollo.' }, 'total_usd');
        v.precioUSD = 41 * 2450; v.cobradoUSD = 0;
        cobroCanje(v, dia(-150), PARQUE, 41, 2450, 'Canje de m² (carga de UF)');
        VENTAS.push(recalc(v));
    })();
    // 5A · terreno cobrado en parte con m² de canje + 36 cuotas CAC
    VENTAS.push(ventaCAC({ id: 'vta_5a', uf: '5A', comprador: 'Carolina Ibáñez', fecha: dia(-140), m2: 56, m2a: 8,
        acuerdo: 'Terreno: 10 m² en canje + USD 23.500 (USD 8.500 contra posesión); 36 cuotas CAC', terreno: 48000,
        terrenoCobros: [{ f: dia(-140), canje: 10 }, { f: dia(-140), monto: 15000, m: 'E', ref: 'Seña en efectivo' }],
        nc: 36, base: 2800000, mes1: -4, dia: 20, medioCuota: function () { return GAL; } }));
    // COCH-07 · cochera suelta pagada de contado en pesos
    (function () {
        var v = ventaBase({ id: 'vta_coch07', uf: 'COCH-07', tipo: 'cochera', comprador: 'Raúl Albornoz', fecha: dia(-45), m2: 12.5, m2a: 0,
            acuerdo: 'Pago de contado en pesos' }, 'total_ars');
        v.precioARS = 24000000; v.cobradoARS = 0;
        cobroV(v, dia(-45), 'ars_general', 24000000, SAN, { ref: 'Transferencia — pago contado' });
        VENTAS.push(recalc(v));
    })();
    // 6A · dúplex recién reservado: seña del 10 %
    VENTAS.push(ventaUSD({ id: 'vta_6a', uf: '6A', comprador: 'Tomás Villalba', fecha: dia(0), m2: 112, m2a: 14, obs: 'Boleto a firmar dentro de los 30 días.',
        acuerdo: 'Seña del 10 %, 30 % al boleto y saldo en 12 cuotas en dólares', precio: 289000,
        cobros: [{ f: dia(0), monto: 28900, m: 'E', ref: 'Seña del 10 %' }] }));   // de HOY: el «Cobrado este mes» del Inicio nunca queda en cero, ni el día 1

    // Movimientos manuales de metros (además de los canjes que generan las ventas)
    METROS.push({ id: 'MC-manual-01', fecha: dia(-60), tipo: 'salida', desarrolloId: PARQUE, cantidadM2: 12, valorM2: 2450, moneda: 'USD', valorTotal: 12 * 2450,
                  contraparte: 'Ing. Raúl Benítez', referencia: 'Honorarios de proyecto y dirección de obra', obs: 'Cancelación de honorarios en metros.', origen: 'manual' });
    METROS.push({ id: 'MC-manual-02', fecha: dia(-20), tipo: 'entrada', desarrolloId: PARQUE, cantidadM2: 22, valorM2: 2450, moneda: 'USD', valorTotal: 22 * 2450,
                  contraparte: 'Familia Roldán', referencia: 'Permuta de terreno lindero', obs: 'Dos unidades de 11 m² cada una, a entregar con la obra terminada.', origen: 'manual' });

    // ── Movimientos de caja y de banco (ingGeneral) ──────────────────────
    var IG = [];
    var fmtU = function (n) { return 'USD ' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var fmtP = function (n) { return '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    // o: f (fecha), tipo, origen, monto, ref, mon, cta (si va por banco), medio, dest, obs
    function ig(o) {
        var m = { id: 'igm_' + ('00' + (IG.length + 1)).slice(-3), fecha: o.f, tipo: o.tipo, origen: o.origen, referencia: o.ref || '', moneda: o.mon || 'ARS', monto: o.monto, tipoAB: o.cta ? 'A' : 'B' };
        if (o.obs) m.obs = o.obs;
        if (o.cta) {
            m.esBancario = true; m.cuentaId = o.cta; m.medio = o.medio || 'Transferencia'; m.origenDest = o.dest || '';
            if (o.tipo === 'mov_banco_entrada' || o.tipo === 'mov_banco_salida') m.esEgreso = (o.tipo === 'mov_banco_salida');
        }
        numerar(m, 'nroCorrelativo', m.tipoAB);
        IG.push(m);
        return m;
    }
    // Compra o venta de dólares: SIEMPRE son dos movimientos con el mismo cambioId (lo que sale de una moneda y lo que entra en la otra)
    function fx(f, op, usd, tc, ctaUsd, ctaArs, contra, nota, n) {
        var ars = usd * tc, cambioId = 'FX-' + dia(f).replace(/-/g, '') + '-' + n, etiqueta = op === 'venta' ? 'Venta de dólares' : 'Compra de dólares';
        var detalle = etiqueta + ' — ' + fmtU(usd) + ' a ' + fmtP(tc) + (contra ? ' · ' + contra : '');
        var base = { fecha: dia(f), cambioId: cambioId, op: op, tc: tc, contra: contra, nota: nota || '', origen: etiqueta + (contra ? ' · ' + contra : ''), obs: nota || detalle };
        var punta = function (sufijo, moneda, monto, esEgreso, cta) {
            var m = { id: cambioId + '-' + sufijo, fecha: base.fecha, moneda: moneda, monto: monto, origen: base.origen, referencia: cambioId, obs: base.obs, esEgreso: esEgreso,
                      esCambio: true, cambioId: cambioId, fxOp: op, fxTC: tc, fxContra: contra, fxNota: base.nota };
            if (cta) { m.tipo = esEgreso ? 'mov_banco_salida' : 'mov_banco_entrada'; m.cuentaId = cta; m.esBancario = true; m.medio = 'Transferencia'; m.origenDest = contra; m.tipoAB = 'A'; }
            else { m.tipo = esEgreso ? 'mov_egreso_caja' : 'mov_ingreso_caja'; m.tipoAB = 'B'; }
            IG.push(m);
        };
        punta('USD', 'USD', usd, op === 'venta', ctaUsd);
        punta('ARS', 'ARS', ars, op === 'compra', ctaArs);
    }

    // Historia más vieja: aportes de capital, préstamos, la primera conversión grande de dólares y los primeros retiros de caja
    ig({ f: dia(-330), tipo: 'aporte_socio', origen: 'Aporte de capital inicial — Ricardo Rinaldi', ref: 'Acta de socios 01', monto: 110000000, cta: GAL, dest: 'Ricardo Rinaldi' });
    ig({ f: dia(-322), tipo: 'aporte_socio', origen: 'Aporte de capital — Lucía Rinaldi', ref: 'Acta de socios 01', monto: 50000000, cta: GAL, dest: 'Lucía Rinaldi' });
    ig({ f: dia(-300), tipo: 'prestamo_bancario', origen: 'Préstamo bancario Galicia — línea de inversión productiva', ref: 'Préstamo 36 cuotas', monto: 90000000, cta: GAL, dest: 'Banco Galicia',
         obs: 'Tasa 38 % TNA, sistema francés. Primer vencimiento a 30 días.' });
    ig({ f: dia(-250), tipo: 'subsidio', origen: 'Reintegro régimen de incentivo a la inversión (crédito fiscal)', ref: 'Resolución 214', monto: 12400000, cta: GAL, dest: 'Organismo de fomento' });
    ig({ f: dia(-240), tipo: 'aporte_socio', origen: 'Aporte de capital — Daniel Ibarra (lote Casas del Nogal)', ref: 'Convenio de aporte', monto: 60000000, cta: GAL, dest: 'Daniel Ibarra' });
    ig({ f: dia(-210), tipo: 'aporte_socio', origen: 'Aporte de capital — Fondo Norte Capital S.A.', ref: 'Convenio de inversión', monto: 70000000, cta: GAL, dest: 'Fondo Norte Capital S.A.' });
    ig({ f: dia(-200), tipo: 'aporte_socio', origen: 'Aporte en efectivo — Lucía Rinaldi', ref: '', monto: 12000000 });
    ig({ f: dia(-190), tipo: 'aporte_socio', origen: 'Aporte en dólares billete — Ricardo Rinaldi', ref: '', monto: 25000, mon: 'USD' });
    ig({ f: dia(-175), tipo: 'mov_egreso_caja', origen: 'Anticipo carpintería de aluminio (dólares billete)', ref: 'Anticipo 30 %', monto: 12000, mon: 'USD' });
    ig({ f: dia(-170), tipo: 'aporte_socio', origen: 'Aporte de capital — Pablo Ruiz', ref: 'Convenio de inversión', monto: 30000000, cta: GAL, dest: 'Pablo Ruiz' });
    ig({ f: dia(-165), tipo: 'mov_egreso_caja', origen: 'Pago de jornales de obra — mes', ref: '', monto: 9980000 });
    ig({ f: dia(-150), tipo: 'prestamo_empresa', origen: 'Préstamo de Inmobiliaria Del Plata S.R.L.', ref: 'Contrato de mutuo', monto: 25000000, cta: GAL, dest: 'Inmobiliaria Del Plata S.R.L.',
         obs: 'Devolución en 12 meses, sin interés.' });
    ig({ f: dia(-135), tipo: 'mov_egreso_caja', origen: 'Pago de jornales de obra — mes', ref: '', monto: 10680000 });
    ig({ f: dia(-120), tipo: 'mov_banco_salida', origen: 'Extracción para caja de obra', ref: 'Cheque 00457812', monto: 80000000, cta: GAL, medio: 'Cheque', dest: 'Caja de obra' });
    ig({ f: dia(-120), tipo: 'mov_ingreso_caja', origen: 'Ingreso a caja por extracción bancaria', ref: 'Cheque 00457812', monto: 80000000 });
    fx(-115, 'venta', 60000, 1128, null, GAL, 'Cambios Sur S.R.L.', 'Venta de dólares billete para fondear los pagos de obra', 1);
    ig({ f: dia(-105), tipo: 'mov_egreso_caja', origen: 'Pago de jornales de obra — mes', ref: '', monto: 11420000 });
    ig({ f: dia(-100), tipo: 'mov_egreso_caja', origen: 'Retiro de utilidades — socios (dólares billete)', ref: 'Acta de distribución', monto: 30000, mon: 'USD' });
    ig({ f: dia(-98), tipo: 'aporte_socio', origen: 'Aporte en efectivo — Pablo Ruiz', ref: '', monto: 20000000 });
    ig({ f: dia(-90), tipo: 'mov_egreso_caja', origen: 'Pago de jornales de obra — mes', ref: '', monto: 11780000 });
    ig({ f: dia(-76), tipo: 'mov_banco_salida', origen: 'Extracción para caja de obra', ref: 'Cheque 00457866', monto: 30000000, cta: GAL, medio: 'Cheque', dest: 'Caja de obra' });
    ig({ f: dia(-76), tipo: 'mov_ingreso_caja', origen: 'Ingreso a caja por extracción bancaria', ref: 'Cheque 00457866', monto: 30000000 });
    ig({ f: dia(-72), tipo: 'mov_banco_salida', origen: 'Cuota préstamo bancario 7/36 (capital e intereses)', ref: 'Préstamo 36 cuotas', monto: 9420000, cta: GAL, medio: 'Otro', dest: 'Banco Galicia' });
    ig({ f: dia(-68), tipo: 'mov_egreso_caja', origen: 'Pago de jornales de obra — mes', ref: '', monto: 12240000 });

    // Últimos 60 días
    ig({ f: dia(-57), tipo: 'aporte_socio', origen: 'Aporte de capital — Ricardo Rinaldi (2º tramo)', ref: 'Acta de socios 04', monto: 45000000, cta: GAL, dest: 'Ricardo Rinaldi' });
    ig({ f: dia(-52), tipo: 'mov_banco_salida', origen: 'Impuesto ley 25.413 — débitos y créditos', ref: '', monto: 1486320, cta: GAL, medio: 'Otro', dest: 'ARCA' });
    ig({ f: dia(-50), tipo: 'mov_banco_salida', origen: 'Cuota préstamo bancario 8/36 (capital e intereses)', ref: 'Préstamo 36 cuotas', monto: 9420000, cta: GAL, medio: 'Otro', dest: 'Banco Galicia' });
    ig({ f: dia(-47), tipo: 'mov_banco_salida', origen: 'Extracción para caja de obra', ref: 'Cheque 00457931', monto: 12000000, cta: GAL, medio: 'Cheque', dest: 'Caja de obra' });
    ig({ f: dia(-47), tipo: 'mov_ingreso_caja', origen: 'Ingreso a caja por extracción bancaria', ref: 'Cheque 00457931', monto: 12000000 });
    ig({ f: dia(-45), tipo: 'mov_egreso_caja', origen: 'Pago de jornales de obra — mes', ref: '', monto: 12950000 });
    ig({ f: dia(-44), tipo: 'mov_banco_entrada', origen: 'Acreditación de intereses — plazo fijo 30 días', ref: 'Plazo fijo 0183', monto: 1640000, cta: SAN, medio: 'Acreditación', dest: 'Banco Santander' });
    fx(-41, 'compra', 15000, 1165, null, GAL, 'Cambios Sur S.R.L.', 'Compra de dólares billete para pagos en efectivo', 2);
    ig({ f: dia(-31), tipo: 'aporte_socio', origen: 'Aporte de capital — Fondo Norte Capital S.A. (2º desembolso)', ref: 'Convenio de inversión', monto: 25000000, cta: GAL, dest: 'Fondo Norte Capital S.A.' });
    ig({ f: dia(-22), tipo: 'mov_banco_salida', origen: 'Impuesto ley 25.413 — débitos y créditos', ref: '', monto: 1512900, cta: GAL, medio: 'Otro', dest: 'ARCA' });
    ig({ f: dia(-22), tipo: 'mov_egreso_caja', origen: 'Despachante de aduana — importación de equipos VRF (dólares billete)', ref: '', monto: 2400, mon: 'USD' });
    ig({ f: dia(-20), tipo: 'mov_banco_salida', origen: 'Cuota préstamo bancario 9/36 (capital e intereses)', ref: 'Préstamo 36 cuotas', monto: 9420000, cta: GAL, medio: 'Otro', dest: 'Banco Galicia' });
    ig({ f: dia(-15), tipo: 'mov_egreso_caja', origen: 'Pago de jornales de obra — mes', ref: '', monto: 13480000 });
    fx(-13, 'venta', 8000, 1176, null, SAN, 'Cambios Sur S.R.L.', '', 3);
    ig({ f: dia(-10), tipo: 'devolucion', origen: 'Devolución de saldo técnico de IVA', ref: 'Presentación 03/2026', monto: 4350000, cta: GAL, dest: 'ARCA' });
    ig({ f: dia(-4), tipo: 'mov_banco_entrada', origen: 'Depósito de cheques de terceros — clientes', ref: 'Depósito 8841', monto: 7200000, cta: SAN, medio: 'Cheque', dest: 'Varios' });

    // ── Comprobantes emitidos (recibos y documentos no válidos como factura) ──
    // Los que afectan caja generan su movimiento en ingGeneral igual que _emitSincronizarMovCaja (id determinístico).
    var EMITIDOS = [];
    function emitir(o) {
        var items = (o.items || []).map(function (it) { return { desc: it.desc, cant: it.cant, precio: it.precio }; });
        var total = o.tipoDoc === 'recibo' ? o.monto : items.reduce(function (s, it) { return s + it.cant * it.precio; }, 0);
        total = Math.round(total * 100) / 100;
        var e = { id: 'emit_dm' + ('0' + (EMITIDOS.length + 1)).slice(-2), tipoDoc: o.tipoDoc, fecha: dia(o.f), cliente: o.cliente, clienteDetalle: o.det || '', moneda: o.mon || 'ARS',
                  tipoAB: o.cta ? 'A' : 'B', concepto: o.concepto || '', monto: o.tipoDoc === 'recibo' ? total : 0, obs: o.obs || '', total: total, nro: null,
                  proveedorId: '', proveedorNombre: '', confidencial: false, afectaCaja: !!o.afecta, movTipo: o.afecta ? 'ingreso' : '', cuentaId: o.cta || '',
                  estadoPago: o.afecta ? 'pagado' : 'documento', importe: total, pagado: o.afecta ? total : 0, adjuntoId: '', adjuntoNombre: '', adjuntoTipo: '' };
        if (items.length) e.items = items;
        numerar(e, 'nro', e.tipoAB, o.tipoDoc === 'factura' ? 'DOC' : '');
        EMITIDOS.push(e);
        return e;
    }
    emitir({ tipoDoc: 'recibo', f: -95, cliente: 'Lucía Montenegro', det: 'DNI 33.456.781', concepto: 'Seña de reserva — UF 7A (3 ambientes, 7° piso)', monto: 3500000, afecta: true, obs: 'Reserva válida por 15 días.' });
    emitir({ tipoDoc: 'factura', f: -88, cliente: 'Sofía Bianchi', det: 'DNI 30.123.456', cta: GAL, afecta: true, obs: 'Adicionales de la UF 3B acordados con el comprador.',
             items: [{ desc: 'Porcelanato 120x60 — diferencia de calidad (78 m²)', cant: 78, precio: 46000 }, { desc: 'Bacha de cerámica y grifería monocomando de diseño', cant: 2, precio: 380000 }] });
    emitir({ tipoDoc: 'recibo', f: -74, cliente: 'María Inés Duarte', det: 'DNI 28.774.310', cta: SAN, concepto: 'Gastos de escrituración — UF 1B', monto: 5120000, afecta: true });
    emitir({ tipoDoc: 'recibo', f: -66, cliente: 'Valeria Ocampo', det: 'DNI 35.209.874', mon: 'USD', concepto: 'Seña de reserva — UF 7B (dólares billete)', monto: 5000, afecta: true });
    emitir({ tipoDoc: 'factura', f: -52, cliente: 'Chatarrera Hermanos Lima', det: 'CUIT 30-51203987-4', afecta: false, obs: 'Retira el material el comprador. Se cobra al retirar.',
             items: [{ desc: 'Hierro de construcción sobrante Ø8 a Ø12 mm (toneladas)', cant: 2.9, precio: 745000 }] });
    emitir({ tipoDoc: 'recibo', f: -45, cliente: 'Pablo Ruiz', det: 'DNI 24.118.903', cta: GAL, concepto: 'Aporte de capital — socio', monto: 22000000, afecta: true });
    emitir({ tipoDoc: 'factura', f: -38, cliente: 'Plataforma Inmobiliaria Norte S.A.', det: 'CUIT 30-52871146-9', afecta: false, obs: 'Se cobra por transferencia a fin de mes.',
             items: [{ desc: 'Alquiler de sala de ventas — mes en curso', cant: 1, precio: 1450000 }] });
    emitir({ tipoDoc: 'factura', f: -30, cliente: 'Familia Ibarra', det: 'DNI 20.447.115', cta: GAL, afecta: true,
             items: [{ desc: 'Dirección de obra — certificado N° 3 (Casa Ibarra)', cant: 1, precio: 3800000 }] });
    emitir({ tipoDoc: 'recibo', f: -19, cliente: 'Carolina Ibáñez', det: 'DNI 34.002.671', cta: GAL, concepto: 'Personalización UF 5A — cambio de carpinterías', monto: 6350000, afecta: true });
    emitir({ tipoDoc: 'factura', f: -11, cliente: 'Familia Montes', det: 'DNI 18.930.552', afecta: false, obs: 'Presupuesto aceptado, a cobrar en dos pagos.',
             items: [{ desc: 'Anteproyecto y documentación para permiso de obra — Casa Montes', cant: 1, precio: 3200000 }, { desc: 'Dirección de obra — anticipo', cant: 1, precio: 2000000 }] });
    emitir({ tipoDoc: 'recibo', f: -3, cliente: 'Daniela Roldán', det: 'DNI 36.511.229', concepto: 'Seña de reserva — UF 7C', monto: 2800000, afecta: true });

    // Todos los números de recibo, en orden de fecha (también los del resto de las ventas y movimientos)
    asignarNumeros();

    // Movimientos de caja/banco que nacen de los comprobantes emitidos (después de numerar, porque llevan el número en el texto)
    EMITIDOS.forEach(function (e) {
        if (!e.afectaCaja) return;
        var origenTxt = (e.tipoDoc === 'factura' ? 'Doc. factura' : 'Recibo') + ' ' + e.nro + ' — ' + e.cliente, m;
        if (e.tipoAB === 'A') {
            m = { tipo: 'mov_banco_entrada', fecha: e.fecha, cuentaId: e.cuentaId, origen: origenTxt, referencia: e.nro, moneda: 'ARS', monto: e.total, medio: 'Transferencia',
                  origenDest: e.cliente, esEgreso: false, esBancario: true, tipoAB: 'A', origenEmitidoId: e.id };
        } else {
            m = { fecha: e.fecha, tipo: 'mov_ingreso_caja', origen: origenTxt, referencia: e.nro, moneda: e.moneda, monto: e.total, tipoAB: 'B', esEgreso: false, origenEmitidoId: e.id };
        }
        m.id = 'emitmov_' + e.id;
        IG.push(m);
    });

    // ── Índice CAC mensual: los últimos 12 meses ya publicados ───────────
    var CAC = {}, CAC_PROY = {};
    for (var k = 1; k <= 12; k++) {
        var mes = DEMO.mes(-k), val = cacDe(-k);
        CAC[mes] = val; CAC_PROY[mes] = { valor: val };
    }

    // ── Escritura en la base ─────────────────────────────────────────────
    DEMO.set(r, B + '/banco', DEMO.porId(CUENTAS));
    // «Saldo total» del Inicio = caja + saldos de apertura de las cuentas. Para que dé lo que realmente hay (efectivo + bancos), `caja` vale
    // lo que acumulan todos los movimientos: es el saldo de la Caja General (pesos y dólares). Si cambian los pagos que siembra otro módulo,
    // hay que volver a leer esos dos números en Caja y Bancos → Caja General.
    DEMO.set(r, B + '/caja', { ars: 123552914.66, usd: 473770 });
    DEMO.set(r, B + '/tipoCambio', TC);
    DEMO.set(r, B + '/indiceCAC', CAC_PROY);
    DEMO.set(r, 'global/config/cacIndices', CAC);
    DEMO.set(r, B + '/desarrollos', DEMO.porId(DESARROLLOS));
    DEMO.set(r, B + '/aportantes', DEMO.porId(APORTANTES));
    DEMO.set(r, B + '/metrosCanje', DEMO.porId(METROS));
    DEMO.set(r, B + '/ventas', DEMO.porId(VENTAS));
    DEMO.set(r, B + '/ingGeneral', DEMO.porId(IG));
    DEMO.set(r, B + '/comprobantesEmitidos', DEMO.porId(EMITIDOS));
});
