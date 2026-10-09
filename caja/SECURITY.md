# Seguridad — Caja (Mess)

Notas de seguridad de la app de caja diaria (`app.html` + `sw.js`). Para el modelo de datos y funciones ver `CLAUDE.md`. Auditado 2026-07 (ver también `AUDITORIA-2026-07.md` en la raíz del repo, que cubre las dos apps).

## Modelo de confianza

- **La app es 100% cliente** (HTML+JS en un archivo, sin backend propio). Los datos viven en `localStorage` y, si el usuario activa la sincronización, en **Firebase Realtime Database** bajo `cajaDiaria/<uid>`.
- El proyecto Firebase (`modo-prueba-bb8c2`) es **compartido con la app del Sistema (RK/Mess)** — mismo RTDB. Las reglas de ese proyecto viven en este mismo repo (`database.rules.json`, en la raíz; la Caja está en la carpeta `caja/`).

## Lo que protege de verdad

- **Autenticación real = Firebase Auth** (email/password + Google). La separación de datos entre usuarios la hacen las **reglas de Firebase**, no el cliente.
- **Regla clave** (en `database.rules.json`, en la raíz del repo): `cajaDiaria/$uid` con `.read`/`.write` = `auth != null && auth.uid === $uid`. Esto es lo único que impide que un usuario logueado lea/escriba la caja de otro (el `uid` del path es adivinable). **Verificar que esté publicada** en la consola de Firebase y que ningún fallback la tape. Es el único punto que puede exponer datos reales.

## Lo que NO es control de acceso (locks locales, a propósito)

- **PIN de crédito** (`CREDIT_PIN_KEY` en `localStorage`, sin hashear): es una **cortina anti-mirón** sobre la *vista* del desglose de créditos. Los datos (`credMovs`, notas) están en el mismo nodo de Firebase que el usuario ya puede leer con su sesión, y el PIN se lee de `localStorage` desde DevTools. No protege datos, solo la mirada casual. Un lock puramente cliente **nunca** protege datos que el mismo usuario puede leer del backend.
- **PIN de apertura de 4 dígitos** (`PIN_KEY`, hash SHA-256 sin salt, verificado en el cliente): lock de conveniencia local. 10.000 combinaciones, se rompe por fuerza bruta o borrando el gate en DevTools. Correcto para lo que pretende ser; **no** es autenticación (esa es Firebase).

## Lo que está bien resuelto

- **XSS:** `esc()` (escape de `<`/`>`/`&`/`"`) se aplica de forma **consistente** en todos los campos que carga el usuario (conceptos de movimientos, notas de crédito/préstamo/cambio, nombres de empresa/proyecto, inputs prefilled del editor). No hay ningún campo de usuario que entre crudo a `innerHTML`. *Defensa en profundidad opcional:* agregar `'` (`&#39;`) a `esc()` por si a futuro algún campo de usuario cae en un atributo con comilla simple.
- **Calculadora flotante (`evalLine`):** antes de `Function()` aplica una whitelist estricta `/^[0-9.+\-*/()]+$/` sobre el string ya sin espacios. Imposible referenciar identificadores o llamar funciones — no se puede inyectar código. Lo peor posible (`Infinity`) lo descarta `isFinite`.
- **Sin secretos hardcodeados:** el único `AIza…` es la config web de Firebase (pública por diseño; la protección real son Auth + reglas). Las URLs de Apps Script, keys de EmailJS y el email de backup los ingresa el usuario y viven en su `localStorage`, no en el repo.
- **`sw.js`:** cache versionado (`caja-diaria-vN`, se bumpea en cada cambio), `activate` limpia caches viejos, HTML network-first con `cache:'no-store'`, y no cachea escrituras (`method !== 'GET'` sale temprano).

## Menores / pendientes

- **`sw.js` cachea SDKs de terceros** (Firebase, Google Identity, Chart.js) con stale-while-revalidate — podría servir una versión vieja de un SDK. La app del Sistema explícitamente **no** cachea esos orígenes; acá convendría excluirlos (solo red). Menor.
- **Sincronización (no es seguridad, es correctitud):** borrar un **préstamo** o una **empresa** todavía puede "revivir" al sincronizar (falta la lápida que sí tienen los días). Ver `AUDITORIA-2026-07.md` (Caja · Multiusuario, P1) y `CLAUDE.md`.

## Al tocar seguridad acá

- No confundir los locks locales (PIN de crédito / apertura) con autenticación. La única barrera real entre usuarios son las **reglas de Firebase** del proyecto compartido.
- No commitear secretos. Todo lo sensible del usuario vive en su `localStorage`, no en el repo.
