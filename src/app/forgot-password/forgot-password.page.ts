import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { FirebaseService } from '../services/firebase.service'; // Ajusta la ruta a tu servicio
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class ForgotPasswordPage {
  email: string = '';

  private firebaseService = inject(FirebaseService);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);
  private router = inject(Router);

  async resetPassword() {
    if (!this.email || this.email.trim() === '') {
      this.presentToast('Por favor, ingresa tu correo electrónico', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Enviando enlace...',
    });
    await loading.present();

    try {
      // Llamamos al servicio de Firebase
      await this.firebaseService.recoverPassword(this.email);
      await loading.dismiss();
      
      this.presentToast('Te hemos enviado un correo para restablecer tu contraseña.', 'success');
      
      // Opcional: Redirigir al usuario de vuelta al login
      this.router.navigate(['/login']);
      
    } catch (error: any) {
      await loading.dismiss();
      console.error(error);
      
      // Manejo de errores comunes de Firebase
      if (error.code === 'auth/user-not-found') {
        this.presentToast('No existe ninguna cuenta con este correo.', 'danger');
      } else if (error.code === 'auth/invalid-email') {
        this.presentToast('El formato del correo es inválido.', 'danger');
      } else {
        this.presentToast('Ocurrió un error al intentar enviar el correo.', 'danger');
      }
    }
  }

  async presentToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    toast.present();
  }
}
