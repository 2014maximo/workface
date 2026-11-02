import { EnvironmentInjector, Injectable, inject, runInInjectionContext } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { environment } from '../../environments/environment.prod';
import 'firebase/compat/storage';
import firebase from 'firebase/compat/app';

firebase.initializeApp(environment.firebase);

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  public storageRef = firebase.app().storage().ref();
  public urlImg:any;
  public metaDatos:any;
  private injector = inject(EnvironmentInjector);

  constructor(private firestore: AngularFirestore) {
  }

  // collection() y doc() de @angular/fire usan inject(), asi que deben ejecutarse en un contexto de inyeccion.
  private enContexto<T>(operacion: () => T): T {
    return runInInjectionContext(this.injector, operacion);
  }

  async create(collection: string, data: any){
    try {
      return await this.enContexto(() => this.firestore.collection(collection).add(data));
    }catch(error){
      console.error(error);
      return null
    }
  }

  async createUid(collection: string, data: any, uid: string){
    try {
      return await this.enContexto(() => this.firestore.collection(collection).doc(uid).set(data));
    }catch(error){
      console.error(error);
      return null
    }
  }

  async getById(collection: any, id:any){
    try {
      return await this.enContexto(() => this.firestore.collection(collection).doc(id).get());
    } catch(error){
      console.error(error);
      return null
    }
  }

  async update(collection: string, id: any, data:any){
    try {
      return await this.enContexto(() => this.firestore.collection(collection).doc(id).update(data));
    } catch(error){
      console.error(error);
      return null
    }
  }

  async loadImg(categoria: string, nombre: string, imgBase64: any){
    try{
      let respuesta = await this.storageRef.child(categoria + nombre).putString(imgBase64, 'data_url');
      
      respuesta.ref.getDownloadURL().then( respuesta => {
        this.urlImg = respuesta? respuesta : null;


        // `url` is the download URL for 'images/stars.jpg'

    // This can be downloaded directly:
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = (event) => {
      const blob = xhr.response;
      console.log(event, 'XHR ONLOAD EVENT');
    };
    xhr.open('GET', respuesta);
    xhr.send();






      });
      respuesta.ref.getMetadata().then( datos => {
        console.log(datos, 'QUE')
        this.metaDatos = datos? datos : null;
      })

        return  await respuesta.ref.getDownloadURL();
       

    }catch(err){
      console.error(err);
      return null;
      
    }
  }

}
