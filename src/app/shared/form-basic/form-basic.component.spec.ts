import { TranslatePipe } from '@ngx-translate/core';
import { proveerTraduccionPruebas } from '../../i18n/pruebas';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AbstractControl, FormArray, ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { INTERESES_GUSTOS } from '../../constants/workface.contants';
import { AuthService } from '../../services/auth.service';
import { PerfilLocalService } from '../../services/perfil-local.service';
import { WebServicesService } from '../../services/web-services.service';
import { FormBasicComponent } from './form-basic.component';

describe('FormBasicComponent: intereses', () => {
  const total = INTERESES_GUSTOS.length;
  let component: FormBasicComponent;

  const intereses = () => component.formBasic.get('intereses') as FormArray;
  // Un documento guardado siempre trae todas las listas porque se guarda el formulario completo.
  const listasVacias = {
    estudios: [],
    expLaboral: [],
    conocimientosAdicionales: [],
    referenciasPersonales: [],
    referenciasFamiliares: []
  };
  const cargar = (formBasic: any) => {
    const datos = { formBasic: { ...listasVacias, ...formBasic } };
    component.setFormBasic(datos);
    component.loadFormsArray(datos);
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FormBasicComponent],
      imports: [TranslatePipe],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        proveerTraduccionPruebas(),
        { provide: AuthService, useValue: { getUserLogged: () => of(null) } },
        { provide: PerfilLocalService, useValue: {} },
        { provide: WebServicesService, useValue: { consultarRecursos: () => of({}) } }
      ]
    });
    component = TestBed.createComponent(FormBasicComponent).componentInstance;
  });

  it('ofrece un control por gusto a un usuario sin datos', () => {
    expect(intereses().length).toBe(total);
  });

  it('no duplica los controles al cargar y conserva lo guardado', () => {
    const guardados = INTERESES_GUSTOS.map((_, i) => ({ interes: i % 2 === 0 }));
    cargar({ intereses: guardados });
    expect(intereses().value).toEqual(guardados);
  });

  it('repara datos ya duplicados conservando los valores reales', () => {
    const reales = INTERESES_GUSTOS.map((_, i) => ({ interes: i % 2 === 0 }));
    cargar({ intereses: [...reales, ...reales.map(() => ({ interes: false }))] });
    expect(intereses().value).toEqual(reales);
  });

  it('carga el resto del formulario aunque no haya intereses guardados', () => {
    cargar({ primerNombre: 'Ana', intereses: [] });
    expect(component.formBasic.get('primerNombre')?.value).toBe('Ana');
    expect(intereses().length).toBe(total);
  });

  it('no propone la fecha actual en ningun campo de fecha', () => {
    component.agregarEstudio();
    component.agregarExpLaboral();
    expect(component.formBasic.get('fechaNacimiento')?.value).toBe('');
    expect(component.formBasic.get('estudios')?.value[0].fechaInicio).toBe('');
    expect(component.formBasic.get('estudios')?.value[0].fechaTitulo).toBe('');
    expect(component.formBasic.get('expLaboral')?.value[0].fechaInicioEmpresa).toBe('');
    expect(component.formBasic.get('expLaboral')?.value[0].fechaFinalEmpresa).toBe('');
  });

  describe('cierre del modal de carga', () => {
    let modal: jasmine.Spy;

    const iniciar = async (consulta: Promise<any>) => {
      const instancia = component as any;
      instancia.authService = { getUserLogged: () => of({ multiFactor: { user: { uid: 'u' } } }) };
      instancia.perfilLocal = { obtener: () => consulta };
      component.inicializarVariables();
      await new Promise(resolver => setTimeout(resolver));
    };

    beforeEach(() => {
      modal = jasmine.createSpy('modal');
      (window as any).$ = () => ({ modal });
    });

    afterEach(() => delete (window as any).$);

    it('lo cierra si el usuario nuevo no tiene perfil', async () => {
      await iniciar(Promise.resolve(undefined));
      expect(modal).toHaveBeenCalledWith('hide');
      expect(component.datosGenerales).toBeUndefined();
      expect(intereses().length).toBe(total);
    });

    it('lo cierra si falla la lectura', async () => {
      spyOn(console, 'error');
      await iniciar(Promise.reject(new Error('sin acceso')));
      expect(modal).toHaveBeenCalledWith('hide');
    });
  });

  describe('subida de imagenes', () => {
    const archivo = () => new Promise<Blob>(resolver => {
      const lienzo = document.createElement('canvas');
      lienzo.width = lienzo.height = 10;
      lienzo.toBlob(imagen => resolver(imagen!), 'image/png');
    });
    let modal: jasmine.Spy;

    beforeEach(() => {
      modal = jasmine.createSpy('modal');
      (window as any).$ = () => ({ modal });
    });

    afterEach(() => delete (window as any).$);

    it('deja la imagen comprimida en el formulario', async () => {
      await component.loadImg('/firma/', { target: { files: [await archivo()] } });
      expect(component.formBasic.get('imgFirma')?.value).toMatch(/^data:image\/png;base64,/);
      expect(component.imgFirma.length).toBe(1);
      expect(modal).toHaveBeenCalledWith('hide');
    });

    it('conserva la imagen anterior y cierra el modal si el archivo no es valido', async () => {
      spyOn(console, 'error');
      component.formBasic.get('imgFirma')?.setValue('data:anterior');
      await component.loadImg('/firma/', { target: { files: [new Blob(['no es imagen'], { type: 'text/plain' })] } });
      expect(component.formBasic.get('imgFirma')?.value).toBe('data:anterior');
      expect(modal).toHaveBeenCalledWith('hide');
    });

    it('guarda el formulario y actualiza los datos generales', async () => {
      const guardar = jasmine.createSpy('guardar').and.resolveTo();
      (component as any).perfilLocal = { guardar };
      component.uid = 'u';
      component.formBasic.get('primerNombre')?.setValue('Ana');
      component.guardar();
      await new Promise(resolver => setTimeout(resolver));
      expect(guardar.calls.mostRecent().args[0]).toBe('u');
      expect(component.datosGenerales.formBasic.primerNombre).toBe('Ana');
      expect(modal).toHaveBeenCalledWith('hide');
    });

    it('no hace nada si se cancela la seleccion', async () => {
      await component.loadImg('/firma/', { target: { files: [] } });
      expect(modal).not.toHaveBeenCalled();
    });
  });
});

