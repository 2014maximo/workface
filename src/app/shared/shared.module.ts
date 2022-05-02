import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { SliderFrasesHomeComponent } from './slider-frases-home/slider-frases-home.component';
import { SliderHomeComponent } from './slider-home/slider-home.component';
import { AlphaComponent } from './TEMPLATES/alpha/alpha.component';
import { FormBasicComponent } from './form-basic/form-basic.component';



@NgModule({
  declarations: [
    FooterComponent,
    HeaderComponent,
    SliderFrasesHomeComponent,
    SliderHomeComponent,
    AlphaComponent,
    FormBasicComponent
  ],
  imports: [
    CommonModule
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
