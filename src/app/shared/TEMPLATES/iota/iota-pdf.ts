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

const HOJA = { ancho: 612, alto: 792 };
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
}

export async function crearPdfIota(cv: DocumentoCv, opciones: OpcionesPdfIota): Promise<jsPDF> {
  const [{ jsPDF }, archivosFuente] = await Promise.all([import('jspdf'), cargarFuentes()]);
  const pdf = new jsPDF({ unit: 'pt', format: 'letter', compress: true, putOnlyUsedFonts: true });
  archivosFuente.forEach(([archivo, estilo, base64]) => {
    pdf.addFileToVFS(archivo, base64);
    pdf.addFont(archivo, FUENTE, estilo);
  });

  pdf.setProperties({
    title: cv.nombre ? `${cv.nombre} - ${cv.tituloDocumento}` : cv.tituloDocumento,
    subject: cv.cargo,
    author: cv.nombre,
    keywords: cv.secciones.flatMap(s => s.elementos).join(', '),
    creator: 'Workface',
  });
  pdf.setLanguage(cv.idioma as Parameters<typeof pdf.setLanguage>[0]);

  const foto = opciones.conFoto ? await fotoCompatible(cv.foto) : '';
  new DibujoIota(pdf).documento(cv, foto);
  return pdf;
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

  constructor(private pdf: jsPDF) { }

  private alto = (tamano: number) => tamano * 1.4;

  private estilo(tamano: number, peso: 'normal' | 'bold', color: string) {
    this.pdf.setFont(FUENTE, peso);
    this.pdf.setFontSize(tamano);
    this.pdf.setTextColor(color);
  }

  // Pasa a una hoja nueva si lo que sigue no cabe en la actual.
  private reservar(alto: number) {
    if (this.y + alto > HOJA.alto - MARGEN.abajo) {
      this.pdf.addPage();
      this.y = MARGEN.arriba;
    }
  }

  // Escribe un texto que puede ocupar varias lineas, cortando de hoja si hace falta.
  private lineas(texto: string, x: number, ancho: number, tamano: number, antesDeCadaLinea?: (y: number, primera: boolean) => void) {
    const alto = this.alto(tamano);
    (this.pdf.splitTextToSize(texto, ancho) as string[]).forEach((linea, indice) => {
      this.reservar(alto);
      antesDeCadaLinea?.(this.y, indice === 0);
      this.pdf.text(linea, x, this.y);
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
    pdf.setFillColor(COLORES_IOTA.acento);
    pdf.rect(0, 0, HOJA.ancho, FRANJA, 'F');

    let anchoTexto = ANCHO_UTIL;
    if (conFoto) {
      const { width, height } = pdf.getImageProperties(foto);
      const escala = Math.min(FOTO / width, FOTO / height);
      const ancho = width * escala;
      const alto = height * escala;
      const x = HOJA.ancho - MARGEN.derecha - ancho;
      pdf.addImage(foto, x, MARGEN.arriba - 24 + (FOTO - alto) / 2, ancho, alto);
      anchoTexto -= FOTO + 18;
    }

    this.y = MARGEN.arriba;
    if (cv.nombre) {
      this.estilo(TAMANOS.nombre, 'bold', COLORES_IOTA.tinta);
      this.lineas(cv.nombre, MARGEN.izquierda, anchoTexto, TAMANOS.nombre);
      this.y -= 4;
    }
    if (cv.cargo) {
      this.estilo(TAMANOS.cargo, 'bold', COLORES_IOTA.acento);
      this.lineas(cv.cargo, MARGEN.izquierda, anchoTexto, TAMANOS.cargo);
    }
    if (cv.contacto.length) {
      this.y += 2;
      this.estilo(TAMANOS.contacto, 'normal', COLORES_IOTA.secundario);
      this.lineas(cv.contacto.join('  |  '), MARGEN.izquierda, anchoTexto, TAMANOS.contacto);
    }
    if (conFoto) {
      this.y = Math.max(this.y, MARGEN.arriba - 24 + FOTO + 6);
    }
  }

  private seccion(seccion: SeccionCv) {
    const pdf = this.pdf;
    this.y += 16;
    // El titulo no queda solo al final de una hoja: se reserva tambien el primer renglon del contenido.
    this.reservar(this.alto(TAMANOS.seccion) + this.alto(TAMANOS.titulo) * 2 + 6);

    this.estilo(TAMANOS.seccion, 'bold', COLORES_IOTA.acento);
    pdf.text(seccion.titulo, MARGEN.izquierda, this.y);
    // El anden: una linea del color de acento desde el titulo hasta el margen.
    const inicioLinea = MARGEN.izquierda + pdf.getTextWidth(seccion.titulo) + 8;
    pdf.setDrawColor(COLORES_IOTA.acento);
    pdf.setLineWidth(0.8);
    pdf.line(inicioLinea, this.y - TAMANOS.seccion * 0.32, HOJA.ancho - MARGEN.derecha, this.y - TAMANOS.seccion * 0.32);
    this.y += this.alto(TAMANOS.seccion) + 2;

    if (seccion.parrafo) {
      this.estilo(TAMANOS.cuerpo, 'normal', COLORES_IOTA.tinta);
      this.lineas(seccion.parrafo, MARGEN.izquierda, ANCHO_UTIL, TAMANOS.cuerpo);
    }
    seccion.entradas.forEach((entrada, indice) => {
      if (indice > 0) {
        this.y += 8;
      }
      this.entrada(entrada);
    });
    if (seccion.elementos.length) {
      this.estilo(TAMANOS.cuerpo, 'normal', COLORES_IOTA.tinta);
      // Separados por comas: es la forma en que los ATS reconocen cada habilidad.
      this.lineas(seccion.elementos.join(', '), MARGEN.izquierda, ANCHO_UTIL, TAMANOS.cuerpo);
    }
  }

  private entrada(entrada: EntradaCv) {
    const pdf = this.pdf;
    this.reservar(this.alto(TAMANOS.titulo) * 2);

    // Las fechas van a la derecha, en la misma linea del cargo, como la hora en un itinerario.
    this.estilo(TAMANOS.lugar, 'normal', COLORES_IOTA.secundario);
    const anchoFechas = entrada.fechas ? pdf.getTextWidth(entrada.fechas) + 16 : 0;
    const yTitulo = this.y;

    this.estilo(TAMANOS.titulo, 'bold', COLORES_IOTA.tinta);
    this.lineas(entrada.titulo, MARGEN.izquierda, ANCHO_UTIL - anchoFechas, TAMANOS.titulo);

    if (entrada.fechas) {
      this.estilo(TAMANOS.lugar, 'normal', COLORES_IOTA.secundario);
      pdf.text(entrada.fechas, HOJA.ancho - MARGEN.derecha, yTitulo, { align: 'right' });
    }
    if (entrada.lugar) {
      this.estilo(TAMANOS.lugar, 'normal', COLORES_IOTA.secundario);
      this.lineas(entrada.lugar, MARGEN.izquierda, ANCHO_UTIL, TAMANOS.lugar);
    }
    if (entrada.parrafo) {
      this.y += 2;
      this.estilo(TAMANOS.cuerpo, 'normal', COLORES_IOTA.tinta);
      this.lineas(entrada.parrafo, MARGEN.izquierda, ANCHO_UTIL, TAMANOS.cuerpo);
    }
    if (entrada.puntos.length) {
      this.y += 2;
    }
    entrada.puntos.forEach(punto => {
      this.estilo(TAMANOS.cuerpo, 'normal', COLORES_IOTA.tinta);
      // La viñeta se dibuja, no se escribe: el texto que lee el ATS queda limpio.
      this.lineas(punto, MARGEN.izquierda + SANGRIA_PUNTO, ANCHO_UTIL - SANGRIA_PUNTO, TAMANOS.cuerpo, (y, primera) => {
        if (primera) {
          pdf.setFillColor(COLORES_IOTA.acento);
          pdf.circle(MARGEN.izquierda + 3.5, y - TAMANOS.cuerpo * 0.33, 1.9, 'F');
        }
      });
    });
  }
}
