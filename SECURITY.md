# 🔒 Informe de seguridad — RK · Gestión Multiempresa

> Auditoría del estado actual del código (`index.html`, `functions/server.js`, configuración de Firebase). Este documento describe riesgos y **cómo blindar** el sistema. No incluye valores de credenciales en vivo. Prioridad: **CRÍTICO → ALTO → MEDIO → BAJO**.

## Resumen ejecutivo

El sistema tiene una arquitectura razonable (los certificados ARCA viven en el backend, no en el navegador). Los puntos críticos originales (reglas de Firebase abiertas, backend sin autenticación) ya están **mitigados**: hay reglas de Firebase por rol publicadas y el backend exige token compartido o sesión de Firebase válida. Lo que sigue débil es que **ningún endpoint del backend distingue rol** más allá de `/usuarios/*` — cualquier usuario autenticado de la app, sea cual sea su rol, puede llamar a los endpoints sensibles (emitir facturas ARCA, open banking, Gemini). Ver tabla y C4 abajo.

| # | Severidad | Problema | Estado |
|---|---|---|---|
| 1 | 🔴 CRÍTICO | Backend sin autenticación + CORS abierto a cualquier origen | ✅ Código listo (acepta `X-App-Token` o idToken de Firebase, ver C4 abajo) — confirmar que Railway tenga el deploy más reciente |
| 1b | 🔴 CRÍTICO | Endpoints `/usuarios/*` sin verificación de rol (escalada a superadmin vía backend) | ✅ **Corregido** — exigen idToken de superadmin (falta redeploy Railway) |
| 2 | 🔴 CRÍTICO | Permisos solo en el cliente + reglas de Firebase demasiado abiertas (escalada a superadmin) | ✅ **Reglas por rol publicadas** en Firebase Console (confirmado por el usuario) |
| 2b | 🔴 CRÍTICO | El banner in-app sugería pegar reglas ABIERTAS (revertía las reglas por rol) | ✅ **Corregido** — el banner ya no sugiere reglas abiertas |
| 3 | 🟠 ALTO | PDFs de facturas con lectura pública (`temp-pdf`, `.read: true`) | Pendiente |
| 4 | 🟡 MEDIO | Sin validación de inputs en el backend | ✅ Rate limiting agregado — falta validar rangos/tipos de inputs |
| 5 | 🟡 MEDIO | Datos compartidos globalmente entre empresas (proveedores, grupos) | A evaluar |
| 6 | 🟢 BAJO | Secretos hardcodeados en el frontend (EmailJS, email admin) | A evaluar |
| 7 | 🟡 MEDIO | XSS almacenado: texto libre insertado en `innerHTML` sin escapar | ✅ Corregido en Desarrollos/Aportantes — resto del código sin auditar |
| 8 | 🟢 BAJO | El Asistente RK envía un resumen de datos financieros a la API de Google Gemini en cada consulta | Por diseño — evaluar alcance |
| 9 | 🟠 ALTO | Concurrencia: dos usuarios en paralelo podían pisarse los cambios (lost-update) | ✅ **Migrado completo** — las 18 colecciones con guardado por-diff keyed-by-id |

