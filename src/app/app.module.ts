import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { HeaderComponent } from './shared/header/header.component';
import { HomeComponent } from './components/home/home.component';
import { FooterComponent } from './shared/footer/footer.component';
import { AlphaComponent } from './shared/TEMPLATES/alpha/alpha.component';
import { SharedModule } from './shared/shared.module';
import { LoginComponent } from './components/login/login.component';
import { RouterModule } from '@angular/router';
import { ROUTES } from './app.routes';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    HomeComponent,
    FooterComponent,
    AlphaComponent,
    LoginComponent
  ],
  imports: [
    BrowserModule,
    SharedModule,
    RouterModule.forRoot (ROUTES),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
