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

## Probar un modelo de Mixamo

Ya no hace falta tocar código: **arrastrá un `.glb` sobre la página**. Se lee
con `FileReader` y se parsea en memoria, así que funciona sin red y dentro de
las restricciones del visor de artefactos.

1. Entrar a mixamo.com con cuenta de Adobe (gratis), elegir un personaje y
   descargar **Running**, **Idle** y **Soccer Kick**.
2. Mixamo baja `.fbx`. Abrirlo en Blender y exportar **glTF 2.0 (.glb)**.
3. Arrastrar los `.glb` sobre la página, de a uno o todos juntos.
4. En el panel de abajo a la izquierda, asignar cada animación a
   **CORRER**, **PARADO** o **PATEAR**. Si el jugador corre de espaldas,
   el botón **GIRAR 180°** lo da vuelta.

El modelo se escala solo a 1,80 m y se le apoyan los pies en el piso.
`VOLVER AL MUÑECO` devuelve el personaje hecho a mano.

El código está en `montarGLB()` y `animarModelo()`.

Ojo con las licencias: Mixamo permite uso comercial de sus personajes y
animaciones, pero las caras, nombres y camisetas de futbolistas reales
están licenciados (FIFPro) y no se pueden usar.
