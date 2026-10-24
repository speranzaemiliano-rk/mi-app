/* Versión de prueba — datos de ejemplo: alquileres, servicios del estudio y agenda de vencimientos.
   Siembra:
     · empresas/emp_demo_2 (Inmobiliaria Del Plata): cartera de 15 filas de alquileres (departamentos, locales, oficinas y cochera; un contrato
       con IVA, uno en dólares, uno con ajuste de canon de este mes, uno con primer/último mes proporcional, un cobro parcial con saldo, un mes
       bonificado, un contrato vencido, dos unidades disponibles y dos locaciones finalizadas en el Historial) y 5 servicios de honorarios.
     · empresas/emp_demo_1 (Constructora Los Álamos): 4 unidades propias (dos locales con IVA y dos cocheras; una locación finalizada con su
       unidad «Disponible») y 3 servicios del estudio.
     · global/vencimientosServicios: la agenda de vencimientos de las dos empresas (vencidos, próximos, al día y pagados).
   Todo es inventado. Las fechas son relativas a hoy (DEMO.dia / DEMO.mes), así que la demo siempre se ve «de esta semana»: la cuota vencida y la
   que está por vencer se calculan con el día del mes en que se abre. Los cobros se generan con las MISMAS reglas que usa la app (canon vigente
   según el historial de ajustes, primer/último mes proporcional, IVA con desglose en dos recibos), para que el Plan de pagos cierre solo. */
