import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonCard, 
  IonCardContent, 
  IonItem, 
  IonLabel, 
  IonSelect, 
  IonSelectOption, 
  IonSpinner,
  IonButton,
  IonIcon,
  IonMenuButton,
  IonButtons,
  AlertController, 
  IonText, 
  IonList, 
  IonCardHeader, 
  IonCardSubtitle, 
  IonCardTitle, 
  IonCol, 
  IonModal, 
  IonRow, 
  IonGrid, 
  IonDatetimeButton, 
  IonDatetime, 
  IonSearchbar 
} from '@ionic/angular/standalone';
import { Firestore, collection, getDocs, onSnapshot, query, doc, updateDoc, addDoc, Timestamp, getDoc } from '@angular/fire/firestore';
import { Auth, signOut, onAuthStateChanged } from '@angular/fire/auth';
import { addIcons } from 'ionicons';
import { logOutOutline, addCircleOutline, printOutline, documentTextOutline, cardOutline, calendarOutline, lockClosedOutline, square, timeOutline, checkmarkCircleOutline, logoWhatsapp } from 'ionicons/icons';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-secretaria',
  templateUrl: './secretaria.page.html',
  styleUrls: ['./secretaria.page.scss'],
  standalone: true,
  imports: [
    IonSearchbar, 
    IonDatetimeButton, 
    IonGrid, 
    IonRow, 
    IonModal, 
    IonCol, 
    IonCardTitle, 
    IonCardSubtitle, 
    IonCardHeader, 
    IonList, 
    IonText, 
    CommonModule, 
    FormsModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonCard, 
    IonCardContent, 
    IonItem, 
    IonLabel, 
    IonSelect, 
    IonSelectOption, 
    IonSpinner,
    IonButton,
    IonIcon,
    IonButtons,
    IonMenuButton, 
    IonDatetime
  ]
})
export class SecretariaPage {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private http = inject(HttpClient);
  
  nombre: string = ''; 
  citas: any[] = [];
  cargando = false;

  // Variables de agenda y filtros
  fechaFiltro: string = new Date().toISOString(); 
  doctorFiltro: string = 'Todos'; 
  doctoresDisponibles: any[] = [];
  textoBusqueda: string = '';

  metricas = {
    total: 0,
    enEspera: 0,
    atendidos: 0
  };

  citasFiltradas: any[] = [];
  fechaMinima: string = new Date().toISOString().split('T')[0]; 

  horariosGenerales: string[] = [
    '08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'
  ];
  horasOcupadasDelDia: string[] = [];

  constructor(private toastController: ToastController) {
    addIcons({logOutOutline,addCircleOutline,calendarOutline,timeOutline,checkmarkCircleOutline,square,logoWhatsapp,lockClosedOutline,printOutline,cardOutline,documentTextOutline});
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }

  ngOnInit() {
    this.cargarAgendaDelDia();
  }

  async ionViewWillEnter() {
    this.cargarNombreSecretaria();
    await this.cargarDoctoresDisponibles();
    await this.cargarCitasSecretaria();
  }

