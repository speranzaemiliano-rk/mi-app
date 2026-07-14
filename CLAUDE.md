# CLAUDE.md

Contexto técnico del proyecto para asistentes de IA (Claude Code). Para la documentación orientada a personas ver `README.md`; para riesgos de seguridad ver `SECURITY.md`; para tareas pendientes ver `PENDIENTES.md`.

## Qué es

**RK · Gestión Multiempresa** — PWA de gestión administrativa/contable para múltiples empresas y proyectos, con caja, bancos, ingresos, egresos, presupuestos, proveedores y **facturación electrónica ARCA (ex-AFIP)**. Español (Argentina).

## Arquitectura (3 piezas)

1. **Frontend** — `index.html` (~17.400 líneas). **JavaScript vanilla, SIN framework ni build.** HTML + CSS + JS embebidos en un solo archivo. Librerías por CDN (Firebase 10.12.2 compat, Chart.js, SheetJS/xlsx, SortableJS, pdf.js, Belvo widget, EmailJS, Google Identity Services).
2. **Firebase** (proyecto `modo-prueba-bb8c2`) — Auth (email/password + Google) y **Realtime Database**.
3. **Backend** — `functions/server.js`: Express sobre Node 22, desplegado en **Railway**. Concentra lo que no puede ir en el navegador: emisión ARCA (`@afipsdk/afip.js`) y open banking (Belvo/Prometeo). La URL se guarda en `localStorage rk_afip_function_url`.

> `functions/index.js` es una variante para Firebase Cloud Functions (solo ARCA). **El backend ACTIVO es `functions/server.js` en Railway.** No confundir.

## Convenciones de código (importante al editar)

- **NO hay paso de build.** Se edita `index.html` directo. No hay npm/webpack en el frontend.
- Estilo: **JavaScript ES5/ES6 mezclado**, mayormente `var` y `function`. Strings con comillas simples. Comentarios en español.
- La UI se arma con **template strings** que escriben HTML (`innerHTML`). Ojo con escapar datos.
- Navegación por tabs: `mostrarTab('<Nombre>')`. Tabs: Home, Dashboard, CajaGeneral, EfectivoPesos, EfectivoUSD, CuentasBancarias, Ventas, Alquileres, Servicios, IngGeneral, ResumenIngresos, Facturas, Proveedores, Presupuestos, Pagos, Egresos, Tesoreria, Documentos, Reportes, PlanTrabajo, Config.
- ~447 funciones globales en el `<script>` principal. Buscar por nombre de función con grep.

## Modelo de datos (Realtime Database)

Ruta base por proyecto activo: `getBasePath()` → `empresas/<empresaId>/proyectos/<proyectoId>`.

**Por proyecto** (refs en JS): `REF_DATOS` (`/datos`), `REF_CAC` (`/indiceCAC`), `REF_DOCS` (`/documentos`), `REF_TC` (`/tipoCambio`), `REF_FACTURAS` (`/facturas`), `REF_CAJA` (`/caja`), `REF_INGRESOS` (`/ingresos`), `REF_BANCO` (`/banco`), `REF_CONTADOR_OP` (`/contadorOP`), `REF_VENCIMIENTOS` (`/vencimientosServicios` — agenda de vencimientos de servicios recurrentes, ver abajo).

**Globales** (compartidos entre empresas): `REF_EMPRESAS` (`empresas`), `REF_PROV` (`global/proveedores`), `REF_GRUPOS` (`global/grupos`), `REF_ROLES` (`roles`), `REF_USUARIOS` (`usuarios`), `REF_SOLICITUDES` (`solicitudesBorrado`), y `global/config/*` (geminiKey, googleClientId, emailjs).

Hay migración automática del esquema viejo `dashboardPagos` → `empresas/.../proyectos/...`.

## Roles y permisos

Roles en `roles/<uid>`: `superadmin`, `admin`, `editor`, `lector`. Flags JS: `esSuperAdmin`, `esAdmin`, `puedeEditar`. **Hoy se aplican SOLO en el cliente** (ver `aplicarPermisos`). El primer usuario / `ADMIN_EMAIL` se autoasigna `superadmin`. Borrado con aprobación vía `solicitudesBorrado` → `aprobarSolicitud`.

⚠️ **Seguridad:** las reglas de Firebase actuales son abiertas (`.write: auth != null`) → la seguridad real es débil. Ver `SECURITY.md` antes de tocar permisos o reglas.

## Backend — endpoints (`functions/server.js`)

