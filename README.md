# RK · Sistema de Gestión Multiempresa

PWA (Progressive Web App) de gestión administrativa y contable para **múltiples empresas y proyectos**, con caja, bancos, ingresos, egresos, presupuestos, proveedores y **facturación electrónica ARCA (ex-AFIP)**. Funciona como app instalable (móvil/escritorio) y guarda los datos en la nube con Firebase en tiempo real.

> **Nombre comercial:** RK · Gestión Multiempresa
> **Proyecto Firebase:** `modo-prueba-bb8c2`
> **Idioma:** Español (Argentina)

---

## 📑 Índice

1. [Arquitectura general](#-arquitectura-general)
2. [Estructura del repositorio](#-estructura-del-repositorio)
3. [Frontend (`index.html`)](#-frontend-indexhtml)
4. [Backend (`functions/`)](#-backend-functions)
5. [Modelo de datos (Firebase Realtime Database)](#-modelo-de-datos-firebase-realtime-database)
6. [Autenticación, roles y permisos](#-autenticación-roles-y-permisos)
7. [Módulos funcionales](#-módulos-funcionales)
8. [Flujo de facturación ARCA](#-flujo-de-facturación-arca)
9. [Integraciones externas](#-integraciones-externas)
10. [PWA y modo offline](#-pwa-y-modo-offline)
11. [Despliegue (deploy)](#-despliegue-deploy)
12. [Variables de entorno y configuración](#-variables-de-entorno-y-configuración)
13. [Guía rápida de uso](#-guía-rápida-de-uso)
14. [Trabajo pendiente](#-trabajo-pendiente)

---

## 🏗 Arquitectura general

El sistema tiene **tres piezas**:

```
┌──────────────────────────┐      ┌───────────────────────────┐      ┌──────────────────────┐
│  FRONTEND (PWA)           │      │  FIREBASE                 │      │  BACKEND (Railway)   │
│  index.html (1 archivo)   │◄────►│  · Auth (email + Google)  │      │  functions/server.js │
│  · UI + lógica + estilos  │      │  · Realtime Database      │      │  Express + Node 22   │
│  · Vanilla JS (sin build) │      │  · Hosting / GitHub Pages │◄────►│  · ARCA / AFIP        │
│  · Service Worker (PWA)   │      │                           │      │  · Belvo / Prometeo   │
└──────────────────────────┘      └───────────────────────────┘      └──────────────────────┘
```

- **Frontend:** una sola página (`index.html`, ~17.400 líneas) en JavaScript puro, sin framework ni paso de build. Incluye HTML, CSS y JS embebidos. Las librerías externas se cargan por CDN.
- **Firebase:** autenticación (login con email/contraseña y Google) y base de datos en tiempo real (Realtime Database). El proyecto es `modo-prueba-bb8c2`.
- **Backend en Railway:** un servidor Express (`functions/server.js`) que concentra todo lo que **no puede correr en el navegador** por seguridad: firma de certificados y emisión de facturas ARCA, y conexión a bancos (Belvo / Prometeo). La clave privada del certificado nunca vive en el navegador.

> **Nota sobre `functions/`:** aunque el repo está preparado como proyecto de Firebase Functions (`firebase.json` + `functions/index.js`), el backend **en uso real es `functions/server.js` desplegado en Railway**. `index.js` es una versión equivalente pensada para Cloud Functions; el código activo es el de Railway.

---

## 📁 Estructura del repositorio

```
mi-app/
├── index.html          # Toda la app (UI + lógica + estilos). ~17.400 líneas.
├── manifest.json       # Manifiesto PWA (nombre, íconos, atajos).
├── sw.js               # Service Worker: caché offline (network-first para index.html).
├── firebase.json       # Config de Firebase Hosting + Functions + rewrite /api/afip.
├── .firebaserc         # Proyecto Firebase por defecto (modo-prueba-bb8c2).
├── PENDIENTES.md        # Bitácora de tareas pendientes / hechas (ver más abajo).
├── icons/              # Íconos de la PWA (192, 512, svg).
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icon.svg
├── logo png_*.png      # Logo de la marca.
└── functions/          # Backend.
    ├── server.js       # ★ Servidor Express activo (Railway): ARCA + Belvo + Prometeo.
    ├── index.js        # Variante para Firebase Cloud Functions (solo ARCA).
    ├── package.json    # Dependencias del backend (express, @afipsdk/afip.js, cors).
    └── .gitignore      # Ignora node_modules.
```

---

## 🖥 Frontend (`index.html`)

Aplicación de una sola página construida con **JavaScript vanilla** (sin React/Vue, sin bundler). Todo —marcado, estilos y ~447 funciones JS— vive en `index.html`.

### Librerías externas (por CDN)

| Librería | Uso |
|---|---|
| **Firebase 10.12.2** (`app`, `auth`, `database` compat) | Autenticación y base de datos en tiempo real |
| **Chart.js 3.9.1** | Gráficos del dashboard y reportes |
| **SheetJS / xlsx 0.20.3** | Exportar/importar Excel (presupuestos, BD, extractos bancarios) |
| **SortableJS 1.15.2** | Reordenar filas con drag & drop |
| **pdf.js 4.2.67** | Leer PDFs de facturas |
| **Belvo Widget** (`cdn.belvo.io`) | Conexión a bancos (open banking) |
| **EmailJS 4** | Envío de facturas por correo |
| **Google Identity Services (GSI)** | Login con Google y acceso a Gmail (`gmail.readonly`) |
| **Google Fonts** (Raleway, Josefin Sans, DM Mono, Material Symbols) | Tipografías e iconografía |

### Navegación (tabs)

La UI es un **sidebar** con menús desplegables. Cada vista se muestra con `mostrarTab('<Nombre>')`. Tabs disponibles:

`Home`, `Desarrollos`, `Dashboard`, `CajaGeneral`, `EfectivoPesos`, `EfectivoUSD`, `CuentasBancarias`, `Ventas`, `Alquileres`, `Servicios`, `IngGeneral`, `Inversiones`, `ResumenIngresos`, `Facturas`, `Proveedores`, `Presupuestos`, `Pagos`, `Egresos`, `Tesoreria`, `Documentos`, `Reportes`, `PlanTrabajo`, `Config`.

---

## ⚙️ Backend (`functions/`)

Servidor **Express** sobre **Node.js 22** (`functions/server.js`), desplegado en **Railway**. Expone una API REST consumida por el frontend. La URL del backend se guarda en el navegador (`localStorage rk_afip_function_url`).

### Endpoints

**ARCA / AFIP** (facturación electrónica, con `@afipsdk/afip.js`):

| Método | Ruta | Descripción |
|---|---|---|
| `GET`  | `/` | Health check (`{status:'ok'}`). |
| `GET`  | `/diag` | Diagnóstico: estado del servidor de ARCA y puntos de venta habilitados. |
| `GET`  | `/afip/importar?ptoVta=&tipoComp=` | Importa todos los comprobantes ya emitidos para un punto de venta + tipo. |
| `POST` | `/afip` | Emite un comprobante (factura/NC/ND) y devuelve el **CAE** real. |

**Belvo** (open banking — conexión automática a bancos vía widget):

| Método | Ruta | Descripción |
|---|---|---|
| `GET`  | `/belvo/diag` | Verifica que las credenciales estén cargadas. |
| `POST` | `/belvo/widget-token` | Genera el token para abrir el widget de conexión. |
| `GET`  | `/belvo/accounts?link=` | Cuentas asociadas a un link. |
| `GET`  | `/belvo/transactions?link=&date_from=&date_to=` | Movimientos del banco (con anti-duplicados en la app). |

**Prometeo** (open banking — plan B, login directo usuario/clave):

| Método | Ruta | Descripción |
|---|---|---|
| `GET`  | `/prometeo/diag` | Verifica credenciales. |
| `GET`  | `/prometeo/providers` | Lista de bancos soportados. |
| `POST` | `/prometeo/login` | Login al banco (`{provider, username, password}`) → devuelve `key` de sesión. |
| `GET`  | `/prometeo/accounts?key=` | Cuentas de la sesión. |
| `GET`  | `/prometeo/movements?key=&account=&currency=&date_start=&date_end=` | Movimientos (fechas DD/MM/YYYY). |
| `GET`  | `/prometeo/logout?key=` | Cierra la sesión del banco. |

> Las credenciales del banco en Prometeo **no se guardan**: viajan una sola vez para abrir la sesión y se obtiene una `key` temporal.

### Detalles de implementación destacados

- **`leerPem(valor)`**: acepta el certificado/clave en 3 formatos (PEM con saltos reales, PEM con `\n` literales, o base64 del archivo completo — lo más robusto contra problemas de saltos de línea).
- **Facturación**: calcula el número de comprobante con `getLastVoucher` + 1, arma las alícuotas de IVA, e incluye `CondicionIVAReceptorId` (obligatorio desde RG 5616: 1=RI, 4=Exento, 5=CF, 6=Monotributo). Para conceptos 2 (Servicios) y 3 (Productos y Servicios) agrega fechas de servicio. Notas de crédito/débito incluyen `CbtesAsoc` (comprobante original).

---

## 🗄 Modelo de datos (Firebase Realtime Database)

La base es **multiempresa / multiproyecto**. Cada empresa tiene proyectos, y los datos cuelgan de la ruta del proyecto activo:

```
getBasePath()  →  empresas/<empresaId>/proyectos/<proyectoId>
```

### Datos POR proyecto (bajo `empresas/<emp>/proyectos/<proy>/`)

| Ref (JS) | Ruta | Contenido |
|---|---|---|
| `REF_DATOS`       | `…/datos`       | Presupuestos / filas principales |
| `REF_CAC`         | `…/indiceCAC`   | Índice CAC (ajuste de la construcción) |
| `REF_DOCS`        | `…/documentos`  | Documentos adjuntos |
| `REF_TC`          | `…/tipoCambio`  | Tipo de cambio USD |
| `REF_FACTURAS`    | `…/facturas`    | Facturas emitidas (ARCA) |
| `REF_CAJA`        | `…/caja`        | Movimientos de caja (efectivo $ y USD) |
| `REF_INGRESOS`    | `…/ingresos`    | Ventas, alquileres, servicios, generales |
| `REF_BANCO`       | `…/banco`       | Cuentas y movimientos bancarios |
| `REF_CONTADOR_OP` | `…/contadorOP`  | Numeración correlativa de órdenes de pago |
| `REF_DESARROLLOS` | `…/desarrollos` | Desarrollos inmobiliarios (m², valor de terreno, m² vendibles, costos, valor de venta) |
| `REF_APORTANTES`  | `…/aportantes`  | Aportantes/socios que invierten capital en un desarrollo, con su rentabilidad pactada |

### Datos GLOBALES (compartidos entre todas las empresas)

| Ref (JS) | Ruta | Contenido |
|---|---|---|
| `REF_EMPRESAS`    | `empresas`              | Empresas y sus proyectos |
| `REF_PROV`        | `global/proveedores`    | Proveedores (compartidos) |
| `REF_GRUPOS`      | `global/grupos`         | Grupos de rubro (compartidos) |
| `REF_ROLES`       | `roles`                 | Rol de cada usuario (por UID) |
| `REF_USUARIOS`    | `usuarios`              | Usuarios registrados y último acceso |
| `REF_SOLICITUDES` | `solicitudesBorrado`    | Solicitudes de borrado pendientes de aprobación |
| —                 | `global/config/*`       | Config compartida: `geminiKey`, `googleClientId`, `emailjs` |

> Existe una migración automática desde el esquema viejo (`dashboardPagos`) al nuevo (`empresas/.../proyectos/...`) la primera vez que se crea una empresa.

---

## 🔐 Autenticación, roles y permisos

- **Login:** email + contraseña (`signInWithEmailAndPassword`) y/o **Google** (Google Identity Services). Estado vía `auth.onAuthStateChanged`.
- **Roles** (guardados en `roles/<uid>`):

| Rol | Variable JS | Permisos |
|---|---|---|
| **Super Admin** | `esSuperAdmin` | Todo: administrar usuarios, aprobar solicitudes de borrado, eliminar empresas/proyectos. El primer usuario se autoasigna `superadmin`. |
| **Admin** | `esAdmin` | Edita y aprueba solicitudes de borrado (no administra usuarios). |
| **Editor** | `puedeEditar` | Crea y edita registros. |
| **Lector** | (solo lectura) | Solo ve y exporta. Muestra el badge "Solo lectura". |

- **Borrado con aprobación:** un editor puede *solicitar* el borrado de un registro; el Super Admin (o Admin) debe **aprobarlo** antes de que se elimine (`solicitudesBorrado` → `aprobarSolicitud`). Esto protege contra borrados accidentales.

---

## 🧩 Módulos funcionales

- **Caja y Bancos:** libro de caja general, efectivo en pesos y en dólares, y cuentas bancarias. Importación de extractos bancarios (Santander) en CSV/Excel con **anti-duplicados** (`impExtClave`). Conexión automática opcional a bancos (Belvo/Prometeo).
- **Ingresos:** Ventas (unidades funcionales), Alquileres, Servicios del estudio, Ingresos generales y un **Resumen de Ingresos** consolidado.
- **Desarrollos Inmobiliarios** (tab propia, debajo de "Inicio"): galería de tarjetas con los desarrollos cargados (m² totales/vendibles, valor de terreno, costos, valor de venta por m²) y una **ficha de detalle** por desarrollo con sus aportantes vinculados y gráficos (Incidencia del Terreno, % del Terreno sobre el Costo Total, Participación de Aportantes, Ganancia Estimada vs. Rentabilidad Comprometida).
- **Aportantes / Socios** (tab "Inversiones" en el submenú Ingresos): registro de quién invierte capital en qué desarrollo, con la rentabilidad pactada — como % sobre el valor de venta total, la ganancia estimada, el terreno o el costo de obra, o como una cantidad de m² a un valor fijo — y cálculo automático de la rentabilidad estimada en $.
- **Facturación electrónica ARCA:** emitir facturas con CAE real, listar facturas emitidas, ver/imprimir comprobante y **enviarlo por mail** (EmailJS + PDF).
- **Egresos / Proveedores / Presupuestos:** datos de proveedores, presupuestos por proveedor, pagos y órdenes de pago numeradas.
- **Tesorería interempresa:** préstamos y movimientos entre empresas.
- **Documentos:** adjuntos; lectura de facturas PDF con **Google Gemini** (extracción automática de datos).
- **Asistente RK** (chat flotante, `Google Gemini` con *function calling*): responde dudas sobre la app, analiza PDFs de facturas adjuntos (con botón para precargarlas en Facturas), consulta bajo demanda los datos reales del proyecto activo (presupuestos con pagos, facturas, ingresos, caja, cuentas bancarias, etc. — p. ej. "¿cuánto aportó Juan Pérez?" o "¿cuánto le pagué a X este mes?") haciendo cálculos y comparaciones, puede navegar la app ("llevame a Facturas") y **precargar formularios** desde el chat (p. ej. "cargá un pago de $500.000 a Constructora Sur"): abre el formulario con los campos completados y el usuario siempre revisa y guarda — el asistente nunca escribe directo en la base.
- **Reportes y Dashboard:** gráficos (Chart.js) e impresión/exportación.
- **Exportación de datos:** presupuestos a Excel, y la base completa a **JSON / Excel / CSV / SQL**.
- **Ajustes (Config):** tipo de cambio USD, índice CAC, claves de Gemini/EmailJS, URL del backend y administración de usuarios.

---

## 🧾 Flujo de facturación ARCA

Así viaja una factura desde que se emite hasta que llega por mail. La pieza clave es que la **clave privada del certificado nunca toca el navegador**: vive solo en el backend de Railway.

```
  Usuario                 Frontend (PWA)            Backend (Railway)            ARCA / AFIP
    │                          │                          │                          │
    │  "Emitir Factura"        │                          │                          │
    ├─────────────────────────►│                          │                          │
    │   completa datos         │   POST /afip             │                          │
    │   (cliente, importes)    ├─────────────────────────►│                          │
    │                          │                          │  getLastVoucher()        │
    │                          │                          ├─────────────────────────►│
    │                          │                          │◄─────────────────────────┤
    │                          │                          │  nro = último + 1        │
    │                          │                          │  createVoucher(data)     │
    │                          │                          ├─────────────────────────►│
    │                          │                          │◄─────────────────────────┤
    │                          │   { cae, caeFchVto,      │   CAE real               │
    │                          │     cbteDesde, ... }     │                          │
    │                          │◄─────────────────────────┤                          │
    │                          │                          │                          │
    │                          ├── guarda en Firebase ───►  empresas/.../facturas    │
    │   ve comprobante         │                          │                          │
    │◄─────────────────────────┤                          │                          │
    │                          │                          │                          │
    │  "Enviar por mail"       │   sube PDF → Firebase     │                          │
    ├─────────────────────────►│   (temp-pdf) + EmailJS   │                          │
    │   cliente recibe mail     │   con link al PDF        │                          │
    │◄─────────────────────────┤                          │                          │
```

**Pasos en detalle:**

1. El usuario abre *Ingresos → Resumen Ingresos → 📄 Emitir Factura ARCA* y completa cliente e importes.
2. El frontend hace `POST /afip` al backend con tipo de comprobante, punto de venta, importes, IVA y condición del receptor.
3. El backend pide a ARCA el último número (`getLastVoucher`), calcula el siguiente y emite el comprobante (`createVoucher`).
4. ARCA devuelve el **CAE** (Código de Autorización Electrónico) y su vencimiento.
5. El frontend guarda la factura en Firebase (`…/facturas`) y muestra el comprobante imprimible.
6. Opcional: *Enviar por mail* sube el PDF a Firebase (`temp-pdf`) y dispara EmailJS con el link de descarga.

> **Diagnóstico:** abrir `<url-backend>/diag` en el navegador muestra el estado de ARCA y los puntos de venta habilitados. `GET /afip/importar?ptoVta=3&tipoComp=1` reimporta comprobantes ya emitidos.

---

## 🔌 Integraciones externas

| Servicio | Para qué | Dónde se configura |
|---|---|---|
| **Firebase** (Auth + Realtime DB) | Login y datos en tiempo real | `firebaseConfig` en `index.html` |
| **ARCA / AFIP** (`@afipsdk/afip.js`) | Facturación electrónica (CAE) | Backend Railway (`AFIP_*`) |
| **Belvo** | Open banking (widget) | Backend Railway (`BELVO_*`) |
| **Prometeo** | Open banking (plan B, login directo) | Backend Railway (`PROMETEO_*`) |
| **Google Gemini** | Leer datos de facturas PDF | `global/config/geminiKey` |
| **EmailJS** | Enviar facturas por mail | `global/config/emailjs` + `localStorage` |
| **Gmail API** (`gmail.readonly`) | Leer mails (futuro: movimientos del banco) | Login con Google |

---

## 📲 PWA y modo offline

- **`manifest.json`**: app instalable. `scope`/`start_url` = `/mi-app/`, modo `standalone`, atajos directos a *Ingresos* y *Facturas ARCA*.
- **`sw.js`** (Service Worker, caché `rk-v4`):
  - **Network-first** para `index.html` (siempre baja la última versión); **cache-first** para el resto del shell.
  - **No cachea** (siempre red) las llamadas a Firebase, Railway, Google APIs/Fonts y EmailJS.
  - Sin conexión: sirve desde caché y, como fallback, `index.html`.

---

## 🚀 Despliegue (deploy)

### Frontend
Se sirve estático. Según `manifest.json` el `scope` es `/mi-app/` (típico de **GitHub Pages** en una ruta de proyecto). `firebase.json` también lo deja listo para **Firebase Hosting** (`public: "."`, ignorando `functions/` y archivos ocultos), con un rewrite `/api/afip/** → función afip`.

### Backend
`functions/server.js` corre en **Railway** (Node 22). Para correrlo localmente:

```bash
cd functions
npm install
npm start          # node server.js — escucha en process.env.PORT || 3000
```

> Railway/Render inyectan `PORT` automáticamente.

---

## 🔑 Variables de entorno y configuración

### Backend (Railway) — `functions/server.js`

| Variable | Descripción |
|---|---|
| `AFIP_CUIT` | CUIT del emisor (sin guiones). |
| `AFIP_CERT` | Certificado `.crt` (recomendado: **base64** del archivo). |
| `AFIP_KEY`  | Clave privada `.key` (recomendado: **base64**). |
| `AFIP_ENV`  | `production` o `testing` (default `testing`). |
| `AFIP_ACCESS_TOKEN` | Token de acceso de AFIP SDK (opcional). |
| `BELVO_SECRET_ID` / `BELVO_SECRET_PASSWORD` | Credenciales de Belvo. |
| `BELVO_ENV` | `sandbox` (default) / `development` / `production`. |
| `PROMETEO_API_KEY` | API key de Prometeo. |
| `PROMETEO_ENV` | `sandbox` (default) / `production`. |
| `PORT` | Puerto (lo inyecta Railway). |

### Frontend
- `firebaseConfig` (bloque en `index.html`) — config del proyecto Firebase.
- `localStorage rk_afip_function_url` — URL del backend de Railway.
- `localStorage rk_belvo_function_url` — URL del backend para Belvo.
- Claves de **Gemini** y **EmailJS**: en `global/config/*` de Firebase (con respaldo en `localStorage`).

---

## 🧭 Guía rápida de uso

**Para el usuario final (operar la app):**

1. **Entrar:** abrir la app e iniciar sesión con email/contraseña o con Google.
2. **Elegir contexto:** seleccionar la **empresa** y el **proyecto** con los que vas a trabajar (el sidebar muestra cuál está activo).
3. **Cargar movimientos:** usar *Caja y Bancos* para efectivo/banco, e *Ingresos*/*Egresos* para ventas, alquileres, servicios, proveedores y pagos.
4. **Facturar:** en *Ingresos → Resumen Ingresos*, tocar *📄 Emitir Factura ARCA*; ver el listado en *📒 Facturas emitidas*.
5. **Exportar:** desde *Reportes/Config* se exporta a Excel, JSON, CSV o SQL.

**Para el administrador (puesta en marcha):**

1. **Backend:** desplegar `functions/server.js` en Railway con las variables `AFIP_*` (y opcionalmente `BELVO_*` / `PROMETEO_*`). Verificar con `GET <url>/diag`.
2. **Conectar la app al backend:** en la app, la primera emisión pide la **URL del backend** (se guarda en `localStorage rk_afip_function_url`).
3. **Firebase:** revisar que `firebaseConfig` esté completo y publicar las reglas de la base (incluida la de `temp-pdf` para los PDF por mail).
4. **Integraciones opcionales:** cargar la **Gemini API Key** (leer facturas PDF) y las credenciales de **EmailJS** (enviar por mail) en *Config*.
5. **Usuarios:** el primer usuario queda como **Super Admin** automáticamente; desde *Config → Usuarios* se asignan los roles del resto.

---

## 📌 Trabajo pendiente

El detalle vivo está en [`PENDIENTES.md`](./PENDIENTES.md). Resumen al día de hoy:

- ✅ **Hecho:** facturación electrónica ARCA funcionando (CAE real, punto de venta 3, RI); limpieza de IDs y funciones duplicadas.
- 🟡 **En curso:** conexión automática al banco con **Belvo** — el código (backend + app) está listo; falta crear la cuenta en Belvo y cargar las keys en Railway. *Plan B:* Prometeo (backend listo, falta la UI de login).
- 🔜 **Próximo:** leer movimientos del Santander desde **Gmail** (gratis) — falta un mail de ejemplo real para escribir el parser.
- ⚠️ **Pendiente menor:** publicar las reglas de Firebase para `temp-pdf` y que el PDF de la factura enviada por mail sea descargable.

---

*Documentación generada a partir del código del repositorio. Para detalles de implementación, ver `index.html` (frontend) y `functions/server.js` (backend).*
