#!/usr/bin/env python3
"""Genera el catalogo de habilidades y una pagina de revision de sus iconos.

Uso: python3 scripts/habilidades/generar_catalogo.py <excel> <carpeta-de-salida> [revision.html]

Salida: areas.json, indice.json con todos los nombres y un archivo por area con
sus iconos. Si se indica, tambien la pagina de revision, que no debe publicarse.
El script se detiene si falta una habilidad en iconos.json, si sobra un nombre o
si un icono no existe en Iconify.
"""
import collections
import html
import json
import pathlib
import re
import sys
import urllib.parse
import unicodedata
import urllib.request
import xml.etree.ElementTree as ET
import zipfile

API = 'https://api.iconify.design'
NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
HOJA = 'xl/worksheets/sheet1.xml'
ICONOS = pathlib.Path(__file__).parent / 'iconos.json'


def leer_catalogo(ruta):
    """Devuelve las filas (area, especialidad, habilidad) de la primera hoja."""
    with zipfile.ZipFile(ruta) as libro:
        textos = [''.join(t.text or '' for t in si.iter(NS + 't'))
                  for si in ET.fromstring(libro.read('xl/sharedStrings.xml'))] \
            if 'xl/sharedStrings.xml' in libro.namelist() else []
        hoja = ET.fromstring(libro.read(HOJA))

    filas = []
    for fila in hoja.iter(NS + 'row'):
        celdas = {}
        for celda in fila:
            columna = re.match('[A-Z]+', celda.get('r')).group()
            valor = celda.find(NS + 'v')
            en_linea = celda.find(NS + 'is')
            if celda.get('t') == 's' and valor is not None:
                celdas[columna] = textos[int(valor.text)]
            elif en_linea is not None:
                celdas[columna] = ''.join(t.text or '' for t in en_linea.iter(NS + 't'))
            elif valor is not None:
                celdas[columna] = valor.text
        if celdas.get('C'):
            filas.append((celdas['A'], celdas['B'], celdas['C']))
    return filas[1:]


def leer_asignaciones(filas):
    """Une cada fila con su icono y comprueba que nada falte ni sobre."""
    iconos = json.loads(ICONOS.read_text(encoding='utf8'))
    nombres = {fila[2] for fila in filas}
    errores = [f"falta '{n}'" for n in sorted(nombres - set(iconos))]
    errores += [f"sobra '{n}'" for n in sorted(set(iconos) - nombres)]
    habilidades = [{'nombre': fila[2], 'area': fila[0], 'especialidad': fila[1],
                    'icono': iconos.get(fila[2])} for fila in filas]
    return habilidades, errores


def archivo_area(area):
    sin_tildes = unicodedata.normalize('NFD', area.lower())
    sin_tildes = ''.join(c for c in sin_tildes if unicodedata.category(c) != 'Mn')
    return re.sub('[^a-z0-9]+', '-', sin_tildes).strip('-') + '.json'


def escribir_json(ruta, datos):
    ruta.write_text(json.dumps(datos, ensure_ascii=False, separators=(',', ':')), encoding='utf8')


def escribir_catalogo(salida, habilidades, svgs):
    """El modal carga el indice para buscar y cada area solo cuando la necesita."""
    areas = list(dict.fromkeys(h['area'] for h in habilidades))
    escribir_json(salida / 'areas.json', [{'nombre': area, 'archivo': archivo_area(area)} for area in areas])
    # Una habilidad repetida en varias areas tiene el mismo icono: basta la primera.
    primera_area = {}
    for h in habilidades:
        primera_area.setdefault(h['nombre'], areas.index(h['area']))
    escribir_json(salida / 'indice.json', [{'nombre': n, 'area': a} for n, a in primera_area.items()])
    for area in areas:
        del_area = [h for h in habilidades if h['area'] == area]
        escribir_json(salida / archivo_area(area), {
            'iconos': {h['icono']: svgs[h['icono']] for h in del_area},
            'habilidades': [{'nombre': h['nombre'], 'especialidad': h['especialidad'],
                             'icono': h['icono']} for h in del_area]
        })


