import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl, FormArray, AbstractControl } from '@angular/forms';
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

    this.formBasic = new FormGroup({
      'primerNombre': new FormControl('', Validators.required),
      'segundoNombre': new FormControl('', ),
      'primerApellido': new FormControl('', Validators.required),
      'segundoApellido': new FormControl('', ),
      'tipoIdentificacion': new FormControl('', Validators.required),
      'identificacion': new FormControl('', Validators.required),
      'fechaNacimiento': new FormControl(new Date, Validators.required),
      'ciudadNacimiento': new FormControl('', Validators.required),
      'nacionalidad': new FormControl('', Validators.required),
      'direccionResidencia': new FormControl('', Validators.required),
      'barrioResidencia': new FormControl('', Validators.required),
      'genero': new FormControl('', Validators.required),
      'telFijo': new FormControl('', ),
      'telCel': new FormControl('', ),
      'email': new FormControl('', Validators.email),
      'estudios': new FormArray([]),
      'expLaboral': new FormArray([]),
      'conocimientosAdicionales': new FormArray([]),
      'referenciasPersonales': new FormArray([]),
      'referenciasFamiliares': new FormArray([])

    });

    this.agregarEstudio();
    this.agregarExpLaboral();
    this.agregarConocimientos();
    this.agregarReferenciaPersonal();
    this.agregarReferenciaFamiliar();

    this.listaTipoIdentificacion = [];
    this.paises = [];
    this.cargarTipoIdentificacion();
    this.inicializarVariables();
  }
  
  inicializarVariables(){

  }

  ngOnInit(): void {
  }
  
  getControls(formArray: string){
    return (this.formBasic.get(formArray) as FormArray).controls;
  }

  eraseForm(campos: string[], formArray?: AbstractControl){
    if(formArray){
      formArray.reset();
    } else {
      campos.forEach(campo => this.formBasic.get(campo)?.reset());
    }
  }

  deleteControls(formArray: string, index: number){
    (<FormArray>this.formBasic.controls[formArray]).removeAt(index);
  }

  agregarEstudio(){
    (<FormArray>this.formBasic.controls['estudios']).push(new FormGroup({
      'nombreInstitucion': new FormControl('', Validators.required),
      'tituloObtenido': new FormControl('', Validators.required),
      'fechaTitulo': new FormControl(new Date, Validators.required)
    }));
  }

  agregarExpLaboral(){
    (<FormArray>this.formBasic.controls['expLaboral']).push(new FormGroup({
      'nombreEmpresa': new FormControl('', Validators.required),
      'JefeInmediatoEmpresa': new FormControl('', Validators.required),
      'fechaInicioEmpresa': new FormControl(new Date, Validators.required),
      'fechaFinalEmpresa':new FormControl(new Date, Validators.required),
      'telContactoEmpresa': new FormControl('', Validators.required),
    }));
  }
  
  agregarConocimientos(){
    (<FormArray>this.formBasic.controls['conocimientosAdicionales']).push(new FormGroup({
      'nombreConocimiento': new FormControl('', Validators.required),
      'duracion': new FormControl('', Validators.required),
      'fechaFinalizacion': new FormControl(new Date, Validators.required),
    }));

  }

  agregarReferenciaPersonal(){
    (<FormArray>this.formBasic.controls['referenciasPersonales']).push(new FormGroup({
      'nombreCompleto': new FormControl('', Validators.required),
      'ocupacion': new FormControl('', Validators.required),
      'telefono': new FormControl('', Validators.required),
      'empresa': new FormControl('', Validators.required),
    }));

  }

  agregarReferenciaFamiliar(){
    (<FormArray>this.formBasic.controls['referenciasFamiliares']).push(new FormGroup({
      'nombreCompleto': new FormControl('', Validators.required),
      'ocupacion': new FormControl('', Validators.required),
      'telefono': new FormControl('', Validators.required),
      'parentesco': new FormControl('', Validators.required),
      'empresa': new FormControl('', Validators.required)
    }));

  }

  cargarTipoIdentificacion(){
    return this.webService.consultarRecursos().subscribe( (datos:any) =>{
      this.listaTipoIdentificacion = datos.tipoDocumento;
      this.paises = datos.paises;
    })
  }

  estadoForm(){
    console.log(this.formBasic, 'LOS ESTUDIOS')
  }

}
