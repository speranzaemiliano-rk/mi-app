# -*- coding: utf-8 -*-
"""Arma juegos/potrero3d.html pegando el envoltorio, Three.js y la demo.

Three.js y el GLTFLoader NO están en el repo (son ~700 KB de código ajeno):
se bajan con los curl que están en LEEME.md antes de correr esto.
"""
import io, os, sys

base = os.path.dirname(os.path.abspath(__file__))

def leer(nombre):
    ruta = os.path.join(base, nombre)
    if not os.path.exists(ruta):
        sys.exit('Falta ' + nombre + '. Ver los curl en LEEME.md.')
    return io.open(ruta, encoding='utf-8').read()

shell    = leer('potrero3d.shell.html')
three    = leer('three.min.js')
cargador = leer('GLTFLoader.js')
demo     = leer('potrero3d.demo.js')

# Se inyecta acá y no en el editor: el bulto de three.js no tiene por qué
# pasar por el archivo fuente que uno lee y edita a mano.
salida = (shell.replace('/*__THREE__*/', three)
               .replace('/*__GLTF__*/', cargador)
               .replace('/*__DEMO__*/', demo))

destino = os.path.join(base, '..', 'potrero3d.html')
io.open(destino, 'w', encoding='utf-8').write(salida)
print('armado: %d KB -> %s' % (round(len(salida)/1024), os.path.normpath(destino)))
