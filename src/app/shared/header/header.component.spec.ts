import { TranslatePipe } from '@ngx-translate/core';
import { proveerTraduccionPruebas } from '../../i18n/pruebas';
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
      imports: [TranslatePipe],
      providers: [
        proveerTraduccionPruebas(),
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

describe('HeaderComponent con sesión: vista previa del menú', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let elemento: HTMLElement;
  const usuario = { email: 'prueba@workface.test', photoURL: null, multiFactor: { user: { email: 'prueba@workface.test' } } };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HeaderComponent],
      imports: [TranslatePipe],
      providers: [
        proveerTraduccionPruebas(),
        { provide: AuthService, useValue: { getUserLogged: () => of(usuario) } },
        { provide: ActivatedRoute, useValue: { snapshot: { url: [] } } },
        { provide: Router, useValue: {} }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    elemento = fixture.nativeElement;
  });

  const vista = () => elemento.querySelector<HTMLElement>('.vista-previa')!;
  const opcion = (selector: string) => elemento.querySelector<HTMLElement>(selector)!;

  it('es decorativa: queda oculta para lectores de pantalla', () => {
    expect(vista().getAttribute('aria-hidden')).toBe('true');
    expect(vista().hasAttribute('data-vista')).toBeFalse();
  });

  it('muestra el destino de cada opción al pasar el puntero o enfocarla', () => {
    const casos: [string, string][] = [['a[href="profile"]', 'perfil'], ['a[href="galeria"]', 'plantillas'], ['.btn-salir', 'salir']];
    for (const [selector, esperada] of casos) {
      opcion(selector).dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();
      expect(vista().getAttribute('data-vista')).toBe(esperada);
    }
    opcion('a[href="profile"]').dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(vista().getAttribute('data-vista')).toBe('perfil');
  });

  it('al pasar de una opción a otra no se apaga; al salir se oculta tras una pausa', fakeAsync(() => {
    opcion('a[href="profile"]').dispatchEvent(new MouseEvent('mouseenter'));
    opcion('a[href="profile"]').dispatchEvent(new MouseEvent('mouseleave'));
    tick(50);
    opcion('a[href="galeria"]').dispatchEvent(new MouseEvent('mouseenter'));
    tick(200);
    fixture.detectChanges();
    expect(vista().getAttribute('data-vista')).toBe('plantillas');

    opcion('a[href="galeria"]').dispatchEvent(new MouseEvent('mouseleave'));
    tick(200);
    fixture.detectChanges();
    expect(vista().hasAttribute('data-vista')).toBeFalse();
  }));

  it('cerrar el menú limpia la vista previa', fakeAsync(() => {
    opcion('.btn-salir').dispatchEvent(new MouseEvent('mouseenter'));
    fixture.componentInstance.cierreMenu();
    fixture.detectChanges();
    tick();
    expect(vista().hasAttribute('data-vista')).toBeFalse();
  }));
});
