// ════════════════════════════════════════════════════════════════════════
//  BASE DE DATOS DE LA PLANILLA DE OBRA
//
//  Este es el ÚNICO archivo que hay que tocar para cambiar a qué proyecto
//  de Firebase sincroniza la planilla. No hace falta abrir index.html.
//
//  ⚠️ Usa un proyecto de Firebase SEPARADO del sistema de gestión, a
//  propósito. En el proyecto del sistema las reglas le dan lectura de
//  `empresas` a cualquiera que tenga rol, aunque sea `lector`: darle
//  cuenta ahí al capataz le abriría toda la contabilidad. Acá no.
//
//  Cómo conseguir estos valores:
//    Firebase Console → el proyecto → ⚙️ Configuración del proyecto →
//    "Tus apps" → app web → SDK de Firebase → "Configuración".
//
//  Estos valores NO son secretos: viajan igual al navegador de cualquiera
//  que abra la página. Lo que protege los datos son las reglas y el login.
//
//  ── Qué hay que hacer en ese proyecto ────────────────────────────────
//
//  1) Authentication → Sign-in method → habilitar "Correo electrónico/
//     contraseña". Las cuentas se crean a mano desde Authentication →
//     Users → "Agregar usuario". No hay alta pública en la planilla.
//
//  2) Realtime Database → Reglas → publicar esto, con los mails que
//     tengan que entrar:
//
//     {
//       "rules": {
//         ".read": false,
//         ".write": false,
//         "parteObra": {
//           "$obra": {
//             ".read":  "auth != null && auth.token.email === 'alguien@ejemplo.com'",
//             ".write": "auth != null && auth.token.email === 'alguien@ejemplo.com'",
//             "$seccion": {
//               ".validate": "$seccion === 'gremios' || $seccion === 'personal' || $seccion === 'dias'"
//             }
//           }
//         }
//       }
//     }
//
//     La lista de habilitados vive DENTRO de las reglas, no en un nodo de
//     datos: tener cuenta no alcanza, el mail tiene que estar ahí. Para
//     sumar gente se encadena con ||:
//       "auth != null && (auth.token.email === 'a@x.com' || auth.token.email === 'b@x.com')"
//     Antes esto se resolvía con un nodo `permitidos/<uid>`; se cambió
//     porque crear ese nodo anidado a mano en la consola es fácil de
//     equivocar, y esta forma no necesita tocar los datos.
//
//  Si falta la apiKey o la databaseURL, la planilla funciona igual:
//  guarda en el equipo y el botón ☁ avisa que falta configurar.
// ════════════════════════════════════════════════════════════════════════
window.OBRA_CONFIG = {
  firebase: {
    // Proyecto "control-caja", separado del sistema de gestión.
    // La apiKey hace falta para el login (Authentication).
    apiKey:      "AIzaSyA8GzV2O8GTwCatLmSdfII8vL1-QN2EiH0",
    databaseURL: "https://control-caja-965ad-default-rtdb.firebaseio.com",
    projectId:   "control-caja-965ad",
    authDomain:  "control-caja-965ad.firebaseapp.com"
  },
  // Nodo donde se guarda esta obra. Si algún día hay más de una obra en el
  // mismo proyecto, cada una lleva el suyo ("obra1", "obra2"…).
  obraId: "obra1"
};
