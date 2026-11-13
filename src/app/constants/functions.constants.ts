import Compressor from 'compressorjs';
import Swal from 'sweetalert2';

// Un mensaje largo necesita mas tiempo en pantalla: se puede pasar la duracion en milisegundos.
export function SweetAlert(icon: any, message: string, duracion: number = 3000){

    let TOAST = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: duracion,
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
