import { enableProdMode, provideZoneChangeDetection } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule, {
  // Angular 21 arranca sin Zone.js por defecto; esta app depende de el para refrescar las vistas.
  applicationProviders: [provideZoneChangeDetection()]
})
  .catch(err => console.error(err));
