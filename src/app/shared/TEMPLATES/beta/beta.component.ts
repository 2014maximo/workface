import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';

import { jsPDF } from "jspdf";
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

}
