import type { jsPDF } from 'jspdf';
import { DocumentoCv, EntradaCv, SeccionCv } from './iota-documento';

// El PDF de Iota se dibuja con texto real, no con una foto de la plantilla: asi un ATS lo puede leer,
// y el texto se puede seleccionar y buscar. Las medidas van en puntos sobre una hoja carta.
// Los colores y tamaños coinciden con iota.component.css.

export const COLORES_IOTA = {
  tinta: '#16181D',
  secundario: '#4B5560',
  acento: '#0B5D57',
};

export const HOJA_IOTA = { ancho: 612, alto: 792 };
const HOJA = HOJA_IOTA;
const MARGEN = { izquierda: 54, derecha: 54, arriba: 58, abajo: 54 };
const ANCHO_UTIL = HOJA.ancho - MARGEN.izquierda - MARGEN.derecha;
const FRANJA = 5;
const FOTO = 72;
const FUENTE = 'Atkinson';
const SANGRIA_PUNTO = 13;

const TAMANOS = {
  nombre: 24,
  cargo: 12,
  contacto: 9.5,
  seccion: 11,
  titulo: 10.5,
  lugar: 9.5,
  cuerpo: 10,
};

const ARCHIVOS_FUENTE: [string, string][] = [
  ['AtkinsonHyperlegible-Regular.ttf', 'normal'],
  ['AtkinsonHyperlegible-Bold.ttf', 'bold'],
];

// Se descargan una sola vez por sesion.
let fuentes: Promise<[string, string, string][]> | undefined;

function aBase64(datos: ArrayBuffer): string {
  const bytes = new Uint8Array(datos);
  let binario = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binario);
}

function cargarFuentes(): Promise<[string, string, string][]> {
  fuentes ??= Promise.all(ARCHIVOS_FUENTE.map(async ([archivo, estilo]) => {
    const respuesta = await fetch(new URL(`assets/fonts/atkinson/${archivo}`, document.baseURI).href);
    if (!respuesta.ok) {
      throw new Error(`No se pudo cargar la fuente ${archivo}`);
    }
    return [archivo, estilo, aBase64(await respuesta.arrayBuffer())] as [string, string, string];
  })).catch(error => {
    // Permite reintentar si fallo la red.
    fuentes = undefined;
    throw error;
  });
  return fuentes;
}

export interface OpcionesPdfIota {
  conFoto: boolean;
  // Reduce la letra y los espacios para que quepa mas en cada hoja. 1 es el tamaño normal.
  escala?: number;
}

// Pasos de "Ajustar a una página". El ultimo deja el cuerpo en 8,5 pt: menos ya cuesta leerlo.
export const ESCALAS_IOTA = [1, 0.97, 0.94, 0.91, 0.88, 0.85];

// Cada cosa que se dibuja en una hoja, en puntos y con la y en la linea base del texto.
// La vista previa paginada los pinta en SVG: asi corta las hojas igual que el PDF.
export type TrazoIota =
  | { tipo: 'texto'; x: number; y: number; texto: string; tamano: number; negrita: boolean; color: string; alDerecha: boolean }
  | { tipo: 'rectangulo'; x: number; y: number; ancho: number; alto: number; color: string }
  | { tipo: 'linea'; x1: number; y1: number; x2: number; y2: number; grosor: number; color: string }
  | { tipo: 'circulo'; x: number; y: number; radio: number; color: string }
  | { tipo: 'imagen'; x: number; y: number; ancho: number; alto: number; src: string };

export interface ComposicionIota {
  escala: number;
  // Una lista de trazos por hoja.
  paginas: TrazoIota[][];
}

export interface MedidaIota {
  // Con la letra normal.
  normal: ComposicionIota;
  // Con la escala mas grande con la que cabe en una hoja; si no cabe ni con la menor, con la menor.
  // Si ya cabe en una hoja, es la misma que la normal.
  ajustada: ComposicionIota;
}

type Jspdf = typeof import('jspdf').jsPDF;

