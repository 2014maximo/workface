import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
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
      imports: [ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
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
      expect(componente.pasosPendientes()).toContain('Estudios');
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
