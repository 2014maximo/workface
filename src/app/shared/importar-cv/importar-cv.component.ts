import { AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { svgComoImagen } from 'src/app/constants/functions.constants';
import { HabilidadPropuesta, ImportacionCv, ImportarCvService, OrigenHabilidad } from 'src/app/services/importar-cv/importar-cv.service';
import { DatosCv, ReferenciaDetectada } from 'src/app/services/importar-cv/interpretar-cv';
import { ErrorImportacion, MotivoError } from 'src/app/services/importar-cv/leer-archivo';

declare var $: any;

export interface SeleccionImportacion {
  campos: Partial<DatosCv>;
  habilidades: HabilidadPropuesta[];
  referencias: ReferenciaDetectada[];
  bloquesEstudios: string[];
  bloquesExperiencia: string[];
}

export interface ValoresActuales {
  campos: Partial<Record<keyof DatosCv, string>>;
  habilidades: string[];
}

interface CampoRevision {
  campo: keyof DatosCv;
  etiqueta: string;
  valor: string;
  actual: string;
  marcado: boolean;
  multilinea?: boolean;
  tipo?: string;
}

interface HabilidadRevision extends HabilidadPropuesta {
  marcada: boolean;
  repetida: boolean;
  imagen: string;
}

interface ReferenciaRevision extends ReferenciaDetectada {
  marcada: boolean;
}

const GRUPOS_CAMPOS: { titulo: string, campos: [keyof DatosCv, string, string?][] }[] = [
  {
    titulo: 'Datos personales',
    campos: [
      ['primerNombre', 'Primer nombre'], ['segundoNombre', 'Segundo nombre'],
      ['primerApellido', 'Primer apellido'], ['segundoApellido', 'Segundo apellido'],
      ['identificacion', 'Identificación'], ['fechaNacimiento', 'Fecha de nacimiento', 'date'],
      ['ciudadNacimiento', 'Lugar de nacimiento'],
    ]
  },
  {
    titulo: 'Contacto y redes',
    campos: [
      ['direccionResidencia', 'Dirección residencia'], ['barrioResidencia', 'Barrio residencia'],
      ['telFijo', 'Número fijo', 'tel'], ['telCel', 'Número móvil', 'tel'], ['email', 'Email', 'email'],
      ['webSite', 'Sitio web', 'url'], ['linkedin', 'LinkedIn', 'url'],
    ]
  },
  {
    titulo: 'Cargo',
    campos: [['cargoActual', 'Cargo actual'], ['acercaDMi', 'Acerca de mí', 'textarea']]
  },
];

const MENSAJES_ERROR: Record<MotivoError, string> = {
  formato: 'Ese formato no se puede leer. Usa un PDF o un Word .docx; si tu archivo es .doc u .odt, guárdalo como PDF desde tu editor.',
  tamano: 'El archivo pesa más de 10 MB. Prueba con una versión más liviana de tu hoja de vida.',
  protegido: 'El PDF tiene contraseña. Quítala o guarda una copia sin protección e inténtalo de nuevo.',
  sinTexto: 'No encontramos texto en el archivo. Parece una hoja de vida escaneada o hecha como imagen: llena tus datos a mano o usa un PDF exportado desde tu editor.',
  lectura: 'No pudimos leer el archivo. Puede estar dañado; prueba abrirlo y guardarlo de nuevo como PDF.',
};

const ORDEN_ORIGEN: OrigenHabilidad[] = ['seccion', 'otra', 'mencion'];
const TITULOS_ORIGEN: Record<OrigenHabilidad, string> = {
  seccion: 'De tu sección de habilidades',
  otra: 'No están en el catálogo: llevarán un icono genérico',
  mencion: 'Aparecen en otras partes del texto',
};

@Component({
  standalone: false,
  selector: 'app-importar-cv',
  templateUrl: './importar-cv.component.html',
  styleUrls: ['./importar-cv.component.css']
})
export class ImportarCvComponent implements AfterViewInit, OnDestroy {

  @Output() aplicar = new EventEmitter<SeleccionImportacion>();
  @Output() cerrado = new EventEmitter<void>();
  @ViewChild('modal') private modal?: ElementRef<HTMLElement>;
  @ViewChild('campoArchivo') private campoArchivo?: ElementRef<HTMLInputElement>;
  @ViewChild('tituloRevision') private tituloRevision?: ElementRef<HTMLElement>;

  public estado: 'elegir' | 'leyendo' | 'error' | 'revision' = 'elegir';
  public mensajeError = '';
  public nombreArchivo = '';
  public arrastrando = false;
  public grupos: { titulo: string, campos: CampoRevision[] }[] = [];
  public habilidades: { origen: OrigenHabilidad, titulo: string, lista: HabilidadRevision[] }[] = [];
  public referencias: ReferenciaRevision[] = [];
  public bloquesEstudios: string[] = [];
  public bloquesExperiencia: string[] = [];

  private actuales: ValoresActuales = { campos: {}, habilidades: [] };
  // Si se cierra el modal mientras se lee, la respuesta ya no se muestra.
  private lectura = 0;
  private readonly alOcultar = () => {
    this.lectura++;
    this.cerrado.emit();
  };

  constructor(private importador: ImportarCvService) { }

  ngAfterViewInit(): void {
    this.modal?.nativeElement.addEventListener('hidden.bs.modal', this.alOcultar);
  }

  ngOnDestroy(): void {
    this.modal?.nativeElement.removeEventListener('hidden.bs.modal', this.alOcultar);
  }

  public abrir(actuales: ValoresActuales): void {
    this.actuales = actuales;
    this.reiniciar();
    $('#modalImportarCv').modal('show');
  }

  public reiniciar(): void {
    this.estado = 'elegir';
    this.mensajeError = '';
    this.nombreArchivo = '';
    this.arrastrando = false;
  }

  public alElegir(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const archivo = campo.files?.[0];
    // Permite volver a elegir el mismo archivo despues de un error.
    campo.value = '';
    if (archivo) {
      this.leer(archivo);
    }
  }

  public alArrastrar(evento: DragEvent, encima: boolean): void {
    evento.preventDefault();
    this.arrastrando = encima;
  }

  public alSoltar(evento: DragEvent): void {
    evento.preventDefault();
    this.arrastrando = false;
    const archivo = evento.dataTransfer?.files?.[0];
    if (archivo) {
      this.leer(archivo);
    }
  }

  public elegirOtro(): void {
    this.reiniciar();
    setTimeout(() => this.campoArchivo?.nativeElement.focus());
  }

  public get totalMarcados(): number {
    return this.grupos.flatMap(g => g.campos).filter(c => c.marcado && c.valor.trim()).length
      + this.habilidades.flatMap(g => g.lista).filter(h => h.marcada).length
      + this.referencias.filter(r => r.marcada).length;
  }

  public get hayAlgo(): boolean {
    return this.grupos.length > 0 || this.habilidades.length > 0 || this.referencias.length > 0
      || this.bloquesEstudios.length > 0 || this.bloquesExperiencia.length > 0;
  }

  public get hayBloques(): boolean {
    return this.bloquesEstudios.length > 0 || this.bloquesExperiencia.length > 0;
  }

  public confirmar(): void {
    const campos: Partial<DatosCv> = {};
    this.grupos.flatMap(g => g.campos).filter(c => c.marcado && c.valor.trim())
      .forEach(c => campos[c.campo] = c.valor.trim());
    this.aplicar.emit({
      campos,
      habilidades: this.habilidades.flatMap(g => g.lista).filter(h => h.marcada)
        .map(({ nombre, icono, origen }) => ({ nombre, icono, origen })),
      referencias: this.referencias.filter(r => r.marcada).map(({ marcada, ...referencia }) => referencia),
      bloquesEstudios: this.bloquesEstudios,
      bloquesExperiencia: this.bloquesExperiencia,
    });
    $('#modalImportarCv').modal('hide');
  }

  public marcarHabilidades(lista: HabilidadRevision[], marcar: boolean): void {
    lista.filter(h => !h.repetida).forEach(h => h.marcada = marcar);
  }

  public todasMarcadas(lista: HabilidadRevision[]): boolean {
    return lista.filter(h => !h.repetida).every(h => h.marcada);
  }

  private async leer(archivo: File): Promise<void> {
    const lectura = ++this.lectura;
    this.nombreArchivo = archivo.name;
    this.estado = 'leyendo';
    try {
      const resultado = await this.importador.analizar(archivo);
      if (lectura !== this.lectura) {
        return;
      }
      this.preparar(resultado);
      this.estado = 'revision';
      setTimeout(() => this.tituloRevision?.nativeElement.focus());
    } catch (error) {
      if (lectura !== this.lectura) {
        return;
      }
      if (!(error instanceof ErrorImportacion)) {
        console.error(error);
      }
      this.mensajeError = MENSAJES_ERROR[error instanceof ErrorImportacion ? error.motivo : 'lectura'];
      this.estado = 'error';
    }
  }

  private preparar(resultado: ImportacionCv): void {
    const iguales = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
    this.grupos = GRUPOS_CAMPOS.map(({ titulo, campos }) => ({
      titulo,
      campos: campos
        .map(([campo, etiqueta, tipo]) => {
          const valor = resultado.datos[campo] ?? '';
          const actual = String(this.actuales.campos[campo] ?? '').trim();
          // Lo ya escrito no se reemplaza a menos que la persona lo marque.
          return { campo, etiqueta, valor, actual: iguales(actual, valor) ? '' : actual, marcado: !actual,
            multilinea: tipo === 'textarea', tipo: tipo === 'textarea' ? undefined : tipo ?? 'text' };
        })
        .filter(c => c.valor && !(c.actual === '' && iguales(String(this.actuales.campos[c.campo] ?? ''), c.valor)))
    })).filter(g => g.campos.length);

    const existentes = this.actuales.habilidades.map(h => h.trim().toLowerCase());
    this.habilidades = ORDEN_ORIGEN.map(origen => ({
      origen,
      titulo: TITULOS_ORIGEN[origen],
      lista: resultado.habilidades.filter(h => h.origen === origen).map(h => {
        const repetida = existentes.includes(h.nombre.toLowerCase());
        return { ...h, repetida, marcada: origen === 'seccion' && !repetida, imagen: svgComoImagen(h.icono, '#fff') };
      })
    })).filter(g => g.lista.length);

    this.referencias = resultado.referencias.map(r => ({ ...r, marcada: true }));
    this.bloquesEstudios = resultado.bloquesEstudios;
    this.bloquesExperiencia = resultado.bloquesExperiencia;
  }
}