// Lo que no cambia entre un intento y otro: la libreria, las fuentes y la foto.
async function preparar(cv: DocumentoCv, conFoto: boolean) {
  const [{ jsPDF }, archivosFuente] = await Promise.all([import('jspdf'), cargarFuentes()]);
  const foto = conFoto ? await fotoCompatible(cv.foto) : '';
  return { jsPDF, archivosFuente, foto };
}

function dibujar(cv: DocumentoCv, escala: number, { jsPDF, archivosFuente, foto }: { jsPDF: Jspdf; archivosFuente: [string, string, string][]; foto: string }) {
  const pdf = new jsPDF({ unit: 'pt', format: 'letter', compress: true, putOnlyUsedFonts: true });
  archivosFuente.forEach(([archivo, estilo, base64]) => {
    pdf.addFileToVFS(archivo, base64);
    pdf.addFont(archivo, FUENTE, estilo);
  });
  const dibujo = new DibujoIota(pdf, escala);
  dibujo.documento(cv, foto);
  return { pdf, composicion: { escala, paginas: dibujo.paginas } as ComposicionIota };
}

export async function crearPdfIota(cv: DocumentoCv, opciones: OpcionesPdfIota): Promise<jsPDF> {
  const { pdf } = dibujar(cv, opciones.escala ?? 1, await preparar(cv, opciones.conFoto));
  pdf.setProperties({
    title: cv.nombre ? `${cv.nombre} - ${cv.tituloDocumento}` : cv.tituloDocumento,
    subject: cv.cargo,
    author: cv.nombre,
    keywords: cv.secciones.flatMap(s => s.elementos).join(', '),
    creator: 'Workface',
  });
  pdf.setLanguage(cv.idioma as Parameters<typeof pdf.setLanguage>[0]);
  return pdf;
}

// Compone las hojas con el mismo dibujo del PDF, sin generar el archivo: sirve para contarlas
// y para la vista previa paginada.
export async function medirIota(cv: DocumentoCv, conFoto: boolean): Promise<MedidaIota> {
  const recursos = await preparar(cv, conFoto);
  const componer = (escala: number) => dibujar(cv, escala, recursos).composicion;
  const normal = componer(1);
  let ajustada = normal;
  for (const escala of ESCALAS_IOTA.slice(1)) {
    if (ajustada.paginas.length === 1) {
      break;
    }
    ajustada = componer(escala);
  }
  return { normal, ajustada };
}

// jsPDF solo acepta JPEG y PNG. Otro formato se convierte a PNG; si no se puede, el PDF sale sin foto.
async function fotoCompatible(foto: string): Promise<string> {
  if (!foto || /^data:image\/(jpe?g|png);/.test(foto)) {
    return foto;
  }
  try {
    const imagen = new Image();
    imagen.src = foto;
    await imagen.decode();
    const lienzo = document.createElement('canvas');
    lienzo.width = imagen.naturalWidth;
    lienzo.height = imagen.naturalHeight;
    lienzo.getContext('2d')!.drawImage(imagen, 0, 0);
    return lienzo.toDataURL('image/png');
  } catch (error) {
    console.error(error);
    return '';
  }
}

class DibujoIota {
  private y = MARGEN.arriba;
  // Lo dibujado en cada hoja, para la vista previa.
  readonly paginas: TrazoIota[][] = [[]];
  private actual = { tamano: TAMANOS.cuerpo, negrita: false, color: COLORES_IOTA.tinta };
  // Tamaños de letra con la escala aplicada.
  private readonly t: typeof TAMANOS;

  // Los margenes de la hoja no cambian; la letra y los espacios entre bloques, si.
  constructor(private pdf: jsPDF, private escala = 1) {
    this.t = Object.fromEntries(Object.entries(TAMANOS).map(([clave, tamano]) => [clave, tamano * escala])) as typeof TAMANOS;
  }

  private alto = (tamano: number) => tamano * 1.4;
  private e = (medida: number) => medida * this.escala;

  private estilo(tamano: number, peso: 'normal' | 'bold', color: string) {
    this.pdf.setFont(FUENTE, peso);
    this.pdf.setFontSize(tamano);
    this.pdf.setTextColor(color);
    this.actual = { tamano, negrita: peso === 'bold', color };
  }

