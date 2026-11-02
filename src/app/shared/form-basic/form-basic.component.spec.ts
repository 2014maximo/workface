import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormArray } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { INTERESES_GUSTOS } from '../../constants/workface.contants';
import { AuthService } from '../../services/auth.service';
import { FirebaseService } from '../../services/firebase.service';
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
        { provide: FirebaseService, useValue: {} },
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

  describe('cierre del modal de carga', () => {
    let modal: jasmine.Spy;

    const iniciar = async (consulta: any) => {
      const instancia = component as any;
      instancia.authService = { getUserLogged: () => of({ multiFactor: { user: { uid: 'u' } } }) };
      instancia.database = { getById: () => Promise.resolve(consulta) };
      component.inicializarVariables();
      await new Promise(resolver => setTimeout(resolver));
    };

    beforeEach(() => {
      modal = jasmine.createSpy('modal');
      (window as any).$ = () => ({ modal });
    });

    afterEach(() => delete (window as any).$);

    it('lo cierra si el usuario nuevo no tiene documento', async () => {
      await iniciar(of({ data: () => undefined }));
      expect(modal).toHaveBeenCalledWith('hide');
      expect(component.datosGenerales).toBeUndefined();
      expect(intereses().length).toBe(total);
    });

    it('lo cierra si falla la consulta', async () => {
      spyOn(console, 'error');
      await iniciar(throwError(() => new Error('sin permisos')));
      expect(modal).toHaveBeenCalledWith('hide');
    });

    it('lo cierra si el servicio devuelve null', async () => {
      await iniciar(null);
      expect(modal).toHaveBeenCalledWith('hide');
    });
  });
});
