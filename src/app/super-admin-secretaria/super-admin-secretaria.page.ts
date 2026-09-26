import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent, IonButton, 
  IonIcon, IonList, IonSpinner, AlertController, ToastController 
} from '@ionic/angular/standalone';

// Importaciones de Firestore
import { Firestore, collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where } from '@angular/fire/firestore';

// Importaciones de Firebase Auth (NUEVO)
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';

import { addIcons } from 'ionicons';
import { trashOutline, createOutline, personAddOutline } from 'ionicons/icons';

@Component({
  selector: 'app-super-admin-secretaria',
  templateUrl: './super-admin-secretaria.page.html',
  styleUrls: ['./super-admin-secretaria.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, 
    IonCard, IonCardContent, IonButton, IonIcon, IonSpinner
  ]
})
export class SuperAdminSecretariaPage implements OnInit {
  private firestore = inject(Firestore);
  private auth = inject(Auth); // Inyectamos Firebase Auth
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  secretarias: any[] = [];
  clinicas: any[] = [];
  cargando = false;

  constructor() {
    addIcons({
      'trash-outline': trashOutline,
      'create-outline': createOutline,
      'person-add-outline': personAddOutline
    });
  }

  async ngOnInit() {
    await Promise.all([
      this.cargarSecretarias(),
      this.cargarClinicas()
    ]);
  }

  async cargarSecretarias() {
    this.cargando = true;
    try {
      // Buscamos en la colección 'usuarios' a los que tienen rol de secretaria
      const q = query(collection(this.firestore, 'users'), where('role', '==', 'secretaria'));
      const querySnapshot = await getDocs(q);
      this.secretarias = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error('Error al cargar secretarias:', error);
    } finally {
      this.cargando = false;
    }
  }

  async cargarClinicas() {
    try {
      const querySnapshot = await getDocs(collection(this.firestore, 'clinicas'));
      this.clinicas = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error('Error al cargar clínicas:', error);
    }
  }

  async abrirFormularioSecretaria(secretariaAEditar: any = null) {
    const esEdicion = !!secretariaAEditar;

    let opcionesClinicasHtml = '<select id="clinicaSelect" class="ion-alert-input" style="width: 100%; padding: 10px; margin-top: 10px; border-radius: 5px; border: 1px solid #ccc;">';
    this.clinicas.forEach(c => {
      const seleccionada = (esEdicion && secretariaAEditar.clinicaId === c.id) ? 'selected' : '';
      opcionesClinicasHtml += `<option value="${c.id}|${c.nombre || c.nombreClinica}" ${seleccionada}>${c.nombre || c.nombreClinica || 'Clínica sin nombre'}</option>`;
    });
    opcionesClinicasHtml += '</select>';

    // Definimos los campos base (Nombre y Correo)
    const inputsFormulario: any[] = [
      { name: 'nombre', type: 'text', placeholder: 'Nombre completo', value: esEdicion ? secretariaAEditar.nombre : '' },
      { name: 'correo', type: 'email', placeholder: 'Correo electrónico', value: esEdicion ? secretariaAEditar.correo : '' }
    ];

    // Si es una secretaria NUEVA, agregamos el campo de Contraseña
    if (!esEdicion) {
      inputsFormulario.push({
        name: 'password',
        type: 'password',
        placeholder: 'Contraseña (mínimo 6 caracteres)'
      });
    }

    const alert = await this.alertCtrl.create({
      header: esEdicion ? 'Editar Secretaria' : 'Nueva Secretaria',
      inputs: inputsFormulario,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: esEdicion ? 'Actualizar' : 'Guardar',
          handler: async (data) => {
            const selectElement = document.getElementById('clinicaSelect') as HTMLSelectElement;
            const [clinicaId, clinicaNombre] = selectElement ? selectElement.value.split('|') : ['', ''];

            if (!data.nombre || !data.correo || !clinicaId) {
              this.mostrarToast('Por favor completa los campos.');
              return false;
            }

            if (!esEdicion && (!data.password || data.password.length < 6)) {
              this.mostrarToast('La contraseña debe tener al menos 6 caracteres.');
              return false;
            }

            try {
              if (esEdicion) {
                // Actualizar secretaria existente en Firestore
                const ref = doc(this.firestore, 'users', secretariaAEditar.id);
                await updateDoc(ref, {
                  nombre: data.nombre,
                  correo: data.correo,
                  clinicaId: clinicaId,
                  clinicaNombre: clinicaNombre
                });
                this.mostrarToast('Secretaria actualizada con éxito');
              } else {
                // 1. Crear el usuario en Firebase Authentication
                const userCredential = await createUserWithEmailAndPassword(this.auth, data.correo, data.password);
                const nuevoUid = userCredential.user.uid;

                // 2. Guardar sus datos en la colección 'usuarios' usando el UID generado por Auth
                await setDoc(doc(this.firestore, 'users', nuevoUid), {
                  nombre: data.nombre,
                  correo: data.correo,
                  clinicaId: clinicaId,
                  clinicaNombre: clinicaNombre,
                  role: 'secretaria',
                  creadoEn: new Date()
                });
                this.mostrarToast('Secretaria creada en Auth y Firestore');
              }
              await this.cargarSecretarias();
              return true;
            } catch (error: any) {
              console.error('Error al guardar secretaria:', error);
              this.mostrarToast('Error: ' + error.message);
              return false;
            }
          }
        }
      ]
    });

    await alert.present();

    setTimeout(() => {
      const alertContainer = document.querySelector('.alert-wrapper');
      if (alertContainer) {
        const customDiv = document.createElement('div');
        customDiv.style.padding = '0 20px';
        customDiv.innerHTML = `<label style="font-size: 12px; color: #666; display: block; margin-top: 5px;">Asignar a Clínica:</label>${opcionesClinicasHtml}`;
        alertContainer.insertBefore(customDiv, alertContainer.querySelector('.alert-button-group'));
      }
    }, 100);
  }

  async eliminarSecretaria(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Eliminación',
      message: '¿Estás seguro de que deseas eliminar los datos de esta secretaria?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await deleteDoc(doc(this.firestore, 'users', id));
              this.mostrarToast('Secretaria eliminada de la base de datos');
              await this.cargarSecretarias();
            } catch (error) {
              console.error('Error al eliminar:', error);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async mostrarToast(mensaje: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2500,
      position: 'bottom'
    });
    await toast.present();
  }
}