# Pendientes

> Última actualización: 2026-07-01. Todo el código está mergeado en `main` y
> desplegado (frontend en GitHub Pages, backend en Railway). Lo que queda en su
> mayoría son **pasos de configuración** (cargar credenciales), no código.

---

## 🔜 PRÓXIMO (mañana): Cargar credenciales de ARCA SDK en Railway

El código de **importación automática de comprobantes** (emitidos y recibidos)
ya está listo y mergeado. Los botones **⚡ Importar automático** hoy muestran:

> ❌ Falta configurar las credenciales en el servidor (Railway): `AFIP_SDK_TOKEN`, `ARCA_USER` y `ARCA_PASS`.

Eso es **esperado**: faltan cargar 3 variables en Railway. Pasos:

1. **Crear cuenta en AFIP SDK** → https://app.afipsdk.com
   (tiene 14 días de prueba gratis; después es pago). Copiar el **Access Token**
   del dashboard.
2. En **Railway** → proyecto → servicio → pestaña **Variables**, agregar:

   | Variable | Valor |
   |---|---|
   | `AFIP_SDK_TOKEN` | El access token de afipsdk.com |
   | `ARCA_USER` | CUIT `30716812452` (o el usuario de clave fiscal) |
   | `ARCA_PASS` | La contraseña de clave fiscal ARCA/AFIP |

   > Nota: si no se carga `ARCA_USER`, el backend usa `AFIP_CUIT` como usuario.
   > Igual conviene cargarla explícita. `AFIP_SDK_TOKEN` puede reutilizar
   > `AFIP_ACCESS_TOKEN` si ya está cargado.

3. Railway reinicia solo al guardar. **Verificar** en:
   `https://mi-app-production-e1cd.up.railway.app/diag`
   → buscar el bloque `recibidos` y confirmar:

   ```json
   "recibidos": {
     "sdkTokenCargado": true,
     "arcaUserCargado": true,
     "arcaPassCargada": true,
     "listoParaUsar": true
   }
   ```

4. Con `listoParaUsar: true`, los botones **⚡ Importar automático** funcionan en
   **Comprobantes Emitidos** y **Comprobantes Recibidos**.

**Por qué hace falta esto:** el web service gratis de ARCA (WSFEv1, por
certificado) solo ve los comprobantes **emitidos por puntos de venta habilitados
para web service**. Los hechos a mano en el portal (y TODOS los recibidos de
proveedores) solo se leen entrando al portal con clave fiscal — eso lo hace la
automatización "mis-comprobantes" de AFIP SDK, que necesita estas credenciales.

Backend: `misComprobantes(tipo, desde, hasta)` en `functions/server.js` (~línea
159), endpoints `GET /afip/emitidos` (`t='E'`) y `GET /afip/recibidos` (`t='R'`).

> ⚠️ **Seguridad:** la clave fiscal en Railway queda encriptada en reposo, pero
> quien tenga acceso al proyecto de Railway podría verla. Si preocupa, crear un
> usuario ARCA secundario con permisos acotados.

---

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

> ⚠️ **Belvo NO cubre Argentina** (solo MX/BR/CO/CL). Para AR ver Plan B abajo.

**Plan B — Prometeo (backend listo, falta UI):** soporta Argentina. Endpoints en
`functions/server.js`: `/prometeo/diag`, `/prometeo/providers`, `/prometeo/login`,
`/prometeo/accounts`, `/prometeo/movements`, `/prometeo/logout`. Variables:
`PROMETEO_API_KEY`, `PROMETEO_ENV=sandbox`. Prometeo usa login directo
(usuario/clave del banco) en vez de widget, así que falta sumar un formulario en la app
si se decide usar este camino.

---

## 🔜 Leer movimientos del banco desde Gmail (gratis + automático)

Alternativa para tener los movimientos del Santander real **sin costo** (Belvo
producción cuesta). La app YA lee Gmail (scope `gmail.readonly`, ver
`abrirImportarGmail` / `buscarEmailsConPDF` ~línea 9288). Plan: botón
"📧 Leer movimientos del banco" que busca los mails de aviso de Santander,
parsea fecha/monto/ingreso-egreso/concepto y carga los movimientos con el mismo
anti-duplicados del importador de extracto (`impExtClave`).

**FALTA para programarlo:** el usuario va a pasar **1-2 mails de ejemplo** del
Santander (uno de ingreso y uno de egreso) — remitente, asunto y cuerpo — para
escribir el parser a medida. Sin el ejemplo real no se puede hacer fiable.

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

---

# ✅ Hecho

## ✅ Sesión 2026-07-01: Aportantes/Socios, Desarrollos Inmobiliarios y consolidación

- **Módulo nuevo — Desarrollos Inmobiliarios:** tab propia en el sidebar (debajo de
  "Inicio") con galería de tarjetas (una por desarrollo) y ficha de detalle al
  hacer click: m² totales/vendibles, valor de terreno, costos, valor de venta
  por m², ganancia estimada, y la lista de aportantes/socios vinculados a ese
  desarrollo. Alta/edición/borrado dentro de la misma tab (sin modal). Datos en
  `REF_DESARROLLOS` (`…/desarrollos`).
