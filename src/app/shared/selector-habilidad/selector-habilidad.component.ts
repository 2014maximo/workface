import { AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { ICONO_HABILIDAD_GENERICO, svgComoImagen } from 'src/app/constants/functions.constants';
import { AreaHabilidades, HabilidadesService } from 'src/app/services/habilidades.service';

declare var $: any;

export interface HabilidadElegida {
  nombre: string;
  icono: string;
}

interface Opcion {
  nombre: string;
  area?: string;
}

interface Grupo {
  titulo?: string;
  opciones: Opcion[];
}

const MINIMO_LETRAS = 2;
const MAXIMO_RESULTADOS = 60;
const ESPERA_AL_ESCRIBIR = 200;
const COLOR_ICONO = '#fff';

const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

@Component({
  standalone: false,
  selector: 'app-selector-habilidad',
  templateUrl: './selector-habilidad.component.html',
  styleUrls: ['./selector-habilidad.component.css']
})
export class SelectorHabilidadComponent implements AfterViewInit, OnDestroy {

  @Output() elegida = new EventEmitter<HabilidadElegida>();
  @Output() cerrado = new EventEmitter<void>();
  @ViewChild('modal') private modal?: ElementRef<HTMLElement>;
  @ViewChild('campoTexto') private campoTexto?: ElementRef<HTMLInputElement>;

  public modo: 'palabra' | 'area' = 'palabra';
  public texto = '';
  public archivoArea = '';
  public areas: AreaHabilidades[] = [];
  public grupos: Grupo[] = [];
  public totalResultados = 0;
  public cargando = false;
  public error = false;
  public otraVisible = false;
  public textoOtra = '';
  public readonly maximoResultados = MAXIMO_RESULTADOS;

  private iconos = new Map<string, { svg: string, imagen: string }>();
  // Descarta las respuestas de una busqueda que ya no es la actual.
  private pedido = 0;
  private temporizador?: ReturnType<typeof setTimeout>;
  private readonly alMostrar = () => {
    // En celular no se abre el teclado hasta que la persona toque el campo.
    if (this.modo === 'palabra' && !window.matchMedia('(pointer: coarse)').matches) {
      this.campoTexto?.nativeElement.focus();
    }
  };
  private readonly alOcultar = () => this.cerrado.emit();

  constructor(private habilidades: HabilidadesService) { }

  ngAfterViewInit(): void {
    this.modal?.nativeElement.addEventListener('shown.bs.modal', this.alMostrar);
    this.modal?.nativeElement.addEventListener('hidden.bs.modal', this.alOcultar);
  }

  ngOnDestroy(): void {
    clearTimeout(this.temporizador);
    this.modal?.nativeElement.removeEventListener('shown.bs.modal', this.alMostrar);
    this.modal?.nativeElement.removeEventListener('hidden.bs.modal', this.alOcultar);
  }

  public abrir(): void {
    this.texto = '';
    this.otraVisible = false;
    this.textoOtra = '';
    this.actualizar();
    $('#modalHabilidad').modal('show');
  }

  public cambiarModo(modo: 'palabra' | 'area'): Promise<void> {
    this.modo = modo;
    return this.actualizar();
  }

  public alEscribir(texto: string): void {
    this.texto = texto;
    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.actualizar(), ESPERA_AL_ESCRIBIR);
  }

  public elegirArea(archivo: string): Promise<void> {
    this.archivoArea = archivo;
    return this.actualizar();
  }

  public actualizar(): Promise<void> {
    clearTimeout(this.temporizador);
    this.grupos = [];
    this.totalResultados = 0;
    this.error = false;
    return this.modo === 'palabra' ? this.buscar() : this.mostrarArea();
  }

  public imagen(nombre: string): string | undefined {
    return this.iconos.get(nombre)?.imagen;
  }

  public elegir(opcion: Opcion): void {
    const icono = this.iconos.get(opcion.nombre);
    if (icono) {
      this.confirmar(opcion.nombre, icono.svg);
    }
  }

  public mostrarOtra(): void {
    this.otraVisible = true;
    this.textoOtra = this.modo === 'palabra' ? this.texto.trim() : '';
  }

  public usarOtra(): void {
    const nombre = this.textoOtra.trim();
    if (nombre) {
      this.confirmar(nombre, ICONO_HABILIDAD_GENERICO);
    }
  }

  public get busquedaCorta(): boolean {
    return this.modo === 'palabra' && this.texto.trim().length < MINIMO_LETRAS;
  }

  public get sinResultados(): boolean {
    return !this.cargando && !this.error && !this.busquedaCorta && this.modo === 'palabra' && !this.totalResultados;
  }

  private confirmar(nombre: string, icono: string): void {
    this.elegida.emit({ nombre, icono });
    $('#modalHabilidad').modal('hide');
  }

  private async buscar(): Promise<void> {
    const pedido = ++this.pedido;
    this.cargando = false;
    const consulta = normalizar(this.texto.trim());
    if (consulta.length < MINIMO_LETRAS) {
      return;
    }

    this.cargando = true;
    try {
      const [areas, indice] = await Promise.all([this.habilidades.obtenerAreas(), this.habilidades.obtenerIndice()]);
      if (pedido !== this.pedido) {
        return;
      }
      this.areas = areas;
      const coincidencias = indice
        .map(habilidad => ({ ...habilidad, clave: normalizar(habilidad.nombre) }))
        .filter(habilidad => habilidad.clave.includes(consulta))
        .sort((a, b) => Number(b.clave.startsWith(consulta)) - Number(a.clave.startsWith(consulta))
          || a.nombre.localeCompare(b.nombre, 'es'));
      const visibles = coincidencias.slice(0, MAXIMO_RESULTADOS);

      this.totalResultados = coincidencias.length;
      if (visibles.length) {
        this.grupos = [{ opciones: visibles.map(({ nombre, area }) => ({ nombre, area: areas[area].nombre })) }];
      }
      const archivos = new Set(visibles.map(habilidad => areas[habilidad.area].archivo));
      await Promise.all([...archivos].map(archivo => this.cargarIconos(archivo)));
    } catch (error) {
      console.error(error);
      if (pedido === this.pedido) {
        this.error = true;
      }
    } finally {
      if (pedido === this.pedido) {
        this.cargando = false;
      }
    }
  }

  private async mostrarArea(): Promise<void> {
    const pedido = ++this.pedido;
    this.cargando = true;
    try {
      this.areas = await this.habilidades.obtenerAreas();
      if (!this.archivoArea) {
        return;
      }
      const area = await this.cargarIconos(this.archivoArea);
      if (pedido !== this.pedido) {
        return;
      }
      const grupos = new Map<string, Opcion[]>();
      area.habilidades.forEach(({ nombre, especialidad }) => {
        grupos.set(especialidad, [...(grupos.get(especialidad) ?? []), { nombre }]);
      });
      this.grupos = [...grupos].map(([titulo, opciones]) => ({ titulo, opciones }));
    } catch (error) {
      console.error(error);
      if (pedido === this.pedido) {
        this.error = true;
      }
    } finally {
      if (pedido === this.pedido) {
        this.cargando = false;
      }
    }
  }

  private async cargarIconos(archivo: string) {
    const area = await this.habilidades.obtenerArea(archivo);
    area.habilidades.forEach(({ nombre, icono }) => {
      if (!this.iconos.has(nombre)) {
        const svg = area.iconos[icono];
        this.iconos.set(nombre, { svg, imagen: svgComoImagen(svg, COLOR_ICONO) });
      }
    });
    return area;
  }
}
