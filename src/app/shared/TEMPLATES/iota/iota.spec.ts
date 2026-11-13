import { combinarLecturas, normalizar } from '../../../services/importar-cv/interpretar-cv';
import { leerArchivo } from '../../../services/importar-cv/leer-archivo';
import { documentoIota, mesYAnio, nombreArchivoIota, puntosDe, rangoFechas, TITULOS_IOTA } from './iota-documento';
import { crearPdfIota } from './iota-pdf';

// Perfil de prueba: datos inventados, con tildes y ñ para comprobar que el texto sale bien.
const perfil = () => ({
  formBasic: {
    primerNombre: 'María', segundoNombre: 'José', primerApellido: 'Peña', segundoApellido: 'Castaño',
    tipoIdentificacion: 'CC', identificacion: '1017654321', fechaNacimiento: '1990-04-12', genero: 'Femenino',
    direccionResidencia: 'Calle 10 # 43-21', barrioResidencia: 'El Poblado',
    telCel: '3105551234', telFijo: '', email: 'maria.pena@correo.com',
    linkedin: 'linkedin.com/in/maria-pena', webSite: '',
    cargoActual: 'Desarrolladora Frontend',
    acercaDMi: 'Desarrolladora con seis años de experiencia en aplicaciones web accesibles con Angular y TypeScript.',
    expLaboral: [
      {
        cargoEjercido: 'Desarrolladora Junior', nombreEmpresa: 'Comercializadora Andina', ciudadEmpresa: 'Medellín',
        fechaInicioEmpresa: '2018-02-01', fechaFinalEmpresa: '2021-06-30', jefeInmediatoEmpresa: 'Luis Gómez', telContactoEmpresa: '6045550000',
        funcionesRealizadas: 'Mantenimiento del sitio de ventas.'
      },
      {
        cargoEjercido: 'Desarrolladora Frontend Senior', nombreEmpresa: 'Tiendas Cafeteras S.A.S.', ciudadEmpresa: 'Bogotá',
        fechaInicioEmpresa: '2021-07-01', fechaFinalEmpresa: '',
        funcionesRealizadas: '- Lideré la migración a Angular 21.\n- Reduje el tiempo de carga en un 40 %.\n• Diseñé el sistema de componentes.'
      },
    ],
    estudios: [
      { tituloObtenido: 'Ingeniera de Sistemas', nombreInstitucion: 'Universidad de Antioquia', ciudadEstudio: 'Medellín', fechaInicio: '2009-01-20', fechaTitulo: '2014-12-05', descripcionEstudio: '' },
    ],
    conocimientosAdicionales: [
      { nombreConocimiento: 'Accesibilidad web (WCAG 2.2)', duracion: '40 horas', fechaFinalizacion: '2023-09-15' },
    ],
    habilidades: [{ habilidad: 'Angular', nivel: '90' }, { habilidad: 'TypeScript', nivel: '85' }, { habilidad: 'RxJS', nivel: '70' }],
    idiomas: [{ idioma: 'Inglés', nivel: 'B2' }],
    referenciasPersonales: [{ nombreCompleto: 'Ana Ruiz', telefono: '3000000000' }],
    fotoFrontalSinFondo: '',
  }
});

