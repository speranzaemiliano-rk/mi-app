# CLAUDE.md

Contexto técnico del proyecto para asistentes de IA (Claude Code). Para la documentación orientada a personas ver `README.md`; para riesgos de seguridad ver `SECURITY.md`; para tareas pendientes ver `PENDIENTES.md`.

## Qué es

**RK · Gestión Multiempresa** — PWA de gestión administrativa/contable para múltiples empresas y proyectos, con caja, bancos, ingresos, egresos, presupuestos, proveedores y **facturación electrónica ARCA (ex-AFIP)**. Español (Argentina).

## Arquitectura (3 piezas)

1. **Frontend** — `index.html` (~30.300 líneas). **JavaScript vanilla, SIN framework ni build.** HTML + CSS + JS embebidos en un solo archivo. Librerías por CDN (Firebase 10.12.2 compat, Chart.js, SheetJS/xlsx, SortableJS, pdf.js 3.11.174, jsPDF 2.5.1, Belvo widget, EmailJS, Google Identity Services).
2. **Firebase** (proyecto `modo-prueba-bb8c2`) — Auth (email/password + Google) y **Realtime Database**.
3. **Backend** — `functions/server.js`: Express sobre Node 22, desplegado en **Railway**. Concentra lo que no puede ir en el navegador: emisión ARCA (`@afipsdk/afip.js`) y open banking (Belvo/Prometeo). La URL se guarda en `localStorage rk_afip_function_url`.

> `functions/index.js` es una variante para Firebase Cloud Functions (solo ARCA). **El backend ACTIVO es `functions/server.js` en Railway.** No confundir.

## Convenciones de código (importante al editar)

- **NO hay paso de build.** Se edita `index.html` directo. No hay npm/webpack en el frontend.
- Estilo: **JavaScript ES5/ES6 mezclado**, mayormente `var` y `function`. Strings con comillas simples. Comentarios en español.
- La UI se arma con **template strings** que escriben HTML (`innerHTML`). Ojo con escapar datos.
- Navegación por tabs: `mostrarTab('<Nombre>')`. Tabs: Home, Dashboard, Vencimientos, CajaGeneral, EfectivoPesos, EfectivoUSD, CuentasBancarias, Ventas, Alquileres, Servicios, IngGeneral, ResumenIngresos, DocumentosEmitidos (recibos/facturas que emitís, en el menú de Ingresos), Facturas, Proveedores, Presupuestos, Pagos, Egresos, Tesoreria, Documentos (comprobantes **recibidos** de proveedores, en Egresos — antes compartía pantalla con los emitidos), Reportes, PlanTrabajo, Config.
- ~447 funciones globales en el `<script>` principal. Buscar por nombre de función con grep.

## Modelo de datos (Realtime Database)

Ruta base por proyecto activo: `getBasePath()` → `empresas/<empresaId>/proyectos/<proyectoId>`.

**Por proyecto** (refs en JS): `REF_DATOS` (`/datos`), `REF_CAC` (`/indiceCAC`), `REF_DOCS` (`/documentos`), `REF_TC` (`/tipoCambio`), `REF_FACTURAS` (`/facturas`), `REF_CAJA` (`/caja`), `REF_INGRESOS` (`/ingresos`), `REF_BANCO` (`/banco`), `REF_CONTADOR_OP` (`/contadorOP`).

**Globales** (compartidos entre empresas): `REF_EMPRESAS` (`empresas`), `REF_PROV` (`global/proveedores`), `REF_GRUPOS` (`global/grupos`), `REF_VENCIMIENTOS` (`global/vencimientosServicios` — agenda de vencimientos de servicios recurrentes, cruza todas las empresas/proyectos; cada registro guarda su propio `empresaId`/`proyectoId`, ver abajo), `REF_ROLES` (`roles`), `REF_USUARIOS` (`usuarios`), `REF_SOLICITUDES` (`solicitudesBorrado`), y `global/config/*` (geminiKey, googleClientId, emailjs, `cacIndices` — tabla editable de índices CAC por mes con clave `YYYY-MM`, cargada por superadmin/editor en Config → «Índice CAC (mensual)»; autocompleta el CAC en Ventas/Cobros/Alquileres/Servicios/Presupuestos vía el selector de mes 📅 junto a cada campo, helper `_cacDeMes(mes)` / `cacAutofill(mes, targetId)`).

