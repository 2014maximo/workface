import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl, FormArray, AbstractControl } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { OpcionesImagen, SweetAlert, comprimirImagen, leerComoBase64 } from 'src/app/constants/functions.constants';
import { AuthService } from 'src/app/services/auth.service';
import { PerfilLocalService } from 'src/app/services/perfil-local.service';
import { WebServicesService } from '../../services/web-services.service';

import Swal from 'sweetalert2';
import { INTERESES_GUSTOS } from '../../constants/workface.contants';

declare var $: any;

type CampoImagen = 'fotoFrontalSinFondo' | 'fotoSemiperfil' | 'fotoCuerpoCompleto' | 'imgFirma';

// La foto sin fondo y la firma siguen en PNG para conservar la transparencia.
const IMAGENES: Record<string, OpcionesImagen & { campo: CampoImagen }> = {
  '/frontal-sin-fondo/': { campo: 'fotoFrontalSinFondo', anchoMaximo: 800, formato: 'image/png' },
  '/semiperfil/': { campo: 'fotoSemiperfil', anchoMaximo: 800, formato: 'image/jpeg' },
  '/cuerpo-completo/': { campo: 'fotoCuerpoCompleto', anchoMaximo: 1600, formato: 'image/jpeg' },
  '/firma/': { campo: 'imgFirma', anchoMaximo: 600, formato: 'image/png' }
};

