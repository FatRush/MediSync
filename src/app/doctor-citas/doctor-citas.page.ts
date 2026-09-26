// import { Component, OnInit, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { IonicModule } from '@ionic/angular';
// import { Router } from '@angular/router';
// import { Firestore, collection, getDocs, query, where, doc, updateDoc } from '@angular/fire/firestore';
// import { Auth, onAuthStateChanged } from '@angular/fire/auth';


// interface Cita {
//   id: string;
//   doctorId: string;
//   doctorNombre: string;
//   especialidad: string;
//   pacienteId: string;
//   pacienteNombre: string;
//   fecha: string;
//   hora: string;
//   motivo: string;
//   estado: string;
// }

// @Component({
//   selector: 'app-doctor-citas',
//   templateUrl: './doctor-citas.page.html',
//   styleUrls: ['./doctor-citas.page.scss'],
//   standalone: true,
//   imports: [ CommonModule, IonicModule ]
// })


// export class DoctorCitasPage implements OnInit {
//   private firestore = inject(Firestore);
//   private auth = inject(Auth);
//   private router = inject(Router);

//   doctorId: string = '';
//   citas: Cita[] = [];
//   citasFiltradas: Cita[] = [];
//   filtro: string = 'todas';
//   cargando: boolean = true;

//   ngOnInit(): void {
//     onAuthStateChanged(
//       this.auth,
//       async (user) => {
//         if (!user) {
//           console.log(
//             'No hay usuario autenticado'
//           );
//           await this.router.navigate([
//             '/login'
//           ]);
//           return;
//         }


//         this.doctorId = user.uid;
//         console.log(
//           '=============================='
//         );

//         console.log(
//           'DOCTOR AUTENTICADO'
//         );

//         console.log(
//           'UID:',
//           this.doctorId
//         );

//         console.log(
//           '=============================='
//         );

//         await this.cargarCitas();
//       }
//     );
//   }


//   async cargarCitas(): Promise<void> {
//     this.cargando = true;
//     try {
//       console.log(
//         'Buscando citas para:',
//         this.doctorId
//       );

//       const citasRef =
//         collection(
//           this.firestore,
//           'citas'
//         );

//       const consulta =
//         query(
//           citasRef,
//           where(
//             'doctorId',
//             '==',
//             this.doctorId
//           )
//         );

//       const snapshot =
//         await getDocs(
//           consulta
//         );

//       console.log(
//         'Cantidad de citas:',
//         snapshot.size
//       );
//       this.citas = [];
//       snapshot.forEach(
//         (documento) => {
//           const data =
//             documento.data() as any;
//           console.log(
//             'CITA ENCONTRADA:',
//             documento.id,
//             data
//           );

//           this.citas.push({
//             id: documento.id,
//             doctorId:
//               data['doctorId'] || '',
//             doctorNombre:
//               data['doctorNombre'] || '',
//             especialidad:
//               data['especialidad'] || '',
//             pacienteId:
//               data['pacienteId'] || '',
//             pacienteNombre:
//               data['pacienteNombre'] ||
//               'Paciente',
//             fecha:
//               data['fecha'] || '',
//             hora:
//               data['hora'] || '',
//             motivo:
//               data['motivo'] ||
//               'No especificado',
//             estado:
//               data['estado'] ||
//               'pendiente'
//           });
//         }
//       );

//       this.aplicarFiltro();
//     } catch (error) {
//       console.error(
//         'ERROR AL CARGAR CITAS:',
//         error
//       );
//     } finally {
//       this.cargando = false;
//     }
//   }


//   aplicarFiltro(): void {
//     if (this.filtro === 'todas') {
//       this.citasFiltradas =
//         [...this.citas];
//       return;
//     }


//     this.citasFiltradas =
//       this.citas.filter(
//         (cita) =>
//           cita.estado === this.filtro
//       );
//   }

//   cambiarFiltro(
//     nuevoFiltro: string | number | undefined
//   ): void {
//     if (
//       nuevoFiltro === undefined
//     ) {
//       return;
//     }

