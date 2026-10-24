/* Versión de prueba — datos de ejemplo: OBRA Y PERSONAL (todo inventado).

   Qué siembra
     <proyecto principal>/planTrabajo        etapas e ítems de obra con avance real (pantalla «Plan de trabajo»)
     <proyecto principal>/tareas             pizarrón de tareas del Inicio (la app lo guarda POR PROYECTO, no por empresa)
     <proyecto principal>/remuneraciones     legajos (🅰️ sueldoBasico = Parte A · 🅱️ sueldoNoRemun = Parte B)
     remuneracionesRecibos · remuneracionesPagos · remuneracionesConsolidados     (rutas fijas de la raíz, sólo superadmin)
     remuneracionesActualizacion             meses (IPC / Comercio / sumas), empleados, categorías y acuerdos paritarios

   Reglas que respeta (ver CLAUDE.md)
     · El neto de cada recibo sale de las MISMAS cuentas que remNetoOficial / remAportesLey (aportes 17% sobre básico + haberes
       remunerativos; la Parte B va en el recibo pero no tributa). Cada pago suma exacto el neto liquidado (banco + efectivo).
     · Lo cargado en Actualización → sueldos es la BASE sin sumas no remunerativas: los empleados de convenio siguen la cadena de
       los acuerdos (cada tramo suma pct × el sueldo base del mes anterior al acuerdo, igual que _actAcEncadenar), y su Parte B
       del legajo es la suma no remunerativa vigente. Así «Remuneraciones» y «Actualización» cuentan la misma historia.
     · La clave de pantalla de Actualización NO se siembra (queda sin clave).
     · Todas las fechas y meses son relativos a hoy.

   Vínculos con otros módulos
     · Los ítems del plan con src 'presup' y idx 0–9 apuntan a los presupuestos de demo-seed-egresos.js POR POSICIÓN (el orden de
       `datos` está documentado ahí). Los importes son una foto, como en la app real (el plan guarda su propia copia). Los ítems con
       idx ≥ 1000 son propios del plan y nunca coinciden con un presupuesto o una factura reales.
     · Las consolidaciones de sueldos apuntan a movimientos «Remuneraciones» de Caja/Banco (CONS-…-CAJA / -BANCO) que NO se siembran
       en ingGeneral para no descuadrar el saldo de Caja que arma demo-seed-ingresos.js: figuran como en la app pero sin ese asiento. */
