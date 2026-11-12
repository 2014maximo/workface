import { Routes } from "@angular/router";
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { ProfileComponent } from './components/profile/profile.component';
import { canActivate, redirectUnauthorizedTo } from '@angular/fire/compat/auth-guard';
import { AlphaComponent } from "./shared/TEMPLATES/alpha/alpha.component";
import { GaleriaTemplatesComponent } from "./components/galeria-templates/galeria-templates.component";
import { BetaComponent } from "./shared/TEMPLATES/beta/beta.component";
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
    { path: 'templates', component: GaleriaTemplatesComponent, ...requiereSesion },
    { path: 'galeria', component: SliderTemplatesComponent, ...requiereSesion },
    { path: 'contacto', component: FormContactComponent, ...requiereSesion },
    
    // TEMPLATES
    { path: 'alpha', component: AlphaComponent, ...requiereSesion },
    { path: 'beta', component: BetaComponent, ...requiereSesion },
    { path: 'iota', component: IotaComponent, ...requiereSesion },
    
    // SHARED
    { path: 'curriculums', component: CurriculumsComponent },


]