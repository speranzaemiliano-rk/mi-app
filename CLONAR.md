# 📦 Clonar el sistema para otra empresa (vender el "envase")

> El producto se llama **Nexa** (*"Gestión conectada"*). Es la marca por defecto del sistema genérico. Cada instalación puede rebrandearse con la marca del cliente (RK es una instalación con marca "RK").
> Guía paso a paso para crear una **instalación nueva y vacía** del sistema para otro cliente (Superbandas, Daking, etc.), **sin tocar RK**. Cada cliente queda con su propia base de datos, su marca y sus datos, totalmente separado.
> Modelo elegido: **una copia por cliente** (ver `MULTIEMPRESA.md`).

## La idea en una frase

El **"envase" es el código** (este repositorio). Los **datos y la identidad de cada cliente viven en su propia cuenta de Firebase**. Para un cliente nuevo se hace una **copia del código** apuntando a **una base de Firebase nueva y vacía**. RK sigue en su propia base, intacto.

Todo lo que cambia entre un cliente y otro está en **UN solo archivo: `config.js`**. No hay que tocar `index.html`.

---

## Pasos para dar de alta un cliente nuevo

### 1) Copiar el código
- En GitHub, **duplicá este repositorio** (o creá uno nuevo con estos mismos archivos). Ese repo será el del cliente.