(window.DEMO_SEEDS = window.DEMO_SEEDS || []).push(function (r) {
    var D = DEMO.dia, B = DEMO.base;
    var EMP_ID = DEMO.EMP, PROY_ID = DEMO.PROY, EMP_NOM = 'Constructora Los Álamos S.A.';
    var CTA = DEMO.CTA_GALICIA, CTA_NOM = 'Banco Galicia · ALAMOS.OBRA.GALICIA';

    // ── utilidades ─────────────────────────────────────────────────────
    function red2(n) { return Math.round(n * 100) / 100; }
    function pad(n, w) { var s = String(n); while (s.length < w) s = '0' + s; return s; }
    var MESES_NOM = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    function mesLab(m) { return MESES_NOM[parseInt(m.slice(5, 7), 10) - 1] + ' ' + m.slice(0, 4); }
    function ts(fecha) { return new Date(fecha + 'T12:00:00').getTime(); }
    var HOY_D = new Date().getDate();
    // día del mes actual, `atras` días antes de hoy pero sin salirse del mes (para que nada quede en el futuro ni en otro mes)
    function diaMes0(atras) { return DEMO.fecha(0, Math.max(1, Math.min(28, HOY_D - atras))); }

    // ═══════════════════════════════════════════════════════════════════
    // 1) PLAN DE TRABAJO — etapas de obra del Edificio Los Álamos
    // ═══════════════════════════════════════════════════════════════════
    // Ítem del plan: src 'presup' | 'factura' + idx (posición en datos / facturas) y una copia de los importes.
    function itPres(idx, prov, concepto, presupuesto, pagado) { return { src: 'presup', idx: idx, proveedor: prov, concepto: concepto, presupuesto: presupuesto, pagado: pagado }; }
    function itFact(n, prov, concepto, presupuesto, pagado) { return { src: 'factura', idx: 1000 + n, proveedor: prov, concepto: concepto, presupuesto: presupuesto, pagado: pagado }; }
    function ta(nombre, peso, avance) { return { nombre: nombre, peso: peso, avance: avance }; }

    // Presupuestos de proveedores (posiciones 0–9 de `datos`, ver demo-seed-egresos.js)
    var P_HORMI = 'Hormigonera del Plata S.A.', P_HIERRO = 'Hierros Don Aníbal S.R.L.', P_PAMPA = 'Alquileres de Equipos Pampa S.R.L.',
        P_QUIROGA = 'Ingeniería Estructural Quiroga S.R.L.', P_CEIBO = 'Corralón El Ceibo - Salvatierra Ricardo', P_CLIMA = 'Climatización Austral S.A.';
    var n = 0;
    var PLAN = [
        { id: 'et_01', nombre: 'Trabajos preliminares y movimiento de suelos', fechaInicio: D(-205), fechaFin: D(-160),
          obs: 'Obrador, cerco de obra, estudio de suelos, excavación y submuración de medianeras.', presupuestoLimite: 28000000,
          items: [
            itFact(++n, P_PAMPA, 'N°0004-00001187 Retroexcavadora, camiones volcadores y obrador (6 semanas)', 14800000, 14800000),
            itFact(++n, P_QUIROGA, 'N°0002-00000451 Estudio de suelos y proyecto de submuración', 6200000, 6200000),
            itFact(++n, P_CEIBO, 'N°0011-00028764 Cerco de obra, obrador y señalización', 4100000, 4100000)
          ],
          tareas: [ta('Obrador y cerco perimetral', 1, 100), ta('Estudio de suelos', 1, 100), ta('Excavación y retiro de suelo', 3, 100), ta('Submuración de medianeras', 2, 100)] },
        { id: 'et_02', nombre: 'Fundaciones (platea y submuros)', fechaInicio: D(-160), fechaFin: D(-100),
          obs: 'Platea de fundación y submuros de contención con impermeabilización. Aprobada por el estudio de ingeniería.', presupuestoLimite: 115000000,
          items: [
            itFact(++n, P_HORMI, 'N°0012-00006120 Hormigón H-25 para platea y submuros (320 m³)', 52800000, 52800000),
            itFact(++n, P_HIERRO, 'N°0003-00010942 Hierros ADN 420 para platea y submuros (28 t)', 41600000, 41600000),
            itFact(++n, P_PAMPA, 'N°0004-00001302 Bomba de hormigón, vibradores y encofrado metálico', 9400000, 9400000),
            itFact(++n, P_CEIBO, 'N°0011-00029377 Impermeabilización, encofrados y separadores', 7900000, 7900000)
          ],
          tareas: [ta('Excavación y nivelación de platea', 1, 100), ta('Armado de hierros de platea', 2, 100), ta('Hormigonado de platea', 3, 100), ta('Submuros y muros de contención', 2, 100), ta('Impermeabilización', 1, 100)] },
        { id: 'et_03', nombre: 'Estructura de hormigón armado', fechaInicio: D(-110), fechaFin: D(14),
          obs: 'Columnas, tabiques, losas y escaleras (PB + 8 pisos + sala de máquinas). Mayores costos por actualización del índice CAC.', presupuestoLimite: 400000000,
          items: [
            itPres(0, 'Hormigonera del Plata S.A.', 'Hormigón elaborado H-30 — estructura de la torre (1.100 m³)', 214500000, 233413195),
            itPres(1, 'Hierros Don Aníbal S.R.L.', 'Hierros ADN 420 y mallas electrosoldadas — estructura', 168000000, 130021611),
            itFact(++n, P_QUIROGA, 'N°0002-00000498 Cálculo estructural y verificación de planos de armadura', 9600000, 9600000),
            itFact(++n, P_PAMPA, 'N°0004-00001455 Grúa torre, andamios y encofrados (4 meses)', 31200000, 24000000)
          ],
          tareas: [ta('Columnas y tabiques PB a 3° piso', 3, 100), ta('Losas PB a 3° piso', 3, 100), ta('Columnas y tabiques 4° a 8° piso', 3, 90), ta('Losas 4° a 8° piso', 3, 80), ta('Sala de máquinas y tanque de reserva', 1, 40), ta('Escaleras y rampas', 1, 70)] },
        { id: 'et_04', nombre: 'Mampostería y cerramientos', fechaInicio: D(-35), fechaFin: D(40),
          obs: 'Muros exteriores e interiores. Demora por días de lluvia y faltante de ladrillo cerámico.', presupuestoLimite: 95000000,
          items: [
            itPres(2, 'Ladrillera San Cayetano S.A.', 'Mampostería — ladrillos huecos, bloques y cerámicos (22.000 m²)', 72000000, 30755000),
            itFact(++n, P_CEIBO, 'N°0011-00031208 Cemento, cal, arena y adhesivos cementicios', 11400000, 8200000),
            itFact(++n, P_PAMPA, 'N°0004-00001519 Andamios colgantes y balancines', 6800000, 2000000)
          ],
          tareas: [ta('Muros exteriores PB a 3° piso', 3, 60), ta('Muros exteriores 4° a 8° piso', 3, 10), ta('Tabiques interiores', 3, 20), ta('Cargas y dinteles', 1, 40)] },
        { id: 'et_05', nombre: 'Instalaciones eléctricas, sanitarias y de gas', fechaInicio: D(-10), fechaFin: D(75),
          obs: 'Instalaciones embutidas: eléctrica, sanitaria, pluvial, gas y pre-instalación de aire acondicionado.', presupuestoLimite: 160000000,
          items: [
            itPres(4, 'Electro Instalaciones Méndez S.R.L.', 'Instalación eléctrica completa — materiales y mano de obra', 97000000, 45933847),
            itFact(++n, P_CLIMA, 'N°0009-00002246 Pre-instalación de aire acondicionado split (48 UF) — anticipo', 36000000, 10800000),
            itFact(++n, P_CEIBO, 'N°0011-00031877 Cañerías de agua, cloacales y gas (polipropileno y PVC)', 18700000, 6000000)
          ],
          tareas: [ta('Canalizaciones eléctricas', 2, 60), ta('Cableado y tableros seccionales', 2, 15), ta('Cañerías sanitarias y pluviales', 2, 40), ta('Instalación de gas', 1, 10), ta('Pre-instalación de aire acondicionado', 1, 25)] },
        { id: 'et_06', nombre: 'Ascensores', fechaInicio: D(20), fechaFin: D(135),
          obs: 'Dos equipos de 8 pasajeros: obra civil del pozo, fabricación e importación, montaje y habilitación.', presupuestoLimite: 150000000,
          items: [
            itPres(5, 'Ascensores Norte-Sur S.A.', 'Ascensores (2 equipos de 8 pasajeros) — suministro y montaje', 138000000, 55874803),
            itFact(++n, P_QUIROGA, 'N°0002-00000512 Proyecto de pozo y sala de máquinas', 3100000, 3100000)
          ],
          tareas: [ta('Fabricación e importación de equipos', 3, 45), ta('Obra civil de pozo y sala de máquinas', 2, 60), ta('Montaje y puesta en marcha', 3, 0), ta('Habilitación municipal', 1, 0)] },
        { id: 'et_07', nombre: 'Carpinterías de aluminio', fechaInicio: D(5), fechaFin: D(60),
          obs: 'Aberturas con DVH (96 unidades). Fabricación en el taller del proveedor y colocación por pisos.', presupuestoLimite: 80000000,
          items: [
            itPres(6, 'Aberturas Patagonia S.A.', 'Aberturas de aluminio con DVH — 96 unidades', 72900000, 33780000),
            itFact(++n, P_CEIBO, 'N°0011-00032044 Premarcos, selladores y espumas', 4200000, 1500000)
          ],
          tareas: [ta('Relevamiento y medición en obra', 1, 100), ta('Fabricación de aberturas', 3, 55), ta('Colocación PB a 4° piso', 3, 0), ta('Colocación 5° a 8° piso', 3, 0)] },
        { id: 'et_08', nombre: 'Terminaciones', fechaInicio: D(40), fechaFin: D(150),
          obs: 'Pisos, revestimientos, sanitarios, griferías y pintura interior y de frente.', presupuestoLimite: 120000000,
          items: [
            itPres(3, 'Sanitarios Rioplatense S.A.', 'Sanitarios, griferías y accesorios — 48 unidades funcionales', 40000000, 0),
            itPres(7, 'Pinturas y Revestimientos Alfa S.R.L.', 'Pintura interior y exterior + revestimientos texturados', 38500000, 7700000),
            itFact(++n, P_CEIBO, 'N°0011-00032390 Cerámicos, porcelanatos y pastinas (48 UF)', 28000000, 0)
          ],
          tareas: [ta('Pisos y revestimientos', 3, 0), ta('Sanitarios y grifería', 2, 0), ta('Pintura interior y exterior', 3, 5)] },
        { id: 'et_09', nombre: 'Dirección de obra, seguros y habilitaciones', fechaInicio: D(-200), fechaFin: D(200),
          obs: 'Honorarios de proyecto y dirección de obra, seguros y trámites de final de obra.', presupuestoLimite: 70000000,
          items: [
            itPres(8, 'Estudio Lavalle & Asociados S.R.L.', 'Honorarios — proyecto ejecutivo y dirección de obra (8 cuotas)', 48400000, 18150000),
            itPres(9, 'Seguros del Sur Compañía de Seguros S.A.', 'Seguro técnico de obra y responsabilidad civil', 14200000, 14200000)
          ],
          tareas: [ta('Proyecto ejecutivo y documentación', 3, 100), ta('Dirección técnica mensual', 4, 50), ta('Seguros de obra', 1, 100), ta('Final de obra y planos conforme a obra', 2, 0)] }
    ];
    DEMO.set(r, B + '/planTrabajo', DEMO.porId(PLAN));

    // ═══════════════════════════════════════════════════════════════════
    // 2) PIZARRÓN DE TAREAS (Inicio) — por proyecto
    // ═══════════════════════════════════════════════════════════════════
    var MAIL = '@constructora-demo.com';
    var PERS = {
        laura:    { n: 'Laura Fernández', e: 'laura.fernandez' + MAIL },
        martin:   { n: 'Martín Gómez', e: 'martin.gomez' + MAIL },
        julieta:  { n: 'Julieta Sosa', e: 'julieta.sosa' + MAIL },
        diego:    { n: 'Diego Acosta', e: 'diego.acosta' + MAIL },
        federico: { n: 'Federico Molina', e: 'federico.molina' + MAIL },
        pablo:    { n: 'Pablo Ruiz', e: 'pablo.ruiz' + MAIL }
    };
    var TAREAS = [], tn = 0, AHORA = Date.now(), DIA_MS = 86400000;
    // venc: días desde hoy; creada: días hacia atrás; hecha: días desde que se completó (sólo completadas)
    function tarea(titulo, resp, ctrl, venc, creada, intervalo, hecha) {
        var o = { id: 'tar_' + pad(++tn, 2), titulo: titulo, responsable: PERS[resp].n, emailResponsable: PERS[resp].e,
                  controlador: PERS[ctrl].n, emailControlador: PERS[ctrl].e, fechaVencimiento: venc == null ? '' : D(venc),
                  intervaloDias: intervalo, estado: 'pendiente', creadaEn: AHORA - creada * DIA_MS };
        if (hecha != null) { o.estado = 'completada'; o.completadaEn = AHORA - hecha * DIA_MS; o.ultimoRecordatorio = null; }
        else { o.ultimoRecordatorio = AHORA - DIA_MS; }   // un recordatorio reciente: la app no manda nada al abrir
        TAREAS.push(o);
    }
    tarea('Conciliar el extracto del Banco Galicia con la Caja General', 'julieta', 'laura', -2, 12, 3);
    tarea('Reclamar el saldo de cuotas del boleto de la unidad 5B', 'diego', 'laura', -5, 20, 3);
    tarea('Presentar la declaración jurada de IVA del mes anterior', 'julieta', 'laura', 3, 9, 3);
    tarea('Confirmar fecha de entrega de las aberturas con Aberturas Patagonia', 'martin', 'federico', 1, 6, 3);
    tarea('Cargar las facturas de proveedores recibidas esta semana', 'martin', 'julieta', 0, 4, 3);
    tarea('Certificado de avance de obra para el Estudio Lavalle', 'federico', 'laura', 4, 7, 7);
    tarea('Pedir tres presupuestos de pintura de frentes', 'martin', 'federico', 6, 5, 7);
    tarea('Actualizar el cronograma con la demora de mampostería', 'federico', 'pablo', 9, 3, 7);
    tarea('Renovar la póliza del seguro técnico de obra', 'laura', 'pablo', 25, 15, 7);
    tarea('Revisar los mayores costos por índice CAC antes de pagar la estructura', 'laura', 'pablo', null, 2, 7);
    tarea('Pagar el anticipo a Ascensores Norte-Sur', 'laura', 'pablo', -9, 24, 3, 8);
    tarea('Liquidar los sueldos del mes anterior', 'laura', 'pablo', -12, 30, 3, 13);
    tarea('Abonar la tasa de ocupación de vereda', 'diego', 'laura', -16, 26, 3, 15);
    DEMO.set(r, B + '/tareas', DEMO.porId(TAREAS));

    // ═══════════════════════════════════════════════════════════════════
    // 3) ACTUALIZACIÓN DE SUELDOS (se arma antes que Remuneraciones: de ahí salen los sueldos de convenio)
    // ═══════════════════════════════════════════════════════════════════
    // Meses: offsets -12 … 0 (0 = mes actual). Acuerdos paritarios de Comercio: 3 tramos mensuales cada uno.
    // tr: [% del mes, sumas no remunerativas vigentes desde ese mes (sólo el 1er tramo)]
    var ACUERDOS = [
        { id: 'ac_1', desde: -11, tr: [[2.0, 165000], [1.8], [1.8]] },
        { id: 'ac_2', desde: -8,  tr: [[2.2, 185000], [2.0], [2.0]] },
        { id: 'ac_3', desde: -5,  tr: [[2.2, 210000], [2.0], [1.8]] },
        { id: 'ac_4', desde: -2,  tr: [[2.4, 240000], [2.1], [2.0]] }
    ];
    var ACUERDO_PEND = { id: 'ac_5', desde: 1, tr: [[2.2, 270000], [2.0], [1.9]] };   // firmado hace poco, todavía sin aplicar
    var IPC = { '-12': 2.7, '-11': 2.6, '-10': 2.3, '-9': 2.1, '-8': 2.4, '-7': 2.2, '-6': 1.9, '-5': 2.3, '-4': 2.0, '-3': 1.8, '-2': 2.1, '-1': 2.2, '0': 2.0 };
    var SUMAS_BASE = 150000;
    function mesDe(k) { return DEMO.mes(k); }
    var pctMes = {}, sumasMes = {};
    ACUERDOS.forEach(function (a) { a.tr.forEach(function (t, i) { pctMes[a.desde + i] = t[0]; if (t[1] != null) sumasMes[a.desde + i] = t[1]; }); });
    function sumasEn(k) { var v = SUMAS_BASE; for (var j = -12; j <= k; j++) { if (sumasMes[j] != null) v = sumasMes[j]; } return v; }

    // Sueldo base (sin sumas) de un empleado de convenio mes a mes: cada tramo suma pct × el sueldo base del mes anterior al acuerdo
    // (redondeado a $1.000: es lo que se le paga y lo que figura en el legajo).
    function serieConvenio(b0) {
        var v = {}; v[-12] = b0;
        ACUERDOS.forEach(function (a) {
            var base = v[a.desde - 1], acum = 0;
            a.tr.forEach(function (t, i) { acum += t[0]; v[a.desde + i] = Math.round(base * (1 + acum / 100) / 1000) * 1000; });
        });
        return v;
    }
    var FACTOR = 1; ACUERDOS.forEach(function (a) { var s = 0; a.tr.forEach(function (t) { s += t[0]; }); FACTOR *= 1 + s / 100; });
    // b0 redondeado a $1.000 para que el sueldo de hoy caiga cerca del objetivo
    function b0Para(objetivo) { return Math.round(objetivo / FACTOR / 1000) * 1000; }
    // Fuera de convenio: sube cuando la empresa decide (escalones); los meses vacíos repiten el último
    function serieEscalones(pasos) {   // pasos: { offset: importe }
        var v = {}, ult = null;
        for (var k = -12; k <= 0; k++) { if (pasos[k] != null) ult = pasos[k]; v[k] = ult; }
        return v;
    }

    var EMPS = [
        { k: 'laura', nombre: 'Laura Fernández', puesto: 'Responsable de Administración y Finanzas', conv: false, tipo: 'dependencia', ing: 128, dia: 14,
          serie: serieEscalones({ '-12': 2300000, '-9': 2520000, '-6': 2740000, '-3': 2900000, '0': 3050000 }), partB: function () { return 650000; },
          pago: 'banco', obraSocial: 'OSDE 310', convenio: 'Fuera de convenio', sind: '', nac: [1984, 5, 22], civil: 'Casado/a', hijos: 2,
          dom: 'Aráoz 2415, Palermo, CABA', tel: '11 5555-0101' },
        { k: 'federico', nombre: 'Federico Molina', puesto: 'Jefe de Obra', conv: false, tipo: 'dependencia', ing: 98, dia: 2,
          serie: serieEscalones({ '-12': 2800000, '-8': 3020000, '-5': 3200000, '-2': 3420000 }), partB: function () { return 880000; },
          pago: 'B-efectivo', obraSocial: 'Swiss Medical', convenio: 'Fuera de convenio', sind: '', nac: [1979, 11, 3], civil: 'Casado/a', hijos: 3,
          dom: 'Av. Gaona 3340, Flores, CABA', tel: '11 5555-0102', lugar: 'Obra Edificio Los Álamos' },
        { k: 'martin', nombre: 'Martín Gómez', puesto: 'Encargado de Compras', conv: true, cat: 'c_admA', catNom: 'Administrativo A', tipo: 'dependencia', ing: 74, dia: 1,
          serie: serieConvenio(b0Para(1790000)), pago: 'B-efectivo', obraSocial: 'OSECAC', convenio: 'Comercio 130/75', sind: 'FAECYS', nac: [1988, 2, 9], civil: 'Conviviente', hijos: 1,
          dom: 'Terrada 1180, Villa del Parque, CABA', tel: '11 5555-0103' },
        { k: 'julieta', nombre: 'Julieta Sosa', puesto: 'Administrativa contable', conv: true, cat: 'c_admB', catNom: 'Administrativo B', tipo: 'dependencia', ing: 56, dia: 15,
          serie: serieConvenio(b0Para(1690000)), pago: 'B-efectivo', obraSocial: 'OSECAC', convenio: 'Comercio 130/75', sind: 'FAECYS', nac: [1992, 8, 17], civil: 'Soltero/a', hijos: 0,
          dom: 'Av. Córdoba 5260, Palermo, CABA', tel: '11 5555-0104' },
        { k: 'diego', nombre: 'Diego Acosta', puesto: 'Auxiliar de cobranzas', conv: true, cat: 'c_admC', catNom: 'Administrativo C', tipo: 'dependencia', ing: 41, dia: 3,
          serie: serieConvenio(b0Para(1580000)), pago: 'B-efectivo', obraSocial: 'OSECAC', convenio: 'Comercio 130/75', sind: 'FAECYS', nac: [1995, 4, 28], civil: 'Soltero/a', hijos: 0,
          dom: 'Lacarra 780, Villa Soldati, CABA', tel: '11 5555-0105' },
        { k: 'valeria', nombre: 'Valeria Benítez', puesto: 'Recepción y secretaría', conv: true, cat: 'c_admD', catNom: 'Administrativo D', tipo: 'dependencia', ing: 31, dia: 13,
          serie: serieConvenio(b0Para(1470000)), pago: 'B-efectivo', obraSocial: 'OSECAC', convenio: 'Comercio 130/75', sind: 'FAECYS', nac: [1997, 12, 11], civil: 'Soltero/a', hijos: 0,
          dom: 'Bolívar 455, San Telmo, CABA', tel: '11 5555-0106' },
        { k: 'nicolas', nombre: 'Nicolás Peralta', puesto: 'Maestranza y cadetería', conv: true, cat: 'c_maeA', catNom: 'Maestranza A', tipo: 'dependencia', ing: 22, dia: 8,
          serie: serieConvenio(b0Para(1310000)), pago: 'B-efectivo', obraSocial: 'OSECAC', convenio: 'Comercio 130/75', sind: 'FAECYS', nac: [2000, 7, 6], civil: 'Soltero/a', hijos: 0,
          dom: 'Av. Directorio 2290, Caballito, CABA', tel: '11 5555-0107' },
        { k: 'sergio', nombre: 'Sergio Villalba', puesto: 'Capataz general (monotributista)', conv: false, tipo: 'monotributo', ing: 36, dia: 6,
          serie: serieEscalones({ '-12': 1750000, '-6': 1950000, '-2': 2150000 }), partB: function () { return 0; },
          pago: 'banco', obraSocial: '', convenio: '', sind: '', nac: [1975, 9, 30], civil: 'Casado/a', hijos: 2,
          dom: 'Camino Real Morón 1640, Ituzaingó, Buenos Aires', tel: '11 5555-0108', lugar: 'Obra Edificio Los Álamos' }
    ];
    EMPS.forEach(function (e) {
        if (e.conv) { e.partB = function (k) { return sumasEn(k); }; }
        e.A = function (k) { return Math.round(e.serie[k]); };     // Parte A del legajo / básico del recibo (a pesos enteros)
        e.id = 'EMP-demo-' + e.k;
    });

    // Documento ficticio: DNI correlativos desde 33.000.100 y CUIL con dígito verificador válido
    function cuilDe(pref, dni) {
        var mult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
        for (var d = dni; ; d++) {
            var s = pref + pad(d, 8), t = 0, i;
            for (i = 0; i < 10; i++) t += parseInt(s.charAt(i), 10) * mult[i];
            var dv = 11 - (t % 11); if (dv === 11) dv = 0;
            if (dv === 10) continue;
            return { dni: d, cuil: pref.charAt(0) + pref.charAt(1) + '-' + pad(d, 8) + '-' + dv };
        }
    }
    var dniSig = 33000100;
    var PREF_MUJER = { laura: 1, julieta: 1, valeria: 1 };
    EMPS.forEach(function (e) {
        var c = cuilDe(PREF_MUJER[e.k] ? '27' : '20', dniSig);
        e.dniNum = c.dni; e.cuil = c.cuil; dniSig = c.dni + 1;
    });

    // meses/<mes>
    var A_MESES = {};
    for (var km = -12; km <= 0; km++) {
        var regm = { ipc: IPC[String(km)] };
        if (pctMes[km] != null) regm.comercio = pctMes[km];
        if (km === -12 || sumasMes[km] != null) regm.sumas = sumasMes[km] != null ? sumasMes[km] : SUMAS_BASE;
        A_MESES[mesDe(km)] = regm;
    }
    // empleados/<id> y categorias/<id>
    var A_EMPS = {}, A_CATS = {}, catOrden = 0;
    EMPS.forEach(function (e) {
        if (e.tipo === 'monotributo') return;   // los honorarios de un monotributista no se comparan con el convenio
        var sueldos = {};
        if (e.conv) { for (var k = -12; k <= 0; k++) sueldos[mesDe(k)] = e.serie[k]; }
        else { var ult = null; for (var j = -12; j <= 0; j++) { if (e.serie[j] !== ult) { sueldos[mesDe(j)] = e.serie[j]; ult = e.serie[j]; } } }
        var o = { nombre: e.nombre, sueldos: sueldos };
        if (e.conv) {
            o.categoria = e.cat;
            var basicos = {}; for (var q = -12; q <= 0; q++) basicos[mesDe(q)] = e.serie[q];
            A_CATS[e.cat] = { nombre: e.catNom, orden: catOrden++, basicos: basicos };
        } else { o.categoria = 'fuera'; o.sigueComercio = false; o.sinSumas = true; }
        A_EMPS['e_' + e.k] = o;
    });
    // acuerdos/<id>
    function acuerdoObj(a, aplicado) {
        var ms = []; for (var i = 0; i < a.tr.length; i++) ms.push(mesDe(a.desde + i));
        var o = { nombre: 'Acuerdo paritario ' + mesLab(ms[0]) + ' a ' + mesLab(ms[ms.length - 1]), desde: ms[0],
                  firmado: DEMO.fecha(a.desde - 1, 18), base: 'fijo', baseMes: mesDe(a.desde - 1), conSumas: false,
                  tramos: a.tr.map(function (t) { var x = { pct: t[0] }; if (t[1] != null) x.sumas = t[1]; return x; }) };
        if (aplicado) o.aplicado = { fecha: ts(DEMO.fecha(a.desde - 1, 22)), meses: a.tr.length, basicos: catOrden, sueldos: EMPS.filter(function (e) { return e.conv; }).length };
        return o;
    }
    var A_ACU = {};
    ACUERDOS.forEach(function (a) { A_ACU[a.id] = acuerdoObj(a, true); });
    A_ACU.ac_4.nota = 'Las sumas no remunerativas suben a $240.000 desde el primer mes.';
    A_ACU.ac_2.nota = 'Se firmó con retroactivo al primer mes del tramo.';
    var pend = acuerdoObj(ACUERDO_PEND, false);
    pend.firmado = D(-4);
    pend.nota = 'Firmado pero todavía sin homologar. Al aplicarlo se cargan el % de Comercio y las sumas de los tres meses y se aumentan los sueldos de convenio.';
    A_ACU[ACUERDO_PEND.id] = pend;
    DEMO.set(r, 'remuneracionesActualizacion', { meses: A_MESES, empleados: A_EMPS, categorias: A_CATS, acuerdos: A_ACU });

    // ═══════════════════════════════════════════════════════════════════
    // 4) REMUNERACIONES — legajos, recibos, pagos y consolidaciones
    // ═══════════════════════════════════════════════════════════════════
    var REM_PARTE_B_FIJA = 'No remunerativo (sueldo)';   // nombre reservado de la app para la Parte B del legajo
    function cpt(nombre, tipo, monto, parte) { return { nombre: nombre, tipo: tipo, remun: tipo === 'haber' && parte === 'A', enRecibo: true, parte: parte, monto: monto }; }

    // Conceptos de una liquidación (los mismos tipos que arma la pantalla «Liquidar sueldo»)
    function conceptosDe(e, k, conSAC) {
        var c = [], a = e.A(k);
        if (e.conv) {
            var anios = Math.floor((e.ing + k) / 12);
            var ant = anios > 0 ? red2(a * 0.01 * anios) : 0;
            if (ant) c.push(cpt('Antigüedad (' + anios + (anios === 1 ? ' año' : ' años') + ')', 'haber', ant, 'A'));
            var pres = red2((a + ant) * 0.0833);
            c.push(cpt('Presentismo', 'haber', pres, 'A'));
            if (conSAC) c.push(cpt('Aguinaldo (SAC) ' + conSAC, 'haber', red2(a / 2), 'A'));
            c.push(cpt('Cuota sindical FAECYS 2%', 'descuento', red2((a + ant + pres + (conSAC ? a / 2 : 0)) * 0.02), 'A'));
        } else if (conSAC && e.tipo === 'dependencia') {
            c.push(cpt('Aguinaldo (SAC) ' + conSAC, 'haber', red2(a / 2), 'A'));
        }
        var b = e.partB(k);
        if (b > 0) c.push(cpt(REM_PARTE_B_FIJA, 'haber', b, 'B'));
        return c;
    }
    // Mismas cuentas que remTotalesConceptos / remAportesLey / remNetoOficial (aportes de ley sólo en relación de dependencia)
    function liquidar(e, k, conceptos) {
        var a = e.A(k), hab = 0, noRem = 0, desc = 0;
        conceptos.forEach(function (c) {
            if (c.tipo === 'descuento') desc += c.monto; else if (c.remun) hab += c.monto; else noRem += c.monto;
        });
        hab = red2(hab); noRem = red2(noRem); desc = red2(desc);
        var base = red2(a + hab), ap = { jubilacion: 0, ley19032: 0, obraSocial: 0, total: 0, base: 0 };
        if (e.tipo === 'dependencia') {
            ap.base = base; ap.jubilacion = red2(base * 0.11); ap.ley19032 = red2(base * 0.03); ap.obraSocial = red2(base * 0.03);
            ap.total = red2(ap.jubilacion + ap.ley19032 + ap.obraSocial);
        }
        var neto = red2(a + hab + noRem - ap.total - desc);
        return { haberes: hab, noRemun: noRem, descuentos: desc, aportes: ap, neto: neto };
    }

    // ── legajos ──
    function sinTildes(t) { return t.toLowerCase().replace(/[áéíóúñ]/g, function (ch) { return 'aeioun'.charAt('áéíóúñ'.indexOf(ch)); }); }
    function mailDe(nombre) { var p = nombre.split(' '); return sinTildes(p[0]) + '.' + sinTildes(p[1]) + '@mail-demo.com'; }
    var LEG = [];
    EMPS.forEach(function (e) {
        var o = {
            id: e.id, nombre: e.nombre, cuil: e.cuil, fechaIngreso: DEMO.fecha(-e.ing, e.dia), puesto: e.puesto, tipoContrato: e.tipo,
            sueldoBasico: e.A(0), sueldoNoRemun: e.partB(0), obraSocial: e.obraSocial, dni: String(e.dniNum),
            fechaNac: e.nac[0] + '-' + pad(e.nac[1], 2) + '-' + pad(e.nac[2], 2), estadoCivil: e.civil,
            domicilio: e.dom, telefono: e.tel, email: mailDe(e.nombre),
            cantHijos: e.hijos, legajoNro: pad(EMPS.indexOf(e) + 1, 3), convenio: e.convenio, sindicato: e.sind, jornada: 'Completa',
            lugarTrabajo: e.lugar || 'Oficina central — Av. del Libertador 4500',
            conceptos: conceptosDe(e, -1, null), sueldoHistorial: []   // se pisa más abajo con los conceptos de la última liquidación
        };
        // historial del sueldo básico: alta y un renglón por cada cambio de los últimos 12 meses
        var ult = null;
        for (var k = -12; k <= 0; k++) {
            var v = e.A(k);
            if (v !== ult) { o.sueldoHistorial.push({ fecha: DEMO.fecha(k, 1), monto: v }); ult = v; }
        }
        if (e.k === 'federico') o.obs = 'Responsable de la dirección técnica de la obra. Cobra un adicional no remunerativo por dedicación exclusiva.';
        if (e.k === 'sergio') o.obs = 'Factura sus honorarios mensuales como monotributista. No hay aportes de ley en la liquidación.';
        if (e.k === 'laura') o.obs = 'Firma los pagos junto con el socio gerente.';
        LEG.push(o);
    });

    // ── recibos, pagos y consolidaciones ──
    var RECIBOS = [], PAGOS = [], CONSOLS = [], seqRec = 0, nPago = 0, nCons = 0, nRec = 0;

    // PDF mínimo de una página (Helvetica) para el recibo oficial adjunto / el comprobante de las transferencias
    function pdfTexto(t) { return String(t == null ? '' : t).replace(/[\r\n]+/g, ' ').replace(/[^\x20-\xFF]/g, '-').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }
    function fm(x) { return '$ ' + Number(x || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    function pdfDoc(titulo, cab, filas, pie) {
        var c = [], y = 792;
        c.push('BT /F2 18 Tf 56 ' + y + ' Td (' + pdfTexto(titulo) + ') Tj ET'); y -= 22;
        cab.forEach(function (t) { c.push('BT /F1 10 Tf 56 ' + y + ' Td (' + pdfTexto(t) + ') Tj ET'); y -= 14; });
        y -= 4; c.push('0.6 w 56 ' + y + ' m 539 ' + y + ' l S'); y -= 18;
        filas.forEach(function (f, i) {
            var neg = (i === filas.length - 1) ? '/F2 11' : '/F1 10';
            c.push('BT ' + neg + ' Tf 56 ' + y + ' Td (' + pdfTexto(f[0]) + ') Tj ET');
            if (f[1] !== undefined && f[1] !== '') c.push('BT ' + neg + ' Tf 410 ' + y + ' Td (' + pdfTexto(f[1]) + ') Tj ET');
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

    // Recibo guardado del mes (k = offset del mes) con la forma de _guardarReciboSnap
    function recibo(e, k, fechaEmision) {
        var mes = mesDe(k), mm = parseInt(mes.slice(5, 7), 10);
        var sac = (mm === 6) ? '1er semestre' : (mm === 12 ? '2do semestre' : null);
        if (sac && e.ing < 6) sac = null;
        var conc = conceptosDe(e, k, sac), L = liquidar(e, k, conc);
        seqRec++;
        var rec = {
            id: 'REC-' + (ts(fechaEmision) + (++nRec)) + '-' + pad(nRec, 3), empleadoId: e.id, empleadoNombre: e.nombre, cuil: e.cuil, dni: String(e.dniNum),
            fechaIngreso: DEMO.fecha(-e.ing, e.dia), puesto: e.puesto, tipoContrato: e.tipo, obraSocial: e.obraSocial, convenio: e.convenio, legajoNro: pad(EMPS.indexOf(e) + 1, 3),
            mes: mes, fechaEmision: fechaEmision, basico: e.A(k), conceptos: conc, aportes: L.aportes, haberes: L.haberes, noRemun: L.noRemun, descuentos: L.descuentos,
            fueraRecibo: 0, fueraHaberes: 0, fueraDescuentos: 0, neto: L.neto, netoTotal: L.neto,
            empresaId: EMP_ID, proyectoId: PROY_ID, empresaNombre: EMP_NOM, nroReciboSeq: seqRec, nroRecibo: 'RS-' + pad(seqRec, 6)
        };
        RECIBOS.push(rec);
        return rec;
    }
    // Reparto banco / efectivo de lo que se paga (efectivo = lo no remunerativo para la mayoría; banco el resto)
    function reparto(e, k, total) {
        var efe = 0;
        if (e.pago === 'B-efectivo') efe = Math.min(e.partB(k), total);
        return { banco: red2(total - efe), efe: red2(efe) };
    }
    function pago(e, mes, fecha, banco, efe, tipo, detalle, adjunto) {
        var p = { id: 'RP-' + (ts(fecha) + (++nPago)) + '-' + pad(nPago, 3), nombre: e.nombre, mes: mes, fecha: fecha, montoBanco: banco, montoEfectivo: efe,
                  tipo: tipo, detalle: detalle, empresaId: EMP_ID, proyectoId: PROY_ID, consolidado: false, creadoEn: ts(fecha) + nPago };
        if (adjunto) p.adjunto = adjunto;
        PAGOS.push(p);
        return p;
    }
    // Manda una tanda de pagos a Caja/Banco (un solo movimiento por destino, como _remConsolidarCore)
    function consolidar(lista, fecha, adjuntos) {
        var banco = 0, efe = 0;
        lista.forEach(function (p) { banco += p.montoBanco; efe += p.montoEfectivo; });
        banco = red2(banco); efe = red2(efe);
        var id = 'CONS-' + (ts(fecha) + (++nCons));
        var c = { id: id, fecha: fecha, cuentaId: banco > 0 ? CTA : '', cuentaNombre: banco > 0 ? CTA_NOM : '', totalBanco: banco, totalEfectivo: efe,
                  pagoIds: lista.map(function (p) { return p.id; }), cajaMovId: efe > 0 ? id + '-CAJA' : '', bancoMovId: banco > 0 ? id + '-BANCO' : '',
                  empresaId: EMP_ID, proyectoId: PROY_ID, creadoEn: ts(fecha) + nCons };
        if (adjuntos) c.adjuntos = adjuntos;
        lista.forEach(function (p) { p.consolidado = true; p.consolidadoFecha = fecha; p.consolidadoId = id; });
        CONSOLS.push(c);
        return c;
    }
    function reciboPdf(e, rec) {
        var f = [];
        rec.conceptos.forEach(function (c) { f.push([c.nombre + (c.tipo === 'descuento' ? ' (descuento)' : ''), fm(c.monto)]); });
        f.unshift(['Sueldo básico', fm(rec.basico)]);
        f.push(['Aportes de ley (17%)', fm(rec.aportes.total)]);
        f.push(['NETO A COBRAR', fm(rec.netoTotal)]);
        return { nombre: 'Recibo ' + rec.nroRecibo + ' - ' + e.nombre + '.pdf', tipo: 'application/pdf',
                 contenido: pdfDoc('Recibo de haberes ' + mesLab(rec.mes), [EMP_NOM + '   CUIT 30-71234567-8', 'Empleado: ' + e.nombre + '   CUIL ' + e.cuil, 'Cargo: ' + e.puesto + '   Fecha de emisión: ' + rec.fechaEmision], f, 'Documento de ejemplo de la versión de prueba.') };
    }

    // Tres meses cerrados: se liquida el 27 y se paga el 28 (mes -3, -2, -1). Excepciones: un pago parcial en -2 y un adelanto en -1.
    [-3, -2, -1].forEach(function (k) {
        var mes = mesDe(k), fEmi = DEMO.fecha(k, 27), fPago = DEMO.fecha(k, 28), delMes = [];
        EMPS.forEach(function (e) {
            var rec = recibo(e, k, fEmi), total = rec.netoTotal, rp = reparto(e, k, total);
            var adj = (k === -1) ? reciboPdf(e, rec) : null;
            if (k === -2 && e.k === 'diego') {
                // a mitad de mes se le entregó una parte a cuenta; el resto se paga al liquidar
                var parte = Math.round(total * 0.4 / 1000) * 1000, f15 = DEMO.fecha(k, 15);
                var p1 = pago(e, mes, f15, parte, 0, 'parcial', 'Primera parte (a cuenta)');
                consolidar([p1], f15);
                var resto = red2(total - parte), rr = reparto(e, k, resto);
                delMes.push(pago(e, mes, fPago, rr.banco, rr.efe, 'pago', 'Saldo del mes', adj));
                return;
            }
            if (k === -1 && e.k === 'nicolas') {
                var f12 = DEMO.fecha(k, 12), adel = 300000;
                var p2 = pago(e, mes, f12, 0, adel, 'adelanto', 'Adelanto de sueldo');
                consolidar([p2], f12);
                var rs = red2(total - adel), r2 = reparto(e, k, rs);
                // el adelanto salió en efectivo: lo que falta de la Parte B en mano se achica
                var efe2 = Math.max(0, red2(r2.efe - adel)), ban2 = red2(rs - efe2);
                delMes.push(pago(e, mes, fPago, ban2, efe2, 'pago', 'Saldo del mes', adj));
                return;
            }
            delMes.push(pago(e, mes, fPago, rp.banco, rp.efe, 'pago', 'Liquidado y pagado', adj));
        });
        var adjC = null;
        if (k >= -2) adjC = [{ nombre: 'Transferencias de sueldos ' + mesLab(mes) + '.pdf', tipo: 'application/pdf', subidoEn: ts(fPago) + 3600000,
            contenido: pdfDoc('Comprobante de transferencias', ['Banco Galicia - Home banking empresas', 'Fecha: ' + fPago + '   Cuenta: ' + CTA_NOM], delMes.filter(function (p) { return p.montoBanco > 0; }).map(function (p) { return [p.nombre, fm(p.montoBanco)]; }).concat([['TOTAL TRANSFERIDO', fm(delMes.reduce(function (s, p) { return s + p.montoBanco; }, 0))]]), 'Documento de ejemplo de la versión de prueba.') }];
        consolidar(delMes, fPago, adjC);
    });

    // Mes en curso: algunos ya liquidados y pagados, otros a medio camino y otros todavía sin liquidar
    EMPS.forEach(function (e) {
        var k = 0, mes = mesDe(0), rec, rp, p;
        if (e.k === 'martin' || e.k === 'julieta') {
            var f = diaMes0(e.k === 'martin' ? 3 : 2);
            rec = recibo(e, k, f); rp = reparto(e, k, rec.netoTotal);
            p = pago(e, mes, f, rp.banco, rp.efe, 'pago', 'Liquidado y pagado');
            consolidar([p], f);
        } else if (e.k === 'diego') {
            var f2 = diaMes0(1);
            rec = recibo(e, k, f2);
            p = pago(e, mes, f2, 1000000, 0, 'parcial', 'Primera parte');
            consolidar([p], f2);
        } else if (e.k === 'valeria') {
            recibo(e, k, diaMes0(1));
        } else if (e.k === 'federico') {
            pago(e, mes, diaMes0(5), 0, 800000, 'adelanto', 'Adelanto de sueldo');   // queda sin mandar a Caja/Banco a propósito
        }
    });
    // el legajo recuerda los conceptos de la última liquidación
    LEG.forEach(function (o) {
        var e = EMPS.filter(function (x) { return x.id === o.id; })[0];
        var ultima = RECIBOS.filter(function (x) { return x.empleadoId === o.id; }).sort(function (a, b) { return a.mes < b.mes ? 1 : -1; })[0];
        if (ultima) o.conceptos = ultima.conceptos;
    });
    DEMO.set(r, B + '/remuneraciones', DEMO.porId(LEG));
    DEMO.set(r, 'remuneracionesRecibos', DEMO.porId(RECIBOS));
    DEMO.set(r, 'remuneracionesPagos', DEMO.porId(PAGOS));
    DEMO.set(r, 'remuneracionesConsolidados', DEMO.porId(CONSOLS));
});
