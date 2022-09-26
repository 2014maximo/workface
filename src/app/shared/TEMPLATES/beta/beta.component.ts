import { Component, OnInit, Input } from '@angular/core';
import * as htmlToImage from 'html-to-image';
import { INTERESES_GUSTOS } from '../../../constants/workface.contants';


@Component({
  selector: 'app-beta',
  templateUrl: './beta.component.html',
  styleUrls: ['./beta.component.css']
})
export class BetaComponent implements OnInit {

  @Input() contenido: any;
  public gustos = INTERESES_GUSTOS;
  public iconosSeleccionados: any[]=[];

  constructor() {
  }
  
  ngOnInit(): void {
    if(this.contenido){
      this.iconosDestacados(this.contenido.formBasic.intereses);
    }
  }

  public guardarImagenCuatro() {

    var element = document.getElementById('beta');

    htmlToImage.toJpeg(element ? element : new HTMLElement, { quality: 1 })
      .then(function (dataUrl) {
        var link = document.createElement('a');
        link.download = 'my-image-name.jpeg';
        link.href = dataUrl;
        link.click();
      });

  }
  public iconosDestacados(datos: any) {
    this.gustos?.forEach( (item, index) =>{
      if(datos[index].interes){
        this.iconosSeleccionados[index] = item;
      }
    });
    if(this.iconosSeleccionados){
      this.iconosSeleccionados = this.iconosSeleccionados.filter( element => element != null )
    }
  }

}
