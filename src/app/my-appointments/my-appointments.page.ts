import { Component, inject, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Cita } from '../models/cita.model';
import { CitaService } from '../services/cita.service';

@Component({

  selector: 'app-my-appointments',
  templateUrl: './my-appointments.page.html',
  styleUrls: ['./my-appointments.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule
  ]
})

export class MyAppointmentsPage implements OnInit {

  private auth = inject(Auth);
  private citaService = inject(CitaService);
  private router = inject(Router);
  citas: Cita[] = [];


  async ngOnInit() {
    await this.cargarCitas();
  }

  async ionViewWillEnter() {
    await this.cargarCitas();
  }

  async cargarCitas() {
    const usuario = this.auth.currentUser;
    if (!usuario) { this.router.navigate(['/login']);
      return;
    }
    this.citas = await this.citaService
        .obtenerCitasPaciente(
          usuario.uid
        );
  }


  verDetalle(cita: Cita ) {
    if (!cita.id) {
      return;
    }

    this.router.navigate(['/detail-appointment', cita.id]);
  }

  
}