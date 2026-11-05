import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormArray, ReactiveFormsModule } from '@angular/forms';
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

  it('avisa cuando la descripcion de un estudio no llega al minimo y lo marca como pendiente', () => {
    const fixture = TestBed.createComponent(FormBasicComponent);
    const componente = fixture.componentInstance;
    componente.agregarEstudio();
    componente.formBasic.get('estudios')?.setValue([{
      nombreInstitucion: 'Universidad',
      tituloObtenido: 'Ingeniera',
      fechaInicio: '2010-01-01',
      fechaTitulo: '2015-01-01',
      ciudadEstudio: 'Cali',
      descripcionEstudio: 'Muy corta'
    }]);
    fixture.detectChanges();

    const ayuda: HTMLElement = fixture.nativeElement.querySelector('#ayuda-descripcionEstudio-0');
    expect(ayuda.textContent).toContain('Llevas 9');
    expect(ayuda.classList).toContain('estado-pendiente');
    expect(componente.pasosPendientes()).toContain('Estudios');

    componente.formBasic.get('estudios.0.descripcionEstudio')?.setValue('x'.repeat(40));
    fixture.detectChanges();

    expect(ayuda.classList).not.toContain('estado-pendiente');
    expect(componente.pasosPendientes()).not.toContain('Estudios');

    componente.formBasic.get('estudios.0.descripcionEstudio')?.setValue('x'.repeat(300));
    fixture.detectChanges();

    expect(ayuda.classList).not.toContain('estado-pendiente');
    expect(componente.pasosPendientes()).not.toContain('Estudios');
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
      habilidad.setValue({ habilidad: 'Excel', nivel: '80' });

      componente.eraseForm([], habilidad);
      expect(habilidad.value.habilidad).toBeNull();

      componente.deshacer();
      expect(habilidad.value).toEqual({ habilidad: 'Excel', nivel: '80' });
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
        lista.at(i).setValue({ habilidad: nombre, nivel: '1' });
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
