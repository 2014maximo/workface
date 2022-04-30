import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  public mostrarOcultarRecordar: boolean = false;
  public form: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.form = this.fb.group({
      email:['', [Validators.required]],
      password: ['', [Validators.required]]
    });
    this.inicializarVariables();
  }

  ngOnInit(): void {
  }

  private inicializarVariables(){
    this.mostrarOcultarRecordar = false;
  }

  recordarClave(cambiar: boolean){
    this.mostrarOcultarRecordar = cambiar;
  }

}
