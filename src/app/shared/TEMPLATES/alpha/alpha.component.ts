import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { FirebaseService } from '../../../services/firebase.service';

import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas';

import * as htmlToImage from 'html-to-image';
import * as printJS from 'print-js';

@Component({
  selector: 'app-alpha',
  templateUrl: './alpha.component.html',
  styleUrls: ['./alpha.component.css']
})
export class AlphaComponent implements OnInit {

  public context?: CanvasRenderingContext2D | null;

  public canvas?: ElementRef;
  name = 'Angular 6';
  public uid?: any;
  public datosGenerales: any;
  imagenCreada: any;
  imgcreada = false;
  public avatar: string = '';
  public fondo: string = '';

  @ViewChild('screen') screen?: ElementRef;
  /* @ViewChild('canvas') canvas?: ElementRef; */
  @ViewChild('downloadLink') downloadLink?: ElementRef;
  @ViewChild('canvas') set content(canvas: ElementRef) {
    if (canvas) {
      this.canvas = canvas;
      if (canvas.nativeElement) {
        this.context = (canvas.nativeElement as HTMLCanvasElement).getContext('2d');
        this.draw();
      }
    }
  }

  constructor(private authService: AuthService,
    private database: FirebaseService) {
    this.inicializarVariables();
  }


  downloadImage() {
    html2canvas(this.screen?.nativeElement).then(canvas => {
      if (this.canvas) {
        this.canvas.nativeElement.src = canvas.toDataURL();
      }
      if (this.downloadLink) {
        this.downloadLink.nativeElement.href = canvas.toDataURL('image/png');
        this.downloadLink.nativeElement.download = 'marble-diagram.png';
        this.downloadLink.nativeElement.click();
      }

    });
  }

  ngOnInit(): void {

  }
  inicializarVariables() {

    this.authService.getUserLogged().subscribe((usuario: any) => {
      if (usuario) {
        this.uid = usuario.multiFactor.user.uid;
        this.database.getById('form-basic', usuario.multiFactor.user.uid).then(respuesta => {
          if (respuesta) {
            respuesta?.subscribe((formulario: any) => {
              if (formulario) {
                this.datosGenerales = formulario.data();
                console.log(this.datosGenerales, 'DATOS GENERALES QUE LLEGAN');
                this.fondo = this.datosGenerales.formBasic.imgFondo;
                this.avatar = this.datosGenerales.formBasic.fotoFrontalConFondo;
              }

            })
          }
        })
      }
    })
  }

  public saveToPdf() {
    var element = document.getElementById('alpha');

    html2canvas(element ? element : new HTMLElement).then((canvas) => {
      console.log(canvas);

      var imgData = canvas.toDataURL('image/png');

      const doc = new jsPDF('p', 'pt', 'letter');

      doc.addImage(imgData, 0, 0, 400, 720);

      doc.save("image.pdf");
    })
  }

  public guardarImagenTres() {
    var doc = new jsPDF('p', 'pt', 'letter');
    var margin = 0;
    var scale = (doc.internal.pageSize.width - margin * 2) /
      document.body.scrollWidth;
    doc.html(<HTMLElement>document.querySelector('#alpha'), {
      x: margin,
      y: margin,
      html2canvas: {
        scale: scale,
      },
      callback: function (doc) {
        doc.output('dataurlnewwindow', { filename: 'fichero-pdf.pdf' })
      }
    })
  }

  public guardarImagenCuatro() {

      var element = document.getElementById('alpha');
  
      htmlToImage.toJpeg(element ? element : new HTMLElement, { quality: 1 })
        .then(function (dataUrl) {
          var link = document.createElement('a');
          link.download = 'my-image-name.jpeg';
          link.href = dataUrl;
          link.click();
        });

  }

  public guardarImagenCinco() {
    var element = document.getElementById('alpha');

    htmlToImage.toPng(element ? element : new HTMLElement)
      .then(function (dataUrl) {
        var img = new Image();
        img.src = dataUrl;
        document.body.appendChild(img);
      })
      .catch(function (error) {
        console.error('oops, something went wrong!', error);
      });
  }

  public guardarImagenSeis() {
    html2canvas(<HTMLElement>document.querySelector('alpha')).then(function (dataUrl) {
      var img = new Image();
      img.src = dataUrl.toString();
      document.body.appendChild(img);
    })
      .catch(function (error) {
        console.error('oops, something went wrong!', error);
      })
  }

  public printTable() {

    /**
     * Convent html into image
     *
     * Look at the
     * {@Link https://github.com/niklasvh/html2canvas}
     */
    html2canvas(<HTMLElement>document.querySelector('#alpha')).then(async (canvas: HTMLCanvasElement) => {
      const toImg = canvas.toDataURL();

      /**
       * Print image
       *
       * Look at the
       * {@Link https://github.com/crabbly/print.js}
       */
      printJS({ printable: `${toImg}`, type: 'image', imageStyle: 'width:100%' });
    });
  }

  public printCanvas() {

    /**
     * Convent html into image
     *
     * Look at the
     * {@Link https://github.com/niklasvh/html2canvas}
     */
    html2canvas(<HTMLElement>document.querySelector('#alpha')).then(async (canvas: HTMLCanvasElement) => {
      const toImg = canvas.toDataURL();

      /**
       * Print image
       *
       * Look at the
       * {@Link https://github.com/crabbly/print.js}
       */
      printJS({ printable: `${toImg}`, type: 'image', imageStyle: 'width:30%' });
    });
  }


  private draw() {
    this.context!.font = '30px Arial';
    this.context!.textAlign = 'center';
    this.context!.textBaseline = 'middle';

    const y = (this.canvas!.nativeElement as HTMLCanvasElement).height / 2;
    const x = (this.canvas!.nativeElement as HTMLCanvasElement).width / 2;
    this.context!.fillText('@sezmars', x, y);
  }


}
