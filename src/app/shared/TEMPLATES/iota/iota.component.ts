import { Component, Input, OnChanges } from '@angular/core';
import { SweetAlert } from '../../../constants/functions.constants';
import { DocumentoCv, documentoIota, MAXIMO_EMPRESAS_IOTA, nombreArchivoIota } from './iota-documento';
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

  ngOnChanges(): void {
    this.cv = this.contenido ? documentoIota(this.contenido) : undefined;
  }

  public async descargarPdf() {
    if (!this.cv || this.generando) {
      return;
    }
    this.generando = true;
    try {
      const pdf = await crearPdfIota(this.cv, { conFoto: this.conFoto });
      pdf.save(nombreArchivoIota(this.cv.nombre));
    } catch (error) {
      console.error(error);
      SweetAlert('error', 'No se pudo generar el PDF. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      this.generando = false;
    }
  }
}
