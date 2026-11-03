import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserFirebase } from '../../models/usuario.model';

@Component({
  standalone: false,
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  public userLogged = this.authService.getUserLogged();

  @ViewChild('botonAbrir') private botonAbrir?: ElementRef<HTMLElement>;
  @ViewChild('botonCerrar') private botonCerrar?: ElementRef<HTMLElement>;
  @ViewChild('menu') private menu?: ElementRef<HTMLElement>;

  public menuAbierto: boolean = false;
  public returnHome: string = '';
  public mostrarLogin: string = '';
  public email: string = '';
  public enLogin: boolean = false;

  constructor(private route: ActivatedRoute,
    private authService: AuthService,
    private routes: Router) {
    this.inicializarVariables();
  }

  ngOnInit(): void {
    this.enLogin = document.location.href.includes('login');

    this.userLogged.subscribe( (usuario: any) => {
      if(usuario){
        this.email = usuario.multiFactor.user.email;
      }
      
    });
  }

  // tslint:disable-next-line: typedef
  private inicializarVariables(){

    // tslint:disable-next-line: prefer-const
    let path = this.route.snapshot.url.join('/');

    if(path === 'login'){
      this.mostrarLogin = 'login';
    }

    if (path !== 'home'){
      this.returnHome = 'home';
    } else {
      this.returnHome = '';
    }
  }

  public abreMenu(){
    this.menuAbierto = true;
    this.enfocarDespuesDeRenderizar(this.botonCerrar);
  }

  public cierreMenu(){
    this.menuAbierto = false;
    this.enfocarDespuesDeRenderizar(this.botonAbrir);
  }

  // El menu cubre toda la pantalla: Tab no debe salir de el mientras este abierto
  public mantenerFoco(evento: Event){
    const teclado = evento as KeyboardEvent;
    const enfocables = this.menu?.nativeElement.querySelectorAll<HTMLElement>('a[href], button');
    if(!enfocables?.length){
      return;
    }
    const primero = enfocables[0];
    const ultimo = enfocables[enfocables.length - 1];
    const activo = document.activeElement;
    if(teclado.shiftKey && activo === primero){
      teclado.preventDefault();
      ultimo.focus();
    } else if(!teclado.shiftKey && activo === ultimo){
      teclado.preventDefault();
      primero.focus();
    }
  }

  private enfocarDespuesDeRenderizar(boton?: ElementRef<HTMLElement>){
    setTimeout(() => boton?.nativeElement.focus());
  }

  public logout(){
    this.authService.loggout();
    this.routes.navigate(['login']);
  }


}