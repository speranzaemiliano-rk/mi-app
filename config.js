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
//  - msTenant        → (opcional) ID del directorio (tenant) de Microsoft Entra,
//                       para restringir el ingreso con Microsoft a esa organización.
//                       Portal de Azure → Microsoft Entra ID → Información general.
//                       No es un secreto. Vacío = acepta cualquier cuenta Microsoft.
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
  // Tenant de Microsoft Entra ID para el botón "Continuar con Microsoft".
  // Vacío = 'common': entra cualquier cuenta de Microsoft (de organización o
  // personal). Con el ID (o el dominio) del tenant, sólo entran las cuentas de
  // ESA organización. También se puede cambiar sin publicar el sitio desde
  // Config → 🔐 Ingreso con Microsoft (se guarda en global/config/msTenant).
  msTenant: "",
  spotifyClientId: "ea1f2e04bfdc4c8abe4a116023a5f887",
  emailjs: { serviceId: "service_rk", templateId: "template_elux62l", publicKey: "1KBtAzAFvuD2WC9T-" },
  brand: {
    nombre: "Mess · Sistema de Gestión",
    nombreCorto: "Mess",
    siglas: "Ms",
    tagline: "Sistema de Gestión",
    // Razón social del PRODUCTO (Mess), no de las empresas que lo usan.
    // Ojo: en los recibos, cuando hay una empresa seleccionada se imprime el nombre
    // de ESA empresa (emp.nombre), no este campo. Este es sólo el respaldo para
    // cuando todavía no se eligió ninguna.
    razonSocial: "Mess",
    asistente: "Asistente Mess",
    // Logo del PRODUCTO: presentación (paso 1) y barra lateral.
    logo: "assets/mess-logo.svg",
    // Logo de ESTA empresa: pantalla de ingreso y paso 2 de la presentación.
    // Acá vive la identidad de RK. Una copia para otro cliente pone la suya (o la deja
    // vacía y ve sólo la del producto): no queda ningún logo escrito en el código.
    logoEmpresa: "logo png_Mesa de trabajo 1_blanco.png"
  }
};
