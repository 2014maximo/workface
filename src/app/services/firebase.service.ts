import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(private firestore: AngularFirestore) {
  }

  async create(collection: string, data: any){

    console.log(collection, data, 'LO QUE SE PIENSA MANDAR');
    try {
      return await this.firestore.collection(collection).add(data);
    }catch(error){
      console.error(error);
      return null
    }
  }
}
