import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth, signOut } from '@angular/fire/auth';
import { Firestore, collection, getDocs, where, query } from '@angular/fire/firestore';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonCard, 
  IonCardContent,  
  IonButton, 
  IonButtons, 
  IonIcon 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  medicalOutline, 
  peopleOutline, 
  businessOutline, 
  listOutline, 
  calendarOutline, 
  logOutOutline, medkitOutline, heartOutline, chevronForwardOutline, timeOutline, headsetOutline } from 'ionicons/icons';

@Component({
  selector: 'app-super-admin',
  templateUrl: './super-admin.page.html',
  styleUrls: ['./super-admin.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonButton,
    IonButtons,
    IonIcon
  ]
})
export class SuperAdminPage implements OnInit {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private router = inject(Router);

  // Contadores para el Dashboard
  nombreAdmin: string = 'Super Administrador'; // 👈 Agrega esta línea
  cantDoctores: number = 0;
  cantPacientes: number = 0;
  cantClinicas: number = 0;
  cantEspecialidades: number = 0;
  cantCitas: number = 0;
  cantSecretarias: number = 0;

  constructor() {
    addIcons({logOutOutline,medkitOutline,peopleOutline,businessOutline,heartOutline,calendarOutline,headsetOutline,chevronForwardOutline,timeOutline,medicalOutline,listOutline});
  }

  ngOnInit() {
    this.cargarContadores();
  }

  // Se ejecuta cada vez que Ionic entra a esta vista
  async ionViewWillEnter() {
   await this.cargarContadores();
  }

  async cargarContadores() {
    try {
      // 1. Doctores (Verifica si en tu base de datos se llama 'medicos' o 'doctores')
      const medicosSnap = await getDocs(collection(this.firestore, 'doctors'));
      this.cantDoctores = medicosSnap.size;

      // 2. Pacientes
      const pacientesSnap = await getDocs(collection(this.firestore, 'users'));
      this.cantPacientes = pacientesSnap.size;

      // 3. Clínicas
      const clinicasSnap = await getDocs(collection(this.firestore, 'clinicas'));
      this.cantClinicas = clinicasSnap.size;

      // 4. Especialidades
      const especialidadesSnap = await getDocs(collection(this.firestore, 'specialties'));
      this.cantEspecialidades = especialidadesSnap.size;

      // 5. Citas
      const citasSnap = await getDocs(collection(this.firestore, 'citas'));
      this.cantCitas = citasSnap.size;

// 6. Secretarias (Asegúrate de tener esto exactamente así)
const qSecretarias = query(collection(this.firestore, 'users'), where('role', '==', 'secretaria'));
    const secretariasSnap = await getDocs(qSecretarias);
    this.cantSecretarias = secretariasSnap.size;

    } catch (error) {
      console.error('Error al cargar contadores desde Firestore:', error);
    }
  }

  // Navegación a las diferentes áreas de administración
  irA(ruta: string) {
    this.router.navigate([ruta]);
  }

  // Cerrar sesión
  async cerrarSesion() {
    try {
      await signOut(this.auth);
      this.router.navigateByUrl('/login', { replaceUrl: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}