  // Pasa a una hoja nueva si lo que sigue no cabe en la actual.
  private reservar(alto: number) {
    if (this.y + alto > HOJA.alto - MARGEN.abajo) {
      this.pdf.addPage();
      this.paginas.push([]);
      this.y = MARGEN.arriba;
    }
  }

  // Cada trazo se dibuja en el PDF y se anota para la vista previa.
  private anotar(trazo: TrazoIota) {
    this.paginas[this.paginas.length - 1].push(trazo);
  }

  private texto(texto: string, x: number, y: number, alDerecha = false) {
    this.pdf.text(texto, x, y, alDerecha ? { align: 'right' } : undefined);
    this.anotar({ tipo: 'texto', x, y, texto, ...this.actual, alDerecha });
  }

  private rectangulo(x: number, y: number, ancho: number, alto: number, color: string) {
    this.pdf.setFillColor(color);
    this.pdf.rect(x, y, ancho, alto, 'F');
    this.anotar({ tipo: 'rectangulo', x, y, ancho, alto, color });
  }

  private linea(x1: number, y1: number, x2: number, y2: number, grosor: number, color: string) {
    this.pdf.setDrawColor(color);
    this.pdf.setLineWidth(grosor);
    this.pdf.line(x1, y1, x2, y2);
    this.anotar({ tipo: 'linea', x1, y1, x2, y2, grosor, color });
  }

  private circulo(x: number, y: number, radio: number, color: string) {
    this.pdf.setFillColor(color);
    this.pdf.circle(x, y, radio, 'F');
    this.anotar({ tipo: 'circulo', x, y, radio, color });
  }

  private imagen(src: string, x: number, y: number, ancho: number, alto: number) {
    this.pdf.addImage(src, x, y, ancho, alto);
    this.anotar({ tipo: 'imagen', x, y, ancho, alto, src });
  }

  // Escribe un texto que puede ocupar varias lineas, cortando de hoja si hace falta.
  private lineas(texto: string, x: number, ancho: number, tamano: number, antesDeCadaLinea?: (y: number, primera: boolean) => void) {
    const alto = this.alto(tamano);
    (this.pdf.splitTextToSize(texto, ancho) as string[]).forEach((linea, indice) => {
      this.reservar(alto);
      antesDeCadaLinea?.(this.y, indice === 0);
      this.texto(linea, x, this.y);
      this.y += alto;
    });
  }

  documento(cv: DocumentoCv, foto: string) {
    this.encabezado(cv, foto);
    cv.secciones.forEach(seccion => this.seccion(seccion));
  }

  private encabezado(cv: DocumentoCv, foto: string) {
    const conFoto = !!foto;
    const pdf = this.pdf;
    // La franja de color es la linea de la ruta: solo en la primera hoja.
    this.rectangulo(0, 0, HOJA.ancho, FRANJA, COLORES_IOTA.acento);

    let anchoTexto = ANCHO_UTIL;
    if (conFoto) {
      const { width, height } = pdf.getImageProperties(foto);
      const lado = this.e(FOTO);
      const escala = Math.min(lado / width, lado / height);
      const ancho = width * escala;
      const alto = height * escala;
      const x = HOJA.ancho - MARGEN.derecha - ancho;
      this.imagen(foto, x, MARGEN.arriba - this.e(24) + (lado - alto) / 2, ancho, alto);
      anchoTexto -= lado + this.e(18);
    }

    this.y = MARGEN.arriba;
    if (cv.nombre) {
      this.estilo(this.t.nombre, 'bold', COLORES_IOTA.tinta);
      this.lineas(cv.nombre, MARGEN.izquierda, anchoTexto, this.t.nombre);
      this.y -= this.e(4);
    }
    if (cv.cargo) {
      this.estilo(this.t.cargo, 'bold', COLORES_IOTA.acento);
      this.lineas(cv.cargo, MARGEN.izquierda, anchoTexto, this.t.cargo);
    }
    if (cv.contacto.length) {
      this.y += this.e(2);
      this.estilo(this.t.contacto, 'normal', COLORES_IOTA.secundario);
      this.lineas(cv.contacto.join('  |  '), MARGEN.izquierda, anchoTexto, this.t.contacto);
    }
    if (conFoto) {
      this.y = Math.max(this.y, MARGEN.arriba + this.e(FOTO - 24 + 6));
    }
  }

