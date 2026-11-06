import { Injectable } from '@angular/core';
import { ICONO_HABILIDAD_GENERICO } from 'src/app/constants/functions.constants';
import { HabilidadesService } from '../habilidades.service';
import { cruzarHabilidades } from './cruzar-habilidades';
import { DatosCv, ReferenciaDetectada, combinarLecturas } from './interpretar-cv';
import { leerArchivo } from './leer-archivo';

export type OrigenHabilidad = 'seccion' | 'otra' | 'mencion';

export interface HabilidadPropuesta {
  nombre: string;
  // SVG del catalogo, o el generico si la habilidad no esta en el.
  icono: string;
  origen: OrigenHabilidad;
}

export interface ImportacionCv {
  datos: DatosCv;
  habilidades: HabilidadPropuesta[];
  referencias: ReferenciaDetectada[];
  bloquesEstudios: string[];
  bloquesExperiencia: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ImportarCvService {

  constructor(private habilidades: HabilidadesService) { }

  async analizar(archivo: File): Promise<ImportacionCv> {
    const resultado = combinarLecturas(await leerArchivo(archivo));
    return {
      datos: resultado.datos,
      habilidades: await this.proponerHabilidades(resultado.habilidades, resultado.texto),
      referencias: resultado.referencias,
      bloquesEstudios: resultado.bloquesEstudios,
      bloquesExperiencia: resultado.bloquesExperiencia,
    };
  }

  // Sin el catalogo se siguen proponiendo las habilidades, con el icono generico.
  private async proponerHabilidades(piezas: string[], texto: string): Promise<HabilidadPropuesta[]> {
    try {
      const [areas, indice] = await Promise.all([this.habilidades.obtenerAreas(), this.habilidades.obtenerIndice()]);
      const cruce = cruzarHabilidades(piezas, texto, indice.map(h => h.nombre));
      const elegidas = [...cruce.enCatalogo, ...cruce.mencionadas];
      const archivos = new Set(elegidas.map(nombre => areas[indice.find(h => h.nombre === nombre)!.area].archivo));
      const iconos = new Map<string, string>();
      for (const area of await Promise.all([...archivos].map(archivo => this.habilidades.obtenerArea(archivo)))) {
        area.habilidades.forEach(({ nombre, icono }) => {
          if (!iconos.has(nombre)) {
            iconos.set(nombre, area.iconos[icono]);
          }
        });
      }
      const icono = (nombre: string) => iconos.get(nombre) ?? ICONO_HABILIDAD_GENERICO;
      return [
        ...cruce.enCatalogo.map(nombre => ({ nombre, icono: icono(nombre), origen: 'seccion' as const })),
        ...cruce.otras.map(nombre => ({ nombre, icono: ICONO_HABILIDAD_GENERICO, origen: 'otra' as const })),
        ...cruce.mencionadas.map(nombre => ({ nombre, icono: icono(nombre), origen: 'mencion' as const })),
      ];
    } catch (error) {
      console.error(error);
      return piezas.slice(0, 30).map(nombre => ({ nombre, icono: ICONO_HABILIDAD_GENERICO, origen: 'otra' as const }));
    }
  }
}
