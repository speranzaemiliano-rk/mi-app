// «Editar proyecto» / «Nuevo proyecto» / «Editar empresa»: guardar la ficha NUNCA debe tocar las colecciones del proyecto.
// Antes guardarProyecto escribía {nombre, datos} y `datos` es el MISMO nodo que los presupuestos del proyecto: con update() reemplazaba la
// colección entera de presupuestos por la ficha (y el alta mezclaba código/tipo/estado… como valores sueltos al lado de los presupuestos,
// con lo que Presupuestos reventaba). Ahora la ficha vive en su propio nodo (`ficha`) y se escribe campo por campo.
// Corre contra la demo (base en memoria). Uso: node editar-proyecto.mjs   (ver README: hace falta bajar-cdn.sh antes)
import { abrirDemo, entrarAlSistema, irA } from './demo-lib.mjs';
const { b, p, errores } = await abrirDemo();
const res = [];
const ok = (n, c, x) => res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]);
await entrarAlSistema(p);
await p.evaluate(() => { window.__alerts = []; window.alert = m => window.__alerts.push(String(m)); window.confirm = () => true; });

const E = 'emp_demo_1', P = 'proy_alamos', BASE = 'empresas/' + E + '/proyectos/' + P;
const leer = (ruta) => p.evaluate(r => __demoDB.leer(r), ruta);
const escribir = (ruta, v) => p.evaluate(([r, x]) => __demoDB.escribir(r, x), [ruta, v]);
const J = (x) => JSON.stringify(x);
const llenar = (valores) => p.evaluate(v => { Object.keys(v).forEach(id => { const el = document.getElementById(id); el.value = v[id]; }); }, valores);
const form = () => p.evaluate(() => { const o = {}; document.querySelectorAll('#modalProyecto input, #modalProyecto select, #modalProyecto textarea').forEach(el => { if (el.id) o[el.id] = el.value; }); return o; });
const guardarProy = async () => { await p.evaluate(() => guardarProyecto()); await p.waitForTimeout(700); };
const abrirProy = async (id) => { await p.evaluate(i => abrirModalProyecto(i), id); await p.waitForTimeout(200); };
const erroresDesde = (n) => errores.slice(n).filter(e => !/gsi|Failed to load resource|tradingview/.test(e));
// todo el proyecto salvo lo que el formulario maneja (nombre / ficha / datos)
const sinFicha = (nodo) => { const o = Object.assign({}, nodo); delete o.nombre; delete o.ficha; delete o.datos; return o; };

const CAMPOS = { proyNombre: 'Edificio Los Álamos II', proyCodigo: 'alb', proyTipo: 'refaccion', proyEstado: 'pausado', proyResponsable: 'Arq. Prueba', proyFechaInicio: '2025-03-01', proyFechaFin: '2027-06-30',
  proyDireccion: 'Av. Siempreviva 742', proyCiudad: 'CABA', proyProvincia: 'Buenos Aires', proyCP: 'C1425', proyMaps: 'https://maps.example/x', proyWeb: 'https://obra.example', proyDescripcion: 'Torre de 8 pisos', proySuperficie: '1234', proyPresupuestoEst: '9876543', proyCliente: 'Cliente Demo' };