- **Módulo nuevo — Aportantes / Socios** (tab "Inversiones" del submenú
  Ingresos): registro de capital aportado por cada inversor/socio, vinculado a
  un desarrollo, con rentabilidad pactada como % (sobre valor de venta total,
  ganancia estimada, terreno o costo de obra) o como m² a un valor fijo.
  Cálculo automático de la rentabilidad estimada en $. Datos en
  `REF_APORTANTES` (`…/aportantes`).
- **Gráficos (Chart.js):** en la galería, comparativa de "Incidencia del
  Terreno" ($/m² vendible) y "Terreno como % del Costo Total" entre todos los
  desarrollos; en la ficha de cada desarrollo, "Participación de Aportantes"
  (torta) y "Ganancia Estimada vs. Rentabilidad Comprometida".
- **Asistente RK responde sobre datos reales:** `rkResumenDatosApp()` arma un
  resumen de aportantes, desarrollos, alquileres, cuentas bancarias,
  proveedores y ventas del proyecto activo y lo agrega al *system prompt* de
  Gemini, para que el asistente pueda responder preguntas concretas
  ("¿cuánto aportó Juan Pérez?") con datos reales.
- **Fixes de esta sesión:** botón "Cargar en Facturas" del Asistente RK que no
  abría el formulario (typo en el nombre de función); movimientos bancarios
  mezclados con caja en Efectivo Pesos/Dólares (faltaba filtro `esBancario`).
- **Consolidación y seguridad:** se agregó `escHtml()` y se aplicó a los
  campos de texto libre (`nombre`, `obs`) del módulo nuevo, que se insertaban
  sin escapar en `innerHTML` (XSS almacenado — verificado con un payload de
  prueba). Se corrigió el gráfico de participación de aportantes, que sumaba
  capital de distintas monedas como si fueran la misma. Ver `SECURITY.md`
  puntos 7 y 8 para el detalle y lo que queda pendiente (extender el escape
  al resto del archivo; acotar qué datos financieros ve el Asistente RK).

## ✅ Sesión 2026-06-28: comprobantes ARCA, exportación e impresión

- **Importar automático (mis-comprobantes):** botones **⚡ Importar automático** en
  Comprobantes **Emitidos** y **Recibidos**. Traen TODO desde el portal ARCA con
  clave fiscal (incluidos los emitidos a mano que el web service no ve). Backend:
  `/afip/emitidos`, `/afip/recibidos`. **Falta cargar credenciales en Railway**
  (ver sección PRÓXIMO arriba).
- **Comprobantes Recibidos:** sección nueva (submenú Egresos) con importación por
  Excel, importación automática, exportación a Excel y filtros de fecha. Datos en
  `global/compRecibidos`.
- **Exportar comprobantes emitidos a Excel:** botón ⬇️ en Comprobantes Emitidos
  (respeta el filtro de fechas). Datos en `global/facturasARCA`.
- **Exportar reportes contables a Excel:** IVA Ventas / IVA Compras / Retenciones /
  todo, desde la sección Reportes (`rptExportar`).
- **Comprobante emitido con formato oficial AFIP:** rediseño de `imprimirFacturaARCA`
  (cabecera ORIGINAL, badge de letra, datos fiscales, tabla de ítems, totales, CAE).
- **Recibos y órdenes de pago profesionales:** CSS y cabecera compartidas
  (`_rCSS()`, `buildReciboHeader()`) para los 3 documentos imprimibles.
- **Nº de comprobante en Registrar Pago.**
- **Docs:** README, CLAUDE.md, SECURITY.md actualizados.

## ✅ Facturación electrónica ARCA (emisión, funcionando)

- Backend Express en Railway (`functions/server.js`) con `@afipsdk/afip.js`.
- Certificado generado y autorizado para wsfe; emite CAE real (punto de venta **3**, RI).
- Variables en Railway: `AFIP_CUIT`, `AFIP_CERT` (base64), `AFIP_KEY` (base64), `AFIP_ENV=production`, `AFIP_ACCESS_TOKEN`.
- URL backend conectada en la app: `localStorage rk_afip_function_url`.
- En **Ingresos → Resumen Ingresos**: botón "📄 Emitir Factura ARCA" y "📒 Comprobantes emitidos" (lista + comprobante imprimible con "🔍 Ver").
- Diagnóstico: `GET <url>/diag` muestra puntos de venta y estado de ARCA.

## ✅ Limpieza de código

- **IDs duplicados:** el input de "Cobrado hasta ahora" se renombró a `srvCobradoInput`;
  la tarjeta de display conserva `id="srvCobrado"`. Antes `getElementById` tomaba el div
  (primero en el DOM) y las lecturas de `.value` devolvían `undefined`, por lo que el
  monto cobrado de un servicio se guardaba como 0. Corregido.
- **Funciones duplicadas:** se borraron las versiones viejas (código muerto de refactors
  previos) de `agregarEmpresa`, `agregarProyecto`, `pagarFactura`,
  `abrirHistorialPagosPresupuesto` y `abrirHistorialPagosFactura`. Quedan solo las versiones
  activas (más abajo en el archivo).
