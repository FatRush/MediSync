import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { MedicosService } from '../services/medico.service';

@Component({
  selector: 'app-register-doctor',
  templateUrl: './register-doctor.page.html',
  styleUrls: ['./register-doctor.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class RegisterDoctorPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private medicosService = inject(MedicosService);
  private alertController = inject(AlertController);
  private loadingController = inject(LoadingController);

  // Variables vinculadas al formulario con ngModel
  correoInput: string = '';
  claveInicialInput: string = '';
  telefonoInput: string = '';
  passwordNuevaInput: string = '';
  rol: string = 'doctor';

  // Datos internos del doctor encontrado en Firestore
  medicoId: string = '';
  claveEsperada: string = '';

  async ngOnInit() {
    this.route.queryParams.subscribe(async (params) => {
      if (params['correo']) {
        this.correoInput = params['correo'];
        await this.cargarDatosDoctor(this.correoInput);
      }
    });
  }

  async cargarDatosDoctor(correo: string) {
    // Definimos la estructura esperada o usamos un tipo parcial
    const medicoEncontrado: any = await this.medicosService.obtenerMedicoPorCorreo(correo);
    
    if (medicoEncontrado) {
      this.medicoId = medicoEncontrado.id || '';
      // Usamos una aserción o validación segura para evitar el error de TypeScript
      this.claveEsperada = medicoEncontrado.claveInicial ?? '';
    } else {
      this.mostrarAlerta('Aviso', 'No se encontró un registro pendiente para este correo.');
    }
  }

  async onActivarCuenta() {
    if (!this.correoInput || !this.claveInicialInput || !this.telefonoInput || !this.passwordNuevaInput) {
      this.mostrarAlerta('Campos incompletos', 'Por favor, completa todos los campos del formulario.');
      return;
    }

    if (this.passwordNuevaInput.length < 6) {
      this.mostrarAlerta('Contraseña débil', 'La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // if (this.claveInicialInput.trim() !== this.claveEsperada.trim()) {
    //   this.mostrarAlerta('Clave incorrecta', 'La clave inicial proporcionada no coincide con la enviada a tu correo.');
    //   return;
    // }

    const loading = await this.loadingController.create({
      message: 'Activando cuenta y creando credenciales...',
    });
    await loading.present();

    try {
      // AQUÍ SE PASAN EXACTAMENTE LOS 4 ARGUMENTOS QUE EXIGE EL SERVICIO
      await this.medicosService.activarDoctor(
        this.medicoId,           // 1. ID del documento
        this.correoInput,        // 2. Correo
        this.passwordNuevaInput, // 3. Contraseña de Authentication
        this.telefonoInput,  
            // 4. Teléfono
      );

      await loading.dismiss();
      
      const alert = await this.alertController.create({
        header: '¡Éxito!',
        message: 'Tu cuenta ha sido activada correctamente y registrada en Authentication.',
        buttons: [{
          text: 'Iniciar Sesión',
          handler: () => {
            this.router.navigate(['/doctor-home']);
          }
        }]
      });
      await alert.present();

    } catch (error: any) {
      await loading.dismiss();
      console.error('Fallo al activar:', error);
      
      let mensajeError = 'Ocurrió un error al activar la cuenta.';
      if (error.code === 'auth/email-already-in-use') {
        mensajeError = 'Este correo ya se encuentra registrado en el sistema.';
      } else if (error.code === 'auth/invalid-email') {
        mensajeError = 'El formato del correo electrónico no es válido.';
      }

      this.mostrarAlerta('Error de Registro', mensajeError);
    }
  }

  async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}