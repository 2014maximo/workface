// Reglas para reconocer los datos de una hoja de vida a partir de su texto.
// No depende de Angular: recibe lineas de texto y devuelve lo que pudo reconocer.

export interface ReferenciaDetectada {
  nombreCompleto: string;
  ocupacion: string;
  telefono: string;
  empresa: string;
  familiar: boolean;
}

export interface DatosCv {
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  identificacion: string;
  fechaNacimiento: string;
  ciudadNacimiento: string;
  direccionResidencia: string;
  barrioResidencia: string;
  telFijo: string;
  telCel: string;
  email: string;
  cargoActual: string;
  acercaDMi: string;
  webSite: string;
  linkedin: string;
}

export interface ResultadoCv {
  datos: DatosCv;
  // Textos de la seccion de habilidades, todavia sin cruzar con el catalogo.
  habilidades: string[];
  referencias: ReferenciaDetectada[];
  // Estudios y experiencia solo se proponen como texto para copiar.
  bloquesEstudios: string[];
  bloquesExperiencia: string[];
  // Texto completo, para buscar habilidades mencionadas en otras partes.
  texto: string;
}

type Seccion = 'inicio' | 'experiencia' | 'estudios' | 'habilidades' | 'perfil' | 'referencias' | 'idiomas' | 'intereses' | 'contacto';

interface Linea {
  texto: string;
  seccion: Seccion;
  titulo: string;
}

export const CAMPOS_SIMPLES: (keyof DatosCv)[] = [
  'primerNombre', 'segundoNombre', 'primerApellido', 'segundoApellido', 'identificacion', 'fechaNacimiento',
  'ciudadNacimiento', 'direccionResidencia', 'barrioResidencia', 'telFijo', 'telCel', 'email', 'cargoActual',
  'acercaDMi', 'webSite', 'linkedin'
];

export const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

const TITULOS: Record<Exclude<Seccion, 'inicio'>, string[]> = {
  experiencia: ['experiencia', 'experiencia laboral', 'experiencia profesional', 'historial laboral', 'trayectoria laboral', 'trayectoria profesional'],
  estudios: ['educacion', 'formacion', 'formacion academica', 'formacion tecnica', 'estudios', 'estudios y titulos', 'estudios realizados', 'informacion academica', 'cursos', 'cursos y certificaciones', 'certificaciones', 'formacion complementaria'],
  habilidades: ['habilidades', 'mis habilidades', 'habilidades tecnicas', 'conocimientos', 'conocimientos tecnicos', 'aptitudes', 'competencias', 'skills', 'herramientas', 'software de diseno'],
  perfil: ['perfil', 'perfil profesional', 'perfil ocupacional', 'perfil personal', 'acerca de mi', 'sobre mi', 'resumen', 'resumen profesional', 'objetivo', 'objetivo profesional'],
  referencias: ['referencias', 'referencias personales', 'referencias familiares', 'referencias laborales'],
  idiomas: ['idiomas'],
  intereses: ['intereses', 'areas de interes', 'intereses personales'],
  contacto: ['contacto', 'datos de contacto', 'datos personales', 'informacion personal', 'informacion de contacto'],
};

// Clave sin espacios, para reconocer titulos escritos con letras separadas.
const TITULO_POR_CLAVE = new Map<string, Seccion>();
Object.entries(TITULOS).forEach(([seccion, titulos]) =>
  titulos.forEach(titulo => TITULO_POR_CLAVE.set(titulo.replace(/ /g, ''), seccion as Seccion)));

function seccionDeTitulo(linea: string): Seccion | null {
  const clave = normalizar(linea).replace(/[:.]/g, '').replace(/ /g, '');
  if (clave.startsWith('referencias')) {
    return 'referencias';
  }
  return TITULO_POR_CLAVE.get(clave) ?? null;
}

