# 🏗 Consolidación Técnica — RK · Gestión Multiempresa

**Documento de arquitectura y operaciones para desarrolladores y administradores. Generado 2026-07-02.**

> Para documentación orientada a usuarios finales, ver `README.md`. Para auditoría de seguridad, ver `SECURITY.md`. Para tareas pendientes, ver `PENDIENTES.md`.

---

## 📋 Índice

1. [Resumen ejecutivo](#resumen-ejecutivo)
2. [Arquitectura consolidada](#arquitectura-consolidada)
3. [Capas del sistema](#capas-del-sistema)
4. [Flujos integrados (casos de uso)](#flujos-integrados)
5. [Modelo de datos detallado](#modelo-de-datos-detallado)
6. [Matriz de seguridad](#matriz-de-seguridad)
7. [Checklist operativo (producción)](#checklist-operativo)
8. [Troubleshooting](#troubleshooting)

---

## Resumen ejecutivo

**RK es una PWA de gestión multiempresa/multiproyecto con facturación electrónica ARCA.** Se divide en **3 capas independientes**:

| Capa | Tecnología | Función | Riesgo |
|------|-----------|---------|--------|
| **Frontend** | JavaScript vanilla + Firebase SDK (CDN) | UI, navegación, validación básica, renderizado reactivo | Permisos solo en cliente, XSS |
| **Base de datos** | Firebase Realtime Database | Persistencia, sincronización en tiempo real | Reglas demasiado permisivas, datos compartidos |
| **Backend** | Express + Node 22 (Railway) | ARCA, open banking, cálculos fiscales | Sin autenticación, sin validación |

**Fortaleza:** separación clara (credenciales ARCA **nunca** en el navegador); reactividad (cambios propagados en tiempo real).

**Debilidad crítica:** autenticación y autorización débiles — el backend no valida quién llama, y los permisos del cliente son cosméticos.

**Uso actual:** una sola empresa / grupo controlado. **Antes de multicliente en producción,** aplicar mitigaciones de SECURITY.md.

---

## Arquitectura consolidada

### Diagrama de integración

```
┌─────────────────────────────────────────────────────────────────────┐
│ CLIENTE (Navegador — Progressive Web App)                           │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ index.html (20k líneas — JavaScript vanilla)                │  │
│  │  · HTML + CSS + ~531 funciones globales                      │  │
│  │  · 9 librerías por CDN (Firebase, Chart, xlsx, etc.)         │  │
│  │  · 24 tabs navegables (Home, Dashboard, Caja, Facturas...)   │  │
│  │  · UI reactiva: listeners de Firebase disparan renders       │  │
│  │  · Modal de onboarding: elige empresa/proyecto               │  │
│  │  · Service Worker: caché offline (rk-v4)                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│           ↓                                    ↓                     │
│      [Auth]                               [REST calls]              │
└───────────┼────────────────────────────────────┼───────────────────┘
            │                                    │
            ↓                                    ↓
      ┌──────────────────┐         ┌──────────────────────────┐
      │ Firebase         │         │ Backend (Railway)        │
      │ · Auth           │         │ · Express + Node 22      │
      │   (email +       │         │ · functions/server.js    │
      │    Google)       │         │                          │
      │ · Realtime DB    │         │ Endpoints:               │
      │   (listeners)    │         │ · /afip (ARCA)           │
      │ · Storage        │         │ · /belvo (open banking)  │
      │   (temp-pdf)     │         │ · /prometeo (alt. banco)  │
      └──────────────────┘         └──────────────────────────┘
            ↑                                    ↑
      [empresas/...]                 [AFIP, Belvo, Prometeo]
```

### Capa 1: Frontend (index.html)

**Responsabilidades:**
- Renderizar UI (HTML generado con template strings)
- Capturar entrada del usuario (forms, clicks, drag-drop)
- Validar datos básicos (campos obligatorios)
- Mandar datos a Firebase (`REF_*.set()` / `.update()`)
- Escuchar cambios reactivos (`.on('value')`)
- Hacer llamadas al backend (REST JSON)
- Manejo de autenticación local (Firebase Auth)
- Exportación de datos (Excel, JSON, CSV, SQL)

**Iniciación:**
```javascript
// En el <script> principal:
const firebaseConfig = { /* config */ };
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// Listener global que bloquea/desbloquea la app:
auth.onAuthStateChanged((user) => {
  if (user) {
    cargarDatos(); // Inicia listeners de Firebase
  } else {
    mostrarLogin(); // Muestra overlay de login
  }
});
```

**Estructura de funciones:**
- ~50 funciones de **UI** (modales, validación, renders)
- ~100 funciones de **persistencia** (guardar datos en Firebase)
- ~150 funciones de **render** (actualizar DOM cuando cambian datos)
- ~100 funciones de **lógica de negocio** (cálculos, consolidación)
- ~80 funciones de **integraciones** (ARCA, Belvo, Gemini, EmailJS, etc.)
- ~50 funciones **utilitarias** (formateo, conversiones, helper)

**Listeners instalados en `cargarDatos()`:**
- `REF_DATOS.on('value')` → `renderDatos()`
- `REF_CAJA.on('value')` → `renderCaja()`
- `REF_INGRESOS.on('value')` → `renderIngresos()`
- `REF_BANCO.on('value')` → `renderBanco()`
- `REF_FACTURAS.on('value')` → `renderFacturas()`
- `REF_PROVEEDORES.on('value')` → `renderProveedores()`
- `REF_DESARROLLOS.on('value')` → `renderDesarrollos()`
- `REF_APORTANTES.on('value')` → `renderAportantes()`
- (+ 5+ más según módulos activos)

**Flujo de un cambio de datos:**
```
Usuario edita campo → Click Guardar
  ↓
Función persistir() valida campos
  ↓
REF_*.update({...}) guarda en Firebase
  ↓
Listener detecta cambio
  ↓
Función render() se ejecuta automáticamente
  ↓
DOM se actualiza (todos los clientes conectados ven el cambio)
```

### Capa 2: Firebase Realtime Database

**Responsabilidades:**
- Persistencia de datos en tiempo real
- Autenticación de usuarios
- Autorización (reglas de seguridad)
- Sincronización entre clientes
- Disponibilidad offline (datos en caché local)

**Estructura (ver [Modelo de datos detallado](#modelo-de-datos-detallado)):**
- `/empresas/<id>/proyectos/<id>/...` — datos por proyecto
- `/global/...` — datos compartidos entre empresas
- `/roles`, `/usuarios` — gestión de acceso
- `/solicitudesBorrado` — workflow de aprobación
- `/temp-pdf` — almacenamiento temporal (PDFs de facturas)

**Iniciación de datos:**
```javascript
const getBasePath = () => 
  `empresas/${empresaActual.id}/proyectos/${proyectoActual.id}`;

const REF_DATOS = db.ref(`${getBasePath()}/datos`);
const REF_FACTURAS = db.ref(`${getBasePath()}/facturas`);
// ... etc.

// Al cambiar empresa/proyecto:
actualizarRefs(); // Reasigna todas las referencias
```

**Operación typical (lectura reactiva):**
```
REF_PROVEEDORES.on('value', (snapshot) => {
  const proveedores = snapshot.val() || {};
  renderProveedores(proveedores);
});
```

**Operación típica (escritura):**
```
REF_PROV.update({
  [cuitProv]: { nombre, email, cuit, ... }
});
// → listener se activa automáticamente
```

### Capa 3: Backend (functions/server.js)

**Responsabilidades:**
- Firmar y emitir facturas ARCA (con certificado digital)
- Conectar a bancos (Belvo / Prometeo)
- Importar comprobantes recibidos (AFIP SDK)
- Exposición de credenciales (CUIT, certificado, clave) — **nunca en el navegador**

**Iniciación:**
```javascript
const express = require('express');
const app = express();

const afip = new AFIP({
  cuit: process.env.AFIP_CUIT,
  production: process.env.AFIP_ENV === 'production',
  cert: leerPem(process.env.AFIP_CERT), // ← base64 o PEM real
  key: leerPem(process.env.AFIP_KEY)
});

app.listen(process.env.PORT || 3000);
```

**Endpoints principales:**

| Ruta | Método | Función | Requiere |
|------|--------|---------|----------|
| `/` | GET | Health check | — |
| `/diag` | GET | Diagnóstico de credenciales | `APP_API_TOKEN` (futuro) |
| `/afip` | POST | Emitir factura ARCA | `AFIP_*` en ENV |
| `/afip/importar` | GET | Reimportar comprobantes emitidos | `AFIP_*` en ENV |
| `/afip/emitidos` | GET | Traer emitidos vía AFIP SDK | `AFIP_SDK_TOKEN`, `ARCA_USER`, `ARCA_PASS` |
| `/afip/recibidos` | GET | Traer recibidos vía AFIP SDK | `AFIP_SDK_TOKEN`, `ARCA_USER`, `ARCA_PASS` |
| `/belvo/widget-token` | POST | Token para widget de Belvo | `BELVO_*` en ENV |
| `/belvo/accounts` | GET | Cuentas bancarias conectadas | `BELVO_*` en ENV |
| `/belvo/transactions` | GET | Movimientos del banco (Belvo) | `BELVO_*` en ENV |
| `/prometeo/login` | POST | Iniciar sesión en banco (Prometeo) | `PROMETEO_*` en ENV |
| `/prometeo/movements` | GET | Movimientos del banco (Prometeo) | `PROMETEO_API_KEY` en ENV |

---

## Capas del sistema

### Capa de presentación (Frontend)
- **HTML:** 1 archivo `index.html` con estructura de tabs ocultos/visibles
- **CSS:** embebido (paleta: grafito/blanco, iconografía Material Symbols, responsive)
- **JavaScript:** 531 funciones globales, listeners reactivos, validación básica
- **Flujo:** User input → validación → persistencia Firebase → listener → render

### Capa de datos (Firebase)
- **Autenticación:** email/contraseña + Google OAuth (Firebase Auth)
- **Persistencia:** Realtime Database (estructura jerárquica)
- **Reglas:** actuales permisivas (`.write: auth != null`) — **requieren hardening antes de producción**
- **Disponibilidad:** sincronización en tiempo real, offline-first (Service Worker)
- **Acceso:** listeners reactivos en JS (no polling)

### Capa de aplicación (Backend Express)
- **Certificados:** AFIP CUIT + cert (.crt) + key (.key) en env vars (nunca en código)
- **Integración ARCA:** SDK de AFIP (@afipsdk/afip.js) — emite CAE real ante ARCA
- **Open banking:** Belvo (widget MX/BR/CO/CL) + Prometeo (API MX/BR/CO/CL/AR)
- **Validación:** mínima (sin checks de rango, tipo, etc.)
- **Autenticación:** ❌ **sin implementar** (punto crítico)

---

## Flujos integrados

### Flujo 1: Emitir factura ARCA

```
USUARIO                    FRONTEND                      BACKEND (Railway)                   ARCA (AFIP)
  │                          │                                   │                               │
  │ 1. Click "Emitir"        │                                   │                               │
  ├─────────────────────────►│                                   │                               │
  │    Completa formulario   │                                   │                               │
  │                          │  2. POST /afip                    │                               │
  │                          ├──────────────────────────────────►│                               │
  │                          │    { tipoComp, ptoVta,            │ 3. getLastVoucher()          │
  │                          │      monto, iva, etc }            ├──────────────────────────────►
  │                          │                                   │◄──────────────────────────────┤
  │                          │                                   │    nro = 00000123             │
  │                          │                                   │                               │
  │                          │                                   │ 4. createVoucher({            │
  │                          │                                   │    cbteDesde: 00000124,       │
  │                          │                                   │    ... })                     │
  │                          │                                   ├──────────────────────────────►
  │                          │                                   │◄──────────────────────────────┤
  │                          │                                   │    { CAE: "20241234567890",  │
  │                          │   3. { CAE, ptoVta,               │      caeFchVto: "2025-01-31" }
  │                          │◄──────────────────────────────────┤                               │
  │                          │      cbteDesde, ... }             │                               │
  │                          │                                   │                               │
  │                          │ 4. db.ref('…/facturas').update()  │                               │
  │                          ├──────────┐                         │                               │
  │                          │           │ (Firebase)            │                               │
  │ 5. Mostrar comprobante   │◄──────────┘                        │                               │
  │◄─────────────────────────┤                                   │                               │
  │    (imprimible)          │                                   │                               │
  │                          │                                   │                               │
  │ 6. [Opción] "Enviar"     │                                   │                               │
  ├─────────────────────────►│                                   │                               │
  │    por mail              │ 5. Sube PDF → Firebase (temp-pdf) │                               │
  │                          ├──────────┐                         │                               │
  │                          │           │ (Storage)             │                               │
  │                          │ 6. EmailJS sendForm()             │                               │
  │                          ├──────────────────────────────┐    │                               │
  │                          │                              │    │                               │
  │ 7. Mail llega            │                         (EmailJS) │                               │
  │ (con link de PDF)        │                              │    │                               │
  │◄──────────────────────────────────────────────────────┘     │                               │
```

**Pasos en detalle:**
1. Usuario abre *Ingresos → Resumen Ingresos → 📄 Emitir Factura ARCA*
2. Completa cliente, importes, tipo de comprobante, punto de venta
3. Click "Emitir" → valida que URL del backend esté en `global/config/afipConfig/…/url`
4. POST a backend con todos los datos
5. Backend:
   - Valida credenciales en `process.env` (AFIP_CUIT, AFIP_CERT, AFIP_KEY)
   - Obtiene último número con `afip.ElectronicBilling.getLastVoucher(ptoVta, tipoComp)`
   - Arma estructura de alícuotas de IVA
   - Llama `afip.ElectronicBilling.createVoucher({...})`
   - Devuelve `{ cae, caeFchVto, cbteDesde, ptoVta, tipoComp }`
6. Frontend guarda en `REF_FACTURAS` (listener dispara render)
7. Muestra comprobante imprimible con CAE y datos fiscales
8. Opcionalmente: sube PDF a `temp-pdf` y envía por mail con EmailJS

**Validación requerida:** antes de producción, agregar checks en backend de importes negativos, CUIT válido, etc.

---

### Flujo 2: Cambiar empresa/proyecto

```
USUARIO                  FRONTEND

  │  1. Abre app o hace clic en selector
  │
  ├─────────────────────►  mostrarOnboarding()
  │                          │
  │                          ├─ Carga empresas desde Firebase
  │                          │
  │  2. Elige empresa        │
  ├─────────────────────►  Cargan proyectos de esa empresa
  │                          │
  │  3. Elige proyecto       │
  ├─────────────────────►  Internamente:
  │                          │
  │                          ├─ empresaActual = {...}
  │                          ├─ proyectoActual = {...}
  │                          │
  │                          ├─ actualizarRefs()  ← REASIGNA todas las referencias
  │                          │   REF_DATOS = db.ref('empresas/X/proyectos/Y/datos')
  │                          │   REF_FACTURAS = db.ref('empresas/X/proyectos/Y/facturas')
  │                          │   REF_CAJA = ...
  │                          │   (etc. ~10 referencias)
  │                          │
  │                          ├─ cargarDatos()  ← INSTALA listeners en nueva ruta
  │                          │   REF_DATOS.on('value', renderDatos)
  │                          │   REF_CAJA.on('value', renderCaja)
  │                          │   (etc.)
  │                          │
  │  4. UI actualizada       │
  │  (con datos nuevos)      ├─ Todos los listeners disparan renders
  │◄─────────────────────┤  automáticamente
  │                         
```

**Puntos críticos:**
- `actualizarRefs()` reasigna **todas las referencias** (10+) de una vez
- `cargarDatos()` **desasciende los listeners viejos** antes de instalar los nuevos (evita memory leaks)
- Los listeners están **siempre activos** mientras la app esté abierta
- Cambiar empresa/proyecto es una **operación atómica** — no hay datos inconsistentes

---

### Flujo 3: Sincronización en tiempo real

```
USUARIO A                          FIREBASE                        USUARIO B
(navegador 1)                      (base de datos)                (navegador 2)

  │                                  │                               │
  │ 1. Agrega proveedor              │                               │
  ├─────┐                            │                               │
  │     │ REF_PROV.update({...})     │                               │
  │     └───────────────────────────►│                               │
  │                                  │                               │
  │                                  │ Listener en Usuario B         │
  │                                  │ ├─ detecta cambio             │
  │                                  │ ├─ dispara renderProveedores()
  │                                  │ │                             │
  │                                  │                     2. UI se actualiza
  │                                  │ ◄───────────────────────────┤
  │                                  │       (sin que B haya         │
  │ (Usuario A ve confirmación)      │        hecho nada)            │
  │◄─────────────────────────────────┤                               │
  │
```

**Tecnología:** Firebase listeners (`.on('value')`) permiten reactividad sin polling. Cada cliente instala listeners en las referencias que le importan; cuando cambian, Firebase **notifica a todos los clientes** conectados.

---

### Flujo 4: Open banking (Belvo)

```
USUARIO                  FRONTEND                    BACKEND                 BELVO

  │ 1. Click "Conectar banco"
  ├────────────────────────────────────────────────────────────────────────────►
  │
  │                      POST /belvo/widget-token
  │                      ├──────────────────────────►
  │                                                  ├─ auth con Belvo
  │                                                  ├─ devuelve access_token
  │                                                  │  + refresh_token
  │                      ◄──────────────────────────┤
  │                      { access, refresh }
  │
  │ 2. Abre widget Belvo (con tokens)
  │ ├────────────────────────────────────────────────────────────────────────────►
  │                                                  │ (widget embebido)
  │                                                  │
  │ 3. Usuario se autentica en su banco
  │ ├────────────────────────────────────────────────────────────────────────────►
  │                                                  │ y autoriza acceso
  │
  │ 4. Widget devuelve link_id
  │ ◄────────────────────────────────────────────────────────────────────────────┤
  │    (para esa conexión)
  │
  │ 5. Frontend: GET /belvo/accounts?link=<link_id>
  │ ├────────────────────────────────────────────────►
  │                                                  │ lista cuentas
  │                      ◄────────────────────────────┤
  │                      [{ id, name, balance }, ...]
  │
  │ 6. Usuario elige cuenta + fecha
  │ ├────────────────────────────────────────────────────────────────────────────►
  │
  │ 7. Frontend: GET /belvo/transactions?link=<link_id>&date_from=...
  │ ├────────────────────────────────────────────────►
  │                                                  │ obtiene movimientos
  │                      ◄────────────────────────────┤
  │                      [{ date, amount, description }, ...]
  │
  │ 8. Guarda en REF_BANCO (con anti-duplicados)
  │ ├────────────────────┐
  │                      │ (Firebase)
  │                      └──────────────────────────────────────────────────────►
  │
  │ 9. Tabla se actualiza (listener dispara render)
  │◄─────────────────────────────────────────────────────────────────────────────┤
```

**Limitación:** Belvo solo cubre MX, BR, CO, CL — **NO Argentina**. Para AR, usar Plan B (Prometeo).

**Plan B — Prometeo:**
```
Usuario elige banco + ingresa usuario/clave
  ↓
Frontend: POST /prometeo/login { provider, username, password }
  ↓
Backend devuelve { key: "sesión temporal" } — credenciales NO se guardan
  ↓
Frontend: GET /prometeo/movements?key=...&account=...&date_start=...
  ↓
Backend obtiene movimientos de Prometeo
  ↓
Frontend guarda en REF_BANCO (con anti-duplicados)
```

---

## Modelo de datos detallado

### Estructura jerárquica completa

```
{
  "empresas": {
    "<empresaId>": {
      "nombre": "Mi Empresa S.A.",
      "cuit": "20123456789",
      "email": "admin@empresa.com",
      "proyectos": {
        "<proyectoId>": {
          "nombre": "Proyecto 2024",
          "descripcion": "...",
          "moneda": "ARS",  // ARS | USD
          
          // DATOS PRINCIPALES
          "datos": {
            "<conceptoId>": {
              "concepto": "Presupuesto Base",
              "monto": 100000,
              "unitario": false,
              "observaciones": "...",
              "timestamp": 1720000000000
            },
            ...
          },
          
          // DESARROLLOS INMOBILIARIOS
          "desarrollos": {
            "<desarrolloId>": {
              "nombre": "Complejo Residencial Centro",
              "m2Totales": 5000,
              "m2Vendibles": 4500,
              "valorTerreno": 500000,
              "costoObra": 2500000,
              "costoM2Construccion": 500,
              "porcentajeTerreno": 20,  // % sobre costo total
              "observaciones": "...",
              "fechaCreacion": 1720000000000
            },
            ...
          },
          
          // APORTANTES / SOCIOS
          "aportantes": {
            "<aportanteId>": {
              "nombre": "Juan Pérez",
              "desarrolloId": "<desarrolloId>",
              "tipoRentabilidad": "porcentajeValorVenta",  // porcentajeValorVenta | porcentajeGanancia | porcentajeCostoObra | m2 | ...
              "valoresAportados": {
                "ARS": 100000,
                "USD": 5000
              },
              "rentabilidadPactada": 15,  // % o valor según tipo
              "contacto": "juan@email.com",
              "observaciones": "...",
              "timestamp": 1720000000000
            },
            ...
          },
          
          // CAJA (efectivo)
          "caja": {
            "ARS": {
              "<movId>": {
                "tipo": "ingreso",  // ingreso | egreso
                "monto": 10000,
                "concepto": "Venta",
                "fecha": "2024-07-02",
                "comprobante": "#001",
                "timestamp": 1720000000000
              },
              ...
            },
            "USD": { /* similar */ }
          },
          
          // INGRESOS (ventas, alquileres, servicios, etc.)
          "ingresos": {
            "ventas": {
              "<ventaId>": {
                "uf": "UF001",
                "moneda": "ARS",
                "monto": 250000,
                "unidadFuncional": "Depto 4A",
                "desarrolloId": "<desarrolloId>",  // vinculación
                "m2Unidad": 150,
                "m2Amenities": 30,
                "cliente": "Cliente S.A.",
                "contacto": "cliente@email.com",
                "fechaContrato": "2024-06-01",
                "estado": "pendiente",  // pendiente | parcialmentePagada | pagada
                "obs": "...",
                "timestamp": 1720000000000
              },
              ...
            },
            "alquileres": { /* similar */ },
            "servicios": { /* similar */ },
            "ingGeneral": { /* similar */ }
          },
          
          // BANCOS
          "banco": {
            "cuentas": {
              "<cuentaId>": {
                "nombre": "Santander Cta. Cte.",
                "banco": "BSUD",
                "moneda": "ARS",
                "saldo": 150000,
                "linkBelvo": "<id>",  // para conectar/sincronizar
                "linkPrometeo": "<id>",
                "ultimaSincronizacion": 1720000000000
              },
              ...
            },
            "movimientos": {
              "<movId>": {
                "fecha": "2024-07-01",
                "concepto": "Transferencia",
                "monto": -5000,
                "saldo": 155000,
                "tipoMov": "egreso",  // ingreso | egreso
                "impExtClave": "SAN20240701-5000-XYZABC",  // anti-duplicados
                "timestamp": 1720000000000
              },
              ...
            }
          },
          
          // FACTURAS (emitidas por la empresa)
          "facturas": {
            "<facId>": {
              "numero": "00000123",
              "tipoComp": "01",  // 01=FA, 02=ND, 03=NC
              "ptoVta": "003",
              "cliente": "Cliente ARCA S.A.",
              "cuit": "30123456789",
              "condicionIVA": "RI",  // RI | Exento | CF | Monotributo
              "fechaEmision": "2024-07-02",
              "fechaVencimiento": "2024-08-01",
              "moneda": "ARS",
              "subtotal": 100000,
              "iva": 21000,
              "total": 121000,
              "items": [
                { descripcion: "Servicio...", cantidad: 1, unitario: 100000, iva: 21000 }
              ],
              "cae": "20241234567890",
              "caeFchVto": "2025-01-31",
              "cbteDesde": "00000123",
              "cbteHasta": "00000123",
              "estado": "emitida",  // emitida | anulada
              "pdf": {
                "url": "gs://...",  // Firebase Storage
                "fechaGeneracion": 1720000000000
              },
              "timestamp": 1720000000000
            },
            ...
          },
          
          // PROVEEDORES + PRESUPUESTOS + EGRESOS
          "proveedores": {  // NOTA: también existe global/proveedores
            "<provId>": {
              "nombre": "Constructor Pérez",
              "cuit": "20987654321",
              "email": "contacto@constructor.com",
              "telefono": "...",
              "rubro": "Construcción",  // vinculado a REF_GRUPOS
              "saldo": 50000,  // saldo adeudado
              "obs": "Empresa de confianza"
            },
            ...
          },
          
          "presupuestos": {
            "<presupId>": {
              "numero": "PRE-2024-001",
              "proveedor": "<provId>",
              "monto": 500000,
              "moneda": "ARS",
              "items": [
                { descripcion: "Excavación", cantidad: 100, unitario: 1000 }
              ],
              "fechaEmision": "2024-07-01",
              "fechaVencimiento": "2024-07-31",
              "estado": "pendiente",  // pendiente | aprobado | rechazado
              "observaciones": "...",
              "timestamp": 1720000000000
            },
            ...
          },
          
          "egresos": {
            "<egresoId>": {
              "tipo": "pago",  // pago | anticipo | retencion
              "proveedor": "<provId>",
              "presupuesto": "<presupId>",
              "monto": 100000,
              "moneda": "ARS",
              "concepto": "Pago parcial - Construcción",
              "metodo": "transferencia",  // efectivo | transferencia | cheque
              "fecha": "2024-07-02",
              "numeroOP": "OP-2024-00001",
              "observaciones": "...",
              "timestamp": 1720000000000
            },
            ...
          },
          
          // COMPROBANTES RECIBIDOS (de proveedores)
          "compRecibidos": {
            "<compId>": {
              "numero": "00000456",
              "tipoComp": "01",  // FA, ND, NC, etc.
              "proveedorCuit": "20987654321",
              "proveedorNombre": "Constructor Pérez",
              "fechaEmision": "2024-07-01",
              "moneda": "ARS",
              "subtotal": 100000,
              "iva": 21000,
              "retenciones": 0,
              "total": 121000,
              "estado": "recibida",
              "descargadaARCA": true,  // importada de ARCA
              "timestamp": 1720000000000
            },
            ...
          },
          
          // DOCUMENTOS (adjuntos)
          "documentos": {
            "<docId>": {
              "nombre": "Plano-Arquitectónico.pdf",
              "url": "gs://...",  // Firebase Storage
              "tipo": "pdf",
              "tamanio": 2048000,
              "fechaSubida": "2024-07-02",
              "extraidoGemini": {
                "texto": "Contenido extraído por Google Gemini...",
                "datos": { /* extracción automática de facturas */ }
              }
            },
            ...
          },
          
          // ÍNDICES Y TASAS
          "indiceCAC": {
            "<fecha>": { valor: 100.5 },  // Índice CAC para ajustes
            ...
          },
          "tipoCambio": {
            "<fecha>": { valor: 1000 },  // cotización USD/ARS
            ...
          },
          
          // PLAN DE TRABAJO (etapas)
          "planTrabajo": {
            "<etapaId>": {
              "numero": "1",
              "descripcion": "Cimientos",
              "fechaInicio": "2024-06-01",
              "fechaFin": "2024-07-31",
              "estado": "en_progreso",  // pendiente | en_progreso | completada
              "porcentajeAvance": 50,
              "observaciones": "..."
            },
            ...
          },
          
          // CONTADOR OPERACIONES (para generar IDs secuenciales)
          "contadorOP": {
            "numero": 5  // siguiente número de OP será 6
          }
        }
      }
    }
  },
  
  // DATOS GLOBALES (compartidos entre empresas)
  "global": {
    "config": {
      "geminiKey": "<API_KEY>",  // para Gemini (leer PDFs)
      "googleClientId": "<CLIENT_ID>",  // para Google OAuth
      "emailjs": {
        "serviceId": "...",
        "templateId": "...",
        "publicKey": "..."
      },
      "appToken": "<TOKEN_SECRETO>",  // autenticación backend
      "afipFunctionUrl": "https://mi-app-production.up.railway.app"  // fallback global
    },
    "afipConfig": {
      "<empresaId>": {
        "url": "https://mi-app-production.up.railway.app"  // URL del backend para emitir facturas
      },
      ...
    },
    "proveedores": {  // GLOBAL — todos los usuarios ven esto
      "<provId>": {
        "nombre": "Proveedor Global",
        "cuit": "20987654321",
        ...
      },
      ...
    },
    "grupos": {  // GLOBAL — categorías de egresos
      "<grupoId>": {
        "nombre": "Construcción",
        "color": "#FF6B6B"
      },
      ...
    },
    "facturasARCA": {  // GLOBAL — índice de facturas emitidas
      "<facId>": {
        "empresaId": "<empresa>",
        "proyectoId": "<proyecto>",
        "numero": "00000123",
        ...
      }
    },
    "compRecibidos": {  // GLOBAL — índice de comprobantes recibidos
      "<compId>": {
        "empresaId": "<empresa>",
        "proyectoId": "<proyecto>",
        "numero": "00000456",
        ...
      }
    }
  },
  
  // GESTIÓN DE ACCESO
  "roles": {
    "<uid>": "superadmin",  // superadmin | admin | editor | lector
    "<uid2>": "editor",
    "<uid3>": "lector"
  },
  
  "usuarios": {
    "<uid>": {
      "email": "user@empresa.com",
      "nombre": "Usuario",
      "ultimoAcceso": 1720000000000,
      "empresas": ["<empresaId1>", "<empresaId2>"]  // empresas a las que pertenece
    },
    ...
  },
  
  // WORKFLOW DE BORRADO CON APROBACIÓN
  "solicitudesBorrado": {
    "<solicitudId>": {
      "tipo": "registro",  // registro | empresa | proyecto
      "ruta": "empresas/<id>/proyectos/<id>/ingresos/ventas/<id>",
      "solicitadoUid": "<uid>",
      "solicitadoNombre": "Usuario Editor",
      "datos": { /* copia de lo que se quiere borrar */ },
      "estado": "pendiente",  // pendiente | aprobada | rechazada
      "aprobadoUid": null,
      "motivo": "...",
      "fecha": 1720000000000
    },
    ...
  },
  
  // ALMACENAMIENTO TEMPORAL (PDFs de facturas por mail)
  "temp-pdf": {
    "<docId>": {
      "data": "data:application/pdf;base64,JVBERi0xLjc...",  // PDF embebido
      "email": "destinatario@email.com",
      "factura": "00000123",
      "fecha": "2024-07-02",
      "expiracion": 1720086400000  // 24 horas después
    },
    ...
  }
}
```

### Notas sobre el modelo

- **Multiempresa/multiproyecto:** ruta base `empresas/<id>/proyectos/<id>` permite múltiples contextos
- **Moneda mixta:** ARS y USD coexisten en efectivo, bancos, transacciones (con cotización USD en `tipoCambio`)
- **Anti-duplicados:** movimientos bancarios usan `impExtClave` para evitar registrar dos veces el mismo
- **Migración automática:** datos viejos en `dashboardPagos` se copian automáticamente a `empresas/.../proyectos/...`
- **Datos globales:** `proveedores`, `grupos`, `facturasARCA`, `compRecibidos` se comparten entre todas las empresas (evaluar si es correcto para multicliente)
- **Permisos en cliente:** roles guardados en `roles/<uid>` se cargan en memoria y se aplican en JS (cosmético — faltan reglas en Firebase)

---

## Matriz de seguridad

### Estado actual vs. Requerimientos por riesgo

| # | Riesgo | Severidad | Hoy | Requerimiento | ETA |
|---|--------|-----------|-----|---------------|-----|
| **1** | Backend sin autenticación → emitir facturas ARCA | 🔴 CRÍTICO | ❌ Abierto | API token + verificar ID token Firebase | Sprint 1 |
| **2** | Permisos solo en cliente + reglas Firebase permisivas | 🔴 CRÍTICO | ❌ `.write: auth != null` | Reglas reales (ver abajo) + default `deny` | Sprint 1 |
| **3** | PDFs de facturas públicos (`temp-pdf/.read: true`) | 🟠 ALTO | ⚠️ Parcial | Expiración + UUIDs largos + Storage firmado | Sprint 2 |
| **4** | Sin validación de inputs en backend | 🟡 MEDIO | ❌ Confía en JS | Validación de rangos, tipos, IVA (schemas) | Sprint 2 |
| **5** | Datos compartidos globalmente (proveedores, grupos) | 🟡 MEDIO | ⚠️ Por diseño | Evaluar si es multicliente real; si sí, mover bajo empresa | Sprint 3 |
| **6** | Secretos hardcodeados (EmailJS, Google) | 🟢 BAJO | ⚠️ Parcial | EmailJS key ya es pública; evaluar restricción por dominio | Sprint 3 |
| **7** | XSS almacenado (texto libre sin escapar) | 🟡 MEDIO | ✅ Fijo en Desarrollos/Aportantes; pendiente resto | Extender `escHtml()` incremental | Sprint 2/3 |
| **8** | Datos financieros a Google Gemini | 🟢 BAJO | ✅ Mitigation truncada | Acotar campos si confidencialidad crítica | Evaluar |

### Reglas reales propuestas para Firebase

```json
{
  "rules": {
    "roles": {
      ".read": "auth != null",
      "$uid": {
        ".write": "root.child('roles').child(auth.uid).val() === 'superadmin'"
      }
    },
    "usuarios": {
      ".read": "root.child('roles').child(auth.uid).val() === 'superadmin'",
      ".write": "root.child('roles').child(auth.uid).val() === 'superadmin'"
    },
    "empresas": {
      ".read": "auth != null",
      ".write": "root.child('roles').child(auth.uid).val() === 'superadmin' || root.child('roles').child(auth.uid).val() === 'admin' || root.child('roles').child(auth.uid).val() === 'editor'"
    },
    "global": {
      ".read": "auth != null",
      ".write": "root.child('roles').child(auth.uid).val() !== 'lector'"
    },
    "solicitudesBorrado": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "temp-pdf": {
      "$docId": {
        ".read": true,
        ".write": "auth != null"
      }
    },
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

**Mejoras futuras:**
- Restringir cada empresa a sus usuarios autorizados (lista de `uid` por empresa)
- Implementar versionado de cambios (audit trail)
- Sincronizar roles en servidor con reglas (no confiar en solo cliente)

---

## Checklist operativo

### Antes de pasar a PRODUCCIÓN con backend ARCA real

- [ ] **Seguridad backend:**
  - [ ] Cargar `APP_API_TOKEN` en Railway (valor largo y secreto)
  - [ ] Frontend: cargar ese token en el modal de configuración
  - [ ] Validar que `X-App-Token` se envía en todas las llamadas al backend
  - [ ] Configurar `ALLOWED_ORIGINS` en Railway si se necesita CORS restringido

- [ ] **Reglas Firebase:**
  - [ ] Publicar reglas reales (ver matriz de seguridad arriba)
  - [ ] Verificar que `roles/<uid>` tiene valor `superadmin` antes de publicar
  - [ ] Test: intentar escalar privilegios desde consola → debe fallar

- [ ] **Validación backend:**
  - [ ] Agregar checks de rango (monto > 0, CUIT válido, fecha válida)
  - [ ] Implementar rate limiting (`express-rate-limit`)
  - [ ] Loguear intentos fallidos (sin datos sensibles)

- [ ] **Integraciones:**
  - [ ] ARCA: cargar `AFIP_CUIT`, `AFIP_CERT` (base64), `AFIP_KEY` (base64), `AFIP_ENV=production`
  - [ ] ARCA: generar certificado digital real ante AFIP (no sandbox)
  - [ ] ARCA SDK: cargar `AFIP_SDK_TOKEN`, `ARCA_USER`, `ARCA_PASS` para importar comprobantes
  - [ ] Belvo (opcional): cargar `BELVO_SECRET_ID`, `BELVO_SECRET_PASSWORD`, `BELVO_ENV=production`
  - [ ] Prometeo (Plan B, recomendado para AR): cargar `PROMETEO_API_KEY`, `PROMETEO_ENV=production`

- [ ] **Documentos adjuntos:**
  - [ ] Publicar regla `temp-pdf` en Firebase (permitir lectura pública con expiración)
  - [ ] Configurar Cloud Function para borrar PDFs viejos (> 24 h) — **FALTA implementar**

- [ ] **Monitoreo:**
  - [ ] Configurar logs en Railway (stderr/stdout)
  - [ ] Alertas en `/diag` para estado de ARCA, Belvo, Prometeo
  - [ ] Backup de Firebase (scheduled daily)

### Antes de usar en multicliente

- [ ] Evaluar si datos globales (proveedores, grupos) deben estar separados por empresa
- [ ] Implementar aislamiento por empresa en reglas Firebase
- [ ] Auditoría de código (especialmente XSS — extender `escHtml()` al resto del archivo)
- [ ] Test de penetración del backend (alguien intenta emitir sin token, CUIT inválido, etc.)

---

## Troubleshooting

### La app no carga / Firebase Auth no funciona

**Síntoma:** overlay de login se queda visible, no pide contraseña.

**Diagnóstico:**
```javascript
// En consola del navegador:
console.log(firebase.auth().currentUser);  // debe ser null si no autenticado
firebase.auth().onAuthStateChanged(u => console.log('Auth:', u));  // log del estado
```

**Causas posibles:**
- `firebaseConfig` incorrecto en `index.html` (verificar proyecto Firebase)
- Reglas de Firebase permiten lectura pero no autenticación
- Caché del navegador — limpiar y recargar (Ctrl+Shift+Delete)

**Solución:**
- Verificar que el proyecto Firebase `modo-prueba-bb8c2` esté activo
- Revisar `firebaseConfig` con valores de Firebase Console
- Registrar un usuario en Firebase Auth (email/contraseña o Google)

---

### Backend no responde / `/diag` devuelve error

**Síntoma:** "Cannot reach backend" o error 500 en `/afip`.

**Diagnóstico:**
```bash
# Verificar que Railway esté activo:
curl https://mi-app-production-e1cd.up.railway.app/

# Ver logs en Railway:
# (consola Railway → servicio → Logs → ver últimos errores)
```

**Causas posibles:**
- Railway servicio detenido o crashing
- Variables ENV no cargadas (`AFIP_CERT`, `AFIP_KEY`)
- Certificado/clave inválidos (formato base64 corrupto)
- Error en lógica de ARCA

**Solución:**
- Railway: revisar logs de stderr
- Verificar que `AFIP_CERT` y `AFIP_KEY` sean base64 válido (no PEM crudo con saltos reales)
- Probar localmente: `cd functions && npm start` y ejecutar `curl http://localhost:3000/diag`

---

### "Falta configurar credenciales" (Belvo / Prometeo / ARCA SDK)

**Síntoma:** botón "⚡ Importar automático" muestra "Falta configurar..."

**Diagnóstico:**
```javascript
// En consola:
fetch('https://mi-app-production-e1cd.up.railway.app/diag').then(r => r.json()).then(console.log);
```

Busca la sección relevante (`afip.recibidos`, `belvo`, `prometeo`) y verifica qué ENV vars faltan.

**Solución:**
- Railway → servicio → Variables: cargar las que faltan (ver tabla en [Capa 3](#capa-3-backend-functionsserverjs))
- Para ARCA SDK: registrarse en https://app.afipsdk.com, copiar el Access Token y cargar como `AFIP_SDK_TOKEN`
- Para Belvo: registrarse en https://dashboard.belvo.com/, generar API keys y cargar `BELVO_SECRET_ID` + `BELVO_SECRET_PASSWORD`
- Verificar nuevamente en `/diag`

---

### Cambio empresa/proyecto pero datos se mezclan

**Síntoma:** al cambiar de contexto, se ven datos de la empresa anterior.

**Diagnóstico:**
- Revisar que `actualizarRefs()` reasigna todas las referencias (10+)
- Verificar que `cargarDatos()` desasciende los listeners viejos antes de instalar nuevos

**Solución:**
```javascript
// En `actualizarRefs()`:
// Agregar antes de reasignar:
// REF_DATOS?.off();  // Desasciende listener viejo
// Luego:
REF_DATOS = db.ref(`${getBasePath()}/datos`);  // Nueva referencia
```

---

### XSS (ejecución de JS malicioso)

**Síntoma:** un campo de texto muestra `<img src=x onerror=alert('xss')>` como código ejecutado (popup).

**Verificación:**
- Módulos **Desarrollos** + **Aportantes/Socios:** ✅ ya están protegidos con `escHtml()`
- Otros módulos: ❌ pendiente de revisión

**Solución para módulos nuevos:**
```javascript
// En lugar de:
html += `<td>${nombre}</td>`;

// Usar:
html += `<td>${escHtml(nombre)}</td>`;

// Donde escHtml() escapa & < > " '
function escHtml(s) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
  return String(s).replace(/[&<>"']/g, c => map[c]);
}
```

---

*Documento actualizado 2026-07-02. Para cambios, editar este archivo y actualizar changelog arriba.*