def descargar_iconos(ids):
    """Devuelve {id: svg} usando la API por lotes; falla si un icono no existe."""
    por_coleccion = collections.defaultdict(list)
    for icono in ids:
        coleccion, nombre = icono.split(':', 1)
        por_coleccion[coleccion].append(nombre)

    svgs, errores = {}, []
    for coleccion, nombres in sorted(por_coleccion.items()):
        for inicio in range(0, len(nombres), 100):
            lote = nombres[inicio:inicio + 100]
            consulta = urllib.parse.urlencode({'icons': ','.join(lote)})
            pedido = urllib.request.Request(f'{API}/{coleccion}.json?{consulta}',
                                            headers={'User-Agent': 'workface-catalogo'})
            with urllib.request.urlopen(pedido, timeout=30) as respuesta:
                datos = json.load(respuesta)
            ancho, alto = datos.get('width', 24), datos.get('height', 24)
            for nombre in lote:
                icono = datos.get('icons', {}).get(nombre)
                if icono is None:
                    errores.append(f"el icono '{coleccion}:{nombre}' no existe")
                    continue
                svgs[f'{coleccion}:{nombre}'] = (
                    f'<svg xmlns="http://www.w3.org/2000/svg" '
                    f'viewBox="0 0 {icono.get("width", ancho)} {icono.get("height", alto)}">'
                    f'{icono["body"]}</svg>')
    return svgs, errores


def pagina_revision(habilidades, svgs):
    usos = collections.Counter(h['icono'] for h in habilidades)
    enlaces = ''.join(f'<a href="#{archivo_area(a)}">{html.escape(a)}</a>'
                      for a in dict.fromkeys(h['area'] for h in habilidades))
    partes = [f'<nav>{enlaces}</nav>']
    numero = 0
    for area in dict.fromkeys(h['area'] for h in habilidades):
        partes.append(f'<h1 id="{archivo_area(area)}">{html.escape(area)}</h1>')
        del_area = [h for h in habilidades if h['area'] == area]
        for especialidad in dict.fromkeys(h['especialidad'] for h in del_area):
            partes.append(f'<h2>{html.escape(especialidad)}</h2><ul>')
            for h in (x for x in del_area if x['especialidad'] == especialidad):
                numero += 1
                marca = h['icono'].startswith('simple-icons:')
                etiquetas = ('<em>logo</em>' if marca else '') + \
                    (f'<em>{usos[h["icono"]]} usos</em>' if usos[h['icono']] > 1 else '')
                partes.append(
                    f'<li><span class="n">{numero}</span>{svgs[h["icono"]]}'
                    f'<strong>{html.escape(h["nombre"])}</strong>'
                    f'<code>{html.escape(h["icono"])}</code><span class="t">{etiquetas}</span></li>')
            partes.append('</ul>')
    return f'''<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Revisión de iconos de habilidades</title><style>
body{{margin:0;padding:24px;background:#262626;color:#fff;font:16px/1.3 system-ui,sans-serif}}
h1{{margin:48px 0 4px;font-size:24px}}
nav{{display:flex;flex-wrap:wrap;gap:8px 16px}}
a{{color:#4cbbe8}}
h2{{margin:32px 0 12px;font-size:18px;color:#b8b8b8;font-weight:600}}
ul{{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin:0;padding:0;list-style:none}}
li{{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;padding:20px 8px 12px;background:#1a1a1a;text-align:center}}
svg{{width:40px;height:40px;color:#fff}}
strong{{font-weight:600;overflow-wrap:anywhere}}
code{{font-size:12px;color:#b8b8b8;overflow-wrap:anywhere}}
.n{{position:absolute;top:6px;left:8px;font-size:12px;color:#b8b8b8}}
.t{{display:flex;gap:4px;min-height:18px}}
em{{padding:0 6px;font-size:12px;font-style:normal;color:#1a1a1a;background:#FFEF27}}
</style></head><body>{''.join(partes)}</body></html>
'''


def main():
    if len(sys.argv) not in (3, 4):
        sys.exit(__doc__)
    excel, salida = sys.argv[1], pathlib.Path(sys.argv[2])

    habilidades, errores = leer_asignaciones(leer_catalogo(excel))
    ids = sorted({h['icono'] for h in habilidades if h['icono']})
    svgs, errores_iconos = descargar_iconos(ids)
    errores += errores_iconos
    if errores:
        sys.exit('No se genero el catalogo:\n- ' + '\n- '.join(errores))

    salida.mkdir(parents=True, exist_ok=True)
    escribir_catalogo(salida, habilidades, svgs)
    if len(sys.argv) == 4:
        pathlib.Path(sys.argv[3]).write_text(pagina_revision(habilidades, svgs), encoding='utf8')
    peso = sum(archivo.stat().st_size for archivo in salida.glob('*.json'))
    print(f'{len(habilidades)} filas, {len(ids)} iconos distintos, {peso} bytes en JSON')


if __name__ == '__main__':
    main()
