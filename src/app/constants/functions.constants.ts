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
