import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Cita } from '../models/cita.model';
import { CitaService } from '../services/cita.service';

@Component({
  selector: 'app-detail-appointment',
  templateUrl: './detail-appointment.page.html',
  styleUrls: ['./detail-appointment.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    RouterLink
  ]
})
export class DetailAppointmentPage
  implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private citaService = inject(CitaService);
  private alert = inject(AlertController);
  cita: Cita | null = null;


  async ngOnInit() {
    const id =
      this.route.snapshot
        .paramMap
        .get('id');
    if (!id) {
      this.router.navigate(['/my-appointments']);
      return;
    }

    this.cita = await this.citaService.obtenerCita(id);
  }

  async cancelarCita() {
    if (!this.cita?.id) {
      return;
    }

    const alerta = await this.alert.create({
        header:
          'Cancelar cita',
        message:
          '¿Estás seguro de cancelar esta cita?',
        buttons: [
          {
            text: 'No',
            role: 'cancel'

          },
          {
            text: 'Sí, cancelar',
            role: 'destructive',
            handler: async () => {
              await this.citaService.cancelarCita(
                  this.cita!.id!
                );
              this.cita!.estado = 'cancelada';
            }
          }
        ]
      });
    await alerta.present();
  }
}