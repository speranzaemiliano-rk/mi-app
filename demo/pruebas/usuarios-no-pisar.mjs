// Ingreso a la app: anotar al usuario en `usuarios/<uid>` (email + último acceso) NO debe borrar el resto del nodo.
// Antes, onAuthStateChanged hacía REF_USUARIOS.child(uid).set({email, ultimoAcceso}) y reemplazaba el nodo entero: en cada ingreso se
// perdían `modulos` (qué módulos ve la persona), `nombre` y cualquier otro campo cargado. Ahora hace update() de esos dos campos.
// Corre contra la demo (base en memoria). Uso: node usuarios-no-pisar.mjs   (ver README: hace falta bajar-cdn.sh antes)
import { abrirDemo, entrarAlSistema } from './demo-lib.mjs';

const res = [];
const ok = (n, c, x) => res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]);

// Script que corre antes que cualquier otro de la página: engancha __demoDB (lo crea demo-core.js) y, justo después de sembrar la
// base de ejemplo —y antes de que la app “entre”— deja el nodo del usuario de la demo con lo que cada escenario necesita.
function preparar(cuerpo) {
  return `(function () {
    var real;
    Object.defineProperty(window, '__demoDB', { configurable: true,
      get: function () { return real; },
      set: function (v) {
        real = v;
        var sembrar = v.sembrar;
        v.sembrar = function () { sembrar.apply(this, arguments); (function (DB) { ${cuerpo} })(v); };
      } });
  })();`;
}

// ───── Escenario A: el usuario ya tiene un nodo con campos propios ─────
// (la semilla de la demo ya le deja `nombre` y `modulos`; acá se suman un campo ajeno y claves de visibilidad del menú)
const ANTES = 1000;   // un «último acceso» viejo para poder ver que se actualizó
{
  const { b, p, errores } = await abrirDemo({ init: preparar(`
    DB.escribir('usuarios/demo-user/ultimoAcceso', ${ANTES});
    DB.escribir('usuarios/demo-user/campoAjeno', { a: 1, b: 'x' });
    DB.escribir('global/config/menuVisibilidad/global/clave_prueba_global', false);
    DB.escribir('global/config/menuVisibilidad/usuarios/demo-user/clave_prueba_global', true);
  `) });
  const entro = await entrarAlSistema(p);
  ok('A: la app entra', entro);
  await p.waitForTimeout(500);
  const leer = (ruta) => p.evaluate(r => __demoDB.leer(r), ruta);
  const u = await leer('usuarios/demo-user');
  ok('A: el nodo del usuario existe', !!u, JSON.stringify(u));
  ok('A: conserva `modulos` (qué módulos ve la persona)', !!u && !!u.modulos && u.modulos.sistema === true && u.modulos.caja === false && u.modulos.unidades === false, JSON.stringify(u && u.modulos));
  ok('A: conserva `nombre`', !!u && u.nombre === 'Usuario de prueba', JSON.stringify(u && u.nombre));
  ok('A: conserva un campo cualquiera que el código no maneja', !!u && !!u.campoAjeno && u.campoAjeno.a === 1 && u.campoAjeno.b === 'x', JSON.stringify(u && u.campoAjeno));
  ok('A: sigue anotado el email', !!u && u.email === 'demo@mess.app', JSON.stringify(u && u.email));
  ok('A: `ultimoAcceso` se actualizó (ya no es el viejo y es de hace un instante)', !!u && typeof u.ultimoAcceso === 'number' && u.ultimoAcceso > ANTES && Math.abs(Date.now() - u.ultimoAcceso) < 60000, JSON.stringify(u && u.ultimoAcceso));
  ok('A: el nodo no ganó campos de más (sólo los suyos + email/ultimoAcceso)', !!u && Object.keys(u).sort().join() === 'campoAjeno,email,modulos,nombre,ultimoAcceso', JSON.stringify(u && Object.keys(u)));
  // las claves de visibilidad del menú por usuario viven en global/config/menuVisibilidad/usuarios/<uid>/<clave> (no en usuarios/<uid>)
  ok('A: las claves de visibilidad del menú siguen (global y por usuario)', (await leer('global/config/menuVisibilidad/global/clave_prueba_global')) === false && (await leer('global/config/menuVisibilidad/usuarios/demo-user/clave_prueba_global')) === true);
  // los demás usuarios no se tocan
  const adm = await leer('usuarios/demo-admin');
  ok('A: el nodo de otro usuario no cambió', !!adm && adm.nombre === 'Laura Fernández' && adm.email === 'administracion@constructora-demo.com', JSON.stringify(adm));
  const erroresApp = errores.filter(e => !/net::|Failed to load resource|favicon/i.test(e));
  ok('A: sin errores de JS en el ingreso', erroresApp.length === 0, erroresApp.slice(0, 3).join(' | '));
  await b.close();
}

// ───── Escenario B: la primera vez que entra (todavía no tiene nodo en `usuarios`) ─────
{
  const { b, p, errores } = await abrirDemo({ init: preparar(`DB.escribir('usuarios/demo-user', null);`) });
  const entro = await entrarAlSistema(p);
  ok('B: la app entra aunque el usuario no tuviera nodo', entro);
  await p.waitForTimeout(500);
  const u = await p.evaluate(() => __demoDB.leer('usuarios/demo-user'));
  ok('B: se lo anota con email y último acceso (el nodo se crea)', !!u && u.email === 'demo@mess.app' && typeof u.ultimoAcceso === 'number' && Math.abs(Date.now() - u.ultimoAcceso) < 60000, JSON.stringify(u));
  ok('B: y nada más', !!u && Object.keys(u).sort().join() === 'email,ultimoAcceso', JSON.stringify(u && Object.keys(u)));
  const erroresApp = errores.filter(e => !/net::|Failed to load resource|favicon/i.test(e));
  ok('B: sin errores de JS', erroresApp.length === 0, erroresApp.slice(0, 3).join(' | '));
  await b.close();
}

// ───── Escenario C: el nombre que se carga desde Config → Usuarios sobrevive a un ingreso ─────
// (guardarEdicionUsuario ya usaba update; el ingreso era el que lo borraba)
{
  const { b, p } = await abrirDemo({ init: preparar(`DB.escribir('usuarios/demo-user/nombre', 'Nombre cargado por el admin'); DB.escribir('usuarios/demo-user/ultimoAcceso', ${ANTES});`) });
  await entrarAlSistema(p);
  await p.waitForTimeout(500);
  const u = await p.evaluate(() => __demoDB.leer('usuarios/demo-user'));
  ok('C: el nombre cargado por el admin sigue después del ingreso', !!u && u.nombre === 'Nombre cargado por el admin', JSON.stringify(u));
  await b.close();
}

res.forEach(r => console.log(r[0] + ' ' + r[1] + (r[2] ? '  → ' + r[2] : '')));
const bien = res.filter(r => r[0].trim() === 'OK').length;
console.log('\n' + bien + '/' + res.length + ' OK');
process.exit(bien === res.length ? 0 : 1);
