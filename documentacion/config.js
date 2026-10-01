// ════════════════════════════════════════════════════════════════════════
//  CONFIGURACIÓN — DOCUMENTACIÓN, ESCRIBANÍA Y CONTABLE
//
//  Este es el ÚNICO archivo que hay que tocar para apuntar el módulo a otro
//  proyecto de Firebase. No hace falta abrir index.html.
//
//  ⚠️ A DIFERENCIA de `obra/` y `final-obra/`, este módulo usa EL MISMO
//  proyecto de Firebase que el sistema de gestión, a propósito:
//
//    · Son las MISMAS personas. El contador, el escribano interno y quien
//      carga facturas ya tienen cuenta y rol ahí; pedirles una segunda
//      cuenta para subir una escritura no tiene sentido.
//    · Los permisos ya están resueltos: `roles/<uid>` decide quién entra y
//      quién puede escribir, igual que en el resto del sistema.
//    · Los documentos se ordenan por EMPRESA y PROYECTO, y ese árbol vive
//      en el nodo `empresas` de este mismo proyecto. Con una base separada
//      habría que duplicarlo y mantenerlo sincronizado a mano.
//    · Como es el mismo origen (la misma dirección web) y el mismo
//      proyecto, la sesión abierta en el sistema vale acá: se entra desde
//      «¿A dónde entrás?» sin volver a loguearse.
//
//  El razonamiento que llevó a separar `obra/` NO aplica acá: ahí el riesgo
//  era darle cuenta del sistema a un capataz o a un contratista, porque
//  `empresas` se lee con cualquier rol y eso le abriría la contabilidad.
//  Acá el público es el mismo que ya ve la contabilidad.
//
//  Estos valores NO son secretos: viajan igual al navegador de cualquiera
//  que abra la página. Lo que protege los datos son las reglas y el login.
//
//  ── Qué hay que hacer para que funcione ──────────────────────────────
//
//  Publicar en Firebase → Realtime Database → Reglas la rama
//  `documentacion` que está en `database.rules.json` (en la raíz del
//  repositorio). Ojo con esto: el archivo del repo NO se aplica solo, hay
//  que pegarlo en la consola. Sin esa rama, Firebase niega todo en
//  silencio y el módulo abre vacío sin dar ningún error.
// ════════════════════════════════════════════════════════════════════════
window.DOCU_CONFIG = {
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
  // Tope por archivo, en MB. El contenido se guarda en la base (base64), así
  // que cada archivo que entra acá hace crecer la base de datos. Subirlo mucho
  // es posible pero se paga en tamaño y en tiempo de carga.
  maxMB: 20,
  // Etiquetas sugeridas al subir. Son libres: se puede escribir cualquier otra.
  etiquetas: ['Escritura', 'Posesión', 'Fondos', 'Contable', 'Plano', 'Reglamento',
              'Boleto', 'Impuestos', 'Seguro', 'Contrato', 'Acta', 'Otro'],
  brand: {
    nombre: 'Documentación',
    tagline: 'Escribanía y contable',
    logo: '../assets/mess-logo.svg'
  }
};
