import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl, FormArray, AbstractControl } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { SweetAlert } from 'src/app/constants/functions.constants';
import { AuthService } from 'src/app/services/auth.service';
import { FirebaseService } from 'src/app/services/firebase.service';
import { WebServicesService } from '../../services/web-services.service';

import Swal from 'sweetalert2';
import { INTERESES_GUSTOS } from '../../constants/workface.contants';

declare var $: any;

@Component({
  selector: 'app-form-basic',
  templateUrl: './form-basic.component.html',
  styleUrls: ['./form-basic.component.css']
})
export class FormBasicComponent implements OnInit {

  public base64: string = '';
  public fileSelected?: Blob;
  public formBasic: FormGroup;
  public listaTipoIdentificacion: any[];
  public paises: any[];
  public uid?: any;
  public datosGenerales: any;
  public imageUrl?: string;
  public fotoFrontalSinFondo: any[]=[];
  public fotoFrontalConFondo: any[]=[];
  public imgFirma: any[]=[];
  public imgFondo: any[]=[];
  public objImagenes: any[]=[];
  public cerrarLoader: boolean = false;
  public gustos: Array<any> = INTERESES_GUSTOS;

  constructor(private fb: FormBuilder,
    public webService: WebServicesService,
    private authService: AuthService,
    private database: FirebaseService,
    private sant:DomSanitizer
    ) {
      
    this.formBasic = new FormGroup({
      // NOMBRE
      'primerNombre': new FormControl('', Validators.required),
      'segundoNombre': new FormControl('', ),
      'primerApellido': new FormControl('', Validators.required),
      'segundoApellido': new FormControl('', ),

      // FOTO PERFIL
      'fotoFrontalSinFondo': new FormControl('', Validators.required),
      'fotoFrontalConFondo': new FormControl('', Validators.required),

      // IMAGEN DE FONDO
      'imgFondo': new FormControl('', Validators.required),
      'imgFirma': new FormControl('', Validators.required),

      // IDENTIFICACIÓN
      'tipoIdentificacion': new FormControl('', Validators.required),
      'identificacion': new FormControl('', Validators.required),
      'nacionalidad': new FormControl('', Validators.required),

      // NACIMIENTO
      'fechaNacimiento': new FormControl(new Date, Validators.required),
      'ciudadNacimiento': new FormControl('', Validators.required),
      'genero': new FormControl('', Validators.required),

      // DE CONTACTO
      'direccionResidencia': new FormControl('', Validators.required),
      'barrioResidencia': new FormControl('', Validators.required),
      'telFijo': new FormControl('', ),
      'telCel': new FormControl('', ),
      'email': new FormControl('', Validators.email),

      // CARGO
      'cargoActual': new FormControl('', Validators.required),
      'acercaDMi': new FormControl('', Validators.required),

      // REDES
      'webSite': new FormControl('',),
      'instagram': new FormControl('',),
      'facebook': new FormControl('',),
      'twitter': new FormControl('',),
      'linkedin': new FormControl('', Validators.required),

      // ESTUDIOS
      'estudios': new FormArray([]),
      
      'idiomas': new FormArray([]),
      'debilidades': new FormArray([]),
      'habilidades': new FormArray([]),
      'intereses': new FormArray([]),
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

  ngOnInit(): void {
    $("#modalLoader").modal('show');

    $(document).ready(function(){ // Permite cargar la función de TOOLTIP
      $('[data-toggle="tooltip"]').tooltip();   
    })
  }

  inicializarVariables(){
    console.log(this.formBasic, 'FORM BASIC');
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
                this.cargarImagenes(this.datosGenerales);
                $("#modalLoader").modal('hide');
                console.log(this.datosGenerales, 'DATOS GENERALES');
              }
              
            })
          }
        })
      }
    });
  }

  cargarImagenes(datosGenerales: any) {
    if(datosGenerales.formBasic.fotoFrontalSinFondo){
      this.fotoFrontalSinFondo[0] = datosGenerales.formBasic.fotoFrontalSinFondo;
    } 
    if(datosGenerales.formBasic.fotoFrontalConFondo){
      this.fotoFrontalConFondo[0] = datosGenerales.formBasic.fotoFrontalConFondo;
    }
    if(datosGenerales.formBasic.imgFondo){
      this.imgFondo[0] = datosGenerales.formBasic.imgFondo;
    }
    if(datosGenerales.formBasic.imgFirma){
      this.imgFirma[0] = datosGenerales.formBasic.imgFirma;
    }
  }
  
  onSelectNewFile(files: any): void{
    console.log(files)
    let file = files.target.files;
    this.fileSelected = file[0] as Blob;
    this.imageUrl = this.sant.bypassSecurityTrustUrl(window.URL.createObjectURL(this.fileSelected)) as string;
    this.base64 = '';
    this.convertFileToBase64();
  }

  loadImg(categoria: string, files: any){

    $("#modalLoader").modal('show');
    let file = files.target.files;
    let reader = new FileReader();

    reader.readAsDataURL(file[0]);
    reader.onloadend = () => {
      // this.fotoFrontalSinFondo.push(reader.result);
      if(categoria === '/frontal-sin-fondo/'){
        this.fotoFrontalSinFondo?.push(reader.result);
        console.log(this.fotoFrontalSinFondo, 'FRONTAL SIN FONDO');
      }else if(categoria === '/frontal-con-fondo/'){
        this.fotoFrontalConFondo?.push(reader.result);
      }else if(categoria === '/fondo/'){
        this.imgFondo?.push(reader.result);
      }else if(categoria === '/firma/'){
        this.imgFirma?.push(reader.result);
      }
      // this.selectionImg(categoria, reader);
      console.log(reader.result, 'READER RESULT');

      // this.database.subirBase64(this.fotoFrontalSinFondo, '/frontal-sin-fondo/');
      this.database.loadImg(categoria, 'img_' + Date.now(), reader.result).then((urlImagen: any) => {

        if(categoria === '/frontal-sin-fondo/'){
          this.formBasic.get('fotoFrontalSinFondo')?.setValue(urlImagen);

        }else if(categoria === '/frontal-con-fondo/'){
          this.formBasic.get('fotoFrontalConFondo')?.setValue(urlImagen);
          
        }else if(categoria === '/fondo/'){
          this.formBasic.get('imgFondo')?.setValue(urlImagen);
          
        }else if(categoria === '/firma/'){
          this.formBasic.get('imgFirma')?.setValue(urlImagen);
        }
        SweetAlert('success','IMAGEN SUBIDA AHORA GUARDE PARA ADJUNTAR');
        $("#modalLoader").modal('hide');
      })
    }
  }
  
  convertFileToBase64(): void{
    let reader = new FileReader();
    reader.readAsDataURL(this.fileSelected as Blob);
    reader.onloadend = () => {
      this.base64 = reader.result as string;
      this.formBasic.controls['fotoFrontalSinFondo'].setValue(this.base64);
    }
  }
  
  loadFormsArray(formularios: any){

    formularios.formBasic.intereses?.forEach((staff: any, index: number, form: any) => {
      this.agregarInteres();
      (<FormArray>this.formBasic.get('intereses')).at(index).setValue(staff);
    });

    formularios.formBasic.habilidades?.forEach((staff: any, index: number, form: any) => {
      this.agregarHabilidad();
      (<FormArray>this.formBasic.get('habilidades')).at(index).setValue(staff);
    });

    formularios.formBasic.debilidades?.forEach((staff: any, index: number, form: any) => {
      this.agregarDebilidad();
      (<FormArray>this.formBasic.get('debilidades')).at(index).setValue(staff);
    });

    formularios.formBasic.idiomas?.forEach((staff: any, index: number, form: any) => {
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
    Swal.fire({
      title: 'Quieres eliminar el formulario?',
      showDenyButton: true,
      showCancelButton: false,
      confirmButtonText: 'Eliminar',
      denyButtonText: `No eliminar`,
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        Swal.fire('Saved!', '', 'success');
        (<FormArray>this.formBasic.controls[formArray]).removeAt(index);
      } else if (result.isDenied) {
        Swal.fire('El formulario no fue borrado', '', 'info')
      }
    })
  }

  
  agregarInteres(){
    (<FormArray>this.formBasic.controls['intereses']).push(new FormGroup({
      'interes': new FormControl(false, Validators.required)
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
      'fechaInicio': new FormControl(new Date, Validators.required),
      'fechaTitulo': new FormControl(new Date, Validators.required),
      'ciudadEstudio': new FormControl('', Validators.required),
      'descripcionEstudio': new FormControl('', Validators.required)
    }));
  }

  agregarExpLaboral(){
    (<FormArray>this.formBasic.controls['expLaboral']).push(new FormGroup({
      'nombreEmpresa': new FormControl('', Validators.required),
      'jefeInmediatoEmpresa': new FormControl('', Validators.required),
      'cargoEjercido': new FormControl('', Validators.required),
      'fechaInicioEmpresa': new FormControl(new Date, Validators.required),
      'fechaFinalEmpresa':new FormControl(new Date, Validators.required),
      'funcionesRealizadas':new FormControl('', Validators.required),
      'telContactoEmpresa': new FormControl('', Validators.required),
      'ciudadEmpresa': new FormControl('', Validators.required),
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
    if(respuesta.formBasic.intereses.length < 1){
      this.cargarInteresesArray();
    } 
    
    this.formBasic.patchValue(respuesta.formBasic as FormGroup);
/*     this.formBasic.controls[1].get('estudios')?.setValue(respuesta.formBasic.estudios[1]);
    this.formBasic.controls[0].get('estudios')?.setValue(respuesta.formBasic.estudios[0]); */
    // this.formBasic.setControl('estudios',  new FormControl(respuesta.formBasic.estudios));
    
    /* respuesta.formBasic.esudios.forEach( (staff: any, index: number, form: any  ) => this.formBasic.at(index).get('estudios').setValue(staff)); */
    //  form.patchValue(respuesta.formBasic.estudios[1]);
    // console.log(this.formBasic.controls['estudios'].value, 'COMO QUEDA EL FORMULARIO DESPUES DEL PATCHVALUE');

  }


  public guardar(){
    $("#modalLoader").modal('show');
    
    let usuario:any = {};
    usuario.idUsuario = this.uid? this.uid : '';
    usuario.formBasic = this.formBasic.value;
    usuario.avatar = '';
    usuario.firma = '';

    console.log(this.formBasic.value, 'COMO ESTA EL FORMULARIO');

    if(this.datosGenerales){ 
      this.database.update('form-basic',this.uid, usuario).then( respuesta => {
        SweetAlert('success','FORMULARIO ACTUALIZADO');
        $("#modalLoader").modal('hide');
        
      });
    }else{
      this.database.createUid('form-basic', usuario, usuario.idUsuario).then( res =>{
        SweetAlert('success','FORMULARIO GUARDADO');
        $("#modalLoader").modal('hide');
        
      }).catch( err => {
        console.error( err);
          SweetAlert('error', 'ERROR GUARDANDO');
      })
    }
    $("#modalLoader").modal('hide');
  }

  eliminarImagen(campo: string){
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: 'btn btn-success',
        cancelButton: 'btn btn-danger'
      },
      buttonsStyling: false
    })
    
    swalWithBootstrapButtons.fire({
      title: 'Quiere eliminar la imagen?',
      text: "Recuerde guardar el cambio!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, borrar!',
      cancelButtonText: 'No, cancelar!',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.limpiarContenedor(campo);
        swalWithBootstrapButtons.fire(
          'Borrada!',
          'La imagen ha sido borrada.',
          'success'
        )
      } else if (
        /* Read more about handling dismissals below */
        result.dismiss === Swal.DismissReason.cancel
      ) {
        swalWithBootstrapButtons.fire(
          'Cancelar',
          'La imagen no se borró',
          'error'
        )
      }
    })
  }
  limpiarContenedor(arg0: string) {
    switch(arg0){
      case 'fotoFrontalSinFondo':
        this.fotoFrontalSinFondo=[];
        this.formBasic.controls['fotoFrontalSinFondo'].reset();
        console.log(this.formBasic, 'EL FORMULARIO BASICO');
        break;
        
        case 'fotoFrontalConFondo':
          this.fotoFrontalConFondo=[];
          this.formBasic.controls['fotoFrontalConFondo'].reset();
          break;
          
          case 'imgFondo':
            this.imgFondo=[];
            this.formBasic.controls['imgFondo'].reset();
            break;
            
            case 'imgFirma':
              this.imgFirma=[];
              this.formBasic.controls['imgFirma'].reset();
        break;
    }
  }

  public cargarIntereses(e: any){
    console.log(e, 'LO QUE VIENE');
    console.log(this.formBasic, 'FOEMULARIO ACTUALMENTE');
  }

  public cargarInteresesArray(){
    this.gustos.forEach( element => {
      this.agregarInteres();
    });
  }

  public scrollTo() {
    window.scroll({ 
      top: 180, 
      left: 0, 
      behavior: 'smooth' 
    });
  }

  public formNombre():boolean{
    let respuesta:any;

    if(this.formBasic.value.primerNombre.isValid || this.formBasic.value.segundoNombre.isValid){
      respuesta = true;
    } else {
      respuesta = false;
    }
    
    return respuesta
  }

}
