import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { proveerTraduccionPruebas } from '../i18n/pruebas';
import { SeoService, URL_PUBLICA } from './seo.service';

@Component({ standalone: true, template: '' })
class PaginaVacia {}

describe('SeoService', () => {
  let router: Router;
  let titulo: Title;
  let meta: Meta;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        proveerTraduccionPruebas(),
        provideRouter([
          { path: 'home', component: PaginaVacia, data: { seo: 'inicio', indexable: true } },
          { path: 'profile', component: PaginaVacia, data: { seo: 'perfil' } },
          { path: 'otra', component: PaginaVacia },
        ])
      ]
    });
    await TestBed.inject(TranslateService).use('es').toPromise();
    TestBed.inject(SeoService).iniciar();
    router = TestBed.inject(Router);
    titulo = TestBed.inject(Title);
    meta = TestBed.inject(Meta);
  });

  afterEach(() => document.head.querySelector('link[rel="canonical"]')?.remove());

  const canonico = () => document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  it('el inicio se indexa, con su título, descripción y la raíz como canónica', async () => {
    await router.navigateByUrl('/home');
    expect(titulo.getTitle()).toBe('Workface: crea tu hoja de vida gratis');
    expect(meta.getTag('name="robots"')!.content).toBe('index, follow');
    expect(meta.getTag('name="description"')!.content).toContain('hoja de vida en PDF');
    expect(meta.getTag('property="og:title"')!.content).toBe('Workface: crea tu hoja de vida gratis');
    expect(canonico()!.href).toBe(URL_PUBLICA);
  });

  it('las demás rutas no se indexan ni llevan canónica', async () => {
    await router.navigateByUrl('/home');
    await router.navigateByUrl('/profile');
    expect(titulo.getTitle()).toBe('Mi perfil · Workface');
    expect(meta.getTag('name="robots"')!.content).toBe('noindex, nofollow');
    expect(canonico()).toBeNull();
  });

  it('una ruta sin datos usa el título general', async () => {
    await router.navigateByUrl('/otra');
    expect(titulo.getTitle()).toBe('Workface');
    expect(meta.getTag('name="robots"')!.content).toBe('noindex, nofollow');
  });
});
