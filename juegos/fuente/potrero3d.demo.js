/* ============================================================
   PROTOTIPO 3D — Potrero 3D
   Un jugador que corre y patea, en una cancha con estadio, luces
   y sombras reales. Sirve para ver QUÉ NIVEL de imagen se alcanza
   en el navegador antes de comprometerse a un proyecto entero.

   Todo el personaje está armado y animado a mano acá abajo. El paso
   siguiente (ver README del final) es reemplazarlo por un modelo con
   esqueleto de Mixamo, que trae animaciones capturadas con actores.
   ============================================================ */

const CANCHA_LARGO = 44;      // metros
const CANCHA_ANCHO = 26;
const ARCO_ANCHO   = 7.32;
const ARCO_ALTO    = 2.44;

let escena, camara, render, reloj;
let jugador, arquero, pelota, luzSol;
let cancha = {};
const teclas = {};
let camaraModo = 0;           // 0 = transmisión (de costado), 1 = detrás del jugador
let fps = 0, fpsAcum = 0, fpsCuadros = 0;
let goles = 0, pausaGol = 0, atajadas = 0;

/* Modelo externo (Mixamo): se carga arrastrando un .glb sobre la página.
   No hace falta red: el archivo se lee con FileReader y se parsea en memoria. */
let modelo = null, mezclador = null, giroModelo = Math.PI;
let clipsCargados = [];                       // { clip, nombre }
const roles = { correr: null, parado: null, patear: null };
const acciones = { correr: null, parado: null, patear: null };
let accionCorriendo = null, patadaModelo = -1;
const usandoModelo = () => !!modelo;

/* ============================================================
   SONIDO — todo sintetizado con Web Audio, sin archivos
   Murmullo de hinchada permanente que sube cuando la jugada se acerca
   al arco, más golpes, atajadas, gol y silbato.
   ============================================================ */
const AUDIO3D = (function(){
  let ac = null, listo = false, mudo = false;
  let master, hinchGain, hinchFiltro, vientoGain;

  function ruido(seg){
    const n = Math.floor(ac.sampleRate*seg);
    const b = ac.createBuffer(1, n, ac.sampleRate);
    const d = b.getChannelData(0);
    for(let i = 0; i < n; i++) d[i] = Math.random()*2 - 1;
    return b;
  }

  function init(){
    if(listo) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return;
    try {
      ac = new AC();
      master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination);

      // hinchada: ruido filtrado en banda de voces
      const src = ac.createBufferSource();
      src.buffer = ruido(4); src.loop = true;
      hinchFiltro = ac.createBiquadFilter();
      hinchFiltro.type = 'bandpass'; hinchFiltro.frequency.value = 430; hinchFiltro.Q.value = 0.65;
      hinchGain = ac.createGain(); hinchGain.gain.value = 0.055;
      src.connect(hinchFiltro); hinchFiltro.connect(hinchGain); hinchGain.connect(master);
      src.start();

      // aire del estadio, muy por debajo
      const v = ac.createBufferSource();
      v.buffer = ruido(4); v.loop = true;
      const vf = ac.createBiquadFilter();
      vf.type = 'lowpass'; vf.frequency.value = 240;
      vientoGain = ac.createGain(); vientoGain.gain.value = 0.022;
      v.connect(vf); vf.connect(vientoGain); vientoGain.connect(master);
      v.start();

      listo = true;
    } catch(e){ listo = false; }
  }
  function activar(){ if(!listo) init(); if(ac && ac.state === 'suspended') ac.resume(); }

  function tono(f, dur, tipo, vol, hasta){
    if(!listo || mudo) return;
    const t = ac.currentTime;
    const o = ac.createOscillator(); o.type = tipo || 'square';
    o.frequency.setValueAtTime(f, t);
    if(hasta) o.frequency.exponentialRampToValueAtTime(hasta, t + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }

  function patada(fuerza){
    if(!listo || mudo) return;
    const t = ac.currentTime, f = Math.max(0, Math.min(1, fuerza));
    const n = ac.createBufferSource(); n.buffer = ruido(0.2);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 850 + f*800; bp.Q.value = 1.1;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.10 + f*0.24, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05 + f*0.06);
    n.connect(bp); bp.connect(g); g.connect(master);
    n.start(t); n.stop(t + 0.2);
    const o = ac.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(185 - f*70, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.10);
    const og = ac.createGain();
    og.gain.setValueAtTime(0.11 + f*0.20, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
    o.connect(og); og.connect(master); o.start(t); o.stop(t + 0.15);
  }

  function pique(fuerza){
    if(!listo || mudo) return;
    tono(210, 0.055, 'triangle', 0.03 + Math.min(0.05, fuerza*0.02), 140);
  }

  // sube el murmullo un rato, como cuando pasa algo
  function ola(pico, subida, bajada){
    if(!listo || mudo) return;
    const t = ac.currentTime;
    hinchGain.gain.cancelScheduledValues(t);
    hinchGain.gain.setValueAtTime(hinchGain.gain.value, t);
    hinchGain.gain.linearRampToValueAtTime(pico, t + subida);
    hinchGain.gain.linearRampToValueAtTime(0.055, t + subida + bajada);
    hinchFiltro.frequency.cancelScheduledValues(t);
    hinchFiltro.frequency.setValueAtTime(hinchFiltro.frequency.value, t);
    hinchFiltro.frequency.linearRampToValueAtTime(1150, t + subida);
    hinchFiltro.frequency.linearRampToValueAtTime(430, t + subida + bajada);
  }

  const gol = () => {
    ola(0.36, 0.22, 3.6);
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tono(f, 0.30, 'square', 0.12), i*105));
  };
  const atajada = () => { ola(0.24, 0.14, 1.5); tono(320, 0.10, 'sawtooth', 0.09, 190); };
  const silbato = () => { tono(2050, 0.14, 'square', 0.12, 2380); };

  // el ambiente late según qué tan cerca del arco está la jugada
  function ambiente(cerca){
    if(!listo || mudo) return;
    hinchGain.gain.setTargetAtTime(0.048 + cerca*0.075, ac.currentTime, 0.7);
    hinchFiltro.frequency.setTargetAtTime(420 + cerca*320, ac.currentTime, 0.7);
  }

  function setMudo(m){
    mudo = m;
    if(listo) master.gain.setTargetAtTime(m ? 0 : 0.5, ac.currentTime, 0.05);
  }
  return { activar, patada, pique, gol, atajada, silbato, ambiente, setMudo,
           estaMudo: () => mudo, andando: () => listo };
})();

/* ============================================================
   TEXTURAS DIBUJADAS EN CANVAS
   ============================================================ */
