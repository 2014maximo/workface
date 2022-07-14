import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { environment } from '../../environments/environment.prod';
import 'firebase/compat/storage';
import { getStorage, ref, deleteObject } from "firebase/storage";
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
        this.metaDatos = datos? datos : null;
      })

        return  await respuesta.ref.getDownloadURL();
       

    }catch(err){
      console.error(err);
      return null;
      
    }
  }

  dropImg(){
    const storage = getStorage();
    const desertRef = ref(storage, 'images/desert.jpg');
    this.storageRef.delete()
  }

}
