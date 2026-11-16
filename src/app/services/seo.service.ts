import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter, merge } from 'rxjs';
import { Idioma, IdiomaService } from './idioma.service';

/** Dirección pública del sitio en GitHub Pages; es la única página que Google puede indexar */
export const URL_PUBLICA = 'https://2014maximo.github.io/workface/';

/** Datos de SEO de una ruta: data: { seo: 'perfil' } usa las claves seo.perfil.* */
export interface DatosSeo {
  seo: string;
  /** Solo el inicio se indexa: GitHub Pages sirve las demás rutas con código 404 */
  indexable?: boolean;
}

const LOCALES: Record<Idioma, string> = { es: 'es_CO', en: 'en_US', fr: 'fr_FR' };

/** Título, descripción, robots y enlace canónico según la ruta y el idioma */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly router = inject(Router);
  private readonly titulo = inject(Title);
  private readonly meta = inject(Meta);
  private readonly traductor = inject(TranslateService);
  private readonly documento = inject(DOCUMENT);
  private readonly idioma = inject(IdiomaService);

  iniciar(): void {
    merge(
      this.router.events.pipe(filter(evento => evento instanceof NavigationEnd)),
      this.traductor.onLangChange
    ).subscribe(() => this.aplicar());
  }

  aplicar(): void {
    const datos = this.datosDeRuta(this.router.routerState.snapshot.root);
    const clave = datos?.seo ?? 'general';
    const indexable = datos?.indexable === true;
    const titulo = this.traductor.instant(`seo.${clave}.titulo`);
    const descripcion = this.traductor.instant('seo.descripcion');

    this.titulo.setTitle(titulo);
    this.meta.updateTag({ name: 'robots', content: indexable ? 'index, follow' : 'noindex, nofollow' });
    this.meta.updateTag({ name: 'description', content: descripcion });
    this.meta.updateTag({ property: 'og:title', content: titulo });
    this.meta.updateTag({ property: 'og:description', content: descripcion });
    this.meta.updateTag({ property: 'og:locale', content: LOCALES[this.idioma.actual()] });
    this.meta.updateTag({ name: 'twitter:title', content: titulo });
    this.meta.updateTag({ name: 'twitter:description', content: descripcion });
    this.canonico(indexable ? URL_PUBLICA : null);
  }

  // La ruta mas profunda con datos de SEO manda
  private datosDeRuta(ruta: ActivatedRouteSnapshot): DatosSeo | undefined {
    let datos: DatosSeo | undefined;
    for (let actual: ActivatedRouteSnapshot | null = ruta; actual; actual = actual.firstChild) {
      if (actual.data['seo']) {
        datos = actual.data as DatosSeo;
      }
    }
    return datos;
  }

  private canonico(url: string | null): void {
    let enlace = this.documento.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!url) {
      enlace?.remove();
      return;
    }
    if (!enlace) {
      enlace = this.documento.createElement('link');
      enlace.rel = 'canonical';
      this.documento.head.appendChild(enlace);
    }
    enlace.href = url;
  }
}
