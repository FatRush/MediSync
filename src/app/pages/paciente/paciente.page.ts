import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Paciente } from '../../models/paciente.model';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { IonicModule, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

import { Auth } from '@angular/fire/auth';

import {
  PacienteService
} from '../../services/paciente.service';

@Component({
  selector: 'app-paciente',
  templateUrl: './paciente.page.html',
  styleUrls: ['./paciente.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule
  ]
})
export class PacientePage implements OnInit {

  private fb = inject(FormBuilder);
  private pacienteService = inject(PacienteService);
  private auth = inject(Auth);
  private router = inject(Router);
  private alertController = inject(AlertController);

  pacienteForm!: FormGroup;

  cargando = true;
  guardando = false;

  constructor() {

    this.pacienteForm = this.fb.group({

      tipoIdentificacion: [
        'Identidad',
        Validators.required
      ],

      numeroIdentificacion: [
        '',
        Validators.required
      ],

      fechaNacimiento: [
        ''
      ],

      conocidoComo: [
        ''
      ],

      lugarNacimiento: [
        ''
      ],

      grupoEtnico: [
        ''
      ],

      estadoCivil: [
        ''
      ],

      ocupacion: [
        ''
      ],

      tipoSangre: [
        'Desconocido'
      ],

      provincia: [
        ''
      ],

      direccion: [
        ''
      ],

      telefono: [
        ''
      ],

      correo: [
        ''
      ],


    });

  }

  async ngOnInit() {

    await this.cargarPatient();

  }

  async cargarPatient() {

    this.cargando = true;

    try {

      const usuario = this.auth.currentUser;

      if (!usuario) {

        this.router.navigate(['/login']);

        return;
      }

      const paciente =
        await this.pacienteService.obtenerPaciente(usuario.uid);

      if (paciente) {

        this.pacienteForm.patchValue(paciente);

      }

    } catch (error) {

      console.error(
        'Error cargando paciente:',
        error
      );

    } finally {

      this.cargando = false;

    }

  }

  async guardar() {

    if (this.pacienteForm.invalid) {

      this.pacienteForm.markAllAsTouched();

      return;

    }

    const usuario = this.auth.currentUser;

    if (!usuario) {

      this.router.navigate(['/login']);

      return;

    }

    this.guardando = true;

    try {

     const paciente: Paciente = {
  uid: usuario.uid,
  ...this.pacienteForm.value,
  role: 'paciente'
};

await this.pacienteService.guardarPaciente(
  paciente
);
    

      const alert =
        await this.alertController.create({
          header: 'Información guardada',
          message:
            'Los datos del paciente fueron guardados correctamente.',
          buttons: [
            {
              text: 'Continuar',
              handler: () => {

                this.router.navigate(['/home']);

              }
            }
          ]
        });

      await alert.present();

    } catch (error) {

      console.error(error);

      const alert =
        await this.alertController.create({
          header: 'Error',
          message:
            'No se pudo guardar la información.',
          buttons: ['Aceptar']
        });

      await alert.present();

    } finally {

      this.guardando = false;

    }

  }

  irHome() {

    this.router.navigate(['/home']);

  }

}