// ───── S1: editar un proyecto con presupuestos cargados no los pierde ─────
const antes = await leer(BASE);
const nPres = Object.keys(antes.datos || {}).length;
const nMem = await p.evaluate(() => datos.length);
ok('S1: el proyecto de la demo tiene presupuestos y otras colecciones cargadas', nPres >= 5 && Object.keys(sinFicha(antes)).length >= 3, 'datos=' + nPres + ' claves=' + Object.keys(antes).join(','));
await abrirProy(P);
const pre = await form();
ok('S1: el formulario abre con el nombre del proyecto', pre.proyNombre === 'Edificio Los Álamos', pre.proyNombre);
await llenar(CAMPOS);
await guardarProy();
const desp = await leer(BASE);
ok('S1: los presupuestos siguen EXACTAMENTE igual (los mismos ' + nPres + ', sin tocar)', J(desp.datos) === J(antes.datos), 'antes=' + nPres + ' ahora=' + Object.keys(desp.datos || {}).length);
ok('S1: dentro de «datos» no quedó ningún valor suelto (todo son presupuestos)', Object.values(desp.datos || {}).every(v => v && typeof v === 'object'), J(Object.entries(desp.datos || {}).filter(([k, v]) => !v || typeof v !== 'object')));
ok('S1: el resto de las colecciones del proyecto (facturas, caja, banco, ingresos…) quedó igual', J(sinFicha(desp)) === J(sinFicha(antes)), Object.keys(sinFicha(antes)).filter(k => J(desp[k]) !== J(antes[k])).join(','));
ok('S1: el nombre se actualizó', desp.nombre === 'Edificio Los Álamos II', desp.nombre);
const f = desp.ficha || {};
ok('S1: la ficha guarda todos los campos del formulario (código en mayúsculas)', f.codigo === 'ALB' && f.tipo === 'refaccion' && f.estado === 'pausado' && f.responsable === 'Arq. Prueba' && f.fechaInicio === '2025-03-01' && f.fechaFin === '2027-06-30'
  && f.direccion === 'Av. Siempreviva 742' && f.ciudad === 'CABA' && f.provincia === 'Buenos Aires' && f.cp === 'C1425' && f.maps === 'https://maps.example/x' && f.web === 'https://obra.example'
  && f.descripcion === 'Torre de 8 pisos' && f.superficie === '1234' && f.presupuestoEst === '9876543' && f.cliente === 'Cliente Demo', J(f));
const mem1 = await p.evaluate(() => ({ n: datos.length, cod: codigoProyectoActual(), nom: proyectoActual.nombre }));
ok('S1: en memoria siguen los mismos presupuestos, el proyecto tiene el nombre nuevo y el código de comprobantes es ALB', mem1.n === nMem && mem1.nom === 'Edificio Los Álamos II' && mem1.cod === 'ALB', J(mem1));
let e0 = errores.length;
await irA(p, 'Presupuestos');
ok('S1: la pantalla de Presupuestos se pinta sin errores de JS', erroresDesde(e0).length === 0, J(erroresDesde(e0)));

// ───── S2: abrir de nuevo muestra TODO lo guardado y guardar sin tocar nada no cambia nada ─────
await abrirProy(P);
const f2 = await form();
const faltan = Object.keys(CAMPOS).filter(id => id !== 'proyCodigo' && f2[id] !== CAMPOS[id]);
ok('S2: al reabrir el formulario se ven los 16 campos guardados (incluidas fechas y presupuesto estimado)', faltan.length === 0 && f2.proyCodigo === 'ALB', 'distintos: ' + faltan.map(id => id + '=' + f2[id]).join(' | '));
const antesS2 = await leer(BASE);
await guardarProy();
const despS2 = await leer(BASE);
ok('S2: guardar sin tocar nada deja el proyecto idéntico (ficha y presupuestos)', J(despS2) === J(antesS2), 'cambió: ' + Object.keys(antesS2).filter(k => J(despS2[k]) !== J(antesS2[k])).join(','));

// ───── S3: vaciar un campo lo borra de la ficha ─────
await abrirProy(P);
await llenar({ proyCodigo: '', proyCliente: '' });
await guardarProy();
const f3 = (await leer(BASE)).ficha || {};
const cod3 = await p.evaluate(() => codigoProyectoActual());
ok('S3: el campo vaciado desaparece de la ficha (no queda un texto vacío) y el resto sigue', !('codigo' in f3) && !('cliente' in f3) && f3.responsable === 'Arq. Prueba', J(f3));
ok('S3: sin código corto el código de comprobantes sale del nombre del proyecto', cod3 === 'EDIFIC', cod3);

