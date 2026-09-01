// ════════════════════════════════════════════════════════════════════════
//  CONFIGURACIÓN — Tablero de final de obra
//
//  Es el ÚNICO archivo que hay que tocar para cambiar a qué proyecto de
//  Firebase sincroniza el tablero. No hace falta abrir index.html.
//
//  ⚠️ Usa el MISMO proyecto que la planilla de obra (`control-caja`), que
//  está a propósito separado del sistema de gestión: allá las reglas le
//  dan lectura de `empresas` a cualquiera que tenga rol, aunque sea
//  `lector`, así que darle cuenta a un capataz o a un contratista le
//  abriría toda la contabilidad. Acá no: este proyecto sólo tiene la obra.
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
//     Users → "Agregar usuario". No hay alta pública en el tablero.
//
//  2) Realtime Database → Reglas → publicar esto, SUMÁNDOLO a lo que ya
//     esté publicado para `parteObra` (no lo reemplaces, o se cae la
//     planilla de personal):
//
//     {
//       "rules": {
//         ".read": false,
//         ".write": false,
//         "parteObra": { "...lo que ya tenías, tal cual..." },
//         "finalObra": {
//           "$obra": {
//             ".read":  "auth != null && auth.token.email === 'alguien@ejemplo.com'",
//             ".write": "auth != null && auth.token.email === 'alguien@ejemplo.com'",
//             "$seccion": {
//               ".validate": "$seccion === 'rubros' || $seccion === 'entidades' || $seccion === 'items' || $seccion === 'obra'"
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
//
//     Conviene que sea la MISMA lista que `parteObra`: quien entra a la
//     obra entra a las dos pantallas con la misma cuenta.
//
//  Si falta la apiKey o la databaseURL, el tablero funciona igual: guarda
//  en el equipo y el botón ☁ avisa que falta configurar.
// ════════════════════════════════════════════════════════════════════════
window.FINAL_OBRA_CONFIG = {
  firebase: {
    // Proyecto "control-caja", el mismo de la planilla de obra y separado
    // del sistema de gestión. La apiKey hace falta para el login.
    apiKey:      "AIzaSyA8GzV2O8GTwCatLmSdfII8vL1-QN2EiH0",
    databaseURL: "https://control-caja-965ad-default-rtdb.firebaseio.com",
    projectId:   "control-caja-965ad",
    authDomain:  "control-caja-965ad.firebaseapp.com"
  },
  // Nodo donde se guarda esta obra: los datos viven en finalObra/<obraId>.
  // Si algún día hay más de una obra, cada una lleva el suyo ("obra1",
  // "obra2"…) y no se mezclan.
  obraId: "obra1",
  // Nombre por defecto de la obra (sale en el encabezado, en el informe y
  // en lo que se manda por WhatsApp). Es sólo el valor inicial: se cambia
  // desde la app en Ajustes → «Nombre de la obra», y ese nombre viaja a la
  // nube, así que no hace falta publicar el sitio para corregirlo.
  obraNombre: "Final de obra"
};
