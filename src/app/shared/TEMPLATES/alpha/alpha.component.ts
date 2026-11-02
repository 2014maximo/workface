import { Component, OnInit, Input } from '@angular/core';
import { descargarCv } from 'src/app/constants/functions.constants';
import { INTERESES_GUSTOS } from 'src/app/constants/workface.contants';

@Component({
  standalone: false,
  selector: 'app-alpha',
  templateUrl: './alpha.component.html',
  styleUrls: ['./alpha.component.css']
})
export class AlphaComponent implements OnInit {

  @Input() contenido: any;

  public avatar: string = '';
  public gustos = INTERESES_GUSTOS;
  public iconosSeleccionados: any[]=[];
  public experienciaLaboral: any[] = [];
  public color: string = 'one';

  constructor() {}

  ngOnInit(): void {
    this.inicializarVariables();
  }

  inicializarVariables() {
    if(this.contenido){
      this.avatar = this.contenido.formBasic.fotoFrontalConFondo;
      this.iconosDestacados(this.contenido.formBasic.intereses);
      // Se calcula una sola vez: reverse() en la plantilla cambia el orden en cada refresco.
      this.experienciaLaboral = [...(this.contenido.formBasic.expLaboral ?? [])].reverse();
    }
  }

  public descargarImagen() {
    descargarCv('alpha', 'jpeg');
  }

  public descargarPdf() {
    descargarCv('alpha', 'pdf');
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

  public cambioColor(color: string){
    this.color = color;
  }

}
