import { Component, OnInit, OnDestroy, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { CitaService } from '../services/cita.service';
import { 
  Auth, 
  signOut, 
  onAuthStateChanged 
} from '@angular/fire/auth';
import { 
  Firestore, 
  collection, 
  getDocs, 
  getDoc, 
  onSnapshot, 
  Unsubscribe, 
  addDoc, 
  doc, 
  updateDoc, 
  setDoc,
  query,
  where
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { getStorage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';

// Registro de íconos de Ionic
import { addIcons } from 'ionicons';
import { 
  logOutOutline, 
  checkmarkCircleOutline, 
  checkmarkDoneOutline, 
  documentTextOutline, 
  cloudUploadOutline,
  settingsOutline,
  medkitOutline, mailOutline, calendarOutline, timeOutline, 
  logoWhatsapp, cardOutline, logoPaypal, cashOutline, printOutline,
  journalOutline, searchOutline, personCircleOutline, closeCircleOutline,
  pulseOutline, flashOutline, alertCircleOutline, moonOutline, sunnyOutline
} from 'ionicons/icons';

// Librerías para generación de Word
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-doctor-home',
  templateUrl: './doctor-home.page.html',
  styleUrls: ['./doctor-home.page.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule, 
    FormsModule, 
    IonicModule
  ]
})
export class DoctorHomePage implements OnInit, OnDestroy {
  
  private citaService = inject(CitaService);
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);
  private http = inject(HttpClient);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  citas: any[] = [];
  
  nombreDoctor: string = 'Doctor';
  especialidad: string = 'Especialidad médica';
  descripcion: string = 'Panel de control de citas médicas.';
  correoActual: string = '';
  firmaUrl: string = '';
  segmentoActual: string = 'pendiente';
  cargandoCitas: boolean = false;
  filtroPaciente: string = '';
  pinDoctor: string = '';
  
  // Disponibilidad y Días Bloqueados (Soporte completo con y sin tildes)
  horaInicio: string = '08:00';
  horaFin: string = '17:00';
  diasLaborales: { [key: string]: boolean } = {
    lunes: true,
    martes: true,
    miercoles: true,
    miércoles: true,
    jueves: true,
    viernes: true,
    sabado: true,
    sábado: true,
    domingo: true
  };

  fechaBloqueadaNueva: string = '';
  diasBloqueados: string[] = [];

  // Variables para el Historial Clínico Global
  busquedaPacienteBD: string = '';
  filtroTipoRegistro: string = 'todos';
  historialResultadosBD: any[] = [];
  cargandoHistorialBD: boolean = false;
  esModoOscuro: boolean = false;

  // Plantillas de Consulta asociadas al Doctor
  listaPlantillas: any[] = [];
  nombreNuevaPlantilla: string = '';
  plantillaSeleccionada: any = null;
  doctorId: string = '';

  // Modales y Estados
  isModalVistaPreviaOpen: boolean = false;
  isModalHorariosOpen: boolean = false;
  isModalOpen: boolean = false;            
  isModalExpedienteOpen: boolean = false;    
  citaSeleccionada: any = null;
  citaExpedienteSeleccionada: any = null;
  isModalNuevaCitaOpen: boolean = false;

  // Formulario temporal de expediente
  expedienteForm = {
    sintomas: '',
    diagnostico: '',
    examenes: '',
    receta: ''
  };

  // Datos para Atención Médica Avanzada
  atencion: any = {
    tipoDoc: 'receta',
    indicaciones: '',
    pesoLbs: null,       // Peso en libras
    estaturaM: null,      // Estatura en metros
    imc: null,
    clasificacionImc: '',
    requiereProximaCita: false,
    fechaProximaCita: ''
  };

  fechaActual: Date = new Date();
  private timer: any;

  nuevaCita = {
    pacienteId: '',
    nombrePaciente: '',
    fecha: '',
    telefono: '',
    hora: '',
    motivo: '',
    estado: 'confirmada' // El doctor las puede dejar confirmadas directamente
  };

  private citasUnsubscribe: Unsubscribe | null = null;
  private plantillasUnsubscribe: Unsubscribe | null = null;
  private conteoPrevioPendientes: number = -1;

  constructor() {
    addIcons({ 
      'log-out-outline': logOutOutline, 
      'checkmark-circle-outline': checkmarkCircleOutline, 
      'checkmark-done-outline': checkmarkDoneOutline,
      'document-text-outline': documentTextOutline,
      'cloud-upload-outline': cloudUploadOutline,
      'settings-outline': settingsOutline,
      'journal-outline': journalOutline,
      'search-outline': searchOutline,
      'person-circle-outline': personCircleOutline,
      'close-circle-outline': closeCircleOutline,
      'pulse-outline': pulseOutline,
      'flash-outline': flashOutline,
      'alert-circle-outline': alertCircleOutline,
      'moon-outline': moonOutline,
      'sunny-outline': sunnyOutline,
      medkitOutline, mailOutline, calendarOutline, timeOutline, 
      logoWhatsapp, cardOutline, logoPaypal, cashOutline, printOutline
    });
  }

  async ionViewWillEnter() {
    this.escucharCitasDoctorEnTiempoReal(); 
  }

  ngOnInit() {
    this.verificarSesionYcargarDatos();

    const esOscuro = localStorage.getItem('doctor_modo_oscuro') === 'true';
    this.esModoOscuro = esOscuro;

    if (esOscuro) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    }

    this.timer = setInterval(() => {
      this.fechaActual = new Date();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.citasUnsubscribe) {
      this.citasUnsubscribe();
    }
    if (this.plantillasUnsubscribe) {
      this.plantillasUnsubscribe();
    }

    if (this.timer) {
      clearInterval(this.timer);
    }
  }
  

  // === GESTIÓN DE PLANTILLAS EXCLUSIVAS POR DOCTOR ===
  escucharPlantillasDelDoctor() {
    if (!this.doctorId) return;

    if (this.plantillasUnsubscribe) {
      this.plantillasUnsubscribe();
    }

    const plantillasRef = collection(this.firestore, 'plantillas');
    const q = query(plantillasRef, where('doctorId', '==', this.doctorId));

    this.plantillasUnsubscribe = onSnapshot(q, (querySnapshot) => {
      const plantillasTemp: any[] = [];
      querySnapshot.forEach((docSnap) => {
        plantillasTemp.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      this.listaPlantillas = plantillasTemp;
    }, (error) => {
      console.error('Error al cargar plantillas del doctor:', error);
    });
  }

  cargarPlantillaSeleccionada(event: any) {
    const plantilla = event.detail.value;
    if (plantilla && (plantilla.indicaciones || plantilla.contenido)) {
      this.atencion.indicaciones = plantilla.indicaciones || plantilla.contenido;
    }
  }

  async guardarPlantillaPersonalizada() {
    if (!this.nombreNuevaPlantilla.trim() || !this.atencion.indicaciones.trim()) {
      this.mostrarToast('Escribe un nombre para la plantilla y agrega el contenido de las indicaciones.');
      return;
    }

    if (!this.doctorId) {
      this.mostrarToast('No se identificó la sesión del doctor actual.');
      return;
    }

    try {
      const nuevaPlantilla = {
        nombre: this.nombreNuevaPlantilla.trim(),
        indicaciones: this.atencion.indicaciones,
        tipo: this.atencion.tipoDoc || 'Receta / Indicaciones Médicas',
        doctorId: this.doctorId,
        fechaCreacion: new Date()
      };

      await addDoc(collection(this.firestore, 'plantillas'), nuevaPlantilla);
      this.mostrarToast(`¡Plantilla "${this.nombreNuevaPlantilla}" guardada con éxito!`);
      this.nombreNuevaPlantilla = '';
    } catch (error) {
      console.error('Error al guardar plantilla en Firestore:', error);
      this.mostrarToast('Error al guardar la plantilla.');
    }
  }

  // === CÁLCULO DE IMC ===
  calcularIMC() {
    const pesoLbs = this.atencion.pesoLbs;
    const estaturaMetros = this.atencion.estaturaM;

    if (pesoLbs && estaturaMetros && estaturaMetros > 0) {
      const pesoKg = pesoLbs / 2.20462;
      const imcCalculado = pesoKg / (estaturaMetros * estaturaMetros);
      this.atencion.imc = parseFloat(imcCalculado.toFixed(2));

      if (this.atencion.imc < 18.5) {
        this.atencion.clasificacionImc = 'Bajo peso';
      } else if (this.atencion.imc < 25) {
        this.atencion.clasificacionImc = 'Peso normal';
      } else if (this.atencion.imc < 30) {
        this.atencion.clasificacionImc = 'Sobrepeso';
      } else {
        this.atencion.clasificacionImc = 'Obesidad';
      }
    } else {
      this.atencion.imc = null;
      this.atencion.clasificacionImc = '';
    }
  }

  // === MÉTODOS DEL MODAL DE HORARIOS Y VACACIONES ===
  abrirModalHorarios() {
    this.isModalHorariosOpen = true;
  }

  cerrarModalHorarios() {
    this.isModalHorariosOpen = false;
  }

  agregarDiaBloqueado() {
    if (this.fechaBloqueadaNueva && !this.diasBloqueados.includes(this.fechaBloqueadaNueva)) {
      this.diasBloqueados.push(this.fechaBloqueadaNueva);
      this.fechaBloqueadaNueva = '';
    }
  }

  removerDiaBloqueado(index: number) {
    this.diasBloqueados.splice(index, 1);
  }

  // === EXPEDIENTE MÉDICO ===
  abrirExpedienteYAtender(cita: any) {
    this.citaExpedienteSeleccionada = cita;
    this.expedienteForm = {
      sintomas: cita.sintomas || '',
      diagnostico: cita.diagnostico || '',
      examenes: cita.examenes || '',
      receta: cita.receta || ''
    };
    this.isModalExpedienteOpen = true;
  }

  verExpediente(cita: any) {
    this.abrirExpedienteYAtender(cita);
  }

  cerrarModalExpediente() {
    this.isModalExpedienteOpen = false;
    this.citaExpedienteSeleccionada = null;
  }

  async guardarExpedienteYFinalizar() {
    if (!this.citaExpedienteSeleccionada) return;

    try {
      const citaRef = doc(this.firestore, 'citas', this.citaExpedienteSeleccionada.id);
      
      const camposActualizados = {
        sintomas: this.expedienteForm.sintomas,
        diagnostico: this.expedienteForm.diagnostico,
        examenes: this.expedienteForm.examenes,
        receta: this.expedienteForm.receta,
        estado: 'atendida',
        fechaAtencion: new Date()
      };

      await updateDoc(citaRef, camposActualizados);
      Object.assign(this.citaExpedienteSeleccionada, camposActualizados);

      this.mostrarToast('Expediente guardado y consulta finalizada');
      this.cerrarModalExpediente();
    } catch (error) {
      console.error('Error al guardar el expediente:', error);
      this.mostrarToast('Error al guardar la información en la base de datos');
    }
  }

  abrirArchivo(url: string) {
    if (url) {
      window.open(url, '_blank');
    }
  }

  // === MÉTODOS Y MÉTRICAS DE CITAS ===
  esHoy(fechaCita: string): boolean {
    if (!fechaCita) return false;
    const hoyStr = new Date().toISOString().split('T')[0];
    return fechaCita === hoyStr;
  }

  get totalHoy() {
    return this.citas.filter(c => this.esHoy(c.fecha)).length;
  }

  get atendidasHoy() {
    return this.citas.filter(c => this.esHoy(c.fecha) && (c.estado || '').toLowerCase() === 'atendida').length;
  }

  async verificarSesionYcargarDatos() {
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        this.doctorId = user.uid;
        this.correoActual = (user.email || '').trim().toLowerCase();
        await this.cargarPerfilDoctorFirestore();
        await this.cargarDatosDoctor();
        this.escucharCitasDoctorEnTiempoReal();
        this.escucharPlantillasDelDoctor();
      } else {
        this.router.navigateByUrl('/login', { replaceUrl: true });
      }
    });
  }

  async cargarPerfilDoctorFirestore() {
    try {
      const querySnapshot = await getDocs(collection(this.firestore, 'doctors')); 
      let encontrado = false;
      
      querySnapshot.forEach((docSnap) => {
        const data: any = docSnap.data();
        const correoBD = (data.correo || data.email || '').trim().toLowerCase();
        
        if (correoBD === this.correoActual) {
          this.nombreDoctor = data.nombre || 'Doctor';
          this.especialidad = data.especialidadNombre || data.especialidad || 'Especialidad médica';
          this.descripcion = data.descripcion || 'Panel de control de citas médicas.';
          this.firmaUrl = data.firmaUrl || '';
          this.horaInicio = data.horaInicio || this.horaInicio;
          this.horaFin = data.horaFin || this.horaFin;
          
          if (data.diasLaborales) {
            this.diasLaborales = {
              lunes: data.diasLaborales.lunes ?? true,
              martes: data.diasLaborales.martes ?? true,
              miercoles: data.diasLaborales.miercoles ?? data.diasLaborales.miércoles ?? true,
              miércoles: data.diasLaborales.miércoles ?? data.diasLaborales.miercoles ?? true,
              jueves: data.diasLaborales.jueves ?? true,
              viernes: data.diasLaborales.viernes ?? true,
              sabado: data.diasLaborales.sabado ?? data.diasLaborales.sábado ?? true,
              sábado: data.diasLaborales.sábado ?? data.diasLaborales.sabado ?? true,
              domingo: data.diasLaborales.domingo ?? true
            };
          }

          if (data.diasBloqueados) {
            this.diasBloqueados = data.diasBloqueados;
          }

          encontrado = true;
        }
      });

      if (!encontrado) {
        this.nombreDoctor = this.correoActual.split('@')[0]; 
      }
    } catch (error) {
      console.error('Error al cargar perfil del doctor:', error);
    }
  }

  escucharCitasDoctorEnTiempoReal() {
    this.cargandoCitas = true;

    if (this.citasUnsubscribe) {
      this.citasUnsubscribe();
    }

    const citasRef = collection(this.firestore, 'citas');

    this.citasUnsubscribe = onSnapshot(citasRef, (querySnapshot) => {
      const todasLasCitas: any[] = [];
      
      querySnapshot.forEach((docSnap) => {
        const data: any = docSnap.data();
        todasLasCitas.push({
          id: docSnap.id,
          ...data,
          metodoPago: data.metodoPago || data.metodo || data.estadoPago || ''
        });
      });

      const citasFiltradas = todasLasCitas.filter(cita => {
        const limpiarTexto = (texto: string) => 
          (texto || '').toLowerCase().replace(/^(dr|dra|doctor|doctora)\.?\s*/i, '').trim();

        const medicoNombreCita = limpiarTexto(
          cita.medicoNombre || cita.doctorNombre || cita.doctor || cita.medico || ''
        );

        const correoDoctorCita = (
          cita.doctorCorreo || cita.correoDoctor || cita.emailDoctor || cita.doctorEmail || ''
        ).trim().toLowerCase();

        const nombreActualLimpio = limpiarTexto(this.nombreDoctor);

        const matchNombre = medicoNombreCita.length > 0 && 
          (medicoNombreCita.includes(nombreActualLimpio) || nombreActualLimpio.includes(medicoNombreCita));
          
        const matchCorreo = correoDoctorCita.length > 0 && correoDoctorCita === this.correoActual;

        return matchNombre || matchCorreo;
      });

      // === ORDENAR POR FECHA Y HORA (ASCENDENTE) ===
      this.citas = citasFiltradas.sort((a, b) => {
        const fechaA = new Date(`${a.fecha}T${a.hora || '00:00'}`).getTime();
        const fechaB = new Date(`${b.fecha}T${b.hora || '00:00'}`).getTime();
        return fechaA - fechaB; // Muestra primero la fecha/hora más próxima
      });

      const pendientesActuales = this.citasPendientes.length;
      if (this.conteoPrevioPendientes !== -1 && pendientesActuales > this.conteoPrevioPendientes) {
        this.mostrarToast('🔔 ¡Atención! Se ha registrado una nueva cita pendiente.');
      }
      this.conteoPrevioPendientes = pendientesActuales;

      this.cargandoCitas = false;
    }, (error) => {
      console.error('Error al escuchar citas en tiempo real:', error);
      this.cargandoCitas = false;
    });
  }

  get citasPendientes() { return this.citas.filter(c => (c.estado || 'pendiente').toLowerCase() === 'pendiente'); }
  get citasConfirmadas() { return this.citas.filter(c => (c.estado || '').toLowerCase() === 'confirmada'); }
  get citasAtendidas() { return this.citas.filter(c => (c.estado || '').toLowerCase() === 'atendida'); }
  get citasCanceladas() { return this.citas.filter(c => (c.estado || '').toLowerCase() === 'cancelada'); }



  async confirmarCita(cita: any) {
    try {
      const citaRef = doc(this.firestore, 'citas', cita.id);
      await updateDoc(citaRef, { 
        estado: 'confirmada',
        confirmadaEn: new Date()
      });

      cita.estado = 'confirmada';
      this.mostrarToast(`Cita de ${cita.pacienteNombre || 'Paciente'} confirmada correctamente`);

      const correoDelPaciente = cita.correoPaciente || cita.emailPaciente || cita.email || cita.pacienteCorreo;
      if (correoDelPaciente) {
        try {
          await this.citaService.confirmarCita(
            cita.id,
            correoDelPaciente,
            cita.pacienteNombre,
            cita.pacienteApellido,
            this.nombreDoctor,
            cita.fecha,
            cita.hora
          );
          this.enviarConfirmacion(correoDelPaciente, cita);
        } catch (emailErr) {
          console.warn('No se pudo enviar el correo de notificación:', emailErr);
        }
      }
    } catch (error) {
      console.error('Error al confirmar la cita:', error);
      this.mostrarToast('Error al cambiar el estado de la cita');
    }
  }

  async cancelarCitaConMotivo(cita: any) {
    const alert = await this.alertCtrl.create({
      header: 'Cancelar Cita',
      subHeader: `Paciente: ${cita.pacienteNombre || 'Paciente'}`,
      message: 'Especifica la razón de la cancelación para notificar al paciente:',
      inputs: [
        {
          name: 'motivo',
          type: 'textarea',
          placeholder: 'Ej. Emergencia médica / Motivos personales...'
        }
      ],
      buttons: [
        { text: 'Volver', role: 'cancel' },
        {
          text: 'Cancelar Cita',
          role: 'destructive',
          handler: async (data) => {
            if (!data.motivo || data.motivo.trim() === '') {
              this.mostrarToast('Por favor escribe un motivo de cancelación');
              return false;
            }

            try {
              const citaRef = doc(this.firestore, 'citas', cita.id);
              await updateDoc(citaRef, {
                estado: 'cancelada',
                motivoCancelacion: data.motivo,
                canceladaEn: new Date()
              });

              cita.estado = 'cancelada';
              this.mostrarToast('La cita ha sido cancelada correctamente');
              return true;
            } catch (err) {
              console.error('Error al cancelar cita:', err);
              this.mostrarToast('Error al procesar la cancelación');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  enviarConfirmacion(correoPaciente: string, cita: any) {
    const payload = {
      email: correoPaciente,
      cita: {
        fecha: cita.fecha,
        hora: cita.hora,
        doctor: this.nombreDoctor,
        paciente: cita.pacienteNombre?.trim() || 'Paciente',
        apellidoPaciente: cita.pacienteApellido?.trim() || ''
      }
    };

    this.http.post('https://backend-citas-wrpz.onrender.com/api/enviar-correo', payload)
      .subscribe({
        next: (res) => console.log('¡Correo enviado desde la nube!', res),
        error: (err) => console.error('Error:', err)
      });
  }

  // === ATENCIÓN Y MODAL PRINCIPAL ===
  abrirModalAtencion(cita: any) {
    this.citaSeleccionada = cita;
    this.isModalOpen = true;
    this.atencion = {
      tipoDoc: 'receta',
      indicaciones: '',
      requiereProximaCita: false,
      fechaProximaCita: '',
      pesoKg: null,
      tallaCm: null,
      imc: '',
      presionArterial: '',
      frecuenciaCardiaca: ''
    };
  }

  marcarComoAtendida(cita: any) {
    this.abrirModalAtencion(cita);
  }

  cerrarModal() {
    this.isModalOpen = false;
    this.citaSeleccionada = null;
  }

  async guardarYGenerarWord() {
    if (!this.citaSeleccionada || !this.atencion.indicaciones) {
      this.mostrarToast('Por favor completa las indicaciones');
      return;
    }

    try {
      const citaRef = doc(this.firestore, 'citas', this.citaSeleccionada.id);
      
      const datosActualizacion = {
        estado: 'atendida',
        diagnostico: this.atencion.indicaciones,
        receta: this.atencion.indicaciones,
        tipoDoc: this.atencion.tipoDoc,
        presionArterial: this.atencion.presionArterial,
        frecuenciaCardiaca: this.atencion.frecuenciaCardiaca,
        pesoKg: this.atencion.pesoKg,
        tallaCm: this.atencion.tallaCm,
        imc: this.atencion.imc,
        fechaAtencion: new Date()
      };

      await updateDoc(citaRef, datosActualizacion);
      Object.assign(this.citaSeleccionada, datosActualizacion);

      if (this.atencion.requiereProximaCita && this.atencion.fechaProximaCita) {
        const fechaObj = new Date(this.atencion.fechaProximaCita);
        const fechaFormateada = fechaObj.toISOString().split('T')[0];
        const horaFormateada = fechaObj.toTimeString().substring(0, 5);

        const nuevaCita = {
          ...this.citaSeleccionada,
          fecha: fechaFormateada,
          hora: horaFormateada,
          motivo: 'Sesión de seguimiento',
          estado: 'pendiente',
          fechaCreacion: new Date()
        };

        delete nuevaCita.id;
        delete nuevaCita.receta;
        delete nuevaCita.diagnostico;

        await addDoc(collection(this.firestore, 'citas'), nuevaCita);
      }

      await this.descargarWordAtencion();
      this.mostrarToast('Guardado en expediente y archivo generado');
      this.cerrarModal();
    } catch (error) {
      console.error('Error al procesar la atención médica:', error);
      this.mostrarToast('Error al guardar en el expediente');
    }
  }

  async descargarWordAtencion() {
    const tituloDoc = this.atencion.tipoDoc === 'receta' ? 'NOTAS Y PLAN TERAPÉUTICO' : 'CONSTANCIA PSICOLÓGICA';
    const paciente = `${this.citaSeleccionada?.pacienteNombre || ''} ${this.citaSeleccionada?.pacienteApellido || ''}`.trim() || 'Paciente';
    const fechaAtencion = new Date().toLocaleDateString('es-ES');

    const tieneDatosAntropometricos = this.atencion.pesoLbs || this.atencion.estaturaM || this.atencion.imc;
    const textoAntropometrico = `Peso: ${this.atencion.pesoLbs ? this.atencion.pesoLbs + ' lbs' : 'N/A'} | ` +
                                `Estatura: ${this.atencion.estaturaM ? this.atencion.estaturaM + ' m' : 'N/A'} | ` +
                                `IMC: ${this.atencion.imc ? this.atencion.imc + (this.atencion.clasificacionImc ? ' (' + this.atencion.clasificacionImc + ')' : '') : 'N/A'}`;

    const docu = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: `Dr(a). ${this.nombreDoctor}`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({
            text: `${this.especialidad}`,
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({
            text: `${this.descripcion}`,
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({
            text: `Correo: ${this.correoActual}`,
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({ text: '____________________________________________________', alignment: AlignmentType.CENTER }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: tituloDoc,
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Paciente: ', bold: true }),
              new TextRun(paciente),
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Fecha de emisión: ', bold: true }),
              new TextRun(fechaAtencion),
            ]
          }),
          ...(tieneDatosAntropometricos ? [
            new Paragraph({
              children: [
                new TextRun({ text: 'Datos Antropométricos: ', bold: true }),
                new TextRun(textoAntropometrico)
              ]
            })
          ] : []),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Notas de Sesión / Plan Terapéutico:', bold: true })
            ]
          }),
          new Paragraph({
            text: this.atencion.indicaciones || 'Sin notas adicionales.',
          }),
          new Paragraph({ text: '' }),
          ...(this.atencion.requiereProximaCita && this.atencion.fechaProximaCita ? [
            new Paragraph({
              children: [
                new TextRun({ text: 'Próxima Sesión Programada: ', bold: true }),
                new TextRun(new Date(this.atencion.fechaProximaCita).toLocaleString('es-ES'))
              ]
            })
          ] : []),
          new Paragraph({ text: '' }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: '__________________________________', alignment: AlignmentType.CENTER }),
          new Paragraph({ text: 'Firma y Sello del Profesional', alignment: AlignmentType.CENTER })
        ]
      }]
    });

    const blob = await Packer.toBlob(docu);
    saveAs(blob, `${tituloDoc}_${paciente.replace(/\s+/g, '_')}.docx`);
  }

  async subirExamenParaCita(event: any, cita: any) {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;

    try {
      this.mostrarToast(`Subiendo ${files.length} archivo(s)...`);
      const examenesExistentes: any[] = Array.isArray(cita.archivosExamenes) ? [...cita.archivosExamenes] : [];
      
      const storage = getStorage();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = `examenes/${cita.id}_${new Date().getTime()}_${file.name}`;
        const fileRef = ref(storage, filePath);

        await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(fileRef);

        examenesExistentes.push({
          nombre: file.name,
          url: downloadURL,
          fechaSubida: new Date()
        });
      }

      const citaRef = doc(this.firestore, 'citas', cita.id);
      await updateDoc(citaRef, {
        archivosExamenes: examenesExistentes,
        archivoExamenURL: examenesExistentes[0].url
      });

      cita.archivosExamenes = examenesExistentes;
      cita.archivoExamenURL = examenesExistentes[0].url;

      this.mostrarToast('¡Archivos adjuntados con éxito!');
    } catch (error) {
      console.error('Error al subir archivos:', error);
      this.mostrarToast('Error al subir los archivos');
    }
  }

  async cerrarSesion() {
    try {
      await signOut(this.auth);
      this.router.navigateByUrl('/login', { replaceUrl: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  get citasAtendidasFiltradas() {
    const atendidas = this.citas.filter(c => (c.estado || '').toLowerCase() === 'atendida');
    
    if (!this.filtroPaciente || this.filtroPaciente.trim() === '') {
      return atendidas;
    }

    const textoBusqueda = this.filtroPaciente.toLowerCase();
    return atendidas.filter(c => 
      (c.pacienteNombre || '').toLowerCase().includes(textoBusqueda) ||
      (c.diagnostico || '').toLowerCase().includes(textoBusqueda)
    );
  }

  async guardarDisponibilidad() {
    try {
      if (!this.correoActual) return;
      const dispDocRef = doc(this.firestore, `disponibilidades/${this.correoActual}`);

      // Garantizar duplicidad de tildes/sin tildes antes de enviar
      const diasFormateados = {
        ...this.diasLaborales,
        sabado: !!(this.diasLaborales['sabado'] ?? this.diasLaborales['sábado']),
        sábado: !!(this.diasLaborales['sábado'] ?? this.diasLaborales['sabado']),
        miercoles: !!(this.diasLaborales['miercoles'] ?? this.diasLaborales['miércoles']),
        miércoles: !!(this.diasLaborales['miércoles'] ?? this.diasLaborales['miercoles'])
      };
      
      await setDoc(dispDocRef, {
        horaInicio: this.horaInicio,
        horaFin: this.horaFin,
        diasLaborales: diasFormateados,
        diasBloqueados: this.diasBloqueados
      });

      this.mostrarToast('Disponibilidad guardada correctamente');
    } catch (error) {
      console.error('Error al guardar disponibilidad:', error);
    }
  }

  async mostrarToast(mensaje: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2500,
      position: 'bottom'
    });
    await toast.present();
  }

  confirmarYNotificarPorWhatsApp(cita: any) {
    let telefono = cita.telefono || cita.telefonoPaciente || cita.pacienteTelefono || cita.celular || '';
    telefono = telefono.toString().replace(/[^0-9]/g, '');

    if (telefono.length === 8) {
      telefono = '504' + telefono;
    }

    if (!telefono) {
      this.mostrarToast('El paciente no tiene un número de teléfono registrado');
      this.confirmarCita(cita);
      return;
    }

    const mensaje = encodeURIComponent(
      `Hola ${cita.pacienteNombre}, su cita para el día ${cita.fecha} a las ${cita.hora} ha sido CONFIRMADA.`
    );

    const urlWhatsApp = `https://api.whatsapp.com/send?phone=${telefono}&text=${mensaje}`;
    window.open(urlWhatsApp, '_blank');

    this.confirmarCita(cita);
  }

  async buscarHistorialEnBaseDeDatos() {
    const termino = this.busquedaPacienteBD ? this.busquedaPacienteBD.trim().toLowerCase() : '';
    
    if (termino.length < 2) {
      this.historialResultadosBD = [];
      return;
    }

    this.cargandoHistorialBD = true;

    try {
      const citasRef = collection(this.firestore, 'citas');
      const querySnapshot = await getDocs(citasRef);

      const resultados: any[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const nombrePaciente = (data['pacienteNombre'] || data['nombre'] || '').toLowerCase();
        const identidad = (data['pacienteIdentidad'] || data['cedula'] || '').toLowerCase();
        const estado = (data['estado'] || '').toLowerCase();
        const tipoDoc = (data['tipoDoc'] || '').toLowerCase();
        const tieneExamen = !!data['archivoExamenURL'];

        let cumpleFiltroTipo = true;
        if (this.filtroTipoRegistro === 'receta') {
          cumpleFiltroTipo = tipoDoc === 'receta';
        } else if (this.filtroTipoRegistro === 'incapacidad') {
          cumpleFiltroTipo = tipoDoc === 'incapacidad';
        } else if (this.filtroTipoRegistro === 'examen') {
          cumpleFiltroTipo = tieneExamen;
        }

        if (estado === 'atendida' && (nombrePaciente.includes(termino) || identidad.includes(termino)) && cumpleFiltroTipo) {
          resultados.push({
            id: docSnap.id,
            ...data
          });
        }
      });

      this.historialResultadosBD = resultados.sort((a, b) => {
        const fechaA = new Date(a.fechaAtencion?.toDate ? a.fechaAtencion.toDate() : a.fecha).getTime();
        const fechaB = new Date(b.fechaAtencion?.toDate ? b.fechaAtencion.toDate() : b.fecha).getTime();
        return fechaB - fechaA;
      });

    } catch (error) {
      console.error('Error al consultar historial clínico en Firestore:', error);
      this.mostrarToast('Error al realizar la consulta en la base de datos');
    } finally {
      this.cargandoHistorialBD = false;
    }
  }

  async reimprimirDocumento(cita: any) {
    const tituloDoc = 'DOCUMENTO DE ATENCIÓN PSICOLÓGICA';
    const paciente = `${cita.pacienteNombre || cita.nombre || 'Paciente'} ${cita.pacienteApellido || ''}`.trim();

    let fechaEmision = cita.fecha;
    if (cita.fechaAtencion) {
      fechaEmision = cita.fechaAtencion.toDate 
        ? cita.fechaAtencion.toDate().toLocaleDateString('es-ES') 
        : new Date(cita.fechaAtencion).toLocaleDateString('es-ES');
    }

    const docu = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: `Dr(a). ${cita.doctorNombre || this.nombreDoctor}`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({
            text: `${this.especialidad}`,
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({
            text: `Correo: ${this.correoActual}`,
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({ text: '____________________________________________________', alignment: AlignmentType.CENTER }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: `${tituloDoc} (DUPLICADO / REIMPRESIÓN)`,
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Paciente: ', bold: true }),
              new TextRun(paciente),
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Fecha de Consulta: ', bold: true }),
              new TextRun(fechaEmision),
            ]
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            children: [
              new TextRun({ text: 'Notas de Sesión Registradas:', bold: true })
            ]
          }),
          new Paragraph({
            text: cita.receta || cita.diagnostico || 'Sin notas adicionales.',
          }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: '' }),
          new Paragraph({ text: '__________________________________', alignment: AlignmentType.CENTER }),
          new Paragraph({ text: 'Firma y Sello del Profesional', alignment: AlignmentType.CENTER })
        ]
      }]
    });

    const blob = await Packer.toBlob(docu);
    saveAs(blob, `REIMPRESION_${paciente.replace(/\s+/g, '_')}.docx`);
    this.mostrarToast('Documento reimpreso y descargado con éxito');
  }

  async cargarDatosDoctor() {
    const usuarioActual = this.auth.currentUser;
    if (usuarioActual) {
      const docRef = doc(this.firestore, `users/${usuarioActual.uid}`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        this.pinDoctor = data['pinDoctor'] || '';
      }
    }
  }

  async guardarDisponibilidadYBuscar() {
    // Sincronizar estados de tildes y sin tildes antes de guardar en Firestore
    const sabadoValor = !!(this.diasLaborales['sabado'] ?? this.diasLaborales['sábado']);
    const domingoValor = !!(this.diasLaborales['domingo']);
    const miercolesValor = !!(this.diasLaborales['miercoles'] ?? this.diasLaborales['miércoles']);

    const diasNormalizados = {
      ...this.diasLaborales,
      sabado: sabadoValor,
      sábado: sabadoValor,
      domingo: domingoValor,
      miercoles: miercolesValor,
      miércoles: miercolesValor
    };

    const doctorData = {
      horaInicio: this.horaInicio,
      horaFin: this.horaFin,
      diasLaborales: diasNormalizados,
      diasBloqueados: this.diasBloqueados,
      pin: this.pinDoctor
    };

    try {
      const querySnapshot = await getDocs(collection(this.firestore, 'doctors'));
      let docIdEncontrado = '';

      querySnapshot.forEach((docSnap) => {
        const data: any = docSnap.data();
        const correoBD = (data.correo || data.email || '').trim().toLowerCase();
        if (correoBD === this.correoActual) {
          docIdEncontrado = docSnap.id;
        }
      });

      if (docIdEncontrado) {
        const doctorDocRef = doc(this.firestore, 'doctors', docIdEncontrado);
        await updateDoc(doctorDocRef, doctorData);
        
        // Sincronizar también con la colección disponibilidades
        await this.guardarDisponibilidad();

        this.mostrarToast('Configuración y PIN guardados correctamente');
        this.cerrarModalHorarios();
      } else {
        this.mostrarToast('No se encontró el perfil del doctor en la base de datos');
      }
    } catch (error) {
      console.error('Error al guardar configuración y PIN:', error);
      this.mostrarToast('Error al guardar en la base de datos');
    }
  }

  toggleDarkMode() {
    this.esModoOscuro = !this.esModoOscuro;
    const htmlTag = document.documentElement;
    const bodyTag = document.body;

    if (this.esModoOscuro) {
      htmlTag.classList.add('dark');
      bodyTag.classList.add('dark');
      localStorage.setItem('doctor_modo_oscuro', 'true');
    } else {
      htmlTag.classList.remove('dark');
      bodyTag.classList.remove('dark');
      localStorage.setItem('doctor_modo_oscuro', 'false');
    }
  }  

  abrirVistaPrevia() {
    if (!this.atencion.indicaciones.trim()) {
      this.mostrarToast('Por favor escribe las indicaciones antes de ver la vista previa');
      return;
    }
    this.isModalVistaPreviaOpen = true;
  }

  async confirmarDesdeVistaPrevia() {
    this.isModalVistaPreviaOpen = false;
    await this.guardarYGenerarWord();
  }

  obtenFechaActual(): string {
    return new Date().toLocaleDateString('es-ES');
  }

 async cancelarCita(cita: any) {
    const alert = await this.alertCtrl.create({
      header: 'Cancelar Cita',
      subHeader: `Paciente: ${cita.pacienteNombre || 'Paciente'}`,
      message: 'Por favor, escribe el motivo de la cancelación para el registro de auditoría:',
      inputs: [
        {
          name: 'motivo',
          type: 'textarea',
          placeholder: 'Ej. Emergencia médica, inasistencia del paciente...'
        }
      ],
      buttons: [
        { 
          text: 'Volver', 
          role: 'cancel' 
        },
        {
          text: 'Confirmar Cancelación',
          role: 'destructive',
          handler: async (data) => {
            // Validar que el usuario haya escrito un motivo
            if (!data.motivo || data.motivo.trim() === '') {
              this.mostrarToast('El motivo de cancelación es obligatorio');
              return false; // Evita que se cierre la alerta si está vacío
            }

            try {
              const citaRef = doc(this.firestore, 'citas', cita.id);
              const fechaHoraActual = new Date();

              const datosCancelacion = {
                estado: 'cancelada',               // Coincide con tu filtro lowercase
                motivoCancelacion: data.motivo.trim(), // Motivo ingresado en el cuadro de texto
                canceladaEn: fechaHoraActual,       // Fecha y hora exacta (Auditoría)
                canceladoPor: 'Doctor'             // Rol que ejecutó la acción (Auditoría)
              };

              // Actualizar en Firebase Firestore
              await updateDoc(citaRef, datosCancelacion);

              // Actualizar de forma local en el arreglo para ver el cambio instantáneo
              cita.estado = 'cancelada';
              cita.motivoCancelacion = data.motivo.trim();
              cita.canceladaEn = fechaHoraActual;
              cita.canceladoPor = 'Doctor';

              this.mostrarToast('Cita cancelada correctamente');
              return true;
            } catch (error) {
              console.error('Error al cancelar la cita:', error);
              this.mostrarToast('Error al procesar la cancelación en la base de datos');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

abrirModalNuevaCita() {
    // 1. Limpiamos o inicializamos el formulario con todas las propiedades requeridas
    this.nuevaCita = {
      pacienteId: 'manual_' + new Date().getTime(), // ID temporal para citas creadas por el doctor
      nombrePaciente: '',
      telefono: '',
      fecha: '',
      hora: '',
      motivo: '',
      estado: 'confirmada'
    };
    
    // 2. Controlamos correctamente la apertura del modal como booleano
    this.isModalNuevaCitaOpen = true;
  }

  cerrarModalNuevaCita() {
    this.isModalNuevaCitaOpen = false;
  }

  async guardarNuevaCitaDoctor() {
    if (!this.nuevaCita.nombrePaciente || !this.nuevaCita.fecha || !this.nuevaCita.hora) {
      this.mostrarToast('Por favor completa los campos obligatorios');
      return;
    }

    try {
      // Guardar directamente en la colección 'citas' de Firestore
      const citaData = {
        ...this.nuevaCita,
        doctorNombre: this.nombreDoctor,
        doctorCorreo: this.correoActual,
        fechaCreacion: new Date()
      };

      await addDoc(collection(this.firestore, 'citas'), citaData);

      this.mostrarToast('¡Cita creada y confirmada con éxito!');
      this.isModalNuevaCitaOpen = false;
    } catch (error) {
      console.error('Error al guardar la cita:', error);
      this.mostrarToast('Error al guardar la cita en la base de datos');
    }
  }
}