function lienzo(w, h){
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return { c, g: c.getContext('2d') };
}
function azar(semilla){
  let z = semilla;
  return () => (z = (z*1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
}
const lim = (v, a, b) => v < a ? a : (v > b ? b : v);

function texturaCancha(){
  const W = 2048, H = Math.round(W * CANCHA_ANCHO / CANCHA_LARGO);
  const { c, g } = lienzo(W, H);
  const rnd = azar(4242);
  const m2px = W / CANCHA_LARGO;                 // píxeles por metro

  // franjas de corte
  const franjas = 12, fw = W / franjas;
  for(let i = 0; i < franjas; i++){
    g.fillStyle = i % 2 ? '#236437' : '#296e3d';
    g.fillRect(i*fw, 0, fw + 1, H);
  }
  // manchones de color desparejo
  for(let i = 0; i < 260; i++){
    const x = rnd()*W, y = rnd()*H, r = 40 + rnd()*180;
    const gg = g.createRadialGradient(x, y, 1, x, y, r);
    gg.addColorStop(0, rnd() < 0.5 ? 'rgba(18,52,28,0.09)' : 'rgba(160,215,160,0.07)');
    gg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gg;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI*2); g.fill();
  }
  // briznas
  for(let i = 0; i < 42000; i++){
    const x = rnd()*W, y = rnd()*H, l = 1.6 + rnd()*3.2;
    const t = rnd();
    g.strokeStyle = t > 0.80 ? 'rgba(150,198,148,0.075)'
                  : t > 0.46 ? 'rgba(22,58,34,0.085)'
                             : 'rgba(60,130,78,0.06)';
    g.lineWidth = 0.9;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (rnd()-0.5)*3, y - l);
    g.stroke();
  }
  // zonas peladas frente a los arcos y en el círculo
  const pelado = (mx, my, rx, ry, f) => {
    const px = mx*m2px, py = my*m2px;
    const gg = g.createRadialGradient(px, py, 1, px, py, Math.max(rx, ry)*m2px);
    gg.addColorStop(0, `rgba(128,106,64,${f})`);
    gg.addColorStop(1, 'rgba(128,106,64,0)');
    g.save(); g.translate(px, py); g.scale(1, ry/rx); g.translate(-px, -py);
    g.fillStyle = gg;
    g.beginPath(); g.arc(px, py, rx*m2px, 0, Math.PI*2); g.fill();
    g.restore();
  };
  pelado(2.2, CANCHA_ANCHO/2, 4.5, 3.4, 0.30);
  pelado(CANCHA_LARGO - 2.2, CANCHA_ANCHO/2, 4.5, 3.4, 0.30);
  pelado(CANCHA_LARGO/2, CANCHA_ANCHO/2, 3.0, 2.2, 0.16);

  // ---- líneas de cal ----
  const L = (x1, y1, x2, y2, ancho) => {
    g.strokeStyle = 'rgba(248,252,255,0.94)';
    g.lineWidth = (ancho || 0.12) * m2px;
    g.beginPath();
    g.moveTo(x1*m2px, y1*m2px); g.lineTo(x2*m2px, y2*m2px);
    g.stroke();
  };
  const borde = 1.2;
  const X0 = borde, X1 = CANCHA_LARGO - borde;
  const Y0 = borde, Y1 = CANCHA_ANCHO - borde;
  const cyM = CANCHA_ANCHO/2;
  L(X0, Y0, X1, Y0); L(X0, Y1, X1, Y1);
  L(X0, Y0, X0, Y1); L(X1, Y0, X1, Y1);
  L(CANCHA_LARGO/2, Y0, CANCHA_LARGO/2, Y1);
  g.strokeStyle = 'rgba(248,252,255,0.94)';
  g.lineWidth = 0.12*m2px;
  g.beginPath();
  g.arc(CANCHA_LARGO/2*m2px, cyM*m2px, 5.5*m2px, 0, Math.PI*2);
  g.stroke();
  g.fillStyle = 'rgba(248,252,255,0.94)';
  [[CANCHA_LARGO/2, cyM], [X0 + 6.5, cyM], [X1 - 6.5, cyM]].forEach(([mx, my]) => {
    g.beginPath(); g.arc(mx*m2px, my*m2px, 0.14*m2px, 0, Math.PI*2); g.fill();
  });
  // áreas
  [[X0, 1], [X1, -1]].forEach(([ax, s]) => {
    const A = 9.5, B = 16;                       // área grande
    L(ax, cyM - B/2, ax + s*A, cyM - B/2);
    L(ax, cyM + B/2, ax + s*A, cyM + B/2);
    L(ax + s*A, cyM - B/2, ax + s*A, cyM + B/2);
    const a = 3.5, b = 8;                        // área chica
    L(ax, cyM - b/2, ax + s*a, cyM - b/2);
    L(ax, cyM + b/2, ax + s*a, cyM + b/2);
    L(ax + s*a, cyM - b/2, ax + s*a, cyM + b/2);
  });

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 16;
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

function texturaHinchada(){
  const W = 1024, H = 512;
  const { c, g } = lienzo(W, H);
  const rnd = azar(99001);
  const gg = g.createLinearGradient(0, 0, 0, H);
  gg.addColorStop(0, '#080b11'); gg.addColorStop(0.5, '#131922'); gg.addColorStop(1, '#1e2632');
  g.fillStyle = gg; g.fillRect(0, 0, W, H);

  // escalones del graderío
  g.fillStyle = 'rgba(0,0,0,0.30)';
  const FILAS = 22;
  for(let f = 0; f < FILAS; f++) g.fillRect(0, 20 + f*(H-40)/FILAS, W, 2);

  const ROPA = ['#2c5f92','#8e3129','#3b424d','#474f5c','#2f3640','#535c6a',
                '#1f4468','#6b2f28','#404855','#5a6270','#2a3441','#7a4a3a'];
  const PIEL = ['#c9a184','#8a6247','#e0bd9c','#6d4a34','#a87b58'];

  // se dibuja de atrás hacia adelante para que las filas de adelante tapen
  for(let f = 0; f < FILAS; f++){
    const t = f/(FILAS - 1);                 // 0 = fila de arriba (lejos)
    const y = 24 + t*(H - 58);
    const esc = 0.62 + t*0.62;               // más grandes las de adelante
    const paso = 15*esc;
    const luz = 0.42 + t*0.58;
    for(let x = -paso; x < W + paso; x += paso){
      if(rnd() < 0.09) continue;             // huecos: no está lleno
      const px = x + (rnd() - 0.5)*paso*0.35;
      const hombro = 6.2*esc, cabeza = 3.6*esc;
      // cuerpo
      g.globalAlpha = luz;
      g.fillStyle = ROPA[Math.floor(rnd()*ROPA.length)];
      g.beginPath();
      g.moveTo(px - hombro, y + hombro*1.5);
      g.quadraticCurveTo(px - hombro, y - hombro*0.2, px, y - hombro*0.25);
      g.quadraticCurveTo(px + hombro, y - hombro*0.2, px + hombro, y + hombro*1.5);
      g.closePath(); g.fill();
      // cabeza
      g.fillStyle = PIEL[Math.floor(rnd()*PIEL.length)];
      g.beginPath(); g.arc(px, y - hombro*0.55, cabeza, 0, Math.PI*2); g.fill();
      // pelo
      g.globalAlpha = luz*0.85;
      g.fillStyle = ['#231a12','#0f0d0b','#4a3218','#5c4632'][Math.floor(rnd()*4)];
      g.beginPath(); g.arc(px, y - hombro*0.68, cabeza*0.95, Math.PI, 0); g.fill();
    }
  }
  g.globalAlpha = 1;
  // sombra general hacia arriba, la parte alta está más oscura
  const sg = g.createLinearGradient(0, 0, 0, H);
  sg.addColorStop(0, 'rgba(0,0,0,0.55)'); sg.addColorStop(0.55, 'rgba(0,0,0,0.12)');
  sg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = sg; g.fillRect(0, 0, W, H);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.encoding = THREE.sRGBEncoding;
  tex.anisotropy = 8;
  return tex;
}

/* Flashes de cámara en la tribuna: es el detalle que hace que el público
   parezca vivo y no un empapelado. Son sprites que prenden y se apagan. */
let flashes = [];
function crearFlashes(){
  const tex = (function(){
    const { c, g } = lienzo(64, 64);
    const rg = g.createRadialGradient(32, 32, 1, 32, 32, 32);
    rg.addColorStop(0, 'rgba(255,255,245,1)');
    rg.addColorStop(0.25, 'rgba(255,250,220,0.55)');
    rg.addColorStop(1, 'rgba(255,250,220,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  for(let i = 0; i < 46; i++){
    const m = new THREE.SpriteMaterial({
      map: tex, transparent: true, opacity: 0, depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const sp = new THREE.Sprite(m);
    sp.scale.setScalar(1.5);
    reubicarFlash(sp);
    sp.userData = { espera: Math.random()*4 };
    escena.add(sp);
    flashes.push(sp);
  }
}
function reubicarFlash(sp){
  const lado = Math.random() < 0.5 ? -1 : 1;
  const cabecera = Math.random() < 0.32;
  if(cabecera){
    sp.position.set(Math.sign(Math.random() - 0.5)*(CANCHA_LARGO/2 + 8 + Math.random()*7),
                    2.5 + Math.random()*7,
                    (Math.random() - 0.5)*(CANCHA_ANCHO + 22));
  } else {
    sp.position.set((Math.random() - 0.5)*(CANCHA_LARGO + 14),
                    2.5 + Math.random()*8,
                    lado*(CANCHA_ANCHO/2 + 10 + Math.random()*11));
  }
}
function actualizarFlashes(dt){
  for(const sp of flashes){
    const u = sp.userData;
    u.espera -= dt;
    if(u.espera <= 0){
      if(sp.material.opacity > 0.05){
        sp.material.opacity = 0;
        u.espera = 1.2 + Math.random()*5.5;
        reubicarFlash(sp);
      } else {
        sp.material.opacity = 0.85 + Math.random()*0.15;
        u.espera = 0.05 + Math.random()*0.06;
      }
    }
  }
}

function texturaVallas(){
  const { c, g } = lienzo(1024, 96);
  const LEMAS = ['POTRERO', '· RK ·', 'BARRIO', 'FÚTBOL', 'PICADO'];
  for(let i = 0; i < 6; i++){
    const x = i*172;
    g.fillStyle = ['#152134','#1d2733','#2b1517','#1a2c1f'][i % 4];
    g.fillRect(x, 0, 170, 96);
    g.fillStyle = ['#f5c542','#e8eef7','#4da3ff','#e8443a'][i % 4];
    g.font = 'bold 34px Arial';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(LEMAS[i % LEMAS.length], x + 85, 48);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

function texturaRed(){
  const { c, g } = lienzo(256, 256);
  g.clearRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(255,255,255,0.85)';
  g.lineWidth = 2.2;
  for(let i = 0; i <= 16; i++){
    const p = i*16;
    g.beginPath(); g.moveTo(p, 0); g.lineTo(p, 256); g.stroke();
    g.beginPath(); g.moveTo(0, p); g.lineTo(256, p); g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function texturaPelota(){
  const { c, g } = lienzo(512, 256);
  g.fillStyle = '#f4f6f9'; g.fillRect(0, 0, 512, 256);
  g.fillStyle = '#1a1f28';
  const pent = (cx, cy, r, rot) => {
    g.beginPath();
    for(let i = 0; i < 5; i++){
      const a = rot + i*Math.PI*2/5 - Math.PI/2;
      const x = cx + Math.cos(a)*r, y = cy + Math.sin(a)*r*0.92;
      if(i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.closePath(); g.fill();
  };
  for(let i = 0; i < 6; i++) pent(42 + i*86, 62, 26, 0.2);
  for(let i = 0; i < 6; i++) pent(0 + i*86, 194, 26, 0.6);
  pent(256, 128, 30, 0);
  g.fillStyle = 'rgba(0,0,0,0.12)';
  g.fillRect(0, 0, 512, 12); g.fillRect(0, 244, 512, 12);
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

function texturaCamiseta(colorA, colorB){
  const { c, g } = lienzo(512, 512);
  g.fillStyle = colorA; g.fillRect(0, 0, 512, 512);
  // franjas verticales
  g.fillStyle = colorB;
  for(let i = 0; i < 5; i++) g.fillRect(i*102 + 34, 0, 34, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  tex.wrapS = THREE.RepeatWrapping;
  tex.offset.x = 0.5;
  return tex;
}

// El número en un plano aparte y no en la textura del torso: envolver un
// cilindro deja el dorsal a merced de cómo mapea las UV, y salía espejado
// y dando la vuelta al cuerpo. Un plano pegado a la espalda es predecible.
function texturaDorsal(numero){
  const { c, g } = lienzo(256, 256);
  g.clearRect(0, 0, 256, 256);
  g.fillStyle = 'rgba(255,255,255,0.97)';
  g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 12;
  g.font = 'bold 168px Arial';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.strokeText(numero, 128, 132); g.fillText(numero, 128, 132);
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

/* ============================================================
   ARMADO DE LA ESCENA
   ============================================================ */
function crearEscena(){
  escena = new THREE.Scene();
  escena.background = new THREE.Color(0x0a1018);
  escena.fog = new THREE.Fog(0x0a1018, 70, 190);

  camara = new THREE.PerspectiveCamera(42, 16/9, 0.1, 400);
  camara.position.set(0, 9.6, 20.5);

  // ---- luces ----
  const hemi = new THREE.HemisphereLight(0x9fc4e8, 0x24402c, 0.38);
  escena.add(hemi);

  luzSol = new THREE.DirectionalLight(0xfff3d6, 1.55);
  luzSol.position.set(18, 30, 14);
  luzSol.castShadow = true;
  luzSol.shadow.mapSize.set(2048, 2048);
  const d = 30;
  luzSol.shadow.camera.left = -d; luzSol.shadow.camera.right = d;
  luzSol.shadow.camera.top = d;   luzSol.shadow.camera.bottom = -d;
  luzSol.shadow.camera.near = 1;  luzSol.shadow.camera.far = 90;
  luzSol.shadow.bias = -0.0008;
  luzSol.shadow.normalBias = 0.02;
  escena.add(luzSol);
  escena.add(luzSol.target);

  const relleno = new THREE.DirectionalLight(0x86a8d8, 0.22);
  relleno.position.set(-16, 18, -12);
  escena.add(relleno);

  // ---- césped ----
  const geoC = new THREE.PlaneGeometry(CANCHA_LARGO, CANCHA_ANCHO);
  const matC = new THREE.MeshStandardMaterial({
    map: texturaCancha(), roughness: 0.94, metalness: 0
  });
  const piso = new THREE.Mesh(geoC, matC);
  piso.rotation.x = -Math.PI/2;
  piso.receiveShadow = true;
  escena.add(piso);
  cancha.limX = CANCHA_LARGO/2 - 1.2;
  cancha.limZ = CANCHA_ANCHO/2 - 1.2;

  // pasto exterior
  const fuera = new THREE.Mesh(
    new THREE.PlaneGeometry(CANCHA_LARGO + 26, CANCHA_ANCHO + 22),
    new THREE.MeshStandardMaterial({ color: 0x1c4d2d, roughness: 1 })
  );
  fuera.rotation.x = -Math.PI/2;
  fuera.position.y = -0.02;
  fuera.receiveShadow = true;
  escena.add(fuera);

  crearVallas();
  crearTribunas();
  crearFlashes();
  crearTorres();
  crearArco(-CANCHA_LARGO/2 + 1.2, 1);
  crearArco( CANCHA_LARGO/2 - 1.2, -1);

  // ---- pelota ----
  pelota = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 32, 24),
    new THREE.MeshStandardMaterial({ map: texturaPelota(), roughness: 0.42, metalness: 0.02 })
  );
  pelota.castShadow = true;
  pelota.position.set(1.6, 0.11, 0);
  // `pegado` DEBE arrancar en 0: sin inicializar valía undefined, y como
  // `undefined <= 0` es falso, la condición de conducción nunca se cumplía.
  pelota.userData = { v: new THREE.Vector3(), giro: new THREE.Vector3(), pegado: 0, atajada: 0 };
  escena.add(pelota);

  // ---- jugadores ----
  // Las medias eran casi blancas (#f2f5fa) sobre piel clara: a la distancia de
  // la cámara la pierna era una sola mancha del short al botín. En oscuro se
  // le ve el corte y la pierna se lee.
  jugador = crearFutbolista('#3f8ee0', '#1c4f8a', '#101a2c', '#16406f', '10', '#e8b98f', '#241a12');
  jugador.position.set(-3, 0, 2);
  escena.add(jugador);

  arquero = crearFutbolista('#f0c53c', '#b8902a', '#22201a', '#33301c', '1', '#c98d5f', '#12100e');
  arquero.position.set(CANCHA_LARGO/2 - 2.0, 0, 0);
  arquero.rotation.y = -Math.PI/2;
  escena.add(arquero);
}

function crearVallas(){
  const tex = texturaVallas();
  tex.repeat.set(6, 1);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 });
  const largo = CANCHA_LARGO + 8;
  [[0, -CANCHA_ANCHO/2 - 3.2, 0], [0, CANCHA_ANCHO/2 + 3.2, Math.PI]].forEach(([x, z, ry]) => {
    const v = new THREE.Mesh(new THREE.BoxGeometry(largo, 1.0, 0.16), mat);
    v.position.set(x, 0.5, z);
    v.rotation.y = ry;
    v.castShadow = true; v.receiveShadow = true;
    escena.add(v);
  });
}

function crearTribunas(){
  const tex = texturaHinchada();
  tex.repeat.set(4, 1);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 });
  // 0x141920 era casi negro: donde una tribuna entraba en cuadro se veía como
  // un agujero recortado y no como la espalda de una grada.
  const matEstr = new THREE.MeshStandardMaterial({ color: 0x252c37, roughness: 0.9 });
  // Las laterales tienen que pasar de largo a las cabeceras y taparles la
  // esquina. Con CANCHA_LARGO + 20 terminaban en x=±32 y las cabeceras
  // arrancan en ±25,5: el canto quedaba al aire y entraba en cuadro por
  // arriba como una cuña oscura en las dos puntas.
  const largo = CANCHA_LARGO + 46;

  // Cada grada es una caja con la hinchada SOLO en la cara que mira a la
  // cancha; el resto en gris estructura. Con la textura en las seis caras
  // aparecía un muro claro de gente al fondo del estadio.
  const caras = (indiceVisible) => {
    const m = [];
    for(let i = 0; i < 6; i++) m.push(i === indiceVisible ? mat : matEstr);
    return m;
  };
  [-1, 1].forEach(lado => {
    // muro bajo entre el campo y la grada
    const muro = new THREE.Mesh(new THREE.BoxGeometry(largo, 2.6, 0.6), matEstr);
    muro.position.set(0, 1.3, lado*(CANCHA_ANCHO/2 + 5.2));
    muro.receiveShadow = true;
    escena.add(muro);
    // graderío inclinado: cara visible = -z si está del lado +z
    const grada = new THREE.Mesh(new THREE.BoxGeometry(largo, 11, 17),
                                 caras(lado > 0 ? 5 : 4));
    grada.position.set(0, 4.4, lado*(CANCHA_ANCHO/2 + 15));
    grada.rotation.x = lado * 0.34;
    escena.add(grada);
    const techo = new THREE.Mesh(new THREE.BoxGeometry(largo, 0.7, 18), matEstr);
    techo.position.set(0, 14.5, lado*(CANCHA_ANCHO/2 + 16));
    escena.add(techo);
  });
  // cabeceras: cara visible = -x si está del lado +x
  [-1, 1].forEach(lado => {
    // Antes medía CANCHA_ANCHO + 34 de ancho y se metía dentro de las
    // laterales: la esquina asomaba por arriba y entraba en cuadro como una
    // cuña negra. Ahora termina justo antes de ellas.
    const grada = new THREE.Mesh(new THREE.BoxGeometry(17, 10, CANCHA_ANCHO + 12),
                                 caras(lado > 0 ? 1 : 0));
    grada.position.set(lado*(CANCHA_LARGO/2 + 12), 4.0, 0);
    grada.rotation.z = -lado * 0.32;
    escena.add(grada);
    const techo = new THREE.Mesh(new THREE.BoxGeometry(18, 0.7, CANCHA_ANCHO + 12), matEstr);
    techo.position.set(lado*(CANCHA_LARGO/2 + 13), 13.2, 0);
    escena.add(techo);
  });
}

function crearTorres(){
  const matPoste = new THREE.MeshStandardMaterial({ color: 0x2a3038, roughness: 0.8 });
  const matLuz = new THREE.MeshStandardMaterial({
    color: 0xfff6d8, emissive: 0xfff0c0, emissiveIntensity: 2.4, roughness: 0.4
  });
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx, sz]) => {
    const g = new THREE.Group();
    const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.42, 20, 10), matPoste);
    poste.position.y = 10;
    poste.castShadow = true;
    g.add(poste);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(5.2, 2.4, 0.4), matPoste);
    panel.position.set(0, 20.4, 0);
    g.add(panel);
    for(let i = 0; i < 4; i++) for(let j = 0; j < 2; j++){
      const l = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.85, 0.12), matLuz);
      l.position.set(-1.9 + i*1.25, 20.9 - j*1.0, -0.28);
      g.add(l);
    }
    g.position.set(sx*(CANCHA_LARGO/2 + 10), 0, sz*(CANCHA_ANCHO/2 + 26));
    g.lookAt(0, 18, 0);
    escena.add(g);
  });
}

