# Pendientes

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