describe('Plantilla iota: contenido', () => {
  it('ordena la experiencia de la mas reciente a la mas antigua', () => {
    const experiencia = documentoIota(perfil()).secciones.find(s => s.titulo === TITULOS_IOTA.experiencia)!;
    expect(experiencia.entradas.map(e => e.titulo)).toEqual(['Desarrolladora Frontend Senior', 'Desarrolladora Junior']);
    expect(experiencia.entradas[0].fechas).toBe('Julio 2021 - Actualidad');
    expect(experiencia.entradas[0].lugar).toBe('Tiendas Cafeteras S.A.S., Bogotá');
  });

  it('convierte las funciones en puntos sin las viñetas escritas a mano', () => {
    const [actual, anterior] = documentoIota(perfil()).secciones.find(s => s.titulo === TITULOS_IOTA.experiencia)!.entradas;
    expect(actual.puntos).toEqual(['Lideré la migración a Angular 21.', 'Reduje el tiempo de carga en un 40 %.', 'Diseñé el sistema de componentes.']);
    expect(anterior.puntos).toEqual([]);
    expect(anterior.parrafo).toBe('Mantenimiento del sitio de ventas.');
  });

  it('no incluye datos que un ATS no necesita', () => {
    const texto = JSON.stringify(documentoIota(perfil()));
    ['1017654321', '1990', 'Femenino', 'El Poblado', 'Luis Gómez', 'Ana Ruiz'].forEach(dato => expect(texto).not.toContain(dato));
  });

  it('muestra solo las 3 experiencias mas recientes y cuenta las demas', () => {
    const datos: any = perfil();
    ['2010', '2012', '2014'].forEach(anio => datos.formBasic.expLaboral.push({ cargoEjercido: 'Analista ' + anio, nombreEmpresa: 'Empresa ' + anio, fechaInicioEmpresa: `${anio}-01-01` }));
    const cv = documentoIota(datos);
    expect(cv.secciones.find(s => s.titulo === TITULOS_IOTA.experiencia)!.entradas.map(e => e.titulo))
      .toEqual(['Desarrolladora Frontend Senior', 'Desarrolladora Junior', 'Analista 2014']);
    expect(cv.empresasOmitidas).toBe(2);
    expect(documentoIota(perfil()).empresasOmitidas).toBe(0);
  });

  it('omite las secciones vacias', () => {
    const cv = documentoIota({ formBasic: { primerNombre: 'Ana', habilidades: [{ habilidad: 'Excel' }] } });
    expect(cv.secciones.map(s => s.titulo)).toEqual([TITULOS_IOTA.habilidades]);
  });

  it('formatea las fechas del formulario', () => {
    expect(mesYAnio('2014-12-05')).toBe('Diciembre 2014');
    expect(mesYAnio('')).toBe('');
    expect(rangoFechas('2020-01-01', '')).toBe('Enero 2020');
    expect(puntosDe('  uno \n\n * dos ')).toEqual(['uno', 'dos']);
  });

  it('nombra el archivo sin tildes ni espacios', () => {
    expect(nombreArchivoIota('María José Peña')).toBe('Hoja-de-vida-Maria-Jose-Pena.pdf');
    expect(nombreArchivoIota('')).toBe('Hoja-de-vida.pdf');
  });
});

// Prueba ATS: el PDF se vuelve a leer con el mismo importador de hojas de vida de Workface,
// que extrae el texto como lo haria un sistema de seleccion.
describe('Plantilla iota: lectura ATS del PDF', () => {
  let textos: string[];

  beforeAll(async () => {
    const pdf = await crearPdfIota(documentoIota(perfil()), { conFoto: false });
    const archivo = new File([pdf.output('arraybuffer')], 'cv.pdf', { type: 'application/pdf' });
    textos = await leerArchivo(archivo);
  });

  it('tiene texto real y no una imagen', () => {
    expect(textos[0]).toContain('Desarrolladora Frontend Senior');
  });

  it('conserva las tildes y la ñ', () => {
    expect(textos[0]).toContain('María José Peña Castaño');
    expect(textos[0]).toContain('Lideré la migración a Angular 21.');
  });

  it('lee las secciones en orden y de una en una', () => {
    const texto = normalizar(textos[0]);
    const posiciones = Object.values(TITULOS_IOTA).map(titulo => texto.indexOf(normalizar(titulo)));
    expect(posiciones.every(p => p >= 0)).toBeTrue();
    expect([...posiciones].sort((a, b) => a - b)).toEqual(posiciones);
  });

  it('el importador reconoce los datos de contacto y el perfil', () => {
    const { datos, habilidades, bloquesExperiencia, bloquesEstudios } = combinarLecturas(textos);
    expect(datos.primerNombre).toBe('María');
    expect(datos.primerApellido).toBe('Peña');
    expect(datos.email).toBe('maria.pena@correo.com');
    expect(datos.telCel).toBe('3105551234');
    expect(datos.linkedin).toContain('linkedin.com/in/maria-pena');
    expect(habilidades.join(' ')).toContain('Angular');
    expect(habilidades.join(' ')).toContain('TypeScript');
    expect(bloquesExperiencia.join('\n')).toContain('Tiendas Cafeteras');
    expect(bloquesEstudios.join('\n')).toContain('Universidad de Antioquia');
  });
});