function crearArco(x, haciaAdentro){
  const g = new THREE.Group();
  const matPoste = new THREE.MeshStandardMaterial({ color: 0xf4f7fb, roughness: 0.35, metalness: 0.05 });
  const r = 0.06;
  [-1, 1].forEach(s => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r, ARCO_ALTO, 12), matPoste);
    p.position.set(0, ARCO_ALTO/2, s*ARCO_ANCHO/2);
    p.castShadow = true;
    g.add(p);
  });
  const tr = new THREE.Mesh(new THREE.CylinderGeometry(r, r, ARCO_ANCHO + r*2, 12), matPoste);
  tr.rotation.x = Math.PI/2;
  tr.position.set(0, ARCO_ALTO, 0);
  tr.castShadow = true;
  g.add(tr);

  // red: fondo, laterales y techo
  const tex = texturaRed();
  const matRed = new THREE.MeshStandardMaterial({
    map: tex, transparent: true, opacity: 0.55, side: THREE.DoubleSide,
    depthWrite: false, roughness: 1
  });
  const prof = 1.8;
  const fondo = new THREE.Mesh(new THREE.PlaneGeometry(ARCO_ANCHO, ARCO_ALTO), matRed.clone());
  fondo.material.map = tex.clone(); fondo.material.map.needsUpdate = true;
  fondo.material.map.repeat.set(9, 3);
  fondo.rotation.y = Math.PI/2;
  fondo.position.set(-haciaAdentro*prof, ARCO_ALTO/2, 0);
  g.add(fondo);
  [-1, 1].forEach(s => {
    const lat = new THREE.Mesh(new THREE.PlaneGeometry(prof, ARCO_ALTO), matRed.clone());
    lat.material.map = tex.clone(); lat.material.map.needsUpdate = true;
    lat.material.map.repeat.set(2.5, 3);
    lat.position.set(-haciaAdentro*prof/2, ARCO_ALTO/2, s*ARCO_ANCHO/2);
    g.add(lat);
  });
  const techo = new THREE.Mesh(new THREE.PlaneGeometry(prof, ARCO_ANCHO), matRed.clone());
  techo.material.map = tex.clone(); techo.material.map.needsUpdate = true;
  techo.material.map.repeat.set(2.5, 9);
  techo.rotation.x = Math.PI/2;
  techo.rotation.z = Math.PI/2;
  techo.position.set(-haciaAdentro*prof/2, ARCO_ALTO, 0);
  g.add(techo);

  g.position.x = x;
  escena.add(g);
  return g;
}

/* ============================================================
   EL FUTBOLISTA
   Jerarquía de huesos armada a mano. Cada parte es hija de la
   anterior, así girar el muslo arrastra pantorrilla y pie.
   ============================================================ */
function esf(r, mat){
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), mat);
  m.castShadow = true;
  return m;
}

/* Un miembro con volumen: se define el PERFIL (qué radio tiene a cada altura)
   y se revoluciona. Con cilindros rectos el cuerpo se leía como Playmobil;
   con perfil, el muslo engorda en la cadera, el gemelo tiene panza y el
   antebrazo se afina hacia la muñeca. */
