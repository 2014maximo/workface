import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl, FormArray, AbstractControl } from '@angular/forms';
import { concatMap, filter } from 'rxjs';
import { SweetAlert } from 'src/app/constants/functions.constants';
import { UsuarioModel } from 'src/app/models/usuario.model';
import { AuthService } from 'src/app/services/auth.service';
import { FirebaseService } from 'src/app/services/firebase.service';
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
  public uid?: any;
  public datosGenerales: any;

  constructor(private fb: FormBuilder,
    public webService: WebServicesService,
    private authService: AuthService,
    private database: FirebaseService
    ) {

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
      'webSite': new FormControl('', Validators.required),
      'instagram': new FormControl('', Validators.required),
      'facebook': new FormControl('', Validators.required),
      'twitter': new FormControl('', Validators.required),
      'linkedin': new FormControl('', Validators.required),
      'cargoActual': new FormControl('', Validators.required),
      'acercaDMi': new FormControl('', Validators.required),
      'idiomas': new FormArray([]),
      'debilidades': new FormArray([]),
      'habilidades': new FormArray([]),
      'intereses': new FormArray([]),
      'estudios': new FormArray([]),
      'expLaboral': new FormArray([]),
      'conocimientosAdicionales': new FormArray([]),
      'referenciasPersonales': new FormArray([]),
      'referenciasFamiliares': new FormArray([])

    });

    this.listaTipoIdentificacion = [];
    this.paises = [];
    this.cargarTipoIdentificacion();
    this.inicializarVariables();
  }
  
  inicializarVariables(){
    this.authService.getUserLogged().subscribe( (usuario: any) => {
      if(usuario){
        this.uid = usuario.multiFactor.user.uid;
        this.database.getById('form-basic', usuario.multiFactor.user.uid).then( respuesta => {
          if(respuesta){
            respuesta?.subscribe( (formulario:any) => {
              if(formulario){
                this.datosGenerales = formulario.data();
                this.setFormBasic(formulario.data());
                this.loadFormsArray(this.datosGenerales);
                console.log(this.datosGenerales, 'DATOS GENERALES')
              }
              
            })
          }
        })
      }
    })
  }
  
  ngOnInit(): void {

  }
  
  loadFormsArray(formularios: any){

    formularios.formBasic.intereses.forEach((staff: any, index: number, form: any) => {
      this.agregarInteres();
      (<FormArray>this.formBasic.get('intereses')).at(index).setValue(staff);
    });

    formularios.formBasic.habilidades.forEach((staff: any, index: number, form: any) => {
      this.agregarHabilidad();
      (<FormArray>this.formBasic.get('habilidades')).at(index).setValue(staff);
    });

    formularios.formBasic.debilidades.forEach((staff: any, index: number, form: any) => {
      this.agregarDebilidad();
      (<FormArray>this.formBasic.get('debilidades')).at(index).setValue(staff);
    });

    formularios.formBasic.idiomas.forEach((staff: any, index: number, form: any) => {
      this.agregarIdioma();
      (<FormArray>this.formBasic.get('idiomas')).at(index).setValue(staff);
    });

    formularios.formBasic.estudios.forEach((staff: any, index: number, form: any) => {
      this.agregarEstudio();
      (<FormArray>this.formBasic.get('estudios')).at(index).setValue(staff);
    });

    formularios.formBasic.expLaboral.forEach((staff: any, index: number, form: any) => {
      this.agregarExpLaboral();
      (<FormArray>this.formBasic.get('expLaboral')).at(index).setValue(staff);
    });

    formularios.formBasic.conocimientosAdicionales.forEach((staff: any, index: number, form: any) => {
      this.agregarConocimientos();
      (<FormArray>this.formBasic.get('conocimientosAdicionales')).at(index).setValue(staff);
    });

    formularios.formBasic.referenciasPersonales.forEach((staff: any, index: number, form: any) => {
      this.agregarReferenciaPersonal();
      (<FormArray>this.formBasic.get('referenciasPersonales')).at(index).setValue(staff);
    });

    formularios.formBasic.referenciasFamiliares.forEach((staff: any, index: number, form: any) => {
      this.agregarReferenciaFamiliar();
      (<FormArray>this.formBasic.get('referenciasFamiliares')).at(index).setValue(staff);
    });
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

  agregarInteres(){
    (<FormArray>this.formBasic.controls['intereses']).push(new FormGroup({
      'interes': new FormControl('', Validators.required),
      'nivel': new FormControl('', Validators.required)
    }));
  }

  agregarDebilidad(){
    (<FormArray>this.formBasic.controls['debilidades']).push(new FormGroup({
      'debilidad': new FormControl('', Validators.required),
      'nivelDesconocimiento': new FormControl('', Validators.required)
    }));
  }

  agregarHabilidad(){
    (<FormArray>this.formBasic.controls['habilidades']).push(new FormGroup({
      'habilidad': new FormControl('', Validators.required),
      'nivel': new FormControl('', Validators.required)
    }));
  }

  agregarIdioma(){
    (<FormArray>this.formBasic.controls['idiomas']).push(new FormGroup({
      'idioma': new FormControl('', Validators.required),
      'nivel': new FormControl('', Validators.required)
    }));
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


  setFormBasic(respuesta: any){
    // let form = this.formBasic.get('estudios') as FormArray;
    this.formBasic.patchValue(respuesta.formBasic as FormGroup);
/*     this.formBasic.controls[1].get('estudios')?.setValue(respuesta.formBasic.estudios[1]);
    this.formBasic.controls[0].get('estudios')?.setValue(respuesta.formBasic.estudios[0]); */
    // this.formBasic.setControl('estudios',  new FormControl(respuesta.formBasic.estudios));
    
    /* respuesta.formBasic.esudios.forEach( (staff: any, index: number, form: any  ) => this.formBasic.at(index).get('estudios').setValue(staff)); */
    //  form.patchValue(respuesta.formBasic.estudios[1]);
    // console.log(this.formBasic.controls['estudios'].value, 'COMO QUEDA EL FORMULARIO DESPUES DEL PATCHVALUE');

  }

  public guardar(){
    let usuario:any = {};
    usuario.idUsuario = this.uid? this.uid : '';
    usuario.formBasic = this.formBasic.value;
    usuario.avatar = '';
    usuario.firma = '';


    if(this.datosGenerales){
      this.database.update('form-basic',this.uid, usuario).then( respuesta => {
        SweetAlert('success','FORMULARIO ACTUALIZADO');

      });
    }else{
      this.database.createUid('form-basic', usuario, usuario.idUsuario).then( res =>{
        SweetAlert('success','FORMULARIO GUARDADO');
      }).catch( err => {
        console.error( err);
          SweetAlert('error', 'ERROR GUARDANDO');
      })
    }
  }

}
