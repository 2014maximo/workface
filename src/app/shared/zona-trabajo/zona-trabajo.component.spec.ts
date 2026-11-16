import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslatePipe } from '@ngx-translate/core';
import { proveerTraduccionPruebas } from '../../i18n/pruebas';
import { IdiomaService } from '../../services/idioma.service';
import { BOLSAS_REMOTAS, EMPRESAS_REMOTAS, PLATAFORMAS_FREELANCE } from '../constants/zonas-trabajo.constant';
import { ZonaTrabajoComponent } from './zona-trabajo.component';

describe('ZonaTrabajoComponent', () => {
  let fixture: ComponentFixture<ZonaTrabajoComponent>;
  let elemento: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ZonaTrabajoComponent],
      imports: [TranslatePipe],
      providers: [proveerTraduccionPruebas()]
    }).compileComponents();
    fixture = TestBed.createComponent(ZonaTrabajoComponent);
    fixture.componentRef.setInput('titulo', 'zonas.remotoTitulo');
    fixture.componentRef.setInput('intro', 'zonas.remotoIntro');
    fixture.componentRef.setInput('grupos', [
      { titulo: 'zonas.bolsas', sitios: BOLSAS_REMOTAS },
      { titulo: 'zonas.empresas', sitios: EMPRESAS_REMOTAS },
    ]);
    fixture.detectChanges();
    elemento = fixture.nativeElement;
  });

  it('es una sección con su título como nombre', () => {
    const seccion = elemento.querySelector('section')!;
    const titulo = elemento.querySelector('h2')!;
    expect(titulo.textContent).toContain('ZONA DE TRABAJO REMOTO');
    expect(seccion.getAttribute('aria-labelledby')).toBe(titulo.id);
    expect(Array.from(elemento.querySelectorAll('h3')).map(h => h.textContent!.trim())).toEqual(['Bolsas de empleo', 'Empresas 100 % remotas']);
  });

  it('muestra una fila por sitio, que abre en otra pestaña y lo avisa', () => {
    const enlaces = elemento.querySelectorAll<HTMLAnchorElement>('a.sitio');
    expect(enlaces.length).toBe(BOLSAS_REMOTAS.length + EMPRESAS_REMOTAS.length);
    const primero = enlaces[0];
    expect(primero.getAttribute('href')).toBe(BOLSAS_REMOTAS[0].url);
    expect(primero.target).toBe('_blank');
    expect(primero.rel).toBe('noopener noreferrer');
    expect(primero.textContent).toContain(BOLSAS_REMOTAS[0].descripcion.es);
    expect(primero.textContent).toContain('Latinoamérica');
    expect(primero.querySelector('.visually-hidden')!.textContent).toContain('pestaña nueva');
  });

  it('la descripción sigue el idioma de la interfaz', () => {
    TestBed.inject(IdiomaService).actual.set('fr');
    fixture.detectChanges();
    expect(elemento.querySelector('.sitio-descripcion')!.textContent).toBe(BOLSAS_REMOTAS[0].descripcion.fr);
  });
});

describe('Sitios de las zonas de trabajo', () => {
  const todos = [...BOLSAS_REMOTAS, ...EMPRESAS_REMOTAS, ...PLATAFORMAS_FREELANCE];

  it('tienen enlaces https sin parámetros de seguimiento', () => {
    for (const sitio of todos) {
      const url = new URL(sitio.url);
      expect(url.protocol).withContext(sitio.nombre).toBe('https:');
      expect(url.search).withContext(sitio.nombre).toBe('');
      expect(url.hash).withContext(sitio.nombre).toBe('');
    }
  });

  it('no se repiten y cada uno tiene descripción en los tres idiomas', () => {
    expect(new Set(todos.map(s => s.url)).size).toBe(todos.length);
    for (const sitio of todos) {
      expect(sitio.nombre.trim()).withContext(sitio.url).not.toBe('');
      for (const texto of Object.values(sitio.descripcion)) {
        expect(texto.trim()).withContext(sitio.nombre).not.toBe('');
      }
    }
  });
});
