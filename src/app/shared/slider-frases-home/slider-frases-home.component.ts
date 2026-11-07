import { Component } from '@angular/core';
import { FRASES, INTERVALO_FRASES } from '../constants/frases.constant';
import { FraseModel } from '../models/frase.model';

@Component({
  standalone: false,
  selector: 'app-slider-frases-home',
  templateUrl: './slider-frases-home.component.html',
  styleUrls: ['./slider-frases-home.component.css']
})
export class SliderFrasesHomeComponent {

  public readonly frases: FraseModel[] = FRASES;
  public readonly intervalo = INTERVALO_FRASES;

}
