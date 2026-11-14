import { Component, ElementRef, OnInit, ViewChild, computed, effect, inject, output, signal } from '@angular/core';
import { IdiomaService } from 'src/app/services/idioma.service';
import { TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { FormGroup, FormBuilder, Validators, FormControl, FormArray, AbstractControl } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ICONO_HABILIDAD_GENERICO, OpcionesImagen, SweetAlert, comprimirImagen, leerComoBase64, svgComoImagen } from 'src/app/constants/functions.constants';
import { AuthService } from 'src/app/services/auth.service';
import { PerfilLocalService } from 'src/app/services/perfil-local.service';
import { WebServicesService } from '../../services/web-services.service';

import { INTERESES_GUSTOS } from '../../constants/workface.contants';
import { HabilidadElegida, SelectorHabilidadComponent } from '../selector-habilidad/selector-habilidad.component';
import { ImportarCvComponent, SeleccionImportacion } from '../importar-cv/importar-cv.component';
import { CAMPOS_SIMPLES } from 'src/app/services/importar-cv/interpretar-cv';

declare var $: any;
declare const bootstrap: any;

// Importar una hoja de vida (PDF o Word) solo esta disponible en español.
// En los demas idiomas llegara mas adelante, con los planes de pago.
const IDIOMAS_CON_IMPORTACION = ['es'];

type CampoImagen = 'fotoFrontalSinFondo' | 'fotoSemiperfil' | 'fotoCuerpoCompleto' | 'imgFirma';

// La foto sin fondo y la firma siguen en PNG para conservar la transparencia.
const IMAGENES: Record<string, OpcionesImagen & { campo: CampoImagen }> = {
  '/frontal-sin-fondo/': { campo: 'fotoFrontalSinFondo', anchoMaximo: 800, formato: 'image/png' },
  '/semiperfil/': { campo: 'fotoSemiperfil', anchoMaximo: 800, formato: 'image/jpeg' },
  '/cuerpo-completo/': { campo: 'fotoCuerpoCompleto', anchoMaximo: 1600, formato: 'image/jpeg' },
  '/firma/': { campo: 'imgFirma', anchoMaximo: 600, formato: 'image/png' }
};

const NIVEL_INICIAL = 50;

const NOMBRES_IMAGEN: Record<CampoImagen, string> = {
  fotoFrontalSinFondo: 'form.nombreImagen.frontal',
  fotoSemiperfil: 'form.nombreImagen.semiperfil',
  fotoCuerpoCompleto: 'form.nombreImagen.cuerpo',
  imgFirma: 'form.nombreImagen.firma'
};

const NOMBRES_REGISTRO: Record<string, string> = {
  estudios: 'form.nombreRegistro.estudio',
  habilidades: 'form.nombreRegistro.habilidad',
  expLaboral: 'form.nombreRegistro.experiencia',
  conocimientosAdicionales: 'form.nombreRegistro.conocimiento',
  referenciasPersonales: 'form.nombreRegistro.refPersonal',
  referenciasFamiliares: 'form.nombreRegistro.refFamiliar'
};