### C2 (endpoints de usuarios) y C3 (backend fail-open) — hallazgos de auditoría 2026-07-17
- **C2:** ✅ **Corregido en código.** Los endpoints `/usuarios/*` ahora usan `requireSuperadmin(req,res)`, que exige `Authorization: Bearer <idToken>` de Firebase, lo verifica con Admin SDK y comprueba `roles/<uid> === 'superadmin'`. El frontend (`_fetchBackend`) ahora envía el idToken en todas las llamadas al backend. Sin idToken de superadmin → `401/403`. Corta la escalada de privilegios vía backend. *(Requiere **redeploy del backend en Railway** para tomar efecto; el front se despliega solo por GitHub Pages.)*
- **C3:** el backend queda **abierto** si falta `APP_API_TOKEN` en Railway (modo compatibilidad), y el token se guarda en `global/config/appToken`, legible por cualquier usuario autenticado. **Recomendación (deploy manual):** setear `APP_API_TOKEN` en Railway. Nota: la gestión de usuarios (C2) ya no depende solo de ese token — exige idToken de superadmin aunque el token compartido falte o se filtre. Se agregó también **rate limiting** en memoria (configurable con `RATE_LIMIT_MAX`/`RATE_LIMIT_WINDOW_MS`).
- **C4 (2026-07-20, hallazgo de esta consolidación):** el middleware global del backend ahora acepta, además del `X-App-Token`, un **idToken de Firebase válido** (`Authorization: Bearer <idToken>`, cualquier usuario logueado en la app) — se agregó porque el token compartido a veces no coincidía entre dispositivos y dejaba el Asistente RK sin funcionar. **Análisis de superficie de exposición:** esto NO amplía quién puede llegar al backend. `global/config/appToken` (donde vive el token compartido) ya tenía `.read: auth != null` en `database.rules.json` — **cualquier usuario autenticado, incluido rol `lector`, ya podía leer ese token directo desde Firebase** (consola del navegador) y llamar al backend sin pasar por la UI. El idToken solo formaliza un camino que técnicamente ya existía. **Sí importa para el futuro:** ningún endpoint del backend (salvo `/usuarios/*`) distingue el ROL del usuario — un `lector` autenticado puede, hoy, emitir una factura real con `POST /afip` igual que un `superadmin`. Es la misma debilidad ya documentada en el punto 2 ("permisos solo en el cliente"), no algo nuevo introducido por el idToken. Si se necesita restringir `/afip` (y otros endpoints sensibles) a roles `admin`/`editor`, hay que agregar un chequeo de rol tipo `requireSuperadmin` pero para esos roles — no está hecho todavía.

---

## 🔎 Auditoría 2026-07-24 (revisión completa + foco multiempresa)

Revisión integral de cara a convertir el sistema en un producto usable por **varias empresas-cliente**. Ver también **`MULTIEMPRESA.md`** (modelo multiusuario, APIs compartidas vs propias, plan de white-label).

**✅ Corregido en esta consolidación (código):**
- **XSS almacenado en las tablas principales:** se escapó con `escHtml()` el texto libre (proveedor, concepto, descripción, rubro/subrubro, número) en las tablas de **Presupuestos** (`index.html:6725-6727`), **Facturas** (`14859-14861`), **Comprobantes/Documentos** (`17077-17079`), **Presupuestos por proveedor** (`12061`) y **Proveedores** (`15366`). Antes, un `editor` podía guardar un proveedor con `<img src=x onerror=...>` y el script corría en la sesión del superadmin (escalada de privilegios).
  - ⚠️ **Falta una pasada COMPLETA:** `escHtml` se usa de forma inconsistente en el resto del archivo (~33k líneas). Quedan otros `innerHTML` con datos de usuario sin escapar por auditar/corregir.
- **Higiene multiusuario en el navegador:** al **cambiar de usuario** en el mismo dispositivo o al **cerrar sesión**, se limpian el **historial del asistente** (`rk_chat_memoria`) y la **sesión de Spotify** (`rk_sp_*`) — antes quedaban en localStorage y el siguiente usuario los veía (`_limpiarDatosSensiblesDispositivo()`).