describe('FormBasicComponent: plantilla', () => {
  let elemento: HTMLElement;
  let jQueryOriginal: any;

  beforeEach(() => {
    jQueryOriginal = (window as any).$;
    const vacio = { modal: () => vacio, tooltip: () => vacio, ready: () => vacio };
    (window as any).$ = () => vacio;
    TestBed.configureTestingModule({
      declarations: [FormBasicComponent],
      imports: [TranslatePipe, ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        proveerTraduccionPruebas(),
        { provide: AuthService, useValue: { getUserLogged: () => of(null) } },
        { provide: PerfilLocalService, useValue: {} },
        { provide: WebServicesService, useValue: { consultarRecursos: () => of({}) } }
      ]
    });
    const fixture = TestBed.createComponent(FormBasicComponent);
    fixture.detectChanges();
    elemento = fixture.nativeElement;
  });

  afterEach(() => (window as any).$ = jQueryOriginal);

  describe('aviso de la descripcion de un estudio', () => {
    let fixture: any;
    let componente: FormBasicComponent;
    let descripcion: AbstractControl;
    const aviso = (): HTMLElement | null => {
      fixture.detectChanges();
      return fixture.nativeElement.querySelector('#ayuda-descripcionEstudio-0');
    };
    const escribir = (texto: string) => {
      descripcion.setValue(texto);
      descripcion.markAsDirty();
    };

    beforeEach(() => {
      fixture = TestBed.createComponent(FormBasicComponent);
      componente = fixture.componentInstance;
      componente.agregarEstudio();
      descripcion = componente.formBasic.get('estudios.0.descripcionEstudio') as AbstractControl;
    });

    it('no aparece antes de escribir', () => {
      expect(aviso()).toBeNull();
    });

    it('queda en rojo al escribir menos del minimo', () => {
      escribir('Muy corta');
      expect(aviso()?.textContent).toContain('Llevas 9');
      expect(aviso()?.classList).toContain('estado-pendiente');
      expect(componente.pasosPendientes()).toContain('form.resumen.p8');
    });

    it('desaparece al llegar al minimo, sin limite maximo', () => {
      escribir('Muy corta');
      expect(aviso()).not.toBeNull();
      escribir('x'.repeat(40));
      expect(aviso()).toBeNull();
      escribir('x'.repeat(300));
      expect(aviso()).toBeNull();
    });

    it('sigue en rojo si se vacia el campo despues de escribir', () => {
      escribir('');
      expect(aviso()?.textContent).toContain('Llevas 0');
    });

    it('aparece si una descripcion guardada no llega al minimo', () => {
      descripcion.setValue('Muy corta');
      expect(aviso()).not.toBeNull();
    });
  });

  describe('aviso de las funciones realizadas', () => {
    let fixture: any;
    let funciones: AbstractControl;
    const aviso = (): HTMLElement | null => {
      fixture.detectChanges();
      return fixture.nativeElement.querySelector('#ayuda-funcionesRealizadas-0');
    };
    const escribir = (texto: string) => {
      funciones.setValue(texto);
      funciones.markAsDirty();
    };

    beforeEach(() => {
      fixture = TestBed.createComponent(FormBasicComponent);
      fixture.componentInstance.agregarExpLaboral();
      funciones = fixture.componentInstance.formBasic.get('expLaboral.0.funcionesRealizadas') as AbstractControl;
    });

    it('no aparece antes de escribir', () => {
      expect(aviso()).toBeNull();
    });

    it('queda en rojo al escribir menos del minimo', () => {
      escribir('Muy corta');
      expect(aviso()?.textContent).toContain('Mínimo 40 caracteres. Llevas 9');
      expect(aviso()?.classList).toContain('estado-pendiente');
    });

    it('desaparece al llegar al minimo, sin limite maximo', () => {
      escribir('Muy corta');
      expect(aviso()).not.toBeNull();
      escribir('x'.repeat(40));
      expect(aviso()).toBeNull();
      escribir('x'.repeat(300));
      expect(aviso()).toBeNull();
    });

    it('aparece si un texto guardado no llega al minimo', () => {
      funciones.setValue('Muy corta');
      expect(aviso()).not.toBeNull();
    });
  });

  describe('habilidades', () => {
    let fixture: any;
    let componente: FormBasicComponent;
    const lista = () => componente.formBasic.get('habilidades') as FormArray;

    beforeEach(() => {
      fixture = TestBed.createComponent(FormBasicComponent);
      componente = fixture.componentInstance;
    });

    it('carga habilidades guardadas sin icono', () => {
      componente.loadFormsArray({ formBasic: {
        habilidades: [{ habilidad: 'Excel', nivel: '80' }],
        estudios: [], expLaboral: [], conocimientosAdicionales: [], referenciasPersonales: [], referenciasFamiliares: []
      } });
      expect(lista().at(0).value.habilidad).toBe('Excel');

      fixture.detectChanges();
      const boton: HTMLElement = fixture.nativeElement.querySelector('#habilidad-0');
      expect(boton.textContent).toContain('Excel');
      expect(boton.querySelector('img')?.getAttribute('src')).toContain('data:image/svg+xml');
    });

    it('invita a elegir cuando no hay habilidad y no tiene campo de texto', () => {
      componente.agregarHabilidad();
      fixture.detectChanges();
      const boton: HTMLElement = fixture.nativeElement.querySelector('#habilidad-0');
      expect(boton.tagName).toBe('BUTTON');
      expect(boton.textContent).toContain('Elegir habilidad');
    });

    it('el boton de agregar no crea el registro hasta que se elige una habilidad', () => {
      fixture.detectChanges();
      fixture.nativeElement.querySelector('#agregarHabilidad').click();
      expect(lista().length).toBe(0);

      componente.habilidadElegida({ nombre: 'Python', icono: '<svg></svg>' });

      expect(lista().length).toBe(1);
      expect(lista().at(0).value.habilidad).toBe('Python');
    });

    it('empieza en 50 y el paso queda completo al elegir', () => {
      componente.abrirSelectorHabilidad();
      componente.habilidadElegida({ nombre: 'Python', icono: '' });
      fixture.detectChanges();

      expect(lista().at(0).value.nivel).toBe(50);
      expect(lista().valid).toBeTrue();
      expect(fixture.nativeElement.querySelector('#nivel-0').value).toBe('50');
      expect(fixture.nativeElement.textContent).toContain('50%');
    });

    it('conserva el nivel al cambiar de habilidad, incluido el 0', () => {
      componente.abrirSelectorHabilidad();
      componente.habilidadElegida({ nombre: 'Python', icono: '' });
      lista().at(0).patchValue({ nivel: 0 });

      componente.abrirSelectorHabilidad(0);
      componente.habilidadElegida({ nombre: 'Excel', icono: '' });

      expect(lista().at(0).value.habilidad).toBe('Excel');
      expect(lista().at(0).value.nivel).toBe(0);
    });

    it('cerrar el modal sin elegir no crea ningun registro', () => {
      fixture.detectChanges();
      fixture.nativeElement.querySelector('#agregarHabilidad').click();

      componente.selectorHabilidadCerrado();

      expect(lista().length).toBe(0);
    });

    it('dos habilidades agregadas seguidas quedan en registros distintos', () => {
      componente.abrirSelectorHabilidad();
      componente.habilidadElegida({ nombre: 'Python', icono: '' });
      componente.abrirSelectorHabilidad();
      componente.habilidadElegida({ nombre: 'Excel', icono: '' });

      expect(lista().value.map((h: any) => h.habilidad)).toEqual(['Python', 'Excel']);
    });

    it('guarda en el registro correcto lo que se elige en el modal', () => {
      componente.agregarHabilidad();
      componente.agregarHabilidad();

      componente.abrirSelectorHabilidad(1);
      componente.habilidadElegida({ nombre: 'Python', icono: '<svg></svg>' });

      expect(lista().at(0).value.habilidad).toBe('');
      expect(lista().at(1).value.habilidad).toBe('Python');
      expect(lista().at(1).value.icono).toBe('<svg></svg>');
    });
  });

  describe('deshacer borrados', () => {
    let fixture: any;
    let componente: FormBasicComponent;

    beforeEach(() => {
      fixture = TestBed.createComponent(FormBasicComponent);
      componente = fixture.componentInstance;
    });

    it('restaura los campos limpiados', () => {
      componente.formBasic.patchValue({ primerNombre: 'Ana', primerApellido: 'Ruiz' });

      componente.eraseForm(['primerNombre', 'primerApellido']);
      expect(componente.formBasic.value.primerNombre).toBeNull();

      componente.deshacer();
      expect(componente.formBasic.value.primerNombre).toBe('Ana');
      expect(componente.formBasic.value.primerApellido).toBe('Ruiz');
      expect(componente.borrado).toBeNull();
    });

    it('restaura un registro limpiado', () => {
      componente.agregarHabilidad();
      const habilidad = (componente.formBasic.get('habilidades') as FormArray).at(0);
      habilidad.setValue({ habilidad: 'Excel', icono: '<svg></svg>', nivel: '80' });

      componente.eraseForm([], habilidad);
      expect(habilidad.value.habilidad).toBeNull();

      componente.deshacer();
      expect(habilidad.value).toEqual({ habilidad: 'Excel', icono: '<svg></svg>', nivel: '80' });
    });

    it('no reemplaza el borrado anterior si no habia nada que limpiar', () => {
      componente.formBasic.patchValue({ primerNombre: 'Ana' });
      componente.eraseForm(['primerNombre']);
      componente.eraseForm(['cargoActual']);

      componente.deshacer();
      expect(componente.formBasic.value.primerNombre).toBe('Ana');
    });

    it('devuelve el registro eliminado a su posicion', () => {
      const lista = componente.formBasic.get('habilidades') as FormArray;
      ['A', 'B', 'C'].forEach((nombre, i) => {
        componente.agregarHabilidad();
        lista.at(i).setValue({ habilidad: nombre, icono: '', nivel: '1' });
      });

      componente.deleteControls('habilidades', 1);
      expect(lista.length).toBe(2);
      expect(componente.borrado?.mensaje).toBe('Se eliminó: Habilidad 2.');

      componente.deshacer();
      expect(lista.value.map((h: any) => h.habilidad)).toEqual(['A', 'B', 'C']);
    });

    it('devuelve la imagen y su vista previa', () => {
      componente.formBasic.patchValue({ imgFirma: 'data:firma' });
      componente.imgFirma = ['data:firma'];

      componente.eliminarImagen('imgFirma');
      expect(componente.formBasic.value.imgFirma).toBeNull();
      expect(componente.imgFirma).toEqual([]);

      componente.deshacer();
      expect(componente.formBasic.value.imgFirma).toBe('data:firma');
      expect(componente.imgFirma).toEqual(['data:firma']);
    });

    it('solo recupera el ultimo borrado', () => {
      componente.formBasic.patchValue({ primerNombre: 'Ana', cargoActual: 'Gerente' });
      componente.eraseForm(['primerNombre']);
      componente.eraseForm(['cargoActual']);

      componente.deshacer();
      expect(componente.formBasic.value.cargoActual).toBe('Gerente');
      expect(componente.formBasic.value.primerNombre).toBeNull();
    });

    it('muestra la barra y la quita al guardar', async () => {
      TestBed.inject(PerfilLocalService).guardar = () => Promise.resolve() as any;
      componente.formBasic.patchValue({ primerNombre: 'Ana' });
      componente.eraseForm(['primerNombre']);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.btn-deshacer')).not.toBeNull();

      componente.guardar();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.btn-deshacer')).toBeNull();
    });

    it('limpiar Cargo no toca las fotos', () => {
      componente.formBasic.patchValue({ cargoActual: 'Gerente', fotoSemiperfil: 'data:foto' });
      fixture.detectChanges();
      const botones = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('button[aria-label="Borrar contenido de los textos"]'));
      const boton = botones.find(b => b.closest('.carousel-item')?.querySelector('#cargoActual'));

      boton?.click();
      expect(componente.formBasic.value.cargoActual).toBeNull();
      expect(componente.formBasic.value.fotoSemiperfil).toBe('data:foto');
    });
  });

  it('ningun boton envia el formulario, para que Enter no borre datos', () => {
    const botones = Array.from(elemento.querySelectorAll('form button'));
    expect(botones.length).toBeGreaterThan(0);
    botones.forEach(boton => expect(boton.getAttribute('type')).toBe('button'));
  });

  it('cada campo tiene un nombre accesible', () => {
    const campos = Array.from(elemento.querySelectorAll<HTMLElement>('form input, form select, form textarea'));
    expect(campos.length).toBeGreaterThan(0);
    const sinNombre = campos.filter(campo => !campo.getAttribute('aria-label') && !elemento.querySelector(`label[for="${campo.id}"]`));
    expect(sinNombre.map(campo => campo.getAttribute('formcontrolname'))).toEqual([]);
  });
});