function miembro(perfil, largo, mat, anchoX, anchoZ){
  const pts = perfil.map(([t, r]) =>
    new THREE.Vector2(Math.max(0.004, r), -t*largo));
  const g = new THREE.LatheGeometry(pts, 16);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat);
  m.scale.set(anchoX || 1, 1, anchoZ || anchoX || 1);
  m.castShadow = true;
  return m;
}

/* Igual pero de abajo hacia arriba, para el torso */
function tronco(perfil, mat, anchoX, anchoZ){
  const pts = perfil.map(([y, r]) => new THREE.Vector2(Math.max(0.004, r), y));
  const g = new THREE.LatheGeometry(pts, 20);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat);
  m.scale.set(anchoX || 1, 1, anchoZ || 1);
  m.castShadow = true;
  return m;
}

function crearFutbolista(colCamisetaA, colCamisetaB, colShort, colMedias, numero, colPiel, colPelo){
  const G = new THREE.Group();
  const matPiel   = new THREE.MeshStandardMaterial({ color: colPiel, roughness: 0.62, metalness: 0 });
  // polygonOffset: empuja el pelo un pelín adelante en el buffer de
  // profundidad, para que nunca se pelee con el cráneo por el mismo píxel.
  // DoubleSide porque el pelo es un casquete abierto: sin esto, mirándolo
  // desde abajo se le ve el hueco.
  const matPelo   = new THREE.MeshStandardMaterial({
    color: colPelo, roughness: 0.88, side: THREE.DoubleSide
  });
  const matShort  = new THREE.MeshStandardMaterial({ color: colShort, roughness: 0.66, metalness: 0.03 });
  const matMedias = new THREE.MeshStandardMaterial({ color: colMedias, roughness: 0.82 });
  const matBotin  = new THREE.MeshStandardMaterial({ color: 0x14171c, roughness: 0.35, metalness: 0.1 });
  const matOjo    = new THREE.MeshStandardMaterial({ color: 0xf6f7f9, roughness: 0.25 });
  const matPupila = new THREE.MeshStandardMaterial({ color: 0x1b1512, roughness: 0.2 });
  const matCam    = new THREE.MeshStandardMaterial({
    map: texturaCamiseta(colCamisetaA, colCamisetaB), roughness: 0.62, metalness: 0.04
  });
  const matManga  = new THREE.MeshStandardMaterial({ color: colCamisetaA, roughness: 0.78 });

  // --- cadera: raíz del esqueleto ---
  // Medido contra el canon anatómico: la cadera estaba al 49% de la altura y
  // va al 53%, si no las piernas quedan cortas y el muñeco rechoncho. Sube
  // 7 cm, y el cuello baja otro tanto para que el total siga siendo 1,80.
  const cadera = new THREE.Group();
  cadera.position.y = 0.991;
  G.add(cadera);

  // --- torso: perfil con hombros, pecho, cintura y cadera ---
  const torso = new THREE.Group();
  cadera.add(torso);
  // Sin cierre brusco abajo: cerrar de 0,13 a 0,01 en un centímetro creaba
  // un disco casi plano que sobresalía como una pollera. Queda abierto y lo
  // tapa el short.
  // El punto más ancho va a la altura del hombro (y~0,50), no en el pecho.
  // Con el máximo abajo el tronco era un huevo, el hombro no existía y la
  // esfera del deltoide asomaba cuatro centímetros por fuera de la camiseta:
  // de ahí la bola pegada al costado.
  // Dos cambios: se angosta en la cintura (antes crecía parejo de abajo a
  // arriba y el tronco era un huevo sin talle), y el hombro baja de 0,191 a
  // 0,183 porque medía 2,32 cabezas de ancho contra las 2,0 del canon.
  // El pico sigue estando A LA ALTURA DEL HOMBRO: es lo que evita que el
  // deltoide asome por fuera de la camiseta.
  const pecho = tronco([
    [-0.020, 0.150], [ 0.010, 0.152], [ 0.060, 0.147],
    [ 0.120, 0.140], [ 0.190, 0.142], [ 0.270, 0.156], [ 0.350, 0.170],
    [ 0.430, 0.180], [ 0.492, 0.183],
    [ 0.528, 0.168], [ 0.552, 0.120], [ 0.566, 0.060], [ 0.572, 0.018]
  ], matCam, 1.30, 0.76);
  torso.add(pecho);

  // trapecio: sin esto el cuello sale del torso como un caño de una caja
  const trapecio = esf(0.112, matCam);
  trapecio.scale.set(1.66, 0.36, 0.70);          // llega hasta el nacimiento del brazo
  trapecio.position.y = 0.494;
  trapecio.castShadow = true;
  torso.add(trapecio);

  const dorsal = new THREE.Mesh(
    new THREE.PlaneGeometry(0.215, 0.215),
    new THREE.MeshStandardMaterial({ map: texturaDorsal(numero), transparent: true, roughness: 0.85 })
  );
  dorsal.position.set(0, 0.305, 0.128);
  torso.add(dorsal);

  // --- cuello y cabeza ---
  // Del hombro a la coronilla sobraban 8 cm: el cuello era una columna y la
  // cabeza quedaba demasiado arriba del tronco.
  const cuello = new THREE.Group();
  cuello.position.y = 0.503;
  torso.add(cuello);
  const gCuello = miembro([[0, 0.050], [1, 0.058]], 0.06, matPiel, 1, 0.92);
  gCuello.position.y = 0.055;
  cuello.add(gCuello);

  const craneo = esf(0.104, matPiel);
  craneo.scale.set(0.94, 1.06, 1.00);
  craneo.position.y = 0.152;
  cuello.add(craneo);
  const mandibula = esf(0.072, matPiel);            // mentón: sin esto la cabeza es una bola
  mandibula.scale.set(0.84, 0.62, 0.94);
  mandibula.position.set(0, 0.116, -0.022);
  cuello.add(mandibula);
  const nariz = new THREE.Mesh(new THREE.ConeGeometry(0.017, 0.042, 8), matPiel);
  nariz.rotation.x = -Math.PI/2 - 0.35;
  nariz.position.set(0, 0.146, -0.098);
  cuello.add(nariz);
  [-1, 1].forEach(l => {
    // La oreja iba en z=-0,002, o sea a la altura del pómulo: de frente
    // asomaba en la mejilla como una cicatriz. Va corrida hacia atrás.
    const oreja = esf(0.021, matPiel);
    oreja.scale.set(0.34, 1.05, 0.78);
    oreja.position.set(l*0.097, 0.145, 0.014);
    cuello.add(oreja);
    const ojo = esf(0.0165, matOjo);
    ojo.scale.set(1.06, 0.82, 0.62);
    ojo.position.set(l*0.038, 0.162, -0.0865);   // hundido: sólo asoma el casquete
    cuello.add(ojo);
    const pup = esf(0.0082, matPupila);
    pup.position.set(l*0.038, 0.1615, -0.0935);
    cuello.add(pup);
    const ceja = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.008, 0.012), matPelo);
    ceja.position.set(l*0.038, 0.184, -0.099);   // apoyada sobre la piel, no clavada en ella
    ceja.rotation.z = -l*0.12;
    cuello.add(ceja);
  });
  // boca: una ranura apoyada sobre el mentón. Sin ella la cara era dos puntos
  // y una nariz, y de cerca no se leía como cara.
  const boca = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.007, 0.010),
    new THREE.MeshStandardMaterial({ color: 0x7d4b42, roughness: 0.75 }));
  boca.position.set(0, 0.1135, -0.0935);
  boca.rotation.x = 0.22;
  cuello.add(boca);

  // Pelo: un CASQUETE que flota por encima del cráneo sin tocarlo en ningún
  // punto. Dos esferas de radio parecido que se cruzan (0,112 contra 0,104)
  // se cortan en un ángulo muy abierto, y ahí las dos superficies caen sobre
  // la misma profundidad: sale un borde dentado que parte la cara al medio.
  // No se arregla con polygonOffset —eso sólo decide quién gana el pixeleo—:
  // se arregla no cruzándose. El casquete es más grande que el cráneo en
  // todo lo que cubre, así que el borde del pelo es su propio borde
  // geométrico (limpio) y no una intersección.
  const pelo = new THREE.Mesh(
    new THREE.SphereGeometry(0.122, 26, 18, 0, Math.PI*2, 0, Math.PI*0.50), matPelo);
  pelo.scale.set(0.93, 1, 1);
  pelo.position.set(0, 0.1465, 0.011);
  // Positivo sube el borde ADELANTE. En negativo el casquete bajaba sobre los
  // ojos y la cabeza quedaba con visera.
  pelo.rotation.x = 0.34;
  pelo.castShadow = true;
  cuello.add(pelo);

  // --- brazos ---
  const brazos = [];
  [-1, 1].forEach(lado => {
    const hombro = new THREE.Group();
    hombro.position.set(lado*0.180, 0.492, 0);
    torso.add(hombro);
    // El deltoide es la TAPA del brazo, no una bola en el eje de giro: va un
    // poco más abajo y del ancho del brazo, así continúa el bíceps en vez de
    // interrumpirlo.
    const deltoide = esf(0.060, matManga);
    deltoide.scale.set(0.96, 0.92, 0.96);
    deltoide.position.y = -0.016;
    hombro.add(deltoide);
    const sup = miembro([[0, 0.058], [0.30, 0.056], [0.70, 0.048], [1, 0.042]],
                        0.332, matManga, 1, 0.94);   // 0,186 de la altura, como el canon
    hombro.add(sup);
    // borde de la manga
    const manga = miembro([[0, 0.062], [1, 0.058]], 0.11, matCam, 1, 0.94);
    hombro.add(manga);

    const codo = new THREE.Group();
    codo.position.y = -0.332;
    hombro.add(codo);
    const rotula = esf(0.0415, matPiel);       // mismo criterio que la rodilla
    rotula.scale.set(0.95, 0.64, 0.93);
    codo.add(rotula);
    const ante = miembro([[0, 0.043], [0.35, 0.041], [1, 0.031]], 0.278, matPiel, 1, 0.92);
    codo.add(ante);
    const mano = new THREE.Group();
    // El canon pone la punta de los dedos al 38% de la altura, pero eso es con
    // la mano ABIERTA; el muñeco corre con el puño cerrado, así que lo correcto
    // acá es ~42%. Con el brazo anterior quedaba en 44%: la mano a la altura de
    // la cadera en vez de a media pierna.
    mano.position.y = -0.293;
    const palma = esf(0.040, matPiel);
    palma.scale.set(0.82, 1.55, 0.50);
    mano.add(palma);
    const dedos = esf(0.034, matPiel);          // el puño cerrado al correr
    dedos.scale.set(0.90, 0.80, 0.62);
    dedos.position.y = -0.052;
    mano.add(dedos);
    const pulgar = esf(0.017, matPiel);
    pulgar.scale.set(1, 1.5, 1);
    pulgar.position.set(-lado*0.028, -0.018, 0.012);
    mano.add(pulgar);
    codo.add(mano);
    brazos.push({ hombro, codo, lado });
  });

  // cintura del short: cubre la pelvis y el borde abierto de la camiseta
  const cintura = tronco([
    [-0.055, 0.150], [-0.010, 0.158], [ 0.030, 0.156], [ 0.060, 0.146]
  ], matShort, 1.22, 0.82);
  cintura.position.y = -0.035;
  cadera.add(cintura);

  // --- piernas ---
  const piernas = [];
  [-1, 1].forEach(lado => {
    const caderaP = new THREE.Group();
    caderaP.position.set(lado*0.098, -0.03, 0);
    cadera.add(caderaP);
    const muslo = miembro([[0, 0.098], [0.25, 0.092], [0.60, 0.080], [1, 0.068]],
                          0.4555, matPiel, 1, 0.95);
    caderaP.add(muslo);
    const shortP = miembro([[0, 0.106], [0.60, 0.101], [0.94, 0.093], [1, 0.098]],
                           0.21, matShort, 1, 0.97);
    shortP.position.y = 0.035;
    caderaP.add(shortP);

    const rodilla = new THREE.Group();
    rodilla.position.y = -0.4555;
    caderaP.add(rodilla);
    // La rodilla es de PIEL y del mismo ancho que el muslo: antes era una
    // esfera blanca que sobresalía del perfil y se veía como una pelota
    // pegada. La media arranca más abajo, como en la cancha.
    // Medida: la rótula tiene 129 mm de ancho contra 136 del muslo, o sea que
    // NO sobresale. Lo que se veía como bola era el sombreado: en una esfera
    // la normal barre media vuelta en diez centímetros y agarra un brillo que
    // el tronco de cono de al lado no tiene. Achatada baja ese barrido; muy
    // achatada (0,56) el canto vuelve a caer en la silueta y se ve como disco.
    // 0,62 es el punto medio entre las dos cosas.
    const rot = esf(0.066, matPiel);
    rot.scale.set(0.95, 0.62, 0.93);
    rodilla.add(rot);
    const pant = miembro([[0, 0.067], [0.22, 0.072], [0.55, 0.058], [1, 0.036]],
                         0.4355, matPiel, 1, 0.95);
    rodilla.add(pant);
    // media, superpuesta sobre la parte baja de la pierna
    const media = miembro([[0, 0.074], [0.06, 0.070], [0.45, 0.062], [1, 0.039]],
                          0.335, matMedias, 1, 0.96);
    media.position.y = -0.10;
    rodilla.add(media);

    const tobillo = new THREE.Group();
    tobillo.position.y = -0.4355;
    rodilla.add(tobillo);
    // botín: empeine que se afina en la punta, suela y talón
    const empeine = esf(0.058, matBotin);
    empeine.scale.set(0.74, 0.52, 1.75);
    empeine.position.set(0, -0.022, 0.052);
    empeine.castShadow = true;
    tobillo.add(empeine);
    const punta = esf(0.036, matBotin);
    punta.scale.set(0.80, 0.62, 1.5);
    punta.position.set(0, -0.030, 0.128);
    tobillo.add(punta);
    const talon = esf(0.044, matBotin);
    talon.scale.set(0.86, 0.95, 0.80);
    talon.position.set(0, -0.004, -0.026);
    tobillo.add(talon);
    const suela = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.016, 0.215), matBotin);
    suela.position.set(0, -0.052, 0.048);
    suela.castShadow = true;
    tobillo.add(suela);
    piernas.push({ caderaP, rodilla, tobillo, lado });
  });

  G.userData = {
    cadera, torso, cuello, brazos, piernas,
    paso: 0, patada: -1, alturaBase: 0.991,
    v: new THREE.Vector3()
  };
  return G;
}

