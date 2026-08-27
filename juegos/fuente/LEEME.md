# Potrero 3D — cómo se arma

`juegos/potrero3d.html` es un archivo **generado**: no se edita a mano.
Adentro lleva Three.js entero empotrado (~600 KB) porque el visor de
artefactos bloquea cualquier recurso externo.

Lo que se edita es esto:

- `potrero3d.demo.js` — toda la escena, el jugador y la física.
- `potrero3d.shell.html` — el envoltorio: estilos, HUD y controles táctiles.
- `armar.py` — pega las dos cosas más Three.js y escribe el HTML final.

Para regenerar:

    cd juegos/fuente
    curl -sL -o three.min.js https://cdn.jsdelivr.net/npm/three@0.137.0/build/three.min.js
    python3 armar.py

## Cambiar el muñeco por un modelo de Mixamo

El personaje de acá está armado y animado a mano en `crearFutbolista()` y
`animarFutbolista()`. Para pasar a animaciones capturadas con actores:

1. Entrar a mixamo.com con cuenta de Adobe (gratis), elegir un personaje y
   descargar las animaciones **Running**, **Idle** y **Soccer Kick**.
2. Convertir a `.glb` (Blender exporta glTF directo).
3. Sumar `GLTFLoader`: viene en el mismo paquete de npm que Three.js, en
   `examples/js/loaders/GLTFLoader.js` para esta versión sin módulos.
4. Reemplazar `crearFutbolista()` por la carga del `.glb`, y
   `animarFutbolista()` por un `THREE.AnimationMixer` que mezcle las tres
   animaciones según la velocidad.

Ojo con las licencias: Mixamo permite uso comercial de sus personajes y
animaciones, pero las caras, nombres y camisetas de futbolistas reales
están licenciados (FIFPro) y no se pueden usar.