**🔴/🟠 Confirmado pendiente (requiere pasos en consola / desarrollo):**
- **C1 — Secretos legibles por todos:** `database.rules.json:25-28` (`global` con `.read: auth != null`). `global/config/appToken` y `global/config/geminiKey` los lee cualquier autenticado (incluso `lector`).
- **C2 — Backend sin control de rol:** ✅ **Corregido en código (2026-07-24).** Se agregó `requireRol(req,res,ROL_OPERADOR)` (`functions/server.js`) que exige rol `superadmin`/`admin`/`editor` (NO `lector`) en los endpoints sensibles: `POST /afip` (emitir), `/afip/importar`, `/afip/recibidos`, `/afip/emitidos`, `/afip/robot/*`, `/belvo/widget-token|accounts|transactions`, `/prometeo/login|accounts|movements`, `POST /whatsapp/send`. El **asistente (`/gemini`, `/ia/groq`) queda abierto a todos los roles** a propósito. El control se activa cuando hay identidad verificable (idToken con service account) o token compartido; sin `APP_API_TOKEN` ni service account sigue en modo compatibilidad (permite y avisa en log) para no romper. **Falta (vos):** redeploy en Railway + `FIREBASE_SERVICE_ACCOUNT_BASE64` para que el chequeo de rol tome efecto de verdad.
- **A1 — Sin aislamiento entre empresas:** `database.rules.json:20-23` (`empresas` con `.read: auth != null`). Cualquier logueado lee TODAS las empresas; un `editor` escribe cualquiera. **Es el bloqueante principal para vender a otras empresas como clientes separados.** Ver plan en `MULTIEMPRESA.md` §6.B.
- **A2 — `temp-pdf` de lectura pública:** `database.rules.json:40-44` (`.read: true`). Quien adivine un `docId` lee PDFs sin login. (Nota: se usa para compartir PDFs por link público; cerrar esto rompe esa función — decidir el trade-off.)
- **M1 — `solicitudesBorrado` escribible por cualquier autenticado** (`database.rules.json:30-33`).
- **M2 — CORS abierto por defecto** si falta `ALLOWED_ORIGINS` (`functions/server.js:90-91`).
- **M3 — Token por query string** (`functions/server.js:105`, `?token=`) puede filtrarse en logs/Referer.
- **M4 — Enumeración de roles/usuarios:** `roles` y `usuarios` con `.read: auth != null`.

**Cadena de ataque más grave:** XSS (nombre de proveedor) → corre en la sesión del superadmin → con su idToken llama a `/usuarios/rol` y se auto-promueve. Mitigado en parte al escapar las tablas principales; se cierra del todo completando la pasada de XSS + control de rol en el backend.

---

## ✅ Checklist de despliegue de seguridad (pasos que hace el administrador en su consola)

Estos pasos **no se pueden automatizar desde el código** — los tenés que hacer vos en las consolas correspondientes:

1. **Publicar las reglas de Firebase** (activa la seguridad por rol — sin esto, todo depende del cliente):
   - Firebase Console → Realtime Database → **Reglas** → pegar el contenido de `database.rules.json` → **Publicar**. O `firebase deploy --only database`.
   - ⚠️ Antes: confirmá que tu usuario tenga `roles/<tu-uid> = superadmin`.
2. **Redeploy del backend en Railway** (activa `requireSuperadmin` + rate limiting): push a la rama que Railway observa, o "Deploy" manual en Railway.
3. **Setear variables en Railway:**
   - `APP_API_TOKEN` = cadena larga y secreta → después pegala en la app (modal ARCA → "token del backend").
   - `FIREBASE_SERVICE_ACCOUNT_BASE64` = base64 del JSON de service account (necesario para verificar idToken y para `/usuarios/*`).
   - `ALLOWED_ORIGINS` = `https://speranzaemiliano-rk.github.io` (restringe CORS).
   - (Opcional) `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS` si querés ajustar el límite.
4. **EmailJS:** en el panel de EmailJS, activar restricción por **dominio permitido** para que la public key no se pueda usar desde otro sitio.

