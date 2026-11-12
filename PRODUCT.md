# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Profesionales con experiencia que quieren actualizar su hoja de vida y cuidar la imagen que proyecta. Muchos la llenarán desde el celular.

## Product Purpose

Workface permite crear una hoja de vida: la persona llena sus datos una sola vez, elige una plantilla y la descarga en PDF o como imagen.

El proyecto está en desarrollo y aún no tiene usuarios reales.

## Positioning

Workface se distingue por la calidad de sus plantillas: el valor principal es el aspecto de las hojas de vida que se descargan.

## Operating Context

- Flujo principal: iniciar sesión, llenar el perfil (datos personales, estudios, experiencia laboral, habilidades, intereses y referencias), cargar foto, fondo y firma, elegir plantilla y descargar.
- El resultado final es un archivo PDF o JPEG que la persona descarga.

## Capabilities and Constraints

- Inicio de sesión con Firebase Authentication (correo y contraseña o Google); las rutas privadas redirigen a `/login`.
- El plan gratuito guarda el perfil y las imágenes en IndexedDB, solo en el navegador del usuario: no se sincronizan entre dispositivos.
- Plantillas actuales: `alpha` y `beta`, exportadas en PDF y JPEG mediante `html-to-image` y `jsPDF` (el PDF es una imagen, sin texto). Lo que se muestra en ellas debe poder capturarse correctamente.
- Plantilla `iota`: pensada para sistemas ATS. Su PDF se dibuja con texto real en hoja carta (`jsPDF` con la fuente Atkinson Hyperlegible incrustada), en una columna, con encabezados estándar y foto opcional. No incluye identificación, fecha de nacimiento, género ni referencias.
- Sitio publicado en GitHub Pages.
- Prioridad a móvil: el flujo debe funcionar bien en el celular.
- Las plantillas `alpha` y `beta` quedan fuera del trabajo con Impeccable: no se auditan ni se modifican con esta herramienta.
- Decisión abierta: los planes de pago aún no están definidos.

## Brand Commitments

Se conserva la identidad actual de Workface: el nombre, el logo y el fondo oscuro.

## Evidence on Hand

No hay testimonios, clientes, métricas ni casos reales. No se deben inventar.

## Product Principles

1. La hoja de vida descargada es el producto: ninguna decisión de la interfaz debe restarle calidad.
2. Los datos se escriben una sola vez y sirven para todas las plantillas.
3. El flujo completo debe poder hacerse desde el celular.