describe('FormBasicComponent: importar hoja de vida', () => {
  let componente: FormBasicComponent;

  const seleccion = (cambios: any = {}) => ({
    campos: { primerNombre: 'Laura', email: 'laura@ejemplo.com' },
    habilidades: [{ nombre: 'Excel', icono: '<svg></svg>', origen: 'seccion' as const }],
    referencias: [{ nombreCompleto: 'Pedro Gil', ocupacion: 'Contador', telefono: '3001234567', empresa: '', familiar: false }],
    bloquesEstudios: ['2020 | Técnico en contabilidad'],
    bloquesExperiencia: [],
    ...cambios
  });
  const lista = (nombre: string) => componente.formBasic.get(nombre) as FormArray;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FormBasicComponent],
      imports: [TranslatePipe],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        proveerTraduccionPruebas(),
        { provide: AuthService, useValue: { getUserLogged: () => of(null) } },
        { provide: PerfilLocalService, useValue: {} },
        { provide: WebServicesService, useValue: { consultarRecursos: () => of({}) } }
      ]
    });
    componente = TestBed.createComponent(FormBasicComponent).componentInstance;
  });

  it('aplica los campos, las habilidades con nivel inicial y las referencias', () => {
    componente.importacionAplicada(seleccion());
    expect(componente.formBasic.value.primerNombre).toBe('Laura');
    expect(componente.formBasic.value.email).toBe('laura@ejemplo.com');
    expect(lista('habilidades').value).toEqual([{ habilidad: 'Excel', icono: '<svg></svg>', nivel: 50 }]);
    expect(lista('referenciasPersonales').value[0]).toEqual({ nombreCompleto: 'Pedro Gil', ocupacion: 'Contador', telefono: '3001234567', empresa: '' });
    expect(componente.textoImportado.estudios).toEqual(['2020 | Técnico en contabilidad']);
  });

  it('manda a referencias familiares las que vienen de esa seccion', () => {
    componente.importacionAplicada(seleccion({ referencias: [{ nombreCompleto: 'Rosa Gil', ocupacion: 'Docente', telefono: '1', empresa: '', familiar: true }] }));
    expect(lista('referenciasPersonales').length).toBe(0);
    expect(lista('referenciasFamiliares').value[0].nombreCompleto).toBe('Rosa Gil');
  });

  it('deshacer devuelve los valores anteriores y quita solo lo importado', () => {
    componente.formBasic.patchValue({ primerNombre: 'Ana' });
    componente.agregarHabilidad();
    lista('habilidades').at(0).patchValue({ habilidad: 'Word', nivel: 80 });

    componente.importacionAplicada(seleccion());
    expect(componente.borrado?.mensaje).toContain('Se importaron 4 datos');
    componente.deshacer();

    expect(componente.formBasic.value.primerNombre).toBe('Ana');
    expect(componente.formBasic.value.email).toBe('');
    expect(lista('habilidades').value.map((h: any) => h.habilidad)).toEqual(['Word']);
    expect(lista('referenciasPersonales').length).toBe(0);
    expect(componente.textoImportado.estudios).toEqual([]);
  });

  it('ocultar el texto de una seccion no toca la otra', () => {
    componente.importacionAplicada(seleccion({ bloquesExperiencia: ['2019 - 2021 | Auxiliar'] }));
    componente.ocultarTextoImportado('estudios');
    expect(componente.textoImportado).toEqual({ estudios: [], experiencia: ['2019 - 2021 | Auxiliar'] });
  });
});