// Campos obligatorios de cada lista, en el orden del formulario, para decir cuales faltan.
// "registro" es el titulo que muestra cada elemento de la lista: "Empresa 2", "Familiar 1".
// Todos los textos son claves de traduccion.
export const CAMPOS_REGISTRO: Record<string, { registro: string, campos: Record<string, string> }> = {
  estudios: {
    registro: 'form.registro.estudio',
    campos: {
      nombreInstitucion: 'form.campo.nombreInstitucion',
      tituloObtenido: 'form.campo.tituloObtenido',
      fechaInicio: 'form.campo.fechaInicio',
      fechaTitulo: 'form.campo.fechaTitulo',
      ciudadEstudio: 'form.campo.ciudadEstudio',
      descripcionEstudio: 'form.campo.descripcionEstudio'
    }
  },
  expLaboral: {
    registro: 'form.registro.empresa',
    campos: {
      nombreEmpresa: 'form.campo.nombreEmpresa',
      jefeInmediatoEmpresa: 'form.campo.jefeInmediatoEmpresa',
      cargoEjercido: 'form.campo.cargoEjercido',
      funcionesRealizadas: 'form.campo.funcionesRealizadas',
      fechaInicioEmpresa: 'form.campo.fechaInicioEmpresa',
      telContactoEmpresa: 'form.campo.telContactoEmpresa',
      ciudadEmpresa: 'form.campo.ciudadEmpresa'
    }
  },
  conocimientosAdicionales: {
    registro: 'form.registro.conocimiento',
    campos: {
      nombreConocimiento: 'form.campo.nombreConocimiento',
      duracion: 'form.campo.duracion',
      fechaFinalizacion: 'form.campo.fechaFinalizacion'
    }
  },
  referenciasPersonales: {
    registro: 'form.registro.persona',
    campos: {
      nombreCompleto: 'form.campo.nombreCompleto',
      ocupacion: 'form.campo.ocupacion',
      telefono: 'form.campo.telefono',
      empresa: 'form.campo.empresa'
    }
  },
  referenciasFamiliares: {
    registro: 'form.registro.familiar',
    campos: {
      nombreCompleto: 'form.campo.nombreCompleto',
      ocupacion: 'form.campo.ocupacionFamiliar',
      telefono: 'form.campo.telefono',
      parentesco: 'form.campo.parentesco',
      empresa: 'form.campo.empresa'
    }
  }
};

// "Jefe inmediato, Ciudad y Fecha de inicio"
function enumerar(partes: string[], y: string): string {
  return partes.length > 1 ? `${partes.slice(0, -1).join(', ')} ${y} ${partes[partes.length - 1]}` : partes[0] ?? '';
}

