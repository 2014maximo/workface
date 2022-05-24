import { Injectable } from '@angular/core';

import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(public auth: AngularFireAuth) { }

  async register(email: string, password: string){
    try {
      return await this.auth.createUserWithEmailAndPassword(email, password);
    } catch (err) {
      console.error(err);
      return null;
    }
  }
  
  async login(email: string, password: string){
    try {
      return await this.auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async resetPassword(email: string, password: string){
    try {
      return await this.auth.sendPasswordResetEmail(email);
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async loginGoogle(email: string, password: string){
    try {
      return await this.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    } catch(err){
      console.error(err);
      return null;
    }
  }

  async loginFacebook(email: string, password: string){
    try {
      return await this.auth.signInWithPopup(new firebase.auth.FacebookAuthProvider());
    } catch(err){
      console.error(err);
      return null;
    }
  }

  getUserLogged(){
    return this.auth.authState;
  }

  loggout(){
    this.auth.signOut();
  }

  

}
