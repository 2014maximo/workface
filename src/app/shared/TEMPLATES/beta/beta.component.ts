import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';

import { jsPDF } from "jspdf";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

import html2canvas from 'html2canvas';

import * as htmlToImage from 'html-to-image';
import * as printJS from 'print-js';

@Component({
  selector: 'app-beta',
  templateUrl: './beta.component.html',
  styleUrls: ['./beta.component.css']
})
export class BetaComponent implements OnInit {

  public context?: CanvasRenderingContext2D | null;
  public canvas?: ElementRef;
  public img?: string;




  @ViewChild('canvas') set content(canvas: ElementRef) {
    if (canvas) {
      this.canvas = canvas;
      if (canvas.nativeElement) {
          this.context = (canvas.nativeElement as HTMLCanvasElement).getContext('2d');
        // this.draw();
      }
    }
  }

  constructor() { }

  ngOnInit(): void {
    this.img = 'data:image/jpeg;base64,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';
  }

  public printTable() {

    /**
     * Convent html into image
     *
     * Look at the
     * {@Link https://github.com/niklasvh/html2canvas}
     */
    html2canvas(<HTMLElement>document.querySelector('#beta')).then(async (canvas: HTMLCanvasElement) => {
      const toImg = canvas.toDataURL();

      /**
       * Print image
       *
       * Look at the
       * {@Link https://github.com/crabbly/print.js}
       */
      printJS({printable: `${toImg}`, type: 'image', imageStyle: 'width:100%'});
    });
  }

  public guardarImagenTres(){
    var doc = new jsPDF('p','pt', 'letter');
    var margin = 0;
    var scale = (doc.internal.pageSize.width - margin * 2) /
    document.body.scrollWidth;
    doc.html(<HTMLElement>document.querySelector('#beta'), {
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

/*   public getBase64Image(img: any){
     var element = document.getElementById('beta');

     htmlToImage.toJpeg(element ? element : new HTMLElement, { quality: 1 })
        .then(function (dataUrl) {
          var canvas = document.createElement('canvas');

          canvas.width = img.width;
          canvas.height = img.height;
          var ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0);
          var dataURL = canvas.toDataURL("image/png");
          return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
        });
  } */

  public getImageBase(){
    const storage = getStorage();
    const starsRef = ref(storage, 'https://firebasestorage.googleapis.com/v0/b/workface-f8b36.appspot.com/o/frontal-sin-fondo%2Fimg_1656998161620?alt=media&token=3276e3dc-0250-4406-9eaf-468a0f3a1171.jpg');

    getDownloadURL(starsRef)
  .then((url) => {
    // Insert url into an <img> tag to "download"
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

}
