// ════════════════════════════════════════════════════════════════════════
//  CONFIGURACIÓN — UNIDADES Y VALUACIÓN
//
//  Usa EL MISMO proyecto de Firebase que el sistema de gestión (igual que
//  `documentacion/`): mismas cuentas, mismos roles, la sesión abierta vale.
//  Estos valores NO son secretos; lo que protege los datos es el login y las
//  reglas. Los datos (propietarios, teléfonos, mails) NO viven en el repo:
//  están en la base, en `global/edificios`, y sólo los lee quien tiene rol.
// ════════════════════════════════════════════════════════════════════════
window.UNID_CONFIG = {
  // Mismo proyecto que el sistema de gestión ("Sistema RK").
  firebase: {
    apiKey: "AIzaSyBfLKi3a6kZqkMKPQ8wRADQlUu3_NacXAA",
    authDomain: "modo-prueba-bb8c2.firebaseapp.com",
    databaseURL: "https://modo-prueba-bb8c2-default-rtdb.firebaseio.com",
    projectId: "modo-prueba-bb8c2",
    storageBucket: "modo-prueba-bb8c2.firebasestorage.app",
    messagingSenderId: "443608105017",
    appId: "1:443608105017:web:e229aca1305f72fa900de8"
  },
  // Valores iniciales de un edificio nuevo (después se editan en pantalla).
  inicial: { usd: 1000, tc: 215, tc2: 0 },
  brand: { nombre: 'Planilla posesiones', tagline: 'Valuación y conceptos por unidad', logo: '../assets/mess-logo.svg' }
};
