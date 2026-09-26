import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from '@angular/fire/firestore';

import { Paciente } from '../models/paciente.model';


@Injectable({
  providedIn: 'root'
})
export class PacienteService {

  private firestore = inject(Firestore);


  // ==========================================
  // CREAR PACIENTE
  // ==========================================

  async crearPaciente(
    paciente: Paciente
  ) {

    const referencia = doc(
      this.firestore,
      `users/${paciente.uid}`
    );


    await setDoc(
      referencia,
      {
        ...paciente,

        creadoEn:
          serverTimestamp(),

        actualizadoEn:
          serverTimestamp()
      }
    );

  }


  // ==========================================
  // ACTUALIZAR PACIENTE
  // ==========================================

  async guardarPaciente(
    paciente: Paciente
  ) {

    const referencia = doc(
      this.firestore,
      `users/${paciente.uid}`
    );


    await setDoc(
      referencia,
      {
        ...paciente,

        actualizadoEn:
          serverTimestamp()
      },
      {
        merge: true
      }
    );

  }


  // ==========================================
  // OBTENER PACIENTE
  // ==========================================

  async obtenerPaciente(
    uid: string
  ): Promise<Paciente | null> {

    const referencia = doc(
      this.firestore,
      `users/${uid}`
    );


    const resultado =
      await getDoc(referencia);


    if (!resultado.exists()) {

      return null;

    }


    return resultado.data() as Paciente;

  }

}