// "FORMACIÓN 2026 | TÉCNICA..." trae el titulo pegado al primer dato de la seccion.
const TITULOS_ORDENADOS = Object.values(TITULOS).flat().sort((a, b) => b.length - a.length);
function separarTitulo(linea: string): string[] {
  if (seccionDeTitulo(linea)) {
    return [linea];
  }
  const palabras = linea.split(' ');
  for (const titulo of TITULOS_ORDENADOS) {
    const largo = titulo.split(' ').length;
    if (palabras.length <= largo) {
      continue;
    }
    const inicio = palabras.slice(0, largo).join(' ');
    if (inicio === inicio.toUpperCase() && normalizar(inicio) === titulo) {
      return [inicio, palabras.slice(largo).join(' ')];
    }
  }
  return [linea];
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const ANIO = /\b(19[5-9]\d|20\d\d)\b/;
const EMAIL = /[\w.+-]+@[\w-]+(\.[\w-]+)+/;
const URL_WEB = /\b(https?:\/\/[^\s]+|www\.[^\s]+|[\w-]+\.github\.io[^\s]*)/i;
const LINKEDIN = /(https?:\/\/)?([a-z]{2,3}\.)?linkedin\.com\/in\/[^\s]+/i;
const DIRECCION = /\b(calle|cl|cll|carrera|cra|kr|cr|avenida|av|diagonal|dg|transversal|tv|circular)\.?\s*\d+[a-z]*\b[^\n·]*/i;
// Limites de palabra que entienden la ñ y las tildes; \b corta "PEÑA" en "PE" y "A".
const CONECTORES = /(?<!\p{L})(y|en|para|con|por|el|la|las|los|al|a)(?!\p{L})/iu;
const NO_ES_NOMBRE = /(desarroll|developer|frontend|backend|software|perfil|experiencia|contacto|habilidad|formaci|educaci|tecn[oó]log|t[eé]cnic|ingenier|analista|auxiliar|asesor|bachiller|colombia|medell[ií]n|bogot|direcci|tel[eé]fono|email|idioma|nativo|b[aá]sico|instituci|colegio|universidad|centro|sena|cooperativa|distribuidora|empresa|s\.a|ltda|curriculum|hoja de vida|fotograf|referencia|datos|informaci|personal)/i;

interface Etiqueta {
  campo: string;
  patron: RegExp;
}

// El orden importa: las etiquetas largas van antes que las que empiezan igual.
const ETIQUETAS: Etiqueta[] = [
  { campo: 'nombreCompleto', patron: /nombre completo/ },
  { campo: 'nombres', patron: /nombres?/ },
  { campo: 'apellidos', patron: /apellidos?/ },
  { campo: 'fechaNacimiento', patron: /fecha de nacimiento|f\. de nacimiento/ },
  { campo: 'ciudadNacimiento', patron: /lugar de nacimiento|ciudad de nacimiento/ },
  { campo: 'identificacion', patron: /c\.\s?c\.?|cc|cedula de ciudadania|cedula|identificacion|documento de identidad|numero de documento|documento/ },
  { campo: 'direccion', patron: /direccion de residencia|direccion|domicilio/ },
  { campo: 'barrio', patron: /barrio/ },
  { campo: 'celular', patron: /telefono celular|telefono movil|celular|movil|cel\./ },
  { campo: 'telefono', patron: /telefono fijo|telefonos?|tel\./ },
  { campo: 'email', patron: /e-?mail|correo electronico|correo/ },
  { campo: 'web', patron: /web ?site|sitio web|pagina web|portafolio/ },
  // Se reconocen solo para que no se mezclen con el valor anterior.
  { campo: 'otro', patron: /estado civil|libreta militar|nacionalidad|edad|genero|sexo/ },
];

function buscarEtiqueta(normal: string, desde: number): { campo: string, inicio: number, fin: number } | null {
  for (const { campo, patron } of ETIQUETAS) {
    const re = new RegExp(`^(?:${patron.source})(?=$|[\\s:.])\\s*:?\\s*`);
    const m = normal.slice(desde).match(re);
    if (m) {
      return { campo, inicio: desde, fin: desde + m[0].length };
    }
  }
  return null;
}

// Lee "Etiqueta valor Etiqueta valor" en una linea, o la etiqueta sola con el valor en la siguiente.
function leerEtiquetas(lineas: string[]): Map<string, string> {
  const valores = new Map<string, string>();
  for (let i = 0; i < lineas.length; i++) {
    // La normalizacion conserva la longitud, asi que las posiciones sirven en el texto original.
    const original = lineas[i].replace(/\s+/g, ' ').trim();
    const normal = original.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    if (normal.length !== original.length || !buscarEtiqueta(normal, 0)) {
      continue;
    }
    const encontradas: { campo: string, inicio: number, fin: number }[] = [];
    let posicion = 0;
    while (posicion < normal.length) {
      const etiqueta = (posicion === 0 || normal[posicion - 1] === ' ') ? buscarEtiqueta(normal, posicion) : null;
      if (etiqueta) {
        encontradas.push(etiqueta);
        posicion = etiqueta.fin;
      } else {
        posicion++;
      }
    }
    encontradas.forEach((etiqueta, indice) => {
      const fin = encontradas[indice + 1]?.inicio ?? original.length;
      let valor = original.slice(etiqueta.fin, fin).replace(/^[\s·]+|[\s·]+$/g, '');
      if (!valor && indice === encontradas.length - 1 && lineas[i + 1]) {
        const siguiente = lineas[i + 1].trim();
        const normalSiguiente = siguiente.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
        valor = buscarEtiqueta(normalSiguiente, 0) || seccionDeTitulo(siguiente) ? '' : siguiente;
      }
      if (valor && !valores.has(etiqueta.campo)) {
        valores.set(etiqueta.campo, valor);
      }
    });
  }
  return valores;
}

function esEtiquetaPersonal(normal: string): boolean {
  const etiqueta = buscarEtiqueta(normal, 0);
  return !!etiqueta && ['direccion', 'telefono', 'celular', 'email', 'web', 'barrio'].includes(etiqueta.campo);
}

const soloDigitos = (texto: string) => texto.replace(/\D/g, '');

// Celular colombiano escrito como 3245575979, 310 555 1234, 300.255.53.07 o 300 2555307.
const CELULAR = /3\d{2}(?:[ .-]?\d{3}[ .-]?(?:\d{4}|\d{2}[ .-]?\d{2})|[ .-]?\d{7})(?!\d)/;
function celularEn(texto: string): string {
  return soloDigitos(texto.match(CELULAR)?.[0] ?? '');
}

function telefonoFijo(valor: string): string {
  const digitos = soloDigitos(valor.split(/[/,]| ext/i)[0]);
  return digitos.length >= 7 && digitos.length <= 10 && !digitos.startsWith('3') ? digitos : '';
}

const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Devuelve AAAA-MM-DD, el formato del campo de fecha.
export function fechaIso(texto: string): string {
  const normal = normalizar(texto);
  let dia = 0, mes = 0, anio = 0;
  const numerica = normal.match(/(\d{1,2})[/.-](\d{1,2})[/.-]((?:19|20)\d\d)/);
  if (numerica) {
    [dia, mes, anio] = [Number(numerica[1]), Number(numerica[2]), Number(numerica[3])];
  } else {
    const indiceMes = MESES_LARGOS.findIndex(nombre => normal.includes(nombre)) + 1
      || MESES.findIndex(corto => new RegExp(`\\b${corto}`).test(normal)) + 1;
    const numeros = normal.match(/\d+/g)?.map(Number) ?? [];
    anio = numeros.find(n => n > 1900) ?? 0;
    dia = numeros.find(n => n >= 1 && n <= 31) ?? 0;
    mes = indiceMes;
  }
  if (!dia || !mes || !anio || mes > 12 || dia > 31) {
    return '';
  }
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

function tipoTitulo(texto: string): string {
  return texto.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_, espacio, letra) => espacio + letra.toUpperCase());
}

