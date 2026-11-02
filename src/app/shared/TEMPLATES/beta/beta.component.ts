import { Component, OnInit, Input } from '@angular/core';
import { descargarCv } from '../../../constants/functions.constants';
import { INTERESES_GUSTOS } from '../../../constants/workface.contants';


@Component({
  standalone: false,
  selector: 'app-beta',
  templateUrl: './beta.component.html',
  styleUrls: ['./beta.component.css']
})
export class BetaComponent implements OnInit {

  @Input() contenido: any;
  public gustos = INTERESES_GUSTOS;
  public iconosSeleccionados: any[]=[];
  public experienciaLaboral: any[] = [];

  constructor() {
  }
  
  ngOnInit(): void {
    if(this.contenido){
      this.iconosDestacados(this.contenido.formBasic.intereses);
      // Se calcula una sola vez: reverse() en la plantilla cambia el orden en cada refresco.
      this.experienciaLaboral = [...(this.contenido.formBasic.expLaboral ?? [])].reverse();
    }
  }

  public descargarImagen() {
    descargarCv('beta', 'jpeg');
  }

  public descargarPdf() {
    descargarCv('beta', 'pdf');
  }

  public iconosDestacados(datos: any) {
    this.gustos?.forEach( (item, index) =>{
      if(datos?.[index]?.interes){
        this.iconosSeleccionados[index] = item;
      }
    });
    if(this.iconosSeleccionados){
      this.iconosSeleccionados = this.iconosSeleccionados.filter( element => element != null )
    }
  }

}
