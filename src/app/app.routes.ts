import { Routes } from "@angular/router";
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { ProfileComponent } from './components/profile/profile.component';
import { canActivate, redirectUnauthorizedTo } from '@angular/fire/compat/auth-guard';
import { IotaComponent } from "./shared/TEMPLATES/iota/iota.component";
import { SliderTemplatesComponent } from './components/slider-templates/slider-templates.component';
import { FormContactComponent } from './components/form-contact/form-contact.component';
import { CurriculumsComponent } from './shared/components/curriculus/curriculums.component';

// Sin un destino, el guard solo cancela la navegacion y la pagina queda en blanco.
const requiereSesion = canActivate(() => redirectUnauthorizedTo(['login']));

export const ROUTES: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'home'},
    { path: 'home', component: HomeComponent },

// COMPONENTS
    { path: 'login', component: LoginComponent },
    { path: 'profile', component: ProfileComponent, ...requiereSesion },
    { path: 'galeria', component: SliderTemplatesComponent, ...requiereSesion },
    { path: 'contacto', component: FormContactComponent, ...requiereSesion },
    
    // TEMPLATES
    { path: 'iota', component: IotaComponent, ...requiereSesion },
    
    // SHARED
    { path: 'curriculums', component: CurriculumsComponent },


]