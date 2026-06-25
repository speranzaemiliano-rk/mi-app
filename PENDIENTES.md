# Pendientes

## ✅ HECHO: Facturación electrónica ARCA (funcionando)

- Backend Express en Railway (`functions/server.js`) con `@afipsdk/afip.js`.
- Certificado generado y autorizado para wsfe; emite CAE real (punto de venta **3**, RI).
- Variables en Railway: `AFIP_CUIT`, `AFIP_CERT` (base64), `AFIP_KEY` (base64), `AFIP_ENV=production`, `AFIP_ACCESS_TOKEN`.
- URL backend conectada en la app: `localStorage rk_afip_function_url`.
- En **Ingresos → Resumen Ingresos**: botón "📄 Emitir Factura ARCA" y "📒 Facturas emitidas" (lista + comprobante imprimible con "🔍 Ver").
- Diagnóstico: `GET <url>/diag` muestra puntos de venta y estado de ARCA.

## 🧹 Para revisar mañana: limpieza de código (pre-existente, no urgente)

- **IDs duplicados:** `srvCobrado` está en una tarjeta (línea ~3300) y en un input
  (línea ~15542). `getElementById` toma el primero → posible bug al leer el monto
  cobrado de un servicio. Renombrar uno de los dos.
- **Funciones duplicadas** (gana la última, las primeras son código muerto de
  refactors viejos): `agregarEmpresa`, `agregarProyecto`, `pagarFactura`,
  `abrirHistorialPagosPresupuesto`, `abrirHistorialPagosFactura`. Borrar las versiones
  viejas para evitar confusión.


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