> ### ✅ Mitigaciones aplicadas en código (faltan los pasos de despliegue)
>
> **#1 — Token del backend (API token compartido):**
> - `functions/server.js` ahora exige el header `X-App-Token` en todos los endpoints (menos `/`). Sin token válido → `401`. Acepta `?token=` para abrir `/diag` en el navegador. CORS configurable con `ALLOWED_ORIGINS`.
> - El frontend envía el token en las 4 llamadas al backend; se configura en el modal de ARCA (campo "token del backend"), se guarda en el dispositivo y se respalda en `global/config/appToken`.
> - **Falta (vos):** en Railway, crear la variable `APP_API_TOKEN` con una cadena larga y secreta (y opcional `ALLOWED_ORIGINS=https://speranzaemiliano-rk.github.io`). Luego, en la app, pegar ese mismo token en el modal de ARCA. *Mientras `APP_API_TOKEN` no exista, el backend sigue abierto (modo compatibilidad, con aviso en el log).*
>
> **#2 — Reglas de Firebase (`database.rules.json`):**
> - Default `deny`; el nodo `roles` solo lo escribe un superadmin (con bootstrap del primer usuario); las escrituras de datos exigen rol `editor`/`admin`/`superadmin`.
> - **Falta (vos):** publicar las reglas — `firebase deploy --only database`, o copiar el contenido de `database.rules.json` en la consola de Firebase → Realtime Database → Reglas → Publicar.
> - ⚠️ **Antes de publicar:** confirmá que tu usuario tenga rol `superadmin` en `roles/<tu-uid>` (si ya sos super admin en la app, lo tenés). Tras publicar, los usuarios con rol `editor`/`admin`/`superadmin` siguen editando; los de solo lectura (o sin rol) quedan en lectura — igual que hoy en la interfaz.

---

## 🔴 1. Backend sin autenticación + CORS abierto

**Dónde:** `functions/server.js` línea 6 — `app.use(cors({ origin: true }))`. Ningún endpoint valida quién llama.

**Riesgo:** cualquier persona en internet que conozca (o adivine) la URL del backend en Railway puede:
- `POST /afip` → **emitir facturas electrónicas reales con tu CUIT** (CAE real ante ARCA).
- `GET /afip/importar` → leer todos tus comprobantes emitidos.
- `GET /diag` → ver tus puntos de venta y estado fiscal.
- `POST /belvo/*`, `POST /prometeo/login` → operar contra tus integraciones bancarias.

Es el riesgo más grave: afecta directamente tu situación fiscal y bancaria.

**Cómo blindarlo:**
1. **Secreto compartido (API key):** definir una variable `APP_API_TOKEN` en Railway y exigirla en cada request:
   ```js
   app.use((req, res, next) => {
     if (req.path === '/') return next(); // health check
     const t = req.get('X-App-Token');
     if (!t || t !== process.env.APP_API_TOKEN) return res.status(401).json({ error: 'No autorizado' });
     next();
   });
   ```
   El frontend envía ese token en el header (guardado junto a `rk_afip_function_url`).
2. **Mejor aún — validar el ID token de Firebase:** el frontend ya tiene usuarios autenticados. Enviar `Authorization: Bearer <idToken>` y verificarlo en el backend con `firebase-admin` (`admin.auth().verifyIdToken()`). Así solo usuarios reales de tu app pueden facturar.
3. **Restringir CORS** al dominio de la app en vez de `origin: true`:
   ```js
   app.use(cors({ origin: ['https://speranzaemiliano-rk.github.io'] }));
   ```

---

## 🔴 2. Permisos solo en el cliente + reglas de Firebase abiertas

**Dónde:** `index.html` — los roles (`esSuperAdmin`, `esAdmin`, `puedeEditar`) se calculan y aplican **solo en JavaScript** (`aplicarPermisos`). Las reglas sugeridas en `PENDIENTES.md` son:
```json
{ "rules": { ".read": "auth != null", ".write": "auth != null" } }
```

**Riesgo:** esas reglas dan a **cualquier usuario autenticado** acceso de lectura y escritura a **toda la base**. Como las restricciones de la UI son cosméticas, un usuario con conocimientos técnicos puede, desde la consola del navegador, usar el SDK de Firebase para:
- **Escalar privilegios:** `firebase.database().ref('roles/<miUid>').set('superadmin')` → se convierte en super admin.
- **Leer/editar datos de otras empresas:** `empresas/<otra>/proyectos/.../...`.
- **Aprobar o saltarse** el flujo de borrado con aprobación.

En una app multiempresa esto rompe el aislamiento entre clientes.