  cargarNombreSecretaria() {
    try {
      onAuthStateChanged(this.auth, (usuarioActual) => {
        if (usuarioActual) {
          const docRef = doc(this.firestore, `users/${usuarioActual.uid}`);
          onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              this.nombre = data?.['nombre'] || 'Secretaria';
            } else {
              this.nombre = 'Secretaria';
            }
          });
        } else {
          this.nombre = 'Secretaria';
        }
      });
    } catch (error) {
      console.error('Error al obtener el nombre de la secretaria:', error);
      this.nombre = 'Secretaria';
    }
  }

  async cargarCitasSecretaria() {
    this.cargando = true;
    try {
      const qCitas = query(collection(this.firestore, 'citas'));
      const citasSnap = await getDocs(qCitas);
      this.citas = citasSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      this.cargarAgendaDelDia(); 
    } catch (error) {
      console.error('Error al cargar citas:', error);
    } finally {
      this.cargando = false;
    }
  }

  // Procesa la disponibilidad visual, lista filtrada y métricas según el día seleccionado
  cargarAgendaDelDia() {
    if (!this.citas) return;

    const fechaBase = this.fechaFiltro ? this.fechaFiltro : new Date().toISOString();
    const fechaSeleccionada = fechaBase.split('T')[0];

    this.horasOcupadasDelDia = [];

    this.citas.forEach(cita => {
      const citaFecha = cita.fecha ? cita.fecha.trim() : ''; 
      const citaHora = cita.hora ? cita.hora.trim() : '';
      const citaDoctor = cita.medicoNombre ? cita.medicoNombre.trim() : '';
      
      const coincideDoctor = this.doctorFiltro === 'Todos' || citaDoctor === this.doctorFiltro;

      if (citaFecha === fechaSeleccionada && cita.estado !== 'cancelada' && coincideDoctor) {
        this.horasOcupadasDelDia.push(citaHora);
      }
    });

    this.filtrarCitas();
    this.calcularMetricas();
  }

  // Filtra las citas mostradas asegurando que correspondan AL DÍA SELECCIONADO y ordenadas por HORA
  // Filtra las citas mostradas y las ordena por FECHA y HORA
  filtrarCitas() {
    const texto = this.textoBusqueda.toLowerCase().trim();
    const fechaSeleccionada = this.fechaFiltro ? this.fechaFiltro.split('T')[0] : '';
    
    this.citasFiltradas = this.citas
      .filter(cita => {
        // 1. Filtrar exactamente por la fecha seleccionada
        const citaFecha = cita.fecha ? cita.fecha.trim() : '';
        const coincideFecha = citaFecha === fechaSeleccionada;

        // 2. Coincidencia por texto del paciente
        const nombreCompleto = `${cita.pacienteNombre || ''} ${cita.pacienteApellido || ''}`.toLowerCase();
        const coincideTexto = texto === '' || nombreCompleto.includes(texto);
        
        // 3. Coincidencia por Doctor
        const citaDoctor = cita.medicoNombre ? cita.medicoNombre.trim() : '';
        const coincideDoctor = this.doctorFiltro === 'Todos' || citaDoctor === this.doctorFiltro;

        return coincideFecha && coincideTexto && coincideDoctor;
      })
      .sort((a, b) => {
        // 1. Comparar primero por Fecha (YYYY-MM-DD)
        const fechaA = a.fecha || '';
        const fechaB = b.fecha || '';
        const comparacionFecha = fechaA.localeCompare(fechaB);

        // Si las fechas son distintas, las ordena por fecha
        if (comparacionFecha !== 0) {
          return comparacionFecha;
        }

        // 2. Si es la misma fecha, compara por Hora (HH:mm)
        const horaA = a.hora || '';
        const horaB = b.hora || '';
        return horaA.localeCompare(horaB);
      });
  }

  calcularMetricas() {
    if (!this.citas) return;
    const fechaSeleccionada = this.fechaFiltro ? this.fechaFiltro.split('T')[0] : '';
    
    let total = 0;
    let enEspera = 0;
    let atendidos = 0;

    this.citas.forEach(cita => {
      const citaFecha = cita.fecha ? cita.fecha.trim() : '';
      const citaDoctor = cita.medicoNombre ? cita.medicoNombre.trim() : '';
      const estadoCita = (cita.estado || '').toLowerCase().trim();
      
      const coincideDoctor = this.doctorFiltro === 'Todos' || citaDoctor === this.doctorFiltro;

      if (citaFecha === fechaSeleccionada && estadoCita !== 'cancelada' && coincideDoctor) {
        total++;
        
        if (estadoCita === 'pendiente' || estadoCita === 'confirmada') {
          enEspera++;
        } else if (estadoCita === 'atendida') {
          atendidos++;
        }
      }
    });

    this.metricas = { total, enEspera, atendidos };
  }

  isHoraOcupada(hora: string): boolean {
    return this.horasOcupadasDelDia.includes(hora);
  }

  async reprogramarCita(cita: any) {
    const alert = await this.alertCtrl.create({
      header: 'Reprogramar Cita',
      subHeader: `Paciente: ${cita.pacienteNombre}`,
      inputs: [
        { name: 'fecha', type: 'date', value: cita.fecha },
        { name: 'hora', type: 'time', value: cita.hora }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar Cambios',
          handler: async (data) => {
            if (!data.fecha || !data.hora) {
              this.mostrarAlertaError('Debe seleccionar fecha y hora para reprogramar.');
              return false;
            }

            const horarioOcupado = this.citas.some(c => 
              c.id !== cita.id &&
              c.fecha === data.fecha &&
              c.hora === data.hora &&
              c.estado !== 'cancelada' &&
              c.medicoNombre === cita.medicoNombre
            );

            if (horarioOcupado) {
              this.mostrarAlertaError(`El horario de las ${data.hora} ya está ocupado para este doctor. Elija otro.`);
              return false;
            }

            try {
              const citaRef = doc(this.firestore, `citas/${cita.id}`);
              await updateDoc(citaRef, { 
                fecha: data.fecha, 
                hora: data.hora 
              });
              
              await this.cargarCitasSecretaria();
              return true;
            } catch (error) {
              console.error('Error al reprogramar:', error);
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async cargarDoctoresDisponibles() {
    try {
      const qDoctores = query(collection(this.firestore, 'doctors'));
      const doctoresSnap = await getDocs(qDoctores);
      this.doctoresDisponibles = [];
      doctoresSnap.forEach(docSnap => {
        const data = docSnap.data();
        if (data['nombre']) {
          this.doctoresDisponibles.push({
            nombre: data['nombre'],
            especialidad: data['especialidadNombre'] || 'General'
          });
        }
      });
      this.doctorFiltro = 'Todos'; 
    } catch (error) {
      console.error('Error al cargar la lista de doctores:', error);
    }
  }

  async abrirModalAgendarExterno() {
    try {
      const qDoctores = query(collection(this.firestore, 'doctors'));
      const doctoresSnap = await getDocs(qDoctores);
      
      let opcionesDoctores: any[] = [];
      doctoresSnap.forEach(docSnap => {
        const data = docSnap.data();
        opcionesDoctores.push({
          nombre: data['nombre'] || 'Doctor',
          especialidad: data['especialidadNombre'] || 'General'
        });
      });

      if (opcionesDoctores.length === 0) {
        opcionesDoctores = [
          { nombre: 'Karen Banessa Monroy', especialidad: 'Psicologo' }
        ];
      }

      let selectHtml = '<select id="medicoSelect" class="ion-alert-input" style="width: 100%; padding: 10px; margin-top: 10px; border-radius: 5px; border: 1px solid #ccc;">';
      opcionesDoctores.forEach(doc => {
        selectHtml += `<option value="${doc.nombre}|${doc.especialidad}">${doc.nombre} (${doc.especialidad})</option>`;
      });
      selectHtml += '</select>';

      const alert = await this.alertCtrl.create({
        header: 'Agendar Cita (Paciente Externo)',
        message: 'Seleccione el doctor y complete los datos:',
        inputs: [
          { name: 'pacienteNombre', type: 'text', placeholder: 'Nombre del Paciente' },
          { name: 'telefono', type: 'tel', placeholder: 'Teléfono / WhatsApp (ej: 99887766)' },
          { name: 'fecha', type: 'date', placeholder: 'Fecha (YYYY-MM-DD)' },
          { name: 'hora', type: 'time', placeholder: 'Hora (HH:mm)' },
          { name: 'motivo', type: 'textarea', placeholder: 'Motivo de la consulta' }
        ],
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          {
            text: 'Guardar Cita',
            handler: async (data) => {
              const selectElement = document.getElementById('medicoSelect') as HTMLSelectElement;
              const [medicoNombre, especialidad] = selectElement ? selectElement.value.split('|') : ['Médico General', 'General'];

              if (!data.pacienteNombre || !data.fecha || !data.hora) {
                return false;
              }

              const horarioOcupado = this.citas.some(cita => {
                const citaFecha = cita.fecha ? cita.fecha.trim() : '';
                const citaHora = cita.hora ? cita.hora.trim() : '';
                
                return citaFecha === data.fecha && 
                       citaHora === data.hora && 
                       cita.estado !== 'cancelada' &&
                       cita.medicoNombre === medicoNombre;
              });

              if (horarioOcupado) {
                this.mostrarAlertaError(`El horario de las ${data.hora} ya está ocupado para este doctor. Por favor seleccione otro.`);
                return false;
              }

              try {
                await addDoc(collection(this.firestore, 'citas'), {
                  pacienteNombre: data.pacienteNombre,
                  pacienteId: 'externo_' + Date.now(),
                  telefono: data.telefono || '',
                  pacienteTelefono: data.telefono || '',
                  medicoNombre: medicoNombre,
                  especialidad: especialidad,
                  fecha: data.fecha,
                  hora: data.hora,
                  motivo: data.motivo || 'Consulta externa',
                  estado: 'pendiente',
                  receta: '',
                  creadoEn: Timestamp.now()
                });
                await this.cargarCitasSecretaria();
                return true;
              } catch (err) {
                console.error('Error al registrar cita externa:', err);
                return false;
              }
            }
          }
        ]
      });

      await alert.present();

      setTimeout(() => {
        const alertContainer = document.querySelector('.alert-wrapper');
        if (alertContainer) {
          const customDiv = document.createElement('div');
          customDiv.style.padding = '0 20px';
          customDiv.innerHTML = `<label style="font-size: 12px; color: #666; display: block; margin-top: 5px;">Seleccione Doctor:</label>${selectHtml}`;
          alertContainer.insertBefore(customDiv, alertContainer.querySelector('.alert-button-group'));
        }
      }, 100);

    } catch (error) {
      console.error('Error al obtener lista de doctores:', error);
    }
  }

  async marcarNoAsistio(cita: any) {
    const alert = await this.alertCtrl.create({
      header: '¿Paciente no se presentó?',
      message: `El horario de las ${cita.hora} quedará libre inmediatamente para otro paciente. ¿Desea continuar?`,
      buttons: [
        { text: 'Volver', role: 'cancel' },
        {
          text: 'Sí, liberar horario',
          handler: async () => {
            try {
              const citaRef = doc(this.firestore, `citas/${cita.id}`);
              await updateDoc(citaRef, { estado: 'cancelada' });
              
              cita.estado = 'cancelada';
              this.cargarAgendaDelDia(); 
            } catch (error) {
              console.error('Error al liberar horario:', error);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async solicitarPermisoYEditar(cita: any) {
    const alert = await this.alertCtrl.create({
      header: 'Autorización Requerida',
      subHeader: `Ingrese el PIN del ${cita.medicoNombre || 'Doctor'} para editar la receta:`,
      inputs: [
        {
          name: 'pin',
          type: 'password',
          placeholder: 'PIN de 4 dígitos',
          attributes: {
            maxlength: 4,
            inputmode: 'numeric'
          }
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Validar PIN',
          handler: async (data) => {
            if (!data.pin) {
              this.mostrarAlertaError('Debe ingresar un PIN.');
              return false;
            }

            try {
              const qDoctor = query(collection(this.firestore, 'doctors'));
              const doctorSnap = await getDocs(qDoctor);

              let pinGuardado = '1234';
              let doctorEncontrado = false;

              const limpiarTexto = (texto: string) => 
                (texto || '')
                  .toLowerCase()
                  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                  .replace(/^(doctora|doctor|dra|dr)\.?\s*/i, '')
                  .trim();

              const medicoNombreCita = limpiarTexto(cita.medicoNombre || cita.doctorNombre || '');

              doctorSnap.forEach((docSnap) => {
                const doctorData = docSnap.data();
                const nombreBd = limpiarTexto(doctorData['nombre'] || '');
                const pinDelDoctor = doctorData['pin'] || doctorData['pinDoctor'];

                const matchNombre = nombreBd.length > 0 && medicoNombreCita.length > 0 && 
                                   (nombreBd.includes(medicoNombreCita) || medicoNombreCita.includes(nombreBd));

                if (matchNombre) {
                  doctorEncontrado = true;
                  if (pinDelDoctor) {
                    pinGuardado = String(pinDelDoctor);
                  }
                }
              });

              if (String(data.pin).trim() === String(pinGuardado).trim()) {
                this.editarReceta(cita);
                return true;
              } else {
                this.mostrarAlertaError('PIN Incorrecto. No tiene autorización para modificar la receta.');
                return false;
              }
            } catch (err) {
              console.error('Error al verificar PIN:', err);
              this.mostrarAlertaError('Ocurrió un error al verificar el PIN.');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async editarReceta(cita: any) {
    const alert = await this.alertCtrl.create({
      header: 'Gestionar Receta Médica',
      subHeader: `Paciente: ${cita.pacienteNombre} ${cita.pacienteApellido || ''}`,
      inputs: [
        {
          name: 'receta',
          type: 'textarea',
          placeholder: 'Escriba la receta o medicamentos...',
          value: cita.receta || ''
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar Receta',
          handler: async (data) => {
            try {
              const citaRef = doc(this.firestore, 'citas', cita.id);
              await updateDoc(citaRef, { receta: data.receta });
              cita.receta = data.receta;
            } catch (err) {
              console.error('Error al guardar receta:', err);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async mostrarAlertaError(mensaje: string) {
    const alert = await this.alertCtrl.create({
      header: 'Acceso Denegado',
      message: mensaje,
      buttons: ['Aceptar']
    });
    await alert.present();
  }

  imprimirReceta(cita: any) {
    const ventanaImpresion = window.open('', '_blank');
    if (ventanaImpresion) {
      ventanaImpresion.document.write(`
        <html>
          <head>
            <title>Receta Médica - ${cita.pacienteNombre} ${cita.pacienteApellido || ''}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
              .content { margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>Receta Médica Oficial</h2>
              <p><b>Especialidad:</b> ${cita.especialidad} | <b>Doctor:</b> ${cita.medicoNombre}</p>
            </div>
            <div class="content">
              <p><b>Paciente:</b> ${cita.pacienteNombre} ${cita.pacienteApellido || ''}</p>
              <p><b>Fecha de Atención:</b> ${cita.fecha}</p>
              <h3>Prescripción / Medicamentos:</h3>
              <p style="white-space: pre-wrap; background: #f9f9f9; padding: 15px; border: 1px solid #ddd;">${cita.receta || 'Sin receta registrada.'}</p>
            </div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      ventanaImpresion.document.close();
    }
  }

  async cambiarEstadoCita(citaId: string, nuevoEstado: string) {
    try {
      const citaRef = doc(this.firestore, `citas/${citaId}`);
      await updateDoc(citaRef, { estado: nuevoEstado });

      const cita = this.citas.find(c => c.id === citaId);

      if (cita) {
        cita.estado = nuevoEstado;
        if (nuevoEstado.toLowerCase() === 'confirmada') {
          const correoDestino = cita.correoPaciente || cita.correo;
          if (correoDestino) {
            this.enviarConfirmacion(correoDestino, cita);
          }
        }
      }
    } catch (error) {
      console.error('Error al actualizar el estado de la cita:', error);
    }
    this.cargarAgendaDelDia();
  }

  enviarConfirmacion(correoPaciente: string, cita: any) {
    const nombre = cita?.pacienteNombre || 'Paciente';
    const apellido = cita?.pacienteApellido || '';
    const nombreCompleto = `${nombre} ${apellido}`.trim();

    const payload = {
      email: correoPaciente,
      cita: {
        fecha: cita.fecha,
        hora: cita.hora,
        doctor: cita.medicoNombre || 'Doctor',
        paciente: nombreCompleto !== '' ? nombreCompleto : 'Paciente'
      }
    };

    this.http.post('http://localhost:3000/api/enviar-correo', payload)
      .subscribe({
        next: (res) => console.log(`Correo enviado a ${correoPaciente}`, res),
        error: (err) => console.error('Error en servicio de correo:', err)
      });
  }

  async abrirModalMetodoPago(cita: any) {
    const alert = await this.alertCtrl.create({
      header: 'Seleccionar método de pago',
      subHeader: `Paciente: ${cita.pacienteNombre}`,
      buttons: [
        {
          text: 'Pagar con PayPal',
          handler: () => {
            this.guardarYActualizarMetodo(cita, 'PayPal');
            window.open('https://www.paypal.com/signin', '_blank');
          }
        },
        {
          text: 'Tarjeta de débito o crédito',
          handler: () => {
            this.guardarYActualizarMetodo(cita, 'Tarjeta');
            this.abrirFormularioTarjeta(cita);
          }
        },
        {
          text: 'Efectivo en clínica',
          handler: () => {
            this.guardarYActualizarMetodo(cita, 'Efectivo en clínica');
          }
        }
      ]
    });

    await alert.present();
  }

  async abrirFormularioTarjeta(cita: any) {
    const alertTarjeta = await this.alertCtrl.create({
      header: 'Tarjeta de débito o crédito',
      subHeader: 'Total a pagar: 300.00 LPS',
      inputs: [
        { name: 'numeroTarjeta', type: 'text', placeholder: 'Número de tarjeta' },
        { name: 'vencimiento', type: 'text', placeholder: 'Vencimiento (MM/AA)' },
        { name: 'csc', type: 'password', placeholder: 'CSC', max: 4 }
      ],
      buttons: [
        { text: 'CANCELAR', role: 'cancel' },
        {
          text: 'Pagar 300.00 LPS',
          handler: (datos) => {
            if (!datos.numeroTarjeta || !datos.vencimiento || !datos.csc) {
              return false;
            }
            return true;
          }
        }
      ]
    });

    await alertTarjeta.present();
  }

  async guardarYActualizarMetodo(cita: any, nuevoMetodo: string) {
    try {
      cita.metodoPago = nuevoMetodo;
      const citaRef = doc(this.firestore, `citas/${cita.id}`);
      await updateDoc(citaRef, { metodoPago: nuevoMetodo });
    } catch (error) {
      console.error('Error al actualizar método de pago:', error);
    }
  }

async enviarRecordatorioWhatsApp(cita: any) {
  // 1. Verificar si la cita ya trae el teléfono
  let telefono = cita.telefono || cita.pacienteTelefono || cita.celular;

  // 2. Si no lo trae, buscarlo en Firestore usando la API Modular (doc/getDoc)
  if (!telefono && (cita.pacienteId || cita.uid)) {
    try {
      const userId = cita.pacienteId || cita.uid;
      const userRef = doc(this.firestore, 'users', userId); // Usa 'usuarios' o 'users' según tu BD
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        telefono = userData['telefono'] || userData['celular'] || userData['phone'];
      }
    } catch (e) {
      console.error('Error obteniendo el teléfono del usuario:', e);
    }
  }

  // 3. Si sigue sin teléfono, notificar al usuario
  if (!telefono) {
    this.mostrarToast('Esta cita no tiene un número de teléfono asignado.', 'warning');
    return;
  }

  // 4. Formatear datos y enviar al servidor de Node.js / Express
  const body = {
    telefono: telefono,
    pacienteNombre: `${cita.pacienteNombre || cita.paciente || ''} ${cita.pacienteApellido || ''}`.trim(),
    horaCita: cita.hora || '08:00',
    doctorNombre: cita.medicoNombre || cita.doctorNombre || 'Doctor(a)'
  };

  this.http.post('http://localhost:3000/api/enviar-whatsapp', body).subscribe({
    next: () => this.mostrarToast('Recordatorio enviado por WhatsApp', 'success'),
    error: (err) => {
      console.error('Error al enviar:', err);
      this.mostrarToast('Error al enviar el mensaje por WhatsApp', 'danger');
    }
  });
}
async enviarRecordatoriosProximaHora() {
  const ahora = new Date();
  
  // Filtrar las citas que estén pendientes y cuya hora esté dentro de los próximos 60 minutos
  const citasProximas = this.citasFiltradas.filter((cita: any) => {
    // Si la cita no está pendiente o no tiene hora/fecha, se ignora
    if (cita.estado === 'Atendida' || cita.estado === 'Cancelada' || !cita.hora) {
      return false;
    }

    // Parsear fecha y hora de la cita (asumiendo fecha 'YYYY-MM-DD' y hora 'HH:mm')
    const fechaBase = cita.fecha || ahora.toISOString().split('T')[0];
    const fechaHoraCita = new Date(`${fechaBase}T${cita.hora}:00`);

    // Calcular la diferencia en minutos
    const diferenciaMinutos = (fechaHoraCita.getTime() - ahora.getTime()) / (1000 * 60);

    // Selecciona citas que ocurran entre ahora (0 min) y los próximos 60 min (puedes ajustar el rango, ej. 0 a 120)
    return diferenciaMinutos >= 0 && diferenciaMinutos <= 60;
  });

  if (citasProximas.length === 0) {
    this.mostrarToast('No hay citas agendadas dentro de la próxima hora.', 'info');
    return;
  }

  this.mostrarToast(`Encontradas ${citasProximas.length} cita(s). Enviando recordatorios...`, 'primary');

  // Recorrer las citas encontradas y enviar con pausa de 2 segundos entre envíos
  let enviadas = 0;
  for (const cita of citasProximas) {
    await this.enviarRecordatorioWhatsApp(cita);
    enviadas++;
    // Pausa de 2 segundos para no saturar el socket de Baileys
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  this.mostrarToast(`Proceso finalizado. Se enviaron ${enviadas} recordatorios.`, 'success');
}

async obtenerCitas() {
  this.cargando = true;
  try {
    const citasRef = collection(this.firestore, 'citas');
    const querySnapshot = await getDocs(citasRef);

    this.citasFiltradas = await Promise.all(
      querySnapshot.docs.map(async (documento) => {
        const data = documento.data();
        const id = documento.id;

        let telefono = data['telefono'] || data['pacienteTelefono'] || data['telefonoContacto'];

        // Si no tiene teléfono en la cita pero existe el pacienteId, buscarlo en 'usuarios'
        if (!telefono && data['pacienteId']) {
          const userDocRef = doc(this.firestore, 'usuarios', data['pacienteId']);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            telefono = userData['telefono'] || userData['celular'] || userData['phone'];
          }
        }

        return {
          id,
          ...data,
          pacienteTelefono: telefono
        };
      })
    );
  } catch (error) {
    console.error('Error obteniendo citas de Firestore:', error);
  } finally {
    this.cargando = false;
  }
}


  async cerrarSesion() {
    try {
      await signOut(this.auth);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}