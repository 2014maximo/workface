import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { SliderFrasesHomeComponent } from './slider-frases-home/slider-frases-home.component';
import { SliderHomeComponent } from './slider-home/slider-home.component';
import { AlphaComponent } from './TEMPLATES/alpha/alpha.component';
import { FormBasicComponent } from './form-basic/form-basic.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BetaComponent } from './TEMPLATES/beta/beta.component';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';






@NgModule({
  declarations: [
    FooterComponent,
    HeaderComponent,
    SliderFrasesHomeComponent,
    SliderHomeComponent,
    AlphaComponent,
    FormBasicComponent,
    BetaComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CarouselModule,
    BrowserAnimationsModule,

  ],
  exports: [
    FooterComponent,
    HeaderComponent,
    SliderFrasesHomeComponent,
    SliderHomeComponent,
    AlphaComponent,
    FormBasicComponent
  ]
})
export class SharedModule { }