**Cómo blindarlo — Reglas de seguridad que apliquen los roles del lado del servidor** (Firebase las evalúa, no se pueden saltar):
```json
{
  "rules": {
    "roles": {
      ".read": "auth != null",
      "$uid": {
        ".write": "root.child('roles').child(auth.uid).val() === 'superadmin'"
      }
    },
    "usuarios":  { ".read": "root.child('roles').child(auth.uid).val() === 'superadmin'", ".write": "auth != null" },
    "empresas": {
      ".read": "auth != null",
      ".write": "root.child('roles').child(auth.uid).val() === 'superadmin' || root.child('roles').child(auth.uid).val() === 'admin' || root.child('roles').child(auth.uid).val() === 'editor'"
    },
    "global": { ".read": "auth != null", ".write": "root.child('roles').child(auth.uid).val() !== 'lector'" },
    "solicitudesBorrado": { ".read": "auth != null", ".write": "auth != null" },
    "temp-pdf": { "$docId": { ".read": true, ".write": "auth != null" } }
  }
}
```
Claves del enfoque:
- El nodo **`roles` solo lo puede escribir un superadmin** → corta la escalada de privilegios.
- Las escrituras de datos exigen no ser `lector` → la regla de "solo lectura" deja de ser cosmética.
- **Ideal a futuro:** restringir cada empresa a sus usuarios autorizados (lista de `uid` por empresa) para aislamiento real entre clientes.

> Las reglas de la UI **siguen siendo útiles** (mejor experiencia), pero la seguridad de verdad tiene que estar en las reglas de Firebase y en el backend.

---

## 🟠 3. PDFs de facturas con lectura pública

**Dónde:** regla `"temp-pdf": { "$docId": { ".read": true } }`.

**Riesgo:** `.read: true` hace que **cualquiera** (sin login) que conozca o adivine el `$docId` pueda descargar el PDF de una factura, que contiene datos fiscales (CUIT, importes, cliente).

**Cómo blindarlo:**
- Usar un `docId` largo y aleatorio (UUID) — ya dificulta adivinarlo.
- Agregar **expiración**: una Cloud Function o un job que borre los `temp-pdf` viejos (p. ej. > 24 h).
- Mejor: mover los PDF a **Firebase Storage** con reglas y URLs firmadas con vencimiento.

---

## 🟡 4. Sin validación de inputs en el backend (rate limiting ✅ agregado)

**Dónde:** `functions/server.js` — los endpoints confían en `req.body`/`req.query` (`parseInt(cuitRecep)`, etc.) sin validar rangos ni tipos.

**Riesgo:** errores de facturación por datos mal formados, costos en las APIs de banco.

**Cómo blindarlo:** validar los campos obligatorios y sus rangos antes de llamar a ARCA.

> **Rate limiting:** ✅ ya agregado — límite en memoria por IP, configurable con `RATE_LIMIT_MAX`/`RATE_LIMIT_WINDOW_MS` (ver C3 arriba).

**Nota sobre adjuntos (2026-07-20):** los archivos que suben los usuarios (facturas, documentos, contratos) se comprimen del lado del cliente antes de guardarse como base64 en Realtime Database (`MAX_DOC_MB = 8`, con compresión automática de imágenes y PDF si superan el límite — ver `CLAUDE.md`). **Esto es una mejora de UX/performance, no un control de seguridad**: las reglas de Firebase no validan tamaño ni tipo de payload, así que un usuario con permiso de escritura y algo de conocimiento técnico podría escribir directamente vía el SDK de Firebase un payload arbitrariamente grande en cualquier ruta donde tenga permiso de escritura, sin pasar por la compresión de la UI. No es explotable por un usuario anónimo (requiere estar autenticado con rol ≠ lector), pero vale tenerlo presente si en el futuro se necesita un tope real de tamaño por nodo.

---

## 🟡 5. Datos compartidos globalmente entre empresas

