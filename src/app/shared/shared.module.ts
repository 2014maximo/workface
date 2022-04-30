import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SliderHomeComponent } from './slider-home/slider-home.component';
import { SliderFrasesHomeComponent } from './slider-frases-home/slider-frases-home.component';



@NgModule({
  declarations: [
    SliderHomeComponent,
    SliderFrasesHomeComponent,
  ],
  imports: [
    CommonModule
  ],
  exports: [
    SliderHomeComponent,
    SliderFrasesHomeComponent,
  ]
})
export class SharedModule { }
