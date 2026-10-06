import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { Firestore, collection, addDoc, getDocs, updateDoc, doc } from '@angular/fire/firestore';
import { addIcons } from 'ionicons';
import * as QRCode from 'qrcode';
import { 
  businessOutline, 
  timeOutline, 
  peopleOutline, 
  imageOutline, 
  qrCodeOutline, 
  saveOutline,
  locationOutline,
  printOutline,
  downloadOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-agregar-clinica',
  templateUrl: './agregar-clinica.page.html',
  styleUrls: ['./agregar-clinica.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ]
})
export class AgregarClinicaPage implements OnInit {

  selectedFile: File | null = null;
  logoPreview: string | ArrayBuffer | null = null;

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  private firestore = inject(Firestore);
  private router = inject(Router);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  nombre: string = '';
  horarioApertura: string = '08:00';
  horarioCierre: string = '17:00';
  direccion: string = '';
  logoUrl: string = '';
  qrGeneradoUrl: string = '';
  doctoresSeleccionados: string[] = [];
  listaDoctores: any[] = [];
 
  constructor() {
    addIcons({
      businessOutline,
      timeOutline,
      peopleOutline,
      imageOutline,
      qrCodeOutline,
      saveOutline,
      locationOutline,
      printOutline,
      downloadOutline
    });
  }

  ngOnInit() {
    this.cargarDoctores();
  }

  async cargarDoctores() {
    try {
      const snap = await getDocs(collection(this.firestore, 'doctors'));
      this.listaDoctores = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
    } catch (error) {
      console.error('Error al cargar doctores:', error);
    }
  }

  async guardarClinica() {
    if (!this.nombre.trim()) {
      this.mostrarToast('Por favor, ingresa el nombre de la clínica', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Guardando clínica y generando QR...' });
    await loading.present();

    try {
      let logoFinalUrl = this.logoUrl ? this.logoUrl.trim() : 'https://via.placeholder.com/150?text=Clinica';

      if (this.logoPreview) {
        logoFinalUrl = this.logoPreview as string;
      }

      const nuevaClinica = {
        nombre: this.nombre.trim(),
        direccion: this.direccion.trim(),
        horario: `${this.horarioApertura} - ${this.horarioCierre}`,
        horarioApertura: this.horarioApertura,
        horarioCierre: this.horarioCierre,
        logoUrl: logoFinalUrl,
        doctoresIds: this.doctoresSeleccionados,
        qrCodeUrl: '',
        estado: 'activa',
        fechaCreacion: new Date()
      };

      const docRef = await addDoc(collection(this.firestore, 'clinicas'), nuevaClinica);

      const urlApp = `https://8mt8365w-8100.use.devtunnels.ms/registro-paciente?clinicaId=${docRef.id}`;

      const qrCodeBase64 = await QRCode.toDataURL(urlApp, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
      });

      await updateDoc(doc(this.firestore, 'clinicas', docRef.id), {
        qrCodeUrl: qrCodeBase64
      });

      this.qrGeneradoUrl = qrCodeBase64;

      await loading.dismiss();
      this.mostrarToast('¡Clínica creada y QR generado con éxito!', 'success');

    } catch (error) {
      await loading.dismiss();
      console.error('Error al guardar la clínica:', error);
      this.mostrarToast('Ocurrió un error al guardar la clínica', 'danger');
    }
  }

  imprimirQr() {
    const ventanaImpresion = window.open('', '_blank');
    if (ventanaImpresion) {
      ventanaImpresion.document.write(`
        <html>
          <head>
            <title>Imprimir QR - ${this.nombre}</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
              .container { display: inline-block; position: relative; }
              img.qr { width: 250px; height: 250px; }
              img.logo { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 50px; height: 50px; border-radius: 50%; background: white; padding: 4px; border: 2px solid #333; }
              h2 { margin-bottom: 5px; }
              p { color: #666; }
            </style>
          </head>
          <body>
            <h2>${this.nombre}</h2>
            <p>Escanea este código para agendar tu cita</p>
            <div class="container">
              <img src="${this.qrGeneradoUrl}" class="qr" />
              ${this.logoPreview ? `<img src="${this.logoPreview}" class="logo" />` : ''}
            </div>
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      ventanaImpresion.document.close();
    }
  }

  descargarQr() {
    const link = document.createElement('a');
    link.href = this.qrGeneradoUrl;
    link.download = `QR-${this.nombre.replace(/\s+/g, '_')}.png`;
    link.click();
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2500,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }
}