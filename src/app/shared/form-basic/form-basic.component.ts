import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { UsuarioModel } from '../../models/usuario.model';

@Component({
  selector: 'app-form-basic',
  templateUrl: './form-basic.component.html',
  styleUrls: ['./form-basic.component.css']
})
export class FormBasicComponent implements OnInit {

  public formBasic: FormGroup;

  constructor(private fb: FormBuilder) {
    this.formBasic = this.fb.group({
      nombreCompleto: [UsuarioModel, [Validators.required]],
      tipoIdentificacion: ['', [Validators.required]],
      identificacion: ['', [Validators.required]],
      fechaNacimiento: ['', [Validators.required]],
      ciudadNacimiento: ['', [Validators.required]],
      direccionResidencia: ['', [Validators.required]],
      barrioResidencia: ['', [Validators.required]],
      estudios: ['', [Validators.required]],
      experienciaLaboral: ['', [Validators.required]],
      telFijo: [''],
      email:['', [Validators.required, Validators.pattern(/^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/)]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
  }

}
