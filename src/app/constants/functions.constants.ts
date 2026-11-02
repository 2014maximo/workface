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