function partirNombre(completo: string): Pick<DatosCv, 'primerNombre' | 'segundoNombre' | 'primerApellido' | 'segundoApellido'> {
  const partes = tipoTitulo(completo.trim()).split(/\s+/).filter(Boolean);
  const vacio = { primerNombre: '', segundoNombre: '', primerApellido: '', segundoApellido: '' };
  switch (partes.length) {
    case 0: return vacio;
    case 1: return { ...vacio, primerNombre: partes[0] };
    case 2: return { ...vacio, primerNombre: partes[0], primerApellido: partes[1] };
    case 3: return { ...vacio, primerNombre: partes[0], primerApellido: partes[1], segundoApellido: partes[2] };
    default: return { primerNombre: partes[0], segundoNombre: partes[1], primerApellido: partes[2], segundoApellido: partes.slice(3).join(' ') };
  }
}

function pareceNombre(texto: string): boolean {
  const palabras = texto.split(/\s+/);
  return /^[\p{L} ]+$/u.test(texto) && palabras.length >= 2 && palabras.length <= 5
    && !NO_ES_NOMBRE.test(texto) && !CONECTORES.test(texto) && !seccionDeTitulo(texto)
    && palabras.every(p => p.length > 1 && /^\p{Lu}/u.test(p));
}

function buscarNombre(lineas: Linea[], email: string): { nombre: string, indice: number } {
  const usuario = normalizar(email.split('@')[0] ?? '');
  const candidatos: { nombre: string, indice: number, puntos: number }[] = [];
  lineas.forEach((linea, indice) => {
    if (['experiencia', 'estudios', 'referencias'].includes(linea.seccion) || !pareceNombre(linea.texto)) {
      return;
    }
    let nombre = linea.texto;
    // Nombre partido en dos lineas: "Cristian Camilo" / "Muñoz Paniagua".
    const siguiente = lineas[indice + 1]?.texto ?? '';
    if (nombre.split(' ').length === 2 && pareceNombre(siguiente) && siguiente.split(' ').length <= 3) {
      nombre = `${nombre} ${siguiente}`;
    }
    const coincidencias = normalizar(nombre).split(' ').filter(p => p.length > 2 && usuario.includes(p)).length;
    candidatos.push({ nombre, indice, puntos: coincidencias * 3 + nombre.split(' ').length - indice / 1000 });
  });
  candidatos.sort((a, b) => b.puntos - a.puntos);
  return candidatos[0] ?? { nombre: '', indice: -1 };
}

