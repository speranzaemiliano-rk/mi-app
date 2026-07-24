# 🏢 Multiusuario, API keys y White-Label

> Documento de referencia para entender **cómo funciona hoy** el sistema con varios usuarios y empresas, **qué APIs son compartidas o propias de cada uno**, y **qué falta para que lo pueda usar cualquier empresa** (white-label / producto multi-cliente).
> Escrito en criollo, sin asumir conocimiento técnico. Fecha: 2026-07-24.

---

## 1. Respuesta corta a tus dudas

**¿Cada usuario nuevo tiene que generar sus propias APIs (Gemini, YouTube, etc.)?**
**NO.** Las inteligencias del asistente (Gemini y Groq) viven en el **servidor (Railway)** como variables `GEMINI_API_KEY` y `GROQ_API_KEY`. La de YouTube y el "cerebro" del asistente viven en la configuración global de Firebase. Todo eso es **compartido**: un usuario nuevo (por ejemplo `administracion@rkarquitectura.com.ar`) entra y **ya tiene todo funcionando** sin cargar ninguna key.

**La única excepción es Spotify.** Spotify es login personal (OAuth): cada persona que quiera usar el reproductor de Spotify tiene que **conectar su propia cuenta** con el botón "Conectar con Spotify". El asistente y YouTube los usan todos con las keys del sistema; Spotify es de cada uno.

**¿Se puede mezclar la información entre usuarios?**
Los **datos contables NO se mezclan** por usuario porque no son "por usuario": son **por empresa y proyecto**, y todos los usuarios del equipo **comparten** los mismos datos (así está pensado para que RK trabaje en equipo). Lo que **sí** se guardaba en el navegador y podía mezclarse entre personas que comparten la misma computadora era el **historial del asistente** y la **sesión de Spotify** → **eso ya lo arreglé** (ver punto 4).

---

## 2. Qué es compartido, qué es por usuario y qué es por dispositivo

| Elemento | Alcance | Explicación |
|---|---|---|
| Empresas, proyectos y sus datos (caja, facturas, banco, presupuestos, docs, tareas) | **COMPARTIDO** entre todos los usuarios | Viven en `empresas/<id>/proyectos/<id>/…`. Todos los del equipo ven lo mismo. |
| Proveedores, grupos, vencimientos, créditos | **COMPARTIDO** | Viven en `global/…` (cruzan todas las empresas). |
| Config global (menú, CAC, keys de YouTube/Gemini, cerebro del asistente) | **COMPARTIDO** | `global/config/*`. |
| Asistente (Gemini / Groq) | **COMPARTIDO** (servidor Railway) | Un solo par de keys para todos. |
| **Rol** de cada persona (superadmin / admin / editor / lector) | **POR USUARIO** | `roles/<uid>`. Cambia qué puede editar, no qué datos ve. |
| Registro de último acceso | **POR USUARIO** | `usuarios/<uid>`. |
| Empresa/proyecto activo | **POR DISPOSITIVO** (se resetea al recargar) | Hoy no se guarda; al entrar siempre arranca en la primera empresa. |
| Sesión de **Spotify** | **POR DISPOSITIVO** (cuenta personal) | Cada uno conecta su Spotify; el token queda en ese navegador. |
| Historial del asistente, música, voz | **POR DISPOSITIVO** | Quedan en el navegador (localStorage). |

**Traducción práctica:** el equipo de RK comparte toda la contabilidad y el asistente. Cada persona tiene su rol (qué puede tocar) y, si quiere música de Spotify, su propio login de Spotify.

---

## 3. ¿Cómo entra un usuario nuevo? (ej. administracion@rkarquitectura.com.ar)

1. Se registra/inicia sesión con su mail (email+contraseña o Google).
2. Queda con rol **lector** por defecto (solo ve, no edita), **salvo** que sea el `ADMIN_EMAIL` configurado, que se auto-asigna **superadmin**.
3. Un **superadmin** le puede subir el rol a `editor`/`admin` desde la gestión de usuarios.
4. Ve **las mismas empresas y datos** que el resto (modelo compartido).
5. El **asistente, YouTube y las demás funciones ya le andan** con las keys del sistema. Si quiere Spotify, conecta su cuenta.

> ⚠️ Hoy **cualquier usuario logueado (incluso `lector`) puede leer todas las empresas**. Para el equipo de RK está bien (comparten todo). Para **vender a otras empresas como clientes separados**, esto hay que cerrarlo (ver punto 6).

---

## 4. Arreglos de higiene multiusuario aplicados en esta consolidación

