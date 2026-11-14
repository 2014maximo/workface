import { NgModule, inject, provideAppInitializer } from '@angular/core';
import { TranslatePipe, provideTranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';

import { AngularFireModule } from '@angular/fire/compat';
import { environment } from '../environments/environment';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { SharedModule } from './shared/shared.module';
import { RouterModule } from '@angular/router';
import { ROUTES } from './app.routes';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProfileComponent } from './components/profile/profile.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ComponentsModule } from './components/components.module';
import { CargadorTraducciones } from './i18n/cargador-traducciones';
import { IdiomaService } from './services/idioma.service';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    ProfileComponent,
  ],
  imports: [
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    BrowserModule,
    AngularFireModule.initializeApp(environment.firebase, 'workface'),
    RouterModule.forRoot (ROUTES),
    SharedModule,
    ComponentsModule,
    TranslatePipe
  ],
  providers: [
    provideTranslateService({
      loader: provideTranslateLoader(CargadorTraducciones),
      fallbackLang: 'es'
    }),
    provideAppInitializer(() => inject(IdiomaService).iniciar())
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
