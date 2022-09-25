import { Component, OnInit } from '@angular/core';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { AuthService } from '../../services/auth.service';
import { FirebaseService } from '../../services/firebase.service';

declare var $: any;

@Component({
  selector: 'app-slider-templates',
  templateUrl: './slider-templates.component.html',
  styleUrls: ['./slider-templates.component.css']
})
export class SliderTemplatesComponent implements OnInit {

  public uid?: any;
  public datosGenerales: any;
  public alpha: boolean = false;
  public beta: boolean = false;
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

  constructor(private authService: AuthService,
              private database: FirebaseService) {
                this.inicializarVariables();
              }

  ngOnInit(): void {
    $("#modalLoader").modal('show');

  }

  private inicializarVariables(){
    this.authService.getUserLogged().subscribe((usuario: any) => {
      if (usuario) {
        this.uid = usuario.multiFactor.user.uid;
        this.database.getById('form-basic', usuario.multiFactor.user.uid).then(respuesta => {
          if (respuesta) {
            respuesta?.subscribe((formulario: any) => {
              if (formulario) {
                this.datosGenerales = formulario.data();
                this.alpha = true;
                $("#modalLoader").modal('hide');
                console.log(this.datosGenerales, 'LOS DATOS GENERALES');
              }
            })
          }
        })
      }
    })
  }

  public cargarAlpha(){
    this.alpha = true;
    this.beta = false;
  }
  public cargarBeta(){
    this.beta = true;
    this.alpha = false;
  }

}
