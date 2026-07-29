# Auditoría de seguridad y multiusuario — Sistema (RK/Mess) + Caja

Fecha: 2026-07-29. Alcance: `speranzaemiliano-rk/mi-app` (Sistema · index.html + functions/server.js + database.rules.json) y `speranzaemiliano-rk/caja-diaria` (Caja · app.html + sw.js). Metodología: 4 auditorías en paralelo (seguridad y multiusuario para cada app) + verificación manual de los hallazgos críticos contra el código en `main`.

> **Cómo leer esto:** cada hallazgo tiene severidad y estado. Estado = ✅ ya arreglado / 🔧 arreglable en código (lo hago yo, con test) / 🔑 requiere que VOS publiques reglas de Firebase / ⚙️ requiere config de ops (Railway) que solo hacés vos / 📝 documentado, decisión tuya.

---

## Resumen ejecutivo

- **Lo más grave está del lado del Sistema (backend + reglas de Firebase), no de la Caja.** La Caja está muy bien escrita en lo que más importa (XSS y evaluación de expresiones): **no se encontró ningún hueco de inyección explotable**. Sus riesgos son de sincronización multiusuario (revivals) y de dependencia de las reglas de Firebase.
- **Cadena de ataque más seria hoy (Sistema):** un usuario con rol `lector` autenticado puede leer el token compartido del backend desde un nodo de Firebase legible por todos (`global/config/appToken`) y con ese token emitir facturas ARCA reales, saltándose el control de rol. Se cierra con reglas de Firebase + no aceptar el token compartido para acciones sensibles.
- **Dependencia de ops:** varias defensas del backend solo funcionan si en Railway están seteadas `APP_API_TOKEN`, `FIREBASE_SERVICE_ACCOUNT` y `ALLOWED_ORIGINS`. Sin eso, el backend queda "fail-open" (acepta sin autenticar). No se puede verificar desde acá; hay que confirmarlo en Railway.
- **Multiusuario Sistema:** el grueso ya está bien (persistencia por-diff, ids determinísticos en comprobantes, movimientos atómicos entre empresas). Los dos hallazgos "ALTO" de la auditoría de préstamos **ya estaban arreglados en `main`** (la auditoría leyó una copia 16 commits vieja). Quedan mejoras menores (atomicidad de las 2 patas del préstamo).
- **Multiusuario Caja:** el borrado de **días** ya se propaga bien (lápida, arreglado esta semana), pero el borrado de **préstamos y empresas** todavía "revive" al sincronizar (misma clase de bug, falta la lápida). Y el árbitro de la fusión depende del reloj del dispositivo.

---

## SISTEMA · Seguridad

### 🔴 CRÍTICO

**C1 — Backend "fail-open" si falta `APP_API_TOKEN`** · `functions/server.js` (middleware global ~128-131 y `requireRol` ~1697). Si no está seteada `APP_API_TOKEN` (y no hay service account para verificar el idToken), tanto el middleware como `requireRol` caen a "modo compatibilidad" y **permiten la request sin autenticar** — incluido `POST /afip` (emitir facturas con CAE), Belvo, Prometeo, `/gemini`. → **Estado ⚙️: verificá en Railway que estén `APP_API_TOKEN` y `FIREBASE_SERVICE_ACCOUNT`.** Recomendación de código (🔧, con tu OK): volver el backend *fail-closed* en las rutas sensibles.

**C2 — El token compartido es legible por cualquier autenticado → bypass del control de rol** · `database.rules.json` (`global` con `.read: auth != null`) + `index.html` (`global/config/appToken`, se guarda/lee ahí). *Verificado en `main`.* Cualquier usuario logueado, **incluido `lector`**, puede leer `global/config/appToken` desde la consola del navegador; `requireRol` acepta un `X-App-Token` válido **sin chequear rol**. → Un `lector` emite facturas ARCA saltándose el gate. **Estado 🔑 + 🔧:** restringir el nodo en las reglas (lo preparo) — **es seguro**, la app ya manda además el idToken de Firebase, así que los usuarios legítimos siguen operando por sesión.