// ───── S4: proyecto del FORMATO ANTERIOR (ficha como valores sueltos dentro de «datos») ─────
await abrirProy(P);
await llenar({ proyCodigo: 'ala' });
await guardarProy();                                   // deja la ficha moderna: la borramos para simular el formato anterior
await escribir(BASE + '/ficha', null);
await escribir(BASE + '/datos/codigo', 'LEG');
await escribir(BASE + '/datos/tipo', 'obra_nueva');
await escribir(BASE + '/datos/estado', 'en_curso');
await escribir(BASE + '/datos/responsable', 'Responsable anterior');
await escribir(BASE + '/datos/fechaInicio', '2024-01-15');
await escribir(BASE + '/datos/cp', '');                 // un valor vacío suelto (el alta anterior los guardaba)
await p.waitForTimeout(400);
e0 = errores.length;
const mem4 = await p.evaluate(() => ({ n: datos.length, strs: datos.filter(d => !d || typeof d !== 'object').length }));
ok('S4: con la ficha suelta dentro de «datos», la lista de presupuestos ignora esos valores (no son presupuestos)', mem4.n === nMem && mem4.strs === 0, J(mem4));
await irA(p, 'Presupuestos');
ok('S4: y Presupuestos se pinta sin errores de JS (antes reventaba con «toLocaleString» de undefined)', erroresDesde(e0).length === 0, J(erroresDesde(e0)));
// guardar un presupuesto con esos valores sueltos al lado no los toca ni escribe una clave «undefined»
await p.evaluate(() => { datos[0].comentarioPrueba = 'x'; persistir(); }); await p.waitForTimeout(400);
await p.evaluate(() => { delete datos[0].comentarioPrueba; persistir(); }); await p.waitForTimeout(400);
const d4a = (await leer(BASE)).datos;
ok('S4: guardar un presupuesto no toca los valores sueltos ni escribe una clave «undefined»', !('undefined' in d4a) && d4a.codigo === 'LEG' && d4a.fechaInicio === '2024-01-15' && d4a.cp === '', J(Object.keys(d4a).filter(k => typeof d4a[k] !== 'object')));
const presOnly = {}; Object.keys(d4a).forEach(k => { if (d4a[k] && typeof d4a[k] === 'object') presOnly[k] = d4a[k]; });
await p.evaluate(() => initEmpresas()); await p.waitForTimeout(700);
const cod4 = await p.evaluate(() => codigoProyectoActual());
ok('S4: el código del proyecto anterior se sigue leyendo (los números de comprobante no cambian)', cod4 === 'LEG', cod4);
await abrirProy(P);
const f4 = await form();
ok('S4: el formulario muestra la ficha del formato anterior', f4.proyCodigo === 'LEG' && f4.proyResponsable === 'Responsable anterior' && f4.proyFechaInicio === '2024-01-15' && f4.proyTipo === 'obra_nueva', J(f4));
await llenar({ proyResponsable: 'Responsable nuevo' });
await guardarProy();
const d4 = await leer(BASE);
ok('S4: al guardar, la ficha pasa a su nodo y los valores sueltos salen de «datos» (quedan sólo los presupuestos, intactos)', J(d4.datos) === J(presOnly), J(Object.keys(d4.datos || {}).filter(k => !(k in presOnly))));
ok('S4: la ficha nueva tiene lo del formato anterior más lo que se cambió', d4.ficha && d4.ficha.codigo === 'LEG' && d4.ficha.responsable === 'Responsable nuevo' && d4.ficha.fechaInicio === '2024-01-15' && !('cp' in d4.ficha), J(d4.ficha));