describe('FormBasicComponent: campos faltantes de experiencia laboral', () => {
  let component: FormBasicComponent;
  const experiencia = () => component.formBasic.get('expLaboral') as FormArray;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FormBasicComponent],
      imports: [TranslatePipe],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        proveerTraduccionPruebas(),
        { provide: AuthService, useValue: { getUserLogged: () => of(null) } },
        { provide: PerfilLocalService, useValue: { guardar: () => Promise.resolve() } },
        { provide: WebServicesService, useValue: { consultarRecursos: () => of({}) } }
      ]
    });
    component = TestBed.createComponent(FormBasicComponent).componentInstance;
    component.agregarExpLaboral();
    component.agregarExpLaboral();
    experiencia().at(0).patchValue({
      nombreEmpresa: 'Comercializadora Andina', jefeInmediatoEmpresa: 'Luis Gómez', cargoEjercido: 'Analista',
      funcionesRealizadas: 'Desarrollé reportes y tableros de control para el área financiera.',
      fechaInicioEmpresa: '2020-01-01', telContactoEmpresa: '6045550000', ciudadEmpresa: 'Medellín'
    });
    experiencia().at(1).patchValue({ nombreEmpresa: 'Tiendas Cafeteras', cargoEjercido: 'Líder', funcionesRealizadas: 'Muy corto' });
  });

  it('dice que empresa esta incompleta y que campos le faltan', () => {
    expect(component.faltantes('expLaboral')).toEqual([
      { numero: 2, campos: ['Jefe inmediato', 'Funciones realizadas', 'Fecha de inicio', 'Número de contacto', 'Ciudad'] }
    ]);
    expect(component.camposFaltantes('expLaboral', experiencia().at(1))).toBe('Jefe inmediato, Funciones realizadas, Fecha de inicio, Número de contacto y Ciudad');
  });

  it('no exige la fecha de finalizacion', () => {
    expect(experiencia().at(0).valid).toBeTrue();
  });

  it('al guardar marca los campos que faltan para mostrarlos', async () => {
    // guardar() abre el modal de carga con jQuery, que no existe en las pruebas.
    const jQuery = (window as any).$;
    (window as any).$ = () => ({ modal: () => undefined });
    const jefe = experiencia().at(1).get('jefeInmediatoEmpresa');
    expect(component.mostrarError(jefe)).toBeFalse();
    component.guardar();
    expect(component.mostrarError(jefe)).toBeTrue();
    expect(component.mostrarError(experiencia().at(0).get('nombreEmpresa'))).toBeFalse();
    // Espera a que termine el guardado, que cierra el modal al final.
    await new Promise(resolver => setTimeout(resolver));
    (window as any).$ = jQuery;
  });
});

