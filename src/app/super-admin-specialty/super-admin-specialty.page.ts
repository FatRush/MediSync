import { Component, OnInit, inject, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { FirebaseService, Specialty } from '../services/specialties';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-super-admin-specialty',
  templateUrl: './super-admin-specialty.page.html',
  styleUrls: ['./super-admin-specialty.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})
export class SuperAdminSpecialtyPage implements OnInit, OnDestroy {

  private firebaseService = inject(FirebaseService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // Lista vinculada al HTML
  especialidades: Specialty[] = [];
  private subscription?: Subscription;

  // Formulario
  nombre = '';
  descripcion = '';
  editando = false;
  especialidadEditandoId: string | null = null;

  // Buscador
  busqueda = '';

  ngOnInit() {
    this.cargarEspecialidades();
  }

  // =====================================
  // CARGAR USANDO EL SERVICIO
  // =====================================
  cargarEspecialidades() {
    this.subscription = this.firebaseService.getSpecialties().subscribe({
      next: (data: Specialty[]) => {
        this.especialidades = data;
        this.cdr.detectChanges(); // Fuerza actualización visual inmediata
      },
      error: (error) => {
        console.error('Error cargando especialidades:', error);
      }
    });
  }

  // =====================================
  // GUARDAR / EDITAR
  // =====================================
  async guardarEspecialidad() {
    const nombreLimpio = this.nombre.trim();
    const descripcionLimpia = this.descripcion.trim();

    if (!nombreLimpio) {
      await this.mostrarMensaje('Ingrese el nombre de la especialidad');
      return;
    }

    try {
      if (this.editando && this.especialidadEditandoId) {
        // EDITAR vía servicio
        await this.firebaseService.updateSpecialty({
          id: this.especialidadEditandoId,
          nombre: nombreLimpio,
          descripcion: descripcionLimpia
        });
        await this.mostrarMensaje('Especialidad actualizada correctamente');
      } else {
        // CREAR vía servicio
        await this.firebaseService.addSpecialty({
          nombre: nombreLimpio,
          descripcion: descripcionLimpia,
          activo: true
        });
        await this.mostrarMensaje('Especialidad creada correctamente');
      }

      this.limpiarFormulario();
    } catch (error) {
      console.error('Error guardando especialidad:', error);
      await this.mostrarMensaje('Ocurrió un error al guardar');
    }
  }

  // =====================================
  // PREPARAR EDICIÓN
  // =====================================
  editarEspecialidad(especialidad: Specialty) {
    this.nombre = especialidad.nombre;
    this.descripcion = especialidad.descripcion || '';
    this.editando = true;
    this.especialidadEditandoId = especialidad.id || null;

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // =====================================
  // ACTIVAR / INACTIVAR
  // =====================================
  async cambiarEstado(especialidad: Specialty) {
    if (!especialidad.id) return;
    try {
      await this.firebaseService.updateSpecialty({
        id: especialidad.id,
        nombre: especialidad.nombre,
        activo: !especialidad.activo
      });
      await this.mostrarMensaje(especialidad.activo ? 'Especialidad inactivada' : 'Especialidad activada');
    } catch (error) {
      console.error('Error cambiando estado:', error);
    }
  }

  // =====================================
  // ELIMINAR
  // =====================================
  async eliminarEspecialidad(especialidad: Specialty) {
    const alert = await this.alertController.create({
      header: 'Eliminar especialidad',
      message: `¿Está seguro de eliminar "${especialidad.nombre}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              if (especialidad.id) {
                await this.firebaseService.deleteSpecialty(especialidad.id);
                await this.mostrarMensaje('Especialidad eliminada');
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

  // =====================================
  // LIMPIAR FORMULARIO
  // =====================================
  limpiarFormulario() {
    this.nombre = '';
    this.descripcion = '';
    this.editando = false;
    this.especialidadEditandoId = null;
  }

  // =====================================
  // BUSCAR
  // =====================================
  get especialidadesFiltradas() {
    const texto = this.busqueda.trim().toLowerCase();
    if (!texto) {
      return this.especialidades;
    }
    return this.especialidades.filter(
      especialidad => especialidad.nombre.toLowerCase().includes(texto)
    );
  }

  // =====================================
  // VOLVER
  // =====================================
  volver() {
    this.router.navigate(['/super-admin']);
  }

  // =====================================
  // MENSAJE TOAST
  // =====================================
  async mostrarMensaje(mensaje: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  // =====================================
  // DESTRUIR
  // =====================================
  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}