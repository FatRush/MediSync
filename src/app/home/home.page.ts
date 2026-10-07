import { Component, Injector, runInInjectionContext, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IaService } from '../services/ia.service';
import { MedicosService, Medico } from '../services/medico.service';
import { collectionData, doc, updateDoc } from '@angular/fire/firestore';
import { 
  NavController, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons, 
  IonButton, 
  IonIcon, 
  IonPopover, 
  IonList, 
  IonListHeader, 
  IonItem, 
  IonLabel, 
  IonCard, 
  IonCardContent,
  IonSearchbar,
  AlertController,
  LoadingController, 
  IonBadge, IonToggle } from '@ionic/angular/standalone';
import { Auth, signOut } from '@angular/fire/auth';
import { Firestore, collection, getDocs, query, where, orderBy } from '@angular/fire/firestore';
import { PacienteService } from '../services/paciente.service';

import { addIcons } from 'ionicons';
import { 
  ellipsisVertical, 
  calendarNumberOutline, 
  timeOutline, 
  personCircleOutline, 
  settingsOutline, 
  logOutOutline, 
  documentTextOutline,
  sparklesOutline, calendarOutline, personOutline, chatbubblesOutline, searchOutline, cardOutline, cashOutline, moonOutline } from 'ionicons/icons';

// Declaramos la variable global de PayPal para que TypeScript no marque error
declare var paypal: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [ 
    IonBadge, 
    CommonModule,
    FormsModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonButtons, 
    IonButton, 
    IonIcon, 
    IonPopover, 
    IonList,  
    IonItem, 
    IonLabel, 
    IonCard, 
    IonCardContent,
    IonSearchbar
  ]
})
export class HomePage {
  paciente: any = null;
  recetas: any[] = [];
  citas: any[] = [];
  citasPendientes: any[] = []; 
  medicos: Medico[] = [];
  medicosFiltrados: Medico[] = [];
  cargando = false;
  textoBusqueda: string = '';
  usuarioLogueado = true;
  citaProxima: any = null;
  usuarioId: string = '';
  darkMode: boolean = false;

  // Controla qué cita tiene desplegado el botón de PayPal
  citaSeleccionadaParaPago: string | null = null;

  private medicosService = inject(MedicosService);

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router,
    private navCtrl: NavController,
    private pacienteService: PacienteService,
    private injector: Injector,
    private alertCtrl: AlertController,
    private loadingController: LoadingController,
    private iaService: IaService,
  ) {
    addIcons({moonOutline,ellipsisVertical,calendarNumberOutline,timeOutline,personCircleOutline,logOutOutline,personOutline,searchOutline,sparklesOutline,documentTextOutline,calendarOutline,cardOutline,cashOutline,chatbubblesOutline,settingsOutline});
  }

