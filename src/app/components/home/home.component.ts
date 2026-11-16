import { Component } from '@angular/core';
import { GrupoSitios } from '../../shared/models/sitio-trabajo.model';
import { BOLSAS_REMOTAS, EMPRESAS_REMOTAS, PLATAFORMAS_FREELANCE } from '../../shared/constants/zonas-trabajo.constant';

@Component({
  standalone: false,
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  readonly zonaRemota: readonly GrupoSitios[] = [
    { titulo: 'zonas.bolsas', sitios: BOLSAS_REMOTAS },
    { titulo: 'zonas.empresas', sitios: EMPRESAS_REMOTAS },
  ];
  readonly zonaFreelance: readonly GrupoSitios[] = [
    { sitios: PLATAFORMAS_FREELANCE },
  ];
}
