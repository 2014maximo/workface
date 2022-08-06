import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { environment } from '../../environments/environment.prod';
import 'firebase/compat/storage';
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import firebase from 'firebase/compat/app';

firebase.initializeApp(environment.firebase);

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  public storageRef = firebase.app().storage().ref();
  public urlImg:any;
  public metaDatos:any;

  constructor(private firestore: AngularFirestore) {
  }

  async create(collection: string, data: any){
    try {
      return await this.firestore.collection(collection).add(data);
    }catch(error){
      console.error(error);
      return null
    }
  }

  async createUid(collection: string, data: any, uid: string){
    try {
      return await this.firestore.collection(collection).doc(uid).set(data);
    }catch(error){
      console.error(error);
      return null
    }
  }

  async getById(collection: any, id:any){
    try {
      return await this.firestore.collection(collection).doc(id).get();
    } catch(error){
      console.error(error);
      return null
    }
  }

  async update(collection: string, id: any, data:any){
    try {
      return await this.firestore.collection(collection).doc(id).update(data);
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

  dropImg(){
    // Crear una referencia con una ruta y un nombre de archivo iniciales
/*     const storage = getStorage();
    const pathReference = ref(storage, 'fondo/img_1657769247581'); */

    // Crear una referencia a partir de un URI de Google Cloud Storage
/*     this.storageRef.delete() */
  
  // Create a reference to the file we want to download
const storage = getStorage();
const starsRef = ref(storage, 'fondo/img_1657769247581');

// Get the download URL
getDownloadURL(starsRef)
  .then((url) => {
    // Insert url into an <img> tag to "download"
  })
  .catch((error) => {
    // A full list of error codes is available at
    // https://firebase.google.com/docs/storage/web/handle-errors
    switch (error.code) {
      case 'storage/object-not-found':
        // File doesn't exist
        break;
      case 'storage/unauthorized':
        // User doesn't have permission to access the object
        break;
      case 'storage/canceled':
        // User canceled the upload
        break;

      // ...

      case 'storage/unknown':
        // Unknown error occurred, inspect the server response
        break;
    }
  });
  }

}