Hay migración automática del esquema viejo `dashboardPagos` → `empresas/.../proyectos/...`.

**Notas de campos recientes:** `alquileres` acepta `incluyeCochera`/`cocheraDetalle` (checkbox "🚗 Incluye cochera") y `disponible` (unidad libre, se muestra en rojo y filtra aparte de Activo/Vencido). `comprobantesEmitidos` (`REF_EMITIDOS`) tiene `afectaCaja`/`movTipo` (`'ingreso'`|`'egreso'`) — al emitir uno nuevo el default es **ingreso que afecta caja** (antes era "no afecta caja"); botones ⬆️💰/⬇️💰 en la lista permiten cambiar el signo de uno ya emitido, y "Reflejar en Ingresos"/"…como egreso" lo hacen en bloque para los que quedaron sin reflejar.

## Roles y permisos

Roles en `roles/<uid>`: `superadmin`, `admin`, `editor`, `lector`. Flags JS: `esSuperAdmin`, `esAdmin`, `puedeEditar`. Se calculan y aplican en el cliente (`aplicarPermisos`), **y además** las reglas de Firebase (`database.rules.json`, ya publicadas) las hacen cumplir del lado del servidor: solo `superadmin` escribe `roles`, solo no-`lector` escribe `empresas`/`global`. El primer usuario / `ADMIN_EMAIL` se autoasigna `superadmin`. Borrado con aprobación vía `solicitudesBorrado` → `aprobarSolicitud`.

**Multiusuario:** todas las colecciones (18) se guardan como objeto indexado por `id` y se persisten por-diff (`_colPersist`/`_colProcesarCarga`, usadas por cada función `persistir*`) — `update()` solo lo que cambió/agregó, `null` para lo borrado; nunca reescribe el array completo. Dos usuarios editando ítems distintos de la misma colección no se pisan. Para escrituras cross-link (ej. movimiento de caja generado desde un comprobante emitido, `origenEmitidoId`), el id del movimiento es **determinístico** (derivado del id de origen, no aleatorio) para que ediciones concurrentes del mismo origen converjan al mismo nodo en vez de duplicar (`_emitSincronizarMovCaja`). Para mover datos entre empresas/proyectos (ej. `confirmarMoverAlquileres`), se usa un único `db.ref().update()` multi-path con rutas absolutas (`empresas/<id>/proyectos/<id>/<col>/<itemId>`) que escribe en destino y borra del origen atómicamente. Ver `SECURITY.md` § 9 antes de tocar esta lógica.

⚠️ **Seguridad:** ver `SECURITY.md` antes de tocar permisos, reglas o el middleware de auth del backend.

## Backend — endpoints (`functions/server.js`)