- **Limpieza al cambiar de usuario en la misma PC:** cuando en un dispositivo se loguea un usuario distinto al anterior, se borran automáticamente el **historial del asistente** (`rk_chat_memoria`) y la **sesión de Spotify** (`rk_sp_*`). Así el usuario B no ve la conversación ni la biblioteca de Spotify del usuario A. (`index.html` → `_limpiarDatosSensiblesDispositivo()` y hook en el login).
- **Limpieza al cerrar sesión:** `cerrarSesion()` ahora borra esos mismos datos antes de salir.

Lo que **no** se toca: los datos contables (viven en Firebase, protegidos por rol) y las keys compartidas (son del sistema, no de la persona).

---

## 5. Estado de seguridad relevante para multiusuario

Ver `SECURITY.md` para el detalle completo. Lo más importante para el uso multiusuario/multiempresa:

- **Aislamiento entre empresas:** hoy **no hay** separación de lectura por empresa (`database.rules.json` → `empresas` con `.read: auth != null`). Cualquier logueado lee todas.
- **Secretos legibles por todos:** el token del backend y las keys en `global/config/*` los puede leer cualquier usuario autenticado desde Firebase.
- **Endpoints del backend sin control de rol:** salvo `/usuarios/*`, un `lector` podría llamar a `/afip`, `/gemini`, `/ia/groq`, etc. (gastar APIs, emitir comprobantes).
- **XSS almacenado:** se corrigieron las tablas principales (presupuestos, facturas, documentos, proveedores); falta una pasada completa por el resto del archivo.

---

## 6. Plan para White-Label (que lo use cualquier empresa)

El sistema ya es **multiempresa por dentro** (datos por `empresas/<id>/proyectos/<id>`). Lo que falta para convertirlo en un **producto que use cualquier empresa** son dos cosas: (A) sacar todo lo que dice "RK" y quede parametrizable, y (B) aislar de verdad los datos entre empresas-cliente.

### A) Sacar el hardcoding de RK (marca) → parametrizar

Todo esto hoy está fijo en el código como "RK"/"FEKOMP"/Argentina y habría que moverlo a una **configuración de marca por instalación** (`BRAND`/tenant):

1. **Marca y textos** (`index.html:9-11` metas, `manifest.json:2-4`, `sw.js`, splash `index.html:2476`, login `2590-2591`, siglas `2418`, títulos, pies de PDF `26306`, prefijos de export `RK-*.xlsx`).
2. **Assets propios** (`assets/avatar-rk.png`, `logo ..._blanco.png`, `icons/*`, logo base64 embebido en `index.html:2590`) → que vengan de una carpeta/URL por empresa.
3. **Identidades y credenciales** por instalación: `ADMIN_EMAIL` (`index.html:42`), `firebaseConfig` (`33-41`, `.firebaserc`), URL del backend Railway (`13151, 25848`), `EMAILJS_DEFAULTS` (`13496-13499`), Spotify Client ID (`31906`), y el `scope`/`start_url` `/mi-app/` del manifest.
4. **Prompts del asistente** (`index.html:33369`, `server.js:1147`, `server.js:1253`), saludo (`32708`) y placeholders → inyectar nombre de producto, rubro y secciones desde config.
5. **Localización / régimen fiscal:** país, `es-AR`, moneda ARS por defecto, condiciones de IVA argentinas, provincias (`27323`), integración ARCA/AFIP/CAC → abstraer a un módulo de "región/fisco" (~1430 puntos con `es-AR`/ARCA/AFIP).
6. **Datos semilla:** CUIT/razón social de FEKOMP (`25362-25363`), la migración que busca "FEKOMP" (`25051-25085`), radios AR (`31630-31641`), playlist AR (`31651`) → sacarlos de config o dejarlos vacíos.
7. **Prefijos `rk-`/`RK_`** (IDs del DOM, claves de localStorage, prefijo de caché `rk-v…`) → neutralizar a un slug configurable.
8. **Dominio de despliegue** (`speranzaemiliano-rk.github.io/mi-app/`, embebido en PDFs públicos `15268`, CORS, docs) → derivar de config.

### B) Aislar datos entre empresas-cliente (multi-tenant real)

Para que la empresa X no vea los datos de la empresa Y hay que cambiar el modelo de "todos comparten" a "cada usuario ve solo sus empresas":