### 2) Crear la base de datos del cliente (Firebase)
Cada cliente necesita su **propio proyecto de Firebase** (así los datos quedan separados de RK y de los demás):
1. Entrá a [console.firebase.google.com](https://console.firebase.google.com) → **Agregar proyecto**.
2. Activá **Authentication** → método **Correo electrónico/contraseña** (y Google si querés).
3. Activá **Realtime Database** (crear base).
4. **Reglas de seguridad:** en Realtime Database → Reglas, pegá el contenido de `database.rules.json` → **Publicar**.
5. En ⚙️ **Configuración del proyecto** → "Tus apps" → **Web** → copiá el objeto de configuración (apiKey, authDomain, databaseURL, projectId, etc.).

### 3) Backend (Railway) — opcional
- Si el cliente va a usar **facturación ARCA / bancos**, necesita un backend. Podés:
  - **Reusar el mismo backend** (comparten las APIs del asistente y ARCA con sus propias credenciales), o
  - **Crear uno nuevo** en Railway (ver `OPERACIONES.md` para las variables: `AFIP_*`, `GEMINI_API_KEY`, `GROQ_API_KEY`, etc.).
- Si el cliente **no** usa ARCA/bancos al principio, podés dejar el backend por defecto: el asistente y lo demás funcionan igual.

### 4) Editar `config.js` (lo único que se cambia)
> 💡 Lo más cómodo: copiá **`config.ejemplo.js`** (una plantilla en blanco, sin datos de RK) a `config.js` y completá los campos marcados con `⬅ COMPLETAR`.

Abrí `config.js` en el repo del cliente y reemplazá:
- `firebaseConfig` → el que copiaste en el paso 2.5 (⚠️ **este es el más importante**: define la base del cliente).
- `adminEmail` → el mail del dueño/administrador del cliente (será Super Administrador la primera vez que entre).
- `backendUrl` → la URL del backend del cliente (o dejá la de por defecto si comparten).
- `brand` → nombre, siglas y tagline del cliente (igual se puede cambiar después desde la app).
- `spotifyClientId` / `emailjs` → opcionales.

### 5) Desplegar
- **GitHub Pages** (como RK) o el hosting que uses. `sw.js` **deriva solo** su ruta base (no hay que tocarlo). Si el sitio queda en una **ruta distinta** a `/mi-app/` (p. ej. otro nombre de repo), ajustá `scope` y `start_url` en `manifest.json` para que coincidan con esa ruta. Tip: si nombrás el repo del cliente también `mi-app`, la ruta queda `/mi-app/` y no hace falta tocar nada.

### 6) Primer ingreso del cliente
1. El cliente entra con el `adminEmail` configurado → se **auto-asigna Super Administrador**.
2. Crea su **empresa** y su **proyecto** (menú de empresa → Nueva empresa / Nuevo proyecto).
3. Personaliza su **marca** en **Config → 🎨 Marca del sistema** (nombre, siglas, tagline).
4. Invita a sus usuarios (se registran con su mail) y les asigna rol y **accesos por empresa** (menú de empresa → Accesos).

---

## Qué NO se comparte entre clientes

- **Datos** (empresas, proyectos, caja, facturas, etc.): cada uno en **su** Firebase. Separación total.
- **Marca**: cada instalación tiene la suya.
- **Usuarios y roles**: propios de cada Firebase.

## Qué SÍ se puede compartir (si querés)

- **El backend (Railway) y sus APIs** (asistente Gemini/Groq): pueden ser el mismo para varios clientes, o uno por cliente. Es tu decisión de costos.

## Assets de marca (logo/íconos)

**Logo:** lo más fácil es poner una **URL de logo** en `config.js` → `brand.logo` (o desde Config → 🎨 Marca → "URL del logo"). Eso reemplaza el logo del splash y del login sin tocar archivos. El producto trae por defecto el logo de **Nexa** (`assets/mess-logo.svg`, galaxia). Los **íconos de la PWA** (los que se ven al instalar la app) sí son archivos y se reemplazan en el repo:
- `icons/icon-192.png`, `icons/icon-512.png`, `icons/icon.svg`.

**Íconos de Nexa listos para usar:** en `assets/` ya están los íconos del producto (`mess-icon.svg`, `mess-icon-192.png`, `mess-icon-512.png`, galaxia sobre fondo espacial, *maskable*). Para que un clon quede con la marca Nexa por defecto, copiá esos PNG sobre los de `icons/`:
```
cp assets/mess-icon-192.png icons/icon-192.png
cp assets/mess-icon-512.png icons/icon-512.png
cp assets/mess-icon.svg     icons/icon.svg
```
> ⚠️ En el repo de **RK** los `icons/icon-*.png` son los de RK y **no se tocan** — RK sigue mostrando su ícono. Esta copia se hace solo en el repo del clon.

**Asistente/mails del backend:** el nombre del asistente y de las alertas se configura en Railway con las variables `BRAND_NOMBRE`, `BRAND_ASISTENTE`, `BRAND_ALERTAS` (con RK por defecto).

---

## ✅ Checklist de seguridad antes de entregar a un cliente

Marcá cada punto en el Firebase **del cliente** (no en el de RK):

- [ ] **Reglas publicadas.** Realtime Database → Reglas → pegar `database.rules.json` → **Publicar**. (No se aplican solas: el archivo del repo no es la regla vigente hasta que la publicás.) Las reglas ya son **genéricas por rol** — no hay que editar ningún mail.
- [ ] **Alta pública de cuentas desactivada.** Authentication → Settings → *User actions* → desmarcar "Enable create (sign-up)". Si no, cualquiera puede crear una cuenta con la apiKey pública (aunque sin rol no vea nada).
- [ ] **`config.js` completo y correcto.** Sobre todo `firebaseConfig.databaseURL` y `adminEmail`. Si `config.js` falta, la app cae en la base de RK por respaldo → el cliente escribiría en RK. **Verificá que la app conecta a la base del cliente** (entrá, creá una empresa de prueba y confirmá que aparece en *su* Firebase).
- [ ] **Backend cerrado** (si usa Railway): en Railway seteá `APP_API_TOKEN` (token secreto) **o** `REQUIRE_AUTH=true` (modo estricto: rechaza todo lo no autenticado). Para ARCA/usuarios, `FIREBASE_SERVICE_ACCOUNT` del proyecto del cliente y `ALLOWED_ORIGINS` con el dominio del cliente. **Verificá** entrando a `TU-BACKEND/diag/seguridad`: tiene que decir `"cerrado": true` y `advertencias: []`. Ver `SECURITY.md`.
- [ ] **Respaldo automático** (recomendado): en el repo del cliente → *Settings → Secrets and variables → Actions*:
  - **Secret** `FIREBASE_SERVICE_ACCOUNT` = el JSON del service account del proyecto del cliente (Firebase → ⚙️ → Cuentas de servicio → Generar nueva clave privada).
  - **Variable** `FIREBASE_DATABASE_URL` = la `databaseURL` del cliente. (Si no la ponés, respalda la base de RK por defecto — ⚠️ no la del cliente.)
  - Opcional: variable `BRAND_NOMBRE` (para el asunto del mail) y secrets `BACKUP_MAIL_USERNAME` / `BACKUP_MAIL_PASSWORD` / `BACKUP_MAIL_TO` para recibir el backup por mail.
  - El workflow (`.github/workflows/backup-firebase.yml`) ya corre solo cada 24 hs; se puede disparar a mano desde *GitHub → Actions → Backup Firebase*.
- [ ] **Primer login del admin** con el `adminEmail` → se auto-asigna Super Administrador. Confirmá que entra y ve todo.

## Importante

- **RK no se toca nunca.** Todo esto se hace en un repo y un Firebase **nuevos**. RK sigue en `modo-prueba-bb8c2` con sus datos.
- **Seguridad:** antes de entregar a un cliente, revisá `SECURITY.md` (publicar reglas de Firebase, cerrar el backend con `APP_API_TOKEN`/service account).
- Si más adelante querés un **login único con selector de marca** (RK / Superbandas / Daking en un mismo sistema), es el "Camino B" de `MULTIEMPRESA.md` — se puede migrar cuando tengas varios clientes.