**Dónde:** `REF_PROV = db.ref('global/proveedores')` y `REF_GRUPOS = db.ref('global/grupos')` son **globales** (compartidos por todas las empresas).

**Riesgo:** si el sistema se usa para empresas de distintos dueños, todos ven los proveedores y grupos de todos. Si todas las empresas son del mismo titular, es aceptable.

**Recomendación:** confirmar el modelo de negocio. Si hay multi-cliente real, mover proveedores/grupos bajo cada empresa.

---

## 🟢 6. Secretos hardcodeados en el frontend

**Dónde:** `EMAILJS_DEFAULTS` (líneas ~8268) con `publicKey` embebida, y `ADMIN_EMAIL` (línea 38).

**Riesgo:** la *public key* de EmailJS está pensada para ser pública, pero sin restricción de dominio en el panel de EmailJS un tercero podría usar tu cuenta para **enviar mails (spam)** a tu costa. El email del admin expone una identidad.

**Cómo blindarlo:**
- En el panel de **EmailJS**, activar la restricción por **dominio permitido** (allowed origins) para que la key solo funcione desde tu dominio.
- Evaluar mover el `ADMIN_EMAIL` a config de Firebase en vez de hardcodearlo.

> Nota: la `apiKey` de `firebaseConfig` **no es un secreto** — es normal que esté en el frontend. La seguridad de Firebase no depende de ocultarla, sino de las **reglas** (ver punto 2).

---

## 🟡 7. XSS almacenado: texto libre sin escapar en `innerHTML`

**Dónde:** la UI arma tablas y tarjetas con template strings que escriben `innerHTML` directamente (ver nota en `CLAUDE.md`: "Ojo con escapar datos"). Es un patrón usado en todo el archivo, no solo en código nuevo.

**Riesgo:** si un campo de texto libre (nombre de un proveedor, aportante, desarrollo, observación, etc.) contiene HTML/JS (`<img src=x onerror=...>`), y ese valor se inserta sin escapar en `innerHTML`, se ejecuta en el navegador de **cualquier usuario que vea esa pantalla** (XSS almacenado). Requiere que alguien con permiso de edición cargue el payload — no es explotable por un usuario anónimo — pero en una app multiusuario con roles `editor` es un vector real.

**Qué se hizo en esta sesión:** se agregó `escHtml(s)` (escapa `& < > " '`) y se aplicó a los campos `nombre`/`obs` en el módulo nuevo de **Desarrollos** y **Aportantes/Socios** (galería, ficha de detalle y tabla). Verificado con un payload de prueba (`<img src=x onerror=...>`) que queda como texto plano y no se ejecuta.

**Pendiente:** el resto del archivo (Proveedores, Alquileres, Ventas, Presupuestos, etc.) sigue interpolando texto libre sin escapar en varios lugares. Recomendación: adoptar `escHtml()` de forma incremental cada vez que se toque una función de render existente, priorizando los campos que un `editor` (no solo `admin`) puede cargar.

---

## 🟢 8. El Asistente RK envía datos financieros a Google Gemini

**Dónde:** `rkResumenDatosApp()` — arma un resumen en texto de aportantes/socios (nombre + monto + desarrollo), desarrollos, alquileres (inquilino + canon), cuentas bancarias (banco + saldo), proveedores y ventas del proyecto activo, y lo agrega al *system prompt* que se envía a la API de Gemini en **cada mensaje** del Asistente RK.

**Riesgo:** esos datos (nombres de personas, montos, saldos bancarios) viajan a un servicio de terceros (Google) aunque la pregunta del usuario no tenga relación con ellos. Es el mismo modelo de confianza que ya existía para la lectura de facturas PDF (también vía Gemini), pero ahora aplica a **todos** los mensajes del chat, no solo a los que adjuntan un PDF.

**Mitigación aplicada:** el resumen se trunca a 6000 caracteres para acotar el volumen de datos por request.

