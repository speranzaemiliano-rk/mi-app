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
  const { c, g } = lienzo(1024, 256);
  const rnd = azar(99001);
  const gg = g.createLinearGradient(0, 0, 0, 256);
  gg.addColorStop(0, '#0c1017'); gg.addColorStop(1, '#1c232e');
  g.fillStyle = gg; g.fillRect(0, 0, 1024, 256);
  for(let f = 0; f < 20; f++){
    const t = f/20, y = 24 + t*220;
    for(let x = -6; x < 1030; x += 8 + t*3){
      if(rnd() < 0.10) continue;
      const r2 = rnd();
      g.fillStyle = r2 < 0.14
        ? (Math.floor(x/170) % 2 ? '#2c5f92' : '#8e3129')
        : ['#3b424d','#474f5c','#2f3640','#535c6a'][(f*3 + Math.floor(x/8)) % 4];
      g.globalAlpha = 0.35 + t*0.5;
      g.beginPath(); g.arc(x + rnd()*3, y, 2 + t*1.6, 0, Math.PI*2); g.fill();
      if(rnd() < 0.5){
        g.fillStyle = ['#c9a184','#8a6247','#e0bd9c','#6d4a34'][Math.floor(rnd()*4)];
        g.beginPath(); g.arc(x + rnd()*3, y - 2 - t, 1.2 + t, 0, Math.PI*2); g.fill();
      }
    }
  }
  g.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.encoding = THREE.sRGBEncoding;
  return tex;
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
  pelota.userData = { v: new THREE.Vector3(), giro: new THREE.Vector3() };
  escena.add(pelota);

  // ---- jugadores ----
  jugador = crearFutbolista('#3f8ee0', '#1c4f8a', '#101a2c', '#f2f5fa', '10', '#e8b98f', '#241a12');
  jugador.position.set(-3, 0, 2);
  escena.add(jugador);

  arquero = crearFutbolista('#f0c53c', '#b8902a', '#22201a', '#f7f2dd', '1', '#c98d5f', '#12100e');
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
  tex.repeat.set(8, 1);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 });
  const matEstr = new THREE.MeshStandardMaterial({ color: 0x141920, roughness: 0.9 });
  const largo = CANCHA_LARGO + 20;

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
    const grada = new THREE.Mesh(new THREE.BoxGeometry(17, 10, CANCHA_ANCHO + 34),
                                 caras(lado > 0 ? 1 : 0));
    grada.position.set(lado*(CANCHA_LARGO/2 + 12), 4.0, 0);
    grada.rotation.z = -lado * 0.32;
    escena.add(grada);
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
function cil(rTop, rBot, alto, mat, seg){
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, alto, seg || 12), mat);
  m.castShadow = true;
  return m;
}
function esf(r, mat){
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat);
  m.castShadow = true;
  return m;
}

