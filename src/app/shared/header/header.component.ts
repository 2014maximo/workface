import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { IDIOMAS, IdiomaService } from '../../services/idioma.service';
import { animate, stagger, AnimationPlaybackControls } from 'motion';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserFirebase } from '../../models/usuario.model';

@Component({
  standalone: false,
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {

  public userLogged = this.authService.getUserLogged();
  public readonly idioma = inject(IdiomaService);
  public readonly idiomas = IDIOMAS;

  @ViewChild('botonAbrir') private botonAbrir?: ElementRef<HTMLElement>;
  @ViewChild('botonCerrar') private botonCerrar?: ElementRef<HTMLElement>;
  @ViewChild('menu') private menu?: ElementRef<HTMLElement>;

  public menuAbierto: boolean = false;
  public returnHome: string = '';
  public mostrarLogin: string = '';
  public email: string = '';
  public enLogin: boolean = false;
  private animaciones: AnimationPlaybackControls[] = [];

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

  ngOnDestroy(): void {
    this.terminarAnimaciones();
  }

  public abreMenu(){
    this.menuAbierto = true;
    this.animarEntrada();
    this.enfocarDespuesDeRenderizar(this.botonCerrar);
  }

  public cierreMenu(){
    this.menuAbierto = false;
    this.terminarAnimaciones();
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

  // Las opciones entran una tras otra con resorte; Plantillas CV rebota un poco mas
  private animarEntrada(){
    this.terminarAnimaciones();
    const lista = this.menu?.nativeElement.querySelector('.menu-lista');
    if(!lista){
      return;
    }
    const opciones = Array.from(lista.querySelectorAll<HTMLElement>(':scope > li:not(.menu-separador)'));
    const separadores = Array.from(lista.querySelectorAll<HTMLElement>(':scope > .menu-separador'));
    const destacado = lista.querySelector<HTMLElement>('.enlace-destacado');

    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      this.animaciones.push(animate(opciones, { opacity: [0, 1] }, { duration: 0.2 }));
      return;
    }

    const paso = 0.06;
    const retrasoInicial = 0.1;
    this.animaciones.push(
      animate(opciones, { opacity: [0, 1], y: [28, 0] }, { type: 'spring', bounce: 0.3, duration: 0.6, delay: stagger(paso, { startDelay: retrasoInicial }) }),
      animate(separadores, { scaleX: [0, 1], opacity: [0, 1] }, { duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: stagger(0.12, { startDelay: retrasoInicial + paso }) })
    );
    if(destacado){
      const indice = opciones.findIndex(opcion => opcion.contains(destacado));
      this.animaciones.push(
        animate(destacado, { scale: [0.8, 1] }, { type: 'spring', bounce: 0.5, duration: 0.7, delay: retrasoInicial + paso * indice })
      );
    }
  }

  // Al cerrar o reabrir rapido, cada opcion queda en su estado final
  private terminarAnimaciones(){
    this.animaciones.forEach(animacion => animacion.complete());
    this.animaciones = [];
  }

  private enfocarDespuesDeRenderizar(boton?: ElementRef<HTMLElement>){
    setTimeout(() => boton?.nativeElement.focus());
  }

  public logout(){
    this.authService.loggout();
    this.routes.navigate(['login']);
  }


}