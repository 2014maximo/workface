// CORE
import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';

// USER
import { AuthService } from '../../../services/auth.service';

// FIREBASE
import { FirebaseService } from '../../../services/firebase.service';
import { getStorage, ref, getDownloadURL } from "firebase/storage";

// CREATE PDF or IMAGE
import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas';
import * as htmlToImage from 'html-to-image';
import domtoimage from 'dom-to-image';
import { INTERESES_GUSTOS } from 'src/app/constants/workface.contants';


@Component({
  selector: 'app-alpha',
  templateUrl: './alpha.component.html',
  styleUrls: ['./alpha.component.css']
})
export class AlphaComponent implements OnInit {
  
  @Input() contenido: any;

  public context?: CanvasRenderingContext2D | null;

  public canvas?: ElementRef;
  name = 'Angular 6';
  public uid?: any;
  public datosGenerales: any;
  imagenCreada: any;
  imgcreada = false;
  public avatar: string = '';
  public img: any;
  public wall: any;
  public url: any;
  public gustos = INTERESES_GUSTOS;
  public iconosSeleccionados: any[]=[];
  public color: string = 'one';

  constructor() {}

  ngOnInit(): void {
    this.inicializarVariables();
  }

  inicializarVariables() {
    this.wall = '';
    if(this.contenido){
      this.datosGenerales = Object.assign([], this.contenido) ;
      this.avatar = this.datosGenerales.formBasic.fotoFrontalConFondo;
      this.iconosDestacados(this.datosGenerales.formBasic.intereses);
    }
  }

  toBase64() {
    if (this.url) {
      this.getBase64FomFile(this.url, function (base64: any) {
        console.log(base64)
      });
    }
  }

  getBase64FomFile(img: any, callback: any) {
    let fileReader = new FileReader();
    fileReader.addEventListener('load', function (evt) {
      callback(fileReader.result);
    });
    fileReader.readAsDataURL(img);
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

  public guardarImagenSiete(){
    domtoimage.toJpeg(<Node>document.getElementById('alpha'), { quality: 0.95 })
    .then(function (dataUrl) {
        var link = document.createElement('a');
        link.download = 'my-image-name.jpeg';
        link.href = dataUrl;
        link.click();
    });
  }

  prueba(){
    const storage = getStorage();
    const starsRef = ref(storage, 'frontal-con-fondo/img_1657769238874.jpg');

    getDownloadURL(starsRef)
  .then((url) => {
    console.log(url, 'LO QUE ESTA DEVOLVIENDO LO DEL CORS');
  })
  .catch((error) => {
    // A full list of error codes is available at
    // https://firebase.google.com/docs/storage/web/handle-errors
    switch (error.code) {
      case 'storage/object-not-found':
        // File doesn't exist
        break;
      case 'storage/unauthorized':
        // User doesn't have permission to access the object
        break;
      case 'storage/canceled':
        // User canceled the upload
        break;

      // ...

      case 'storage/unknown':
        // Unknown error occurred, inspect the server response
        break;
    }
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

  public cambioColor(color: string){
    this.color = color;
  }

}