function lineaDeCargo(lineas: Linea[], indice: number, paso: number): string {
  const texto = (i: number) => lineas[i]?.texto ?? '';
  const valida = (t: string) => t.length > 3 && t.length <= 70 && /^\p{Lu}/u.test(t) && !/\d|@|:|\/|·/.test(t)
    && !seccionDeTitulo(t) && !pareceNombre(t) && !buscarEtiqueta(normalizar(t), 0);
  let cargo = texto(indice + paso);
  if (!valida(cargo)) {
    return '';
  }
  // Cargo en dos lineas: "Tecnólogo en Análisis y Desarrollo de" / "Sistemas de Información."
  if (paso < 0 && /\b(de|del|y|en)$/i.test(texto(indice - 2)) && valida(texto(indice - 2))) {
    cargo = `${texto(indice - 2)} ${cargo}`;
  } else if (paso > 0 && /\b(de|del|y|en)$/i.test(cargo) && valida(texto(indice + 2))) {
    cargo = `${cargo} ${texto(indice + 2)}`;
  }
  return cargo.replace(/[.]$/, '');
}

function unirParrafo(lineas: string[]): string {
  return lineas.join('\n').replace(/-\n(?=\p{Ll})/gu, '').replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim();
}

function esFecha(texto: string): boolean {
  return ANIO.test(texto);
}

// Un bloque nuevo empieza en una linea con fecha, si el bloque actual ya tiene la suya.
function partirEnBloques(lineas: string[]): string[] {
  const bloques: { lineas: string[], conFecha: boolean }[] = [];
  for (const linea of lineas) {
    const actual = bloques[bloques.length - 1];
    const fecha = esFecha(linea);
    if (!actual || (fecha && actual.conFecha)) {
      bloques.push({ lineas: [linea], conFecha: fecha });
    } else {
      actual.lineas.push(linea);
      actual.conFecha ||= fecha;
    }
  }
  return bloques.map(b => b.lineas.join('\n').trim()).filter(b => b.length > 2);
}

