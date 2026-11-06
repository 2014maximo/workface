import { Fragmento, lecturaEnOrden, lecturaPorColumnas } from './lecturas-pdf';

export type MotivoError = 'formato' | 'tamano' | 'protegido' | 'sinTexto' | 'lectura';

export class ErrorImportacion extends Error {
  constructor(public motivo: MotivoError) {
    super(motivo);
  }
}

export const TAMANO_MAXIMO = 10 * 1024 * 1024;
const MINIMO_CARACTERES = 40;
const TIPO_DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

// Devuelve una o varias lecturas del texto del archivo. Todo ocurre en el navegador.
export async function leerArchivo(archivo: File): Promise<string[]> {
  const nombre = archivo.name.toLowerCase();
  const esPdf = nombre.endsWith('.pdf') || archivo.type === 'application/pdf';
  const esDocx = nombre.endsWith('.docx') || archivo.type === TIPO_DOCX;
  if (!esPdf && !esDocx) {
    throw new ErrorImportacion('formato');
  }
  if (archivo.size > TAMANO_MAXIMO) {
    throw new ErrorImportacion('tamano');
  }

  let textos: string[];
  try {
    textos = esPdf ? await leerPdf(await archivo.arrayBuffer()) : [await leerDocx(await archivo.arrayBuffer())];
  } catch (error: any) {
    if (error instanceof ErrorImportacion) {
      throw error;
    }
    console.error(error);
    throw new ErrorImportacion(error?.name === 'PasswordException' ? 'protegido' : 'lectura');
  }
  // Un PDF escaneado no trae texto: solo imagenes.
  if (!textos.some(texto => texto.replace(/\s/g, '').length >= MINIMO_CARACTERES)) {
    throw new ErrorImportacion('sinTexto');
  }
  return textos;
}

async function leerPdf(datos: ArrayBuffer): Promise<string[]> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('assets/pdfjs/pdf.worker.min.mjs', document.baseURI).href;
  const carga = pdfjs.getDocument({ data: new Uint8Array(datos), verbosity: 0 });
  try {
    const documento = await carga.promise;
    const paginas: { ancho: number, fragmentos: Fragmento[] }[] = [];
    for (let numero = 1; numero <= documento.numPages; numero++) {
      const pagina = await documento.getPage(numero);
      const contenido = await pagina.getTextContent();
      const fragmentos = contenido.items
        .filter((item): item is Extract<typeof item, { str: string }> => 'str' in item)
        .map(item => ({ str: item.str, x: item.transform[4], y: item.transform[5], ancho: item.width, finDeLinea: item.hasEOL }));
      paginas.push({ ancho: pagina.getViewport({ scale: 1 }).width, fragmentos });
    }
    return [lecturaEnOrden(paginas.map(p => p.fragmentos)), lecturaPorColumnas(paginas)];
  } finally {
    carga.destroy();
  }
}

async function leerDocx(datos: ArrayBuffer): Promise<string> {
  // Version ya empaquetada para navegador: no necesita los modulos de Node.
  const modulo = await import('mammoth/mammoth.browser.min.js');
  const mammoth = (modulo as any).default ?? modulo;
  const { value } = await mammoth.extractRawText({ arrayBuffer: datos });
  return value;
}
