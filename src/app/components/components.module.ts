import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SliderTemplatesComponent } from './slider-templates/slider-templates.component';
import { SharedModule } from '../shared/shared.module';
import { CarouselModule } from 'ngx-owl-carousel-o';



@NgModule({
  declarations: [
    SliderTemplatesComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    CarouselModule
  ],
  exports: [
    SliderTemplatesComponent
  ]
})
export class ComponentsModule { }