/* ---------- Animación ---------- */
function animarFutbolista(J, dt, velocidad){
  const u = J.userData;
  const corriendo = velocidad > 0.35;
  const cadencia = 5.5 + Math.min(velocidad, 7)*0.85;
  if(corriendo) u.paso += dt*cadencia;
  else u.paso += dt*1.6;

  const t = u.paso;
  const amp = corriendo ? Math.min(1, velocidad/5.2) : 0.10;
  const s = Math.sin(t), c = Math.cos(t);

  // piernas: el muslo va y viene, la rodilla siempre dobla hacia atrás
  u.piernas.forEach((p, i) => {
    const f = i === 0 ? s : -s;
    const fc = i === 0 ? c : -c;
    p.caderaP.rotation.x = f*0.85*amp;
    p.rodilla.rotation.x = -Math.max(0, -f*0.5 + 0.45)*1.5*amp - 0.06;
    p.tobillo.rotation.x = (0.25 - fc*0.28)*amp;
    p.caderaP.rotation.z = 0;
  });
  // brazos: al revés que las piernas
  u.brazos.forEach((b, i) => {
    const f = i === 0 ? -s : s;
    b.hombro.rotation.x = f*0.70*amp;
    b.hombro.rotation.z = b.lado*(0.14 + 0.06*amp);
    b.codo.rotation.x = -(0.45 + Math.max(0, f)*0.5)*amp - 0.15;
  });
  // parado: respira y hace un leve balanceo, para que no quede congelado
  if(!corriendo){
    const r = Math.sin(u.paso*1.15);
    u.torso.rotation.x = 0.05 + r*0.018;
    u.cuello.rotation.y = Math.sin(u.paso*0.42)*0.16;
    u.brazos.forEach((b, i) => { b.hombro.rotation.z = b.lado*(0.15 + r*0.02); });
  }
  // el torso se inclina hacia adelante y rebota
  u.torso.rotation.x = corriendo ? (0.06 + amp*0.16) : u.torso.rotation.x;
  u.torso.rotation.y = -s*0.12*amp;
  u.cuello.rotation.x = -0.05 - amp*0.10;
  J.position.y = Math.abs(Math.sin(t))*0.045*amp;

  // ---- patada: pisa por encima del ciclo de carrera ----
  if(u.patada >= 0){
    u.patada += dt;
    const T = 0.58;
    const k = u.patada / T;
    if(k >= 1){ u.patada = -1; u.cadera.rotation.y = 0; u.cadera.rotation.z = 0; u.torso.rotation.z = 0; }
    else {
      // Un remate no es una pierna que sube: es una cadena. La pelvis abre y
      // cierra, el muslo arrastra a la rodilla, y la rodilla llega tarde y
      // late. Por eso cada tramo va con su propia curva y no con una rampa
      // lineal: con rampas la velocidad angular es constante y el golpe
      // queda de madera.
      const sua  = x => x*x*(3 - 2*x);                 // arranca y frena suave
      const late = x => x*x*x;                         // acelera hasta el final
      const mez  = (a, b, t) => a + (b - a)*t;
      // Peso: entra y sale mezclándose con la corrida, así no pega el salto
      // de pose al empezar ni al terminar.
      const peso = Math.max(0, Math.min(1, k/0.10, (1 - k)/0.18));

      const pie   = u.piernas[1];                      // derecha: la que pega
      const apoyo = u.piernas[0];                      // izquierda: la que planta

      // fases: 0–0,30 carga | 0,30–0,52 latigazo (contacto ~0,46) | resto, acompañamiento
      let muslo, rodilla, tobillo;
      if(k < 0.30){                                    // carga
        const a = sua(k/0.30);
        muslo   = -1.05*a;
        rodilla = -1.55*a;                             // el talón sube al glúteo
        tobillo = -0.10 - 0.25*a;
      } else if(k < 0.52){                             // latigazo
        const a = (k - 0.30)/0.22;
        muslo   = mez(-1.05, 0.62, sua(a));            // el muslo va primero
        rodilla = mez(-1.55, -0.06, late(a));          // la rodilla llega tarde
        tobillo = -0.35;                               // empeine firme
      } else {                                         // acompañamiento
        const a = sua((k - 0.52)/0.48);
        muslo   = mez(0.62, 1.30, Math.min(1, a*1.9)) - Math.max(0, a - 0.55)*1.5;
        rodilla = mez(-0.06, -0.55, a);                // vuelve a doblar al bajar
        tobillo = mez(-0.35, 0.05, a);
      }
      pie.caderaP.rotation.x = mez(pie.caderaP.rotation.x, muslo, peso);
      pie.rodilla.rotation.x = mez(pie.rodilla.rotation.x, rodilla, peso);
      pie.tobillo.rotation.x = mez(pie.tobillo.rotation.x, tobillo, peso);
      pie.caderaP.rotation.z = mez(pie.caderaP.rotation.z, -0.30*Math.sin(k*Math.PI), peso);

      // Pierna de apoyo: se planta adelante, y la rodilla se dobla para
      // aguantar el peso justo cuando pega. Antes acompañaba al revés de la
      // otra y el muñeco parecía flotar.
      // La carga tiene que ser máxima CUANDO PEGA (k~0,46), no antes: es el
      // instante en que todo el peso está sobre el pie de apoyo. Con el pico
      // en el medio del recorrido el muñeco se hundía durante la carga y
      // llegaba al golpe ya erguido, justo al revés.
      const carga = Math.sin(Math.min(1, Math.max(0, (k - 0.10)/0.66))*Math.PI);
      apoyo.caderaP.rotation.x = mez(apoyo.caderaP.rotation.x, 0.34 - 0.20*carga, peso);
      apoyo.rodilla.rotation.x = mez(apoyo.rodilla.rotation.x, -0.30 - 0.34*carga, peso);
      apoyo.tobillo.rotation.x = mez(apoyo.tobillo.rotation.x, 0.10 + 0.30*carga, peso);
      apoyo.caderaP.rotation.z = mez(apoyo.caderaP.rotation.z, 0.12, peso);

      // Pelvis: abre en la carga y cierra en el golpe. Va ANTES que el torso
      // (arrastra al muslo con ella); el torso llega un toque después.
      const giroPelvis = k < 0.30 ? -0.34*sua(k/0.30)
                                  : mez(-0.34, 0.40, sua(Math.min(1, (k - 0.30)/0.40)));
      u.cadera.rotation.y = giroPelvis*peso;
      u.cadera.rotation.z = -0.10*carga*peso;          // cae del lado del apoyo
      u.cadera.position.y = 0.991 - (0.045*carga)*peso; // el cuerpo baja al plantar

      const giroTorso = k < 0.36 ? -0.26*sua(k/0.36)
                                 : mez(-0.26, 0.34, sua(Math.min(1, (k - 0.36)/0.44)));
      u.torso.rotation.y = mez(u.torso.rotation.y, giroTorso, peso);
      u.torso.rotation.x = mez(u.torso.rotation.x, -0.06 + 0.30*carga, peso);
      u.torso.rotation.z = 0.13*carga*peso;
      u.cuello.rotation.y = mez(u.cuello.rotation.y, -giroPelvis*0.55, peso);  // mira la pelota
      u.cuello.rotation.x = mez(u.cuello.rotation.x, -0.30*carga, peso);  // mira la pelota

      // Brazos de contrapeso: el del lado de la pierna que pega va atrás y el
      // otro cruza adelante. Sin esto el torso gira solo y no se sostiene.
      const cruce = Math.sin(k*Math.PI);
      u.brazos[0].hombro.rotation.x = mez(u.brazos[0].hombro.rotation.x, -1.15*cruce, peso);
      u.brazos[0].hombro.rotation.z = mez(u.brazos[0].hombro.rotation.z, u.brazos[0].lado*(0.30 + 0.35*cruce), peso);
      u.brazos[0].codo.rotation.x   = mez(u.brazos[0].codo.rotation.x, -0.75 - 0.35*cruce, peso);
      u.brazos[1].hombro.rotation.x = mez(u.brazos[1].hombro.rotation.x, 0.70*cruce, peso);
      u.brazos[1].hombro.rotation.z = mez(u.brazos[1].hombro.rotation.z, u.brazos[1].lado*(0.34 + 0.30*cruce), peso);
      u.brazos[1].codo.rotation.x   = mez(u.brazos[1].codo.rotation.x, -0.30 - 0.30*cruce, peso);

      J.position.y = mez(J.position.y, 0.02*Math.max(0, k - 0.55), peso);
      return k;
    }
  }
  u.cadera.rotation.y = 0; u.cadera.rotation.z = 0;
  u.cadera.position.y = 0.991; u.torso.rotation.z = 0;
  return -1;
}

