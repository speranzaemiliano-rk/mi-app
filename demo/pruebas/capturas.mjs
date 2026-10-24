import { abrirDemo, entrarAlSistema, irA } from './demo-lib.mjs';
const movil = process.argv[2] === 'movil';
const { b, p, errores } = await abrirDemo({ viewport: movil ? { width: 390, height: 844 } : { width: 1440, height: 900 } });
await entrarAlSistema(p);
await p.waitForTimeout(2000);
const lista = movil ? ['Home', 'CajaGeneral', 'Facturas'] : ['Home', 'Presupuestos', 'Facturas', 'CajaGeneral', 'Alquileres', 'PlanTrabajo', 'Remuneraciones', 'Ventas'];
for (const t of lista) { await irA(p, t); await p.waitForTimeout(1200); await p.screenshot({ path: `shot-${movil ? 'm-' : ''}${t}.png` }); }
console.log(errores.filter(e => !/gsi|Failed to load|tradingview/.test(e)).slice(0, 5));
await b.close();