1. Agregar en Firebase una **lista de usuarios autorizados por empresa** (ej. `empresas/<id>/usuarios/<uid> = true`).
2. Cambiar las **reglas de Firebase** para que `empresas/<id>` solo se lea/escriba si el `uid` está autorizado en esa empresa (en vez de `auth != null`).
3. Mover los datos hoy **globales** que hoy cruzan empresas (proveedores, grupos, vencimientos) a **por empresa/tenant**, o dejarlos globales solo si es a propósito.
4. Sacar los **secretos** de `global/config` legibles por todos (usar variables de servidor / reglas más cerradas).
5. ✅ **Control de rol en el backend (hecho en código):** los endpoints sensibles (`/afip` emitir/importar, robot ARCA, `/belvo/*`, `/prometeo/*`, `/whatsapp/send`) ahora exigen rol `editor`+ (`requireRol`). El **asistente (`/gemini`, `/ia/groq`) queda abierto a todos**. Falta el redeploy en Railway + `FIREBASE_SERVICE_ACCOUNT_BASE64` para activarlo.

> Estos cambios de reglas hay que **publicarlos en la consola de Firebase** y probarlos con cuidado, porque **cambian quién ve qué**. No se aplican solos con un push al repo. Conviene hacerlo en una etapa dedicada, con backup y con un usuario de prueba.

### Estado del aislamiento por empresa

**✅ Etapa 1 — Infraestructura en la app (hecha):**
- Modelo de datos: `empresas/<id>/usuariosAutorizados/<uid> = true`.
- UI para el superadmin: menú de empresa → **"Accesos (usuarios)"** (`abrirAccesoEmpresa`), donde marca qué usuarios pueden ver la empresa activa. El superadmin siempre tiene acceso.
- Filtro en la app: `initEmpresas()` muestra a cada usuario solo las empresas donde está autorizado (`_empresaVisiblePara`).
- **Retrocompatible:** una empresa **sin** lista de autorizados la ven **todos** (como hasta hoy). Recién cuando el superadmin marca usuarios en una empresa, esa empresa queda restringida a ellos. Así **no se deja a nadie afuera** por accidente.
- ⚠️ **Es control de acceso en la interfaz, no seguridad real todavía.** Las reglas de Firebase siguen abiertas: un usuario técnico podría leer otras empresas desde la consola del navegador. La barrera real llega en la etapa 2. Además, las **vistas cruza-empresa** (agenda de Vencimientos, consolidado) todavía muestran todas las empresas.

**⏳ Etapa 2 — Reglas de Firebase (pendiente, requiere consola + prueba):**
Reemplazar en `database.rules.json` el nodo `empresas` para que la lectura/escritura sea por empresa. **Clave:** hay que **sacar el `.read` a nivel `empresas`** (si queda, habilita todo el árbol) y ponerlo a nivel `$empId`:
```json
"empresas": {
  "$empId": {
    ".read": "root.child('roles').child(auth.uid).val() === 'superadmin' || !data.child('usuariosAutorizados').exists() || data.child('usuariosAutorizados').child(auth.uid).val() === true",
    ".write": "root.child('roles').child(auth.uid).val() === 'superadmin' || ((root.child('roles').child(auth.uid).val() === 'admin' || root.child('roles').child(auth.uid).val() === 'editor') && (!data.child('usuariosAutorizados').exists() || data.child('usuariosAutorizados').child(auth.uid).val() === true))"
  }
}
```
Igual criterio (retrocompatible): empresa sin `usuariosAutorizados` → la ven todos; con lista → solo los de la lista + superadmin. **Antes de publicar:** backup del árbol, confirmar que tu superadmin esté OK, y probar con un usuario de prueba que (a) ve las empresas donde está y (b) NO ve las restringidas. Para cerrar del todo, mover también los datos hoy globales (proveedores/grupos/vencimientos) a por-empresa o restringir su lectura.

---

## 7. Roadmap sugerido (en orden)

1. **(Hecho)** Higiene multiusuario en el navegador + XSS en tablas principales.
2. **Cerrar el backend:** ✅ control de rol en endpoints sensibles agregado en código. **Falta (vos, en Railway):** setear `APP_API_TOKEN`, `FIREBASE_SERVICE_ACCOUNT_BASE64` y `ALLOWED_ORIGINS`, y redeploy — sin esos pasos el control queda en modo compatibilidad (no bloquea).
3. **Aislamiento por empresa** (multi-tenant real): ✅ **Etapa 1 hecha** (asignar usuarios por empresa + filtro en la app, retrocompatible). ⏳ **Etapa 2 pendiente:** publicar las reglas de Firebase por empresa (ver arriba) con backup y usuario de prueba.
4. **Parametrizar la marca** (config `BRAND`) para poder instalar el producto para otra empresa sin tocar el código.
5. **Abstraer región/fisco** (para países/regímenes distintos a Argentina/ARCA).

Los puntos 1 se hacen en código; el 2 y 3 requieren pasos tuyos en Railway y Firebase (ver `OPERACIONES.md` y `SECURITY.md`); el 4 y 5 son desarrollo grande que conviene planificar aparte.
