import { Routes } from "@angular/router";
import { HomeComponent } from "./components/home/home.component";
import { LoginComponent } from "./components/PAGES/login/login.component";
import { InicioComponent } from './components/PAGES/inicio/inicio.component';
import { FormOneComponent } from "./components/ASK/form-one/form-one.component";


export const ROUTES: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'home'},
    { path: 'home', component: HomeComponent },
// PAGES
    { path: 'login', component: LoginComponent },
    { path: 'inicio', component: InicioComponent},
    { path: 'form-one', component: FormOneComponent},
// ASK

]