**A evaluar:**
- Si el modelo de negocio requiere confidencialidad estricta de estos datos frente a terceros, considerar acotar `rkResumenDatosApp()` a menos campos, o activarlo solo cuando el usuario lo pide explícitamente (en vez de en cada mensaje).
- Confirmar los términos de retención de datos de la API de Gemini que se esté usando (v1beta `generateContent`).

---

## 🟠 9. Concurrencia — dos usuarios trabajando al mismo tiempo

**Contexto:** el sistema usa Firebase Realtime Database con listeners `.on('value')` que mantienen arrays en memoria (`datos`, `facturas`, etc.). El riesgo es el **lost-update**: si el usuario B guarda con su copia del array desactualizada, borra lo que el usuario A acababa de escribir.

**Estado tras la auditoría del 2026-07-17:**

| Operación | Antes | Ahora |
|---|---|---|
| **Registrar/editar/eliminar pago** de factura o presupuesto | Reescribía el array COMPLETO (`persistir()` / `persistirFacturas()`) → **lost-update** | ✅ Escribe **solo el nodo del ítem** (`REF_FACTURAS.child(idx).update(...)` / `REF_DATOS.child(idx).update(...)`), igual que documentos |
| **Pago de documento** | Ya era por-nodo (`REF_DOCS.child(id).update`) | ✅ Sin cambios |
| **Numeración correlativa** (OP, comprobantes A/B) | `.transaction()` atómica | ✅ A prueba de concurrencia, sin cambios |
| **Alta/edición/borrado de presupuestos, facturas, ventas, ingresos (caja/banco), cuentas bancarias, proveedores, remuneraciones, alquileres, servicios, desarrollos, aportantes, comprobantes emitidos, plan de trabajo, grupos** | Reescribían el array completo | ✅ **Migradas** — guardado por-diff keyed-by-id (`_colPersist`) |
| **Préstamos, importaciones ARCA (facturasARCA), comprobantes recibidos, tareas (pizarrón)** | Reescribían el array completo | ✅ **Migradas** (`_colPersist`) |

**Cómo funciona el guardado multiusuario (`_colPersist` + `_colProcesarCarga`):** cada colección se guarda como **objeto indexado por `id`** en RTDB (migración automática y determinística de array→objeto la primera vez). Al guardar se escribe con `update()` **solo lo que cambió o se agregó**, y `null` para lo borrado — nunca se toca lo que no está en el batch, así que **no se pisa lo que agregó/editó otro usuario en paralelo**. Solo si dos personas editan el MISMO ítem al mismo tiempo gana el último (aceptable y poco frecuente). La lógica está validada con una simulación de la semántica de Firebase (migración sin duplicados, edits concurrentes de ítems distintos, add concurrente que no se pierde, borrados).

**Estado:** ✅ **todas las colecciones (18) migradas** al guardado por-nodo. `_colProcesarCarga` soporta tanto colecciones guardadas como array (migración automática) como ya keyed por objeto (usa la clave de RTDB como id, ej. el pizarrón de tareas). No queda ninguna colección reescribiendo el array completo.

**Pauta operativa:** cada usuario puede trabajar en la misma o en distinta empresa/proyecto; el guardado por-nodo evita las colisiones en todas las colecciones (ya no hay pendientes).

### Revisión de concurrencia — funciones agregadas 2026-07-19/20

Con el volumen de features nuevas de esta sesión (CAC, Comprobantes emitidos, Alquileres, Documentos, Asistente), se auditó que todo lo nuevo respete el mismo patrón. Hallazgos:

