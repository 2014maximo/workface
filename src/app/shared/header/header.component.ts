import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserFirebase } from '../../models/usuario.model';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  public userLogged = this.authService.getUserLogged();

  public abrirMenu: string = '';
  public iconAbrir: boolean = true;
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
    console.log(document.location.href.includes('login'));

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
    this.abrirMenu = 'menu-hamburger-open';
    this.iconAbrir = false;
  }

  public cierreMenu(){
    this.abrirMenu = 'menu-hamburger-close';
    this.iconAbrir = true;
  }

  public logout(){
    this.authService.loggout();
    this.routes.navigate(['login']);
  }


}