function crearFutbolista(colCamisetaA, colCamisetaB, colShort, colMedias, numero, colPiel, colPelo){
  const G = new THREE.Group();
  const matPiel   = new THREE.MeshStandardMaterial({ color: colPiel, roughness: 0.75 });
  const matPelo   = new THREE.MeshStandardMaterial({ color: colPelo, roughness: 0.9 });
  const matShort  = new THREE.MeshStandardMaterial({ color: colShort, roughness: 0.85 });
  const matMedias = new THREE.MeshStandardMaterial({ color: colMedias, roughness: 0.9 });
  const matBotin  = new THREE.MeshStandardMaterial({ color: 0x14171c, roughness: 0.45 });
  const matCam    = new THREE.MeshStandardMaterial({
    map: texturaCamiseta(colCamisetaA, colCamisetaB), roughness: 0.82
  });

  // --- cadera: raíz del esqueleto ---
  const cadera = new THREE.Group();
  cadera.position.y = 0.92;
  G.add(cadera);

  // --- torso ---
  const torso = new THREE.Group();
  cadera.add(torso);
  const pecho = cil(0.20, 0.17, 0.56, matCam, 14);
  pecho.position.y = 0.28;
  torso.add(pecho);
  const cintura = cil(0.17, 0.18, 0.14, matShort, 14);
  cintura.position.y = -0.02;
  torso.add(cintura);
  const dorsal = new THREE.Mesh(
    new THREE.PlaneGeometry(0.235, 0.235),
    new THREE.MeshStandardMaterial({ map: texturaDorsal(numero), transparent: true, roughness: 0.85 })
  );
  dorsal.position.set(0, 0.34, 0.183);
  torso.add(dorsal);

  const hombros = new THREE.Mesh(new THREE.SphereGeometry(0.205, 16, 12), matCam);
  hombros.scale.set(1, 0.5, 0.8);
  hombros.position.y = 0.53;
  hombros.castShadow = true;
  torso.add(hombros);

  // --- cabeza ---
  const cuello = new THREE.Group();
  cuello.position.y = 0.60;
  torso.add(cuello);
  const cab = esf(0.125, matPiel);
  cab.scale.set(0.92, 1.08, 0.98);
  cab.position.y = 0.13;
  cuello.add(cab);
  const pelo = new THREE.Mesh(new THREE.SphereGeometry(0.132, 16, 12, 0, Math.PI*2, 0, Math.PI*0.62), matPelo);
  pelo.position.y = 0.135;
  pelo.castShadow = true;
  cuello.add(pelo);
  const nuca = esf(0.10, matPelo);
  nuca.scale.set(0.9, 0.7, 0.7);
  nuca.position.set(0, 0.11, -0.06);
  cuello.add(nuca);

  // --- brazos ---
  const brazos = [];
  [-1, 1].forEach(lado => {
    const hombro = new THREE.Group();
    hombro.position.set(lado*0.215, 0.50, 0);
    torso.add(hombro);
    const sup = cil(0.055, 0.048, 0.28, matCam, 10);
    sup.position.y = -0.14;
    hombro.add(sup);
    const codo = new THREE.Group();
    codo.position.y = -0.28;
    hombro.add(codo);
    const ante = cil(0.046, 0.040, 0.26, matPiel, 10);
    ante.position.y = -0.13;
    codo.add(ante);
    const mano = esf(0.052, matPiel);
    mano.position.y = -0.27;
    codo.add(mano);
    brazos.push({ hombro, codo, lado });
  });

  // --- piernas ---
  const piernas = [];
  [-1, 1].forEach(lado => {
    const caderaP = new THREE.Group();
    caderaP.position.set(lado*0.10, -0.02, 0);
    cadera.add(caderaP);
    const muslo = cil(0.085, 0.072, 0.42, matPiel, 12);
    muslo.position.y = -0.21;
    caderaP.add(muslo);
    const shortP = cil(0.105, 0.095, 0.22, matShort, 12);
    shortP.position.y = -0.09;
    caderaP.add(shortP);
    const rodilla = new THREE.Group();
    rodilla.position.y = -0.42;
    caderaP.add(rodilla);
    const pant = cil(0.068, 0.050, 0.40, matMedias, 12);
    pant.position.y = -0.20;
    rodilla.add(pant);
    const tobillo = new THREE.Group();
    tobillo.position.y = -0.40;
    rodilla.add(tobillo);
    const botin = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.075, 0.26), matBotin);
    botin.position.set(0, -0.035, 0.05);
    botin.castShadow = true;
    tobillo.add(botin);
    piernas.push({ caderaP, rodilla, tobillo, lado });
  });

  G.userData = {
    cadera, torso, cuello, brazos, piernas,
    paso: 0, patada: -1, alturaBase: 0.92,
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
  // el torso se inclina hacia adelante y rebota
  u.torso.rotation.x = 0.06 + amp*0.16;
  u.torso.rotation.y = -s*0.12*amp;
  u.cuello.rotation.x = -0.05 - amp*0.10;
  J.position.y = Math.abs(Math.sin(t))*0.045*amp;

  // ---- patada: pisa por encima del ciclo de carrera ----
  if(u.patada >= 0){
    u.patada += dt;
    const T = 0.52;
    const k = u.patada / T;
    if(k >= 1){ u.patada = -1; }
    else {
      // atrás -> latigazo -> acompañamiento
      let ang;
      if(k < 0.32)      ang = -1.15 * (k/0.32);
      else if(k < 0.58) ang = -1.15 + 2.55*((k-0.32)/0.26);
      else              ang = 1.40 - 1.10*((k-0.58)/0.42);
      const der = u.piernas[1];
      der.caderaP.rotation.x = ang;
      der.rodilla.rotation.x = k < 0.36 ? -1.25*(k/0.36) : -Math.max(0, 1.25 - 3.2*(k-0.36));
      der.tobillo.rotation.x = -0.35;
      u.piernas[0].caderaP.rotation.x = -ang*0.22;
      u.torso.rotation.y = 0.30*Math.sin(k*Math.PI);
      u.torso.rotation.x = 0.10 + 0.16*Math.sin(k*Math.PI);
      u.brazos[0].hombro.rotation.x = -1.0*Math.sin(k*Math.PI);
      u.brazos[1].hombro.rotation.x = 0.55*Math.sin(k*Math.PI);
      return k;
    }
  }
  return -1;
}

/* ============================================================
   ENTRADA
   ============================================================ */
