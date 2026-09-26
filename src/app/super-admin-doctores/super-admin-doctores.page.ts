import { Component, OnInit, inject, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { MedicosService, Medico } from '../services/medico.service'; 
import { FirebaseService, Specialty } from '../services/specialties'; 
import { Subscription } from 'rxjs';
import emailjs from '@emailjs/browser'; // <-- IMPORTA EMAILJS


@Component({
  selector: 'app-super-admin-doctors',
  templateUrl: './super-admin-doctores.page.html',
  styleUrls: ['./super-admin-doctores.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class SuperAdminDoctoresPage implements OnInit, OnDestroy {

  private medicosService = inject(MedicosService);
  private specialtiesService = inject(FirebaseService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);


  // Listas
  medicos: Medico[] = [];
  especialidades: Specialty[] = [];
  
  private subMedicos?: Subscription;
  private subEspecialidades?: Subscription;

  // Formulario
  nombre = '';
  descripcion = '';
  especialidadId = '';
  editando = false;
  doctorEditandoId: string | null = null;
  correo: string = '';

  // Buscador
  busqueda = '';

  ngOnInit() {
    this.cargarMedicos();
    this.cargarEspecialidades();
  }

  cargarMedicos() {
    this.subMedicos = this.medicosService.getMedicos().subscribe({
      next: (data) => {
        this.medicos = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando doctores:', err)
    });
  }

  cargarEspecialidades() {
    this.subEspecialidades = this.specialtiesService.getSpecialties().subscribe({
      next: (data) => {
        this.especialidades = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando especialidades:', err)
    });
  }

  async guardarMedico() {
    const otpAlfanumerico = Math.random().toString(36).substring(2, 8).toUpperCase();
    const nombreLimpio = this.nombre.trim();
    const descripcionLimpia = this.descripcion.trim();
    const correoLimpio = this.correo.trim();

    if (!nombreLimpio || !correoLimpio || !this.especialidadId) {
      await this.mostrarMensaje('Llene todos los campos obligatorios');
      return;
    }

    const espSeleccionada = this.especialidades.find(e => e.id === this.especialidadId);
    const especialidadNombre = espSeleccionada ? espSeleccionada.nombre : 'Sin especialidad';

    try {
      if (this.editando && this.doctorEditandoId) {
        // LÓGICA PARA ACTUALIZAR (NO ENVÍA CORREO)
        await this.medicosService.updateMedico({
          id: this.doctorEditandoId,
          nombre: nombreLimpio,
          correo: correoLimpio,
          descripcion: descripcionLimpia,
          especialidadId: this.especialidadId,
          especialidadNombre: especialidadNombre
        });
        await this.mostrarMensaje('Doctor actualizado correctamente');
      } else {
        // 1. LÓGICA PARA CREAR NUEVO EN FIRESTORE
        await this.medicosService.addMedico({
          nombre: nombreLimpio,
          correo: correoLimpio,
          descripcion: descripcionLimpia,
          especialidadId: this.especialidadId,
          especialidadNombre: especialidadNombre,
          activo: false, // Se crea inactivo hasta que él complete su registro
          claveInicial: otpAlfanumerico // Guardamos el OTP temporal en la base de datos
        });

        // 2. ENVIAR CORREO CON EMAILJS
        // Este enlace es al que le dará clic el doctor (luego deberás crear esta página en Ionic)
        const enlaceRegistro = `http://localhost:8100/register-doctor?correo=${encodeURIComponent(correoLimpio)}`;

        const templateParams = {
          nombre_doctor: nombreLimpio,
          to_email: correoLimpio,
          enlace_registro: enlaceRegistro,
          otp_clave: otpAlfanumerico
        };

        // Enviar usando tus credenciales
        await emailjs.send(
          'service_7pqzuoa',       // Tu Service ID
          'template_btg8dky',      // Tu Template ID
          templateParams,
          'mslLWu6gaV1YfYjVW'      // Tu Public Key
        );

        await this.mostrarMensaje('Doctor creado e invitación enviada al correo');
      }

      this.limpiarFormulario();
    } catch (error) {
      console.error('Error al guardar o enviar correo:', error);
      await this.mostrarMensaje('Ocurrió un error al guardar o enviar el correo');
    }
  }


  editarMedico(medico: Medico) {
    this.nombre = medico.nombre;
    this.correo = medico.correo || '';
    this.descripcion = medico.descripcion || '';
    this.especialidadId = medico.especialidadId || '';
    this.editando = true;
    this.doctorEditandoId = medico.id || null;

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

async cambiarEstado(medico: Medico) {
    if (!medico.id) return;
    try {
      await this.medicosService.updateMedico({
        id: medico.id,
        nombre: medico.nombre,
        correo: medico.correo, // <--- ¡AGREGA ESTA LÍNEA para no perder el correo!
        descripcion: medico.descripcion,
        especialidadId: medico.especialidadId,
        especialidadNombre: medico.especialidadNombre,
        activo: !medico.activo
      });
      await this.mostrarMensaje(medico.activo ? 'Doctor inactivado' : 'Doctor activado');
    } catch (error) {
      console.error('Error cambiando estado:', error);
    }
  }

  async eliminarMedico(medico: Medico) {
    const alert = await this.alertController.create({
      header: 'Eliminar Doctor',
      message: `¿Está seguro de eliminar al Dr(a). "${medico.nombre}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              if (medico.id) {
                await this.medicosService.deleteMedico(medico.id);
                await this.mostrarMensaje('Doctor eliminado');
              }
            } catch (error) {
              console.error('Error eliminando:', error);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  limpiarFormulario() {
    this.nombre = '';
    this.correo = '';
    this.descripcion = '';
    this.especialidadId = '';
    this.editando = false;
    this.doctorEditandoId = null;
  }

  get doctoresFiltrados() {
    const texto = this.busqueda.trim().toLowerCase();
    if (!texto) return this.medicos;
    return this.medicos.filter(doc => 
      doc.nombre.toLowerCase().includes(texto) || 
      (doc.especialidadNombre && doc.especialidadNombre.toLowerCase().includes(texto))
    );
  }

  volver() {
    this.router.navigate(['/super-admin']);
  }

  async mostrarMensaje(mensaje: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  

  ngOnDestroy() {
    this.subMedicos?.unsubscribe();
    this.subEspecialidades?.unsubscribe();
  }
  
}