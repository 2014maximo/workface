import { Component, input } from '@angular/core';

export type VistaPrevia = 'perfil' | 'plantillas' | 'contacto' | 'salir';

/**
 * Escenas que el menu del header muestra junto a cada opcion: el formulario,
 * una plantilla, un buzon y un muñeco que sale. Decorativo y solo en escritorio.
 */
@Component({
  standalone: false,
  selector: 'app-vista-previa-menu',
  templateUrl: './vista-previa-menu.component.html',
  styleUrls: ['./vista-previa-menu.component.css']
})
export class VistaPreviaMenuComponent {
  /** Escena visible; null la oculta */
  readonly vista = input<VistaPrevia | null>(null);
}
