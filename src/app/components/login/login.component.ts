import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ValidatorFn, Validators, AbstractControl, ValidationErrors, FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { timeout } from 'rxjs';
import { SweetAlert } from 'src/app/constants/functions.constants';

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
  public separar: boolean;

  constructor( private fb: FormBuilder,
               private authService: AuthService,
               private route: Router ) {
    this.mostrarOcultarRecordar = false;             
    this.usuarioIncorrecto = false;
    this.ingreso = true;
    this.recordar = false;
    this.registro = false;
    this.separar = false;
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

  private getEmail(){
    return this.form.value.email;
  }
  private getPass(){
    return this.form.value.password;
  }
  private getConfirmPass(){
    return this.form.value.confirmPassword;
  }

  public resetForm(){
    this.form.get('email')?.setValue('');
    this.form.get('password')?.setValue('');
    this.form.get('confirmPassword')?.setValue('');
  }

  private toas(icon: any, message: string){
    SweetAlert(icon, message);
  }


  public focoEmail(){
    setTimeout( ()=>{
      this.resetForm();
      document.getElementById('email')?.focus();
    }, 1000)
  }

  public ingresoGoogle(){
    this.authService.loginGoogle().then( res =>{
      if(res){
        this.route.navigate(['profile']);
      } else {

      }
    });
  }

  public ajustesIngresar(){
    this.registro = false;
    this.recordar = false;
    this.ingreso = true;
    this.separar = false;
  }
  public ajustesRegistrar(){
    this.resetForm();
    this.focoEmail();
    this.ingreso = false;
    this.recordar = false;
    this.registro = true;
    this.separar = false;
  }
  public ajustesRecordarClave(){
    this.resetForm();
    this.focoEmail();
    this.ingreso = false;
    this.registro = false;
    this.recordar = true;
    this.separar = true;
  }

  public ingresoUsuario(){

    if(this.getEmail() && this.getPass()){
        this.authService.login(this.getEmail(), this.getPass()).then( res =>{
          if(res?.operationType === "signIn"){
            this.route.navigate(['profile']);
          } else {
            this.toas('error','Email o clave errados');
            this.usuarioIncorrecto = true;
            setTimeout(()=>{
              this.usuarioIncorrecto = false;
            },5000);
            this.focoEmail();
          }
        });

    } else {
      this.toas('error', 'Ingrese correctamente los datos');
    }

  }

  public registroUsuario(){
    if(this.form.valid){
        this.authService.register(this.getEmail(), this.getPass()).then( res => {
          console.log(this.getEmail().value, this.getPass().value, 'EL VALOR QUE SE MANDA');
          if(res?.additionalUserInfo?.isNewUser){
            this.toas('success','Registro correcto');
            this.resetForm();
          }else{
            this.toas('error', 'El usuario ya esta registrado');
            this.resetForm();
            this.focoEmail();
          }
        });
      } else {
        this.toas('error', 'Formulario inválido');
        this.resetForm();
        this.focoEmail();
      }
  }

  public recordarClave(){
    if(this.getEmail()){
        this.authService.resetPassword(this.getEmail()).then( res => {
        });
    } else {
      this.toas('error', 'Ingresa correctamente el correo');
    }
  }

/* En las versiones chrome no permite
abrir la ventana aparte para loguear con gmail */

/*   private validarGoogle(): boolean{
    return this.getEmail().includes('gmail');
  } */


  public submit(){
    // INGRESO DEL USUARIO
    if(this.ingreso){
      this.ingresoUsuario();

    // REGISTRAR NUEVO USUARIO
    } else if(this.registro){
      this.registroUsuario();
    
    // RECORDAR CLAVE PERDIDA
    } else if(this.recordar){
      this.recordarClave();
    }
  }

}
