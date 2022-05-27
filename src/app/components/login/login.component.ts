import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ValidatorFn, Validators, AbstractControl, ValidationErrors, FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';
import { timeout } from 'rxjs';

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
  public ingreso: boolean;
  public recordar: boolean;
  public registro: boolean;

  constructor( private fb: FormBuilder,
               private authService: AuthService,
               private route: Router ) {
    this.mostrarOcultarRecordar = false;             
    this.usuarioIncorrecto = false;
    this.ingreso = true;
    this.recordar = false;
    this.registro = false;
    this.form = this.fb.group({
      email:['', [Validators.required, Validators.pattern(/^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/)]],
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

  private getEmail():FormControl{
    return this.form.value.email;
  }
  private getPass():FormControl{
    return this.form.value.password;
  }
  private getConfirmPass():FormControl{
    return this.form.value.confirmPassword;
  }

  private sweetAlert(){
    return Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
      }
    });
  }

  ingresarGoogle(){

    this.authService.loginGoogle(this.getEmail().value, this.getPass().value).then( res =>{
      if(res){
        console.log(res, 'INGRESO CON GMAIL');
        this.route.navigate(['profile']);
      } else {

      }
    });
  }

  public ingresar(){
    const Toast = this.sweetAlert();
    
    this.authService.login(this.getEmail().value, this.getPass().value).then( res =>{
      if(res?.operationType === "signIn"){
        console.log(res, 'INGRESO');
        this.route.navigate(['profile']);
      } else {
        Toast.fire({
          icon: 'error',
          title: 'El usuario no esta registrado'
        });
        this.usuarioIncorrecto = true;
        setTimeout(()=>{
          this.usuarioIncorrecto = false;
          
        },5000);

        this.focoEmail();
        
      }
    });
  }

  public focoEmail(){
    setTimeout( ()=>{
      this.resetForm();
      document.getElementById('email')?.focus();
    }, 1000)
  }

  public resetForm(){
    this.form.get('email')?.setValue('');
    this.form.get('password')?.setValue('');
    this.form.get('confirmPassword')?.setValue('');
  }

  public registrar(){
    this.resetForm();
    this.focoEmail();
    this.ingreso = false;
    this.recordar = false;
    this.registro = true;
  }

  public recordarClave(){
    this.resetForm();
    this.focoEmail();
    this.ingreso = false;
    this.registro = false;
    this.recordar = true;
  }

  public register(){
    const Toast = this.sweetAlert();

    if(this.getConfirmPass() == this.getPass()){
      
      if(this.form.valid){
        this.authService.register(this.getEmail().value, this.getPass().value).then( res => {
          if(res?.additionalUserInfo?.isNewUser){
            Toast.fire({
              icon: 'success',
              title: 'Registrado correctamente'
            });
          }else{
            Toast.fire({
              icon: 'error',
              title: 'El usuario ya se encuentra registrado'
            });

          }
        })

      }
    } else {
    }
  }

  public volver(){
    this.resetForm();
    this.camposRegistrar = false;
    this.mostrarOcultarRecordar = false;
  }

  public submit(){
    if(this.ingreso){
      this.toas('success', 'ingreso');
      
    } else if(this.registro){
      this.resetForm();
      this.toas('success', 'registro');

      
    } else if(this.recordar){
      this.resetForm();
      this.toas('success', 'recordar');
    }
  }

  private toas(icon: any, message: string){
    const Toast = this.sweetAlert();
    Toast.fire({
      icon: icon,
      title: message
    });
  }

}