- **ARCA:** `GET /diag`, `GET /afip/importar?ptoVta=&tipoComp=`, `POST /afip` (emite, devuelve CAE).
- **Belvo:** `GET /belvo/diag`, `POST /belvo/widget-token`, `GET /belvo/accounts`, `GET /belvo/transactions`. ⚠️ **Belvo NO cubre Argentina** (solo MX/BR/CO/CL).
- **Prometeo (Plan B, soporta Argentina):** `GET /prometeo/diag`, `/providers`, `POST /prometeo/login`, `GET /prometeo/accounts`, `/movements`, `/logout`. Backend listo; **falta la UI de login en la app.**
- **Agenda de vencimientos (servicios recurrentes):** `GET /vencimientos/revisar` (dispara a mano la revisión). Función `revisarVencimientos()` recorre `empresas/*/proyectos/*/vencimientosServicios` con Firebase Admin, y por cada vencimiento no pagado cuyo `diasAviso` (ej. `[10,5]`) se cumple y no fue notificado (`recordatorios.<dia>`), manda un mail por el mismo SMTP del mail bot (`MAIL_BOT_USER`/`MAIL_BOT_APP_PASSWORD`) al `emailAlerta` del vencimiento, o si no está, al `datos.email` de la empresa (`empEmail` en el modal Empresa), o si no, a `ALERTAS_EMAIL_DEFAULT`/`MAIL_BOT_USER`. Corre automático una vez por día (además del disparo manual). En el frontend: tab **Vencimientos** (dentro de Proveedores) — subida de factura de servicio con lectura por Gemini (`procesarVencimientoPDF`, mismo patrón que `procesarFacturaPDF`), alias asignado por el usuario, checkboxes de días de aviso, y marcar "recurrente" para que al pagar se genere automáticamente el vencimiento del mes siguiente (`_crearProximoVencimiento`).
- **WhatsApp (Asistente RK por WhatsApp):** `GET /whatsapp/diag`, `GET|POST /whatsapp/webhook` (handshake + mensajes entrantes de Meta, responde con Gemini), `POST /whatsapp/send` (envío manual/disparado por la app, body `{to, mensaje}`). Backend listo; **falta crear la cuenta de WhatsApp Business (Meta for Developers) y cargar credenciales** — ver `PENDIENTES.md`.
- **Mail bot (Asistente RK por email):** `GET /mail/diag`, `GET /mail/revisar` (dispara la revisión manual). Recibe por IMAP (Gmail) y responde con Gemini por SMTP; revisa cada 2 min si está configurado. Backend listo; **falta crear la casilla de Gmail dedicada + contraseña de aplicación y cargar credenciales** — ver `PENDIENTES.md`. Deps: `imapflow`, `mailparser`, `nodemailer`.
- Helper clave: `leerPem()` acepta PEM con `\n` reales/literales o base64.

## Integraciones

ARCA/AFIP (`@afipsdk/afip.js`), Belvo, Prometeo, Google Gemini (leer facturas PDF, Asistente RK, responder por WhatsApp), EmailJS (mandar facturas), Gmail API (`gmail.readonly`), WhatsApp Business Cloud API (Meta).

## Variables de entorno (Railway)

`AFIP_CUIT`, `AFIP_CERT` (base64), `AFIP_KEY` (base64), `AFIP_ENV` (production/testing), `AFIP_ACCESS_TOKEN`; `BELVO_SECRET_ID`, `BELVO_SECRET_PASSWORD`, `BELVO_ENV`; `PROMETEO_API_KEY`, `PROMETEO_ENV`; `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`, `GEMINI_API_KEY` (para que el asistente responda solo por WhatsApp/email); `MAIL_BOT_USER`, `MAIL_BOT_APP_PASSWORD`, `MAIL_BOT_ALLOWED` (bot de mail, reutilizadas también por la agenda de vencimientos); `ALERTAS_EMAIL_DEFAULT` (opcional, mail de respaldo para alertas de vencimientos si el vencimiento y la empresa no tienen email propio — si no se define usa `MAIL_BOT_USER`); `PORT`.

## PWA

`manifest.json` (scope `/mi-app/`, instalable) + `sw.js` (caché `rk-v4`, network-first para `index.html`, no cachea Firebase/Railway/Google/EmailJS).

## Despliegue

- Frontend: estático (GitHub Pages en `/mi-app/`; también listo para Firebase Hosting vía `firebase.json`).
- Backend: `cd functions && npm install && npm start` (escucha en `PORT` || 3000); en prod corre en Railway.

## Al trabajar acá

- Cambios de **frontend** → editar `index.html`. Es grande: usar grep para ubicar funciones, no leerlo entero.
- Cambios de **backend** → `functions/server.js`.
- **No commitear secretos.** Las credenciales van en variables de entorno de Railway / config de Firebase, no en el repo.
- Idioma de la UI, comentarios y commits: **español**.
- No hay tests automatizados ni linter configurado.
