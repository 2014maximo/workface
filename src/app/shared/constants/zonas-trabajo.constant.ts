import { SitioTrabajo } from '../models/sitio-trabajo.model';

/*
 * Sitios del home: ZONA DE TRABAJO REMOTO y ZONA FREELANCE.
 * Para agregar uno, copia un bloque { ... } y cambia sus datos.
 * - url: el enlace directo del sitio (para empresas, su página de empleos).
 * - region: 'global', 'latam' o 'europa'.
 * - descripcion: una frase corta en es, en y fr.
 * Solo sitios reales con el enlace revisado. Sin logos, para no usar marcas ajenas.
 */

/** Bolsas de empleo con ofertas remotas */
export const BOLSAS_REMOTAS: readonly SitioTrabajo[] = [
    {
        nombre: 'Get on Board',
        url: 'https://www.getonbrd.com',
        region: 'latam',
        descripcion: {
            es: 'Empleos de tecnología en Latinoamérica, muchos de ellos remotos.',
            en: 'Tech jobs in Latin America, many of them remote.',
            fr: 'Emplois tech en Amérique latine, dont beaucoup à distance.',
        },
    },
    {
        nombre: 'Torre',
        url: 'https://torre.ai',
        region: 'latam',
        descripcion: {
            es: 'Red de empleo con raíces en Latinoamérica.',
            en: 'Job network with roots in Latin America.',
            fr: 'Réseau d’emploi aux racines latino-américaines.',
        },
    },
    {
        nombre: 'Remotive',
        url: 'https://remotive.com',
        region: 'global',
        descripcion: {
            es: 'Empleos 100 % remotos en tecnología y otras áreas.',
            en: 'Fully remote jobs in tech and other fields.',
            fr: 'Emplois 100 % à distance, dans la tech et ailleurs.',
        },
    },
    {
        nombre: 'Remote OK',
        url: 'https://remoteok.com',
        region: 'global',
        descripcion: {
            es: 'Una de las bolsas de empleo remoto más grandes.',
            en: 'One of the largest remote job boards.',
            fr: 'L’un des plus grands sites d’emploi à distance.',
        },
    },
    {
        nombre: 'We Work Remotely',
        url: 'https://weworkremotely.com',
        region: 'global',
        descripcion: {
            es: 'Ofertas remotas de empresas de todo el mundo.',
            en: 'Remote openings from companies around the world.',
            fr: 'Offres à distance d’entreprises du monde entier.',
        },
    },
    {
        nombre: 'Himalayas',
        url: 'https://himalayas.app',
        region: 'global',
        descripcion: {
            es: 'Empleos remotos que puedes filtrar por zona horaria.',
            en: 'Remote jobs you can filter by time zone.',
            fr: 'Emplois à distance filtrables par fuseau horaire.',
        },
    },
    {
        nombre: 'Working Nomads',
        url: 'https://www.workingnomads.com',
        region: 'global',
        descripcion: {
            es: 'Empleos remotos ordenados por categoría.',
            en: 'Remote jobs sorted by category.',
            fr: 'Emplois à distance classés par catégorie.',
        },
    },
];

