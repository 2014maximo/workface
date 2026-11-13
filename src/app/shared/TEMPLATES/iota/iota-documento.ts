// Convierte el perfil en el contenido de la plantilla Iota.
// La vista previa y el PDF usan este mismo resultado, asi que siempre muestran lo mismo.
// Solo incluye lo que un sistema ATS sabe leer: sin identificacion, fecha de nacimiento,
// genero ni referencias.

export interface EntradaCv {
  titulo: string;
  // Empresa o institucion, y ciudad.
  lugar: string;
  fechas: string;
  // Funciones o descripcion: varias lineas se muestran como lista.
  puntos: string[];
  parrafo: string;
}

export interface SeccionCv {
  titulo: string;
  entradas: EntradaCv[];
  // Para habilidades e idiomas: elementos cortos que se escriben seguidos.
  elementos: string[];
  parrafo: string;
}

export interface DocumentoCv {
  nombre: string;
  cargo: string;
  contacto: string[];
  foto: string;
  secciones: SeccionCv[];
  // Experiencias que no caben en esta plantilla: siguen guardadas en el perfil.
  empresasOmitidas: number;
}

// Para que la hoja de vida quepa en una pagina, Iota muestra solo las experiencias mas recientes.
export const MAXIMO_EMPRESAS_IOTA = 3;

export const TITULOS_IOTA = {
  perfil: 'Perfil profesional',
  experiencia: 'Experiencia laboral',
  educacion: 'Educación',
  cursos: 'Cursos y certificaciones',
  habilidades: 'Habilidades',
  idiomas: 'Idiomas',
};

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const texto = (valor: unknown): string => typeof valor === 'string' ? valor.replace(/\s+/g, ' ').trim() : '';

// "2021-03-15" -> "Marzo 2021". Un valor que no es una fecha completa se deja como vino.
export function mesYAnio(valor: unknown): string {
  const limpio = texto(valor);
  const partes = limpio.match(/^(\d{4})-(\d{2})/);
  if (!partes) {
    return limpio;
  }
  const mes = MESES[Number(partes[2]) - 1];
  return mes ? `${mes} ${partes[1]}` : partes[1];
}

// Los ATS reconocen mejor un guion simple que una raya entre fechas.
export function rangoFechas(inicio: unknown, fin: unknown, finVacio = ''): string {
  const desde = mesYAnio(inicio);
  const hasta = mesYAnio(fin) || finVacio;
  if (desde && hasta) {
    return `${desde} - ${hasta}`;
  }
  return desde || hasta;
}

// Una linea por punto, sin las viñetas que el usuario haya escrito a mano.
export function puntosDe(valor: unknown): string[] {
  if (typeof valor !== 'string') {
    return [];
  }
  return valor.split(/\r?\n/)
    .map(linea => linea.replace(/^\s*[-•*·–]\s*/, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

const unir = (...partes: string[]) => partes.filter(Boolean).join(', ');

// Lo mas reciente primero. Sin fecha, lo ultimo que se agrego va primero.
function recientesPrimero<T>(lista: T[], fecha: (item: T) => string): T[] {
  return lista
    .map((item, indice) => ({ item, indice, fecha: fecha(item) }))
    .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '') || b.indice - a.indice)
    .map(({ item }) => item);
}

function entrada(titulo: string, lugar: string, fechas: string, descripcion: unknown): EntradaCv {
  const puntos = puntosDe(descripcion);
  // Un solo renglon se lee mejor como texto corrido que como lista de un punto.
  return puntos.length > 1
    ? { titulo, lugar, fechas, puntos, parrafo: '' }
    : { titulo, lugar, fechas, puntos: [], parrafo: puntos[0] ?? '' };
}

const seccion = (titulo: string, cambios: Partial<SeccionCv>): SeccionCv =>
  ({ titulo, entradas: [], elementos: [], parrafo: '', ...cambios });

const tieneContenido = (s: SeccionCv) => s.entradas.length > 0 || s.elementos.length > 0 || !!s.parrafo;

export function documentoIota(perfil: any): DocumentoCv {
  const datos = perfil?.formBasic ?? {};
  const lista = (campo: string): any[] => Array.isArray(datos[campo]) ? datos[campo].filter(Boolean) : [];

  const nombre = [datos.primerNombre, datos.segundoNombre, datos.primerApellido, datos.segundoApellido]
    .map(texto).filter(Boolean).join(' ');

  const contacto = [datos.telCel, datos.telFijo, datos.email, datos.linkedin, datos.webSite]
    .map(texto).filter(Boolean);

  const experienciaCompleta = recientesPrimero(lista('expLaboral'), e => texto(e.fechaInicioEmpresa))
    .filter(e => texto(e.cargoEjercido) || texto(e.nombreEmpresa));
  const experiencia = experienciaCompleta.slice(0, MAXIMO_EMPRESAS_IOTA)
    .map(e => entrada(
      texto(e.cargoEjercido) || texto(e.nombreEmpresa),
      unir(texto(e.cargoEjercido) ? texto(e.nombreEmpresa) : '', texto(e.ciudadEmpresa)),
      rangoFechas(e.fechaInicioEmpresa, e.fechaFinalEmpresa, 'Actualidad'),
      e.funcionesRealizadas
    ));

  const educacion = recientesPrimero(lista('estudios'), e => texto(e.fechaTitulo) || texto(e.fechaInicio))
    .filter(e => texto(e.tituloObtenido) || texto(e.nombreInstitucion))
    .map(e => entrada(
      texto(e.tituloObtenido) || texto(e.nombreInstitucion),
      unir(texto(e.tituloObtenido) ? texto(e.nombreInstitucion) : '', texto(e.ciudadEstudio)),
      rangoFechas(e.fechaInicio, e.fechaTitulo),
      e.descripcionEstudio
    ));

  const cursos = recientesPrimero(lista('conocimientosAdicionales'), c => texto(c.fechaFinalizacion))
    .filter(c => texto(c.nombreConocimiento))
    .map(c => entrada(texto(c.nombreConocimiento), texto(c.duracion), mesYAnio(c.fechaFinalizacion), ''));

  const habilidades = lista('habilidades').map(h => texto(h.habilidad)).filter(Boolean);

  const idiomas = lista('idiomas')
    .filter(i => texto(i.idioma))
    .map(i => texto(i.nivel) ? `${texto(i.idioma)}: ${texto(i.nivel)}` : texto(i.idioma));

  const secciones = [
    seccion(TITULOS_IOTA.perfil, { parrafo: texto(datos.acercaDMi) }),
    seccion(TITULOS_IOTA.experiencia, { entradas: experiencia }),
    seccion(TITULOS_IOTA.educacion, { entradas: educacion }),
    seccion(TITULOS_IOTA.cursos, { entradas: cursos }),
    seccion(TITULOS_IOTA.habilidades, { elementos: habilidades }),
    seccion(TITULOS_IOTA.idiomas, { elementos: idiomas }),
  ].filter(tieneContenido);

  return {
    nombre,
    cargo: texto(datos.cargoActual),
    contacto,
    foto: typeof datos.fotoFrontalSinFondo === 'string' && datos.fotoFrontalSinFondo.startsWith('data:image/') ? datos.fotoFrontalSinFondo : '',
    secciones,
    empresasOmitidas: experienciaCompleta.length - experiencia.length,
  };
}

// Nombre de archivo sin tildes ni espacios: algunos portales de empleo rechazan los demas.
export function nombreArchivoIota(nombre: string): string {
  const limpio = nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `Hoja-de-vida${limpio ? '-' + limpio : ''}.pdf`;
}
