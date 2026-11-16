import type { Idioma } from '../../services/idioma.service';

/** Zona del mundo donde el sitio tiene más ofertas. Su nombre se traduce en zonas.region.* */
export type RegionSitio = 'global' | 'latam' | 'europa';

export interface SitioTrabajo {
    nombre: string;
    /** Enlace directo, sin parámetros de afiliado ni de seguimiento */
    url: string;
    region: RegionSitio;
    /** Una frase corta en cada idioma de Workface; si falta uno, el build falla */
    descripcion: Record<Idioma, string>;
}

export interface GrupoSitios {
    /** Clave de traducción del subtítulo del grupo; sin ella el grupo va sin subtítulo */
    titulo?: string;
    sitios: readonly SitioTrabajo[];
}
