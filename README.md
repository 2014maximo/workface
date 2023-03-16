
EDITAR REGLAS FIREBASE
1. npm install -g firebase-tools
   instalar las herramientas de comandos de gestión de firebase.

2. firebase login
   Iniciar sesión con el administrador de firebase

3. firebase init
   Iniciar la consola de gestión de bases de datos firebase

4. Leer opciones según el caso.

5. firebase deploy
   Subir los cambios y aplicarlos.

LIBRERIAS USADAS
- jspdf & html2canvas
npm install jspdf html2canvas --save

DOCUMENTACION FIREBASE
https://firebase.google.com/docs/storage/web/start?hl=es

PROCESO GITHUB-PAGES
1. Se cre un nuevo repositorio público en github con proyecto angular dentro y funcional.

2. Cambiar texto del archivo (angular.json) en la linea que contenga "outputPath". La línea de código queda:
   "outputPath": "dist",

3. Instalar el GITHUB-PAGES dentro del proyecto con el comando:
   npm i angular-cli-ghpages

4. Verificar en github en settings - pages - source que la rama este marcada como gh-pages, sino le damos save.


5. Se crea la carpeta 'build' compilada del proyecto ejecuntado este comando:
   ng build --prod --base-href="./"

6. Se sube el proyecto y se deploya de una vez con el comando:
   npx angular-cli-ghpages – dir=dist

SUBIR CAMBIOS A GITHUB(última versión)
ng build --prod --base-href https://2014maximo.github.io/workface/
npx angular-cli-ghpages --branch gh-pages
