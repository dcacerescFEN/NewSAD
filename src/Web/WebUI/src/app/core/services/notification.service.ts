import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  showSuccess(title: string, message: string) {
    Swal.fire({
      title: title,
      text: message,
      showConfirmButton: false,
      showCloseButton: true,
      timer: 3000,
      toast: true,
      position: 'top-end',
      customClass: {
          popup: 'notificacion-success',
      }
    });
  }

  showError(title: string, message: string) {
    Swal.fire({
      title: title,
      text: message,
      showConfirmButton: false,
      showCloseButton: true,
      timer: 3000,
      toast: true,
      position: 'top-end',
      customClass: {
          popup: 'notificacion-error'
      }
    });
  }

  showDefaultError() {
    this.showError("Error", "Oh a ocurrido un error, por favor notifique al administrador del sistema");
  }

  showInvalidFormError() {
    this.showError("Error", "Favor ingresar todos los campos requeridos");
  }

  confirm(title: string, message: string, confirmButtonText: string, cancelButtonText: string) {
    return Swal.fire({
      title: title,
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: confirmButtonText,
      cancelButtonText: cancelButtonText,
      customClass: {
        popup: 'notificacion-confirm'
      }
    });
  }
}
