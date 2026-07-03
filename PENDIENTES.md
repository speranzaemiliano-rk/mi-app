# Pendientes

> Última actualización: 2026-07-03. Todo el código está mergeado en `main` y
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

## ✅ Sesión 2026-07-03: Pizarrón de Tareas por proyecto + Asistente RK más completo

- **Pizarrón de Tareas ya no se comparte:** antes vivía en `global/tareas`
  (compartido por TODOS). Pasó primero a ser por empresa
  (`empresas/<id>/tareas`) y en la misma sesión se ajustó a **por proyecto**
  (`empresas/<id>/proyectos/<id>/tareas`, mismo `getBasePath()` que el resto
  de los datos), a pedido del usuario. Migración automática en cascada
  (global → empresa → proyecto activo) la primera vez que carga cada
  proyecto, sin perder tareas viejas.
- **Pizarrón — editar tarea:** el widget solo dejaba crear/completar/eliminar/
  mandar recordatorio; faltaba poder editar una tarea ya cargada. Se agregó
  botón ✏️ que reabre el modal "Nueva Tarea" en modo edición (reutiliza
  `abrirModalTarea`/`guardarTarea` con `editandoTareaIndex`).
- **Asistente RK — deja de ser solo "de la app":** el system prompt ahora lo
  habilita a responder cualquier pregunta (conocimiento general, cálculos,
  consejos, etc.), no solo temas del sistema.
- **Asistente RK — más inteligente:** `gemini-2.5-pro` como modelo primario
  del chat, con fallback automático a los `flash` si falla por cuota/
  saturación. Detecta específicamente el error de API key inválida/revocada
  y corta el reintento en vano, mostrando el link para generar una key
  nueva.
- **Asistente RK — búsqueda en Google (grounding):** tool `google_search`
  habilitado en el chat para responder preguntas de info actual (resultados
  deportivos, cotizaciones, noticias, clima, etc.) en vez de decir que no
  tiene acceso a internet.
- **Asistente RK — reconoce las empresas del sistema:** el system prompt
  incluye ahora la lista completa de empresas y proyectos dados de alta (no
  solo los datos del proyecto activo).
- **Asistente RK — audio a tareas:** nuevo botón 🎤 en el chat para adjuntar
  un audio (ej. nota de voz de WhatsApp exportada como archivo). Gemini lo
  transcribe y extrae las tareas/pendientes mencionados; se abre un modal de
  revisión donde cada tarea es editable (título, responsable, fecha), se
  pueden quitar o agregar filas a mano, y hay selector de empresa **y**
  proyecto destino antes de cargarlas — nunca se cargan directo sin revisar.
- **Asistente RK — dar de alta un proveedor:** dos caminos, los dos abren el
  formulario real de Proveedores precargado (nunca guarda solo):
  1. Charlando: si el usuario pide cargar un proveedor, el asistente
     pregunta los datos de a uno (razón social, CUIT, condición de IVA,
     rubro, teléfono, dirección, email) usando un marcador interno
     (`###PROVEEDOR_LISTO:{...}###`) que no se le muestra al usuario.
  2. Con PDF: la extracción que ya existía para facturas (adjuntar PDF en el
     chat) ahora también reconoce constancias de inscripción/CUIT de AFIP y
     ofrece "Cargar como proveedor".
- **Pendiente de confirmar con el usuario:** reportó que el botón ✏️ de
  editar tarea "no aparece" después de mergeado — el código está verificado
  en `main` (mismo guard `puedeEditar` que el botón 🗑, que sí le
  funcionaba), así que probablemente sea caché del navegador/PWA. Se le
  pidió hacer hard refresh / cerrar y reabrir la app. **Falta confirmar que
  lo solucionó.**

## ✅ Sesión 2026-07-02: Ventas → Desarrollos + m² + costo de construcción

- **Ventas vinculadas a Desarrollos:** nuevo select en el modal de UF/Venta
  para asociar la venta a un Desarrollo Inmobiliario (`desarrolloId`). Campos
  **m² de la unidad** y **m² de amenities** por venta. Display en tiempo real
  de los **m² vendibles restantes** del desarrollo (descuenta lo asignado a
  otras ventas; se muestra en rojo si se supera el límite).
- **Tabla de Ventas:** muestra el nombre del desarrollo vinculado y los m²
  totales de la UF como línea secundaria bajo el código de UF.
- **Costo por m² de construcción en Desarrollos:** nuevo campo
  `costoM2Construccion` en el formulario; se multiplica por *m² Totales* y
  auto-completa el campo **Costo de Obra**. El campo **Costo Total**
  (Terreno + Obra) se actualiza en tiempo real como lectura.
- **Ficha de Desarrollos:** nuevas tarjetas de estadísticas **m² Vendidos**,
  **m² Disponibles** (dinámico según ventas vinculadas), **Costo m²
  Construcción** y **Costo Total**.

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
