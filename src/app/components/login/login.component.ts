import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ValidatorFn, Validators, AbstractControl, ValidationErrors, FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { trigger, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  public mostrarOcultarRecordar: boolean;
  public form: FormGroup;
  public usuarioIncorrecto: boolean;
  public camposRegistrar: boolean;

  constructor( private fb: FormBuilder,
               private authService: AuthService,
               private route: Router ) {
    this.mostrarOcultarRecordar = false;             
    this.usuarioIncorrecto = false;
    this.form = this.fb.group({
      email:['', [Validators.required, Validators.pattern(/^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/)]],
      emailConfirm:['', [Validators.required, Validators.pattern(/^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/)]],
      password: ['', [Validators.required]],
      confirmPassword: ['']
    }, { validators: this.checkPasswords});
    this.camposRegistrar = false;
  }

  private checkPasswords: ValidatorFn = (group: AbstractControl):  ValidationErrors | null => { 
    let pass = group.get('password')?.value;
    let confirmPass = group.get('confirmPassword')?.value
    return pass === confirmPass ? null : { notSame: true }
  }

  public isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const invalidCtrl = !!(control?.invalid && control?.parent?.dirty);
    const invalidParent = !!(control?.parent?.invalid && control?.parent?.dirty);

    return invalidCtrl || invalidParent;
  }

  ngOnInit(): void {
  }

  private getEmail(){
    return this.form.value.email;
  }
  private getPass(){
    return this.form.value.password;
  }

  recordarClave(cambiar: boolean){
    this.mostrarOcultarRecordar = cambiar;
  }

  ingresarGoogle(){

    this.authService.loginGoogle(this.getEmail(), this.getPass()).then( res =>{
      if(res){
        console.log(res, 'INGRESO CON GMAIL');
        this.route.navigate(['profile']);
      } else {

      }
    });
  }

  public ingresar(){
    
    this.authService.login(this.getEmail(), this.getPass()).then( res =>{
      if(res){
        this.route.navigate(['profile']);
      } else {
        this.usuarioIncorrecto = true;
        this.form.reset();
      }
    });
  }

  public registrar(){
    this.camposRegistrar = true;
  }

  public register(){
    this.authService.register(this.getEmail(), this.getPass()).then( res =>{

    })
  }

}
