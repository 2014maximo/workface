import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ICONO_HABILIDAD_GENERICO } from '../../constants/functions.constants';
import { DetalleArea, HabilidadesService } from '../../services/habilidades.service';
import { SelectorHabilidadComponent } from './selector-habilidad.component';

const FINANZAS: DetalleArea = {
  iconos: { 'tabler:tax': '<svg id="impuestos"></svg>' },
  habilidades: [
    { nombre: 'Impuestos', especialidad: 'Contabilidad', icono: 'tabler:tax' },
    { nombre: 'Nómina', especialidad: 'Personas', icono: 'tabler:tax' }
  ]
};

describe('SelectorHabilidadComponent', () => {
  let fixture: ComponentFixture<SelectorHabilidadComponent>;
  let componente: SelectorHabilidadComponent;
  let servicio: jasmine.SpyObj<HabilidadesService>;
  let modal: jasmine.Spy;
  let jQueryOriginal: any;

  const buscarTexto = async (texto: string) => {
    componente.texto = texto;
    await componente.actualizar();
    fixture.detectChanges();
  };
  const opciones = (): HTMLButtonElement[] => Array.from(fixture.nativeElement.querySelectorAll('.opcion'));

  beforeEach(() => {
    jQueryOriginal = (window as any).$;
    modal = jasmine.createSpy('modal');
    (window as any).$ = () => ({ modal });
    servicio = jasmine.createSpyObj('HabilidadesService', ['obtenerAreas', 'obtenerIndice', 'obtenerArea']);
    servicio.obtenerAreas.and.resolveTo([{ nombre: 'Finanzas', archivo: 'finanzas.json' }]);
    servicio.obtenerIndice.and.resolveTo([{ nombre: 'Impuestos', area: 0 }, { nombre: 'Nómina', area: 0 }]);
    servicio.obtenerArea.and.resolveTo(FINANZAS);

    TestBed.configureTestingModule({
      declarations: [SelectorHabilidadComponent],
      providers: [{ provide: HabilidadesService, useValue: servicio }]
    });
    fixture = TestBed.createComponent(SelectorHabilidadComponent);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => (window as any).$ = jQueryOriginal);

  it('abre sin descargar nada', () => {
    componente.abrir();

    expect(modal).toHaveBeenCalledWith('show');
    expect(servicio.obtenerIndice).not.toHaveBeenCalled();
    expect(servicio.obtenerAreas).not.toHaveBeenCalled();
    expect(servicio.obtenerArea).not.toHaveBeenCalled();
  });

  it('no busca con menos de dos letras', async () => {
    await buscarTexto('i');
    expect(servicio.obtenerIndice).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Escribe al menos 2 letras');
  });

  it('busca sin distinguir tildes ni mayusculas y muestra el area', async () => {
    await buscarTexto('NOMINA');

    expect(opciones().length).toBe(1);
    expect(opciones()[0].textContent).toContain('Nómina');
    expect(opciones()[0].textContent).toContain('Finanzas');
    expect(opciones()[0].querySelector('img')?.getAttribute('src')).toContain('data:image/svg+xml');
  });

  it('avisa si no hay resultados', async () => {
    await buscarTexto('xyz');
    expect(opciones().length).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('No encontramos');
  });

  it('solo pide las areas al cambiar a la busqueda por area y el detalle al elegir una', async () => {
    await componente.cambiarModo('area');
    expect(servicio.obtenerAreas).toHaveBeenCalled();
    expect(servicio.obtenerArea).not.toHaveBeenCalled();

    await componente.elegirArea('finanzas.json');
    fixture.detectChanges();

    expect(servicio.obtenerArea).toHaveBeenCalledWith('finanzas.json');
    expect(opciones().length).toBe(2);
    expect(servicio.obtenerIndice).not.toHaveBeenCalled();
    const titulos = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('.especialidad')).map(t => t.textContent);
    expect(titulos).toEqual(['Contabilidad', 'Personas']);
  });

  it('entrega el nombre y el svg al elegir y cierra', async () => {
    const elegida = jasmine.createSpy('elegida');
    componente.elegida.subscribe(elegida);
    await buscarTexto('impuestos');

    opciones()[0].click();

    expect(elegida).toHaveBeenCalledWith({ nombre: 'Impuestos', icono: '<svg id="impuestos"></svg>' });
    expect(modal).toHaveBeenCalledWith('hide');
  });

  it('permite agregar otra habilidad con el icono generico', () => {
    const elegida = jasmine.createSpy('elegida');
    componente.elegida.subscribe(elegida);
    componente.texto = 'Apicultura';

    componente.mostrarOtra();
    expect(componente.textoOtra).toBe('Apicultura');
    componente.usarOtra();

    expect(elegida).toHaveBeenCalledWith({ nombre: 'Apicultura', icono: ICONO_HABILIDAD_GENERICO });
  });

  it('no acepta otra habilidad vacia', () => {
    const elegida = jasmine.createSpy('elegida');
    componente.elegida.subscribe(elegida);
    componente.textoOtra = '   ';

    componente.usarOtra();

    expect(elegida).not.toHaveBeenCalled();
  });

  it('muestra el error y permite reintentar', async () => {
    servicio.obtenerIndice.and.rejectWith(new Error('sin red'));
    spyOn(console, 'error');
    await buscarTexto('impuestos');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();

    servicio.obtenerIndice.and.resolveTo([{ nombre: 'Impuestos', area: 0 }]);
    fixture.nativeElement.querySelector('[role="alert"] button').click();
    await componente.actualizar();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(opciones().length).toBe(1);
  });

  it('ignora la respuesta de una busqueda anterior', async () => {
    let responder!: (valor: any) => void;
    servicio.obtenerIndice.and.returnValue(new Promise(resolver => responder = resolver));
    componente.texto = 'impuestos';
    const primera = componente.actualizar();

    servicio.obtenerIndice.and.resolveTo([{ nombre: 'Nómina', area: 0 }]);
    await buscarTexto('nomina');
    responder([{ nombre: 'Impuestos', area: 0 }]);
    await primera;
    fixture.detectChanges();

    expect(opciones().map(o => o.textContent)).toEqual([jasmine.stringContaining('Nómina')]);
  });
});