function piezasDeHabilidad(lineas: string[]): string[] {
  const piezas: string[] = [];
  for (const linea of lineas) {
    // "Frameworks y Librerías: Angular, NgRx" -> lo de despues de los dos puntos.
    const contenido = linea.includes(':') ? linea.slice(linea.indexOf(':') + 1) : linea;
    contenido.replace(/[()]/g, ',').split(/[,;•✔·*|/]|\s-\s|\.\s|\sy\s/)
      .map(p => p.replace(/^[\s\-–✓]+|[\s.]+$/g, '').replace(/\s+\d+(\.\d+)*\+?$/, '').replace(/\s*\(?es\d+\+?\)?$/i, '').trim())
      .filter(p => p.length > 1 && p.length <= 60)
      .forEach(p => piezas.push(p));
  }
  return [...new Set(piezas)];
}

function leerReferencias(lineas: Linea[]): ReferenciaDetectada[] {
  const referencias: ReferenciaDetectada[] = [];
  const propias = lineas.filter(l => l.seccion === 'referencias');
  let actual: ReferenciaDetectada | null = null;
  const familiar = (titulo: string) => {
    const t = normalizar(titulo);
    return t.includes('familiar') && !t.includes('personal');
  };
  propias.forEach((linea, indice) => {
    const m = linea.texto.match(/^([\p{L} ]+?)\s*:\s*(.*)$/u);
    const etiqueta = m ? normalizar(m[1]) : '';
    const valor = m ? m[2].trim() : '';
    if (etiqueta.startsWith('nombre')) {
      actual = { nombreCompleto: valor, ocupacion: '', telefono: '', empresa: '', familiar: familiar(linea.titulo) };
      referencias.push(actual);
    } else if (actual && /^(ocupacion|cargo|profesion|parentesco)/.test(etiqueta)) {
      actual.ocupacion = valor;
    } else if (actual && /^(empresa|entidad|lugar de trabajo)/.test(etiqueta)) {
      actual.empresa = valor;
    } else if (actual && /^(telefonos?|tel|celular|movil)/.test(etiqueta)) {
      actual.telefono = valor;
    } else if (!m || etiqueta === '') {
      // Sin etiquetas: una linea seguida de "Teléfono ...".
      const siguiente = propias[indice + 1]?.texto ?? '';
      const telefono = siguiente.match(/^(tel[eé]fonos?|tel\.?|celular|m[oó]vil)\s*:?\s*(.+)$/i);
      if (telefono && /\p{L}{3}/u.test(linea.texto) && !/\d{5}/.test(linea.texto)) {
        // En columnas, "Nombre · Ocupación" llegan en la misma fila.
        const [nombreCompleto, ocupacion = ''] = linea.texto.split(' · ');
        actual = { nombreCompleto, ocupacion, telefono: telefono[2].replace(/^[\s·]+/, ''), empresa: '', familiar: familiar(linea.titulo) };
        referencias.push(actual);
      }
    }
  });
  return referencias.filter(r => r.nombreCompleto);
}

export function prepararLineas(texto: string): string[] {
  return texto.split('\n')
    .map(l => l.replace(/ /g, ' ').replace(/\s+/g, ' ').trim())
    // Letras separadas por espacios en un texto plano: "E X P E R I E N C I A".
    .map(l => /^(\S ){2,}\S$/.test(l) ? l.replace(/ /g, '') : l)
    .flatMap(separarTitulo)
    // Viñetas de Word (caracteres privados) y separadores sobrantes al borde de la linea.
    .map(l => l.replace(/[\uE000-\uF8FF]/g, '').replace(/^[\s·]+|[\s·]+$/g, ''))
    .filter(l => l && !/^_+$/.test(l));
}

