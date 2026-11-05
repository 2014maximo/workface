import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface AreaHabilidades {
  nombre: string;
  archivo: string;
}

export interface HabilidadIndice {
  nombre: string;
  area: number;
}

export interface DetalleArea {
  iconos: Record<string, string>;
  habilidades: { nombre: string; especialidad: string; icono: string }[];
}

const CARPETA = 'assets/habilidades/';

@Injectable({
  providedIn: 'root'
})
export class HabilidadesService {

  private cache = new Map<string, Promise<any>>();

  constructor(private http: HttpClient) { }

  obtenerAreas(): Promise<AreaHabilidades[]> {
    return this.cargar('areas.json');
  }

  obtenerIndice(): Promise<HabilidadIndice[]> {
    return this.cargar('indice.json');
  }

  obtenerArea(archivo: string): Promise<DetalleArea> {
    return this.cargar(archivo);
  }

  // Cada archivo se descarga una sola vez; si falla, se puede reintentar.
  private cargar<T>(archivo: string): Promise<T> {
    let pedido = this.cache.get(archivo);
    if (!pedido) {
      pedido = firstValueFrom(this.http.get<T>(CARPETA + archivo));
      pedido.catch(() => this.cache.delete(archivo));
      this.cache.set(archivo, pedido);
    }
    return pedido;
  }
}
