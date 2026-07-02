# 🔧 Guía de Operaciones — RK · Gestión Multiempresa

**Para administradores de sistemas y operadores. Despliegue, configuración, monitoreo y mantenimiento.**

> Para documentación técnica, ver `CONSOLIDACION.md`. Para seguridad, ver `SECURITY.md`.

---

## 📋 Índice

1. [Despliegue inicial](#despliegue-inicial)
2. [Configuración (primera vez)](#configuración-primera-vez)
3. [Variables de entorno (checklist)](#variables-de-entorno)
4. [Monitoreo](#monitoreo)
5. [Respaldos y recuperación](#respaldos-y-recuperación)
6. [Escalado y performance](#escalado-y-performance)
7. [Actualización de código](#actualización-de-código)

---

## Despliegue inicial

### 1. Frontend (GitHub Pages / Firebase Hosting)

**Opción A: GitHub Pages (recomendado — lo actual)**

```bash
# El repo está en GitHub Pages, sirviendo desde /mi-app/
# El archivo index.html se despliega automáticamente

# Pasos:
1. Hacer push a rama main
2. GitHub Actions verifica (si está configurado) o se despliega automáticamente
3. Accesible en: https://speranzaemiliano-rk.github.io/mi-app/

# Verificar:
curl https://speranzaemiliano-rk.github.io/mi-app/ | head -20
# Debe devolver HTML con <title>RK · Gestión Multiempresa</title>
```

**Opción B: Firebase Hosting (alternativa)**

```bash
# Si se prefiere Firebase Hosting (menor latencia, más features):

firebase login
firebase deploy --only hosting

# Verificar:
firebase open hosting
# Abre la URL pública de Firebase Hosting
```

### 2. Backend (Railway)

```bash
# Railway está conectado a este repo (GitHub)
# Detecta cambios en functions/ y redeploy automático

# Deploy manual (si es necesario):
1. GitHub → Push a main
2. Railway → proyecto → servicio → esperar ~1-2 min
3. Verificar: https://mi-app-production-e1cd.up.railway.app/

# Status del deploy:
# Railway Dashboard → Build Logs / Deploy Logs
```

**Variables de entorno en Railway** (ver sección [Variables de entorno](#variables-de-entorno)):

```bash
# Railway → servicio → Variables (pestaña)
# Agregar todas las variables listadas abajo
# Guardar → Railway redeploy automático
```

### 3. Base de datos (Firebase)

```bash
# El proyecto Firebase modo-prueba-bb8c2 ya existe

# Pasos si es una nueva instancia:
1. Crear proyecto en Firebase Console
2. Habilitar:
   - Authentication (email + Google)
   - Realtime Database (crear DB)
   - Storage (para temp-pdf)
3. Copiar firebaseConfig a index.html (línea ~20)
4. Publicar reglas de seguridad (ver SECURITY.md)
```

---

## Configuración (primera vez)

### Paso 1: Registrar primer usuario (superadmin)

```bash
# En Firebase Console:
1. Authentication → Sign in method → Email/Password → Enable
2. Agregar usuario de prueba: admin@empresa.com / password

# En la app:
1. Abrir https://speranzaemiliano-rk.github.io/mi-app/
2. Login con admin@empresa.com
3. Si no existe empresa, app abre modal de "Crear empresa"
4. Crear empresa + proyecto
5. El usuario se asigna automáticamente como superadmin
```

### Paso 2: Configurar integraciones (ARCA, Belvo, Prometeo)

**En la app (Config → Configuración de ARCA):**

```
URL del backend: https://mi-app-production-e1cd.up.railway.app
Token del backend: <valor de APP_API_TOKEN en Railway>
Punto de venta: 3
CUIT del emisor: 20123456789 (del certificado ARCA)
```

**Google Gemini (lectura de PDFs):**

```
En Config → Claves de terceros:
Cargar API Key de Google Gemini
Obtener en: https://ai.google.dev/
```

**EmailJS (envío de facturas por mail):**

```
En Config → Claves de terceros:
Service ID: (de EmailJS dashboard)
Template ID: (template de factura)
Public Key: (restricción por dominio en panel de EmailJS)
```

### Paso 3: Agregar usuarios

```
En Config → Usuarios:
1. Buscar usuario por email (o invitar si no existe)
2. Asignar rol (superadmin / admin / editor / lector)
3. Guardar

Roles:
- superadmin: todo (administra usuarios, aprueba borrados, elimina empresas)
- admin: edita y aprueba borrados (no administra usuarios)
- editor: crea y edita registros
- lector: solo lectura (con badge "Solo lectura")
```

---

## Variables de entorno

### Railway — functions/server.js

**Variables OBLIGATORIAS (para ARCA):**

| Variable | Ejemplo | Descripción |
|----------|---------|-------------|
| `AFIP_CUIT` | `20123456789` | CUIT del emisor (sin guiones) |
| `AFIP_CERT` | `LS0tLS1CRUdJTi...` | Certificado .crt en **base64** |
| `AFIP_KEY` | `LS0tLS1CRUdJTi...` | Clave privada .key en **base64** |
| `AFIP_ENV` | `production` o `testing` | Ambiente ARCA (default `testing`) |
| `PORT` | `3000` | Puerto (lo inyecta Railway automáticamente) |

**Cómo convertir cert/key a base64:**

```bash
# En máquina local (Linux/Mac):

# Certificado:
cat certificado.crt | base64 | tr -d '\n' > cert_base64.txt
# Pegar el contenido de cert_base64.txt en Railway

# Clave privada:
cat clave.key | base64 | tr -d '\n' > key_base64.txt
# Pegar el contenido de key_base64.txt en Railway
```

**Variables OPCIONALES (para importar comprobantes):**

| Variable | Ejemplo | Descripción |
|----------|---------|-------------|
| `AFIP_SDK_TOKEN` | `sk_live_...` | Token de AFIP SDK (https://app.afipsdk.com) |
| `ARCA_USER` | `30716812452` | Usuario ARCA (default: AFIP_CUIT) |
| `ARCA_PASS` | `miPassword123` | Contraseña de clave fiscal ARCA |

**Variables OPCIONALES (para Belvo — open banking MX/BR/CO/CL):**

| Variable | Ejemplo | Descripción |
|----------|---------|-------------|
| `BELVO_SECRET_ID` | `sk_...` | Secret ID de Belvo |
| `BELVO_SECRET_PASSWORD` | `pw_...` | Secret Password de Belvo |
| `BELVO_ENV` | `sandbox` | Ambiente Belvo (sandbox / development / production) |

**Variables OPCIONALES (para Prometeo — open banking MX/BR/CO/CL/AR):**

| Variable | Ejemplo | Descripción |
|----------|---------|-------------|
| `PROMETEO_API_KEY` | `pk_...` | API Key de Prometeo |
| `PROMETEO_ENV` | `sandbox` | Ambiente Prometeo (sandbox / production) |

**Variables CRÍTICAS (seguridad):**

| Variable | Ejemplo | Descripción |
|----------|---------|-------------|
| `APP_API_TOKEN` | `LongSecretTokenHere123456789` | Token para autenticar llamadas al backend (implementado pero activable) |

### Firebase Console

**firebaseConfig en index.html (~línea 20):**

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "modo-prueba-bb8c2.firebaseapp.com",
  projectId: "modo-prueba-bb8c2",
  storageBucket: "modo-prueba-bb8c2.appspot.com",
  messagingSenderId: "...",
  appId: "...",
  databaseURL: "https://modo-prueba-bb8c2-default-rtdb.firebaseio.com"
};
```

**Global config (en Firebase, bajo /global/config/):**

```json
{
  "geminiKey": "AIzaSy...",
  "googleClientId": "123456789-abcdefg.apps.googleusercontent.com",
  "emailjs": {
    "serviceId": "service_...",
    "templateId": "template_...",
    "publicKey": "pk_..."
  },
  "appToken": "LongSecretTokenHere123456789"
}
```

---

## Monitoreo

### Health checks

**Backend diagnostics:**

```bash
# Verificar que el backend esté vivo:
curl https://mi-app-production-e1cd.up.railway.app/

# Respuesta esperada:
# { "status": "ok" }

# Verificar ARCA (necesita APP_API_TOKEN):
curl "https://mi-app-production-e1cd.up.railway.app/diag?token=<APP_API_TOKEN>"

# Respuesta incluye:
# {
#   "afip": {
#     "conectado": true,
#     "ambiente": "production",
#     "puntosVenta": [3],
#     "certificadoCargado": true
#   },
#   "recibidos": {
#     "sdkTokenCargado": true,
#     "listoParaUsar": true
#   },
#   "belvo": { "conectado": false },
#   "prometeo": { "conectado": false }
# }
```

**Frontend health:**

```bash
# Verificar que la app se carga:
curl -I https://speranzaemiliano-rk.github.io/mi-app/

# Respuesta esperada:
# HTTP/2 200
# Content-Type: text/html; charset=utf-8

# Verificar Service Worker:
# En el navegador, Inspect → Application → Service Workers
# Debe haber 1 worker "active" (sw.js)
```

### Logs

**Railway logs:**

```bash
# En Railway Dashboard:
# Proyecto → Servicio → Logs

# Ver últimas líneas:
# Buscar errores en stderr (color rojo)
# Buscar advertencias en stdout

# Ejemplos de errores críticos:
# - "AFIP_CERT not found" → falta env var
# - "Invalid cert format" → base64 corrupto
# - "CORS origin not allowed" → ALLOWED_ORIGINS configurado mal
```

**Firebase logs:**

```bash
# En Firebase Console:
# Project → Realtime Database → Reglas → Ver las últimas denials/denies
# (si las reglas están publicadas y rechazando accesos)

# Ver intentos fallidos de login:
# Authentication → Users → ver últimos logins
```

**Service Worker (browser):**

```javascript
// En consola del navegador:
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(r => console.log(r.active?.scriptURL));
});

// Debe mostrar algo como:
// https://speranzaemiliano-rk.github.io/mi-app/sw.js
```

### Alertas recomendadas

**Configurar alertas en Railway:**

```
1. Railway → Proyecto → Alerts (si está disponible)
2. Crear alert: "Servicio detenido" → enviar email
3. Crear alert: "Memory usage > 80%" → enviar email
```

**Monitoreo manual (diario):**

```bash
# Ejecutar cada mañana:
curl -s https://mi-app-production-e1cd.up.railway.app/diag?token=<TOKEN> | jq .
# Verificar que afip.conectado = true
```

---

## Respaldos y recuperación

### Respaldo de Firebase

**Automático:**

```bash
# Firebase proporciona respaldos automáticos:
# Firebase Console → Settings → Backup and Recovery
# (disponible en plan Blaze)

# Para plan Spark (gratuito), hacer respaldos manuales
```

**Manual (exportar JSON):**

```bash
# Firebase Console → Realtime Database → ⋮ (menú) → Export JSON
# Descarga un archivo empresas.json con toda la BD

# Guardar en lugar seguro (Google Drive, S3, etc.)
```

**Restaurar desde respaldo:**

```bash
# Firebase Console → Realtime Database → ⋮ (menú) → Import JSON
# Seleccionar el archivo empresas.json
# ⚠️ Esto SOBRESCRIBE la BD actual — hacer en ambiente de test primero

# Opción segura: importar a una ruta específica
# Firebase Console → Rules → ".write": "root.child('temp-import').val() === true"
# Publicar, importar a /temp-import, luego copiar manualmente a empresas/...
```

### Recuperación ante desastre

**Si el backend (Railway) cae:**

```
1. Railway Dashboard → Servicio → Redeploy
2. Verificar logs (Deploy Logs) para saber qué falló
3. Causas comunes:
   - Variable ENV corrupta → editar y guardar
   - Código roto → git rollback a commit anterior
   - Memoria llena → Railway reinicia automáticamente
```

**Si Firebase se ve comprometido:**

```
1. Ir a Firebase Console → Authentication → Disable
2. Cambiar contraseña de admin en Firebase Console
3. Revisar Firebase Logs para actividad sospechosa
4. Si hay datos corruptos: restaurar desde respaldo (ver arriba)
```

**Si el certificado ARCA expira:**

```
1. Generar nuevo certificado ante AFIP
2. Convertir a base64: cat nuevo.crt | base64 | tr -d '\n'
3. Railway → Variables → actualizar AFIP_CERT
4. Verificar /diag: debe mostrar certificado válido
```

---

## Escalado y performance

### Monitoreo de uso

**Firebase Realtime Database:**

```
1. Firebase Console → Project → Realtime Database → Size
   Muestra uso de almacenamiento (límite: 1GB en Spark, ilimitado en Blaze)

2. Firebase Console → Analytics (si está habilitado)
   Muestra usuarios activos, eventos, etc.
```

**Railway:**

```
1. Railway Dashboard → Servicio → Metrics
   Muestra CPU, Memory, Network

2. Si Memory > 80%:
   - Revisar logs para queries lentas o memory leaks
   - Escalar: cambiar plan en Railway (más RAM)

3. Si CPU > 80% constantemente:
   - Agregar más réplicas en Railway (scaling horizontal)
   - O cambiar a máquina más potente
```

### Optimizaciones

**Frontend:**

```javascript
// Service Worker cachea static assets → offline-first
// Para invalidar caché: cambiar nombre en sw.js
// Ejemplo: 'rk-v4' → 'rk-v5' (en línea ~3 de sw.js)

// Listeners de Firebase son reactivos (no polling) → eficiente
// Pero ~10+ listeners activos pueden consumir memoria
// Si hay lags: evaluar si se pueden consolidar listeners
```

**Backend (Railway):**

```javascript
// Endpoints /belvo/* y /prometeo/* pueden ser lentos (externas)
// Agregar timeout: app.use(timeout('5s'))
// Agregar rate limiting: npm install express-rate-limit
// Ver ejemplos en SECURITY.md
```

**Firebase:**

```
1. Indexar campos frecuentes:
   Firebase Console → Realtime Database → Indexes
   Agregar índice para: empresas/X/proyectos/Y/ingresos/ventas (fecha)

2. Limitar reads/writes en reglas:
   Actual: `.read: "auth != null"` → lee TODA la rama
   Mejor: `.read: "auth != null && query.isValid()"`  (si Firebase permite)

3. Separar datos por volumen:
   Si /global/proveedores crece mucho, considerar archivar viejos
```

---

## Actualización de código

### Frontend (index.html)

```bash
# El archivo se despliega automáticamente en GitHub Pages

# Workflow:
1. Hacer cambios en index.html (local)
2. git add index.html
3. git commit -m "Fix: descripción"
4. git push origin main

# GitHub Pages redeploy automático (~30 seg)
# Verificar en https://speranzaemiliano-rk.github.io/mi-app/

# Si algo sale mal: git revert <hash-commit> && git push
```

### Backend (functions/server.js)

```bash
# Railway detecta cambios en functions/ automáticamente

# Workflow:
1. Hacer cambios en functions/server.js (local)
2. git add functions/server.js
3. git commit -m "Fix: descripción"
4. git push origin main

# Railway redeploy automático (~1-2 min)
# Verificar en Railway Dashboard → Deploy Logs

# Si algo sale mal:
# Option 1: git revert && git push (rollback)
# Option 2: Railway → Servicio → Deployments → Rollback a versión anterior
```

### Firebase reglas

```bash
# Las reglas se publican desde la consola o CLI

# Localmente (con firebase-cli):
firebase deploy --only database

# O en Firebase Console:
# Realtime Database → Rules → editar → Publicar
```

### Versionado

**Mantener un CHANGELOG:**

```markdown
# CHANGELOG.md

## [1.5.0] - 2026-07-15
- Feat: importar automático de comprobantes ARCA
- Fix: XSS en campo de observaciones
- Security: API token requerido en backend

## [1.4.0] - 2026-07-02
- Feat: módulo de Desarrollos + Aportantes
- Fix: movimientos bancarios duplicados
```

**Tags en git:**

```bash
git tag -a v1.5.0 -m "Release 1.5.0"
git push origin v1.5.0
```

---

## Troubleshooting operativo

### "Firebase auth no funciona"

```javascript
// En consola:
firebase.auth().currentUser  // null = no autenticado

// Causas:
1. firebaseConfig incorrecto → copiar de Firebase Console
2. Rules demasiado restrictivas → revisar database.rules.json
3. Cookies/localStorage bloqueadas → modo incógnito
4. Firebase project deshabilitado → habilitar en Firebase Console
```

### "Backend devuelve 502 Bad Gateway"

```bash
# Railway está caído o crashing

# Diagnosticar:
1. Railway Dashboard → Logs → ver error
2. Causas típicas:
   - process.env variable mal (undefined → crash)
   - Certificado AFIP corrupto
   - Node.js version incompatible

# Solución:
1. Revisar Deploy Logs en Railway
2. Corregir el problema (variable, código, etc.)
3. Hacer push a main → redeploy automático
```

### "Pongo datos pero no aparecen"

```javascript
// Síntomas: click "Guardar" pero no se ve nada en tabla

// Causas:
1. Listener de Firebase no disparó (falta conexión)
2. Datos guardados en ruta incorrecta
3. Reglas de Firebase rechazan write

// Diagnosticar:
// En consola:
db.ref('empresas/X/proyectos/Y/datos').once('value').then(s => console.log(s.val()));

// Si devuelve null → datos no se guardaron
// Revisar error en la función persistir():
// Buscar: console.error() o .catch() handlers
```

### "El PDF no se descarga"

```bash
# Mail llega pero "Sin permiso de descarga"

# Causa: reglas de Firebase no permiten leer temp-pdf

# Solución:
# Firebase Console → Realtime Database → Rules:
{
  "rules": {
    "temp-pdf": {
      "$docId": {
        ".read": true,  // ← público (pero con expiración, idealmente)
        ".write": "auth != null"
      }
    }
  }
}

# Publicar → problema resuelto
```

---

*Última actualización: 2026-07-02. Para cambios en procedimientos, editar este archivo.*
