# 🔒 Informe de seguridad — RK · Gestión Multiempresa

> Auditoría del estado actual del código (`index.html`, `functions/server.js`, configuración de Firebase). Este documento describe riesgos y **cómo blindar** el sistema. No incluye valores de credenciales en vivo. Prioridad: **CRÍTICO → ALTO → MEDIO → BAJO**.

## Resumen ejecutivo

El sistema tiene una arquitectura razonable (los certificados ARCA viven en el backend, no en el navegador), pero **el control de acceso real es débil**: los permisos se aplican solo en el navegador y el backend no exige autenticación. Hay dos problemas **críticos** que conviene resolver antes de usarlo con datos reales de varias empresas o con un backend de ARCA en producción.

| # | Severidad | Problema | Estado |
|---|---|---|---|
| 1 | 🔴 CRÍTICO | Backend sin autenticación + CORS abierto a cualquier origen | ✅ Código listo — falta deploy (ver abajo) |
| 2 | 🔴 CRÍTICO | Permisos solo en el cliente + reglas de Firebase demasiado abiertas (escalada a superadmin) | ✅ Reglas listas — falta publicar |
| 3 | 🟠 ALTO | PDFs de facturas con lectura pública (`temp-pdf`, `.read: true`) | Pendiente |
| 4 | 🟡 MEDIO | Sin validación de inputs ni rate limiting en el backend | Pendiente |
| 5 | 🟡 MEDIO | Datos compartidos globalmente entre empresas (proveedores, grupos) | A evaluar |
| 6 | 🟢 BAJO | Secretos hardcodeados en el frontend (EmailJS, email admin) | A evaluar |
| 7 | 🟡 MEDIO | XSS almacenado: texto libre insertado en `innerHTML` sin escapar | ✅ Corregido en Desarrollos/Aportantes — resto del código sin auditar |
| 8 | 🟢 BAJO | El Asistente RK envía un resumen de datos financieros a la API de Google Gemini en cada consulta | Por diseño — evaluar alcance |

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

## 🟡 4. Sin validación de inputs ni rate limiting en el backend

**Dónde:** `functions/server.js` — los endpoints confían en `req.body`/`req.query` (`parseInt(cuitRecep)`, etc.) sin validar rangos ni tipos, y no hay límite de requests.

**Riesgo:** abuso/DoS, errores de facturación por datos mal formados, costos en las APIs de banco.

**Cómo blindarlo:** validar los campos obligatorios y sus rangos antes de llamar a ARCA; sumar `express-rate-limit`; loguear intentos fallidos.

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

**Dónde:** el Asistente RK usa *function calling* de Gemini. En **cada mensaje** viaja un inventario compacto (`rkInventarioDatos()`: cantidad de registros por sección + saldos de caja + tipo de cambio). Cuando el modelo lo pide, la herramienta `obtenerDatos` (`rkDatosSeccion()`) le envía los **registros completos en JSON** de la sección consultada (presupuestos con pagos, facturas, ingresos, proveedores, cuentas bancarias, aportantes, desarrollos, alquileres, servicios, ventas o caja).

**Riesgo:** esos datos (nombres de personas, montos, saldos bancarios) viajan a un servicio de terceros (Google). El inventario va siempre; el detalle solo cuando la conversación lo requiere, pero cuando va, va más completo que el resumen anterior. Es el mismo modelo de confianza que ya existía para la lectura de facturas PDF (también vía Gemini).

**Mitigación aplicada:** `rkSanitizar()` elimina adjuntos/base64 y campos internos antes de enviar, acota strings largos, y cada respuesta de herramienta se trunca a 14.000 caracteres.

**A evaluar:**
- Si el modelo de negocio requiere confidencialidad estricta de estos datos frente a terceros, considerar acotar las secciones expuestas en `rkColecciones()` a menos campos, o pedir confirmación al usuario antes de enviar el detalle.
- Confirmar los términos de retención de datos de la API de Gemini que se esté usando (v1beta `generateContent`).

---

## ✅ Cosas que ya están bien

- **Certificados ARCA en el backend, no en el navegador** — la clave privada nunca se expone al cliente. ✔
- **Lectura robusta de PEM** (`leerPem`: soporta base64) — evita errores de formato con la clave. ✔
- **Credenciales de banco en Prometeo no se persisten** — viajan una vez y se obtiene una `key` de sesión temporal. ✔
- **Flujo de borrado con aprobación** — buena idea de control (hay que reforzarlo con reglas, ver punto 2). ✔
- **Service Worker** no cachea llamadas a Firebase/Railway/Google — evita servir datos sensibles obsoletos. ✔
- **Escape de HTML en el módulo de Desarrollos/Aportantes** (`escHtml()`) — corrige XSS almacenado en ese módulo; falta extenderlo al resto del archivo (ver punto 7). ✔

---

## 🧭 Plan de acción sugerido (orden de prioridad)

1. **Cerrar el backend** (punto 1): API token o verificación de ID token de Firebase + CORS restringido. *Impacto fiscal directo.*
2. **Publicar reglas de Firebase reales** (punto 2): bloquear el nodo `roles` y exigir rol para escribir. *Aislamiento e integridad de datos.*
3. **Endurecer `temp-pdf`** (punto 3): expiración + IDs aleatorios.
4. Validación de inputs y rate limiting en el backend (punto 4).
5. Restringir la key de EmailJS por dominio (punto 6).
6. Extender `escHtml()` al resto de los módulos que interpolan texto libre en `innerHTML` (punto 7).
7. Definir el alcance de datos que el Asistente RK puede enviar a Gemini (punto 8), si la confidencialidad frente a terceros es un requisito del negocio.

---

*Informe generado a partir de una revisión del código. Recomendado repetir la auditoría tras aplicar los cambios y antes de pasar el backend de ARCA a `production` con datos reales.*
