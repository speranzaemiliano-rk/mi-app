// ════════════════════════════════════════════════════════════════════════
//  BASE DE DATOS DE LA PLANILLA DE OBRA
//
//  Este es el ÚNICO archivo que hay que tocar para cambiar a qué proyecto
//  de Firebase sincroniza la planilla. No hace falta abrir index.html.
//
//  ⚠️ Conviene usar un proyecto de Firebase SEPARADO del sistema de gestión.
//  El nodo de la obra es de lectura y escritura abierta para cualquiera que
//  tenga el código del link (no hay login, es a propósito). En un proyecto
//  aparte, un error en esas reglas no puede tocar la contabilidad.
//
//  Cómo conseguir estos valores:
//    Firebase Console → el proyecto → ⚙️ Configuración del proyecto →
//    "Tus apps" → app web → SDK de Firebase → "Configuración".
//    De todo lo que muestra, acá sólo hacen falta estos tres.
//
//  Estos valores NO son secretos: viajan igual al navegador de cualquiera
//  que abra la página. Lo que protege los datos son las reglas de Firebase.
//
//  Reglas que hay que publicar en ESE proyecto (Realtime Database → Reglas):
//
//    {
//      "rules": {
//        ".read": false,
//        ".write": false,
//        "parteObra": {
//          "$codigo": {
//            ".read":  "$codigo.length >= 20",
//            ".write": "$codigo.length >= 20",
//            "$seccion": {
//              ".validate": "$seccion === 'gremios' || $seccion === 'personal' || $seccion === 'dias'"
//            }
//          }
//        }
//      }
//    }
//
//  Si este archivo falta o queda vacío, la planilla funciona igual: guarda
//  en el equipo y el botón ☁ avisa que falta configurar la base.
// ════════════════════════════════════════════════════════════════════════
window.OBRA_CONFIG = {
  firebase: {
    // Proyecto "control-caja", separado del sistema de gestión.
    // apiKey sólo hace falta si algún día se agrega login: la Realtime
    // Database se maneja con la databaseURL y las reglas.
    apiKey:      "",
    databaseURL: "https://control-caja-965ad-default-rtdb.firebaseio.com",
    projectId:   "control-caja-965ad"
  }
};
