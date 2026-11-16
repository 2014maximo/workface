import { Component, inject, input } from '@angular/core';
import { IdiomaService } from '../../services/idioma.service';
import { GrupoSitios } from '../models/sitio-trabajo.model';

let siguienteId = 0;

/** Lista de sitios del home (trabajo remoto, freelance). Los datos vienen de zonas-trabajo.constant.ts */
@Component({
  standalone: false,
  selector: 'app-zona-trabajo',
  templateUrl: './zona-trabajo.component.html',
  styleUrls: ['./zona-trabajo.component.css']
})
export class ZonaTrabajoComponent {
  /** Clave de traducción del título de la zona */
  readonly titulo = input.required<string>();
  /** Clave de traducción de la frase bajo el título */
  readonly intro = input.required<string>();
  readonly grupos = input.required<readonly GrupoSitios[]>();

  readonly idioma = inject(IdiomaService).actual;
  readonly idTitulo = `zona-trabajo-${++siguienteId}`;
}
