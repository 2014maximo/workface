import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ComponentsModule } from './components/components.module';
import { ROUTES } from './app.routes';
import { RouterModule } from '@angular/router';
import { FormOneComponent } from './components/ASK/form-one/form-one.component';


@NgModule({
  declarations: [
    AppComponent,
    FormOneComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ComponentsModule,
    RouterModule.forRoot (ROUTES)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
