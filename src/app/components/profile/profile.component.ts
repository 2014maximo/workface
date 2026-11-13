import { Component, DestroyRef, inject, signal } from '@angular/core';

// En pantallas anchas el perfil muestra al lado la hoja de vida, actualizada mientras se escribe.
// En el celular solo se ve el formulario; las plantillas siguen en la galeria.
const CONSULTA_ESCRITORIO = '(min-width: 1200px)';

@Component({
  standalone: false,
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent {

  public borrador = signal<{ formBasic: any } | null>(null);
  public escritorio = signal(false);

  constructor() {
    const consulta = window.matchMedia(CONSULTA_ESCRITORIO);
    this.escritorio.set(consulta.matches);
    const alCambiar = (evento: MediaQueryListEvent) => this.escritorio.set(evento.matches);
    consulta.addEventListener('change', alCambiar);
    inject(DestroyRef).onDestroy(() => consulta.removeEventListener('change', alCambiar));
  }

  // Sin nombre ni cargo, la hoja todavia no tiene nada que mostrar.
  public tieneDatos(): boolean {
    const datos = this.borrador()?.formBasic;
    return !!(datos?.primerNombre || datos?.primerApellido || datos?.cargoActual);
  }
}
