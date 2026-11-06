import { normalizar } from './interpretar-cv';

export interface CruceHabilidades {
  // Nombres tal como estan en el catalogo, en el orden de la hoja de vida.
  enCatalogo: string[];
  // Textos de la seccion de habilidades que no estan en el catalogo.
  otras: string[];
  // Habilidades del catalogo que aparecen en otras partes del texto.
  mencionadas: string[];
}

// Formas habituales de escribir una habilidad que el catalogo nombra distinto.
const ALIAS: Record<string, string> = {
  'html': 'html5',
  'css': 'css3',
  'vs code': 'visual studio code',
  'vscode': 'visual studio code',
  'vue': 'vue.js',
  'vuejs': 'vue.js',
  'vuej': 'vue.js',
  'nodejs': 'node.js',
  'node': 'node.js',
  'react.js': 'react',
  'reactjs': 'react',
  'angularjs': 'angular',
  'eclipce': 'eclipse',
  'js': 'javascript',
  'ts': 'typescript',
  'excel': 'microsoft excel',
  'word': 'microsoft word',
  'power point': 'microsoft powerpoint',
  'powerpoint': 'microsoft powerpoint',
};

const NIVELES = /\b(basico|intermedio|avanzado|experto)\b/g;
const ES_NIVEL = /^(basico|intermedio|avanzado|experto)$/;
const PREFIJOS = /^(manejo de|manejo del|uso de|conocimientos? en|automatizacion( con| en)?|programacion en)\s+/;
const CONECTOR_FINAL = /\b(de|del|en|el|la|y|a|con|por|para|al)$/;
const MAXIMO_MENCIONADAS = 12;

function clavesPosibles(texto: string): string[] {
  const base = normalizar(texto).replace(/[.]$/, '');
  const sinNivel = base.replace(NIVELES, '').replace(/\s+/g, ' ').trim();
  const sinPrefijo = sinNivel.replace(PREFIJOS, '');
  const claves = [base, sinNivel, sinPrefijo];
  return [...new Set(claves.flatMap(clave => [clave, ALIAS[clave]].filter(Boolean) as string[]))];
}

const escapar = (texto: string) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function cruzarHabilidades(piezas: string[], texto: string, catalogo: string[]): CruceHabilidades {
  const textoNormalizado = normalizar(texto);
  const porClave = new Map(catalogo.map(nombre => [normalizar(nombre), nombre]));
  const enCatalogo: string[] = [];
  const otras: string[] = [];
  for (const pieza of piezas) {
    const nombre = clavesPosibles(pieza).map(clave => porClave.get(clave)).find(Boolean);
    if (nombre) {
      if (!enCatalogo.includes(nombre)) {
        enCatalogo.push(nombre);
      }
    } else if (pieza.split(' ').length <= 4 && /^\p{L}/u.test(pieza) && !/\d|@|\//.test(pieza)
      && !CONECTOR_FINAL.test(normalizar(pieza)) && !ES_NIVEL.test(normalizar(pieza))) {
      otras.push(pieza.charAt(0).toUpperCase() + pieza.slice(1));
    }
  }

  // Solo nombres poco ambiguos: de 3 letras o mas y completos, no dentro de otra palabra.
  const mencionadas: string[] = [];
  for (const [clave, nombre] of porClave) {
    if (mencionadas.length >= MAXIMO_MENCIONADAS) {
      break;
    }
    if (clave.length < 3 || enCatalogo.includes(nombre)) {
      continue;
    }
    // Las siglas cortas, como "SAN", deben aparecer en mayusculas para no confundirse con "San Javier".
    const sigla = nombre.length <= 4 && nombre === nombre.toUpperCase();
    const patron = new RegExp(`(^|[^\\p{L}\\p{N}+#.])${escapar(sigla ? nombre : clave)}(?=$|[^\\p{L}\\p{N}+#])`, 'u');
    if (patron.test(sigla ? texto : textoNormalizado)) {
      mencionadas.push(nombre);
    }
  }
  return { enCatalogo, otras: [...new Set(otras)], mencionadas };
}
