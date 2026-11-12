import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { PerfilLocalService } from '../../services/perfil-local.service';

declare var $: any;

@Component({
  standalone: false,
  selector: 'app-slider-templates',
  templateUrl: './slider-templates.component.html',
  styleUrls: ['./slider-templates.component.css']
})
export class SliderTemplatesComponent implements OnInit {

  public uid?: any;
  public datosGenerales: any;
  public alpha: boolean = false;
  public beta: boolean = false;
  public iota: boolean = false;
  public sinPerfil: boolean = false;

  constructor(private authService: AuthService,
              private perfilLocal: PerfilLocalService) {
                this.inicializarVariables();
              }

  ngOnInit(): void {
    $("#modalLoader").modal('show');

  }

  private inicializarVariables(){
    this.authService.getUserLogged().subscribe((usuario: any) => {
      if (usuario) {
        this.uid = usuario.multiFactor.user.uid;
        this.perfilLocal.obtener(this.uid).then(datos => {
          this.datosGenerales = datos;
          this.sinPerfil = !datos;
          this.alpha = !!datos;
        }).catch(error => {
          console.error(error);
        }).finally(() => {
          $("#modalLoader").modal('hide');
        });
      }
    })
  }

  public cargarAlpha(){
    this.alpha = true;
    this.beta = false;
    this.iota = false;
  }
  public cargarBeta(){
    this.beta = true;
    this.alpha = false;
    this.iota = false;
  }
  public cargarIota(){
    this.iota = true;
    this.alpha = false;
    this.beta = false;
  }

}