ngOnInit() {
  const user = this.auth.currentUser;
  if (user) {
    this.usuarioId = user.uid;
    this.cargarCitasEnTiempoReal();
  } else {
    console.warn('No hay ningún usuario autenticado.');
  }

  // Leer la preferencia de forma consistente
  const savedMode = localStorage.getItem('home_dark_mode') === 'true';
  this.darkMode = savedMode;
  
  // Aplicar el estado inicial al body de manera global
  document.body.classList.toggle('dark', this.darkMode);
}

  async ionViewWillEnter() {
    
    this.cargarDatosHome();
    await runInInjectionContext(this.injector, async () => {
      await this.cargarInformacion();
      this.cargarRedMedicos();
    });
  }

  cargarDatosHome() {
    // Llama a tu servicio para obtener la información actualizada
  }

  async cargarInformacion() {
    const usuario = this.auth.currentUser;

    if (!usuario) {
      this.router.navigate(['/login']);
      return;
    }

    this.cargando = true;

    try {
      this.paciente = await this.pacienteService.obtenerPaciente(usuario.uid);
      
      await runInInjectionContext(this.injector, async () => {
        await Promise.all([
          this.cargarRecetasMedicas(usuario.uid),
          this.cargarCitasMedicas(usuario.uid)
        ]);
      });

    } catch (error) {
      console.error('Error obteniendo información:', error);
    } finally {
      this.cargando = false;
    }
  }

  async cargarRecetasMedicas(uidPaciente: string) {
    try {
      const q = query(collection(this.firestore, 'recetas'), where('pacienteId', '==', uidPaciente));
      const querySnapshot = await getDocs(q);
      this.recetas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error cargando recetas:', error);
    }
  }
  
  cargarCitasEnTiempoReal() {
    if (!this.usuarioId) return;

    try {
      const citasRef = collection(this.firestore, 'citas');
      
      const q = query(
        citasRef,
        where('usuarioId', '==', this.usuarioId),
        where('estado', '==', 'pendiente'),
        orderBy('fecha', 'asc')
      );

      collectionData(q, { idField: 'id' }).subscribe({
        next: (citas: any[]) => {
          if (citas && citas.length > 0) {
            this.citasPendientes = citas.map(c => ({
              ...c,
              medicoNombre: c.medicoNombre || c.doctorNombre || c.medico || 'Por asignar',
              especialidad: c.especialidad || 'General'
            }));
            this.citaProxima = this.citasPendientes[0];
          } else {
            this.citasPendientes = [];
            this.citaProxima = null;
          }
        },
        error: (err) => {
          console.error('Error al cargar las citas:', err);
        }
      });
    } catch (error) {
      console.error('Error al armar la consulta:', error);
    }
  }

  async cargarCitasMedicas(uidPaciente: string) {
    try {
      const q = query(collection(this.firestore, 'citas'), where('pacienteId', '==', uidPaciente));
      const querySnapshot = await getDocs(q);
      this.citas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const hoy = new Date().toISOString().split('T')[0];
      
      this.citasPendientes = this.citas.filter((c: any) => c.fecha >= hoy && c.estado === 'pendiente');
      
      if (this.citasPendientes.length > 0) {
        this.citasPendientes.sort((a, b) => a.fecha.localeCompare(b.fecha));
        this.citaProxima = this.citasPendientes[0];
      } else {
        this.citaProxima = null;
      }

    } catch (error) {
      console.error('Error cargando citas:', error);
    }
  }

  get citasFiltradas() {
    const conReceta = this.citas.filter(cita => cita.receta && cita.receta.trim() !== '');
    
    if (!this.textoBusqueda || this.textoBusqueda.trim() === '') {
      return conReceta;
    }

    const termino = this.textoBusqueda.toLowerCase();
    return conReceta.filter(cita => 
      (cita.medicoNombre && cita.medicoNombre.toLowerCase().includes(termino)) ||
      (cita.especialidad && cita.especialidad.toLowerCase().includes(termino)) ||
      (cita.receta && cita.receta.toLowerCase().includes(termino)) ||
      (cita.motivo && cita.motivo.toLowerCase().includes(termino))
    );
  }

  async buscarAlternativasIA(cita: any) {
    const medicamento = cita.receta || 'medicamento';
    const loading = await this.loadingController.create({ message: `Consultando alternativas para ${medicamento}...` });
    await loading.present();

    try {
      const respuestaIA = await this.iaService.obtenerAlternativasMedicamento(medicamento);
      await loading.dismiss();
      const alert = await this.alertCtrl.create({
        header: 'Alternativas de la IA',
        message: respuestaIA,
        buttons: ['Entendido']
      });
      await alert.present();
    } catch (error) {
      await loading.dismiss();
      console.error(error);
    }
  }

  verDetalle(citaId?: string) {
    this.router.navigate(['/my-appointments']);
  }

  editarPaciente() { this.router.navigate(['/paciente']); }
  irMisCitas() { this.router.navigate(['/my-appointments']); }
  irAgendarCita() { this.navCtrl.navigateForward('/agendar-cita'); }
  abrirAsistenteIA() { this.router.navigate(['/soporte-medico']); }

  cargarRedMedicos() {
    this.medicosService.getMedicos().subscribe({
      next: (data) => {
        this.medicos = data;
        this.medicosFiltrados = data;
      },
      error: (err) => console.error('Error al cargar médicos:', err)
    });
  }

  async buscarPorEspecialidad() {
    const especialidadesUnicas = [...new Set(this.medicos.map(m => m.especialidadNombre || m.especialidadId).filter(Boolean))];
    const listaEspec = especialidadesUnicas.length > 0 ? especialidadesUnicas : ['Psicologo', 'Medicina General', 'Cardiologia', 'Pediatria'];

    const inputsAlerta = listaEspec.map(esp => ({
      name: 'esp',
      type: 'radio' as const,
      label: esp,
      value: esp
    }));

    const alert = await this.alertCtrl.create({
      header: 'Selecciona una Especialidad',
      inputs: inputsAlerta,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { 
          text: 'Siguiente', 
          handler: (especialidadSeleccionada) => {
            if (especialidadSeleccionada) {
              this.mostrarDoctoresPorEspecialidad(especialidadSeleccionada);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async mostrarDoctoresPorEspecialidad(especialidad: string) {
    const doctoresFiltrados = this.medicos.filter((m: any) => 
      (m.especialidadNombre || m.especialidadId || '').toLowerCase() === especialidad.toLowerCase()
    );

    if (doctoresFiltrados.length === 0) {
      const alertVacia = await this.alertCtrl.create({
        header: especialidad,
        message: 'No hay doctores registrados actualmente en esta especialidad.',
        buttons: ['Entendido']
      });
      await alertVacia.present();
      return;
    }

    const inputsDoctores = doctoresFiltrados.map((doc: any) => ({
      name: 'docId',
      type: 'radio' as const,
      label: `${doc.nombre} ${doc.resenas ? '(⭐ ' + doc.resenas + ')' : ''}`,
      value: doc.id
    }));

    const alertDoctores = await this.alertCtrl.create({
      header: `Doctores de ${especialidad}`,
      inputs: inputsDoctores,
      buttons: [
        { text: 'Volver', role: 'cancel' },
        { 
          text: 'Agendar Cita', 
          handler: (medicoIdSeleccionado) => {
            if (medicoIdSeleccionado) {
              this.router.navigate(['/agendar-cita'], { queryParams: { medicoId: medicoIdSeleccionado } });
            }
          }
        }
      ]
    });
    await alertDoctores.present();
  }


  async cerrarSesion() {
    try {
      await signOut(this.auth);
      this.usuarioLogueado = false;
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  // ==========================================
  // SELECCIÓN DE MÉTODO DE PAGO
  // ==========================================

  async seleccionarMetodoPago(cita: any) {
    const alert = await this.alertCtrl.create({
      header: 'Seleccionar Método de Pago',
      message: `Consulta con Dr(a). ${cita.medicoNombre || 'Médico'}`,
      inputs: [
        {
          name: 'metodo',
          type: 'radio',
          label: '💳 PayPal / Tarjeta (En línea)',
          value: 'tarjeta',
          checked: true
        },
        {
          name: 'metodo',
          type: 'radio',
          label: '💵 Efectivo (Pago en clínica)',
          value: 'efectivo'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Continuar',
          handler: (metodoSeleccionado) => {
            if (metodoSeleccionado === 'tarjeta') {
              this.mostrarContenedorPago(cita);
            } else if (metodoSeleccionado === 'efectivo') {
              this.confirmarPagoEfectivo(cita);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async confirmarPagoEfectivo(cita: any) {
    const loading = await this.loadingController.create({ message: 'Registrando método de pago...' });
    await loading.present();

    try {
      const citaRef = doc(this.firestore, 'citas', cita.id);
      
      await updateDoc(citaRef, {
        pagado: false,
        estadoPago: 'pendiente_en_clinica',
        metodoPago: 'Efectivo en Clínica',
        fechaPago: new Date()
      });

      await loading.dismiss();

      const alertExito = await this.alertCtrl.create({
        header: '¡Cita Registrada!',
        message: 'Has seleccionado pago en efectivo. Pagarás directamente al asistir a la clínica.',
        buttons: ['Aceptar']
      });
      await alertExito.present();

    } catch (error) {
      await loading.dismiss();
      console.error('Error al guardar el pago en efectivo:', error);
    }
  }

  // ==========================================
  // LÓGICA DE PAGOS CON PAYPAL
  // ==========================================

  mostrarContenedorPago(cita: any) {
    this.citaSeleccionadaParaPago = cita.id;
    
    // Damos un respiro al DOM (300ms) para que Angular pinte el div condicional por el *ngIf
    setTimeout(() => {
      this.inicializarPayPal(cita);
    }, 300);
  }

  cancelarPago() {
    this.citaSeleccionadaParaPago = null;
    const container = document.getElementById('paypal-button-container');
    if (container) {
      container.innerHTML = ''; // Limpiar botones para evitar duplicados
    }
  }

  inicializarPayPal(cita: any) {
    const container = document.getElementById('paypal-button-container');
    
    if (!container) {
      console.warn('El contenedor de PayPal aún no está listo en el DOM.');
      return;
    }

    container.innerHTML = ''; // Limpiar por si acaso

    if (typeof paypal === 'undefined') {
      console.error('El SDK de PayPal no está cargado.');
      alert('Error: No se pudo cargar el módulo de pagos. Revisa tu conexión.');
      return;
    }

    paypal.Buttons({
      style: {
        layout: 'vertical',
        color:  'blue',
        shape:  'rect',
        label:  'pay'
      },
      createOrder: (data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              currency_code: 'USD',
              value: '300.00' // Puedes cambiar esto por cita.precio si lo manejas en la DB
            },
            description: `Consulta médica - Especialidad: ${cita.especialidad || 'General'}`
          }]
        });
      },
      onApprove: async (data: any, actions: any) => {
        const order = await actions.order.capture();
        console.log('Pago completado con éxito:', order);
        
        // Registrar en Firebase
        await this.completarPagoExitoso(cita, order.id);
      },
      onError: (err: any) => {
        console.error('Error procesando el pago:', err);
        alert('Hubo un error al procesar el pago. Por favor, inténtalo de nuevo.');
      }
    }).render('#paypal-button-container');
  }

  async completarPagoExitoso(cita: any, transaccionId: string) {
    const loading = await this.loadingController.create({ message: 'Confirmando pago en el sistema...' });
    await loading.present();

    try {
      const citaRef = doc(this.firestore, 'citas', cita.id);
      
      // Actualizamos los campos de la cita en Firebase
      await updateDoc(citaRef, {
        pagado: true,
        estadoPago: 'pagado',
        metodoPago: 'PayPal / Tarjeta',
        transaccionId: transaccionId,
        fechaPago: new Date()
      });

      await loading.dismiss();

      const alertExito = await this.alertCtrl.create({
        header: '¡Pago Exitoso!',
        message: `El pago ha sido procesado correctamente y tu cita ha sido confirmada.`,
        buttons: ['Aceptar']
      });
      await alertExito.present();

      // Ocultar el formulario de PayPal
      this.cancelarPago();

    } catch (error) {
      await loading.dismiss();
      console.error('Error registrando el pago en la base de datos:', error);
    }
  }
  
alternarModoOscuro() {
  this.darkMode = !this.darkMode;
  
  // Aplicar o quitar la clase dark en el body principal
  document.body.classList.toggle('dark', this.darkMode);
  
  // Guardar la preferencia
  localStorage.setItem('darkMode', this.darkMode ? 'true' : 'false');
  localStorage.setItem('home_dark_mode', this.darkMode ? 'true' : 'false');
  
  window.dispatchEvent(new Event('storage'));
}

}