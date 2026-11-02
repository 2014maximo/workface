import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormArray } from '@angular/forms';
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
