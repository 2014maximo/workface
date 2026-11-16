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

// canActivate() guarda el guard en data (authGuardPipe): los datos de SEO se suman, no lo reemplazan
const privada = (seo: string) => ({ ...requiereSesion, data: { ...requiereSesion.data, seo } });

export const ROUTES: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'home'},
    { path: 'home', component: HomeComponent, data: { seo: 'inicio', indexable: true } },

// COMPONENTS
    { path: 'login', component: LoginComponent, data: { seo: 'login' } },
    { path: 'profile', component: ProfileComponent, ...privada('perfil') },
    { path: 'galeria', component: SliderTemplatesComponent, ...privada('galeria') },
    { path: 'contacto', component: FormContactComponent, ...privada('contacto') },
    
    // TEMPLATES
    { path: 'iota', component: IotaComponent, ...privada('galeria') },
    
    // SHARED
    { path: 'curriculums', component: CurriculumsComponent },


]