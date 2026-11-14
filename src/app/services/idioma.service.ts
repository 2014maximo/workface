import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type Idioma = 'es' | 'en' | 'fr';

export interface OpcionIdioma {
  codigo: Idioma;
  /** Nombre del idioma escrito en ese mismo idioma */
  nombre: string;
}

export const IDIOMAS: readonly OpcionIdioma[] = [
  { codigo: 'es', nombre: 'Español' },
  { codigo: 'en', nombre: 'English' },
  { codigo: 'fr', nombre: 'Français' },
];

const CLAVE_GUARDADA = 'workface.idioma';

@Injectable({ providedIn: 'root' })
export class IdiomaService {
  private readonly traductor = inject(TranslateService);
  private readonly documento = inject(DOCUMENT);

  readonly actual = signal<Idioma>('es');

  /** Idioma guardado, si no el del navegador, y si no español */
  iniciar(): void {
    this.usar(this.guardado() ?? this.delNavegador() ?? 'es', false);
  }

  usar(idioma: Idioma, recordar = true): void {
    this.actual.set(idioma);
    this.documento.documentElement.lang = idioma;
    this.traductor.use(idioma);
    if (recordar) {
      try { localStorage.setItem(CLAVE_GUARDADA, idioma); } catch { /* modo privado: solo dura la sesion */ }
    }
  }

  private guardado(): Idioma | null {
    try { return this.valido(localStorage.getItem(CLAVE_GUARDADA)); } catch { return null; }
  }

  private delNavegador(): Idioma | null {
    for (const preferido of navigator.languages ?? [navigator.language]) {
      const idioma = this.valido(preferido?.slice(0, 2).toLowerCase());
      if (idioma) return idioma;
    }
    return null;
  }

  private valido(codigo: string | null | undefined): Idioma | null {
    return IDIOMAS.some(i => i.codigo === codigo) ? codigo as Idioma : null;
  }
}