// ───── S5: alta de un proyecto nuevo ─────
const nombresAntes = Object.keys((await leer('empresas/' + E + '/proyectos')) || {});
await p.evaluate(() => abrirModalProyecto(null));
await p.waitForTimeout(200);
const f5 = await form();
ok('S5: «Nuevo proyecto» abre con el formulario vacío (nombre, código…)', f5.proyNombre === '' && f5.proyCodigo === '' && f5.proyResponsable === '', J(f5));
await llenar({ proyNombre: 'Proyecto nuevo de prueba', proyCodigo: 'nvo', proyTipo: 'ampliacion', proyEstado: 'planificacion', proyCiudad: 'Rosario' });
await guardarProy();
const proys = (await leer('empresas/' + E + '/proyectos')) || {};
const nuevoId = Object.keys(proys).find(k => !nombresAntes.includes(k));
const nuevo = proys[nuevoId] || {};
ok('S5: se creó un proyecto nuevo con su nombre', !!nuevoId && nuevo.nombre === 'Proyecto nuevo de prueba', J(Object.keys(proys)));
ok('S5: la ficha guarda lo cargado (y sólo lo cargado)', nuevo.ficha && nuevo.ficha.codigo === 'NVO' && nuevo.ficha.tipo === 'ampliacion' && nuevo.ficha.estado === 'planificacion' && nuevo.ficha.ciudad === 'Rosario' && !('responsable' in nuevo.ficha), J(nuevo.ficha));
ok('S5: el proyecto nuevo NO tiene «datos» (los presupuestos arrancan vacíos, sin valores sueltos)', !('datos' in nuevo), J(nuevo));
ok('S5: el proyecto anterior no se tocó', J((await leer(BASE)).datos) === J(d4.datos), 'cambió');
await p.evaluate(id => { const s = document.getElementById('selProyecto'); s.value = id; cambiarProyecto(); }, nuevoId);
await p.waitForTimeout(1500);
e0 = errores.length;
await irA(p, 'Presupuestos');
const mem5 = await p.evaluate(() => ({ proy: proyectoActual && proyectoActual.id, n: datos.length, cod: codigoProyectoActual() }));
ok('S5: se puede entrar al proyecto nuevo: presupuestos vacíos, sin errores, código NVO', mem5.proy === nuevoId && mem5.n === 0 && mem5.cod === 'NVO' && erroresDesde(e0).length === 0, J(mem5) + J(erroresDesde(e0)));
// carga un presupuesto en el proyecto nuevo y lo edita: sigue ahí
const modelo = Object.values(antes.datos)[0];   // un presupuesto completo de la demo, como modelo
await p.evaluate(m => { const c = JSON.parse(JSON.stringify(m)); c.id = 'k_prueba_nuevo'; c.pagosHistorial = []; c.pagado = 0; datos.push(c); persistir(); }, modelo);
await p.waitForTimeout(500);
const pres5 = await leer('empresas/' + E + '/proyectos/' + nuevoId + '/datos');
ok('S5: el presupuesto cargado en el proyecto nuevo se guarda como colección normal', pres5 && pres5.k_prueba_nuevo && typeof pres5.k_prueba_nuevo === 'object' && Object.keys(pres5).length === 1, J(pres5));
await abrirProy(nuevoId);
await llenar({ proyNombre: 'Proyecto nuevo renombrado', proyResponsable: 'Alguien' });
await guardarProy();
const n5 = await leer('empresas/' + E + '/proyectos/' + nuevoId);
ok('S5: editar el proyecto nuevo no pierde su presupuesto', J(n5.datos) === J(pres5) && n5.nombre === 'Proyecto nuevo renombrado' && n5.ficha.responsable === 'Alguien' && n5.ficha.codigo === 'NVO', J(n5));

