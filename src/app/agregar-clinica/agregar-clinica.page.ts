import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { Firestore, collection, addDoc, getDocs, updateDoc, doc } from '@angular/fire/firestore';
import { addIcons } from 'ionicons';
import { 
  businessOutline, 
  timeOutline, 
  peopleOutline, 
  imageOutline, 
  qrCodeOutline, 
  saveOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-agregar-clinica',
  templateUrl: './agregar-clinica.page.html',
  styleUrls: ['./agregar-clinica.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule // 👈 Carga todos los componentes de Ionic a la vez
  ]
})
export class AgregarClinicaPage implements OnInit {
  private firestore = inject(Firestore);
  private router = inject(Router);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  nombre: string = '';
  horarioApertura: string = '08:00';
  horarioCierre: string = '17:00';
  logoUrl: string = '';
  doctoresSeleccionados: string[] = [];
  listaDoctores: any[] = [];

  constructor() {
    addIcons({
      businessOutline,
      timeOutline,
      peopleOutline,
      imageOutline,
      qrCodeOutline,
      saveOutline
    });
  }

  ngOnInit() {
    this.cargarDoctores();
  }

  async cargarDoctores() {
    try {
      const snap = await getDocs(collection(this.firestore, 'doctors'));
      this.listaDoctores = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
    } catch (error) {
      console.error('Error al cargar doctores:', error);
    }
  }

  async guardarClinica() {
    if (!this.nombre.trim()) {
      this.mostrarToast('Por favor, ingresa el nombre de la clínica', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Guardando clínica...' });
    await loading.present();

    try {
      const nuevaClinica = {
        nombre: this.nombre.trim(),
        horario: `${this.horarioApertura} - ${this.horarioCierre}`,
        horarioApertura: this.horarioApertura,
        horarioCierre: this.horarioCierre,
        logoUrl: this.logoUrl.trim() || 'https://via.placeholder.com/150?text=Clinica',
        doctoresIds: this.doctoresSeleccionados,
        qrCodeUrl: '',
        estado: 'activa',
        fechaCreacion: new Date()
      };

      const docRef = await addDoc(collection(this.firestore, 'clinicas'), nuevaClinica);

      const urlApp = `https://tu-app-medica.web.app/agendar-cita?clinicaId=${docRef.id}`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(urlApp)}`;

      await updateDoc(doc(this.firestore, 'clinicas', docRef.id), {
        qrCodeUrl: qrCodeUrl
      });

      await loading.dismiss();
      this.mostrarToast('¡Clínica creada con éxito!', 'success');
      this.router.navigate(['/super-admin']);

    } catch (error) {
      await loading.dismiss();
      console.error('Error al guardar la clínica:', error);
      this.mostrarToast('Ocurrió un error al guardar la clínica', 'danger');
    }
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2500,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }
}