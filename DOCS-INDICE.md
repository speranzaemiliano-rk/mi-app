# 📚 Índice de Documentación — RK · Gestión Multiempresa

**Mapa de documentación actualizado 2026-07-02. Todos los archivos en raíz del repo.**

---

## 🎯 Qué documento leer según tu rol

### 👤 Usuario final
→ **README.md** (esta es la documentación de usuario)
- Cómo usar la app
- Módulos disponibles (Caja, Facturas, Ingresos, etc.)
- Flujos básicos (emitir factura, exportar datos)

### 🛠️ Desarrollador (agregar features, arreglar bugs)
1. **CLAUDE.md** — Contexto rápido (arquitectura 3 piezas, ~447 funciones, referencias de data)
2. **CONSOLIDACION.md** — Arquitectura detallada + modelo de datos + flujos integrados
3. **SECURITY.md** — Vulnerabilidades conocidas + mitigaciones
4. **code-review** o exploración del `index.html` para tareas específicas

### 🔧 Administrador de sistemas (despliegue, configuración, monitoreo)
→ **OPERACIONES.md**
- Despliegue (GitHub Pages, Railway, Firebase)
- Variables de entorno (checklist)
- Monitoreo (health checks, logs, alertas)
- Recuperación ante desastre
- Troubleshooting

### 🔐 Responsable de seguridad
1. **SECURITY.md** — Auditoría completa (8 riesgos críticos → bajos, estado actual, mitigaciones)
2. **CONSOLIDACION.md** → sección "Matriz de seguridad" (checklist antes de producción)
3. **OPERACIONES.md** → sección "Variables de entorno" (credenciales)

### 📋 Project Manager / Scrum Master
→ **PENDIENTES.md** (bitácora de tareas hechas y próximas)
- Sesiones completadas (con detalles)
- Trabajo próximo (estimación)
- Bloqueantes y dependencias

---

## 📄 Documentos del repo

### Core (lectura obligatoria por rol)

| Archivo | Propósito | Audiencia | Líneas | Última actualización |
|---------|-----------|-----------|--------|---------------------|
| **README.md** | Documentación de usuario + guía de uso | Usuarios finales, PMs | 363 | 2026-06-28 |
| **CONSOLIDACION.md** ⭐ NUEVO | Arquitectura consolidada, modelo datos, flujos, matriz seguridad | Devs, architecure, security | 1100+ | 2026-07-02 |
| **SECURITY.md** | Auditoría de seguridad (riesgos + mitigaciones + auditoría 2026-07-24) | Devs, security, admin | 240+ | 2026-07-24 |
| **MULTIEMPRESA.md** ⭐ NUEVO | Multiusuario, APIs compartidas vs propias, plan white-label / multi-tenant | Dueño, PMs, Devs | 150+ | 2026-07-24 |
| **OPERACIONES.md** ⭐ NUEVO | Despliegue, configuración, monitoreo, troubleshooting | Admin, DevOps | 700+ | 2026-07-02 |
| **CLAUDE.md** | Contexto técnico rápido para Claude Code | Devs (en sesiones de Claude) | 120 | 2026-07-02 |
| **PENDIENTES.md** | Bitácora de tareas + hecho/próximo | PMs, Devs | 230 | 2026-07-02 |

### Configuración (referencia)

| Archivo | Propósito |
|---------|-----------|
| `firebase.json` | Config de despliegue Firebase Hosting + Functions |
| `.firebaserc` | Proyecto Firebase por defecto |
| `manifest.json` | Config PWA (nombre, íconos, scope) |
| `functions/package.json` | Dependencias del backend (express, @afipsdk/afip.js, belvo, etc.) |
| `.github/workflows/` (si existe) | CI/CD (tests, deploy automático) |

### Código fuente

| Archivo | Propósito | Líneas | Tecnología |
|---------|-----------|--------|------------|
| `index.html` | Aplicación completa (UI + lógica + estilos) | ~20,000 | JavaScript vanilla, HTML, CSS |
| `sw.js` | Service Worker (caché offline) | ~100 | JavaScript |
| `functions/server.js` | Backend (ARCA, Belvo, Prometeo) | ~800 | Express + Node 22 |
| `functions/index.js` | Variante Firebase Cloud Functions (deprecated) | ~400 | Cloud Functions |