/* ============================================================
   CARGA DE UN MODELO CON ESQUELETO (.glb de Mixamo)
   ============================================================ */
function montarGLB(buffer, nombre){
  const cargador = new THREE.GLTFLoader();
  cargador.parse(buffer, '', gltf => {
    const raiz = gltf.scene || gltf.scenes[0];
    if(!modelo){
      // primer archivo: además del esqueleto trae la malla
      const caja = new THREE.Box3().setFromObject(raiz);
      const alto = Math.max(0.001, caja.max.y - caja.min.y);
      const k = 1.80 / alto;                    // llevarlo a 1,80 m
      raiz.scale.setScalar(k);
      raiz.position.y = -caja.min.y * k;        // apoyar los pies en el piso
      raiz.rotation.y = giroModelo;
      raiz.traverse(o => { if(o.isMesh){ o.castShadow = true; o.receiveShadow = false; } });
      modelo = raiz;
      jugador.add(modelo);
      jugador.userData.cadera.visible = false;  // guardar el muñeco propio
      mezclador = new THREE.AnimationMixer(modelo);
    }
    (gltf.animations || []).forEach(c => {
      clipsCargados.push({ clip: c, nombre: (c.name && c.name !== 'mixamo.com' ? c.name : nombre) });
    });
    // Mixamo nombra casi todo "mixamo.com", así que se adivina por el nombre
    // del ARCHIVO, que es lo único que distingue una animación de otra.
    clipsCargados.forEach((c, i) => {
      const n = (c.nombre || '').toLowerCase();
      if(!roles.correr && /run|corr|sprint/.test(n)) asignarRol(i, 'correr');
      else if(!roles.parado && /idle|stand|parad|quiet/.test(n)) asignarRol(i, 'parado');
      else if(!roles.patear && /kick|shoot|patea|soccer/.test(n)) asignarRol(i, 'patear');
    });
    if(!roles.correr && clipsCargados.length) asignarRol(0, 'correr');
    pintarPanel();
  }, err => {
    document.getElementById('estadoModelo').innerHTML =
      'No pude leer <b>' + nombre + '</b>. Tiene que ser un <b>.glb</b> ' +
      '(glTF binario). Si bajaste un .fbx, pasalo por Blender.';
  });
}

