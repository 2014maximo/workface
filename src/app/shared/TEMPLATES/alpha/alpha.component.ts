import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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
  
  name = 'Angular 6';
  public uid?: any;
  public datosGenerales: any;

  @ViewChild('screen') screen?: ElementRef;
  @ViewChild('canvas') canvas?: ElementRef;
  @ViewChild('downloadLink') downloadLink?: ElementRef;

  constructor(private authService: AuthService,
    private database: FirebaseService) {
      
    }

  
    downloadImage(){
      html2canvas(this.screen?.nativeElement).then(canvas => {
        if(this.canvas){
          this.canvas.nativeElement.src = canvas.toDataURL();
        }
        if(this.downloadLink){
          this.downloadLink.nativeElement.href = canvas.toDataURL('image/png');
          this.downloadLink.nativeElement.download = 'marble-diagram.png';
          this.downloadLink.nativeElement.click();
        }
          
      });
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

      const doc = new jsPDF('p', 'pt', 'letter');

      doc.addImage(imgData,0, 0, 400, 720);

      doc.save("image.pdf");
    })
  }

  public guardarImagenTres(){
    var doc = new jsPDF('p','pt', 'letter');
    var margin = 10;
    var scale = (doc.internal.pageSize.width - margin * 2) /
    document.body.scrollWidth;
    doc.html(document.body, {
      x: margin,
      y: margin,
      html2canvas: {
        scale: scale,
      },
      callback: function(doc){
        doc.output('dataurlnewwindow', {filename: 'fichero-pdf.pdf'})
      }
    })
  }
  

}
