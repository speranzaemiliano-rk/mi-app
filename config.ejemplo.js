// ════════════════════════════════════════════════════════════════════════
//  PLANTILLA DE CONFIGURACIÓN — copia en blanco para un cliente nuevo
//
//  Cómo usar (ver CLONAR.md para el paso a paso completo):
//    1. Copiá este archivo a  config.js   (reemplazando el que venga).
//    2. Completá los valores marcados con  ⬅ COMPLETAR  con los del cliente.
//    3. Publicá. Cada cliente usa SU propio Firebase → sus datos quedan
//       separados y la instalación de RK no se toca.
//
//  ⚠️ IMPORTANTE: en un clon, config.js es OBLIGATORIO. Si falta o no carga,
//     la app usa por defecto la base de RK (respaldo). O sea: sin este archivo
//     bien completado, el cliente terminaría escribiendo en la base de RK.
// ════════════════════════════════════════════════════════════════════════
window.APP_CONFIG = {
  // ── Base de datos del cliente (Firebase) ──────────────────────────────
  // Consola de Firebase → ⚙️ Configuración del proyecto → "Tus apps" → Web.
  // Cada cliente DEBE tener su PROPIO proyecto de Firebase.
  firebaseConfig: {
    apiKey:            "",   // ⬅ COMPLETAR
    authDomain:        "",   // ⬅ COMPLETAR  (ej: mi-cliente.firebaseapp.com)
    databaseURL:       "",   // ⬅ COMPLETAR  (ej: https://mi-cliente-default-rtdb.firebaseio.com)
    projectId:         "",   // ⬅ COMPLETAR
    storageBucket:     "",   // ⬅ COMPLETAR
    messagingSenderId: "",   // ⬅ COMPLETAR
    appId:             ""    // ⬅ COMPLETAR
  },

  // Mail que será Super Administrador la PRIMERA vez que entre (se auto-asigna).
  adminEmail: "",            // ⬅ COMPLETAR

  // URL del backend (Railway) para ARCA / bancos / asistente. Se puede compartir
  // con otros clientes o dejar uno propio. Si el cliente no usa ARCA al principio,
  // se puede dejar vacío y completar después desde Config → 🔗 URL del backend.
  backendUrl: "",

  // ── Ingreso con Microsoft (opcional) ──────────────────────────────────
  msLogin: false,            // true sólo si el cliente usa Microsoft 365 de empresa
  msTenant: "",              // ID del tenant de Entra (vacío = cualquier cuenta Microsoft)

  // ── Integraciones opcionales ──────────────────────────────────────────
  spotifyClientId: "",       // reproductor de Spotify (público, opcional)
  emailjs: { serviceId: "", templateId: "", publicKey: "" },  // enviar facturas por mail

  // ── Marca (se puede cambiar después desde Config → 🎨 Marca) ───────────
  brand: {
    nombre:      "Nexa · Sistema de Gestión",  // ⬅ COMPLETAR (título de la pestaña)
    nombreCorto: "Nexa",                       // ⬅ COMPLETAR (nombre de la app instalada)
    siglas:      "Nx",                         // ⬅ COMPLETAR (anillo del login)
    tagline:     "Sistema de Gestión",
    razonSocial: "Nexa",
    asistente:   "Asistente Nexa",
    // Logo del producto (barra lateral / presentación). Puede ser una URL o un
    // archivo del repo. Por defecto usa el logo genérico de Nexa.
    logo:        "assets/mess-logo.svg",
    // Logo de la empresa del cliente (login). Vacío = usa sólo el del producto.
    logoEmpresa: ""
  }
};
