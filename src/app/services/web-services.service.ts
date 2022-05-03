import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebServicesService {

  private paises: string = 'http://country.io/names.json'

  constructor( ) { }

  consultarPaises(){
    
  }
}
