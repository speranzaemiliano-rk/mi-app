/* Versión de prueba — ajustes que van DESPUÉS de que la app terminó de cargar (los pisan funciones que la app define sola).
   Se aplican en el evento load, antes de que llegue el primer estado de sesión (ver demo-core.js, authStub). */
window.addEventListener('load', function () {
    var NO_DISP = 'Esta función no está disponible en la versión de prueba.';
    var aviso = function (que) { return function () { alert((que ? que + ': ' : '') + NO_DISP); }; };

    // La app borra usuarios/<uid>/modulos al ingresar (REF_USUARIOS.child(uid).set({email, ultimoAcceso})), así que en la demo el
    // módulo habilitado no puede salir de la base: se fija acá. Un solo módulo = se entra derecho al Sistema.
    window._modulosDeUsuario = function () { return Promise.resolve(['sistema']); };

    // La pantalla «¿Con qué empresa y proyecto trabajamos hoy?» arranca con la empresa y el proyecto principales ya elegidos.
    window._obPendingEmpId = 'emp_demo_1';
    window._obPendingProyId = 'proy_alamos';

    // Funciones que dependen de cuentas de Google reales (consentimiento OAuth con la aplicación del dueño).
    ['abrirImportarGmail', 'impExtLeerGmail', 'impExtLeerGmailTarjeta'].forEach(function (n) {
        if (typeof window[n] === 'function') window[n] = aviso('Importar desde Gmail');
    });
});
