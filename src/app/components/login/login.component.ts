import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ValidatorFn, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SweetAlert } from 'src/app/constants/functions.constants';

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  public form: FormGroup;
  public ingreso: boolean;
  public recordar: boolean;
  public registro: boolean;
  public separar: boolean;
  public mostrarClave = false;
  public mostrarConfirmacion = false;
  public enviando = false;

  constructor(private fb: FormBuilder,
              private authService: AuthService,
              private route: Router ) {
    this.ingreso = true;
    this.recordar = false;
    this.registro = false;
    this.separar = false;
    this.form = this.fb.group({
      email:['', [Validators.required, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)]],
      password: ['', [Validators.required]],
      confirmPassword: ['']
    }, { validators: this.checkPasswords});
  }


  private checkPasswords: ValidatorFn = (group: AbstractControl):  ValidationErrors | null => { 
    let pass = group.get('password')?.value;
    let confirmPass = group.get('confirmPassword')?.value
    return pass === confirmPass ? null : { notSame: true }
  }

  public get textoEnviar(): string {
    if(this.enviando){
      return 'ENVIANDO…';
    }
    if(this.registro){
      return 'CREAR CUENTA';
    }
    return this.recordar ? 'ENVIAR ENLACE' : 'INGRESAR';
  }

  ngOnInit(): void {
  }

  private getEmail(){
    return this.form.value.email;
  }
  private getPass(){
    return this.form.value.password;
  }
  public resetForm(){
    this.form.get('email')?.setValue('');
    this.form.get('password')?.setValue('');
    this.form.get('confirmPassword')?.setValue('');
  }

  private toas(icon: any, message: string){
    SweetAlert(icon, message);
  }


  private limpiarClaves(){
    this.form.patchValue({ password: '', confirmPassword: '' });
  }

  // Espera a que Angular muestre la vista antes de mover el foco
  public focoEmail(){
    setTimeout( ()=>{
      document.getElementById('email')?.focus();
    });
  }

  public ingresoGoogle(){
    this.enviando = true;
    this.authService.loginGoogle().then( res =>{
      if(res){
        this.route.navigate(['profile']);
      } else {
        this.toas('error', 'No pudimos ingresar con Google. Revisa que el navegador permita ventanas emergentes e inténtalo de nuevo.');
      }
    }).finally(() => this.enviando = false);
  }

  private ocultarClaves(){
    this.mostrarClave = false;
    this.mostrarConfirmacion = false;
  }

  public ajustesIngresar(){
    this.ocultarClaves();
    this.registro = false;
    this.recordar = false;
    this.ingreso = true;
    this.separar = false;
  }
  public ajustesRegistrar(){
    this.ocultarClaves();
    this.resetForm();
    this.focoEmail();
    this.ingreso = false;
    this.recordar = false;
    this.registro = true;
    this.separar = false;
  }
  public ajustesRecordarClave(){
    this.ocultarClaves();
    this.resetForm();
    this.focoEmail();
    this.ingreso = false;
    this.registro = false;
    this.recordar = true;
    this.separar = true;
  }

  public ingresoUsuario(){

    if(this.getEmail() && this.getPass()){
        this.enviando = true;
        this.authService.login(this.getEmail(), this.getPass()).then( res =>{
          if(res?.operationType === "signIn"){
            this.route.navigate(['profile']);
          } else {
            this.toas('error','El email o la clave no son correctos. Revísalos e inténtalo de nuevo.');
            this.limpiarClaves();
            this.focoEmail();
          }
        }).finally(() => this.enviando = false);

    } else {
      this.toas('error', 'Escribe tu email y tu clave.');
    }

  }

  private errorRegistro(): string | null {
    if(this.form.get('email')?.invalid){
      return 'Escribe un email válido, por ejemplo nombre@correo.com.';
    }
    if(this.form.get('password')?.invalid){
      return 'Escribe una clave.';
    }
    return this.form.hasError('notSame') ? 'Las claves no coinciden.' : null;
  }

  public registroUsuario(){
    const error = this.errorRegistro();
    if(error){
      this.toas('error', error);
      return;
    }
    this.enviando = true;
    this.authService.register(this.getEmail(), this.getPass()).then( res => {
      if(res?.additionalUserInfo?.isNewUser){
        this.toas('success','Registro correcto');
        this.route.navigate(['profile']);
      }else{
        this.toas('error', 'No pudimos crear la cuenta. Revisa que el email no esté registrado y que la clave tenga al menos 6 caracteres.');
        this.limpiarClaves();
        this.focoEmail();
      }
    }).finally(() => this.enviando = false);
  }

  public recordarClave(){
    if(this.form.get('email')?.valid){
        this.enviando = true;
        this.authService.resetPassword(this.getEmail()).then( error => {
          if(error){
            this.toas('error', 'No pudimos enviar el enlace. Inténtalo de nuevo en unos minutos.');
          } else {
            this.toas('success', 'Si el email está registrado, te enviamos un enlace para cambiar tu clave.');
          }
        }).finally(() => this.enviando = false);
    } else {
      this.toas('error', 'Escribe un email válido, por ejemplo nombre@correo.com.');
    }
  }

  public submit(){
    if(this.enviando){
      return;
    }

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