### 🟠 ALTO

**A1 — `temp-pdf` de lectura pública** · `database.rules.json` (`temp-pdf/$docId` con `.read: true`). Cualquiera sin login que adivine el `docId` baja el PDF de una factura (CUIT, importes, cliente); no se aplica expiración. **OJO:** esto es **a propósito** — es el flujo "descargá la factura por link" (`index.html:6389` hace un `fetch` **sin auth**, para que un destinatario sin cuenta pueda bajar el PDF con `?pdf=<id>`). Cambiar la regla a `auth != null` **rompería esa función**. → **Estado 📝 (fix coordinado, no un simple toggle):** id largo tipo UUID (no `DOC-<timestamp>-<random>` adivinable) + aplicar la expiración (`exp`) en las reglas + limpieza programada. Lo dejamos para hacerlo juntos con test.

**A2 — Sin aislamiento entre empresas** · `database.rules.json` (`empresas` con `.read: auth != null`, `.write` para editor/admin/superadmin a nivel raíz). Cualquier autenticado lee TODAS las empresas; cualquier `editor` escribe cualquiera. Bloqueante si algún día vendés empresas como clientes separados. → **Estado 📝:** cambio de modelo (lista de uids por empresa), lo dejo documentado para cuando lo necesites.

**A3 — `/gemini` y `/ia/groq` como relay** · `functions/server.js`. No pasan por `requireRol`; en modo compat quedan como relay anónimo que consume tu key de Gemini/Groq. → **Estado 🔧/⚙️:** exigir idToken (no compat) + cuota por usuario.

### 🟡 MEDIO
- **M3 — `geminiKey` legible por todos** (`global/config/geminiKey`): mismo problema que C2. 🔑
- **M4 — XSS almacenado por `innerHTML` sin escapar**: `escHtml()` existe pero se usa de forma inconsistente (confirmado en Alquileres: `a.unidad`/`a.direccion`/`a.inquilino` entran crudos). Un `editor` que cargue `<img onerror=…>` ejecuta script en la sesión de quien vea la tabla (incl. superadmin). → **Estado 🔧 (lo arreglo, con test).**
- **M5 — `solicitudesBorrado` legible/escribible por cualquier autenticado.** 🔑
- **M6 — Enumeración de usuarios/roles** (`roles`/`usuarios` con `.read: auth != null`). Ojo: restringirlo necesita que el front lea `roles/<miUid>` en vez del nodo entero — requiere cambio de front + reglas coordinados. 📝
- **M2 — CORS abierto por defecto** si no está `ALLOWED_ORIGINS`. ⚙️

### 🟢 BAJO
- **B1** — EmailJS public key hardcodeada (pública por diseño; activá "allowed origins" en EmailJS). 📝
- **B2** — Se acepta `?token=` por query string (puede filtrarse en logs); preferir header. 📝

### ✅ Lo que está BIEN (Sistema, seguridad)
- `/usuarios/*` con `requireSuperadmin`: exige idToken verificado **+** rol superadmin, y **no** acepta el token compartido como bypass. Bien blindado.
- Certificados/keys de ARCA solo en el backend (env vars), nunca en el cliente.
- Sin secretos hardcodeados en `server.js` (todo por env). En `index.html`, solo la config web pública de Firebase + la public key de EmailJS.
- Reglas con default-deny (`.read/.write: false` en la raíz) y escritura de `roles` restringida a superadmin (corta la auto-promoción).
- Comparación del token con `crypto.timingSafeEqual` (no `===`). Credenciales de banco (Prometeo) no se persisten.

---

## SISTEMA · Multiusuario

### ✅ Ya arreglado en `main` (la auditoría leyó código viejo)
- **`_escribirMovCaja`** ahora escribe **un movimiento por id** vía `db.ref().update()` multi-path (no `set()` del array entero) y al nodo correcto **`ingGeneral`** (no la rama huérfana `ingresosGenerales`). Los dos "ALTO" de la auditoría de préstamos ya no aplican.

