import { NO_ERRORS_SCHEMA, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AlphaComponent } from './alpha/alpha.component';
import { BetaComponent } from './beta/beta.component';

const plantillas: [string, Type<any>][] = [['alpha', AlphaComponent], ['beta', BetaComponent]];

plantillas.forEach(([nombre, plantilla]) => {
  describe(`Plantilla ${nombre}: experiencia laboral`, () => {
    const empleo = (cargoEjercido: string) => ({ cargoEjercido, fechaInicioEmpresa: '2020-01-15', fechaFinalEmpresa: '2021-01-15' });
    let expLaboral: any[];
    let fixture: any;

    const orden = () => fixture.nativeElement.textContent.match(/Cargo [ABC]/g);

    beforeEach(() => {
      TestBed.configureTestingModule({ declarations: [plantilla], schemas: [NO_ERRORS_SCHEMA] });
      expLaboral = [empleo('Cargo A'), empleo('Cargo B'), empleo('Cargo C')];
      fixture = TestBed.createComponent(plantilla);
      fixture.componentInstance.contenido = { formBasic: { expLaboral, estudios: [], habilidades: [], intereses: [] } };
    });

    it('muestra primero lo ultimo que se agrego', () => {
      fixture.detectChanges(false);
      expect(orden()).toEqual(['Cargo C', 'Cargo B', 'Cargo A']);
    });

    it('conserva el orden entre refrescos de la vista', () => {
      fixture.detectChanges(false);
      fixture.detectChanges(false);
      expect(orden()).toEqual(['Cargo C', 'Cargo B', 'Cargo A']);
    });

    it('no modifica los datos del perfil', () => {
      fixture.detectChanges(false);
      fixture.detectChanges(false);
      fixture.detectChanges(false);
      expect(expLaboral.map(e => e.cargoEjercido)).toEqual(['Cargo A', 'Cargo B', 'Cargo C']);
    });
  });
});