export function interpretarCv(texto: string): ResultadoCv {
  const crudas = prepararLineas(texto);
  const lineas: Linea[] = [];
  let seccion: Seccion = 'inicio';
  let titulo = '';
  for (const texto of crudas) {
    const nueva = seccionDeTitulo(texto);
    if (nueva) {
      seccion = nueva;
      titulo = texto;
      continue;
    }
    const normal = normalizar(texto);
    // Algunas secciones no tienen titulo propio y quedan despues de otra.
    // Solo con dos puntos: "Conocimientos en: PHP" abre una lista; "frameworks Angular" sigue la frase anterior.
    if (['perfil', 'intereses', 'estudios'].includes(seccion) && /^(conocimientos|frameworks|herramientas)\b[^:]*:/.test(normal)) {
      seccion = 'habilidades';
    } else if (['habilidades', 'perfil', 'idiomas', 'intereses'].includes(seccion) && esEtiquetaPersonal(normal)) {
      seccion = 'contacto';
    } else if (['habilidades', 'idiomas', 'intereses', 'contacto'].includes(seccion) && ANIO.test(texto)) {
      seccion = 'inicio';
    }
    lineas.push({ texto, seccion, titulo });
  }
  const de = (s: Seccion) => lineas.filter(l => l.seccion === s).map(l => l.texto);
  const personales = lineas.filter(l => !['experiencia', 'estudios', 'referencias'].includes(l.seccion)).map(l => l.texto);
  const etiquetas = leerEtiquetas(personales);
  const plano = crudas.join('\n');
  const planoPersonal = personales.join('\n');

  const email = (etiquetas.get('email')?.match(EMAIL)?.[0] ?? plano.match(EMAIL)?.[0] ?? '').toLowerCase();

  let nombre = etiquetas.get('nombreCompleto') ?? '';
  let partes = partirNombre(nombre);
  const nombres = etiquetas.get('nombres'), apellidos = etiquetas.get('apellidos');
  if (!nombre && nombres && apellidos) {
    const [primerNombre = '', ...otrosNombres] = tipoTitulo(nombres).split(/\s+/);
    const [primerApellido = '', ...otrosApellidos] = tipoTitulo(apellidos).split(/\s+/);
    partes = { primerNombre, segundoNombre: otrosNombres.join(' '), primerApellido, segundoApellido: otrosApellidos.join(' ') };
    nombre = `${nombres} ${apellidos}`;
  }
  let indiceNombre = -1;
  if (!nombre) {
    const encontrado = buscarNombre(lineas, email);
    nombre = encontrado.nombre;
    indiceNombre = encontrado.indice;
    partes = partirNombre(nombre);
  }

  const celular = celularEn(etiquetas.get('celular') ?? '') || celularEn(planoPersonal) || celularEn(plano);
  const fijo = telefonoFijo(etiquetas.get('telefono') ?? '');

  const fechaEtiqueta = fechaIso(etiquetas.get('fechaNacimiento') ?? '');
  let fechaNacimiento = fechaEtiqueta;
  if (!fechaNacimiento) {
    // Una fecha completa fuera de estudios y experiencia suele ser la de nacimiento.
    const suelta = planoPersonal.match(/(\d{1,2})\/(\d{1,2})\/((?:19|20)\d\d)/);
    const edad = suelta ? new Date().getFullYear() - Number(suelta[3]) : 0;
    fechaNacimiento = suelta && edad >= 14 && edad <= 90 ? fechaIso(suelta[0]) : '';
  }

  let direccion = etiquetas.get('direccion') ?? '';
  if (!direccion) {
    const suelta = planoPersonal.match(DIRECCION)?.[0] ?? '';
    // Se corta donde empieza otro dato pegado, como el correo o un telefono.
    const palabras: string[] = [];
    for (const palabra of suelta.split(' ')) {
      if (palabra.includes('@') || soloDigitos(palabra).length >= 7) {
        break;
      }
      palabras.push(palabra);
    }
    direccion = palabras.join(' ').trim();
  }

  const identificacion = soloDigitos(etiquetas.get('identificacion')?.match(/[\d.,\s]{6,}/)?.[0] ?? '');

  const perfil = de('perfil').filter(l => !EMAIL.test(l) && !URL_WEB.test(l) && !celularEn(l) && !DIRECCION.test(l));
  const textoPerfil = unirParrafo(perfil);
  // Un perfil de una sola linea corta es el cargo, no una descripcion.
  const perfilEsCargo = perfil.length === 1 && textoPerfil.length < 80;

  let cargoActual = perfilEsCargo ? textoPerfil : '';
  if (!cargoActual && indiceNombre >= 0) {
    cargoActual = lineaDeCargo(lineas, indiceNombre, -1) || lineaDeCargo(lineas, indiceNombre + (nombre.split(' ').length > lineas[indiceNombre].texto.split(' ').length ? 1 : 0), 1);
  }

  const web = etiquetas.get('web') ?? '';
  // Las direcciones largas se parten en dos lineas: "github.io/" + "trucospadesarrollo/".
  const planoUnido = plano.replace(/\/\n(?=[a-z0-9])/g, '/');
  const webSite = (web.match(URL_WEB)?.[0] ?? planoUnido.match(URL_WEB)?.[0] ?? '').replace(/[.,;]$/, '');
  const linkedin = plano.match(LINKEDIN)?.[0] ?? '';


  return {
    datos: {
      ...partes,
      identificacion: identificacion.length >= 5 ? identificacion : '',
      fechaNacimiento,
      ciudadNacimiento: etiquetas.get('ciudadNacimiento') ?? '',
      direccionResidencia: direccion,
      barrioResidencia: etiquetas.get('barrio') ?? '',
      telFijo: fijo,
      telCel: celular,
      email,
      cargoActual,
      acercaDMi: perfilEsCargo ? '' : textoPerfil,
      webSite: linkedin && webSite.includes('linkedin') ? '' : webSite,
      linkedin,
    },
    habilidades: piezasDeHabilidad(de('habilidades')),
    referencias: leerReferencias(lineas),
    bloquesEstudios: partirEnBloques(de('estudios')),
    bloquesExperiencia: partirEnBloques(de('experiencia')),
    texto: plano,
  };
}

