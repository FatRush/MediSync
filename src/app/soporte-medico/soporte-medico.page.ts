import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { Router } from '@angular/router';
import { IonHeader, IonButtons, IonButton, IonFooter, IonToolbar, IonBackButton, IonTitle, IonItem, IonInput} from "@ionic/angular/standalone";
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { PacienteService } from '../services/paciente.service'; // Asegúrate de ajustar esta ruta según tu estructura de carpetas

@Component({
  selector: 'app-soporte-medico',
  templateUrl: './soporte-medico.page.html',
  styleUrls: ['./soporte-medico.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    IonHeader, IonToolbar, IonButtons, IonBackButton, 
    IonTitle, IonFooter, IonItem, IonInput, IonButton
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SoporteMedicoPage implements OnInit {
  @ViewChild(IonContent, { static: false }) content!: IonContent;

  // Inyectamos servicios necesarios
  private auth = inject(Auth);
  private pacienteService = inject(PacienteService);
  private router = inject(Router);

  paciente: any = null; // <-- Propiedad declarada para evitar el error de TypeScript
  mensajes: Array<{ 
    remitente: 'ia' | 'usuario', 
    texto: string, 
    mostrarBotonCita?: boolean, 
    especialidad?: string 
  }> = [];
  
  nuevoMensaje: string = '';
  isTyping: boolean = false;
  faseTriaje: number = 0;

  async ngOnInit() {
  const usuario = this.auth.currentUser;
  let nombreUsuario = 'Brayan Ely';

  if (usuario) {
    const datosPaciente = await this.pacienteService.obtenerPaciente(usuario.uid);
    if (datosPaciente) {
      this.paciente = datosPaciente;

      // 1. Tomamos el nombre (o conocidoComo)
      const nombre = this.paciente.nombre || this.paciente.conocidoComo || '';
      
      // 2. Tomamos los apellidos guardados en 'fechaNacimiento'
      const apellidos = this.paciente.lugarNacimiento || '';

      // 3. Los unimos en una sola variable
      nombreUsuario = `${nombre} ${apellidos}`.trim();

      // Fallback si por alguna razón vienen vacíos
      if (!nombreUsuario) {
        nombreUsuario = 'Brayan Ely';
      }
    }
  }

  // Mensaje inicial del doctor virtual personalizado
  this.mensajes.push({
    remitente: 'ia',
    texto: `¡Hola, ${nombreUsuario}! Soy el Dr(a). de Soporte MediSync. ¿Qué síntomas o malestar presentas el día de hoy para poder orientarte?`
  });
}

  iniciarConversacion() {
    this.mensajes.push({
      remitente: 'ia',
      texto: 'Hola, soy MediBot, tu asistente virtual médico en MediSync. ¿Qué síntoma principal presentas hoy?'
    });
  }

  enviarMensaje() {
    if (!this.nuevoMensaje.trim()) return;

    const textoUsuario = this.nuevoMensaje;
    this.mensajes.push({ remitente: 'usuario', texto: textoUsuario });
    this.nuevoMensaje = '';
    this.scrollToBottom();

    this.procesarRespuestaIA(textoUsuario);
  }

  procesarRespuestaIA(texto: string) {
    this.isTyping = true;
    const textoMinus = texto.toLowerCase();
    
    setTimeout(() => {
      this.isTyping = false;
      this.faseTriaje++;

      let respuestaIA = "";
      let mostrarBoton = false;
      let especialidadDetectada = "Medicina General";

      // Lógica simulada con enfoque clínico según la fase y los síntomas mencionados
      if (this.faseTriaje === 1) {
        respuestaIA = `Comprendo que presentas ${texto}. ¿Has notado si este malestar viene acompañado de otros síntomas como mareos, dolor de cabeza o malestar general?`;
      } else if (this.faseTriaje === 2) {
        respuestaIA = "Gracias por detallarlo. ¿Has tomado algún medicamento o esto ha empeorado en las últimas horas?";
      } else {
        // Análisis final del triaje basado en el contexto
        if (textoMinus.includes('dolor de pecho') || textoMinus.includes('respirar')) {
          especialidadDetectada = "Cardiología / Urgencias";
          respuestaIA = "⚠️ Debido a los síntomas que mencionas, te sugiero acudir a urgencias o una revisión prioritaria con Cardiología de inmediato.";
        } else {
          respuestaIA = "He registrado tus síntomas. Para una mejor valoración de tu cuadro clínico, te recomiendo agendar una consulta presencial.";
        }
        mostrarBoton = true;
      }

      this.mensajes.push({
        remitente: 'ia',
        texto: respuestaIA,
        mostrarBotonCita: mostrarBoton,
        especialidad: especialidadDetectada
      });

      this.scrollToBottom();
    }, 1200);
  }

  agendarCita(especialidad?: string) {
    const especialidadFinal = especialidad || 'Medicina General';
    this.router.navigate(['/agendar-cita'], { queryParams: { especialidad: especialidadFinal } });
  }

  scrollToBottom() {
    setTimeout(() => {
      this.content?.scrollToBottom(300);
    }, 100);
  }
}