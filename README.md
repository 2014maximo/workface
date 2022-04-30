

PROCESO GITHUB-PAGES
1. Se cre un nuevo repositorio público en github con proyecto angular dentro y funcional.

2. Cambiar texto del archivo (angular.json) en la linea que contenga "outputPath". La línea de código queda:
   "outputPath": "dist",

3. Instalar el GITHUB-PAGES con el comando:
   npm i angular-cli-ghpages

4. Verificar en github en settings - pages - source que la rama este marcada como gh-pages, sino le damos save.

5. Se crea la carpeta 'build' compilada del proyecto ejecuntado este comando:
   ng build --prod --base-href="./"

6. Se sube el proyecto y se deploya de una vez con el comando:
   npx angular-cli-ghpages – dir=dist