/** Empresas que trabajan 100 % en remoto; el enlace va a su página de empleos */
export const EMPRESAS_REMOTAS: readonly SitioTrabajo[] = [
    {
        nombre: 'GitLab',
        url: 'https://about.gitlab.com/jobs/',
        region: 'global',
        descripcion: {
            es: 'Plataforma para desarrollar software; una de las empresas remotas más grandes.',
            en: 'Software development platform; one of the largest remote companies.',
            fr: 'Plateforme de développement logiciel ; l’une des plus grandes entreprises à distance.',
        },
    },
    {
        nombre: 'Automattic',
        url: 'https://automattic.com/work-with-us/',
        region: 'global',
        descripcion: {
            es: 'La empresa detrás de WordPress.com; su equipo está repartido por el mundo.',
            en: 'The company behind WordPress.com, with a team spread around the world.',
            fr: 'L’entreprise derrière WordPress.com, avec une équipe répartie dans le monde.',
        },
    },
    {
        nombre: 'Zapier',
        url: 'https://zapier.com/jobs',
        region: 'global',
        descripcion: {
            es: 'Conecta aplicaciones para automatizar tareas; equipo 100 % remoto.',
            en: 'Connects apps to automate work; fully remote team.',
            fr: 'Connecte des applications pour automatiser des tâches ; équipe 100 % à distance.',
        },
    },
    {
        nombre: 'Doist',
        url: 'https://doist.com/careers',
        region: 'global',
        descripcion: {
            es: 'Los creadores de Todoist; trabajan en remoto.',
            en: 'The makers of Todoist; they work remotely.',
            fr: 'Les créateurs de Todoist ; ils travaillent à distance.',
        },
    },
    {
        nombre: 'Buffer',
        url: 'https://buffer.com/journey',
        region: 'global',
        descripcion: {
            es: 'Herramientas para redes sociales; equipo totalmente remoto.',
            en: 'Social media tools; fully remote team.',
            fr: 'Outils pour les réseaux sociaux ; équipe entièrement à distance.',
        },
    },
    {
        nombre: '37signals',
        url: 'https://37signals.com/jobs',
        region: 'global',
        descripcion: {
            es: 'Los creadores de Basecamp y HEY; trabajan en remoto.',
            en: 'The makers of Basecamp and HEY; they work remotely.',
            fr: 'Les créateurs de Basecamp et HEY ; ils travaillent à distance.',
        },
    },
    {
        nombre: 'Help Scout',
        url: 'https://www.helpscout.com/company/careers/',
        region: 'global',
        descripcion: {
            es: 'Software de atención al cliente; equipo remoto.',
            en: 'Customer support software; remote team.',
            fr: 'Logiciel de service client ; équipe à distance.',
        },
    },
];

/** Plataformas para conseguir proyectos como freelance */
export const PLATAFORMAS_FREELANCE: readonly SitioTrabajo[] = [
    {
        nombre: 'Workana',
        url: 'https://www.workana.com',
        region: 'latam',
        descripcion: {
            es: 'Plataforma freelance enfocada en Latinoamérica.',
            en: 'Freelance platform focused on Latin America.',
            fr: 'Plateforme freelance tournée vers l’Amérique latine.',
        },
    },
    {
        nombre: 'Upwork',
        url: 'https://www.upwork.com',
        region: 'global',
        descripcion: {
            es: 'Proyectos de todo tipo con clientes de todo el mundo.',
            en: 'All kinds of projects with clients worldwide.',
            fr: 'Missions de tous types avec des clients du monde entier.',
        },
    },
    {
        nombre: 'Fiverr',
        url: 'https://www.fiverr.com',
        region: 'global',
        descripcion: {
            es: 'Ofreces tus servicios como paquetes con precio fijo.',
            en: 'Offer your services as fixed-price packages.',
            fr: 'Proposez vos services sous forme de forfaits à prix fixe.',
        },
    },
    {
        nombre: 'Freelancer',
        url: 'https://www.freelancer.com',
        region: 'global',
        descripcion: {
            es: 'Proyectos y concursos a los que envías propuestas.',
            en: 'Projects and contests you bid on.',
            fr: 'Projets et concours auxquels vous répondez par une offre.',
        },
    },
    {
        nombre: 'Toptal',
        url: 'https://www.toptal.com',
        region: 'global',
        descripcion: {
            es: 'Red de freelancers con proceso de selección.',
            en: 'Freelance network with a screening process.',
            fr: 'Réseau de freelances avec processus de sélection.',
        },
    },
    {
        nombre: 'Malt',
        url: 'https://www.malt.fr',
        region: 'europa',
        descripcion: {
            es: 'Plataforma freelance fuerte en Francia y Europa.',
            en: 'Freelance platform strong in France and Europe.',
            fr: 'Plateforme freelance bien implantée en France et en Europe.',
        },
    },
    {
        nombre: '99designs',
        url: 'https://99designs.com',
        region: 'global',
        descripcion: {
            es: 'Concursos y proyectos de diseño gráfico.',
            en: 'Graphic design contests and projects.',
            fr: 'Concours et projets de design graphique.',
        },
    },
    {
        nombre: 'Contra',
        url: 'https://contra.com',
        region: 'global',
        descripcion: {
            es: 'Portafolio y proyectos freelance sin comisión.',
            en: 'Portfolio and commission-free freelance work.',
            fr: 'Portfolio et missions freelance sans commission.',
        },
    },
    {
        nombre: 'PeoplePerHour',
        url: 'https://www.peopleperhour.com',
        region: 'europa',
        descripcion: {
            es: 'Proyectos freelance, con fuerza en Reino Unido.',
            en: 'Freelance projects, strongest in the UK.',
            fr: 'Missions freelance, surtout au Royaume-Uni.',
        },
    },
];