function asignarRol(indice, rol){
  const c = clipsCargados[indice];
  if(!c || !mezclador) return;
  roles[rol] = indice;
  const a = mezclador.clipAction(c.clip);
  if(rol === 'patear'){ a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
  acciones[rol] = a;
  pintarPanel();
}

function pintarPanel(){
  const est = document.getElementById('estadoModelo');
  const lista = document.getElementById('listaClips');
  const volver = document.getElementById('volverMuneco');
  if(!modelo){ return; }
  est.innerHTML = 'Modelo cargado. Asigná cada animación a lo que corresponde:';
  lista.innerHTML = '';
  clipsCargados.forEach((c, i) => {
    const fila = document.createElement('div');
    fila.className = 'filaClip';
    const nom = document.createElement('span');
    nom.className = 'nom'; nom.textContent = c.nombre;
    fila.appendChild(nom);
    [['correr','CORRER'],['parado','PARADO'],['patear','PATEAR']].forEach(([rol, txt]) => {
      const b = document.createElement('button');
      b.textContent = txt;
      if(roles[rol] === i) b.className = 'puesto';
      b.addEventListener('click', () => asignarRol(i, rol));
      fila.appendChild(b);
    });
    lista.appendChild(fila);
  });
  const girar = document.createElement('button');
  girar.textContent = 'GIRAR 180°';
  girar.style.cssText = 'margin-top:8px;width:100%;padding:6px;border-radius:6px;cursor:pointer;' +
    'border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.06);color:#aab5c4;' +
    'font-family:Oswald,sans-serif;font-size:11px;letter-spacing:1px;';
  girar.addEventListener('click', () => {
    giroModelo += Math.PI;
    if(modelo) modelo.rotation.y = giroModelo;
  });
  lista.appendChild(girar);
  volver.style.display = 'block';
}

function volverAlMuneco(){
  if(modelo){ jugador.remove(modelo); modelo = null; mezclador = null; }
  clipsCargados = [];
  roles.correr = roles.parado = roles.patear = null;
  acciones.correr = acciones.parado = acciones.patear = null;
  accionCorriendo = null; patadaModelo = -1;
  jugador.userData.cadera.visible = true;
  document.getElementById('listaClips').innerHTML = '';
  document.getElementById('volverMuneco').style.display = 'none';
  document.getElementById('estadoModelo').innerHTML =
    'Está corriendo el <b>muñeco propio</b>, con la animación escrita a mano.<br><br>' +
    'Arrastrá acá un <b>.glb</b> de Mixamo y lo carga al toque, con sus animaciones.';
}

function prepararSoltar(){
  const zona = document.getElementById('zonaSoltar');
  let cuenta = 0;
  window.addEventListener('dragenter', e => { e.preventDefault(); cuenta++; zona.classList.add('activa'); });
  window.addEventListener('dragover',  e => { e.preventDefault(); });
  window.addEventListener('dragleave', e => { e.preventDefault(); if(--cuenta <= 0) zona.classList.remove('activa'); });
  window.addEventListener('drop', e => {
    e.preventDefault(); cuenta = 0; zona.classList.remove('activa');
    const archivos = [...(e.dataTransfer.files || [])];
    archivos.filter(f => /\.glb$/i.test(f.name)).forEach(f => {
      const fr = new FileReader();
      fr.onload = () => montarGLB(fr.result, f.name.replace(/\.glb$/i, ''));
      fr.readAsArrayBuffer(f);
    });
    if(archivos.length && !archivos.some(f => /\.glb$/i.test(f.name))){
      document.getElementById('estadoModelo').innerHTML =
        'Eso no es un <b>.glb</b>. Mixamo baja <b>.fbx</b>: abrilo en Blender ' +
        'y exportá <b>glTF 2.0 (.glb)</b>.';
    }
  });
  document.getElementById('volverMuneco').addEventListener('click', volverAlMuneco);
}

/* ============================================================
   ARQUERO
   Se para en la línea, sigue la pelota de costado y, cuando le llega un
   remate lejos de las manos, se tira. Con reacción y puntería imperfectas
   a propósito: un arquero que adivina exacto ataja todo y no hay gol.
   ============================================================ */
/* Valores elegidos barriendo combinaciones y midiendo el porcentaje de gol.
   Lo que decide el resultado es errorMax —cuánto le erra a la trayectoria—,
   no el alcance ni la velocidad: con 0,9 ataja el 95% y no hay forma de
   hacerle un gol; con 1,5 quedan dos de cada tres atajadas. */
const ARQ3D = {
  lineaX: CANCHA_LARGO/2 - 1.5,   // dónde se para
  alcance: 0.62,                  // brazos extendidos, de pie
  alcanceVuelo: 1.60,             // estirado en el aire
  velLateral: 3.8,
  reaccion: 0.16,                 // demora antes de decidir
  errorMax: 1.50                  // cuánto puede errarle a la trayectoria
};

function iniciarArquero(){
  arquero.position.set(ARQ3D.lineaX, 0, 0);
  arquero.rotation.y = -Math.PI/2;          // mirando a la cancha
  const A = arquero.userData;
  A.vuelo = -1; A.ladoVuelo = 0; A.zObjetivo = 0;
  A.espera = 0; A.error = 0; A.leyoRemate = false;
  A.zBase = 0;
}

function animarArquero(dt){
  const u = arquero.userData;
  u.paso += dt*1.5;
  const respira = Math.sin(u.paso*1.8)*0.02;

  if(u.vuelo >= 0){
    // ---- estirada ----
    const k = Math.min(1, u.vuelo/0.62);
    const arco = Math.sin(Math.min(1, k*1.25)*Math.PI);     // sube y baja
    const rol = u.ladoVuelo * (0.35 + 1.15*Math.min(1, k*2.2));
    u.cadera.rotation.z = rol;
    u.cadera.rotation.x = -0.25*arco;
    u.cadera.position.y = 0.92 + arco*0.55 - k*k*0.45;
    u.torso.rotation.x = 0.10;
    u.torso.rotation.z = 0;
    // los dos brazos van hacia el lado de la estirada, estirados
    u.brazos.forEach(b => {
      b.hombro.rotation.x = -1.05 - 0.35*arco;
      b.hombro.rotation.z = b.lado*0.10 + u.ladoVuelo*0.55;
      b.codo.rotation.x = -0.10;
    });
    // piernas juntas y estiradas hacia atrás
    u.piernas.forEach(p => {
      p.caderaP.rotation.x = 0.22 - 0.5*arco;
      p.caderaP.rotation.z = 0;
      p.rodilla.rotation.x = -0.30;
      p.tobillo.rotation.x = 0.35;
    });
    return;
  }

  // ---- postura de espera: agachado, piernas abiertas, brazos afuera ----
  u.cadera.rotation.z = 0;
  u.cadera.rotation.x = 0;
  u.cadera.position.y = 0.80 + respira;
  u.torso.rotation.x = 0.26 + respira*0.5;
  u.torso.rotation.y = 0;
  u.torso.rotation.z = 0;
  u.cuello.rotation.x = -0.20;
  u.piernas.forEach(p => {
    p.caderaP.rotation.x = 0.34;
    p.caderaP.rotation.z = p.lado*0.17;
    p.rodilla.rotation.x = -0.62;
    p.tobillo.rotation.x = 0.30;
  });
  u.brazos.forEach(b => {
    b.hombro.rotation.x = -0.62;
    b.hombro.rotation.z = b.lado*0.90;
    b.codo.rotation.x = -0.40;
  });
}

function actualizarArquero(dt){
  const u = arquero.userData;
  const P = pelota.userData;
  const gx = CANCHA_LARGO/2 - 1.2;                    // línea de gol
  const medioArco = ARCO_ANCHO/2;

  if(u.vuelo >= 0){
    u.vuelo += dt;
    // se desplaza hacia donde se tiró
    const objetivo = u.zObjetivo;
    arquero.position.z += (objetivo - arquero.position.z) * Math.min(1, dt*5.5);
    if(u.vuelo > 1.15){                               // se levanta
      u.vuelo = -1; u.leyoRemate = false;
      arquero.position.z = lim(arquero.position.z, -medioArco, medioArco);
    }
    animarArquero(dt);
    return;
  }

  // ¿viene un remate al arco?
  let remate = false, tCruce = 0, zCruce = 0, yCruce = 0;
  if(P.v.x > 3 && pelota.position.x < gx){
    tCruce = (gx - pelota.position.x)/P.v.x;
    if(tCruce > 0 && tCruce < 1.6){
      zCruce = pelota.position.z + P.v.z*tCruce;
      yCruce = pelota.position.y + P.v.y*tCruce - 0.5*17.5*tCruce*tCruce;
      if(Math.abs(zCruce) < medioArco + 0.9 && yCruce < ARCO_ALTO + 0.5) remate = true;
    }
  }

  if(remate && !u.leyoRemate){
    u.leyoRemate = true;
    u.espera = ARQ3D.reaccion;
    u.error = (Math.random()*2 - 1)*ARQ3D.errorMax;   // no lee perfecto
  }
  if(!remate) u.leyoRemate = false;

  let destinoZ;
  if(remate){
    if(u.espera > 0){ u.espera -= dt; destinoZ = arquero.position.z; }
    else {
      destinoZ = lim(zCruce + u.error, -medioArco - 0.3, medioArco + 0.3);
      // si no llega caminando, se tira
      const falta = Math.abs(destinoZ - arquero.position.z);
      if(falta > ARQ3D.velLateral*tCruce*0.9 + 0.15 && tCruce < 0.85){
        u.vuelo = 0;
        u.ladoVuelo = Math.sign(destinoZ - arquero.position.z) || 1;
        u.zObjetivo = destinoZ;
      }
    }
  } else {
    // posicionamiento: acompaña la pelota sin salirse del arco
    destinoZ = lim(pelota.position.z*0.45, -medioArco + 0.25, medioArco - 0.25);
  }

  if(u.vuelo < 0){
    const paso = ARQ3D.velLateral*dt;
    const d = destinoZ - arquero.position.z;
    arquero.position.z += Math.abs(d) < paso ? d : Math.sign(d)*paso;
    arquero.position.x += (ARQ3D.lineaX - arquero.position.x) * Math.min(1, dt*3);
  }
  animarArquero(dt);
}

/* ¿Llegó a la pelota? El alcance crece cuando está estirado. */
function chequearAtajada(dt){
  const P = pelota.userData;
  if(P.atajada > 0){ P.atajada = Math.max(0, P.atajada - dt); return; }
  const u = arquero.userData;
  const dx = pelota.position.x - arquero.position.x;
  if(dx < -0.95 || dx > 0.50) return;
  const dz = Math.abs(pelota.position.z - arquero.position.z);
  const alcance = u.vuelo >= 0 ? ARQ3D.alcanceVuelo : ARQ3D.alcance;
  if(dz > alcance) return;
  const altoMax = u.vuelo >= 0 ? 2.05 : 1.95;
  if(pelota.position.y > altoMax) return;
  if(Math.hypot(P.v.x, P.v.z) < 2) return;

  // rechaza hacia afuera y arriba
  const haciaAfuera = Math.sign(pelota.position.z - arquero.position.z) || (Math.random() < 0.5 ? -1 : 1);
  const vel = Math.hypot(P.v.x, P.v.z);
  P.v.x = -Math.abs(P.v.x)*0.45;
  P.v.z = haciaAfuera*Math.max(2.5, vel*0.4);
  P.v.y = 2.6 + Math.random()*1.8;
  P.atajada = 0.5;
  P.pegado = 0.5;
  atajadas++;
  document.getElementById('atajadasTxt').textContent = atajadas;
  AUDIO3D.atajada();
  mostrarAviso3d('¡ATAJÓ!', '#8be36b', 1.1);
}

/* Mezcla de animaciones del modelo: correr y parado se cruzan según la
   velocidad, y la patada se dispara una sola vez encima. */
function animarModelo(dt, vel){
  mezclador.update(dt);
  const quiere = vel > 0.5 ? 'correr' : 'parado';
  const a = acciones[quiere] || acciones.correr;
  if(a && a !== accionCorriendo){
    if(accionCorriendo) accionCorriendo.fadeOut(0.22);
    a.reset().setEffectiveWeight(1).fadeIn(0.22).play();
    accionCorriendo = a;
  }
  if(accionCorriendo){
    accionCorriendo.setEffectiveTimeScale(
      quiere === 'correr' ? Math.max(0.65, Math.min(1.8, vel/3.4)) : 1
    );
  }
  if(patadaModelo >= 0){
    const dur = acciones.patear ? acciones.patear.getClip().duration : 0.6;
    patadaModelo += dt;
    const k = patadaModelo/dur;
    if(k >= 1){
      patadaModelo = -1;
      if(acciones.patear) acciones.patear.fadeOut(0.20);
      return -1;
    }
    return k;
  }
  return -1;
}

/* ============================================================
   ENTRADA
   ============================================================ */
const TECLAS_JUEGO = [' ', 'z', 'x', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if(TECLAS_JUEGO.indexOf(k) >= 0) e.preventDefault();
  if(!teclas[k]){
    AUDIO3D.activar();
    if(k === ' ') patear('tiro');
    if(k === 'z') patear('bajo');
    if(k === 'x') patear('alto');
    if(k === 'c') camaraModo = (camaraModo + 1) % 2;
  }
  teclas[k] = true;
});
window.addEventListener('keyup', e => { teclas[e.key.toLowerCase()] = false; });

function botonMover(id, tecla){
  const el = document.getElementById(id);
  if(!el) return;
  const on = e => { e.preventDefault(); AUDIO3D.activar(); teclas[tecla] = true; };
  const off = e => { e.preventDefault(); teclas[tecla] = false; };
  el.addEventListener('touchstart', on); el.addEventListener('touchend', off);
  el.addEventListener('touchcancel', off);
  el.addEventListener('mousedown', on);  el.addEventListener('mouseup', off);
  el.addEventListener('mouseleave', off);
}
function botonGolpe(id, tipo){
  const el = document.getElementById(id);
  if(!el) return;
  const dar = e => { e.preventDefault(); AUDIO3D.activar(); patear(tipo); };
  el.addEventListener('touchstart', dar);
  el.addEventListener('mousedown', dar);
}

/* Tres formas de golpear la pelota. Cambian fuerza y cuánto se eleva:
   el tiro va fuerte y a media altura, el pase bajo va rasante, y el pase
   alto sale despacio pero muy arriba. */
// La pelota salía disparada: cruzaba media cancha antes de que uno llegara a
// mirarla. Baja un 25% en los tres golpes.
const GOLPES = {
  tiro: { fuerza: 11.6, alto: 4.2, nombre: 'REMATE' },
  bajo: { fuerza:  7.4, alto: 0.5, nombre: 'PASE BAJO' },
  alto: { fuerza:  6.3, alto: 8.4, nombre: 'PASE ALTO' }
};
let tipoGolpe = 'tiro';

function patear(tipo){
  tipoGolpe = tipo || 'tiro';
  if(usandoModelo()){
    if(patadaModelo >= 0) return;
    patadaModelo = 0;
    if(acciones.patear){
      acciones.patear.reset(); acciones.patear.setEffectiveWeight(1); acciones.patear.play();
    }
    return;
  }
  const u = jugador.userData;
  if(u.patada < 0) u.patada = 0;
}

/* ============================================================
   BUCLE
   ============================================================ */