//     this.filtro = String(nuevoFiltro);
//     this.aplicarFiltro();
//   }

//   async confirmarCita(
//     cita: Cita
//   ): Promise<void> {
//     try {
//       const citaRef =
//         doc(
//           this.firestore,
//           `citas/${cita.id}`
//         );
//       await updateDoc(
//         citaRef,
//         {
//           estado: 'confirmada'
//         }
//       );

//       cita.estado = 'confirmada';
//       this.aplicarFiltro();
//     } catch (error) {
//       console.error(
//         'Error confirmando cita:',
//         error
//       );
//     }
//   }

//   async cancelarCita(
//     cita: Cita
//   ): Promise<void> {
//     try {

//       const citaRef =
//         doc(
//           this.firestore,
//           `citas/${cita.id}`
//         );

//       await updateDoc(
//         citaRef,
//         {
//           estado: 'cancelada'
//         }
//       );

//       cita.estado =
//         'cancelada';
//       this.aplicarFiltro();
//     } catch (error) {
//       console.error(
//         'Error cancelando cita:',
//         error
//       );
//     }
//   }

//   async marcarAtendida(
//     cita: Cita
//   ): Promise<void> {
//     try {
//       const citaRef =
//         doc(
//           this.firestore,
//           `citas/${cita.id}`
//         );
//       await updateDoc(
//         citaRef,
//         {
//           estado: 'atendida'
//         }
//       );

//       cita.estado =
//         'atendida';
//       this.aplicarFiltro();
//     } catch (error) {
//       console.error(
//         'Error actualizando cita:',
//         error
//       );
//     }
//   }

//   verDetalle(
//     cita: Cita
//   ): void {
//     this.router.navigate(['/doctor-cita-detalle'], {
//         queryParams: {
//           id: cita.id
//         }
//       }
//     );
//   }

//   volverInicio(): void {
//     this.router.navigate(['/doctor-home']);
//   }

//   irPacientes(): void {
//     this.router.navigate(['/doctor-pacientes']);
//   }

//   irPerfil(): void {
//     this.router.navigate(['/doctor-perfil']);
//   }

//   cerrarSesion(): void {
//     this.auth.signOut()
//       .then(() => {this.router.navigate(['/login']);
//       });
//   }
// }


import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CitaService } from '../services/cita.service';
import { Cita } from '../models/cita.model';

@Component({
  selector: 'app-doctor-citas',
  templateUrl: './doctor-citas.page.html',
  styleUrls: ['./doctor-citas.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ]
})
export class DoctorCitasPage implements OnInit {
  
  citasTotales: Cita[] = [];
  citasFiltradas: Cita[] = [];
  segmentoActual: string = 'TODAS';

  constructor(private citaService: CitaService) {}

  ngOnInit() {
    this.cargarCitas();
  }

  async cargarCitas() {
    // ⚠️ CAMBIA ESTE '123' por el ID real del doctor autenticado en tu app
    const doctorId = '123'; 
    
    try {
      this.citasTotales = await this.citaService.obtenerCitasPorDoctor(doctorId);
      console.log('Citas obtenidas:', this.citasTotales); // Revisa la consola F12
      this.filtrarCitas(this.segmentoActual);
    } catch (err) {
      console.error('Error al cargar las citas:', err);
    }
  }

  cambiarSegmento(event: any) {
    this.segmentoActual = event.detail.value;
    this.filtrarCitas(this.segmentoActual);
  }

  filtrarCitas(estado: string) {
    if (estado === 'TODAS') {
      this.citasFiltradas = this.citasTotales;
    } else {
      // Compara sin importar si están en mayúsculas o minúsculas
      this.citasFiltradas = this.citasTotales.filter(
        cita => cita.estado?.trim().toLowerCase() === estado.trim().toLowerCase()
      );
    }
  }

  obtenerColorEstado(estado: string): string {
    switch (estado?.trim().toLowerCase()) {
      case 'confirmada': return 'success';
      case 'pendiente': return 'warning';
      case 'cancelada': return 'danger';
      case 'atendida': return 'primary';
      default: return 'medium';
    }
  }
}