import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ImportacionCv, ImportarCvService } from 'src/app/services/importar-cv/importar-cv.service';
import { ErrorImportacion } from 'src/app/services/importar-cv/leer-archivo';
import { ImportarCvComponent } from './importar-cv.component';

describe('ImportarCvComponent', () => {
  let componente: ImportarCvComponent;
  let analizar: jasmine.Spy;

  const vacio = { primerNombre: '', segundoNombre: '', primerApellido: '', segundoApellido: '', identificacion: '', fechaNacimiento: '',
    ciudadNacimiento: '', direccionResidencia: '', barrioResidencia: '', telFijo: '', telCel: '', email: '', cargoActual: '',
    acercaDMi: '', webSite: '', linkedin: '' };
  const resultado = (cambios: Partial<ImportacionCv> = {}): ImportacionCv => ({
    datos: { ...vacio, primerNombre: 'Laura', email: 'laura@ejemplo.com' },
    habilidades: [
      { nombre: 'Excel', icono: '<svg></svg>', origen: 'seccion' },
      { nombre: 'Word', icono: '<svg></svg>', origen: 'seccion' },
      { nombre: 'Java', icono: '<svg></svg>', origen: 'mencion' },
    ],
    referencias: [],
    bloquesEstudios: [],
    bloquesExperiencia: [],
    ...cambios
  });
  const leer = async (actuales = { campos: {}, habilidades: [] as string[] }) => {
    (componente as any).actuales = actuales;
    const evento = { target: { files: [new File(['x'], 'cv.pdf')], value: 'cv.pdf' } } as any;
    componente.alElegir(evento);
    await analizar.calls.mostRecent().returnValue.catch(() => null);
    await Promise.resolve();
  };

  beforeEach(() => {
    // El modal de Bootstrap se controla con jQuery, que no se carga en las pruebas.
    (window as any).$ = () => ({ modal: () => null });
    analizar = jasmine.createSpy('analizar').and.callFake(() => Promise.resolve(resultado()));
    TestBed.configureTestingModule({
      declarations: [ImportarCvComponent],
      imports: [FormsModule],
      providers: [{ provide: ImportarCvService, useValue: { analizar } }]
    });
    componente = TestBed.createComponent(ImportarCvComponent).componentInstance;
  });

  it('marca los campos vacios y deja sin marcar los que reemplazan algo escrito', async () => {
    await leer({ campos: { primerNombre: 'Ana' }, habilidades: [] });
    const campos = componente.grupos.flatMap(g => g.campos);
    expect(campos.find(c => c.campo === 'primerNombre')).toEqual(jasmine.objectContaining({ marcado: false, actual: 'Ana' }));
    expect(campos.find(c => c.campo === 'email')?.marcado).toBeTrue();
  });

  it('no propone lo que ya es igual en el perfil', async () => {
    await leer({ campos: { primerNombre: 'laura' }, habilidades: [] });
    expect(componente.grupos.flatMap(g => g.campos).map(c => c.campo)).toEqual(['email']);
  });

  it('marca solo las habilidades de la seccion y no repite las que ya estan', async () => {
    await leer({ campos: {}, habilidades: ['Word'] });
    const todas = componente.habilidades.flatMap(g => g.lista);
    expect(todas.filter(h => h.marcada).map(h => h.nombre)).toEqual(['Excel']);
    expect(todas.find(h => h.nombre === 'Word')?.repetida).toBeTrue();
  });

  it('emite solo lo marcado, con el valor corregido', async () => {
    const emitido = jasmine.createSpy('aplicar');
    componente.aplicar.subscribe(emitido);
    await leer();
    const email = componente.grupos.flatMap(g => g.campos).find(c => c.campo === 'email')!;
    email.valor = ' laura.gomez@ejemplo.com ';
    componente.grupos.flatMap(g => g.campos).find(c => c.campo === 'primerNombre')!.marcado = false;
    componente.confirmar();
    const seleccion = emitido.calls.mostRecent().args[0];
    expect(seleccion.campos).toEqual({ email: 'laura.gomez@ejemplo.com' });
    expect(seleccion.habilidades.map((h: any) => h.nombre)).toEqual(['Excel', 'Word']);
  });

  it('explica el error de un archivo sin texto', async () => {
    analizar.and.callFake(() => Promise.reject(new ErrorImportacion('sinTexto')));
    await leer();
    expect(componente.estado).toBe('error');
    expect(componente.mensajeError).toContain('escaneada');
  });
});
