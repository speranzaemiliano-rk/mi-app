/* Versión de prueba — datos base: usuarios, roles, configuración y el esqueleto de empresas/proyectos.
   Cada semilla recibe un objeto vacío y lo llena con la misma forma que tiene la base real. */
(window.DEMO_SEEDS = window.DEMO_SEEDS || []).push(function (r) {
    // Quién es quién. El usuario de la demo es superadmin para que se vea todo; los otros llenan Config → Usuarios.
    r.roles = { 'demo-user': 'superadmin', 'demo-admin': 'admin', 'demo-editor': 'editor', 'demo-lector': 'lector' };
    r.usuarios = {
        'demo-user':   { email: 'demo@mess.app', nombre: 'Usuario de prueba', ultimoAcceso: Date.now(),
                         // un solo módulo habilitado = se entra derecho al Sistema, sin la pantalla «¿A dónde entrás?»
                         modulos: { sistema: true, caja: false, obra: false, finalobra: false, documentacion: false, unidades: false } },
        'demo-admin':  { email: 'administracion@constructora-demo.com', nombre: 'Laura Fernández', ultimoAcceso: Date.now() - 86400000 * 2 },
        'demo-editor': { email: 'compras@constructora-demo.com', nombre: 'Martín Gómez', ultimoAcceso: Date.now() - 86400000 * 5 },
        'demo-lector': { email: 'socio@constructora-demo.com', nombre: 'Pablo Ruiz', ultimoAcceso: Date.now() - 86400000 * 9 }
    };
    r.global = r.global || {};
    r.global.config = { backendUrl: 'https://backend-demo.invalid' };

    // Esqueleto: las semillas de cada módulo cuelgan sus colecciones de empresas/<id>/proyectos/<id>/…
    r.empresas = {
        emp_demo_1: {
            nombre: 'Constructora Los Álamos S.A.',
            datos: { cuit: '30-71234567-8', codigo: 'CLA', tipoPersona: 'juridica', condIva: 'responsable_inscripto', iibb: '901-123456-7',
                     inicioAct: '2014-03-01', direccion: 'Av. del Libertador 4500, Piso 8', ciudad: 'CABA', provincia: 'Buenos Aires', cp: 'C1426',
                     telefono: '11 5555-0101', email: 'administracion@constructora-demo.com', web: 'www.constructora-demo.com', responsable: 'Laura Fernández' },
            proyectos: { proy_alamos: { nombre: 'Edificio Los Álamos' } }
        },
        emp_demo_2: {
            nombre: 'Inmobiliaria Del Plata S.R.L.',
            datos: { cuit: '30-70987654-3', codigo: 'IDP', tipoPersona: 'juridica', condIva: 'responsable_inscripto', iibb: '901-654321-0',
                     inicioAct: '2018-08-01', direccion: 'Av. Santa Fe 2200, Piso 3', ciudad: 'CABA', provincia: 'Buenos Aires', cp: 'C1123',
                     telefono: '11 5555-0202', email: 'alquileres@delplata-demo.com', web: 'www.delplata-demo.com', responsable: 'Carolina Vidal' },
            proyectos: { proy_plata: { nombre: 'Cartera de alquileres' } }
        }
    };
});