- **ARCA:** `GET /diag`, `GET /afip/importar?ptoVta=&tipoComp=`, `POST /afip` (emite, devuelve CAE).
- **Belvo:** `GET /belvo/diag`, `POST /belvo/widget-token`, `GET /belvo/accounts`, `GET /belvo/transactions`. ⚠️ **Belvo NO cubre Argentina** (solo MX/BR/CO/CL).
- **Prometeo (Plan B, soporta Argentina):** `GET /prometeo/diag`, `/providers`, `POST /prometeo/login`, `GET /prometeo/accounts`, `/movements`, `/logout`. Backend listo; **falta la UI de login en la app.**
- **Agenda de vencimientos (servicios recurrentes):** `GET /vencimientos/revisar` (dispara a mano la revisión). Función `revisarVencimientos()` lee `global/vencimientosServicios` (colección plana, cruza todas las empresas) con Firebase Admin, y por cada vencimiento no pagado cuyo `diasAviso` (ej. `[10,5]`) se cumple y no fue notificado (`recordatorios.<dia>`), manda un mail por el mismo SMTP del mail bot (`MAIL_BOT_USER`/`MAIL_BOT_APP_PASSWORD`) al `emailAlerta` del vencimiento, o si no está, al `datos.email` de la empresa asignada (`v.empresaId` → `empresas/<id>/datos/email`, el mismo campo `empEmail` del modal Empresa), o si no, a `ALERTAS_EMAIL_DEFAULT`/`MAIL_BOT_USER`. Corre automático una vez por día (además del disparo manual). En el frontend: tab **Vencimientos**, top-level en el menú (debajo de Inicio, no depende de la empresa/proyecto activo) — subida de factura de servicio con lectura por Gemini (`procesarVencimientoPDF`, mismo patrón que `procesarFacturaPDF`), alias asignado por el usuario, selector de **empresa y proyecto/desarrollo** a los que se asigna el gasto (`vencAsignEmpresa`/`vencAsignProyecto`, independiente del contexto activo — la agenda muestra los vencimientos de todas las empresas juntos, con filtro por empresa), chequeo del proveedor contra el maestro global (`buscarProveedorPorNombre`) con alta rápida inline si no existe (`vencDarDeAltaProv`), checkboxes de días de aviso, adjunto embebido en el propio registro (`v.adjunto.contenido`, no en `REF_DOCS` que es por-proyecto), y marcar "recurrente" para que al pagar se genere automáticamente el vencimiento del mes siguiente (`_crearProximoVencimiento`).
- **WhatsApp (Asistente RK por WhatsApp):** `GET /whatsapp/diag`, `GET|POST /whatsapp/webhook` (handshake + mensajes entrantes de Meta, responde con Gemini), `POST /whatsapp/send` (envío manual/disparado por la app, body `{to, mensaje}`). Backend listo; **falta crear la cuenta de WhatsApp Business (Meta for Developers) y cargar credenciales** — ver `PENDIENTES.md`.
- **Mail bot (Asistente RK por email):** `GET /mail/diag`, `GET /mail/revisar` (dispara la revisión manual). Recibe por IMAP (Gmail) y responde con Gemini por SMTP; revisa cada 2 min si está configurado. Backend listo; **falta crear la casilla de Gmail dedicada + contraseña de aplicación y cargar credenciales** — ver `PENDIENTES.md`. Deps: `imapflow`, `mailparser`, `nodemailer`.
- **Gemini proxy:** `POST /gemini` (body `{model, body}`) — reenvía a la API de Gemini con `GEMINI_API_KEY` del servidor; así la key nunca viaja al navegador. Lo usa el Asistente RK y "Leer factura/presupuesto con IA". `IPC`: `GET /ipc/serie`, `GET /ipc/variacion?anioIni&mesIni&anioFin&mesFin` (proxea el CSV de INDEC, cacheado 12h).
- **Auth del backend (middleware global, todas las rutas menos `/` y `/whatsapp/webhook`):** acepta **`X-App-Token`** (= `APP_API_TOKEN` de Railway) **o** `Authorization: Bearer <idToken>` de Firebase (cualquier usuario logueado en la app — verificado con Admin SDK). Si `APP_API_TOKEN` no está seteada, modo compatibilidad (acepta sin auth, con warning en el log). `/usuarios/*` exige además `requireSuperadmin` (rol `superadmin` en `roles/<uid>`) por encima de este middleware.
- Helper clave: `leerPem()` acepta PEM con `\n` reales/literales o base64.

## Integraciones

ARCA/AFIP (`@afipsdk/afip.js`), Belvo, Prometeo, Google Gemini (leer facturas PDF, Asistente RK, responder por WhatsApp), EmailJS (mandar facturas), Gmail API (`gmail.readonly`), WhatsApp Business Cloud API (Meta).

