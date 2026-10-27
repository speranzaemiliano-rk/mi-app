// Recibo de entrega de documentación (sin dinero): alta, numeración correlativa sin reuso, edición, copia firmada, borrado y permisos.
// Corre contra la demo (base en memoria). Uso: node entrega-doc.mjs   (ver README: hace falta bajar-cdn.sh antes)
import { abrirDemo, entrarAlSistema, irA } from './demo-lib.mjs';
const { b, p, red, errores } = await abrirDemo();
const res = [];
const ok = (n, c, x) => { res.push([c ? 'OK ' : 'FALLA', n, c ? '' : x]); };
await entrarAlSistema(p);
await p.evaluate(() => { window.__alerts = []; window.__html = []; window.alert = m => window.__alerts.push(String(m)); window.confirm = () => true; window._imprimirDocHTML = h => window.__html.push(h); });
await irA(p, 'DocumentosEmitidos');
const N0 = await p.evaluate(() => entregasDoc.length);   // recibos de ejemplo de la demo
const nro = k => 'ED-' + String(N0 + k).padStart(4, '0');
ok('la demo trae recibos de ejemplo en la lista', N0 >= 1 && /ED-0001/.test(await p.innerText('#entDocLista')));
ok('botón del encabezado visible', await p.isVisible('#btnEntregaDoc'));
ok('tarjeta de la lista visible', await p.isVisible('#seccionEntregasDoc'));
// atajo dentro de Emitir recibo
await p.click('#btnEmitirComprobante');
await p.waitForTimeout(400);
ok('atajo visible en modalEmitir (alta)', await p.isVisible('#emitLinkEntregaDoc'));
await p.click('#emitLinkEntregaDoc button');
await p.waitForTimeout(400);
ok('se cerró Emitir y abrió el de entrega', !(await p.isVisible('#modalEmitir')) && await p.isVisible('#modalEntregaDoc'));
ok('entrega por defecto = empresa', (await p.inputValue('#entDocQuienEntrega')).length > 0, await p.inputValue('#entDocQuienEntrega'));
// validaciones
await p.click('#entDocGuardarSolo'); await p.waitForTimeout(200);
ok('pide destinatario', (await p.evaluate(() => window.__alerts)).some(m => /a quién/.test(m)), JSON.stringify(await p.evaluate(() => window.__alerts)));
await p.fill('#entDocDest', 'Juan Pérez');
await p.click('#entDocGuardarSolo'); await p.waitForTimeout(200);
ok('pide documento', (await p.evaluate(() => window.__alerts)).some(m => /al menos un documento/.test(m)));
ok('recibe acompaña al destinatario', (await p.inputValue('#entDocQuienRecibe')) === 'Juan Pérez');
await p.fill('#entDocDoc', '20-12345678-3'); await p.fill('#entDocRef', "UF 6A — D'Angelo <b>");
await p.click('#entDocSugeridos button:nth-child(1)');
await p.click('#entDocSugeridos button:nth-child(2)');
await p.click('#entDocSugeridos button:nth-child(2)');
await p.fill('#entDocObs', 'Falta el plano <script>x</script>');
await p.click('#entDocGuardarImp'); await p.waitForTimeout(800);
const st = await p.evaluate(() => ({ n: entregasDoc.length, e: entregasDoc[entregasDoc.length - 1], html: window.__html.length, abierto: document.getElementById('modalEntregaDoc').classList.contains('active'), alerts: window.__alerts }));
ok('guardó 1 recibo más', st.n === N0 + 1, JSON.stringify(st));
ok('nro correlativo al contador', st.e && st.e.nro === nro(1), st.e && st.e.nro);
ok('items (2 docs, 2º con cant 2)', st.e && st.e.items.length === 2 && st.e.items[1].cant === 2, JSON.stringify(st.e && st.e.items));
ok('modal cerrado', !st.abierto);
ok('imprimió', st.html === 1);
const h = await p.evaluate(() => window.__html[0]);
ok('papel: título y número', /Recibo de Entrega de Documentaci/.test(h) && h.indexOf(nro(1)) >= 0);
ok('papel: escapado', !/<script>x/.test(h) && /&lt;script&gt;/.test(h) && /D&#39;Angelo|D&#x27;Angelo/.test(h), h.slice(h.indexOf('Referencia'), h.indexOf('Referencia') + 120));
ok('papel: no dinerario + 2 firmas', /no es dinerario/.test(h) && (h.match(/Aclaración/g) || []).length === 2);
ok('persistió en la base', await p.evaluate(n => new Promise(r => REF_ENTREGAS_DOC.once('value', s => r(!!s.val() && Object.keys(s.val()).length === n + 1))), N0));
// lista
const lista = await p.innerText('#entDocLista');
ok('lista muestra nro y destinatario', lista.indexOf(nro(1)) >= 0 && /Juan Pérez/.test(lista) && /Sin copia firmada/.test(lista), lista);
// segundo recibo → ED-0002
await p.click('#btnEntregaDoc'); await p.waitForTimeout(300);
await p.fill('#entDocDest', 'María'); await p.click('#entDocSugeridos button:nth-child(3)');
await p.click('#entDocGuardarSolo'); await p.waitForTimeout(600);
ok('segundo recibo = siguiente número', await p.evaluate(() => entregasDoc.map(e => e.nro).sort().join()) === ['ED-0001','ED-0002',nro(1),nro(2)].join(), await p.evaluate(() => entregasDoc.map(e => e.nro).join()));
// eliminar el último y crear otro: no reutiliza
const idDos = await p.evaluate(n => entregasDoc.find(e => e.nro === n).id, nro(2));
await p.evaluate(id => entDocEliminar(id), idDos); await p.waitForTimeout(400);
await p.click('#btnEntregaDoc'); await p.waitForTimeout(300);
await p.fill('#entDocDest', 'Pedro'); await p.click('#entDocSugeridos button:nth-child(4)');
await p.click('#entDocGuardarSolo'); await p.waitForTimeout(600);
ok('no reutiliza el número borrado', await p.evaluate(() => entregasDoc.map(e => e.nro).sort().join()) === ['ED-0001','ED-0002',nro(1),nro(3)].join(), await p.evaluate(() => entregasDoc.map(e => e.nro).join()));
// editar conserva nro
const id1 = await p.evaluate(n => entregasDoc.find(e => e.nro === n).id, nro(1));
await p.evaluate(id => abrirEntregaDoc(id), id1); await p.waitForTimeout(300);
ok('editar precarga destinatario', (await p.inputValue('#entDocDest')) === 'Juan Pérez' && (await p.innerText('#entDocTitulo')).indexOf(nro(1)) >= 0);
await p.fill('#entDocDest', 'Juan P. Pérez'); await p.click('#entDocGuardarSolo'); await p.waitForTimeout(500);
const e1 = await p.evaluate(id => entregasDoc.find(e => e.id === id), id1);
ok('editar conserva nro y cambia nombre', e1.nro === nro(1) && e1.destinatario === 'Juan P. Pérez');
// adjuntar copia firmada
await p.evaluate(id => { _entDocAdjId = id; }, id1);
await p.setInputFiles('#entDocArchivo', { name: 'firmado.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64') });
await p.evaluate(() => entDocAdjuntarElegido()); await p.waitForTimeout(1200);
const e1b = await p.evaluate(id => entregasDoc.find(e => e.id === id), id1);
ok('adjunto guardado', !!e1b.adjuntoId && /^ENTDOC-/.test(e1b.adjuntoId), JSON.stringify(e1b));
ok('lista muestra Firmado', /Firmado/.test(await p.innerText('#entDocLista')));
// buscador compartido
await p.fill('#buscadorEmitido', 'pedro'); await p.waitForTimeout(300);
const l2 = await p.innerText('#entDocLista');
ok('buscador filtra recibos de entrega', /Pedro/.test(l2) && !/Juan/.test(l2), l2);
await p.fill('#buscadorEmitido', '');
// filtro de tipo: «Entregas de documentación» muestra sólo la lista de entregas; «Recibos» la esconde
await p.selectOption('#filtroEmitidoTipo', 'entrega'); await p.waitForTimeout(200);
ok('filtro Entregas: sólo la lista de entregas', await p.isVisible('#seccionEntregasDoc') && !(await p.isVisible('#emitidosBody')));
await p.selectOption('#filtroEmitidoTipo', 'recibo'); await p.waitForTimeout(200);
ok('filtro Recibos: esconde las entregas', !(await p.isVisible('#seccionEntregasDoc')) && await p.isVisible('#emitidosBody'));
await p.selectOption('#filtroEmitidoTipo', ''); await p.waitForTimeout(200);
ok('sin filtro: las dos listas', await p.isVisible('#seccionEntregasDoc') && await p.isVisible('#emitidosBody'));
// borrar con adjunto borra el archivo
await p.evaluate(id => entDocEliminar(id), id1); await p.waitForTimeout(500);
const adj = e1b.adjuntoId;
ok('borrar quita el adjunto de REF_DOCS', await p.evaluate(a => new Promise(r => REF_DOCS.child(a).once('value', s => r(s.val() == null))), adj));
// edición de recibo de dinero existente NO muestra el atajo
await p.evaluate(() => { var e = comprobantesEmitidos[0]; if (e) abrirModalEmitir(e.id, 'ingreso'); });
await p.waitForTimeout(300);
ok('atajo oculto al editar un recibo', !(await p.isVisible('#emitLinkEntregaDoc')));
await p.evaluate(() => cerrarModalEmitir());
// sin permisos
await p.evaluate(() => { puedeEditar = false; aplicarPermisos(); }); await p.waitForTimeout(200);
ok('lector: botón oculto', !(await p.isVisible('#btnEntregaDoc')));
ok('lector: sin editar/borrar en lista', !/✏️|✕/.test(await p.innerText('#entDocLista')));
await p.evaluate(() => { abrirEntregaDoc(); });
ok('lector: abrir avisa', (await p.evaluate(() => window.__alerts)).some(m => /permisos/.test(m)) && !(await p.isVisible('#modalEntregaDoc')));
console.log(res.map(r => r.join(' ')).join('\n'));
console.log('errores de página:', errores.filter(e => !/net::|Failed to load/.test(e)));
console.log('red:', red.length);
await b.close();
if (res.some(r => r[0] !== 'OK ')) process.exitCode = 1;