// ───── S6: Editar empresa (modal) ─────
await p.evaluate(id => { const s = document.getElementById('selEmpresa'); if (s) s.value = id; empresaActual = empresas.find(e => e.id === id); proyectoActual = empresaActual.proyectos.find(x => x.id === 'proy_alamos'); }, E);
await escribir('empresas/' + E + '/datos/campoExtra', 'se conserva');
const empAntes = await leer('empresas/' + E);
await p.evaluate(id => abrirModalEmpresa(id), E);
await p.waitForTimeout(200);
const fe = await p.evaluate(() => { const o = {}; document.querySelectorAll('#modalEmpresa input, #modalEmpresa select').forEach(el => { if (el.id) o[el.id] = el.value; }); return o; });
ok('S6: «Editar empresa» muestra el nombre, la condición de IVA, el tipo de persona y el inicio de actividad guardados', fe.empNombre === 'Constructora Los Álamos S.A.' && fe.empCondIva === 'responsable_inscripto' && fe.empTipoPersona === 'juridica' && fe.empInicioAct === '2014-03-01' && fe.empCodigo === 'CLA' && fe.empCuit === '30-71234567-8', J(fe));
await p.evaluate(() => { document.getElementById('empTelefono').value = '11 4444-0000'; guardarEmpresa(); });
await p.waitForTimeout(700);
const empDesp = await leer('empresas/' + E);
ok('S6: guardar la empresa conserva sus proyectos (con todo lo que tienen adentro) y los accesos', J(empDesp.proyectos) === J(empAntes.proyectos) && J(empDesp.usuariosAutorizados) === J(empAntes.usuariosAutorizados), 'proyectos cambiaron');
ok('S6: cambia sólo lo editado: el teléfono; condición de IVA, tipo de persona, inicio y el campo extra se conservan', empDesp.datos.telefono === '11 4444-0000' && empDesp.datos.condIva === 'responsable_inscripto' && empDesp.datos.tipoPersona === 'juridica' && empDesp.datos.inicioAct === '2014-03-01' && empDesp.datos.campoExtra === 'se conserva' && empDesp.datos.codigo === 'CLA', J(empDesp.datos));
await p.evaluate(() => { abrirModalEmpresa(empresaActual.id); document.getElementById('empWeb').value = ''; guardarEmpresa(); });
await p.waitForTimeout(700);
const empVacio = (await leer('empresas/' + E)).datos;
ok('S6: vaciar un campo de la empresa lo borra, sin tocar los demás', !('web' in empVacio) && empVacio.email === 'administracion@constructora-demo.com' && empVacio.campoExtra === 'se conserva', J(empVacio));

// ───── S7: la tarjeta «Datos de empresa» del Inicio ─────
await p.evaluate(id => dbVerDatos(id), E);
await p.waitForTimeout(300);
await p.evaluate(() => { const i = document.querySelector('#dbEditForm [data-key="telefono"]'); i.value = '11 3333-9999'; document.querySelector('#dbEditForm [data-key="direccion"]').value = ''; });
await p.evaluate(id => dbGuardarDatos(id), E);
await p.waitForTimeout(1200);
const emp7 = (await leer('empresas/' + E));
ok('S7: guardar desde la tarjeta cambia lo editado y borra lo vaciado', emp7.datos.telefono === '11 3333-9999' && !('direccion' in emp7.datos), J(emp7.datos));
ok('S7: y NO pierde el código de la empresa (que esa tarjeta no muestra) ni lo que el formulario no conoce', emp7.datos.codigo === 'CLA' && emp7.datos.campoExtra === 'se conserva' && emp7.datos.cuit === '30-71234567-8', J(emp7.datos));
const mem7 = await p.evaluate(() => ({ cod: codigoEmpresaActual(), tel: empresaActual.datos.telefono }));
ok('S7: en memoria el código de la empresa sigue siendo CLA (la numeración de comprobantes no cambia)', mem7.cod === 'CLA' && mem7.tel === '11 3333-9999', J(mem7));
ok('S7: los proyectos de la empresa siguen intactos', J(emp7.proyectos) === J(empAntes.proyectos), 'cambiaron');

const malos = res.filter(x => x[0] === 'FALLA');
res.forEach(x => console.log(x.join(' ')));
const errs = errores.filter(e => !/gsi|Failed to load resource|tradingview/.test(e));
console.log(`\n${res.length - malos.length}/${res.length} OK` + (errs.length ? '\nerrores de página: ' + JSON.stringify(errs.slice(0, 5)) : ''));
await b.close();
process.exit(malos.length || errs.length ? 1 : 0);