### 🟡 Abierto
- **Atomicidad de las 2 patas del préstamo** (`guardarPrestamo`/`marcarPrestamoDevuelto`): el egreso (origen) y el ingreso (destino) se escriben en dos `update()` separados. Si una falla y la otra no, el préstamo queda medio aplicado. Además el id del movimiento es aleatorio (no derivado del préstamo), así que un reintento podría duplicar. → **Fix sugerido (🔧, con tu OK):** un solo multi-path `update()` con rutas a ambas empresas + id determinístico derivado del id del préstamo. *(Nota: conviene re-verificar contra el estado actual antes de tocar — hubo varios arreglos recientes en este módulo.)*
- **`_emitSincronizarMovCaja`**: al editar un comprobante para que **deje** de afectar caja, revisar que se persista la baja del movimiento (no solo se saque de memoria). Re-verificar en `main`.

### ✅ Confirmado correcto
- `_colPersist`/`_colProcesarCarga` (persistencia por-diff): `update()` solo lo cambiado/agregado, `null` para lo borrado, nunca reescribe lo ajeno. La migración array→objeto usa `transaction()`.
- `confirmarMoverAlquileres`: un único `update()` multi-path atómico (destino + `null` en origen).
- `_emitSincronizarMovCaja` usa id determinístico `'emitmov_'+reg.id` (biyectivo, sin colisiones).

---

## CAJA · Seguridad

### 🟠 ALTO
- **Los datos dependen 100% de las reglas de Firebase, que viven en el repo del Sistema** (`cajaDiaria/$uid` en `mi-app/database.rules.json`, ya con `auth.uid === $uid`). La regla existe y es correcta; el punto es **confirmar que está publicada** y que ningún fallback abierto la tape. El proyecto Firebase (`modo-prueba-bb8c2`) es **compartido con RK**. → **Estado 🔑:** verificar publicación (ya está en el archivo).

### 🟡 MEDIO / 🟢 BAJO (locks locales, correctamente entendidos como tales)
- **PIN de crédito** (`localStorage`, sin hashear): es una cortina anti-mirón, no control de acceso — los datos están en el mismo nodo de Firebase que el usuario ya puede leer. 📝 (documentarlo como tal).
- **PIN de apertura de 4 dígitos**: hash cliente, fuerza bruta trivial. Es un lock de conveniencia local, correcto para lo que pretende ser. 📝
- **`sw.js` cachea SDKs de terceros** con stale-while-revalidate (RK explícitamente NO lo hace). Menor. 📝

### ✅ Lo que está BIEN (Caja, seguridad) — **muy sólido**
- **XSS: `esc()` se aplica consistentemente** en todos los campos de usuario (conceptos, notas de crédito/préstamo, nombres de empresa/proyecto, inputs prefilled). **No se encontró ningún campo que entre crudo a `innerHTML`.**
- **La calculadora (`evalLine`) NO se puede eludir**: whitelist estricta `/^[0-9.+\-*/()]+$/` antes de `Function()`, imposible referenciar identificadores o llamar funciones. Lo peor posible (Infinity) lo descarta `isFinite`.
- Config web de Firebase pública (esperado). Sin otros secretos hardcodeados. `sw.js` versiona el cache y es network-first para HTML.
- **Sugerencia menor (defensa en profundidad):** agregar `'` (`&#39;`) a `esc()` por si a futuro algún campo de usuario cae en un atributo con comilla simple.

---

## CAJA · Multiusuario

