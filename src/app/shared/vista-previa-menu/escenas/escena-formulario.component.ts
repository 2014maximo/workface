import { Component } from '@angular/core';

/** Información de CV: miniatura del formulario que se va llenando. Se anima cuando el menú le pone la clase "activa". */
@Component({
  standalone: false,
  selector: 'app-escena-formulario',
  templateUrl: './escena-formulario.component.html',
  styleUrls: ['./escena-formulario.component.css']
})
export class EscenaFormularioComponent {
  /** Los 14 pasos del formulario, para la miniatura de su barra */
  readonly pasos = Array.from({ length: 14 }, (_, i) => i);
}