@Component({
  standalone: false,
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
  public fotoSemiperfil: any[]=[];
  public imgFirma: any[]=[];
  public fotoCuerpoCompleto: any[]=[];
  public objImagenes: any[]=[];
  public cerrarLoader: boolean = false;
  public gustos: Array<any> = INTERESES_GUSTOS;

  constructor(private fb: FormBuilder,
    public webService: WebServicesService,
    private authService: AuthService,
    private perfilLocal: PerfilLocalService,
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
      'fotoSemiperfil': new FormControl('', Validators.required),

      // IMAGEN DE CUERPO COMPLETO
      'fotoCuerpoCompleto': new FormControl('', Validators.required),
      'imgFirma': new FormControl('', Validators.required),

      // IDENTIFICACIÓN
      'tipoIdentificacion': new FormControl('', Validators.required),
      'identificacion': new FormControl('', Validators.required),
      'nacionalidad': new FormControl('', Validators.required),

      // NACIMIENTO
      'fechaNacimiento': new FormControl('', Validators.required),
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

    this.cargarInteresesArray();
    this.listaTipoIdentificacion = [];
    this.paises = [];
    this.cargarTipoIdentificacion();
    this.inicializarVariables();
  }

  ngOnInit(): void {
    $("#modalLoader").modal('show');

    $(document).ready(function(){ // Permite cargar la función de TOOLTIP
      $('[data-bs-toggle="tooltip"]').tooltip();   
    })
  }

  inicializarVariables(){
    this.authService.getUserLogged().subscribe( (usuario: any) => {
      if(usuario){
        this.uid = usuario.multiFactor.user.uid;
        this.perfilLocal.obtener(this.uid).then( datos => {
          // Un usuario nuevo todavia no tiene perfil guardado.
          if(datos){
            this.datosGenerales = datos;
            this.setFormBasic(datos);
            this.loadFormsArray(datos);
            this.cargarImagenes(datos);
          }
        }).catch( error => {
          console.error(error);
          SweetAlert('error', 'No pudimos cargar tus datos. Recarga la página e inténtalo de nuevo.');
        }).finally( () => {
          $("#modalLoader").modal('hide');
        });
      }
    });
  }

  cargarImagenes(datosGenerales: any) {
    if(datosGenerales.formBasic){
      if(datosGenerales.formBasic.fotoFrontalSinFondo){
        this.fotoFrontalSinFondo[0] = datosGenerales.formBasic.fotoFrontalSinFondo;
      } 
      if(datosGenerales.formBasic.fotoSemiperfil){
        this.fotoSemiperfil[0] = datosGenerales.formBasic.fotoSemiperfil;
      }
      if(datosGenerales.formBasic.fotoCuerpoCompleto){
        this.fotoCuerpoCompleto[0] = datosGenerales.formBasic.fotoCuerpoCompleto;
      }
      if(datosGenerales.formBasic.imgFirma){
        this.imgFirma[0] = datosGenerales.formBasic.imgFirma;
      }
    }

  }
  
  onSelectNewFile(files: any): void{
    let file = files.target.files;
    this.fileSelected = file[0] as Blob;
    this.imageUrl = this.sant.bypassSecurityTrustUrl(window.URL.createObjectURL(this.fileSelected)) as string;
    this.base64 = '';
    this.convertFileToBase64();
  }

  async loadImg(categoria: string, evento: any){
    const archivo: File | undefined = evento.target.files?.[0];
    if(!archivo){
      return;
    }

    const opciones = IMAGENES[categoria];
    $("#modalLoader").modal('show');
    try {
      const imagen = await comprimirImagen(archivo, opciones);
      const base64 = await leerComoBase64(imagen);
      this[opciones.campo] = [base64];
      this.formBasic.get(opciones.campo)?.setValue(base64);
      SweetAlert('success','Imagen lista. Pulsa Guardar para conservarla.');
    } catch(error) {
      console.error(error);
      SweetAlert('error','No pudimos procesar la imagen. Prueba con otro archivo.');
    } finally {
      // Permite volver a elegir el mismo archivo despues de un error.
      evento.target.value = '';
      $("#modalLoader").modal('hide');
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

    if(formularios.formBasic){
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
      title: '¿Eliminar este registro?',
      showDenyButton: true,
      showCancelButton: false,
      confirmButtonText: 'Eliminar',
      denyButtonText: `No eliminar`,
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        Swal.fire('Registro eliminado', 'Pulsa Guardar para conservar el cambio.', 'success');
        (<FormArray>this.formBasic.controls[formArray]).removeAt(index);
      } else if (result.isDenied) {
        Swal.fire('El registro no se eliminó', '', 'info')
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
      'fechaInicio': new FormControl('', Validators.required),
      'fechaTitulo': new FormControl('', Validators.required),
      'ciudadEstudio': new FormControl('', Validators.required),
      'descripcionEstudio':new FormControl('', Validators.compose([
        Validators.required,
        Validators.minLength(40),
        Validators.maxLength(130)
      ])),
    }));
  }

  agregarExpLaboral(){
    (<FormArray>this.formBasic.controls['expLaboral']).push(new FormGroup({
      'nombreEmpresa': new FormControl('', Validators.required),
      'jefeInmediatoEmpresa': new FormControl('', Validators.required),
      'cargoEjercido': new FormControl('', Validators.required),
      'fechaInicioEmpresa': new FormControl('', Validators.required),
      'fechaFinalEmpresa':new FormControl(''),
      'funcionesRealizadas':new FormControl('', Validators.compose([
        Validators.required,
        Validators.minLength(40),
        Validators.maxLength(130)
      ])),
      'telContactoEmpresa': new FormControl('', Validators.required),
      'ciudadEmpresa': new FormControl('', Validators.required),
    }));
  }
  
  agregarConocimientos(){
    (<FormArray>this.formBasic.controls['conocimientosAdicionales']).push(new FormGroup({
      'nombreConocimiento': new FormControl('', Validators.required),
      'duracion': new FormControl('', Validators.required),
      'fechaFinalizacion': new FormControl('', Validators.required),
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

    if(respuesta && respuesta.formBasic){
      this.formBasic.patchValue(respuesta.formBasic as FormGroup);
    } 
    
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

    this.perfilLocal.guardar(this.uid, usuario).then( () => {
      this.datosGenerales = usuario;
      if(this.formBasic.valid){
        SweetAlert('success','Perfil guardado.');
      } else {
        SweetAlert('warning','Perfil guardado. Aún faltan datos obligatorios: revisa los pasos marcados con x.');
      }
    }).catch( error => {
      console.error(error);
      SweetAlert('error', 'No pudimos guardar. Inténtalo de nuevo; tus datos siguen en pantalla.');
    }).finally( () => {
      $("#modalLoader").modal('hide');
    });
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
      title: '¿Eliminar la imagen?',
      text: "Recuerda pulsar Guardar para conservar el cambio.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
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
        
        case 'fotoSemiperfil':
          this.fotoSemiperfil=[];
          this.formBasic.controls['fotoSemiperfil'].reset();
          break;
          
          case 'fotoCuerpoCompleto':
            this.fotoCuerpoCompleto=[];
            this.formBasic.controls['fotoCuerpoCompleto'].reset();
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
