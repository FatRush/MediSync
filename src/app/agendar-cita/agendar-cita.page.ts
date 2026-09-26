import { Component, inject, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { AlertController } from '@ionic/angular';
// 👈 Agregamos collection y addDoc aquí
import { Firestore, doc, getDoc, collection, addDoc } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { StripeService } from '../services/StripeService';
import { Functions, httpsCallable } from '@angular/fire/functions';

import { 
  IonHeader, 
  IonToolbar, 
  IonButtons, 
  IonBackButton, 
  IonTitle, 
  IonContent, 
  IonItem, 
  IonSelect, 
  IonSelectOption, 
  IonInput, 
  IonTextarea, 
  IonButton, 
  IonLabel 
} from '@ionic/angular/standalone';

import { MedicosService, Medico } from '../services/medico.service';
import { CitaService } from '../services/cita.service';
import { PacienteService } from '../services/paciente.service';

@Component({
  selector: 'app-agendar-cita',
  templateUrl: './agendar-cita.page.html',
  styleUrls: ['./agendar-cita.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonTextarea,
    IonButton,
    IonLabel
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AgendarCitaPage implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);
  private firestore = inject(Firestore);
  private medicosService = inject(MedicosService);
  private citaService = inject(CitaService);
  private pacienteService = inject(PacienteService);
  private alert = inject(AlertController);
  private route = inject(ActivatedRoute);
  medicoSeleccionadoId: string = '';
  medicos: Medico[] = [];
  horas: string[] = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
  horaSeleccionada = '';
  private stripeSvc = inject(StripeService);
  private functions = inject(Functions);
  cardElement: any;
  fechaCita: string = '';
  cargando: boolean = false;
  precioCita: number = 5000; // $50.00 USD (en centavos)
  
  fechaMinima: string = '';

  formulario = this.fb.group({
    medicoId: ['', Validators.required],
    fecha: ['', Validators.required],
    motivo: ['', Validators.required]
  });

  async ngOnInit() {
    this.obtenerFechaActual();
    this.cargarMedicos();
  }

  obtenerFechaActual() {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    this.fechaMinima = `${anio}-${mes}-${dia}`;
  }

  cargarMedicos() {
    this.medicosService.getMedicos().subscribe({
      next: (data) => {
        this.medicos = data;
        
        this.route.queryParams.subscribe(params => {
          if (params['medicoId']) {
            this.medicoSeleccionadoId = params['medicoId'];
            this.formulario.patchValue({ medicoId: this.medicoSeleccionadoId });
          }
        });
      },
      error: (error) => {
        console.error('Error al cargar médicos:', error);
        this.medicos = [];
      }
    });
  }

  seleccionarHora(hora: string) {
    this.horaSeleccionada = hora;
  }

  async confirmarCita() {
    if (this.formulario.invalid || !this.horaSeleccionada) {
      this.formulario.markAllAsTouched();
      this.mostrarMensaje('Completa todos los campos y selecciona una hora.');
      return;
    }

    const datos = this.formulario.value;

    if (datos.fecha && datos.fecha < this.fechaMinima) {
      this.mostrarMensaje('No puedes agendar citas en fechas anteriores.');
      return;
    }

    const usuario = this.auth.currentUser;
    if (!usuario) {
      this.router.navigate(['/login']);
      return;
    }

    const paciente = await this.pacienteService.obtenerPaciente(usuario.uid);
    if (!paciente) {
      this.mostrarMensaje('Primero debes completar tu información personal.');
      return;
    }

    const medico = this.medicos.find(m => m.id === datos.medicoId);
    if (!medico) return;

    try {
      const [anio, mes, dia] = datos.fecha!.split('-').map(Number);
      const fechaSeleccionada = new Date(anio, mes - 1, dia);
      
      const diasSemanaMap = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      const diaSemana = diasSemanaMap[fechaSeleccionada.getDay()];

      const correoMedico = ((medico as any).correo || '').trim().toLowerCase();
      
      if (correoMedico) {
        const dispDocRef = doc(this.firestore, `disponibilidades/${correoMedico}`);
        const dispSnap = await getDoc(dispDocRef);

        if (dispSnap.exists()) {
          const config = dispSnap.data();
          const diasLaboralesConfig = config['diasLaborales'] || {};
          
          if (diasLaboralesConfig[diaSemana] === false) {
            this.mostrarMensaje(`El doctor no labora los días ${diaSemana}.`);
            return;
          }

          if (config['horaInicio'] && config['horaFin']) {
            if (this.horaSeleccionada < config['horaInicio'] || this.horaSeleccionada > config['horaFin']) {
              this.mostrarMensaje(`El horario de atención es de ${config['horaInicio']} a ${config['horaFin']}.`);
              return;
            }
          }
        }
      }
    } catch (e) {
      console.warn('No se pudo verificar la disponibilidad detallada del doctor:', e);
    }

    const disponible = await this.citaService.verificarHorario(
      medico.id!,
      datos.fecha!,
      this.horaSeleccionada
    );

    if (!disponible) {
      this.mostrarMensaje('El horario seleccionado ya está ocupado.');
      return;
    }

    try {
      const nombrePaciente = paciente.conocidoComo || paciente.correo || 'Paciente';
      const apellidoPaciente = paciente.lugarNacimiento || paciente.apellido || '';

      const cita = {
        pacienteId: usuario.uid,
        pacienteNombre: nombrePaciente,
        pacienteApellido: apellidoPaciente,
        medicoId: medico.id!,
        medicoNombre: medico.nombre,
        especialidad: medico.especialidadNombre || medico.especialidadId || 'General',
        fecha: datos.fecha!,
        hora: this.horaSeleccionada,
        motivo: datos.motivo!,
        correoPaciente: usuario.email || paciente.correo,
        estado: 'pendiente' as const
      };

      const resultado = await this.citaService.crearCita(cita);
      this.router.navigate(['/detail-appointment', resultado.id]);

    } catch (error) {
      console.error('Error al crear la cita:', error);
      this.mostrarMensaje('No fue posible crear la cita.');
    }
  }

  async mostrarMensaje(mensaje: string) {
    const alerta = await this.alert.create({
      header: 'Información',
      message: mensaje,
      buttons: ['Aceptar']
    });
    await alerta.present();
  }

  async pagarYReservar() {
    this.cargando = true;

    try {
      const crearIntencion = httpsCallable<{ monto: number; moneda: string }, { clientSecret: string }>(
        this.functions, 
        'crearIntencionPago'
      );
      const res = await crearIntencion({ monto: this.precioCita, moneda: 'usd' });
      const clientSecret = res.data.clientSecret;

      const resultadoPago = await this.stripeSvc.confirmarPago(clientSecret, this.cardElement);

      if (resultadoPago?.error) {
        alert(`Error en el pago: ${resultadoPago.error.message}`);
        this.cargando = false;
        return;
      }

      if (resultadoPago?.paymentIntent?.status === 'succeeded') {
        // Ahora addDoc y collection funcionarán correctamente
        await addDoc(collection(this.firestore, 'citas'), {
          fecha: this.fechaCita,
          estado: 'confirmada',
          pagoId: resultadoPago.paymentIntent.id,
          montoPagado: this.precioCita / 100,
          creadoEn: new Date()
        });

        alert('¡Cita pagada y agendada con éxito!');
      }

    } catch (error) {
      console.error('Error al procesar la reserva:', error);
      alert('Ocurrió un error al agendar la cita.');
    } finally {
      this.cargando = false;
    }
  }
}