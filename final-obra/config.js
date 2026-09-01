// ════════════════════════════════════════════════════════════════════════
//  CONFIGURACIÓN — Tablero de final de obra
//
//  Es el ÚNICO archivo que hay que tocar para cambiar a qué proyecto de
//  Firebase sincroniza el tablero. No hace falta abrir index.html.
//
//  ⚠️ Usa un proyecto de Firebase PROPIO, sólo para este tablero, como
//  cada una de las otras apps: el sistema tiene "Sistema RK", la caja
//  diaria "Caja RK Final" y el parte de personal "Control Personal Obra"
//  (cuyo id, control-caja-965ad, engaña: NO es el de la caja).
//
//  El motivo es que acá entra otra gente: al final de obra lo recorren la
//  dirección de obra y los contratistas, mientras que el parte de personal
//  guarda la nómina con nombre y CUIL. Con base propia, una regla mal
//  escrita acá no puede tocar nada de lo otro.
//
//  Cómo conseguir estos valores:
//    Firebase Console → el proyecto → ⚙️ Configuración del proyecto →
//    "Tus apps" → app web → SDK de Firebase → "Configuración".
//
//  Estos valores NO son secretos: viajan igual al navegador de cualquiera
//  que abra la página. Lo que protege los datos son las reglas y el login.
//
//  ── Qué hay que hacer en ese proyecto (una sola vez) ─────────────────
//
//  1) Realtime Database → "Crear base de datos". Cualquier región sirve;
//     empezá en modo bloqueado, las reglas se pegan en el paso 3.
//
//  2) Authentication → Sign-in method → habilitar "Correo electrónico/
//     contraseña". Las cuentas se crean a mano desde Authentication →
//     Users → "Agregar usuario". No hay alta pública en el tablero.
//
//  3) Realtime Database → Reglas → pegar esto, con los mails que tengan
//     que entrar. Como el proyecto es sólo del tablero, va el archivo
//     ENTERO: se reemplaza lo que haya.
//
//     {
//       "rules": {
//         ".read": false,
//         ".write": false,
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
//     No hace falta acordarse de nada de esto: si la cuenta entra pero las
//     reglas no la dejan, el botón ☁ del tablero muestra el texto exacto
//     —con el mail ya puesto— y un botón para copiarlo.
//
//  Si falta la apiKey o la databaseURL, el tablero funciona igual: guarda
//  en el equipo y el botón ☁ avisa que falta configurar.
// ════════════════════════════════════════════════════════════════════════
window.FINAL_OBRA_CONFIG = {
  firebase: {
    // Proyecto "Final de Obra" (el id quedó como dash-rk de un nombre
    // anterior: Firebase no deja cambiarlo, es sólo cosmético).
    //
    // ⬇️ FALTA la apiKey. Sale de Firebase Console → ⚙️ Configuración del
    //    proyecto → "Tus apps" → agregar app **Web** (</>) → SDK de
    //    Firebase → "Configuración". Mientras esté vacía el tablero guarda
    //    sólo en cada equipo y el botón ☁ lo dice; no se rompe nada.
    apiKey:      "",
    // Verificado contra el servidor: la base existe y está en la región de
    // EE.UU. (por eso firebaseio.com y no firebasedatabase.app).
    databaseURL: "https://dash-rk-default-rtdb.firebaseio.com",
    projectId:   "dash-rk",
    authDomain:  "dash-rk.firebaseapp.com"
  },

  // El proyecto de arriba es sólo de este tablero (no lo comparte con la
  // caja ni con el parte de personal). Con esto en true, la pantalla de
  // "falta habilitar tu cuenta" muestra el archivo de reglas COMPLETO para
  // reemplazar de una, que es lo más difícil de hacer mal. Si algún día se
  // compartiera la base con otra app, poner false: ahí muestra sólo el
  // bloque a insertar, para no llevarse puestas las reglas de la otra.
  proyectoPropio: true,
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
