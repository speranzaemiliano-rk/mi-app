# 📦 Clonar el sistema para otra empresa (vender el "envase")

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
Abrí `config.js` en el repo del cliente y reemplazá:
- `firebaseConfig` → el que copiaste en el paso 2.5 (⚠️ **este es el más importante**: define la base del cliente).
- `adminEmail` → el mail del dueño/administrador del cliente (será Super Administrador la primera vez que entre).
- `backendUrl` → la URL del backend del cliente (o dejá la de por defecto si comparten).
- `brand` → nombre, siglas y tagline del cliente (igual se puede cambiar después desde la app).
- `spotifyClientId` / `emailjs` → opcionales.

### 5) Desplegar
- **GitHub Pages** (como RK) o el hosting que uses. Si usás una carpeta/dominio distinto, ajustá `BASE` en `sw.js` y `scope`/`start_url` en `manifest.json`.

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

**Logo:** lo más fácil es poner una **URL de logo** en `config.js` → `brand.logo` (o desde Config → 🎨 Marca → "URL del logo"). Eso reemplaza el logo del splash y del login sin tocar archivos. Los **íconos de la PWA** (los que se ven al instalar la app) sí son archivos y se reemplazan en el repo:
- `icons/icon-192.png`, `icons/icon-512.png`, `icons/icon.svg`.

**Asistente/mails del backend:** el nombre del asistente y de las alertas se configura en Railway con las variables `BRAND_NOMBRE`, `BRAND_ASISTENTE`, `BRAND_ALERTAS` (con RK por defecto).

---

## Importante

- **RK no se toca nunca.** Todo esto se hace en un repo y un Firebase **nuevos**. RK sigue en `modo-prueba-bb8c2` con sus datos.
- **Seguridad:** antes de entregar a un cliente, revisá `SECURITY.md` (publicar reglas de Firebase, cerrar el backend con `APP_API_TOKEN`/service account).
- Si más adelante querés un **login único con selector de marca** (RK / Superbandas / Daking en un mismo sistema), es el "Camino B" de `MULTIEMPRESA.md` — se puede migrar cuando tengas varios clientes.