### 🟠 ALTO — a arreglar (elegido: sí)
- **P1 — Borrar un préstamo o una empresa "revive" al sincronizar.** `fusionarCajas` une `loans` y `contexts` por id sin lápida: si un dispositivo borra y otro (o la nube) todavía lo tiene, la unión lo re-agrega. Peor: el movimiento de caja del préstamo sí se borra (gana por `mod`), pero el registro del préstamo revive → **préstamo huérfano**. → **Fix (🔧, con test):** darle a `loans`/`contexts` la misma lápida con `mod` que ya tienen los días.
- **P2 — El árbitro de la fusión (`mod`) usa el reloj del dispositivo** (`Date.now()` local, no timestamp de servidor). Un reloj desajustado puede revivir un borrado o pisar una edición más nueva. → **Fix sugerido:** sellar con timestamp de servidor o un contador lógico. (Más invasivo; lo documento y lo encaramos con cuidado.)

### 🟡 MEDIO
- **P3 — La cascada bumpea `mod` de días que el usuario no editó** (recalcula si/sf/cred de días posteriores) → amplifica la pérdida de ediciones concurrentes. Fix: sellar `mod` solo por cambios en campos de contenido (movs/credMovs/fisMovs/fis/credAdj), no en los derivados.
- **P4 — Fusión a nivel día, no ítem**: si A agrega un movimiento y B carga el arqueo el mismo día, gana un día entero por `mod` y se pierde lo del otro. (Relacionado con P1/P5.)
- **P5 — Ids de movimientos de préstamo/cambio no determinísticos** (`ln_`+contador local+random; `ref:'Cambio'` constante). Impide dedup/fusión por ítem.

### ✅ Confirmado correcto
- **Borrar DENTRO de un día** (un movimiento, un crédito): el desempate por `mod` prioriza la versión sellada aunque tenga menos ítems. Resuelto.
- **Lápida de día entero** (borrar un día): correcta; `recompute` filtra vacíos y la cascada los saltea; el borrado se propaga.
- **Subida con `transaction`** (nunca `set()`); unión día-por-día preserva días de un solo lado; auto-sanado de la cadena de créditos; red offline/pendientes; supresión de re-subida de lo remoto.

---

## Plan de remediación (orden sugerido)

1. **⚙️ Ops (solo vos, en Railway):** confirmar `APP_API_TOKEN`, `FIREBASE_SERVICE_ACCOUNT` y `ALLOWED_ORIGINS=https://speranzaemiliano-rk.github.io`. Cierra C1, A3, M2 de una.
2. **🔑 Reglas de Firebase (a hacer JUNTOS, con test — NO se tocaron en vivo):** ninguna es un simple toggle seguro estando vos afuera, por eso quedaron **documentadas, no aplicadas**:
   - **C2/M3 (`appToken`/`geminiKey`):** por la **cascada de Firebase**, un hijo de `global` no se puede restringir si `global` ya tiene `.read: auth != null`. Fix real: **mover** `appToken`/`geminiKey` a un nodo superadmin-only (`global/secretos/…` con `.read` de superadmin) y cambiar el front para leerlos de ahí (o dejar de leer el token en el front, ya que manda el idToken). Requiere deploy de `index.html` + publicar reglas, coordinado.
   - **temp-pdf (A1):** ver arriba — no requerir auth (rompe el link), sino UUID + expiración.
   - **M5 (`solicitudesBorrado`) / M6 (`roles`/`usuarios`):** restringir la lectura necesita verificar antes qué lee el front (M6: el front debe leer `roles/<miUid>`, no el nodo entero). Coordinado.
3. **🔧 Caja P1 (lápida de préstamos/empresas):** implementado y testeado con Playwright, se despliega como una versión nueva.
4. **🔧 Sistema M4 (escape XSS):** aplicar `escHtml()` a los campos de texto libre (Alquileres primero), con test.
5. **🔧 (con tu OK, más adelante):** backend fail-closed (C1), atomicidad de préstamos, `mod` por servidor en la Caja (P2), aislamiento por empresa (A2), enumeración de roles (M6).

> Ninguna de las reglas de Firebase toma efecto hasta que **vos** las publiques en la consola (Firebase → Realtime Database → Reglas). Editar el archivo del repo es seguro y no cambia nada en vivo hasta ese paso.
