// import { Component, OnInit, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { IonicModule, AlertController, ToastController } from '@ionic/angular';
// import { Observable } from 'rxjs';
// import { FirebaseService, Specialty } from '../services/specialties';
// import { addIcons } from 'ionicons';
// import { add, createOutline, trashOutline } from 'ionicons/icons';


// addIcons({
//   'add': add,
//   'create-outline': createOutline,
//   'trash-outline': trashOutline
// });
// @Component({
//   selector: 'app-specialties',
//   templateUrl: './specialties.page.html',
//   styleUrls: ['./specialties.page.scss'],
//   standalone: true,
//   imports: [CommonModule, FormsModule, IonicModule]
  
// })
// export class SpecialtiesPage implements OnInit {
//   private firebaseService = inject(FirebaseService);
//   private alertController = inject(AlertController);
//   private toastController = inject(ToastController);

//   specialties$!: Observable<Specialty[]>;

//   ngOnInit() {
//     this.loadSpecialtiesWithDebug();
//   }

//   loadSpecialties() {
//     this.specialties$ = this.firebaseService.getSpecialties();
//   }

// loadSpecialtiesWithDebug() {
//     // Asignamos al observable para el HTML
//     this.specialties$ = this.firebaseService.getSpecialties();

//     // Nos suscribimos manualmente SOLO para detectar si Firestore deniega el acceso
//     this.firebaseService.getSpecialties().subscribe({
//       next: (data) => console.log('Datos leídos exitosamente:', data),
//       error: (err) => console.error('❌ ERROR CRÍTICO AL LEER DE FIRESTORE:', err)
//     });
//   }



//   async openSpecialtyModal(specialty?: Specialty) {
//     const isUpdate = !!specialty;
//     const alert = await this.alertController.create({
//       header: isUpdate ? 'Editar Especialidad' : 'Nueva Especialidad',
//       inputs: [
//         {
//           name: 'name',
//           type: 'text',
//           placeholder: 'Nombre de la especialidad',
//           value: specialty ? specialty.name : ''
//         }
//       ],
//       buttons: [
//         {
//           text: 'Cancelar',
//           role: 'cancel'
//         },
//         {
//           text: isUpdate ? 'Actualizar' : 'Guardar',
//           handler: async (data) => {
//             if (!data.name || data.name.trim() === '') {
//               this.presentToast('El nombre es obligatorio', 'danger');
//               return false;
//             }

//             try {
//               if (isUpdate && specialty?.id) {
//                 await this.firebaseService.updateSpecialty({ id: specialty.id, name: data.name });
//                 this.presentToast('Especialidad actualizada con éxito', 'success');
//               } else {
//                 await this.firebaseService.addSpecialty({ name: data.name });
//                 this.presentToast('Especialidad creada con éxito', 'success');
//               }
//               return true;
//             } catch (error) {
//               this.presentToast('Ocurrió un error al guardar', 'danger');
//               return false;
//             }
//           }
//         }
//       ]
//     });

//     await alert.present();
//   }

//   async deleteSpecialty(id?: string) {
//     if (!id) return;

//     const alert = await this.alertController.create({
//       header: 'Confirmar Eliminación',
//       message: '¿Estás seguro de que deseas eliminar esta especialidad?',
//       buttons: [
//         { text: 'Cancelar', role: 'cancel' },
//         {
//           text: 'Eliminar',
//           role: 'destructive',
//           handler: async () => {
//             try {
//               await this.firebaseService.deleteSpecialty(id);
//               this.presentToast('Especialidad eliminada', 'success');
//             } catch (error) {
//               this.presentToast('Error al eliminar la especialidad', 'danger');
//             }
//           }
//         }
//       ]
//     });

//     await alert.present();
//   }

//   async presentToast(message: string, color: 'success' | 'danger') {
//     const toast = await this.toastController.create({
//       message,
//       duration: 2000,
//       color,
//       position: 'bottom'
//     });
//     toast.present();
//   }

  
// }