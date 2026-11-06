// ════════════════════════════════════════════════════════════════════════
//  CONFIGURACIÓN — AGENDA DE POSESIONES
//
//  Mismo proyecto de Firebase que el sistema (modo-prueba-bb8c2). Estos
//  valores NO son secretos: lo que protege los datos son las reglas de
//  `database.rules.json` (rama `agendaPosesiones`) y, en la pantalla de
//  administración, el login con rol.
// ════════════════════════════════════════════════════════════════════════
window.AGENDA_CONFIG = {
  firebase: {
    apiKey: "AIzaSyBfLKi3a6kZqkMKPQ8wRADQlUu3_NacXAA",
    authDomain: "modo-prueba-bb8c2.firebaseapp.com",
    databaseURL: "https://modo-prueba-bb8c2-default-rtdb.firebaseio.com",
    projectId: "modo-prueba-bb8c2",
    storageBucket: "modo-prueba-bb8c2.firebasestorage.app",
    messagingSenderId: "443608105017",
    appId: "1:443608105017:web:e229aca1305f72fa900de8"
  },
  // Logo del edificio: dejar el archivo en agenda/ con este nombre (si no
  // existe, la página simplemente no lo muestra).
  logoEdificio: 'logo-casa1.png',
  logoRK: 'logo-rk.svg',
  // Rango de horas que ofrece el selector del administrador (inicio de turno).
  horaMin: 7,
  horaMax: 21
};