  private seccion(seccion: SeccionCv) {
    const pdf = this.pdf;
    this.y += this.e(16);
    // El titulo no queda solo al final de una hoja: se reserva tambien el primer renglon del contenido.
    this.reservar(this.alto(this.t.seccion) + this.alto(this.t.titulo) * 2 + this.e(6));

    this.estilo(this.t.seccion, 'bold', COLORES_IOTA.acento);
    this.texto(seccion.titulo, MARGEN.izquierda, this.y);
    // El anden: una linea del color de acento desde el titulo hasta el margen.
    const inicioLinea = MARGEN.izquierda + pdf.getTextWidth(seccion.titulo) + this.e(8);
    const yLinea = this.y - this.t.seccion * 0.32;
    this.linea(inicioLinea, yLinea, HOJA.ancho - MARGEN.derecha, yLinea, this.e(0.8), COLORES_IOTA.acento);
    this.y += this.alto(this.t.seccion) + this.e(2);

    if (seccion.parrafo) {
      this.estilo(this.t.cuerpo, 'normal', COLORES_IOTA.tinta);
      this.lineas(seccion.parrafo, MARGEN.izquierda, ANCHO_UTIL, this.t.cuerpo);
    }
    seccion.entradas.forEach((entrada, indice) => {
      if (indice > 0) {
        this.y += this.e(8);
      }
      this.entrada(entrada);
    });
    if (seccion.elementos.length) {
      this.estilo(this.t.cuerpo, 'normal', COLORES_IOTA.tinta);
      // Separados por comas: es la forma en que los ATS reconocen cada habilidad.
      this.lineas(seccion.elementos.join(', '), MARGEN.izquierda, ANCHO_UTIL, this.t.cuerpo);
    }
  }

  private entrada(entrada: EntradaCv) {
    const pdf = this.pdf;
    this.reservar(this.alto(this.t.titulo) * 2);

    // Las fechas van a la derecha, en la misma linea del cargo, como la hora en un itinerario.
    this.estilo(this.t.lugar, 'normal', COLORES_IOTA.secundario);
    const anchoFechas = entrada.fechas ? pdf.getTextWidth(entrada.fechas) + this.e(16) : 0;
    const yTitulo = this.y;

    this.estilo(this.t.titulo, 'bold', COLORES_IOTA.tinta);
    this.lineas(entrada.titulo, MARGEN.izquierda, ANCHO_UTIL - anchoFechas, this.t.titulo);

    if (entrada.fechas) {
      this.estilo(this.t.lugar, 'normal', COLORES_IOTA.secundario);
      this.texto(entrada.fechas, HOJA.ancho - MARGEN.derecha, yTitulo, true);
    }
    if (entrada.lugar) {
      this.estilo(this.t.lugar, 'normal', COLORES_IOTA.secundario);
      this.lineas(entrada.lugar, MARGEN.izquierda, ANCHO_UTIL, this.t.lugar);
    }
    if (entrada.parrafo) {
      this.y += this.e(2);
      this.estilo(this.t.cuerpo, 'normal', COLORES_IOTA.tinta);
      this.lineas(entrada.parrafo, MARGEN.izquierda, ANCHO_UTIL, this.t.cuerpo);
    }
    if (entrada.puntos.length) {
      this.y += this.e(2);
    }
    entrada.puntos.forEach(punto => {
      this.estilo(this.t.cuerpo, 'normal', COLORES_IOTA.tinta);
      // La viñeta se dibuja, no se escribe: el texto que lee el ATS queda limpio.
      this.lineas(punto, MARGEN.izquierda + this.e(SANGRIA_PUNTO), ANCHO_UTIL - this.e(SANGRIA_PUNTO), this.t.cuerpo, (y, primera) => {
        if (primera) {
          this.circulo(MARGEN.izquierda + this.e(3.5), y - this.t.cuerpo * 0.33, this.e(1.9), COLORES_IOTA.acento);
        }
      });
    });
  }
}
