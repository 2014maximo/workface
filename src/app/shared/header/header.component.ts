import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  public abrirMenu: string = '';
  public iconAbrir: boolean = true;
  public returnHome: string = '';

  constructor(private route: ActivatedRoute) {
    this.inicializarVariables();
  }

  ngOnInit(): void {
  }

  // tslint:disable-next-line: typedef
  private inicializarVariables(){

    // tslint:disable-next-line: prefer-const
    let path = this.route.snapshot.url.join('/');

    if (path !== 'home'){
      this.returnHome = 'home';
    }else{
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

}