(window.DEMO_SEEDS = window.DEMO_SEEDS || []).push(function (r) {
    var B1 = DEMO.base, B2 = DEMO.base2, TC = DEMO.TC;
    var GAL = DEMO.CTA_GALICIA, SAN = DEMO.CTA_SANTANDER;
    var HOY = DEMO.dia(0);
    var DIA_HOY = parseInt(HOY.substring(8, 10), 10);

    // ── Fechas ────────────────────────────────────────────────────────────
    function dos(n) { return ('0' + n).slice(-2); }
    function r2(n) { return Math.round(n * 100) / 100; }
    function deIso(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
    function aIso(d) { return d.getFullYear() + '-' + dos(d.getMonth() + 1) + '-' + dos(d.getDate()); }
    function sumaDias(s, n) { var d = deIso(s); d.setDate(d.getDate() + n); return aIso(d); }
    function diasEntre(a, b) { return Math.round((deIso(b) - deIso(a)) / 86400000); }
    function primeroDelMes(n) { var d = new Date(); d.setDate(1); d.setHours(12, 0, 0, 0); d.setMonth(d.getMonth() + n); return d; }
    function diasDelMes(n) { var d = primeroDelMes(n); return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); }
    // día `dia` del mes actual + n meses (si el mes no tiene ese día, el último)
    function fm(n, dia) { var d = primeroDelMes(n); return d.getFullYear() + '-' + dos(d.getMonth() + 1) + '-' + dos(Math.max(1, Math.min(dia, diasDelMes(n)))); }
    function per(n) { return DEMO.mes(n); }
    function finMes(n) { return fm(n, 31); }
    function sumaMeses(s, m) {
        var p = s.split('-'), f = new Date(+p[0], +p[1] - 1 + m, 1, 12);
        f.setDate(Math.min(+p[2], new Date(f.getFullYear(), f.getMonth() + 1, 0).getDate()));
        return aIso(f);
    }
    function finDe(inicio, meses) { return sumaDias(sumaMeses(inicio, meses), -1); }
    function dia(n) { return DEMO.dia(n); }

    // Dólar de cada fecha: sube ~1,1 % por mes hasta el valor de hoy (el mismo criterio que las ventas)
    function tcEn(f) { return Math.round(TC / Math.pow(1.011, Math.max(0, diasEntre(f, HOY)) / 30.4)); }

    // CUIT con formato válido (dígito verificador correcto) pero inventado
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
    function soloDig(s) { return String(s).replace(/\D/g, ''); }

    // números de transferencia / cupón repetibles pero de aspecto aleatorio
    var _lcg = 90211;
    function azar(n) { _lcg = (_lcg * 48271) % 2147483647; return _lcg % n; }

    // ── Las reglas de la app, replicadas ──────────────────────────────────
    // _canonVigenteEnPeriodo: sin ajustes cargados vale el canon actual; con ajustes, un período anterior a todos usa el canon inicial
    function canonEn(a, periodo) {
        var aj = (a.ajustesCanon || []).slice().sort(function (x, y) { return x.periodo < y.periodo ? -1 : x.periodo > y.periodo ? 1 : 0; });
        if (!aj.length) return a.canonActual || a.canon || 0;
        var ap = null;
        for (var i = 0; i < aj.length; i++) { if (aj[i].periodo <= periodo) ap = aj[i]; else break; }
        return ap ? ap.monto : (a.canon || 0);
    }
    // _alqFraccionPeriodo: primer / último mes proporcional, por días reales del mes (contando el de inicio)
    function fraccion(a, periodo) {
        if (!a.inicio) return 1;
        var y = +periodo.substring(0, 4), m = +periodo.substring(5, 7), dm = new Date(y, m, 0).getDate(), desde = 1, hasta = dm;
        if (a.proporcionalInicio && a.inicio.substring(0, 7) === periodo) desde = +a.inicio.substring(8, 10);
        if (a.proporcionalFin && a.fin && a.fin.substring(0, 7) === periodo) hasta = Math.min(dm, +a.fin.substring(8, 10));
        var dias = Math.max(0, hasta - desde + 1);
        return dias >= dm ? 1 : dias / dm;
    }
    function esperado(a, periodo) { return r2(canonEn(a, periodo) * fraccion(a, periodo)); }
    // _alqCalcIVA: importes ya redondeados y cerrando entre sí (el no gravado sale por resta)
    function ivaCalc(a, base) {
        var pct = a.ivaPctGravado, alic = a.ivaAlicuota;
        var grav = Math.round(base * pct) / 100, baseR = Math.round(base * 100) / 100;
        return { grav: grav, nog: Math.round((baseR - grav) * 100) / 100, iva: Math.round(grav * alic) / 100 };
    }
    // _alqSaldoPendiente: cuotas con saldo desde el inicio hasta la fecha de cierre
    function saldoAlCerrar(a) {
        var tope = a.finalizadoEn < HOY ? a.finalizadoEn : HOY;
        if (a.fin && a.fin < tope) tope = a.fin;
        var total = 0, n = -60;
        for (; n <= 0; n++) {
            var p = per(n);
            if (p < a.inicio.substring(0, 7) || p > tope.substring(0, 7)) continue;
            if ((a.mesesBonificados || []).indexOf(p) >= 0) continue;
            var esp = esperado(a, p), cob = 0;
            a.cobrosHistorial.forEach(function (c) { if (c.periodo === p && (c.concepto === 'alquiler' || !c.concepto)) cob += c.monto - (c.iva || 0); });
            if (esp > 0 && cob < esp * 0.98) total += Math.max(0, esp - cob);
        }
        return r2(total);
    }

    // ── Numeración de recibos ─────────────────────────────────────────────
    // Misma forma que obtenerProximoComprobante(): <EMP>-<PROY>-<A|B>-00001, un contador por proyecto y por A/B. Se numera al final, en orden de
    // fecha, a continuación de lo que ya haya sembrado otro módulo en el mismo proyecto (las ventas del proyecto principal usan la misma serie).
    function Libro(pref, ruta) { this.pref = pref; this.ruta = ruta; this.regs = []; }
    Libro.prototype.reg = function (c) { this.regs.push(c); return c; };
    Libro.prototype.cerrar = function () {
        var ex = {}, pref = this.pref, ruta = this.ruta, cont;
        try { ex = window.__demoDB.leer(ruta + '/contadoresComprobante') || {}; } catch (e) { ex = {}; }
        cont = { A: +ex.A || 0, B: +ex.B || 0 };
        this.regs.map(function (x, i) { return { x: x, i: i }; })
            .sort(function (p, q) { return p.x.fecha < q.x.fecha ? -1 : p.x.fecha > q.x.fecha ? 1 : p.i - q.i; })
            .forEach(function (w) {
                var t = w.x.tipoAB === 'A' ? 'A' : 'B';
                cont[t]++;
                w.x.nroRecibo = pref + '-' + t + '-' + ('0000' + cont[t]).slice(-5);
            });
        if (cont.A) DEMO.set(r, ruta + '/contadoresComprobante/A', cont.A);
        if (cont.B) DEMO.set(r, ruta + '/contadoresComprobante/B', cont.B);
    };
    var L1 = new Libro('CLA-EDIFIC', B1), L2 = new Libro('IDP-CARTER', B2);

    // Dónde entra la plata: efectivo, banco sin cuenta puntual (queda «sin especificar») o banco con su cuenta
    var EF = { t: 'B' }, BCO = { t: 'A', cta: 'cta_nacion_ars' }, BCO_GAL = { t: 'A', cta: GAL }, BCO_SAN = { t: 'A', cta: SAN };

    // ── Contratos ─────────────────────────────────────────────────────────
    var FACT_SEQ = 130;
    function nroFactura(pv) { FACT_SEQ += 1 + azar(2); return 'A ' + pv + '-' + ('00000000' + FACT_SEQ).slice(-8); }

    // o: id, unidad, tipo, direccion, inquilino, email, doc [tipo, nro], sociedad, contacto [nombre, dato], garante [nombre, tipoDoc, doc, contacto],
    //    inicio, meses, sinFin, moneda, canon, ajustes [[mes relativo, canon]], indice, frecuencia, diaPago, deposito [monto, meses], cac [base, actual],
    //    iva [alícuota, % gravado], propIni, propFin, bonif [meses relativos], cochera, amueblado, obs
    function contrato(o) {
        var ajustes = (o.ajustes || []).map(function (x) { return { periodo: per(x[0]), monto: x[1] }; });
        var ult = (o.ajustes && o.ajustes.length) ? o.ajustes[o.ajustes.length - 1] : null;
        var indice = o.indice || 'FIJO', frec = o.frecuencia || 3, dep = o.deposito || [0, 1];
        var a = {
            id: o.id, unidad: o.unidad, tipo: o.tipo, direccion: o.direccion || '',
            incluyeCochera: !!o.cochera, cocheraDetalle: o.cochera || '', amueblado: !!o.amueblado, disponible: false,
            inquilino: o.inquilino, emailInquilino: o.email || '', inquilinoDocTipo: o.doc ? o.doc[0] : 'DNI', inquilinoDoc: o.doc ? o.doc[1] : '',
            esSociedad: !!o.sociedad, contactoNombre: o.contacto ? o.contacto[0] : '', contactoDato: o.contacto ? o.contacto[1] : '',
            garante: o.garante ? o.garante[0] : '', garanteDocTipo: o.garante ? o.garante[1] : 'DNI', garanteDoc: o.garante ? o.garante[2] : '',
            garanteContacto: o.garante ? o.garante[3] : '',
            inicio: o.inicio, fin: o.sinFin ? '' : finDe(o.inicio, o.meses), moneda: o.moneda || 'ARS',
            canon: o.canon, canonActual: ult ? ult[1] : o.canon, diaPago: o.diaPago,
            indice: indice, frecuencia: frec, cacBase: o.cac ? o.cac[0] : 0, cacActual: o.cac ? o.cac[1] : 0,
            ajustesCanon: ajustes,
            depMoneda: o.moneda === 'USD' ? 'USD' : 'ARS', deposito: dep[0], depMeses: dep[1],
            obs: o.obs || '',
            ivaActivo: !!o.iva, ivaAlicuota: o.iva ? o.iva[0] : 0, ivaPctGravado: o.iva ? o.iva[1] : 0,
            proporcionalInicio: !!o.propIni, proporcionalFin: !!o.propFin,
            adjuntoId: '', adjuntoNombre: '', adjuntoTipo: '',
            cobrosHistorial: []
        };
        // Último cálculo por IPC que quedó cargado en el formulario: del primer mes del período a desde cuándo rige el nuevo canon
        if (indice === 'IPC' && ult) {
            var dB = primeroDelMes(ult[0] - frec), dF = primeroDelMes(ult[0]);
            a.ipcMesBase = dB.getMonth() + 1; a.ipcAnioBase = dB.getFullYear(); a.ipcMesFin = dF.getMonth() + 1; a.ipcAnioFin = dF.getFullYear();
        }
        if (o.bonif) a.mesesBonificados = o.bonif.map(per);
        return a;
    }

    // Cierra una locación como lo hace 🏁 Finalizar: el contrato queda en `alquileres` (sus cobros siguen en los libros) con las marcas del cierre
    function finalizar(a, o) {
        a.finalizado = true;
        a.finalizadoEn = o.en;
        a.finalizadoMotivo = o.motivo;
        a.finalizadoObs = o.obs || '';
        a.finalizadoDeposito = o.deposito || '';
        a.finalizadoSaldo = saldoAlCerrar(a);
        a.finalizadoTs = o.en + 'T15:20:00.000Z';
        a.finalizadoPor = o.por || 'administracion@constructora-demo.com';
        return a;
    }
    // La fila «Disponible» que deja un cierre: lo que es de la UNIDAD, sin inquilino ni cobros (mismo id derivado que usa la app)
    function filaDisponible(a) {
        a.finalizadoDisponibleId = 'disp_' + a.id;
        return {
            id: 'disp_' + a.id, unidad: a.unidad, tipo: a.tipo || '', direccion: a.direccion || '', incluyeCochera: !!a.incluyeCochera,
            cocheraDetalle: a.cocheraDetalle || '', amueblado: !!a.amueblado, disponible: true, inquilino: '', moneda: a.moneda || 'ARS',
            canon: 0, canonActual: 0, inicio: '', fin: '', indice: 'FIJO', frecuencia: 3, obs: '',
            creadaPorFinalizacion: true, desdeLocacionId: a.id
        };
    }
    // Unidad libre cargada a mano (🔴 Disponible)
    function unidadLibre(o) {
        return { id: o.id, unidad: o.unidad, tipo: o.tipo, direccion: o.direccion, incluyeCochera: !!o.cochera, cocheraDetalle: o.cochera || '',
                 amueblado: !!o.amueblado, disponible: true, inquilino: '', moneda: 'ARS', canon: 0, canonActual: 0, inicio: '', fin: '',
                 indice: 'FIJO', frecuencia: 3, obs: o.obs || '' };
    }

    // Recibos de entrega SIN dinero (llaves, controles, tarjetas…): items [[descripción, cantidad]]
    function entregas(a, lista) {
        a.entregas = lista.map(function (e, i) {
            return { id: 'ENT-' + a.id + '-' + (i + 1), nro: 'E-' + ('00' + (i + 1)).slice(-3), fecha: e.f, tipo: e.tipo || 'entrega',
                     items: e.items.map(function (x) { return { desc: x[0], cant: x[1] }; }), obs: e.obs || '', entrega: e.entrega, recibe: e.recibe };
        });
        a.entregasSeq = lista.length;
        return a;
    }

    // ── Cobros ────────────────────────────────────────────────────────────
    var VAR_DIA = [0, -1, 1, -2, 0, 2, -1, 0, 1];
    function fechaCobro(a, n, d) {
        var f = fm(n, d + VAR_DIA[(n + 40) % VAR_DIA.length]);
        if (f < a.inicio) f = a.inicio;
        if (f > HOY) f = HOY;
        return f;
    }
    function nuevoReg(L, a, f, periodo, monto, medio, extra) {
        var c = { fecha: f, periodo: periodo, monto: r2(monto), concepto: 'alquiler', ref: '', nroRecibo: '', tipoAB: medio.t };
        if (medio.t === 'A') {
            if (medio.cta) c.cuentaId = medio.cta;
            c.ref = 'Transf. ' + (100000 + azar(899999));
        }
        Object.keys(extra || {}).forEach(function (k) { c[k] = extra[k]; });
        L.reg(c);
        a.cobrosHistorial.push(c);
        return c;
    }
    // El cobro de UN mes. o: dia, monto (canon del período; si falta, el esperado), medio, medioB (destino de la parte no gravada), enPesos, ref
    function cobrarMes(L, a, n, o) {
        var periodo = per(n), canon = (o.monto != null) ? o.monto : esperado(a, periodo), f = fechaCobro(a, n, o.dia || 8), medio = o.medio || EF;
        var ref = o.ref || '';
        if (a.ivaActivo) {
            // con IVA el cobro se parte en DOS recibos: la parte gravada (neto + IVA, con su factura) y la no gravada
            var v = ivaCalc(a, canon), medioB = o.medioB || medio;
            nuevoReg(L, a, f, periodo, v.grav + v.iva, medio, { parteIva: 'gravada', montoGravado: v.grav, iva: v.iva, facturaNro: medio.t === 'A' ? nroFactura(o.pv || '0003') : '' });
            if (v.nog > 0) nuevoReg(L, a, f, periodo, v.nog, medioB, { parteIva: 'nograv' });
            return;
        }
        var extra = {};
        if (a.moneda === 'USD' && o.enPesos) {
            // contrato en dólares cobrado en pesos: `monto` queda en dólares y se anota la moneda real, el TC y lo recibido
            extra.monedaCobro = 'ARS'; extra.tc = tcEn(f); extra.montoCobrado = r2(canon * extra.tc);
        }
        var c = nuevoReg(L, a, f, periodo, canon, medio, extra);
        if (ref) c.ref = ref;
    }
    // Una serie de meses consecutivos [desde, hasta]; `mes` pisa opciones puntuales, `salto` los que no se cobraron
    function serie(L, a, desde, hasta, o) {
        o = o || {};
        for (var n = desde; n <= hasta; n++) {
            if (o.salto && o.salto.indexOf(n) >= 0) continue;
            var op = {};
            Object.keys(o).forEach(function (k) { if (k !== 'salto' && k !== 'mes') op[k] = o[k]; });
            Object.keys((o.mes && o.mes[n]) || {}).forEach(function (k) { op[k] = o.mes[n][k]; });
            cobrarMes(L, a, n, op);
        }
    }
    // Cobro suelto de otro concepto (depósito de garantía, expensas…)
    function cobroOtro(L, a, f, concepto, monto, medio, ref, periodo) {
        if (f > HOY) return;
        nuevoReg(L, a, f, periodo || '', monto, medio, { concepto: concepto, ref: ref || '' });
    }
    // Pago parcial: sólo una parte del canon del mes
    function cobroParcial(L, a, n, monto, d, medio) {
        nuevoReg(L, a, fechaCobro(a, n, d), per(n), monto, medio || EF, {});
    }

    // ══════════════════════════════════════════════════════════════════════
    //  INMOBILIARIA DEL PLATA — cartera de alquileres (proyecto de la segunda empresa)
    // ══════════════════════════════════════════════════════════════════════
    var ALQ2 = [], ADM = 'Carolina Vidal — Inmobiliaria Del Plata';

    // 1 · Depto 5C — IPC trimestral, el ajuste de ESTE mes ya rige (tercer ajuste)
    var a5c = contrato({ id: 'alq_5c', unidad: 'Depto 5C', tipo: 'departamento', direccion: 'Av. Cabildo 2350, 5° C, Belgrano',
        inquilino: 'Valeria Soledad Ortega', email: 'valeria.ortega@correo-demo.com', doc: ['DNI', '33145872'],
        garante: ['Jorge Ortega', 'DNI', '12876540', '11 5551-2034'],
        inicio: fm(-9, 1), meses: 36, canon: 760000, ajustes: [[-6, 826000], [-3, 903000], [0, 982000]], indice: 'IPC', frecuencia: 3, diaPago: 5,
        deposito: [1520000, 2], obs: 'Contrato a 36 meses con actualización trimestral por IPC. Mascotas autorizadas (un perro chico).' });
    cobroOtro(L2, a5c, a5c.inicio, 'deposito', 1520000, EF, 'Depósito de garantía (2 meses)');
    serie(L2, a5c, -9, 0, { dia: 4, medio: EF });
    entregas(a5c, [{ f: a5c.inicio, items: [['Llaves del departamento', 3], ['Control remoto del portón', 1], ['Tarjeta de acceso al SUM', 2]],
        obs: 'Se entrega pintado y con la cocina limpia.', entrega: ADM, recibe: 'Valeria Soledad Ortega' }]);
    ALQ2.push(a5c);

    // 2 · Depto 2D — ICL semestral, EN MORA: debe la cuota del mes pasado y la de este mes está VENCIDA (la fecha límite se calcula con el día en que se abre la demo)
    var a2d = contrato({ id: 'alq_2d', unidad: 'Depto 2D', tipo: 'departamento', direccion: 'Thames 1850, 2° D, Palermo',
        inquilino: 'Matías Gómez Lanza', email: 'matias.gomezlanza@correo-demo.com', doc: ['DNI', '35670214'],
        garante: ['Silvia Lanza', 'DNI', '14233901', '11 5557-8812'],
        inicio: fm(-14, 10), meses: 36, canon: 880000, ajustes: [[-8, 1012000], [-2, 1166000]], indice: 'ICL', frecuencia: 6,
        diaPago: Math.max(1, DIA_HOY - 9), deposito: [1760000, 2], obs: 'Venía pagando por transferencia a la cuenta de la inmobiliaria. Debe la cuota del mes pasado y la de este mes; se le mandó recordatorio por mail.' });
    cobroOtro(L2, a2d, a2d.inicio, 'deposito', 1760000, BCO, 'Depósito de garantía (2 meses)');
    serie(L2, a2d, -14, -2, { dia: 8, medio: BCO, mes: { '-2': { dia: 16 } } });   // el mes pasado ya no pagó: en el Plan figura «Vencida»
    ALQ2.push(a2d);

    // 3 · Depto 8A — IPC trimestral, la cuota de este mes vence en unos días
    var a8a = contrato({ id: 'alq_8a', unidad: 'Depto 8A', tipo: 'departamento', direccion: 'Billinghurst 1650, 8° A, Almagro',
        inquilino: 'Lucas Ferreyra', email: 'lucas.ferreyra@correo-demo.com', doc: ['DNI', '36215470'],
        garante: ['Estela Ferreyra', 'DNI', '16088245', '11 5552-4417'],
        inicio: fm(-7, 20), meses: 36, canon: 1150000, ajustes: [[-4, 1252000], [-1, 1371000]], indice: 'IPC', frecuencia: 3,
        diaPago: Math.min(DIA_HOY + 4, 31), deposito: [2300000, 2], obs: '' });
    cobroOtro(L2, a8a, a8a.inicio, 'deposito', 2300000, EF, 'Depósito de garantía (2 meses)');
    serie(L2, a8a, -7, -1, { dia: 22, medio: EF });
    ALQ2.push(a8a);

    // 4 · Local 2 — local sobre Corrientes, con IVA sobre el canon (21 %, todo gravado) y factura A por cada cuota
    var al2 = contrato({ id: 'alq_l2', unidad: 'Local 2', tipo: 'local', direccion: 'Av. Corrientes 4800, Local 2, Almagro',
        inquilino: 'Librería Aurora S.R.L.', email: 'administracion@libreriaaurora-demo.com', doc: ['CUIT', soloDig(cuit('30', 52486117))], sociedad: true,
        contacto: ['Natalia Rovira', 'natalia.rovira@libreriaaurora-demo.com'], garante: ['Hugo Rovira', 'DNI', '11874520', '11 5553-6620'],
        inicio: fm(-13, 1), meses: 36, canon: 1240000, ajustes: [[-7, 1375000], [-1, 1520000]], indice: 'IPC', frecuencia: 6, diaPago: 10,
        deposito: [2480000, 2], iva: [21, 100], obs: 'Factura A mensual por el canon más IVA. Rubro: librería y papelería.' });
    cobroOtro(L2, al2, al2.inicio, 'deposito', 2480000, BCO, 'Depósito de garantía (2 meses)');
    serie(L2, al2, -13, 0, { dia: 8, medio: BCO, pv: '0003' });
    ALQ2.push(al2);

    // 5 · Ofic. 405 — contrato en DÓLARES: se cobra en dólares billete y algunos meses en pesos al tipo de cambio del día
    var ao405 = contrato({ id: 'alq_o405', unidad: 'Ofic. 405', tipo: 'oficina', direccion: 'Juramento 2090, Of. 405, Belgrano',
        inquilino: 'Consultora Andina del Plata S.A.', email: 'finanzas@andinadelplata-demo.com', doc: ['CUIT', soloDig(cuit('30', 52317605))], sociedad: true,
        contacto: ['Rodrigo Salas', '11 5554-0931'], moneda: 'USD',
        inicio: fm(-16, 1), meses: 36, canon: 1100, ajustes: [[-4, 1200]], indice: 'LIBRE', frecuencia: 12, diaPago: 8,
        deposito: [2200, 2], obs: 'Alquiler en dólares, ajuste anual por acuerdo entre las partes. Cobra el estudio contable de la consultora.' });
    cobroOtro(L2, ao405, ao405.inicio, 'deposito', 2200, EF, 'Depósito de garantía en dólares (2 meses)');
    serie(L2, ao405, -16, 0, { dia: 7, medio: EF, mes: { '-12': { enPesos: true }, '-8': { enPesos: true }, '-5': { enPesos: true }, '-2': { enPesos: true } } });
    ALQ2.push(ao405);

    // 6 · Cochera 14
    var ac14 = contrato({ id: 'alq_c14', unidad: 'Cochera 14', tipo: 'cochera', direccion: 'Av. del Libertador 6100, Cochera 14, Núñez',
        inquilino: 'Federico Aguirre', email: 'federico.aguirre@correo-demo.com', doc: ['DNI', '29544183'],
        inicio: fm(-14, 1), meses: 24, canon: 120000, ajustes: [[-8, 138000], [-2, 158000]], indice: 'IPC', frecuencia: 6, diaPago: 10,
        deposito: [120000, 1], obs: 'Cochera cubierta, medidas para auto mediano.' });
    cobroOtro(L2, ac14, ac14.inicio, 'deposito', 120000, EF, 'Depósito de garantía');
    serie(L2, ac14, -14, 0, { dia: 6, medio: EF });
    ALQ2.push(ac14);

    // 7 · Local 1 — COBRO PARCIAL: este mes entró una parte y queda saldo; el mes pasado se completó en dos pagos
    var al1 = contrato({ id: 'alq_l1', unidad: 'Local 1', tipo: 'local', direccion: 'Av. Rivadavia 7200, Local 1, Flores',
        inquilino: 'Farmacia del Oeste S.R.L.', email: 'gerencia@farmaciadeloeste-demo.com', doc: ['CUIT', soloDig(cuit('30', 52871306))], sociedad: true,
        contacto: ['Dr. Hugo Lemos', '11 5555-3178'], garante: ['Marta Lemos', 'DNI', '10955347', '11 5555-3179'],
        inicio: fm(-6, 1), meses: 36, canon: 1250000, indice: 'ICL', frecuencia: 6, diaPago: 10, deposito: [2500000, 2],
        obs: 'Local con persiana y baño propio. Primera actualización semestral pendiente de cargar.' });
    cobroOtro(L2, al1, al1.inicio, 'deposito', 2500000, BCO, 'Depósito de garantía (2 meses)');
    serie(L2, al1, -6, -2, { dia: 7, medio: EF, mes: { '-5': { medio: BCO }, '-3': { medio: BCO } } });
    cobroParcial(L2, al1, -1, 800000, 9, EF);
    cobroParcial(L2, al1, -1, 450000, 21, BCO);
    cobroParcial(L2, al1, 0, 700000, 8, EF);
    ALQ2.push(al1);

    // 8 · Depto 4B — contrato VENCIDO hace unos días (sigue sin finalizarse: el inquilino quiere renovar)
    var a4b = contrato({ id: 'alq_4b', unidad: 'Depto 4B', tipo: 'departamento', direccion: 'Av. Scalabrini Ortiz 1300, 4° B, Palermo',
        inquilino: 'Andrea Paola Quiroga', email: 'andrea.quiroga@correo-demo.com', doc: ['DNI', '31908752'],
        garante: ['Raúl Quiroga', 'DNI', '13560274', '11 5556-0845'],
        inicio: fm(-12, 1), meses: 12, canon: 720000, ajustes: [[-6, 828000]], indice: 'ICL', frecuencia: 6, diaPago: 7, deposito: [1440000, 2],
        obs: 'Contrato vencido: el inquilino pidió renovar. Falta acordar el nuevo canon con el propietario.' });
    cobroOtro(L2, a4b, a4b.inicio, 'deposito', 1440000, EF, 'Depósito de garantía (2 meses)');
    serie(L2, a4b, -12, -1, { dia: 6, medio: EF });
    ALQ2.push(a4b);

    // 9 · Ofic. 12 — primer y último mes PROPORCIONALES (empezó el 18 y termina el 17)
    var ao12 = contrato({ id: 'alq_o12', unidad: 'Ofic. 12', tipo: 'oficina', direccion: 'Av. Las Heras 3500, Of. 12, Recoleta',
        inquilino: 'Estudio Jurídico Ramos & Fuentes', email: 'administracion@ramosfuentes-demo.com', doc: ['CUIT', soloDig(cuit('30', 52690418))], sociedad: true,
        contacto: ['Dra. Paula Fuentes', '11 5557-2210'], garante: ['Dra. Paula Fuentes (aval personal)', 'DNI', '24517830', '11 5557-2210'],
        inicio: fm(-3, 18), meses: 24, canon: 1120000, indice: 'IPC', frecuencia: 6, diaPago: 5, deposito: [2240000, 2], propIni: true, propFin: true,
        obs: 'El contrato empieza el 18 y termina el 17: el primer y el último mes se cobran por los días que corresponden.' });
    cobroOtro(L2, ao12, ao12.inicio, 'deposito', 2240000, BCO, 'Depósito de garantía (2 meses)');
    serie(L2, ao12, -3, 0, { dia: 4, medio: BCO });
    ALQ2.push(ao12);

    // 10 · PH 2 — primer mes BONIFICADO (plazo de gracia por las obras de pintura), con cochera incluida y un cobro de expensas
    var aph2 = contrato({ id: 'alq_ph2', unidad: 'PH 2', tipo: 'casa', direccion: 'Gorriti 4120, PH 2, Palermo', cochera: 'Cochera cubierta',
        inquilino: 'Lorena Benavídez', email: 'lorena.benavidez@correo-demo.com', doc: ['DNI', '34120967'],
        garante: ['Aníbal Benavídez', 'DNI', '12445830', '11 5558-1274'],
        inicio: fm(-5, 1), meses: 36, canon: 1490000, indice: 'ICL', frecuencia: 6, diaPago: 10, deposito: [2980000, 2], bonif: [-5],
        obs: 'El primer mes se bonificó (obras de pintura a cargo del inquilino).' });
    cobroOtro(L2, aph2, aph2.inicio, 'deposito', 2980000, BCO, 'Depósito de garantía (2 meses)');
    serie(L2, aph2, -4, 0, { dia: 8, medio: EF, mes: { '-3': { medio: BCO }, '-1': { medio: BCO } } });
    cobroOtro(L2, aph2, fm(-2, 20), 'expensas', 85000, EF, 'Reintegro de expensas extraordinarias (reparación de la bomba)', per(-2));
    ALQ2.push(aph2);

    // 11 · Depto 3A — amueblado, con inventario y recibos de entrega; IPC semestral con ajuste hace dos meses
    var a3a = contrato({ id: 'alq_3a', unidad: 'Depto 3A', tipo: 'departamento', direccion: 'Montevideo 1450, 3° A, Recoleta', amueblado: true,
        inquilino: 'Camila Andrade', email: 'camila.andrade@correo-demo.com', doc: ['DNI', '37001258'],
        garante: ['Óscar Andrade', 'DNI', '17234905', '11 5559-3366'],
        inicio: fm(-8, 1), meses: 24, canon: 1030000, ajustes: [[-2, 1168000]], indice: 'IPC', frecuencia: 6, diaPago: 5, deposito: [2060000, 2],
        obs: 'Amueblado: el inventario firmado está en la carpeta física del contrato.' });
    cobroOtro(L2, a3a, a3a.inicio, 'deposito', 2060000, EF, 'Depósito de garantía (2 meses)');
    serie(L2, a3a, -8, 0, { dia: 4, medio: EF, mes: { '-6': { medio: BCO }, '-4': { medio: BCO }, '-2': { medio: BCO } } });
    entregas(a3a, [
        { f: a3a.inicio, items: [['Llaves del departamento', 3], ['Llave de la baulera', 1], ['Control de aire acondicionado', 2], ['Tarjeta de acceso al edificio', 2]],
          obs: 'Se entrega amueblado según inventario firmado por separado.', entrega: ADM, recibe: 'Camila Andrade' },
        { f: fm(-3, 12), items: [['Juego de llaves adicional (copia)', 1]], obs: 'Copia pedida por el inquilino.', entrega: ADM, recibe: 'Camila Andrade' }
    ]);
    ALQ2.push(a3a);

    // 12 · Depto 6C — unidad libre cargada a mano
    ALQ2.push(unidadLibre({ id: 'alq_6c', unidad: 'Depto 6C', tipo: 'departamento', direccion: 'Arenales 2950, 6° C, Recoleta', cochera: 'Cochera fija N° 6', amueblado: true,
        obs: 'Publicado a $1.090.000 + expensas. Visitas con cita previa; las llaves las tiene la portería.' }));

    // 13 · Depto 1A — locación FINALIZADA por vencimiento (el depósito se devolvió) y la unidad quedó «Disponible»
    var a1a = contrato({ id: 'alq_1a_ant', unidad: 'Depto 1A', tipo: 'departamento', direccion: 'Soler 3800, 1° A, Palermo',
        inquilino: 'Roberto Iglesias', email: 'roberto.iglesias@correo-demo.com', doc: ['DNI', '27639410'],
        garante: ['Nélida Iglesias', 'DNI', '9877014', '11 5550-7721'],
        inicio: fm(-14, 1), meses: 12, canon: 680000, indice: 'FIJO', diaPago: 8, deposito: [680000, 1], obs: 'Contrato a 12 meses sin actualización.' });
    cobroOtro(L2, a1a, a1a.inicio, 'deposito', 680000, EF, 'Depósito de garantía');
    serie(L2, a1a, -14, -3, { dia: 7, medio: EF });
    entregas(a1a, [
        { f: a1a.inicio, items: [['Llaves del departamento', 3], ['Control remoto del portón', 1]], entrega: ADM, recibe: 'Roberto Iglesias' },
        { f: finMes(-3), tipo: 'devolucion', items: [['Llaves del departamento', 3], ['Control remoto del portón', 1]], obs: 'Devuelto en buen estado, con la pintura al día.',
          entrega: 'Roberto Iglesias', recibe: ADM }
    ]);
    finalizar(a1a, { en: finMes(-3), motivo: 'vencimiento', deposito: 'devuelto', obs: 'Terminó el contrato. Se devolvió el depósito el día de la entrega de llaves.', por: 'alquileres@delplata-demo.com' });
    ALQ2.push(a1a, filaDisponible(a1a));

    // 14 · Local 1 (locatario anterior) — locación FINALIZADA por incumplimiento, con cuotas impagas al cerrar (queda el botón 💵 Cobrar)
    var al1a = contrato({ id: 'alq_l1_ant', unidad: 'Local 1', tipo: 'local', direccion: 'Av. Rivadavia 7200, Local 1, Flores',
        inquilino: 'Panificadora Los Andes S.R.L.', email: 'admin@panificadoralosandes-demo.com', doc: ['CUIT', soloDig(cuit('30', 52213094))], sociedad: true,
        contacto: ['Mario Sosa', '11 5551-9043'], garante: ['Mario Sosa', 'DNI', '18340275', '11 5551-9043'],
        inicio: fm(-20, 1), meses: 24, canon: 1000000, ajustes: [[-14, 1150000], [-8, 1320000]], indice: 'ICL', frecuencia: 6, diaPago: 10, deposito: [2000000, 2],
        obs: 'Dejó de pagar en el último año. Se intimó por carta documento.' });
    cobroOtro(L2, al1a, al1a.inicio, 'deposito', 2000000, BCO, 'Depósito de garantía (2 meses)');
    serie(L2, al1a, -20, -9, { dia: 12, medio: EF, mes: { '-10': { dia: 25 }, '-9': { dia: 27 } } });
    entregas(al1a, [
        { f: al1a.inicio, items: [['Llaves del local', 3], ['Control de la alarma', 2]], entrega: ADM, recibe: 'Panificadora Los Andes S.R.L.' },
        { f: fm(-7, 12), tipo: 'devolucion', items: [['Llaves del local', 3], ['Control de la alarma', 1]], obs: 'Falta un control de la alarma (ver acta de entrega).',
          entrega: 'Mario Sosa (Los Andes)', recibe: ADM }
    ]);
    finalizar(al1a, { en: fm(-7, 12), motivo: 'incumplimiento', deposito: 'retenido', por: 'alquileres@delplata-demo.com',
        obs: 'Rescisión por falta de pago de dos cuotas. El depósito se aplicó a deudas; el saldo se reclama por vía extrajudicial.' });
    ALQ2.push(al1a);

    // ══════════════════════════════════════════════════════════════════════
    //  CONSTRUCTORA LOS ÁLAMOS — unidades propias (proyecto principal)
    // ══════════════════════════════════════════════════════════════════════
    var ALQ1 = [], ADM1 = 'Laura Fernández — Constructora Los Álamos';

    // Local PB-1 — CAC semestral, con IVA (todo gravado) por Galicia y factura A por cada cuota
    var apb1 = contrato({ id: 'alq_pb1', unidad: 'Local PB-1', tipo: 'local', direccion: 'Av. Cabildo 3120, PB (Torre Álamos I)',
        inquilino: 'Café de Autor Santa Rita S.R.L.', email: 'administracion@santarita-demo.com', doc: ['CUIT', soloDig(cuit('30', 52004871))], sociedad: true,
        contacto: ['Gonzalo Pereyra', '11 5561-4402'], garante: ['Gonzalo Pereyra', 'DNI', '28455931', '11 5561-4402'],
        inicio: fm(-17, 1), meses: 36, canon: 1350000, ajustes: [[-11, 1518000], [-5, 1691000]], indice: 'CAC', frecuencia: 6, cac: [21711.15, 24185.6], diaPago: 10,
        deposito: [2700000, 2], iva: [21, 100], obs: 'Local con salida a la vereda para mesas. Rubro gastronómico.' });
    cobroOtro(L1, apb1, apb1.inicio, 'deposito', 2700000, BCO_GAL, 'Depósito de garantía (2 meses)');
    serie(L1, apb1, -17, 0, { dia: 7, medio: BCO_GAL, pv: '0002' });
    ALQ1.push(apb1);

    // Local PB-2 — ICL, con IVA sólo sobre una parte del canon (60 %): la gravada entra por Santander con factura y el resto en efectivo.
    //              La cuota de este mes está VENCIDA.
    var apb2 = contrato({ id: 'alq_pb2', unidad: 'Local PB-2', tipo: 'local', direccion: 'Av. Cabildo 3120, PB (Torre Álamos I)',
        inquilino: 'Estudio Contable Mansilla & Asociados S.R.L.', email: 'cobranzas@mansillacontadores-demo.com', doc: ['CUIT', soloDig(cuit('30', 52391806))], sociedad: true,
        contacto: ['Cdora. Inés Mansilla', 'ines.mansilla@mansillacontadores-demo.com'], garante: ['Inés Mansilla', 'DNI', '22804376', '11 5562-7715'],
        inicio: fm(-11, 1), meses: 36, canon: 1180000, ajustes: [[-5, 1340000]], indice: 'ICL', frecuencia: 6, diaPago: Math.max(1, DIA_HOY - 6),
        deposito: [2360000, 2], iva: [21, 60], obs: 'Se factura el 60 % del canon con IVA; el resto se cobra sin factura, en efectivo.' });
    cobroOtro(L1, apb2, apb2.inicio, 'deposito', 2360000, BCO_SAN, 'Depósito de garantía (2 meses)');
    serie(L1, apb2, -11, -1, { dia: 5, medio: BCO_SAN, medioB: EF, pv: '0002' });
    ALQ1.push(apb2);

    // Cochera S-21 — IPC semestral, transferencia a Galicia; la cuota de este mes vence en unos días
    var as21 = contrato({ id: 'alq_s21', unidad: 'Cochera S-21', tipo: 'cochera', direccion: 'Av. Cabildo 3120, subsuelo (Torre Álamos I)',
        inquilino: 'Héctor Domínguez', email: 'hector.dominguez@correo-demo.com', doc: ['DNI', '26318754'],
        inicio: fm(-9, 1), meses: 24, canon: 128000, ajustes: [[-3, 143000]], indice: 'IPC', frecuencia: 6, diaPago: Math.min(DIA_HOY + 3, 31),
        deposito: [128000, 1], obs: '' });
    cobroOtro(L1, as21, as21.inicio, 'deposito', 128000, BCO_GAL, 'Depósito de garantía');
    serie(L1, as21, -9, -1, { dia: 19, medio: BCO_GAL });
    ALQ1.push(as21);

    // Cochera S-22 — locación finalizada hace unos meses; la unidad quedó «Disponible»
    var as22 = contrato({ id: 'alq_s22_ant', unidad: 'Cochera S-22', tipo: 'cochera', direccion: 'Av. Cabildo 3120, subsuelo (Torre Álamos I)',
        inquilino: 'Gabriela Núñez', email: 'gabriela.nunez@correo-demo.com', doc: ['DNI', '30772485'],
        inicio: fm(-15, 1), meses: 12, canon: 98000, indice: 'FIJO', diaPago: 10, deposito: [98000, 1] });
    cobroOtro(L1, as22, as22.inicio, 'deposito', 98000, EF, 'Depósito de garantía');
    serie(L1, as22, -15, -4, { dia: 6, medio: EF });
    entregas(as22, [
        { f: as22.inicio, items: [['Control remoto del portón de cocheras', 1], ['Tarjeta de acceso al subsuelo', 1]], entrega: ADM1, recibe: 'Gabriela Núñez' },
        { f: finMes(-4), tipo: 'devolucion', items: [['Control remoto del portón de cocheras', 1], ['Tarjeta de acceso al subsuelo', 1]], entrega: 'Gabriela Núñez', recibe: ADM1 }
    ]);
    finalizar(as22, { en: finMes(-4), motivo: 'vencimiento', deposito: 'devuelto', obs: 'No renovó: se mudó de barrio.' });
    ALQ1.push(as22, filaDisponible(as22));

    // ══════════════════════════════════════════════════════════════════════
    //  SERVICIOS (honorarios)
    // ══════════════════════════════════════════════════════════════════════
    // o: id, f (fecha), cliente, descripcion, tipo, base, cac [base, actual], avance, adicionales, obs, cobros [{f, monto, concepto, ref, medio}]
    function servicio(L, o) {
        var fac = (o.cac && o.cac[0] > 0 && o.cac[1] > 0) ? o.cac[1] / o.cac[0] : 1, ajustado = o.base * fac;
        var total = ajustado * (o.avance / 100) + (o.adicionales || 0), cobrado = 0;
        var cobros = o.cobros.map(function (c) {
            var medio = c.medio || EF, reg = { fecha: c.f, monto: c.monto, concepto: c.concepto || 'honorarios', ref: c.ref || '', nroRecibo: '', tipoAB: medio.t };
            if (medio.t === 'A' && medio.cta) reg.cuentaId = medio.cta;
            L.reg(reg); cobrado += c.monto;
            return reg;
        });
        return { id: o.id, fecha: o.f, cliente: o.cliente, descripcion: o.descripcion, tipo: o.tipo, base: o.base,
                 cacBase: o.cac ? o.cac[0] : 0, cacActual: o.cac ? o.cac[1] : 0, factor: fac, ajustado: r2(ajustado), avance: o.avance,
                 adicionales: o.adicionales || 0, total: r2(total), cobrado: cobrado, obs: o.obs || '', cobrosHistorial: cobros };
    }

    var SRV2 = [
        servicio(L2, { id: 'srv_adm_dominguez', f: dia(-130), cliente: 'Raúl Domínguez (propietario)', tipo: 'consultoria',
            descripcion: 'Administración de 6 propiedades — honorarios del semestre', base: 5400000, avance: 67,
            obs: 'Honorarios del 5 % de los alquileres de sus unidades, en 6 cuotas mensuales. Van 4 de 6 meses.',
            cobros: [{ f: dia(-95), monto: 900000, concepto: 'anticipo', ref: 'Honorarios — cuota 1 de 6', medio: BCO },
                     { f: dia(-40), monto: 900000, ref: 'Honorarios — cuota 2 de 6', medio: BCO },
                     { f: dia(-8), monto: 900000, ref: 'Honorarios — cuota 3 de 6', medio: BCO }] }),
        servicio(L2, { id: 'srv_tasacion_pasteur', f: dia(-75), cliente: 'Consorcio Pasteur 880', tipo: 'consultoria',
            descripcion: 'Tasación y asesoramiento para la venta de las cocheras del subsuelo', base: 1350000, avance: 100,
            cobros: [{ f: dia(-60), monto: 675000, concepto: 'anticipo', ref: 'Anticipo del 50 %' }, { f: dia(-22), monto: 675000, ref: 'Saldo contra entrega del informe' }] }),
        servicio(L2, { id: 'srv_tramites_quirno', f: dia(-34), cliente: 'Hnos. Quirno', tipo: 'tramites',
            descripcion: 'Trámites previos a la escritura: libre deuda, certificado de dominio e informe de inhibiciones', base: 620000, avance: 100, adicionales: 94000,
            obs: 'Los adicionales son los sellados y aranceles que adelantó la inmobiliaria.',
            cobros: [{ f: dia(-30), monto: 400000, concepto: 'anticipo', ref: 'Anticipo', medio: BCO }] }),
        servicio(L2, { id: 'srv_comision_3a', f: a3a.inicio, cliente: 'Alberto Mir (propietario)', tipo: 'otro',
            descripcion: 'Comisión por locación — Depto 3A Montevideo 1450 (1,5 meses de alquiler)', base: 1545000, avance: 100,
            cobros: [{ f: a3a.inicio, monto: 1545000, ref: 'Cobrado el día de la firma del contrato' }] }),
        servicio(L2, { id: 'srv_inspeccion_soler', f: dia(-6), cliente: 'Sucesión Benítez', tipo: 'inspeccion',
            descripcion: 'Informe de estado del inmueble Soler 3800 con fotos y relevamiento de faltantes', base: 180000, avance: 100,
            obs: 'Pendiente de cobro: se factura al entregar el informe firmado.', cobros: [] })
    ];
    var SRV1 = [
        servicio(L1, { id: 'srv_obra_peralta', f: dia(-170), cliente: 'Familia Peralta', tipo: 'direccion_obra',
            descripcion: 'Dirección de obra — Casa Peralta (Pilar), 210 m²', base: 18500000, cac: [21980.4, 24185.6], avance: 55, adicionales: 650000,
            obs: 'Honorarios ajustados por CAC. Los adicionales corresponden a la ampliación del quincho.',
            cobros: [{ f: dia(-150), monto: 3700000, concepto: 'anticipo', ref: 'Anticipo del 20 %', medio: BCO_GAL },
                     { f: dia(-88), monto: 3000000, ref: 'Certificado N° 1', medio: BCO_SAN },
                     { f: dia(-33), monto: 2600000, ref: 'Certificado N° 2', medio: BCO_GAL }] }),
        servicio(L1, { id: 'srv_proy_benitez', f: dia(-210), cliente: 'Marcela Benítez', tipo: 'proyecto',
            descripcion: 'Proyecto ejecutivo y documentación — dúplex en Belgrano', base: 6200000, avance: 100,
            cobros: [{ f: dia(-205), monto: 3100000, concepto: 'anticipo', ref: 'Anticipo del 50 %', medio: BCO_GAL },
                     { f: dia(-121), monto: 3100000, ref: 'Saldo contra entrega de planos', medio: BCO_GAL }] }),
        servicio(L1, { id: 'srv_insp_galpon', f: dia(-27), cliente: 'Logística Sur Cargas S.A.', tipo: 'inspeccion',
            descripcion: 'Inspección técnica y tasación — galpón en Parque Industrial', base: 1850000, avance: 100,
            obs: 'Informe entregado; falta cobrar el saldo.',
            cobros: [{ f: dia(-25), monto: 925000, concepto: 'anticipo', ref: 'Anticipo del 50 %', medio: BCO_SAN }] })
    ];

    L1.cerrar();
    L2.cerrar();

    // ══════════════════════════════════════════════════════════════════════
    //  AGENDA DE VENCIMIENTOS (global: cruza las dos empresas)
    // ══════════════════════════════════════════════════════════════════════
    // Una factura de ejemplo, muy chica, para que el 📎 abra algo (un PDF de una página armado acá mismo)
    function sinTildes(t) { return String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[()\\]/g, ''); }
    function pdfMini(lineas) {
        var cont = 'BT /F1 15 Tf 56 770 Td 22 TL ' + lineas.map(function (t, i) { return (i ? 'T* ' : '') + '(' + sinTildes(t) + ') Tj'; }).join(' ') + ' ET';
        var objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
            '<< /Length ' + cont.length + ' >>\nstream\n' + cont + '\nendstream', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
        var pdf = '%PDF-1.4\n', offs = [];
        objs.forEach(function (o, i) { offs.push(pdf.length); pdf += (i + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
        var xref = pdf.length;
        pdf += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + offs.map(function (p) { return ('0000000000' + p).slice(-10) + ' 00000 n \n'; }).join('') +
            'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF';
        return btoa(pdf);
    }
    function adj(nombre, lineas) { return { nombre: nombre, tipo: 'application/pdf', contenido: pdfMini(lineas) }; }
    function plata(n, mon) { return (mon === 'USD' ? 'USD ' : '$ ') + n.toLocaleString('es-AR'); }

    var VENC = [], VN = 0;
    var EMP1 = DEMO.EMP, PRY1 = DEMO.PROY, EMP2 = DEMO.EMP2, PRY2 = DEMO.PROY2;
    var MAIL1 = 'administracion@constructora-demo.com', MAIL2 = 'alquileres@delplata-demo.com';
    // o: emp [empresaId, proyectoId], alias, prov, cuit, d (días hasta el vencimiento; negativo = ya venció), monto, moneda, desc, nota, url [web, usuario, clave],
    //    rec (se repite todos los meses), pagado (días desde que se pagó, negativo), aviso (ya se mandaron los mails de aviso), mail, pdf (líneas de la factura)
    function venc(o) {
        VN++;
        var v = { id: 'VS-demo-' + ('0' + VN).slice(-2), alias: o.alias, empresaId: o.emp[0], proyectoId: o.emp[1], empresaProveedora: o.prov, cuit: o.cuit || '',
                  fechaVencimiento: dia(o.d), monto: o.monto, moneda: o.moneda || 'ARS', descripcion: o.desc || '', comentarios: o.nota || '',
                  servicioUrl: o.url ? o.url[0] : '', servicioUsuario: o.url ? o.url[1] : '', servicioPassword: o.url ? o.url[2] : '',
                  diasAviso: [10, 5], emailAlerta: o.mail || (o.emp[0] === EMP1 ? MAIL1 : MAIL2), recurrente: o.rec !== false,
                  pagado: o.pagado != null, creadoEn: Date.now() - 86400000 * (35 + VN) };
        if (o.pagado != null) v.fechaPago = dia(o.pagado);
        var rec = {};
        if (o.pagado == null && o.d <= 10) rec['10'] = true;
        if (o.pagado == null && o.d <= 5) rec['5'] = true;
        if (o.pagado != null) { rec['10'] = true; rec['5'] = true; }
        if (rec['10'] || rec['5']) v.recordatorios = rec;
        if (o.pdf) v.adjunto = adj(sinTildes(o.alias).replace(/[^A-Za-z0-9]+/g, '_') + '.pdf', o.pdf);
        VENC.push(v);
        return v;
    }
    var URL_WEB = 'https://example.com/clientes';
    var CUIT_LUZ = cuit('30', 51115702), CUIT_AGUA = cuit('30', 51240318), CUIT_GAS = cuit('30', 51330655), CUIT_NET = cuit('30', 52118374),
        CUIT_ART = cuit('30', 51796420), CUIT_SEG = cuit('30', 50886220), CUIT_SF = cuit('30', 51405569), CUIT_COL = cuit('30', 50912384);

    // Constructora Los Álamos
    venc({ emp: [EMP1, PRY1], alias: 'Luz — obrador Los Álamos', prov: 'Distribuidora Eléctrica del Plata S.A.', cuit: CUIT_LUZ, d: 3, monto: 1865400,
        desc: 'Consumo del obrador y la grúa torre — período anterior', nota: 'El consumo sube en los meses de colada de losas.', url: [URL_WEB + '/luz', 'cuenta 4471-2203', 'demo1234'],
        pdf: ['Factura de servicio de energia - EJEMPLO', 'Distribuidora Electrica del Plata S.A.', 'Suministro: Obrador Los Alamos', 'Importe: ' + plata(1865400), 'Version de prueba - datos inventados'] });
    venc({ emp: [EMP1, PRY1], alias: 'Agua — obrador', prov: 'Aguas del Río de la Plata S.A.', cuit: CUIT_AGUA, d: -5, monto: 386200, desc: 'Servicio medido del obrador',
        nota: 'Quedó sin pagar por el cambio de cuenta bancaria.' });
    venc({ emp: [EMP1, PRY1], alias: 'Seguro técnico y de caución — obra', prov: 'Seguros del Sur Compañía de Seguros S.A.', cuit: CUIT_SEG, d: 8, monto: 3240000,
        desc: 'Cuota mensual de la póliza todo riesgo construcción', pdf: ['Cuota de poliza - EJEMPLO', 'Seguros del Sur Compania de Seguros S.A.', 'Todo riesgo construccion - Edificio Los Alamos', 'Importe: ' + plata(3240000), 'Version de prueba - datos inventados'] });
    venc({ emp: [EMP1, PRY1], alias: 'ART — nómina de obra', prov: 'Prevención ART S.A.', cuit: CUIT_ART, d: 17, monto: 2715800, desc: 'Cobertura de riesgos del trabajo de todo el personal de obra' });
    venc({ emp: [EMP1, PRY1], alias: 'Internet y telefonía — oficina Libertador', prov: 'Fibra Total Telecomunicaciones S.A.', cuit: CUIT_NET, d: -6, pagado: -8, monto: 214500,
        desc: 'Fibra 600 Mb y 8 líneas' });
    venc({ emp: [EMP1, PRY1], alias: 'Internet y telefonía — oficina Libertador', prov: 'Fibra Total Telecomunicaciones S.A.', cuit: CUIT_NET, d: 24, monto: 214500,
        desc: 'Fibra 600 Mb y 8 líneas' });
    venc({ emp: [EMP1, PRY1], alias: 'Expensas — oficina piso 8', prov: 'Consorcio Av. del Libertador 4500', d: 1, monto: 468900, desc: 'Expensas ordinarias del mes',
        pdf: ['Liquidacion de expensas - EJEMPLO', 'Consorcio Av. del Libertador 4500', 'Piso 8 - Oficina', 'Importe: ' + plata(468900), 'Version de prueba - datos inventados'] });
    venc({ emp: [EMP1, PRY1], alias: 'Sistema de gestión y hosting', prov: 'Nube Gestión Software LLC', d: 12, monto: 140, moneda: 'USD',
        desc: 'Licencia mensual del sistema y servidor', nota: 'Se paga en dólares con la tarjeta corporativa.' });
    venc({ emp: [EMP1, PRY1], alias: 'ABL — oficina Libertador', prov: 'Dirección de Rentas — ABL', d: -20, pagado: -22, monto: 187300, desc: 'Cuota bimestral de ABL', rec: true });
    venc({ emp: [EMP1, PRY1], alias: 'ABL — oficina Libertador', prov: 'Dirección de Rentas — ABL', d: 40, monto: 187300, desc: 'Cuota bimestral de ABL' });
    // Inmobiliaria Del Plata
    venc({ emp: [EMP2, PRY2], alias: 'Alquiler — oficina Av. Santa Fe 2200', prov: 'Inversiones Santa Fe 2200 S.A.', cuit: CUIT_SF, d: 2, monto: 1640000,
        desc: 'Alquiler mensual de la oficina de la inmobiliaria (piso 3)', nota: 'Se paga por transferencia los primeros días del mes.',
        pdf: ['Recibo de alquiler - EJEMPLO', 'Inversiones Santa Fe 2200 S.A.', 'Oficina piso 3 - Av. Santa Fe 2200', 'Importe: ' + plata(1640000), 'Version de prueba - datos inventados'] });
    venc({ emp: [EMP2, PRY2], alias: 'Luz — oficina Santa Fe', prov: 'Distribuidora Eléctrica del Plata S.A.', cuit: CUIT_LUZ, d: -2, monto: 142300, desc: 'Consumo de la oficina',
        url: [URL_WEB + '/luz', 'cuenta 5520-1187', 'demo1234'] });
    venc({ emp: [EMP2, PRY2], alias: 'Expensas — Depto 1A Soler 3800 (disponible)', prov: 'Administración Consorcio Soler 3800', d: 6, monto: 118700,
        desc: 'Expensas de la unidad vacía: las paga la inmobiliaria hasta que se alquile', nota: 'Se descuentan del nuevo contrato al firmar.' });
    venc({ emp: [EMP2, PRY2], alias: 'ABL — Depto 6C Arenales 2950 (disponible)', prov: 'Dirección de Rentas — ABL', d: 9, monto: 64200, desc: 'Cuota bimestral de la unidad libre' });
    venc({ emp: [EMP2, PRY2], alias: 'Gas — Depto 1A Soler 3800 (disponible)', prov: 'Gas Metropolitano S.A.', cuit: CUIT_GAS, d: -9, monto: 28400, desc: 'Cargo fijo de la unidad libre',
        nota: 'Pedir la baja temporal del servicio hasta que se alquile.' });
    venc({ emp: [EMP2, PRY2], alias: 'Internet — oficina Santa Fe', prov: 'Fibra Total Telecomunicaciones S.A.', cuit: CUIT_NET, d: -4, pagado: -5, monto: 46900, desc: 'Fibra 300 Mb' });
    venc({ emp: [EMP2, PRY2], alias: 'Internet — oficina Santa Fe', prov: 'Fibra Total Telecomunicaciones S.A.', cuit: CUIT_NET, d: 26, monto: 46900, desc: 'Fibra 300 Mb' });
    venc({ emp: [EMP2, PRY2], alias: 'Seguro de caución — contratos de locación', prov: 'Seguros del Sur Compañía de Seguros S.A.', cuit: CUIT_SEG, d: 21, monto: 385000,
        desc: 'Prima mensual de las cauciones que reemplazan al garante' });
    venc({ emp: [EMP2, PRY2], alias: 'Matrícula de corredor inmobiliario — renovación anual', prov: 'Colegio de Corredores Inmobiliarios', cuit: CUIT_COL, d: 52, monto: 220000,
        desc: 'Matrícula profesional de los corredores de la inmobiliaria', rec: false });

    // ══════════════════════════════════════════════════════════════════════
    //  Escritura en la base
    // ══════════════════════════════════════════════════════════════════════
    DEMO.set(r, B2 + '/alquileres', DEMO.porId(ALQ2));
    DEMO.set(r, B2 + '/servicios', DEMO.porId(SRV2));
    DEMO.set(r, B1 + '/alquileres', DEMO.porId(ALQ1));
    DEMO.set(r, B1 + '/servicios', DEMO.porId(SRV1));
    DEMO.set(r, 'global/vencimientosServicios', DEMO.porId(VENC));
});
