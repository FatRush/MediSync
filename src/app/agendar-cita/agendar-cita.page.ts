import { Component, inject, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { AlertController } from '@ionic/angular';
import { Firestore, doc, getDoc, collection, addDoc } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { StripeService } from '../services/StripeService';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { getDocs } from '@angular/fire/firestore';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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
  private sanitizer = inject(DomSanitizer);
  medicoSeleccionadoId: string = '';
  medicos: Medico[] = [];
  horas: string[] = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
  private stripeSvc = inject(StripeService);
  private functions = inject(Functions);
  cardElement: any;
  fechaCita: string = '';
  cargando: boolean = false;
  precioCita: number = 5000; // $50.00 USD (en centavos)
  clinicaAsociada: any = null;
  horaSeleccionada: string = '';
  darkMode: boolean = false;
  fechaMinima: string = '';

  formulario = this.fb.group({
    medicoId: ['', Validators.required],
    fecha: ['', Validators.required],
    motivo: ['', Validators.required],
    hora: ['', Validators.required],
  });

async ngOnInit() {
    this.verificarModoOscuro();
    this.obtenerFechaActual();
    this.cargarMedicos();
    
    // Escucha cambios en tiempo real si el usuario alterna el modo desde el Home
    window.addEventListener('storage', (event) => {
      if (event.key === 'home_dark_mode') {
        this.verificarModoOscuro();
      }
    });
  }

  ionViewWillEnter() {
    this.verificarModoOscuro();
  }

aplicarModoOscuro() {
    const isDarkMode = localStorage.getItem('home_dark_mode') === 'true';
    
    // Aplica la clase al body globalmente
    document.body.classList.toggle('dark', isDarkMode);
    
    // Aplica la clase al ion-content de esta página
    const content = document.querySelector('ion-content');
    if (content) {
      content.classList.toggle('dark-theme', isDarkMode);
    }
  }

   verificarModoOscuro() {
    const isDarkMode = localStorage.getItem('home_dark_mode') === 'true';
    this.darkMode = isDarkMode; // Actualiza la variable directamente
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
            
            // <-- Agrega esta línea para que busque la clínica automáticamente al venir de la búsqueda
            this.obtenerClinicaDelDoctor(this.medicoSeleccionadoId);
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
    this.horaSeleccionada = hora; // Esto actualiza qué botón debe estar en "solid"
    
    // Si manejas el valor directamente en el formulario reactivo:
    this.formulario.patchValue({
      hora: hora
    });
  }

  async obtenerClinicaDelDoctor(doctorId: string) {
  try {
    const clinicasSnap = await getDocs(collection(this.firestore, 'clinicas'));
    
    // Buscamos la clínica cuyo arreglo "doctoresIds" contenga al doctor
    const clinicaEncontrada = clinicasSnap.docs.find(doc => {
      const data = doc.data();
      const doctoresIds = data['doctoresIds'] || [];
      return doctoresIds.includes(doctorId);
    });

    if (clinicaEncontrada) {
      this.clinicaAsociada = {
        id: clinicaEncontrada.id,
        ...clinicaEncontrada.data()
      };
    } else {
      this.clinicaAsociada = null;
    }
  } catch (error) {
    console.error('Error al buscar la clínica del doctor:', error);
  }
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

async onMedicoSeleccionado(event: any) {
    const medicoId = event.detail.value;
    if (!medicoId) {
      this.clinicaAsociada = null;
      return;
    }
    // Llama a la función que busca la clínica del doctor seleccionado
    await this.obtenerClinicaDelDoctor(medicoId);
  }

getMapUrl(direccion: string): SafeResourceUrl {
    let url = '';

    // Usamos las coordenadas de la clínica seleccionada si están disponibles en enlaceMaps
    if (this.clinicaAsociada?.enlaceMaps) {
      const coords = this.clinicaAsociada.enlaceMaps.trim();
      // Si el campo tiene el formato de coordenadas, cargamos el mapa centrado exactamente allí con un pin de marcador
      if (coords.includes(',')) {
        url = `https://maps.google.com/maps?q=${coords}&z=17&output=embed`;
      } else {
        url = `https://maps.google.com/maps?q=${encodeURIComponent(coords)}&output=embed`;
      }
    } else {
      // Respaldo por si no hay coordenadas
      const query = encodeURIComponent(`${direccion}, Cortés, Honduras`);
      url = `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

 abrirEnlaceMaps(enlace: string) {
    if (!enlace) return;

    let urlFinal = enlace;

    // Si guardaste solo coordenadas (ej: "15.420857, -88.160126"), creamos el enlace web
    if (enlace.includes(',') && !enlace.startsWith('http')) {
      urlFinal = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enlace)}`;
    }

    // Si ya es un enlace (ya sea corto maps.app.goo.gl o de google.com/maps), se abre tal cual
    window.open(urlFinal, '_blank');
  }
  
}