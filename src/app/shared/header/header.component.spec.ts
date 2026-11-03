import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../services/auth.service';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let elemento: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HeaderComponent],
      providers: [
        { provide: AuthService, useValue: { getUserLogged: () => of(null) } },
        { provide: ActivatedRoute, useValue: { snapshot: { url: [] } } },
        { provide: Router, useValue: {} }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    elemento = fixture.nativeElement;
    document.body.appendChild(elemento);
  });

  afterEach(() => elemento.remove());

  const abrir = () => elemento.querySelector<HTMLButtonElement>('header button')!;
  const menu = () => elemento.querySelector<HTMLElement>('nav')!;

  it('el encabezado no se oculta por ancho de pantalla', () => {
    expect(elemento.querySelector('header')!.className).not.toContain('d-none');
  });

  it('el menu abre con un boton real y lleva el foco adentro', fakeAsync(() => {
    expect(abrir().getAttribute('aria-expanded')).toBe('false');

    abrir().click();
    fixture.detectChanges();
    tick();

    expect(abrir().getAttribute('aria-expanded')).toBe('true');
    expect(menu().contains(document.activeElement)).toBeTrue();
  }));

  it('Escape cierra el menu y devuelve el foco al boton', fakeAsync(() => {
    abrir().click();
    fixture.detectChanges();
    tick();

    menu().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    tick();

    expect(menu().classList).not.toContain('sidenav-abierto');
    expect(document.activeElement).toBe(abrir());
  }));
});
