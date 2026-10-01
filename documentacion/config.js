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
  // ── Con qué se editan las planillas ────────────────────────────────
  // 'google'    → Google Drive / Hojas de cálculo. No necesita licencia paga.
  //               Sheets abre el .xlsx en «modo Office» y lo guarda en ese
  //               mismo formato, sin convertirlo: va y vuelve .xlsx.
  // 'microsoft' → Excel para la web. Mejor fidelidad (lo edita Excel), pero
  //               necesita licencia de Microsoft 365 de EMPRESA.
  // Los dos caminos están hechos y probados; se cambia sólo esta línea.
  editor: 'google',

  // ── Google Drive / Hojas de cálculo ────────────────────────────────
  // El ID de cliente NO se configura acá: sale de `global/config/googleClientId`,
  // el mismo que ya usa la lectura de Gmail (Config → Lectura automática de
  // Gmail). Así hay un solo lugar donde cambiarlo.
  //
  // Qué hace falta del lado de Google, una sola vez:
  //  1) En la consola de Google Cloud, en el MISMO proyecto de ese client ID:
  //     APIs y servicios → Biblioteca → habilitar «Google Drive API».
  //  2) Pantalla de consentimiento → Permisos → agregar
  //     `.../auth/drive.file`. Ese permiso da acceso SÓLO a los archivos que
  //     crea o abre esta app: no ve el resto del Drive de nadie.
  //  3) Si la app está en modo «Prueba», sumar como usuarios de prueba a
  //     quienes vayan a editar planillas.
  google: {
    scope: 'https://www.googleapis.com/auth/drive.file',
    carpeta: 'Documentación — Mess'
  },

  // ── Editar planillas en Excel para la web (Microsoft 365) ──────────
  // El sistema sigue siendo el dueño del archivo: OneDrive es sólo el taller
  // donde Excel lo edita, y lo editado vuelve como una versión nueva acá.
  //
  // Qué hace falta del lado de Microsoft, una sola vez:
  //  1) Licencia de Microsoft 365 de EMPRESA. Excel para la web con edición no
  //     anda con una cuenta personal gratuita.
  //  2) En el registro de la app en Entra (el mismo que ya usa el botón
  //     «Continuar con Microsoft»): Permisos de API → Microsoft Graph →
  //     Permisos delegados → agregar `Files.ReadWrite` y `offline_access`, y
  //     después «Conceder consentimiento de administrador». Sin el
  //     consentimiento, a cada persona le va a pedir autorización suelta.
  //  3) Nada más. La carpeta de trabajo se crea sola en el OneDrive de quien
  //     edita, con el nombre de abajo.
  //
  // El tenant no se configura acá: sale del mismo lugar que el login del
  // sistema (`global/config/msTenant`, cacheado en localStorage rk_ms_tenant),
  // así se cambia en un solo lugar para las dos cosas.
  ms: {
    // Permisos que se le piden a Microsoft al abrir Excel. Files.ReadWrite
    // alcanza para el OneDrive de la propia persona; no toca el de nadie más.
    scopes: ['Files.ReadWrite', 'offline_access'],
    // Carpeta de trabajo dentro del OneDrive de quien edita.
    carpeta: 'Documentación — Mess',
    // Tenant por defecto, sólo si no hay ninguno guardado en la nube.
    tenant: 'ec157e74-8ae3-404a-9f98-f413ad1bb3a1'
  },
  brand: {
    nombre: 'Documentación',
    tagline: 'Escribanía y contable',
    logo: '../assets/mess-logo.svg'
  }
};
