import io, os
base = os.path.dirname(os.path.abspath(__file__))
shell = io.open(os.path.join(base,'shell.html'), encoding='utf-8').read()
three = io.open(os.path.join(base,'three.min.js'), encoding='utf-8').read()
demo  = io.open(os.path.join(base,'demo3d.js'), encoding='utf-8').read()
# Se inyecta acá y no en el editor: el bulto de three.js no tiene por qué
# pasar por el archivo fuente que uno lee y edita a mano.
salida = shell.replace('/*__THREE__*/', three).replace('/*__DEMO__*/', demo)
destino = os.path.join(base, '..', 'potrero3d.html')
io.open(destino,'w',encoding='utf-8').write(salida)
print('armado:', round(len(salida)/1024), 'KB ->', os.path.normpath(destino))
