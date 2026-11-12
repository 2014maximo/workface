import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { provideRouter, Router, Routes } from '@angular/router';
import { of } from 'rxjs';

import { ROUTES } from './app.routes';

@Component({ template: '' })
class PaginaVaciaComponent {}

describe('Rutas protegidas', () => {
  const protegidas = ROUTES.filter(ruta => ruta.canActivate).map(ruta => ruta.path!);
  // Evita renderizar las paginas reales: aqui solo importa a donde lleva el guard.
  const rutas: Routes = ROUTES.map(ruta => ruta.component ? { ...ruta, component: PaginaVaciaComponent } : ruta);

  const navegar = async (usuario: unknown, ruta: string) => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(rutas),
        { provide: AngularFireAuth, useValue: { user: of(usuario) } }
      ]
    });
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/' + ruta);
    return router.url;
  };

  it('cubre todas las paginas privadas', () => {
    expect(protegidas).toEqual(['profile', 'templates', 'galeria', 'contacto', 'alpha', 'beta', 'iota']);
  });

  protegidas.forEach(ruta => {
    it(`/${ruta} lleva al login si no hay sesion`, async () => {
      expect(await navegar(null, ruta)).toBe('/login');
    });

    it(`/${ruta} abre la pagina si hay sesion`, async () => {
      expect(await navegar({ uid: 'abc' }, ruta)).toBe('/' + ruta);
    });
  });
});
