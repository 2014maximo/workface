import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import { environment } from '../../environments/environment.prod';

firebase.initializeApp(environment.firebase);

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  public storageRef = firebase.app().storage().ref();

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
      return  await respuesta.ref.getDownloadURL();

    }catch(err){
      console.error(err);
      return null;
      
    }
  }

  dropImg(){
    this.storageRef.delete()
  }

}
