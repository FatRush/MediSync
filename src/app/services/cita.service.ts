import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from '@angular/fire/firestore';
import { Cita } from '../models/cita.model';
import { HttpClient } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class CitaService {

  private firestore = inject(Firestore);
  private http = inject(HttpClient);

  async crearCita(cita: Cita) {
    const referencia = collection(this.firestore, 'citas');
    return await addDoc(referencia, {
      ...cita,
      creadoEn: serverTimestamp()
    });
  }

  async obtenerCitasPaciente(pacienteId: string): Promise<Cita[]> {
    const referencia = collection(this.firestore, 'citas');
    const consulta = query(referencia, where('pacienteId', '==', pacienteId));
    const resultado = await getDocs(consulta);
    const citas = resultado.docs.map(documento => ({
      id: documento.id,
      ...documento.data()
    } as Cita));
    citas.sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`));
    return citas;
  }

  async obtenerCitasPorDoctor(identificador: string) {
    try {
      const citasRef = collection(this.firestore, 'citas');
      const q = query(citasRef, where('medicoId', '==', identificador));
      const querySnapshot = await getDocs(q);
      
      const citas: any[] = [];
      querySnapshot.forEach((docSnap) => {
        citas.push({ id: docSnap.id, ...docSnap.data() });
      });
      return citas;
    } catch (error) {
      console.error('Error al obtener citas del doctor:', error);
      return [];
    }
  }

  async obtenerCita(id: string): Promise<Cita | null> {
    const referencia = doc(this.firestore, `citas/${id}`);
    const resultado = await getDoc(referencia);
    if (!resultado.exists()) {
      return null;
    }
    return {
      id: resultado.id,
      ...resultado.data()
    } as Cita;
  }

  async cancelarCita(id: string) {
    const referencia = doc(this.firestore, `citas/${id}`);
    await updateDoc(referencia, {
      estado: 'cancelada'
    });
  }

  // ✅ Método para confirmar la cita y poner el correo en la cola de Firebase
async confirmarCita(
  citaId: string, 
  correoPaciente: string, 
  pacienteNombre: string, 
  pacienteApellido: string,
  doctorNombre: string, 
  fecha: string, 
  hora: string
) {
  // 1. Actualiza el estado en la colección 'citas'
  const citaRef = doc(this.firestore, 'citas', citaId);
  await updateDoc(citaRef, { estado: 'confirmada' });

  // 2. Crea la notificación en 'mail' con ID autogenerado
  const mailRef = collection(this.firestore, 'mail');
  await addDoc(mailRef, {
    to: correoPaciente,
    message: {
      subject: 'Confirmación de Cita Médica',
      html: `Hola ${pacienteNombre}${pacienteApellido}, tu cita con el Dr. ${doctorNombre} el ${fecha} a las ${hora} ha sido confirmada.`
    }
  });
}

  // ✅ Método de verificación de horario restaurado para que no falle agendar-cita
  async verificarHorario(medicoId: string, fecha: string, hora: string): Promise<boolean> {
    const referencia = collection(this.firestore, 'citas');
    const consulta = query(
      referencia,
      where('medicoId', '==', medicoId),
      where('fecha', '==', fecha),
      where('hora', '==', hora)
    );
    const resultado = await getDocs(consulta);
    const ocupada = resultado.docs.some(
      documento => documento.data()['estado'] !== 'cancelada'
    );
    return !ocupada;
  }

  async cambiarEstadoCita(citaId: string, nuevoEstado: string) {
  const citaRef = doc(this.firestore, 'citas', citaId);
  return await updateDoc(citaRef, { estado: nuevoEstado });
}
}