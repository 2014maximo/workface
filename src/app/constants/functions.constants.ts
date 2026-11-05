import Compressor from 'compressorjs';
import { toJpeg } from 'html-to-image';
import Swal from 'sweetalert2';

export function SweetAlert(icon: any, message: string){

    let TOAST = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer)
          toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
      });
    
      TOAST.fire({
        icon: icon,
        title: message
      });
}

// Ancho de una hoja carta en puntos. El alto se ajusta para que el CV ocupe una sola pagina.
const ANCHO_PDF = 612;

// Pixel transparente: junto con onImageErrorHandler permite generar el CV aunque falle una imagen.
const IMAGEN_NO_DISPONIBLE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export async function descargarCv(idElemento: string, formato: 'jpeg' | 'pdf'){
    try {
        const elemento = document.getElementById(idElemento);
        if(!elemento){
            throw new Error('No existe el elemento ' + idElemento);
        }

        const imagen = await toJpeg(elemento, {
            quality: 0.95,
            imagePlaceholder: IMAGEN_NO_DISPONIBLE,
            onImageErrorHandler: () => undefined
        });

        if(formato === 'jpeg'){
            const enlace = document.createElement('a');
            enlace.download = 'curriculum.jpeg';
            enlace.href = imagen;
            enlace.click();
            return;
        }

        // jsPDF se carga solo cuando se necesita para no aumentar la carga inicial de la app.
        const { jsPDF } = await import('jspdf');
        const altoPdf = ANCHO_PDF * elemento.offsetHeight / elemento.offsetWidth;
        const pdf = new jsPDF({ unit: 'pt', format: [ANCHO_PDF, altoPdf] });
        pdf.addImage(imagen, 'JPEG', 0, 0, ANCHO_PDF, altoPdf);
        pdf.save('curriculum.pdf');
    } catch(error) {
        console.error(error);
        SweetAlert('error', 'No se pudo generar el archivo');
    }
}

export interface OpcionesImagen {
    anchoMaximo: number;
    formato: 'image/jpeg' | 'image/png';
}

export function comprimirImagen(archivo: Blob, opciones: OpcionesImagen): Promise<Blob> {
    return new Promise((resolver, rechazar) => {
        new Compressor(archivo, {
            maxWidth: opciones.anchoMaximo,
            mimeType: opciones.formato,
            quality: 0.8,
            // Evita que un PNG grande pase a JPEG y pierda la transparencia.
            convertSize: Infinity,
            success: resolver,
            error: rechazar
        });
    });
}

export function leerComoBase64(archivo: Blob): Promise<string> {
    return new Promise((resolver, rechazar) => {
        const lector = new FileReader();
        lector.onload = () => resolver(lector.result as string);
        lector.onerror = () => rechazar(lector.error);
        lector.readAsDataURL(archivo);
    });
}

// Para habilidades que no estan en el catalogo. Usa el mismo formato de los iconos del catalogo.
export const ICONO_HABILIDAD_GENERICO = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m12 17.75l-6.172 3.245l1.179-6.873l-5-4.867l6.9-1l3.086-6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z"/></svg>';

// Un SVG dentro de <img> no hereda el color: se le aplica antes de mostrarlo.
export function svgComoImagen(svg: string, color: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg.replaceAll('currentColor', color))}`;
}
