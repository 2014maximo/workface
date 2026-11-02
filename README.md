# Workface

Aplicación web para crear una hoja de vida: llenas tus datos una sola vez, eliges una plantilla y la descargas en PDF o como imagen.

**Sitio publicado:** <https://2014maximo.github.io/workface/>

> **Estado:** en desarrollo. El proyecto aún está incompleto y no tiene usuarios reales.

## Funcionalidades

- Registro, inicio de sesión (correo y contraseña o Google) y recuperación de contraseña.
- Formulario de perfil: datos personales, estudios, experiencia laboral, habilidades, intereses y referencias.
- Carga de foto, fondo y firma, con compresión automática de las imágenes en el navegador.
- Plantillas de hoja de vida (`alpha` y `beta`) con descarga en PDF y JPEG.
- Las rutas privadas redirigen a `/login` cuando no hay sesión.

## Tecnologías

| Área | Tecnología |
| --- | --- |
| Framework | Angular 21 (módulos, Zone.js y RxJS) con TypeScript 5.9 |
| Autenticación | Firebase Authentication, mediante `@angular/fire` |
| Almacenamiento | IndexedDB, mediante `idb` |
| Estilos e interfaz | Bootstrap 5, jQuery (slim) y SweetAlert2 |
| Imágenes | `compressorjs` |
| Exportación del CV | `html-to-image` y `jsPDF` |
| Pruebas | Karma y Jasmine |
| Despliegue | GitHub Pages, con `angular-cli-ghpages` |

Bootstrap y jQuery se cargan por CDN desde `src/index.html`.

### Dónde se guardan los datos

El plan gratuito guarda el perfil y las imágenes en **IndexedDB, solo en el navegador del usuario**: no se sincronizan entre dispositivos y se pierden si se borran los datos del sitio.

Firestore y Firebase Storage no se usan en este flujo. `FirebaseService` se conserva para los futuros planes de pago.

## Requisitos

- Node.js `^20.19`, `^22.12` o `>=24`
- [pnpm](https://pnpm.io/)
- Google Chrome, para ejecutar las pruebas

## Instalación

```bash
git clone https://github.com/2014maximo/workface.git
cd workface
pnpm install
pnpm start
```

La aplicación queda disponible en <http://localhost:4200>.

`pnpm-workspace.yaml` reemplaza el binario nativo de Rollup por su versión WebAssembly, porque el nativo falla con `SIGILL` en CPU que no tienen ciertas instrucciones.

## Comandos

| Comando | Descripción |
| --- | --- |
| `pnpm start` | Servidor de desarrollo con recarga en caliente |
| `pnpm build` | Build de producción en `dist/` |
| `pnpm watch` | Build de desarrollo en modo observación |
| `pnpm test` | Pruebas unitarias con Karma |

## Estructura del proyecto

```text
src/app/
├── components/         Páginas: home, login, profile, galería, contacto
├── shared/
│   ├── form-basic/     Formulario de perfil
│   ├── TEMPLATES/      Plantillas de hoja de vida (alpha, beta)
│   ├── header/         Encabezado y menú
│   └── footer/         Pie de página
├── services/           Autenticación, perfil local y Firebase
├── constants/          Datos fijos y funciones compartidas
├── models/             Modelos de datos
└── app.routes.ts       Rutas de la aplicación
```

## Despliegue en GitHub Pages

El sitio se sirve desde la rama `gh-pages`, así que hay que indicar el `base-href` al compilar. Sin él, la página no carga.

```bash
pnpm exec ng build --base-href https://2014maximo.github.io/workface/
pnpm exec angular-cli-ghpages --dir=dist
```

`angular-cli-ghpages` también genera el `404.html` que permite recargar rutas como `/workface/profile`.

Después de publicar, comprueba lo siguiente:

- En GitHub, **Settings > Pages** debe tener `gh-pages` como rama de origen.
- En Firebase, `2014maximo.github.io` debe estar en **Authentication > Settings > Authorized domains**. Sin eso falla el inicio de sesión con Google.

## Reglas de Firebase

Las reglas de Firestore están en `firestore.rules`. Para aplicar cambios:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

Documentación: [Firebase Storage para web](https://firebase.google.com/docs/storage/web/start?hl=es).

## Autor

Alex Muñoz: [GitHub](https://github.com/2014maximo) · [LinkedIn](https://linkedin.com/in/alex-uriel-munoz)
