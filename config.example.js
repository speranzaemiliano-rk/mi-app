// ════════════════════════════════════════════════════════════════════════
//  PLANTILLA de configuración por instalación (white-label)
//
//  Cómo usarla al clonar el sistema para una empresa nueva:
//    1. Copiá este archivo a "config.js"  (cp config.example.js config.js)
//    2. Reemplazá TODOS los valores <ENTRE_ANGULOS> por los del cliente.
//    3. NO subas el config.js del cliente al repo de RK.
//
//  ⚠️ Este archivo NO tiene datos reales: es solo el molde. El config.js de RK
//     (con los valores reales de RK) vive aparte y no se toca.
// ════════════════════════════════════════════════════════════════════════
window.APP_CONFIG = {
  // Consola de Firebase → ⚙️ Config del proyecto → "Tus apps" → SDK web.
  // Cada cliente DEBE tener su PROPIO proyecto de Firebase (base separada).
  firebaseConfig: {
    apiKey: "<FIREBASE_API_KEY>",
    authDomain: "<PROYECTO>.firebaseapp.com",
    databaseURL: "https://<PROYECTO>-default-rtdb.firebaseio.com",
    projectId: "<PROYECTO>",
    storageBucket: "<PROYECTO>.firebasestorage.app",
    messagingSenderId: "<SENDER_ID>",
    appId: "<APP_ID>"
  },
  // Mail que será Super Administrador la primera vez que entre.
  adminEmail: "<ADMIN@EMPRESA.COM>",
  // URL del backend (Railway). Si el cliente no usa ARCA/bancos, puede quedar vacío "".
  backendUrl: "<https://TU-BACKEND.up.railway.app>",
  // Opcional (reproductor de Spotify). Client ID público. Vacío = sin Spotify propio.
  spotifyClientId: "",
  // Opcional (envío de facturas por mail).
  emailjs: { serviceId: "", templateId: "", publicKey: "" },
  // Marca. Por defecto viene la del producto (Mess). Cambiala por la del cliente
  // acá o después desde la app (Config → 🎨 Marca). Si borrás este bloque, usa Mess.
  brand: {
    nombre: "Mess · Software de Gestión",
    nombreCorto: "Mess",
    siglas: "Ms",
    tagline: "Software de Gestión",
    razonSocial: "Mess",
    asistente: "Asistente Mess",
    logo: "assets/mess-logo.svg"   // Logo del producto. Poné la URL/ruta del logo del cliente, o "" para el logo integrado.
  }
};