// Mismos pasos y controles que muestran las marcas de la barra inferior.
const PASOS: { nombre: string, controles: string[] }[] = [
  { nombre: 'form.resumen.p1', controles: ['primerNombre', 'primerApellido'] },
  { nombre: 'form.resumen.p2', controles: ['fotoFrontalSinFondo', 'fotoSemiperfil', 'fotoCuerpoCompleto', 'imgFirma'] },
  { nombre: 'form.resumen.p3', controles: ['tipoIdentificacion', 'identificacion', 'nacionalidad'] },
  { nombre: 'form.resumen.p4', controles: ['fechaNacimiento', 'ciudadNacimiento', 'genero'] },
  { nombre: 'form.resumen.p5', controles: ['direccionResidencia', 'barrioResidencia', 'email'] },
  { nombre: 'form.resumen.p6', controles: ['cargoActual', 'acercaDMi'] },
  { nombre: 'form.resumen.p7', controles: ['linkedin'] },
  { nombre: 'form.resumen.p8', controles: ['estudios'] },
  { nombre: 'form.resumen.p9', controles: ['habilidades'] },
  { nombre: 'form.resumen.p10', controles: ['intereses'] },
  { nombre: 'form.resumen.p11', controles: ['expLaboral'] },
  { nombre: 'form.resumen.p12', controles: ['conocimientosAdicionales'] },
  { nombre: 'form.resumen.p13', controles: ['referenciasPersonales'] },
  { nombre: 'form.resumen.p14', controles: ['referenciasFamiliares'] }
];

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
  // Solo se puede deshacer el ultimo borrado; Guardar lo confirma.
  public borrado: { mensaje: string, restaurar: () => void, origen: HTMLElement | null } | null = null;
  public anuncio: string = '';
  @ViewChild('botonDeshacer') private botonDeshacer?: ElementRef<HTMLButtonElement>;
  @ViewChild(SelectorHabilidadComponent) private selectorHabilidad?: SelectorHabilidadComponent;
  @ViewChild(ImportarCvComponent) private importadorCv?: ImportarCvComponent;
  // Texto de estudios y experiencia de la hoja importada, para copiarlo a mano. No se guarda.
  public textoImportado: { estudios: string[], experiencia: string[] } = { estudios: [], experiencia: [] };
  public bloqueCopiado: string | null = null;
  // Despues del primer intento de guardar, cada registro incompleto dice que le falta.
  public intentoGuardar: boolean = false;
  // Datos del formulario mientras se escriben, aun sin guardar: alimentan la vista previa.
  public cambio = output<{ formBasic: any }>();
  private habilidadEnEdicion?: number;
  private habilidadConfirmada: boolean = false;

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
    // Una pausa corta evita redibujar la vista previa en cada tecla.
    this.formBasic.valueChanges.pipe(debounceTime(200), takeUntilDestroyed())
      .subscribe(() => this.cambio.emit({ formBasic: this.formBasic.getRawValue() }));
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
          SweetAlert('error', this.t('form.avisos.errorCarga'));
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
      SweetAlert('success', this.t('form.avisos.imagenLista'));
    } catch(error) {
      console.error(error);
      SweetAlert('error', this.t('form.avisos.errorImagen'));
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
        // Las habilidades guardadas antes del catalogo no traen icono.
        (<FormArray>this.formBasic.get('habilidades')).at(index).patchValue(staff);
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
    const controles = formArray ? [formArray] : campos.map(campo => this.formBasic.get(campo) as AbstractControl);
    const valores = controles.map(control => control.value);
    const tieneContenido = valores.some(valor => valor && typeof valor === 'object' ? Object.values(valor).some(Boolean) : Boolean(valor));
    // Sin nada que borrar, no se pierde la opcion de deshacer el borrado anterior.
    if(!tieneContenido){
      return;
    }
    controles.forEach(control => control.reset());
    this.registrarBorrado(this.t('form.avisos.camposBorrados'), () => {
      controles.forEach((control, indice) => control.setValue(valores[indice]));
    });
  }

  deleteControls(formArray: string, index: number){
    const lista = this.formBasic.controls[formArray] as FormArray;
    const registro = lista.at(index);
    lista.removeAt(index);
    this.registrarBorrado(this.t('form.avisos.registroEliminado', { registro: this.t(NOMBRES_REGISTRO[formArray]), n: index + 1 }), () => lista.insert(index, registro));
  }

  private registrarBorrado(mensaje: string, restaurar: () => void){
    this.borrado = { mensaje, restaurar, origen: document.activeElement as HTMLElement | null };
    this.anuncio = mensaje;
    // El boton pulsado puede desaparecer: el foco pasa a Deshacer.
    setTimeout(() => this.botonDeshacer?.nativeElement.focus());
  }

  public deshacer(){
    this.borrado?.restaurar();
    this.anuncio = this.t('form.avisos.borradoDeshecho');
    this.cerrarDeshacer();
  }

  public cerrarDeshacer(){
    const origen = this.borrado?.origen;
    this.borrado = null;
    setTimeout(() => {
      // En celular el boton pulsado no siempre recibe el foco y queda en el body.
      const destino = origen?.isConnected && origen !== document.body ? origen : document.querySelector<HTMLElement>('.carousel-item.active button');
      destino?.focus({ preventScroll: true });
    });
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
      'icono': new FormControl(''),
      'nivel': new FormControl('', Validators.required)
    }));
  }

  // Sin indice, el registro se crea solo cuando se elige una habilidad.
  public abrirSelectorHabilidad(index?: number){
    this.habilidadEnEdicion = index;
    this.habilidadConfirmada = false;
    this.selectorHabilidad?.abrir();
  }

  public habilidadElegida({ nombre, icono }: HabilidadElegida){
    if(this.habilidadEnEdicion === undefined){
      this.agregarHabilidad();
      this.habilidadEnEdicion = (this.formBasic.get('habilidades') as FormArray).length - 1;
    }
    const registro = (this.formBasic.get('habilidades') as FormArray).at(this.habilidadEnEdicion);
    // Al cambiar de habilidad se conserva el nivel ya indicado, incluido el 0.
    const nivelVacio = registro.value.nivel === '' || registro.value.nivel === null;
    registro.patchValue({ habilidad: nombre, icono, nivel: nivelVacio ? NIVEL_INICIAL : registro.value.nivel });
    this.habilidadConfirmada = true;
  }

  // Tras elegir sigue indicar el nivel; al cancelar se vuelve al boton que abrio el modal.
  public selectorHabilidadCerrado(){
    const destino = this.habilidadEnEdicion === undefined
      ? 'agregarHabilidad'
      : `${this.habilidadConfirmada ? 'nivel' : 'habilidad'}-${this.habilidadEnEdicion}`;
    document.getElementById(destino)?.focus();
  }

  public imagenHabilidad(icono: string | null): string {
    return svgComoImagen(icono || ICONO_HABILIDAD_GENERICO, '#fff');
  }

  public abrirImportacion(){
    const valores = this.formBasic.value;
    this.importadorCv?.abrir({
      campos: Object.fromEntries(CAMPOS_SIMPLES.map(campo => [campo, valores[campo] ?? ''])),
      habilidades: (valores.habilidades ?? []).map((h: any) => h.habilidad).filter(Boolean)
    });
  }

  public importacionCerrada(){
    document.getElementById('abrirImportacion')?.focus();
  }

  public importacionAplicada({ campos, habilidades, referencias, bloquesEstudios, bloquesExperiencia }: SeleccionImportacion){
    const anteriores = Object.fromEntries(Object.keys(campos).map(campo => [campo, this.formBasic.get(campo)?.value]));
    this.formBasic.patchValue(campos);
    Object.keys(campos).forEach(campo => this.formBasic.get(campo)?.markAsDirty());

    const lista = (nombre: string) => this.formBasic.get(nombre) as FormArray;
    const largos = { habilidades: lista('habilidades').length, referenciasPersonales: lista('referenciasPersonales').length, referenciasFamiliares: lista('referenciasFamiliares').length };
    habilidades.forEach(({ nombre, icono }) => {
      this.agregarHabilidad();
      lista('habilidades').at(-1).patchValue({ habilidad: nombre, icono, nivel: NIVEL_INICIAL });
    });
    referencias.forEach(({ familiar, nombreCompleto, ocupacion, telefono, empresa }) => {
      if(familiar){
        this.agregarReferenciaFamiliar();
      } else {
        this.agregarReferenciaPersonal();
      }
      lista(familiar ? 'referenciasFamiliares' : 'referenciasPersonales').at(-1).patchValue({ nombreCompleto, ocupacion, telefono, empresa });
    });

    const textoAnterior = this.textoImportado;
    this.textoImportado = { estudios: bloquesEstudios, experiencia: bloquesExperiencia };
    const total = Object.keys(campos).length + habilidades.length + referencias.length;
    if(!total){
      SweetAlert('info', this.t('form.avisos.revisaTexto'));
      return;
    }
    // Igual que un borrado, la importacion se puede deshacer hasta pulsar Guardar.
    this.registrarBorrado(this.t(total === 1 ? 'form.avisos.importadoUno' : 'form.avisos.importadosVarios', { total }), () => {
      this.formBasic.patchValue(anteriores);
      (Object.keys(largos) as (keyof typeof largos)[]).forEach(nombre => {
        while(lista(nombre).length > largos[nombre]){
          lista(nombre).removeAt(lista(nombre).length - 1);
        }
      });
      this.textoImportado = textoAnterior;
    });
  }

  public async copiarBloque(texto: string){
    try {
      await navigator.clipboard.writeText(texto);
      this.bloqueCopiado = texto;
      this.anuncio = this.t('form.avisos.textoCopiado');
    } catch(error) {
      console.error(error);
      this.anuncio = this.t('form.avisos.errorCopiar');
      SweetAlert('error', this.anuncio);
    }
  }

  public ocultarTextoImportado(tipo: 'estudios' | 'experiencia'){
    this.textoImportado = { ...this.textoImportado, [tipo]: [] };
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
        Validators.minLength(40)
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
        Validators.minLength(40)
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


  public pasosPendientes(): string[] {
    return PASOS
      .filter(paso => paso.controles.some(control => this.formBasic.get(control)?.invalid))
      .map(paso => paso.nombre);
  }

  private nombresFaltantes(lista: string, grupo: AbstractControl): string[] {
    const campos = CAMPOS_REGISTRO[lista].campos;
    return Object.keys(campos).filter(campo => grupo.get(campo)?.invalid).map(campo => this.t(campos[campo]));
  }

  // Elementos incompletos de una lista y sus campos faltantes, en el orden del formulario.
  public faltantes(lista: string): { numero: number, campos: string[] }[] {
    return (this.formBasic.get(lista) as FormArray).controls
      .map((grupo, indice) => ({ numero: indice + 1, campos: this.nombresFaltantes(lista, grupo) }))
      .filter(elemento => elemento.campos.length > 0);
  }

  public camposFaltantes(lista: string, grupo: AbstractControl): string {
    return enumerar(this.nombresFaltantes(lista, grupo), this.t('form.y'));
  }

  // Un campo se marca cuando el usuario ya paso por el o cuando intento guardar.
  public mostrarError(control: AbstractControl | null): boolean {
    return !!control?.invalid && (control.touched || control.dirty);
  }

  // Detalle para el aviso de guardado: "Experiencia laboral (Empresa 1: Jefe inmediato y Ciudad)".
  private detallePaso(paso: string): string {
    const [lista] = PASOS.find(p => p.nombre === paso)?.controles ?? [];
    const nombre = this.t(paso);
    if (!CAMPOS_REGISTRO[lista]) {
      return nombre;
    }
    const registro = CAMPOS_REGISTRO[lista].registro;
    const detalle = this.faltantes(lista).map(e => `${this.t(registro, { n: e.numero })}: ${enumerar(e.campos, this.t('form.y'))}`).join('; ');
    return detalle ? `${nombre} (${detalle})` : nombre;
  }

  public largoTexto(control: AbstractControl | null): number {
    return control?.value?.length ?? 0;
  }

  public guardar(){
    // Muestra en cada paso los campos que faltan, no solo el aviso general.
    this.formBasic.markAllAsTouched();
    this.intentoGuardar = true;
    $("#modalLoader").modal('show');
    
    let usuario:any = {};
    usuario.idUsuario = this.uid? this.uid : '';
    usuario.formBasic = this.formBasic.value;
    usuario.avatar = '';
    usuario.firma = '';

    this.perfilLocal.guardar(this.uid, usuario).then( () => {
      this.datosGenerales = usuario;
      this.borrado = null;
      if(this.formBasic.valid){
        SweetAlert('success', this.t('form.avisos.guardado'));
      } else {
        SweetAlert('warning', this.t('form.avisos.guardadoIncompleto', { pasos: this.pasosPendientes().map(paso => this.detallePaso(paso)).join(', ') }), 8000);
      }
    }).catch( error => {
      console.error(error);
      SweetAlert('error', this.t('form.avisos.errorGuardar'));
    }).finally( () => {
      $("#modalLoader").modal('hide');
    });
  }

  eliminarImagen(campo: CampoImagen){
    const control = this.formBasic.controls[campo];
    const imagen = control.value;
    this[campo] = [];
    control.reset();
    this.registrarBorrado(this.t('form.avisos.imagenEliminada', { imagen: this.t(NOMBRES_IMAGEN[campo]) }), () => {
      control.setValue(imagen);
      this[campo] = [imagen];
    });
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

  private readonly traductor = inject(TranslateService);

  /** Texto traducido de una clave */
  private t(clave: string, parametros?: Record<string, unknown>): string {
    return this.traductor.instant(clave, parametros);
  }

  private readonly idioma = inject(IdiomaService);
  public readonly importacionDisponible = computed(() => IDIOMAS_CON_IMPORTACION.includes(this.idioma.actual()));
  /** Slide con el que arranca el carrusel: sin importacion se salta Ingreso de datos */
  public readonly pasoInicial = this.importacionDisponible() ? 0 : 1;

  /** Slide visible del carrusel: 0 es Ingreso de datos */
  public pasoActual = signal(this.pasoInicial);

  // Al cambiar a un idioma sin importacion estando en Ingreso de datos, pasa al primer paso
  private readonly salirDeIngreso = effect(() => {
    if (!this.importacionDisponible() && this.pasoActual() === 0) {
      const carrusel = document.getElementById('carousel-form');
      if (carrusel && typeof bootstrap !== 'undefined') {
        bootstrap.Carousel.getOrCreateInstance(carrusel).to(1);
      }
    }
  });

  /** Sin importacion, Ingreso de datos no se puede abrir: ni con las flechas ni al dar la vuelta desde el ultimo paso */
  public antesDeCambiarPaso(evento: Event): void {
    if (!this.importacionDisponible() && (evento as Event & { to: number }).to === 0) {
      evento.preventDefault();
    }
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
