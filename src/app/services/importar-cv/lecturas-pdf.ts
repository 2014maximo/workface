// Convierte los fragmentos de texto de un PDF en lineas legibles.
// Se generan dos lecturas porque ninguna sirve para todos los diseños:
// - en orden del archivo, que respeta las tablas de "Etiqueta  valor";
// - por columnas, que evita mezclar el texto de las hojas a dos columnas.

export interface Fragmento {
  str: string;
  x: number;
  y: number;
  ancho: number;
  finDeLinea?: boolean;
}

const TOLERANCIA_Y = 2;
const SEPARACION_DATOS = 20;

// "A L E X" llega como un fragmento con letras separadas; las palabras vienen en fragmentos distintos.
function juntarLetras(texto: string): string {
  return /^(\S ){2,}\S$/.test(texto) ? texto.replace(/ /g, '') : texto;
}

// Algunos diseños dibujan el mismo texto dos veces, un poco corrido, para simular una sombra.
function sinSombras(fragmentos: Fragmento[]): Fragmento[] {
  const vistos: Fragmento[] = [];
  return fragmentos.filter(f => {
    const repetido = f.str.trim() !== '' && vistos.some(v => v.str === f.str && Math.abs(v.x - f.x) < 8 && Math.abs(v.y - f.y) < 4);
    vistos.push(f);
    return !repetido;
  });
}

export function lecturaEnOrden(paginas: Fragmento[][]): string {
  return paginas.map(sinSombras).map(fragmentos => {
    const lineas: string[] = [];
    let linea = '';
    let yAnterior: number | null = null;
    for (const f of fragmentos) {
      if (yAnterior !== null && Math.abs(f.y - yAnterior) > TOLERANCIA_Y) {
        lineas.push(linea);
        linea = '';
      }
      linea += juntarLetras(f.str);
      yAnterior = f.y;
      if (f.finDeLinea) {
        lineas.push(linea);
        linea = '';
        yAnterior = null;
      }
    }
    lineas.push(linea);
    return lineas.map(l => l.trim()).filter(Boolean).join('\n');
  }).join('\n\n');
}

function aLineas(fragmentos: Fragmento[]): string[] {
  const ordenados = [...fragmentos].sort((a, b) => b.y - a.y || a.x - b.x);
  const filas: { y: number, fragmentos: Fragmento[] }[] = [];
  for (const f of ordenados) {
    const fila = filas[filas.length - 1];
    if (fila && Math.abs(fila.y - f.y) <= TOLERANCIA_Y) {
      fila.fragmentos.push(f);
    } else {
      filas.push({ y: f.y, fragmentos: [f] });
    }
  }
  return filas.map(fila => {
    fila.fragmentos.sort((a, b) => a.x - b.x);
    let texto = '';
    let fin: number | null = null;
    for (const f of fila.fragmentos) {
      // Un hueco grande separa dos datos de la misma fila, como dos habilidades lado a lado.
      if (fin !== null && f.x - fin > SEPARACION_DATOS) {
        texto = texto.trimEnd() + ' · ';
      } else if (fin !== null && f.x - fin > 3 && !texto.endsWith(' ')) {
        texto += ' ';
      }
      if (f.str.trim()) {
        texto += juntarLetras(f.str);
        fin = f.x + f.ancho;
      }
    }
    return texto.replace(/\s+/g, ' ').trim();
  }).filter(Boolean);
}

// Busca un corte vertical que casi ninguna palabra cruce y lee cada lado por separado.
function dividir(fragmentos: Fragmento[], x0: number, x1: number, profundidad = 0): Fragmento[][] {
  if (profundidad > 2 || fragmentos.length < 8) {
    return [fragmentos];
  }
  const ancho = x1 - x0;
  let mejor: { x: number, puntos: number } | null = null;
  for (let x = x0 + ancho * 0.2; x <= x0 + ancho * 0.8; x += 2) {
    let cruzan = 0, izquierda = 0, derecha = 0;
    for (const f of fragmentos) {
      if (f.x < x && f.x + f.ancho > x) cruzan++;
      else if (f.x + f.ancho <= x) izquierda++;
      else derecha++;
    }
    if (cruzan <= fragmentos.length * 0.02 && izquierda >= 5 && derecha >= 5) {
      const puntos = Math.min(izquierda, derecha) - cruzan * 50;
      if (!mejor || puntos > mejor.puntos) {
        mejor = { x, puntos };
      }
    }
  }
  if (!mejor) {
    return [fragmentos];
  }
  const corte = mejor.x;
  const izquierda = fragmentos.filter(f => f.x + f.ancho / 2 < corte);
  const derecha = fragmentos.filter(f => f.x + f.ancho / 2 >= corte);
  return [...dividir(izquierda, x0, corte, profundidad + 1), ...dividir(derecha, corte, x1, profundidad + 1)];
}

export function lecturaPorColumnas(paginas: { ancho: number, fragmentos: Fragmento[] }[]): string {
  return paginas.map(({ ancho, fragmentos }) => {
    const visibles = sinSombras(fragmentos).filter(f => f.str.trim());
    return dividir(visibles, 0, ancho).map(columna => aLineas(columna).join('\n')).join('\n');
  }).join('\n\n');
}
