# Pendientes

## 🟡 EN CURSO: Conexión automática con el banco (Belvo) — falta cargar keys

El **código ya está listo** (backend + app). Solo falta que el titular cree la cuenta
en Belvo y cargue las credenciales en Railway. Pasos:

1. Registrarse en https://dashboard.belvo.com/ (arranca en modo **sandbox**, gratis).
2. En **Settings → API Keys** generar una key. Copiar el **Secret Key ID** y el
   **Secret Key Password** (el password se muestra una sola vez).
3. En Railway (mismo servicio que ARCA) cargar las variables:
   - `BELVO_SECRET_ID`
   - `BELVO_SECRET_PASSWORD`
   - `BELVO_ENV=sandbox`  (después `production`)
4. En la app, en **Cuentas Bancarias → Extracto**, elegir la cuenta en el filtro y tocar
   **🔗 Conectar banco** (la primera vez pide la URL del backend de Railway). Luego
   **🔄 Sincronizar** trae los movimientos (con anti-duplicados).

Backend: endpoints `/belvo/diag`, `/belvo/widget-token`, `/belvo/accounts`,
`/belvo/transactions` en `functions/server.js`. App: widget `cdn.belvo.io`, funciones
`belvoConectar()` / `belvoSincronizar()`.

**Plan B — Prometeo (backend listo, falta UI):** alternativa por si Belvo pide requisitos
de empresa. Endpoints en `functions/server.js`: `/prometeo/diag`, `/prometeo/providers`,
`/prometeo/login`, `/prometeo/accounts`, `/prometeo/movements`, `/prometeo/logout`.
Variables: `PROMETEO_API_KEY`, `PROMETEO_ENV=sandbox`. Prometeo usa login directo
(usuario/clave del banco) en vez de widget, así que falta sumar un formulario en la app
si se decide usar este camino (se hace cuando se elija proveedor).

## ✅ HECHO: Facturación electrónica ARCA (funcionando)

- Backend Express en Railway (`functions/server.js`) con `@afipsdk/afip.js`.
- Certificado generado y autorizado para wsfe; emite CAE real (punto de venta **3**, RI).
- Variables en Railway: `AFIP_CUIT`, `AFIP_CERT` (base64), `AFIP_KEY` (base64), `AFIP_ENV=production`, `AFIP_ACCESS_TOKEN`.
- URL backend conectada en la app: `localStorage rk_afip_function_url`.
- En **Ingresos → Resumen Ingresos**: botón "📄 Emitir Factura ARCA" y "📒 Facturas emitidas" (lista + comprobante imprimible con "🔍 Ver").
- Diagnóstico: `GET <url>/diag` muestra puntos de venta y estado de ARCA.

## ✅ HECHO: limpieza de código

- **IDs duplicados:** el input de "Cobrado hasta ahora" se renombró a `srvCobradoInput`;
  la tarjeta de display conserva `id="srvCobrado"`. Antes `getElementById` tomaba el div
  (primero en el DOM) y las lecturas de `.value` devolvían `undefined`, por lo que el
  monto cobrado de un servicio se guardaba como 0. Corregido.
- **Funciones duplicadas:** se borraron las versiones viejas (código muerto de refactors
  previos) de `agregarEmpresa`, `agregarProyecto`, `pagarFactura`,
  `abrirHistorialPagosPresupuesto` y `abrirHistorialPagosFactura`. Quedan solo las versiones
  activas (más abajo en el archivo).


## 🔜 Para mañana: Módulo de facturación electrónica con ARCA

Crear un módulo para **emitir facturas electrónicas** conectándose directo a ARCA (ex-AFIP).

**Importante a tener en cuenta:** ARCA NO permite conectarse desde una página web sola
(como es la app hoy, que vive en GitHub Pages). Necesita un **certificado digital** del
contribuyente y una **pieza de servidor (backend)** por seguridad — la clave privada no
puede estar en el navegador.

**Dos caminos a evaluar:**

1. **Directo (web services de ARCA):** usar WSAA (autenticación) + WSFEv1 (facturación
   electrónica). Es gratis, pero hay que generar un certificado en ARCA con el CUIT y
   montar un backend chico (ej: una función serverless).
2. **Intermediario (más fácil):** usar un servicio tipo **AFIP SDK** (afipsdk.com) o
   **TusFacturas API** que simplifica toda la conexión. Más simple de implementar, a
   veces con un costo chico.

**Tener a mano para arrancar:** CUIT + acceso a ARCA con Clave Fiscal.

---

## ⚠️ Pendiente menor: último paso del envío de factura por mail (PDF)

El envío de factura por mail **funciona al 99%**. Lo único que falta es **UN clic en la
consola de Firebase** para que quien recibe el mail pueda descargar el PDF (hoy da
"Sin permiso de descarga").

**Pasos (30 segundos):**

1. Entrar a:
   https://console.firebase.google.com/project/modo-prueba-bb8c2/database/modo-prueba-bb8c2-default-rtdb/rules
2. Borrar todo el texto del recuadro y pegar esto:

   ```json
   {
     "rules": {
       "temp-pdf": { "$docId": { ".read": true, ".write": "auth != null" } },
       ".read": "auth != null",
       ".write": "auth != null"
     }
   }
   ```

3. Apretar el botón **"Publicar"**.

Después de eso, el link del PDF en el mail funciona y queda todo terminado.