// Puntaje para elegir, entre varias lecturas del mismo PDF, la que mejor se entiende.
export function puntaje(resultado: ResultadoCv): number {
  const campos = CAMPOS_SIMPLES.filter(campo => resultado.datos[campo]).length;
  return campos * 2 + Math.min(resultado.habilidades.length, 10) / 2 + resultado.referencias.length
    + resultado.bloquesEstudios.length + resultado.bloquesExperiencia.length;
}

// Usa la mejor lectura y completa con las demas los datos que le falten.
export function combinarLecturas(textos: string[]): ResultadoCv {
  const resultados = textos.map(interpretarCv).sort((a, b) => puntaje(b) - puntaje(a));
  const [mejor, ...otros] = resultados;
  const datos = { ...mejor.datos };
  // El nombre se toma completo de una sola lectura para no mezclar partes.
  const camposSueltos = CAMPOS_SIMPLES.filter(c => !['primerNombre', 'segundoNombre', 'primerApellido', 'segundoApellido'].includes(c));
  for (const otro of otros) {
    camposSueltos.forEach(campo => {
      if (!datos[campo] && otro.datos[campo]) {
        datos[campo] = otro.datos[campo];
      }
    });
    if (!datos.primerNombre && otro.datos.primerNombre) {
      Object.assign(datos, partirNombre([otro.datos.primerNombre, otro.datos.segundoNombre, otro.datos.primerApellido, otro.datos.segundoApellido].join(' ')));
    }
  }
  // Una linea con " · " junta dos columnas: esa lectura mezcla los estudios o la experiencia.
  const calidad = (bloques: string[]) => bloques.length - 2 * bloques.join('\n').split('\n').filter(l => l.includes(' · ')).length;
  const mejorBloques = (clave: 'bloquesEstudios' | 'bloquesExperiencia') =>
    resultados.reduce((elegido, r) => calidad(r[clave]) > calidad(elegido[clave]) ? r : elegido)[clave];
  return { ...mejor, datos, bloquesEstudios: mejorBloques('bloquesEstudios'), bloquesExperiencia: mejorBloques('bloquesExperiencia') };
}
