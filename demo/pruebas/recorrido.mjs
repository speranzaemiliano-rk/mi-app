// Recorrido completo de la demo con todos los datos: cada pantalla de las dos empresas, sin errores ni valores rotos.
import { abrirDemo, entrarAlSistema, irA } from './demo-lib.mjs';
import fs from 'fs';
const TABS = ['Home','Desarrollos','Metros','Presupuestos','Proveedores','CuentaCorriente','Facturas','Documentos','DocumentosEmitidos','Vencimientos','ResumenIngresos','Ventas','Alquileres','Servicios','IngGeneral','Inversiones','Egresos','CompRecibidos','Pagos','CajaGeneral','PlanTrabajo','EfectivoPesos','EfectivoUSD','CambioUSD','CuentasBancarias','Actualizacion','Config','Tesoreria','Reportes','Remuneraciones'];
const vp = process.argv[2] === 'movil' ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const { b, p, red, errores } = await abrirDemo({ viewport: vp });
const t0 = Date.now();
const ok = await entrarAlSistema(p);
console.log('entró:', ok, 'en', Date.now() - t0, 'ms');
const malos = [];
async function recorrer(etiqueta) {
  for (const t of TABS) {
    const antes = errores.length;
    await irA(p, t);
    await p.waitForTimeout(250);
    const r = await p.evaluate(() => {
      const a = document.querySelector('.tab-panel.active') || document.getElementById('panelDashboard');
      const txt = a ? a.innerText : '';
      const malo = [];
      if (/\bNaN\b/.test(txt)) malo.push('NaN');
      if (/\bundefined\b/.test(txt)) malo.push('undefined');
      if (/Invalid Date/.test(txt)) malo.push('Invalid Date');
      if (/\[object Object\]/.test(txt)) malo.push('[object Object]');
      return { len: txt.length, malo };
    });
    const nuevos = errores.slice(antes).filter(e => !/gsi|Failed to load resource|tradingview/.test(e));
    if (r.malo.length || nuevos.length || r.len < 40) malos.push(`${etiqueta} · ${t}: len=${r.len} ${r.malo.join(',')} ${nuevos.slice(0, 2).join(' | ')}`);
  }
}
await recorrer('constructora');
await p.screenshot({ path: 'demo-t5-fin1.png' });
// segunda empresa
const cambio = await p.evaluate(async () => {
  const e = empresas.find(x => x.id === 'emp_demo_2'); if (!e) return 'no hay emp2';
  if (typeof seleccionarProyecto === 'function') { try { seleccionarProyecto(e.id, e.proyectos[0].id); return 'seleccionarProyecto'; } catch (x) {} }
  empresaActual = e; proyectoActual = e.proyectos[0]; desconectarListeners(); actualizarRefs(); datosInicializado = false; cargarDatos(); return 'manual';
});
console.log('cambio a la inmobiliaria:', cambio);
await p.waitForTimeout(2500);
console.log('activa:', await p.evaluate(() => empresaActual.nombre + ' / ' + proyectoActual.nombre));
await recorrer('inmobiliaria');
console.log(malos.length ? '✗ pantallas con problemas:\n' + malos.join('\n') : '✓ todas las pantallas limpias');
console.log('errores de JS:', errores.filter(e => !/gsi|Failed to load resource|tradingview/.test(e)).slice(0, 10));
await b.close();