---

## 🏗️ Estructura de la documentación

### Capas de documentación (como las capas del sistema)

```
┌─────────────────────────────────────────────────────────────┐
│  USUARIO FINAL                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  README.md — "Cómo usar la app" (qué hace, flujos)   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  DESARROLLADOR                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  CLAUDE.md — Contexto rápido (qué es, refs, funcs)   │  │
│  │  CONSOLIDACION.md — "Cómo está construido" (arquit)   │  │
│  │  SECURITY.md — "Qué está roto y cómo arreglarlo"     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ADMINISTRADOR / DEVOPS                                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  OPERACIONES.md — "Cómo instalarlo, monitorearlo"    │  │
│  │  CONSOLIDACION.md → "Matriz de seguridad" (checklist) │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PROJECT MANAGER                                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  PENDIENTES.md — "Qué está hecho y qué falta"        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Cómo navegar

### Pregunta: "¿Dónde está...?"

| Pregunta | Respuesta |
|----------|-----------|
| ¿Cómo emitir una factura? | README.md → [Flujo de facturación ARCA](#) |
| ¿Cómo se estructura la base de datos? | CONSOLIDACION.md → [Modelo de datos detallado](#) |
| ¿Cuáles son los riesgos de seguridad? | SECURITY.md → [Resumen ejecutivo](#) o CONSOLIDACION.md → [Matriz de seguridad](#) |
| ¿Cómo desplegar el backend? | OPERACIONES.md → [Despliegue inicial](#) |
| ¿Qué variables de entorno necesito? | OPERACIONES.md → [Variables de entorno](#) |
| ¿Cómo cambiar empresa/proyecto? | CONSOLIDACION.md → [Flujo 2](#) |
| ¿Qué módulos hay? | README.md → [Módulos funcionales](#) |
| ¿Cuántas funciones hay en el código? | CLAUDE.md o CONSOLIDACION.md → Capa 1 |
| ¿Qué está pendiente? | PENDIENTES.md |
| ¿Cómo monitorear el sistema? | OPERACIONES.md → [Monitoreo](#) |

### Pregunta: "¿Es seguro...?"

| Pregunta | Respuesta |
|----------|-----------|
| ¿Es seguro usar en producción? | **NO todavía.** SECURITY.md → [Plan de acción](#) |
| ¿Dónde vive la clave de ARCA? | Backend (Railway), nunca en navegador. CONSOLIDACION.md → Capa 3 |
| ¿Qué tan robusta es la autenticación? | Débil hoy (permisos solo en cliente). SECURITY.md → punto 2 |
| ¿Se pueden escalar privilegios? | Sí, desde consola del navegador. SECURITY.md → punto 2 |
| ¿Qué datos ve Google Gemini? | Resumen de aportantes/desarrollos/ingresos. SECURITY.md → punto 8 |

---

## 📊 Mapa mental (conceptual)

```
RK · Gestión Multiempresa
│
├─ USUARIO FINAL
│  └─ README.md: "Cómo usar"
│
├─ DESARROLLADOR
│  ├─ CLAUDE.md: Contexto rápido
│  ├─ CONSOLIDACION.md: Cómo está hecho
│  │  ├─ Arquitectura (3 capas)
│  │  ├─ Flujos integrados (4 ejemplos)
│  │  ├─ Modelo de datos (completo con ejemplos JSON)
│  │  └─ Matriz de seguridad (8 riesgos)
│  ├─ SECURITY.md: Qué está roto
│  │  ├─ 8 vulnerabilidades (CRÍTICO → BAJO)
│  │  ├─ Mitigaciones (algunas aplicadas, otras pendientes)
│  │  └─ Plan de acción (priorizado)
│  └─ Código fuente
│     ├─ index.html (20k líneas — UI + lógica)
│     ├─ functions/server.js (800 líneas — ARCA + Belvo + Prometeo)
│     └─ sw.js (100 líneas — Service Worker)
│
├─ ADMINISTRADOR / DEVOPS
│  ├─ OPERACIONES.md: Cómo instalarlo
│  │  ├─ Despliegue (GitHub Pages + Railway + Firebase)
│  │  ├─ Configuración (primera vez)
│  │  ├─ Variables de entorno (todos los ENV vars)
│  │  ├─ Monitoreo (health checks, logs, alertas)
│  │  ├─ Respaldos y recuperación
│  │  └─ Troubleshooting
│  └─ CONSOLIDACION.md → Matriz de seguridad
│     (checklist: qué verificar antes de producción)
│
└─ PROJECT MANAGER
   └─ PENDIENTES.md: Qué está hecho / qué falta
