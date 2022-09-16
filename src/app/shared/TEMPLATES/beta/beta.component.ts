import { Component, OnInit, Input } from '@angular/core';
import * as htmlToImage from 'html-to-image';


@Component({
  selector: 'app-beta',
  templateUrl: './beta.component.html',
  styleUrls: ['./beta.component.css']
})
export class BetaComponent implements OnInit {

  @Input() contenido: any;

  constructor() { }

  ngOnInit(): void {

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

}