describe('FormBasicComponent: campos faltantes en estudios, conocimientos y referencias', () => {
  let fixture: any;
  let component: FormBasicComponent;
  let jQueryOriginal: any;

  beforeEach(() => {
    // ngOnInit y guardar() usan jQuery, que no existe en las pruebas.
    jQueryOriginal = (window as any).$;
    const vacio = { modal: () => vacio, tooltip: () => vacio, ready: () => vacio };
    (window as any).$ = () => vacio;
    TestBed.configureTestingModule({
      declarations: [FormBasicComponent],
      imports: [TranslatePipe, ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        proveerTraduccionPruebas(),
        { provide: AuthService, useValue: { getUserLogged: () => of(null) } },
        { provide: PerfilLocalService, useValue: { guardar: () => Promise.resolve() } },
        { provide: WebServicesService, useValue: { consultarRecursos: () => of({}) } }
      ]
    });
    fixture = TestBed.createComponent(FormBasicComponent);
    component = fixture.componentInstance;
    component.agregarEstudio();
    component.agregarConocimientos();
    component.agregarReferenciaPersonal();
    component.agregarReferenciaFamiliar();
    (component.formBasic.get('referenciasFamiliares') as FormArray).at(0).patchValue({ nombreCompleto: 'Ana Ruiz', telefono: '3000000000' });
  });

  // Espera a que termine el guardado, que cierra el modal al final.
  afterEach(async () => {
    await new Promise(resolver => setTimeout(resolver));
    (window as any).$ = jQueryOriginal;
  });

  it('nombra los campos que faltan en cada lista', () => {
    expect(component.faltantes('conocimientosAdicionales')).toEqual([{ numero: 1, campos: ['Conocimiento', 'Duración', 'Fecha finalización'] }]);
    expect(component.faltantes('referenciasFamiliares')).toEqual([{ numero: 1, campos: ['Ocupación', 'Parentesco', 'Empresa'] }]);
  });

  it('marca los campos con su mensaje al intentar guardar', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#error-nombreInstitucion-0')).toBeNull();
    component.guardar();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#error-nombreInstitucion-0')?.textContent).toContain('Escribe el nombre de la institución.');
    expect(fixture.nativeElement.querySelector('#nombreInstitucion-0').getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('#error-refFamiliar-parentesco-0')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#error-refFamiliar-nombreCompleto-0')).toBeNull();
    expect(fixture.nativeElement.querySelector('#ayuda-descripcionEstudio-0')?.textContent).toContain('Describe tu estudio');
    expect(fixture.nativeElement.textContent).toContain('Falta completar: Ocupación, Parentesco y Empresa.');
  });

  it('no repite los identificadores de los campos entre referencias personales y familiares', () => {
    fixture.detectChanges();
    const ids = [...fixture.nativeElement.querySelectorAll('[id]')].map((e: HTMLElement) => e.id);
    expect(ids.filter((id: string, i: number) => ids.indexOf(id) !== i)).toEqual([]);
  });
});

describe('FormBasicComponent: vista previa en vivo', () => {
  it('avisa los cambios del formulario despues de una pausa corta', fakeAsync(() => {
    TestBed.configureTestingModule({
      declarations: [FormBasicComponent],
      imports: [TranslatePipe],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        proveerTraduccionPruebas(),
        { provide: AuthService, useValue: { getUserLogged: () => of(null) } },
        { provide: PerfilLocalService, useValue: {} },
        { provide: WebServicesService, useValue: { consultarRecursos: () => of({}) } }
      ]
    });
    const component = TestBed.createComponent(FormBasicComponent).componentInstance;
    const recibidos: any[] = [];
    component.cambio.subscribe(valor => recibidos.push(valor));

    component.formBasic.get('primerNombre')!.setValue('M');
    component.formBasic.get('primerNombre')!.setValue('María');
    tick(100);
    expect(recibidos.length).toBe(0);
    tick(200);
    expect(recibidos.length).toBe(1);
    expect(recibidos[0].formBasic.primerNombre).toBe('María');
  }));
});