```

---

## 🚀 Checklist antes de producción

**Antes de pasar a ARCA real (facturación oficial), verificar:**

- [ ] He leído SECURITY.md y entiendo los riesgos
- [ ] He leído CONSOLIDACION.md → [Checklist operativo](#)
- [ ] He leído OPERACIONES.md → [Variables de entorno](#)
- [ ] Backend desplegado en Railway con todas las ENV vars
- [ ] Reglas de Firebase publicadas (SECURITY.md → Reglas reales propuestas)
- [ ] Certificado ARCA real (no sandbox) generado y cargado en Railway
- [ ] Punto de venta habilitado en ARCA
- [ ] APP_API_TOKEN configurado (o validación de ID token Firebase)
- [ ] CORS restringido (si aplica)
- [ ] Respaldos automáticos de Firebase habilitados
- [ ] Monitoreo configurado (logs, alertas)
- [ ] Test de emisión de factura (generará CAE real)
- [ ] Test de importación de comprobantes (si AFIP SDK está configurado)
- [ ] Test de envío de factura por mail (EmailJS)

---

## 📖 Guía rápida por sesión

### Sesión 2026-07-01 (Desarrollos + Aportantes + consolidación)
- Módulo nuevo: Desarrollos Inmobiliarios + Aportantes/Socios
- Gráficos: participación de aportantes, incidencia del terreno
- Asistente RK mejorado (responde sobre datos reales)
- XSS fixing en nuevos módulos (escHtml)
→ Ver PENDIENTES.md § "Sesión 2026-07-01"

### Sesión 2026-07-02 (Ventas → Desarrollos + consolidación + docs)
- Ventas vinculadas a Desarrollos (m² de unidad)
- Costo m² de construcción auto-calcula Costo de Obra
- Documentación consolidada: CONSOLIDACION.md, OPERACIONES.md, DOCS-INDICE.md
→ Ver PENDIENTES.md § "Sesión 2026-07-02"

---

## 🔗 Referencias cruzadas (links internos)

**Dentro de cada documento, hay secciones enlazadas. Ejemplos:**

```
CONSOLIDACION.md:
- [Arquitectura consolidada](#arquitectura-consolidada)
- [Capas del sistema](#capas-del-sistema)
- [Flujos integrados](#flujos-integrados)
- [Modelo de datos detallado](#modelo-de-datos-detallado)
- [Matriz de seguridad](#matriz-de-seguridad)
- [Checklist operativo](#checklist-operativo)

SECURITY.md:
- [Resumen ejecutivo](#resumen-ejecutivo)
- [8 riesgos (puntos 1-8)](#-1-backend-sin-autenticación)
- [Plan de acción](#-plan-de-acción-sugerido)

OPERACIONES.md:
- [Despliegue inicial](#despliegue-inicial)
- [Configuración (primera vez)](#configuración-primera-vez)
- [Variables de entorno](#variables-de-entorno)
- [Monitoreo](#monitoreo)
```

---

## 📝 Notas finales

### Documentación completa ✅
- **Qué es** → README.md
- **Cómo funciona** → CONSOLIDACION.md
- **Qué está roto** → SECURITY.md
- **Cómo instalarlo** → OPERACIONES.md
- **Qué falta** → PENDIENTES.md
- **Mapa rápido** → CLAUDE.md

### Próximas mejoras a documentación
- [ ] Diagramas UML de datos (entidades, relaciones)
- [ ] Video tutorial de despliegue (10 min)
- [ ] API reference de endpoints backend (OpenAPI/Swagger)
- [ ] Guía de troubleshooting visual (decision tree)

### Cómo mantener la documentación al día
- Editar archivos `.md` cuando se hace cambio de código
- Actualizar PENDIENTES.md después de cada sesión
- Actualizar CONSOLIDACION.md si se agrega capa o flujo
- Revisar SECURITY.md antes de cada release a producción

---

*Documentación generada 2026-07-02. Para sugerencias o correcciones, crear issue o PR.*
