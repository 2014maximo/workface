import { Component, DestroyRef, Input, OnChanges, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { SweetAlert } from '../../../constants/functions.constants';
import { DocumentoCv, documentoIota, MAXIMO_EMPRESAS_IOTA, nombreArchivoIota, TextosIota } from './iota-documento';
import { ComposicionIota, crearPdfIota, HOJA_IOTA, medirIota, MedidaIota } from './iota-pdf';

// Se recuerda entre visitas: quien lo activo para una oferta suele querer seguir igual.
const CLAVE_UNA_PAGINA = 'workface.iota.unaPagina';
// Componer las hojas dibuja el PDF entero (unos 60 ms con un perfil largo): se espera una pausa corta al escribir.
const PAUSA_MEDICION = 150;

// Plantilla pensada para sistemas ATS: una columna, encabezados estandar y un PDF con texto real.
@Component({
  standalone: false,
  selector: 'app-iota',
  templateUrl: './iota.component.html',
  styleUrls: ['./iota.component.css']
})
export class IotaComponent implements OnChanges {

  @Input() contenido: any;
  // Muestra las hojas tal como salen en el PDF, una debajo de otra. Sin esto, la hoja reacomoda el texto
  // para leerse en pantallas angostas, pero no muestra donde se corta.
  @Input() paginada = false;

  public cv?: DocumentoCv;
  // La foto va apagada por defecto: muchos ATS descartan las imagenes.
  public conFoto = false;
  public unaPagina = leerUnaPagina();
  // Hojas del PDF. Vacio mientras se mide la primera vez o si no se pudo medir.
  public medida?: MedidaIota;
  public readonly hoja = HOJA_IOTA;
  public generando = false;
  public maximoEmpresas = MAXIMO_EMPRESAS_IOTA;
  private readonly traductor = inject(TranslateService);
  private temporizador?: ReturnType<typeof setTimeout>;
  // Solo cuenta la ultima medicion: una anterior puede terminar despues.
  private turno = 0;

  constructor() {
    // Los encabezados de la hoja siguen el idioma de la interfaz
    this.traductor.onLangChange.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(() => this.ngOnChanges());
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.temporizador);
      this.turno++;
    });
  }

  ngOnChanges(): void {
    this.cv = this.contenido ? documentoIota(this.contenido, this.textos()) : undefined;
    this.programarMedicion();
  }

  // Las hojas que se ven y se descargan: normales o ajustadas a una.
  public get composicion(): ComposicionIota | undefined {
    return this.unaPagina ? this.medida?.ajustada : this.medida?.normal;
  }

  // Escala de la letra en la vista previa y en el PDF.
  public get escala(): number {
    return this.composicion?.escala ?? 1;
  }

  // Porcentaje en que se redujo la letra, para el aviso.
  public get reduccion(): number {
    return Math.round((1 - this.escala) * 100);
  }

  public cambiarFoto(conFoto: boolean) {
    this.conFoto = conFoto;
    this.programarMedicion();
  }

  public cambiarUnaPagina(unaPagina: boolean) {
    this.unaPagina = unaPagina;
    try { localStorage.setItem(CLAVE_UNA_PAGINA, String(unaPagina)); } catch { /* modo privado: solo dura la sesion */ }
  }

  private programarMedicion() {
    clearTimeout(this.temporizador);
    const turno = ++this.turno;
    if (!this.cv) {
      this.medida = undefined;
      return;
    }
    const cv = this.cv;
    this.temporizador = setTimeout(() => this.medir(cv, turno), PAUSA_MEDICION);
  }

  private async medir(cv: DocumentoCv, turno: number): Promise<MedidaIota | undefined> {
    try {
      const medida = await medirIota(cv, this.conFoto);
      if (turno === this.turno) {
        this.medida = medida;
      }
      return medida;
    } catch (error) {
      // Sin la fuente no se puede medir; la vista previa sigue y el PDF avisara al descargar.
      console.error(error);
      return undefined;
    }
  }

  private textos(): TextosIota {
    const t = (clave: string) => this.traductor.instant('iota.' + clave);
    return {
      idioma: t('idiomaDocumento'),
      titulos: {
        perfil: t('titulos.perfil'),
        experiencia: t('titulos.experiencia'),
        educacion: t('titulos.educacion'),
        cursos: t('titulos.cursos'),
        habilidades: t('titulos.habilidades'),
        idiomas: t('titulos.idiomas'),
      },
      meses: Array.from({ length: 12 }, (_, i) => t('meses.m' + (i + 1))),
      actualidad: t('actualidad'),
      tituloDocumento: t('tituloDocumento'),
      archivo: t('archivo'),
    };
  }

  public async descargarPdf() {
    if (!this.cv || this.generando) {
      return;
    }
    this.generando = true;
    try {
      let escala = 1;
      if (this.unaPagina) {
        // La medicion pudo quedar atras si se descarga justo despues de escribir.
        clearTimeout(this.temporizador);
        const medida = await this.medir(this.cv, ++this.turno);
        escala = medida?.ajustada.escala ?? 1;
      }
      const pdf = await crearPdfIota(this.cv, { conFoto: this.conFoto, escala });
      pdf.save(nombreArchivoIota(this.cv.nombre, this.traductor.instant('iota.archivo')));
    } catch (error) {
      console.error(error);
      SweetAlert('error', this.traductor.instant('iota.errorPdf'));
    } finally {
      this.generando = false;
    }
  }
}

function leerUnaPagina(): boolean {
  try { return localStorage.getItem(CLAVE_UNA_PAGINA) === 'true'; } catch { return false; }
}