function actualizar(dt){
  const u = jugador.userData;
  if(pausaGol > 0){
    pausaGol -= dt;
    if(pausaGol <= 0) reponer();
  }
  if(avisoTimer3d > 0){
    avisoTimer3d -= dt;
    if(avisoTimer3d <= 0 && pausaGol <= 0) document.getElementById('avisoGol').style.display = 'none';
  }

  // ---- mover al jugador ----
  let dx = 0, dz = 0;
  if(teclas['arrowleft']  || teclas['a']) dx -= 1;
  if(teclas['arrowright'] || teclas['d']) dx += 1;
  if(teclas['arrowup']    || teclas['w']) dz -= 1;
  if(teclas['arrowdown']  || teclas['s']) dz += 1;
  const m = Math.hypot(dx, dz);
  const corre = teclas['shift'] ? 7.2 : 4.4;
  if(m > 0){
    dx /= m; dz /= m;
    u.v.x += (dx*corre - u.v.x) * Math.min(1, dt*7);
    u.v.z += (dz*corre - u.v.z) * Math.min(1, dt*7);
    jugador.rotation.y = Math.atan2(dx, dz) - Math.PI;
  } else {
    u.v.x *= Math.pow(0.02, dt);
    u.v.z *= Math.pow(0.02, dt);
  }
  jugador.position.x += u.v.x*dt;
  jugador.position.z += u.v.z*dt;
  jugador.position.x = Math.max(-cancha.limX, Math.min(cancha.limX, jugador.position.x));
  jugador.position.z = Math.max(-cancha.limZ, Math.min(cancha.limZ, jugador.position.z));

  const vel = Math.hypot(u.v.x, u.v.z);
  const kPatada = usandoModelo() ? animarModelo(dt, vel)
                                 : animarFutbolista(jugador, dt, vel);
  actualizarArquero(dt);

  // ---- contacto con la pelota ----
  const P = pelota.userData;
  const adelante = new THREE.Vector3(Math.sin(jugador.rotation.y + Math.PI), 0,
                                     Math.cos(jugador.rotation.y + Math.PI));
  const alPie = new THREE.Vector3().subVectors(pelota.position, jugador.position);
  alPie.y = 0;
  const dist = alPie.length();

  // `P.pegado <= 0`, NO `!P.pegado`: el contador baja hasta quedar en un
  // negativo chiquito y ahí se frena, y `!(-0.006)` es false. Con la
  // negación, después del primer pelotazo no se podía volver a patear nunca.
  if(kPatada >= 0.42 && kPatada <= 0.60 && dist < 1.25 && P.pegado <= 0){
    // el latigazo justo cuando el pie pasa por la pelota
    const dir = adelante.clone().normalize();
    const G = GOLPES[tipoGolpe] || GOLPES.tiro;
    const fuerza = G.fuerza + Math.min(vel, 7)*0.55;
    P.v.set(dir.x*fuerza, G.alto + Math.random()*0.6, dir.z*fuerza);
    P.giro.set(-dir.z*14, 0, dir.x*14);
    P.pegado = 0.55;
    AUDIO3D.patada(tipoGolpe === 'tiro' ? 1 : (tipoGolpe === 'alto' ? 0.7 : 0.45));
  }
  if(P.pegado > 0) P.pegado = Math.max(0, P.pegado - dt);

  // ---- conducción: la pelota acompaña al jugador ----
  // Se la lleva a un punto fijo delante del pie y se la empuja con toques,
  // más fuertes cuanto más se escapó. Antes se empujaba SÓLO si ya estaba
  // pegada y el jugador en movimiento, así que en los hechos no se conducía.
  const RADIO_CONTROL = 1.25;
  if(P.pegado <= 0 && dist < RADIO_CONTROL && pelota.position.y < 0.42){
    const dir = adelante.clone().normalize();
    const objetivo = jugador.position.clone().addScaledVector(dir, 0.58);
    const hacia = objetivo.clone().sub(pelota.position);
    hacia.y = 0;
    const d2 = hacia.length();
    if(d2 > 0.03){
      hacia.normalize();
      const empuje = Math.min(vel*1.35 + d2*5.0, vel*1.7 + 3.4);
      const k = Math.min(1, dt*10);
      P.v.x += (hacia.x*empuje - P.v.x)*k;
      P.v.z += (hacia.z*empuje - P.v.z)*k;
    }
  }

  // ---- física de la pelota ----
  P.v.y -= 17.5*dt;
  pelota.position.addScaledVector(P.v, dt);
  if(pelota.position.y < 0.11){
    pelota.position.y = 0.11;
    if(P.v.y < -0.6){
      AUDIO3D.pique(Math.abs(P.v.y));
      P.v.y = -P.v.y*0.55;
      // El frenado horizontal va SOLO en el pique. Aplicado en cada cuadro
      // que toca el piso, a 60 por segundo, mataba cualquier pelotazo en
      // medio segundo y la pelota nunca llegaba al arco.
      P.v.x *= 0.90; P.v.z *= 0.90;   // un pique frena un poco el avance
    } else P.v.y = 0;
  }
  if(pelota.position.y <= 0.115){
    // Rodaba casi sin frenarse y la pelota suelta se iba sola hasta el fondo.
    const f = Math.pow(0.62, dt);        // rodar sobre césped
    P.v.x *= f; P.v.z *= f;
  }
  chequearAtajada(dt);

  // paredes: rebota en el límite del campo, salvo por la boca del arco
  const LX = CANCHA_LARGO/2 - 1.0, LZ = CANCHA_ANCHO/2 - 1.0;
  const enBoca = Math.abs(pelota.position.z) < ARCO_ANCHO/2 - 0.12 &&
                 pelota.position.y < ARCO_ALTO - 0.05;
  if(Math.abs(pelota.position.x) > LX && !enBoca){
    pelota.position.x = Math.sign(pelota.position.x)*LX;
    P.v.x *= -0.62;
  }
  if(enBoca && pausaGol <= 0 && Math.abs(pelota.position.x) > LX - 0.15) gol3d();
  if(Math.abs(pelota.position.x) > LX + 1.7){       // fondo de la red
    pelota.position.x = Math.sign(pelota.position.x)*(LX + 1.7);
    P.v.x *= -0.15; P.v.z *= 0.5;
  }
  if(Math.abs(pelota.position.z) > LZ){
    pelota.position.z = Math.sign(pelota.position.z)*LZ;
    P.v.z *= -0.62;
  }
  // rodar: girar según cuánto se desplaza
  const vh = Math.hypot(P.v.x, P.v.z);
  if(vh > 0.02){
    const eje = new THREE.Vector3(P.v.z, 0, -P.v.x).normalize();
    pelota.rotateOnWorldAxis(eje, (vh*dt)/0.11);
  }

  // ---- cámara ----
  const foco = new THREE.Vector3(
    jugador.position.x*0.45 + pelota.position.x*0.55,
    0.9,
    jugador.position.z*0.45 + pelota.position.z*0.55
  );
  let destino;
  if(camaraModo === 0){
    // transmisión: de costado, siguiendo la jugada
    // Estaba a 22 m: el jugador ocupaba setenta píxeles y no se veía nada del
    // muñeco. Más cerca, y sigue mejor a lo largo de la cancha (0,85) para que
    // en los costados no quede todo de perfil lejano.
    destino = new THREE.Vector3(foco.x*0.85, 7.8, CANCHA_ANCHO/2 + 5.0);
  } else {
    // detrás del jugador
    const atras = adelante.clone().multiplyScalar(-4.6);
    destino = new THREE.Vector3(
      jugador.position.x + atras.x, 2.9, jugador.position.z + atras.z
    );
  }
  camara.position.lerp(destino, Math.min(1, dt*(camaraModo === 0 ? 2.2 : 4.5)));
  camara.lookAt(foco.x, camaraModo === 0 ? 1.1 : 1.2, foco.z);

  actualizarFlashes(dt);

  // el murmullo sube cuando la jugada se acerca a un arco
  const cerca = Math.min(1, Math.max(0,
    (Math.abs(pelota.position.x) - CANCHA_LARGO*0.18) / (CANCHA_LARGO*0.30)));
  AUDIO3D.ambiente(cerca);

  // la sombra sigue a la acción, así se mantiene nítida
  luzSol.position.set(foco.x + 18, 30, foco.z + 14);
  luzSol.target.position.set(foco.x, 0, foco.z);
  luzSol.target.updateMatrixWorld();
}

let avisoTimer3d = 0;
function mostrarAviso3d(texto, color, seg){
  const e = document.getElementById('avisoGol');
  e.textContent = texto;
  e.style.color = color || '#f5c542';
  e.style.display = 'flex';
  avisoTimer3d = seg || 1.9;
}

function gol3d(){
  goles++;
  document.getElementById('golesTxt').textContent = goles;
  mostrarAviso3d('¡GOL!', '#f5c542', 1.9);
  AUDIO3D.gol();
  pausaGol = 1.9;
}

function reponer(){
  AUDIO3D.silbato();
  pelota.position.set(0, 0.11, 0);
  pelota.userData.v.set(0, 0, 0);
  jugador.position.set(-3, 0, 1.5);
  jugador.userData.v.set(0, 0, 0);
  document.getElementById('avisoGol').style.display = 'none';
}

function bucle(){
  const dt = Math.min(reloj.getDelta(), 0.05);
  actualizar(dt);
  render.render(escena, camara);

  fpsCuadros++; fpsAcum += dt;
  if(fpsAcum > 0.5){
    fps = Math.round(fpsCuadros/fpsAcum);
    document.getElementById('fps').textContent = fps + ' fps';
    fpsCuadros = 0; fpsAcum = 0;
  }
  requestAnimationFrame(bucle);
}

function ajustar(){
  const w = window.innerWidth, h = window.innerHeight;
  render.setSize(w, h);
  camara.aspect = w/h;
  camara.updateProjectionMatrix();
}

function arrancar(){
  const cv = document.getElementById('lienzo3d');
  render = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
  render.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  render.outputEncoding = THREE.sRGBEncoding;
  render.toneMapping = THREE.ACESFilmicToneMapping;
  render.toneMappingExposure = 0.92;
  render.shadowMap.enabled = true;
  render.shadowMap.type = THREE.PCFSoftShadowMap;

  reloj = new THREE.Clock();
  crearEscena();
  iniciarArquero();
  ajustar();
  window.addEventListener('resize', ajustar);

  prepararSoltar();
  botonGolpe('btTiro', 'tiro');
  botonGolpe('btBajo', 'bajo');
  botonGolpe('btAlto', 'alto');
  botonMover('btArriba', 'arrowup');
  botonMover('btAbajo', 'arrowdown');
  botonMover('btIzq', 'arrowleft');
  botonMover('btDer', 'arrowright');
  document.getElementById('btCam').addEventListener('click', () => { camaraModo = (camaraModo + 1) % 2; });
  document.addEventListener('pointerdown', () => {
    try { window.focus(); } catch(e){}
    AUDIO3D.activar();
  });
  const bm = document.getElementById('btMute3d');
  if(bm) bm.addEventListener('click', () => {
    AUDIO3D.activar();
    const m = !AUDIO3D.estaMudo();
    AUDIO3D.setMudo(m);
    bm.textContent = m ? '🔇' : '🔊';
  });

  bucle();
}
