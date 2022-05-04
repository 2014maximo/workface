import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { UsuarioModel } from '../../models/usuario.model';
import { WebServicesService } from '../../services/web-services.service';

@Component({
  selector: 'app-form-basic',
  templateUrl: './form-basic.component.html',
  styleUrls: ['./form-basic.component.css']
})
export class FormBasicComponent implements OnInit {

  public formBasic: FormGroup;
  public listaTipoIdentificacion: any[];
  public paises: any[];

  constructor(private fb: FormBuilder, public webService: WebServicesService) {
    this.formBasic = this.fb.group({
      primerNombre: ['', [Validators.required]],
      segundoNombre: ['', ],
      primerApellido: ['', [Validators.required]],
      segundoApellido: ['', ],
      tipoIdentificacion: ['', [Validators.required]],
      identificacion: ['', [Validators.required]],
      fechaNacimiento: [new Date(), [Validators.required]],
      ciudadNacimiento: ['', [Validators.required]],
      nacionalidad: ['', [Validators.required]],
      direccionResidencia: ['', [Validators.required]],
      barrioResidencia: ['', [Validators.required]],
      genero: ['', [Validators.required]],
      experienciaLaboral: ['', [Validators.required]],
      telFijo: [''],
      email:['', [Validators.required, Validators.pattern(/^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/)]],
    });

    this.listaTipoIdentificacion = [];
    this.paises = [];
    this.cargarTipoIdentificacion();

  }

  ngOnInit(): void {
  }

  cargarTipoIdentificacion(){
    return this.webService.consultarRecursos().subscribe( (datos:any) =>{
      this.listaTipoIdentificacion = datos.tipoDocumento;
      this.paises = datos.paises;
    })
  }

}
