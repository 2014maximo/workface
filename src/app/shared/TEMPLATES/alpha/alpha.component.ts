import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { FirebaseService } from '../../../services/firebase.service';

import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-alpha',
  templateUrl: './alpha.component.html',
  styleUrls: ['./alpha.component.css']
})
export class AlphaComponent implements OnInit {

  public uid?: any;
  public datosGenerales: any;

  constructor(private authService: AuthService,
    private database: FirebaseService) {
      
    }

  ngOnInit(): void {
    this.inicializarVariables();
  }
  inicializarVariables() {
    
    this.authService.getUserLogged().subscribe( (usuario: any) => {
      if(usuario){
        this.uid = usuario.multiFactor.user.uid;
        this.database.getById('form-basic', usuario.multiFactor.user.uid).then( respuesta => {
          if(respuesta){
            respuesta?.subscribe( (formulario:any) => {
              if(formulario){
                this.datosGenerales = formulario.data();
                console.log(this.datosGenerales, 'DATOS GENERALES QUE LLEGAN');
              }
              
            })
          }
        })
      }
    })
  }

  public saveToPdf(){
    var element = document.getElementById('alpha');

    html2canvas(element? element: new HTMLElement).then( (canvas) => {
      console.log(canvas);

      var imgData = canvas.toDataURL('image/png');

      const doc = new jsPDF();

      doc.addImage(imgData,0,0,208,500);

      doc.save("image.pdf");
    })
  }

}
