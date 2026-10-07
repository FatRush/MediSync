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
import { PacienteService} from '../../services/paciente.service';
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
  darkMode: boolean = false;

  constructor() {
    this.pacienteForm = this.fb.group({
      tipoIdentificacion: ['Identidad', Validators.required],
      numeroIdentificacion: ['', Validators.required],
      fechaNacimiento: [''],
      conocidoComo: [''],
      lugarNacimiento: [''],
      grupoEtnico: [''],
      estadoCivil: [''],
      ocupacion: [''],
      tipoSangre: ['Desconocido'],
      provincia: [''],
      direccion: [''],
      telefono: [''],
      correo: [''],
    });
  }

  async ngOnInit() {
    await this.cargarPatient();
    this.verificarModoOscuro();
  }

  ionViewWillEnter() {
  this.verificarModoOscuro();
}

verificarModoOscuro() {
    // Lee la misma llave que usas en el home
    const savedMode = localStorage.getItem('darkMode') === 'true';
    this.darkMode = savedMode;
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

  // En tu clase de paciente.page.ts

formatearDNI(event: any) {
  let valor = event.target.value || '';
  
  // 1. Obtener el tipo de identificación seleccionado en el formulario
  // (Asegúrate de cambiar 'miFormulario' por el nombre de tu FormGroup)
  const tipo = this.pacienteForm.get('tipoIdentificacion')?.value;

  let valorFinal = '';

  // 2. Validar el comportamiento según el tipo
  if (tipo === 'Identidad') {
    // --- FORMATO PARA DNI (Solo números, con guiones, máximo 13 dígitos) ---
    let soloNumeros = valor.replace(/\D/g, '');
    if (soloNumeros.length > 13) {
      soloNumeros = soloNumeros.substring(0, 13);
    }
    
    let dniFormateado = '';
    if (soloNumeros.length > 0) dniFormateado = soloNumeros.substring(0, 4);
    if (soloNumeros.length > 4) dniFormateado += '-' + soloNumeros.substring(4, 8);
    if (soloNumeros.length > 8) dniFormateado += '-' + soloNumeros.substring(8, 13);
    
    valorFinal = dniFormateado;

  } else {
    // --- FORMATO PARA PASAPORTE, CARNET, ETC. (Letras y números, sin guiones, máx 15) ---
    // Elimina guiones o caracteres especiales si deseas, o permite alfanuméricos
    let alfanumerico = valor.replace(/[^a-zA-Z0-9]/g, '');
    if (alfanumerico.length > 15) {
      alfanumerico = alfanumerico.substring(0, 15);
    }
    
    valorFinal = alfanumerico;
  }

  // 3. Actualizar el valor en el formulario y en el input visualmente
  this.pacienteForm.patchValue({
    numeroIdentificacion: valorFinal
  }, { emitEvent: false });

  event.target.value = valorFinal;
}

  irHome() {
    this.router.navigate(['/home']);
  }
}