- **`global/config/cacIndices`** (tabla de índices CAC por mes): escritura por clave (`set('cacIndices/<mes>', valor)` / `update({mes:valor})` para importación masiva / `remove('cacIndices/<mes>')`). Cada mes es su propio nodo → dos usuarios editando meses distintos no chocan; el mismo mes en simultáneo es last-write-wins sobre un escalar (aceptable, no hay forma de "perder" datos de otro mes).
- **`confirmarMoverAlquileres`** (mover contratos entre empresas/proyectos): un único `db.ref().update()` **multi-path atómico** con rutas absolutas (escribe en destino, `null` en origen, todo o nada). No usa `_colPersist` porque el destino es otra colección/proyecto, pero el patrón es seguro por diseño.
- **`_emitSincronizarMovCaja`** (genera/actualiza el movimiento de caja de un comprobante emitido, `origenEmitidoId`): 🔧 **se encontró y corrigió** un caso real: el movimiento nuevo se agregaba a `ingGeneral` con un id **aleatorio** (`_colUidItem()`). Si dos usuarios reflejaban/editaban el **mismo** comprobante casi al mismo tiempo (ej. ambos tocan "⬆️💰 ingreso" para el mismo emitido), cada uno generaba un id distinto → **dos movimientos de caja duplicados** para un solo comprobante (no era un lost-update, pero sí un dato duplicado). Corregido: el id ahora es **determinístico** (`'emitmov_' + reg.id`), así ediciones concurrentes del mismo origen convergen al mismo nodo (last-write-wins sobre ESE movimiento, sin duplicar). Aplica tanto al alta/edición normal de un comprobante como a los botones nuevos de reflejar ingreso/egreso.
- **Adjuntos** (compresión de imágenes/PDF, subida a `REF_DOCS`): cada adjunto se guarda bajo un id propio generado al momento de subir (`'DOC-' + Date.now() + '-' + random`) — no hay colisión posible entre subidas concurrentes de archivos distintos.

---

## ✅ Cosas que ya están bien

- **Certificados ARCA en el backend, no en el navegador** — la clave privada nunca se expone al cliente. ✔
- **Lectura robusta de PEM** (`leerPem`: soporta base64) — evita errores de formato con la clave. ✔
- **Credenciales de banco en Prometeo no se persisten** — viajan una vez y se obtiene una `key` de sesión temporal. ✔
- **Flujo de borrado con aprobación** — buena idea de control (hay que reforzarlo con reglas, ver punto 2). ✔
- **Service Worker** no cachea llamadas a Firebase/Railway/Google — evita servir datos sensibles obsoletos. ✔
- **Escape de HTML en el módulo de Desarrollos/Aportantes** (`escHtml()`) — corrige XSS almacenado en ese módulo; falta extenderlo al resto del archivo (ver punto 7). ✔
- **Reglas de Firebase por rol publicadas** — el nodo `roles` solo lo escribe un superadmin, y las escrituras de datos exigen no ser `lector`. ✔
- **Multiusuario:** las 18 colecciones guardan por-diff keyed-by-id (`_colPersist`); movimientos cross-link (ej. caja generada desde comprobantes emitidos) usan id determinístico para no duplicar bajo edición concurrente del mismo origen; mover datos entre proyectos usa `update()` multi-path atómico. ✔

---

## 🧭 Plan de acción sugerido (orden de prioridad)

Ya resuelto: cerrar el backend (punto 1, con retrocompatibilidad por idToken — ver C4), publicar las reglas de Firebase por rol (punto 2), rate limiting (punto 4), y migrar toda la concurrencia (punto 9). Queda pendiente:

1. **Endurecer `temp-pdf`** (punto 3): expiración + IDs aleatorios.
2. **Restringir por rol los endpoints sensibles del backend** (`/afip`, `/belvo/*`, `/prometeo/*`, `/gemini`) más allá del gate genérico de auth — hoy cualquier usuario autenticado de la app (incluido `lector`) puede llamarlos (ver C4).
3. Validación de rangos/tipos de inputs en el backend (punto 4).
4. Restringir la key de EmailJS por dominio (punto 6).
5. Extender `escHtml()` al resto de los módulos que interpolan texto libre en `innerHTML` (punto 7).
6. Definir el alcance de datos que el Asistente RK puede enviar a Gemini (punto 8), si la confidencialidad frente a terceros es un requisito del negocio.

---

*Informe generado a partir de una revisión del código. Recomendado repetir la auditoría tras aplicar los cambios y antes de pasar el backend de ARCA a `production` con datos reales.*
