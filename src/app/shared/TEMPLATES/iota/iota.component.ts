import { Component, DestroyRef, Input, OnChanges, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { SweetAlert } from '../../../constants/functions.constants';
import { DocumentoCv, documentoIota, MAXIMO_EMPRESAS_IOTA, nombreArchivoIota, TextosIota } from './iota-documento';
import { crearPdfIota } from './iota-pdf';

// Plantilla pensada para sistemas ATS: una columna, encabezados estandar y un PDF con texto real.
@Component({
  standalone: false,
  selector: 'app-iota',
  templateUrl: './iota.component.html',
  styleUrls: ['./iota.component.css']
})
export class IotaComponent implements OnChanges {

  @Input() contenido: any;

  public cv?: DocumentoCv;
  // La foto va apagada por defecto: muchos ATS descartan las imagenes.
  public conFoto = false;
  public generando = false;
  public maximoEmpresas = MAXIMO_EMPRESAS_IOTA;
  private readonly traductor = inject(TranslateService);

  constructor() {
    // Los encabezados de la hoja siguen el idioma de la interfaz
    this.traductor.onLangChange.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(() => this.ngOnChanges());
  }

  ngOnChanges(): void {
    this.cv = this.contenido ? documentoIota(this.contenido, this.textos()) : undefined;
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
      const pdf = await crearPdfIota(this.cv, { conFoto: this.conFoto });
      pdf.save(nombreArchivoIota(this.cv.nombre, this.traductor.instant('iota.archivo')));
    } catch (error) {
      console.error(error);
      SweetAlert('error', this.traductor.instant('iota.errorPdf'));
    } finally {
      this.generando = false;
    }
  }
}
