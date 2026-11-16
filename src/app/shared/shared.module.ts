import { NgModule } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { SliderFrasesHomeComponent } from './slider-frases-home/slider-frases-home.component';
import { SliderHomeComponent } from './slider-home/slider-home.component';
import { FormBasicComponent } from './form-basic/form-basic.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IotaComponent } from './TEMPLATES/iota/iota.component';
import { CurriculumsComponent } from './components/curriculus/curriculums.component';
import { CarruselDirective } from './carrusel.directive';
import { SelectorHabilidadComponent } from './selector-habilidad/selector-habilidad.component';
import { ImportarCvComponent } from './importar-cv/importar-cv.component';
import { ZonaTrabajoComponent } from './zona-trabajo/zona-trabajo.component';






@NgModule({
  declarations: [
    FooterComponent,
    HeaderComponent,
    SliderFrasesHomeComponent,
    SliderHomeComponent,
    FormBasicComponent,
    IotaComponent,
    CurriculumsComponent,
    CarruselDirective,
    SelectorHabilidadComponent,
    ImportarCvComponent,
    ZonaTrabajoComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  exports: [
    TranslatePipe,
    FooterComponent,
    HeaderComponent,
    SliderFrasesHomeComponent,
    SliderHomeComponent,
    IotaComponent,
    FormBasicComponent,
    ZonaTrabajoComponent
  ]
})
export class SharedModule { }
