import { Provider } from '@angular/core';
import { provideTranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { CargadorTraducciones } from './cargador-traducciones';

/** Traducciones para las pruebas: el español se carga al instante, asi los textos esperados no cambian */
export function proveerTraduccionPruebas(): Provider[] {
  return provideTranslateService({ loader: provideTranslateLoader(CargadorTraducciones), lang: 'es', fallbackLang: 'es' });
}
