import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl, FormArray } from '@angular/forms';
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
      telFijo: [''],
      telCel: [''],
      email:['', [Validators.required, Validators.pattern(/^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/)]],
      estudios: this.fb.array([]),
      expLaboral: this.fb.array([]),
      conocimientosAdicionales: this.fb.array([]),
      referenciasPersonales: this.fb.array([]),
      referenciasFamiliares: this.fb.array([])

    });

    this.listaTipoIdentificacion = [];
    this.paises = [];
    this.cargarTipoIdentificacion();
  }

  ngOnInit(): void {
  }

  get estudios(): FormArray {
    return this.formBasic.get('estudios') as FormArray;
  }
  get expLaboral(): FormArray {
    return this.formBasic.get('expLaboral') as FormArray;
  }
  get conocimientosAdicionales(): FormArray {
    return this.formBasic.get('conocimientosAdicionales') as FormArray;
  }
  get referenciasPersonales(): FormArray {
    return this.formBasic.get('referenciasPersonales') as FormArray;
  }
  get referenciasFamiliares(): FormArray {
    return this.formBasic.get('referenciasFamiliares') as FormArray;
  }
  
  agregarEstudios(){
    const estudio = this.fb.group({
      nombreInstitucion: ['', [Validators.required]],
      tituloObtenido: ['', [Validators.required]],
      fechaTitulo: [new Date(), [Validators.required]]
    });
    this.estudios.push(estudio);
  }

  agregarExpLaboral(){
    const labor = this.fb.group({
      nombreEmpresa: ['', [Validators.required]],
      nombreJefeInmediato: ['', [Validators.required]],
      fechaInicio: [new Date(), [Validators.required]],
      fechaFinal: [new Date(), [Validators.required]],
      telContacto: ['', [Validators.required]],
    });
    this.expLaboral.push(labor);
  }
  
  agregarConocimientos(){
    const conocimiento = this.fb.group({
      nombreConocimiento: ['', [Validators.required]],
      duracion: ['', [Validators.required]],
      fechaFinalizacion: [new Date(), [Validators.required]],
    });
    this.conocimientosAdicionales.push(conocimiento);
  }

  agregarReferenciaPersonal(){
    const referencia = this.fb.group({
      nombreCompleto: ['', [Validators.required]],
      ocupacion: ['', [Validators.required]],
      telefono: ['', [Validators.required]],
      empresa: ['', [Validators.required]],
    });
    this.referenciasPersonales.push(referencia);
  }

  agregarReferenciaFamiliar(){
    const referencia = this.fb.group({
      nombreCompleto: ['', [Validators.required]],
      ocupacion: ['', [Validators.required]],
      telefono: ['', [Validators.required]],
      parentesco: ['', [Validators.required]],
      empresa: ['', [Validators.required]],
    });
    this.referenciasFamiliares.push(referencia);
  }

  cargarTipoIdentificacion(){
    return this.webService.consultarRecursos().subscribe( (datos:any) =>{
      this.listaTipoIdentificacion = datos.tipoDocumento;
      this.paises = datos.paises;
    })
  }

}