## Variables de entorno (Railway)

**ARCA:** `AFIP_CUIT`, `AFIP_CERT` (base64), `AFIP_KEY` (base64), `AFIP_ENV` (production/testing), `AFIP_ACCESS_TOKEN`.
**Open banking:** `BELVO_SECRET_ID`, `BELVO_SECRET_PASSWORD`, `BELVO_ENV`; `PROMETEO_API_KEY`, `PROMETEO_ENV`.
**WhatsApp/Mail bot/Gemini:** `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`; `GEMINI_API_KEY` (**una sola key, compartida** por el asistente de WhatsApp/mail, el Asistente RK dentro de la app, y "Leer factura/presupuesto con IA" — todos pasan por `POST /gemini`); `MAIL_BOT_USER`, `MAIL_BOT_APP_PASSWORD`, `MAIL_BOT_ALLOWED` (reutilizadas también por la agenda de vencimientos); `ALERTAS_EMAIL_DEFAULT` (opcional, mail de respaldo para alertas de vencimientos si el vencimiento y la empresa no tienen email propio — si no se define usa `MAIL_BOT_USER`).
**Seguridad del backend:** `APP_API_TOKEN` (token compartido esperado en `X-App-Token`; ver también auth por idToken de Firebase arriba); `ALLOWED_ORIGINS` (CORS, lista separada por comas; sin definir permite cualquier origen); `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS` (opcionales, límite de requests por IP).
**Firebase Admin** (para verificar idToken y para `/usuarios/*`): `FIREBASE_SERVICE_ACCOUNT` (el JSON completo del service account, crudo o en base64 — nombre preferido) **o** `FIREBASE_SERVICE_ACCOUNT_BASE64` (nombre viejo, mismo formato) **o**, si ninguno de los dos carga, fallback a variables individuales `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY` / `FIREBASE_PROJECT_ID`. Diagnóstico: `GET /diag/firebase`.
`PORT`.

## PWA

`manifest.json` (scope `/mi-app/`, instalable) + `sw.js` (constante `CACHE`, se bumpea en cada cambio — no asumir un valor fijo, revisar el archivo; network-first para `index.html`, no cachea Firebase/Railway/Google/EmailJS). Al deployar una versión nueva, `sw.js` NO llama `skipWaiting()` en el install: el SW nuevo queda en espera y la app muestra un banner "🔄 Hay una versión nueva — Actualizar" para no recargar en medio del uso.

## Despliegue

- Frontend: estático (GitHub Pages en `/mi-app/`; también listo para Firebase Hosting vía `firebase.json`).
- Backend: `cd functions && npm install && npm start` (escucha en `PORT` || 3000); en prod corre en Railway.

## Al trabajar acá

- Cambios de **frontend** → editar `index.html`. Es grande: usar grep para ubicar funciones, no leerlo entero.
- Cambios de **backend** → `functions/server.js`.
- **No commitear secretos.** Las credenciales van en variables de entorno de Railway / config de Firebase, no en el repo.
- Idioma de la UI, comentarios y commits: **español**.
- No hay tests automatizados ni linter configurado.
- **Adjuntos** (facturas, documentos, alquileres, comprobantes, etc.): `MAX_DOC_MB = 8`. Todo pasa por `leerArchivoBase64(file, onProgress)`, que comprime del lado del cliente antes de subir a `REF_DOCS` (base64 en RTDB): imágenes JPEG/PNG/WEBP >1MB se redimensionan (`_comprimirImagen`); PDF que superan el límite se re-renderizan página por página con pdf.js y se rearman livianos con jsPDF (`_comprimirPDF`/`_comprimirPDFConLimite` — timeout 3min, ajusta escala/calidad según peso y cantidad de páginas, si igual supera ~15MB comprimido tira error en vez de subirlo). Esto es UX/performance, **no un control de seguridad** — las reglas de Firebase no validan tamaño ni tipo de payload.