const TECLAS_JUEGO = [' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if(TECLAS_JUEGO.indexOf(k) >= 0) e.preventDefault();
  if(!teclas[k]){
    if(k === ' ') patear();
    if(k === 'c') camaraModo = (camaraModo + 1) % 2;
  }
  teclas[k] = true;
});
window.addEventListener('keyup', e => { teclas[e.key.toLowerCase()] = false; });

function botonTactil(id, tecla){
  const el = document.getElementById(id);
  if(!el) return;
  const on = e => { e.preventDefault(); if(!teclas[tecla] && tecla === ' ') patear(); teclas[tecla] = true; };
  const off = e => { e.preventDefault(); teclas[tecla] = false; };
  el.addEventListener('touchstart', on); el.addEventListener('touchend', off);
  el.addEventListener('mousedown', on);  el.addEventListener('mouseup', off);
  el.addEventListener('mouseleave', off);
}

function patear(){
  const u = jugador.userData;
  if(u.patada < 0) u.patada = 0;
}

/* ============================================================
   BUCLE
   ============================================================ */
function actualizar(dt){
  const u = jugador.userData;

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
  const kPatada = animarFutbolista(jugador, dt, vel);
  animarFutbolista(arquero, dt, 0);

  // ---- contacto con la pelota ----
  const P = pelota.userData;
  const adelante = new THREE.Vector3(Math.sin(jugador.rotation.y + Math.PI), 0,
                                     Math.cos(jugador.rotation.y + Math.PI));
  const alPie = new THREE.Vector3().subVectors(pelota.position, jugador.position);
  alPie.y = 0;
  const dist = alPie.length();

  if(kPatada >= 0.42 && kPatada <= 0.60 && dist < 1.25 && !P.pegado){
    // el latigazo justo cuando el pie pasa por la pelota
    const dir = adelante.clone().normalize();
    const fuerza = 13 + Math.min(vel, 7)*0.9;
    P.v.set(dir.x*fuerza, 5.0 + Math.random()*1.2, dir.z*fuerza);
    P.giro.set(-dir.z*14, 0, dir.x*14);
    P.pegado = 0.35;
  }
  if(P.pegado > 0) P.pegado -= dt;

  // conducción: si la pelota está justo delante y va lenta, se empuja
  if(P.pegado <= 0 && dist < 0.62 && pelota.position.y < 0.30 && vel > 0.4){
    const dir = adelante.clone().normalize();
    P.v.x = dir.x*(vel + 1.6);
    P.v.z = dir.z*(vel + 1.6);
  }

  // ---- física de la pelota ----
  P.v.y -= 17.5*dt;
  pelota.position.addScaledVector(P.v, dt);
  if(pelota.position.y < 0.11){
    pelota.position.y = 0.11;
    if(P.v.y < -0.6){ P.v.y = -P.v.y*0.55; }
    else P.v.y = 0;
    P.v.x *= 0.80; P.v.z *= 0.80;
  }
  if(pelota.position.y <= 0.115){
    const f = Math.pow(0.42, dt);
    P.v.x *= f; P.v.z *= f;
  }
  // paredes: rebota en el límite del campo
  const LX = CANCHA_LARGO/2 - 1.0, LZ = CANCHA_ANCHO/2 - 1.0;
  if(Math.abs(pelota.position.x) > LX){
    pelota.position.x = Math.sign(pelota.position.x)*LX;
    P.v.x *= -0.62;
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
    destino = new THREE.Vector3(foco.x*0.72, 9.6, CANCHA_ANCHO/2 + 7.5);
  } else {
    // detrás del jugador
    const atras = adelante.clone().multiplyScalar(-4.6);
    destino = new THREE.Vector3(
      jugador.position.x + atras.x, 2.9, jugador.position.z + atras.z
    );
  }
  camara.position.lerp(destino, Math.min(1, dt*(camaraModo === 0 ? 2.2 : 4.5)));
  camara.lookAt(foco.x, camaraModo === 0 ? 1.1 : 1.2, foco.z);

  // la sombra sigue a la acción, así se mantiene nítida
  luzSol.position.set(foco.x + 18, 30, foco.z + 14);
  luzSol.target.position.set(foco.x, 0, foco.z);
  luzSol.target.updateMatrixWorld();
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
  ajustar();
  window.addEventListener('resize', ajustar);

  botonTactil('btPatear3d', ' ');
  botonTactil('btArriba', 'arrowup');
  botonTactil('btAbajo', 'arrowdown');
  botonTactil('btIzq', 'arrowleft');
  botonTactil('btDer', 'arrowright');
  document.getElementById('btCam').addEventListener('click', () => { camaraModo = (camaraModo + 1) % 2; });
  document.addEventListener('pointerdown', () => { try { window.focus(); } catch(e){} });

  bucle();
}
