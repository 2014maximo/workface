import { Routes } from "@angular/router";
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AngularFireAuthGuard } from '@angular/fire/compat/auth-guard';
import { AlphaComponent } from "./shared/TEMPLATES/alpha/alpha.component";
import { GaleriaTemplatesComponent } from "./components/galeria-templates/galeria-templates.component";
import { BetaComponent } from "./shared/TEMPLATES/beta/beta.component";

export const ROUTES: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'home'},
    { path: 'home', component: HomeComponent },

// COMPONENTS
    { path: 'login', component: LoginComponent },
    { path: 'profile', component: ProfileComponent, canActivate: [AngularFireAuthGuard] },
    { path: 'templates', component: GaleriaTemplatesComponent, canActivate: [AngularFireAuthGuard] },
    
    // TEMPLATES
    { path: 'alpha', component: AlphaComponent, canActivate: [AngularFireAuthGuard] },
    { path: 'beta', component: BetaComponent, canActivate: [AngularFireAuthGuard] },

]