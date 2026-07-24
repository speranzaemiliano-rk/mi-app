// ════════════════════════════════════════════════════════════════════════
//  CONFIGURACIÓN POR INSTALACIÓN (white-label)
//
//  Este es el ÚNICO archivo que hay que editar para clonar el sistema para
//  OTRA empresa. Copiás el repositorio, cambiás estos valores por los de la
//  cuenta del nuevo cliente (su proyecto de Firebase, su backend, su mail de
//  administrador, etc.) y desplegás. NO hace falta tocar index.html.
//
//  Los valores de acá abajo son los de RK (la instalación original). Para un
//  cliente nuevo, reemplazalos por los suyos. Si este archivo falta o no
//  carga, la app usa los valores de RK por defecto (respaldo de seguridad).
//
//  Cómo conseguir cada valor:
//  - firebaseConfig  → Consola de Firebase → ⚙️ Configuración del proyecto →
//                       "Tus apps" → SDK de Firebase (config web). Cada cliente
//                       DEBE tener su PROPIO proyecto de Firebase (base separada).
//  - adminEmail      → el mail que será Super Administrador la primera vez.
//  - backendUrl      → la URL del backend en Railway (con o sin /afip al final).
//  - spotifyClientId → (opcional) para el reproductor de Spotify. Es público.
//  - emailjs         → (opcional) para enviar facturas por mail.
//  - brand           → marca inicial (después se edita desde Config → 🎨 Marca).
// ════════════════════════════════════════════════════════════════════════
window.APP_CONFIG = {
  firebaseConfig: {
    apiKey: "AIzaSyBfLKi3a6kZqkMKPQ8wRADQlUu3_NacXAA",
    authDomain: "modo-prueba-bb8c2.firebaseapp.com",
    databaseURL: "https://modo-prueba-bb8c2-default-rtdb.firebaseio.com",
    projectId: "modo-prueba-bb8c2",
    storageBucket: "modo-prueba-bb8c2.firebasestorage.app",
    messagingSenderId: "443608105017",
    appId: "1:443608105017:web:e229aca1305f72fa900de8"
  },
  adminEmail: "speranzaemiliano@gmail.com",
  backendUrl: "https://mi-app-production-e1cd.up.railway.app",
  spotifyClientId: "ea1f2e04bfdc4c8abe4a116023a5f887",
  emailjs: { serviceId: "service_rk", templateId: "template_elux62l", publicKey: "1KBtAzAFvuD2WC9T-" },
  brand: {
    nombre: "RK · Sistema de Gestión Multiempresa",
    nombreCorto: "RK Gestión",
    siglas: "RK",
    tagline: "Arquitectura · Gestión",
    razonSocial: "RK Arquitectura",
    asistente: "Asistente RK",
    logo: ""   // URL de un logo (PNG/SVG). Vacío = usa el logo RK integrado.
  }
};
