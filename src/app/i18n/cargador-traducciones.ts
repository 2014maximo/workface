import { Injectable } from '@angular/core';
import { TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { from, Observable, of } from 'rxjs';
import { ES } from './es';

/** El español va en el bundle principal (sin parpadeo al arrancar);
 *  inglés y francés se descargan solo cuando se eligen. */
const PEREZOSOS: Record<string, () => Promise<TranslationObject>> = {
  en: () => import('./en').then(m => m.EN),
  fr: () => import('./fr').then(m => m.FR),
};

@Injectable()
export class CargadorTraducciones implements TranslateLoader {
  getTranslation(idioma: string): Observable<TranslationObject> {
    const cargar = PEREZOSOS[idioma];
    return cargar ? from(cargar()) : of(ES);
  }
}
