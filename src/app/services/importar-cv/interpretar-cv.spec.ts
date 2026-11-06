import { combinarLecturas, fechaIso, interpretarCv } from './interpretar-cv';
import { cruzarHabilidades } from './cruzar-habilidades';
import { lecturaEnOrden, lecturaPorColumnas } from './lecturas-pdf';

// Hojas de vida inventadas: imitan los formatos de las pruebas sin usar datos reales.
const CON_ETIQUETAS = `DATOS PERSONALES
Nombre
Laura Marcela
Apellidos
Gómez Ríos
C.C. 1.020.304.050 Fecha de nacimiento 05/03/1990
Lugar de Nacimiento
Cali - Valle
Dirección Cra 10 # 20-30 Bogotá
Teléfono 6012345678 Celular 310 555 1234
PERFIL OCUPACIONAL
Técnica en contabilidad
REFERENCIAS PERSONALES
Nombre: Pedro Gil
Ocupación: Contador
Teléfonos: 3001234567`;

const SIN_ETIQUETAS = `MARIO ROJAS PEÑA
PERFIL
Soy una persona organizada y responsable, con experiencia en atención al cliente y manejo de inventarios.
3157654321 14/08/1995 Calle 5 #12-40 Apto 301 mario.rojas@correo.com
FORMACIÓN 2018 | TÉCNICO EN LOGÍSTICA
Instituto Central
EXPERIENCIA ENERO 2019 - MARZO 2023| AUXILIAR DE BODEGA
Distribuidora Norte
Control de inventarios y despachos.
HABILIDADES
Atención al cliente · Trabajo en equipo
Manejo de Excel intermedio`;

describe('interpretarCv', () => {
  it('lee los datos con etiqueta, en la misma linea o en la siguiente', () => {
    const { datos, referencias } = interpretarCv(CON_ETIQUETAS);
    expect(datos.primerNombre).toBe('Laura');
    expect(datos.segundoNombre).toBe('Marcela');
    expect(datos.primerApellido).toBe('Gómez');
    expect(datos.segundoApellido).toBe('Ríos');
    expect(datos.identificacion).toBe('1020304050');
    expect(datos.fechaNacimiento).toBe('1990-03-05');
    expect(datos.ciudadNacimiento).toBe('Cali - Valle');
    expect(datos.direccionResidencia).toBe('Cra 10 # 20-30 Bogotá');
    expect(datos.telFijo).toBe('6012345678');
    expect(datos.telCel).toBe('3105551234');
    expect(referencias).toEqual([{ nombreCompleto: 'Pedro Gil', ocupacion: 'Contador', telefono: '3001234567', empresa: '', familiar: false }]);
  });

  it('usa un perfil de una sola linea corta como cargo', () => {
    const { datos } = interpretarCv(CON_ETIQUETAS);
    expect(datos.cargoActual).toBe('Técnica en contabilidad');
    expect(datos.acercaDMi).toBe('');
  });

  it('separa los datos pegados en una linea sin etiquetas', () => {
    const { datos } = interpretarCv(SIN_ETIQUETAS);
    expect(datos.primerNombre).toBe('Mario');
    expect(datos.primerApellido).toBe('Rojas');
    expect(datos.segundoApellido).toBe('Peña');
    expect(datos.telCel).toBe('3157654321');
    expect(datos.fechaNacimiento).toBe('1995-08-14');
    expect(datos.direccionResidencia).toBe('Calle 5 #12-40 Apto 301');
    expect(datos.email).toBe('mario.rojas@correo.com');
    expect(datos.acercaDMi).toContain('Soy una persona organizada');
    expect(datos.acercaDMi).not.toContain('@');
  });

  it('propone estudios y experiencia como bloques de texto', () => {
    const { bloquesEstudios, bloquesExperiencia } = interpretarCv(SIN_ETIQUETAS);
    expect(bloquesEstudios).toEqual(['2018 | TÉCNICO EN LOGÍSTICA\nInstituto Central']);
    expect(bloquesExperiencia.length).toBe(1);
    expect(bloquesExperiencia[0]).toContain('Distribuidora Norte');
  });

  it('reconoce titulos con letras separadas', () => {
    const { datos } = interpretarCv('ANA PAZ\nA C E R C A D E M I\nDiseñadora con diez años de experiencia en identidad visual, empaques y campañas para marcas de consumo masivo.');
    expect(datos.acercaDMi).toContain('Diseñadora');
  });

  it('no inventa datos cuando el texto no los trae', () => {
    const { datos, habilidades, referencias } = interpretarCv('Texto cualquiera sin datos de una persona.');
    expect(Object.values(datos).every(valor => valor === '')).toBeTrue();
    expect(habilidades).toEqual([]);
    expect(referencias).toEqual([]);
  });
});

describe('combinarLecturas', () => {
  it('completa con otra lectura lo que le falta a la mejor', () => {
    const resultado = combinarLecturas([CON_ETIQUETAS, 'Correo: laura@ejemplo.com']);
    expect(resultado.datos.primerNombre).toBe('Laura');
    expect(resultado.datos.email).toBe('laura@ejemplo.com');
  });
});

describe('fechaIso', () => {
  it('entiende fechas numericas y escritas', () => {
    expect(fechaIso('10/02/1983')).toBe('1983-02-10');
    expect(fechaIso('Octubre 13 de 1985')).toBe('1985-10-13');
    expect(fechaIso('13 de octubre de 1985')).toBe('1985-10-13');
    expect(fechaIso('1985')).toBe('');
  });
});

describe('cruzarHabilidades', () => {
  const catalogo = ['Excel', 'Trabajo en equipo', 'Atención al cliente', 'HTML5', 'Visual Studio Code', 'SAN', 'Java'];

  it('encuentra las del catalogo aunque esten escritas distinto', () => {
    const cruce = cruzarHabilidades(['Manejo de Excel intermedio', 'HTML', 'VS Code', 'trabajo en equipo'], '', catalogo);
    expect(cruce.enCatalogo).toEqual(['Excel', 'HTML5', 'Visual Studio Code', 'Trabajo en equipo']);
  });

  it('deja aparte las que no estan y descarta frases', () => {
    const cruce = cruzarHabilidades(['Gestión administrativa', 'aplicar mis conocimientos en el', 'básico'], '', catalogo);
    expect(cruce.otras).toEqual(['Gestión administrativa']);
  });

  it('busca menciones como palabras completas y siglas en mayusculas', () => {
    const cruce = cruzarHabilidades([], 'Vivo en San Javier. Programé en JavaScript y en Java.', catalogo);
    expect(cruce.mencionadas).toEqual(['Java']);
  });
});

describe('lecturas de PDF', () => {
  const f = (str: string, x: number, y: number, ancho = str.length * 6) => ({ str, x, y, ancho });

  it('junta las letras separadas de un titulo y conserva los espacios entre palabras', () => {
    const texto = lecturaEnOrden([[f('A L E X', 10, 700), f(' ', 60, 700), f('R U I Z', 75, 700)]]);
    expect(texto).toBe('ALEX RUIZ');
  });

  it('lee cada columna completa antes de pasar a la otra', () => {
    const izquierda = ['Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco'].map((t, i) => f(t, 20, 700 - i * 20, 60));
    const derecha = ['A', 'B', 'C', 'D', 'E'].map((t, i) => f(t, 300, 700 - i * 20, 60));
    const texto = lecturaPorColumnas([{ ancho: 600, fragmentos: [...izquierda, ...derecha] }]);
    expect(texto.split('\n')).toEqual(['Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'A', 'B', 'C', 'D', 'E']);
  });
});
