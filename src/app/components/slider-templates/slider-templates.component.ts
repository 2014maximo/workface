import { Component, OnInit } from '@angular/core';
import { OwlOptions } from 'ngx-owl-carousel-o';

@Component({
  selector: 'app-slider-templates',
  templateUrl: './slider-templates.component.html',
  styleUrls: ['./slider-templates.component.css']
})
export class SliderTemplatesComponent implements OnInit {

  public alpha: boolean = true;
  public templates: any[] = [
    {
      ruta: 'alpha',
      imagen: 'assets/img/slider-templates/example.png'
    },
    {
      ruta: 'beta',
      imagen: 'assets/img/slider-templates/example.png'
    },
    {
      ruta: 'beta',
      imagen: 'assets/img/slider-templates/example.png'
    },
    {
      ruta: 'beta',
      imagen: 'assets/img/slider-templates/example.png'
    },
    {
      ruta: 'beta',
      imagen: 'assets/img/slider-templates/example.png'
    },
    {
      ruta: 'beta',
      imagen: 'assets/img/slider-templates/example.png'
    },
  ];

  constructor() { }

  ngOnInit(): void {
  }

  customOptions: OwlOptions = {
    loop: true,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: true,
    dots: false,
    navSpeed: 700,
    navText: ['', ''],
    responsive: {
      0: {
        items: 2
      },
      400: {
        items: 2
      },
      740: {
        items: 2
      },
      940: {
        items: 2
      }
    },
    autoplay: true,
    autoplaySpeed: 2800,
    autoplayTimeout: 20000,
    nav: true
  }

}
