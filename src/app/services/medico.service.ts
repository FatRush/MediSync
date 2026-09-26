import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  where, 
  getDocs  
} from '@angular/fire/firestore';
import { 
  Auth, 
  createUserWithEmailAndPassword 
} from '@angular/fire/auth';
import { Observable } from 'rxjs';

export interface Medico {
  id?: string;
  nombre: string;
  correo: string;
  descripcion: string;
  especialidadId: string;
  especialidadNombre?: string;
  activo?: boolean;
  resenas?: string;
  claveInicial?: string;
  telefono?: string;
  uid?: string;
  rol?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MedicosService {
  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth); // <-- Inyectamos Firebase Auth

  // Obtener doctores en tiempo real
  getMedicos(): Observable<Medico[]> {
    return new Observable<Medico[]>((observer) => {
      const medicosRef = collection(this.firestore, 'doctors');
      const q = query(medicosRef, orderBy('nombre'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const medicos: Medico[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            nombre: data['nombre'],
            correo: data['correo'],
            descripcion: data['descripcion'],
            especialidadId: data['especialidadId'],
            especialidadNombre: data['especialidadNombre'],
            activo: data['activo'],
            claveInicial: data['claveInicial'],
            telefono: data['telefono'],
            uid: data['uid'],
            rol: data['rol']
          };
        });
        observer.next(medicos);
      }, (error) => {
        console.error('Error al escuchar doctores:', error);
        observer.error(error);
      });

      return () => unsubscribe();
    });
  }

  addMedico(medico: Medico) {
    const doctorsRef = collection(this.firestore, 'doctors');
    const { id, ...data } = medico;
    return addDoc(doctorsRef, data);
  }

  updateMedico(doctor: Medico) {
    const medicoRef = doc(this.firestore, `doctors/${doctor.id}`);
    const { id, ...data } = doctor;
    return updateDoc(medicoRef, data);
  }

  deleteMedico(id: string) {
    const medicoRef = doc(this.firestore, `doctors/${id}`);
    return deleteDoc(medicoRef);
  }

  // Búsqueda optimizada por correo
  async obtenerMedicoPorCorreo(correoBuscado: string) {
    const correoNormalizado = correoBuscado.trim().toLowerCase();
    const posiblesColecciones = ['doctors', 'medicos', 'doctores'];

    for (const nombreColeccion of posiblesColecciones) {
      try {
        const medicosRef = collection(this.firestore, nombreColeccion);
        
        const qCorreo = query(medicosRef, where('correo', '==', correoNormalizado));
        let querySnapshot = await getDocs(qCorreo);

        if (querySnapshot.empty) {
          const qEmail = query(medicosRef, where('email', '==', correoNormalizado));
          querySnapshot = await getDocs(qEmail);
        }

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const medicoEncontrado = { 
            id: docSnap.id, 
            coleccionUsada: nombreColeccion, 
            ...docSnap.data() 
          };
          return medicoEncontrado;
        }
      } catch (e) {
        console.warn(`No se pudo consultar la colección ${nombreColeccion}:`, e);
      }
    }
    return null;
  }

  // NUEVO: Crea el usuario en Firebase Auth y luego actualiza Firestore
  async activarDoctor(idDocFirestore: string, correo: string, passwordNueva: string, telefono: string) {
    try {
      // 1. Crear el usuario en Firebase Authentication con correo y contraseña
      const userCredential = await createUserWithEmailAndPassword(this.auth, correo, passwordNueva);
      const uidGenerado = userCredential.user.uid;

      // 2. Actualizar el documento en Firestore con el estado activo, teléfono y el UID de auth
      const medicoDocRef = doc(this.firestore, 'doctors', idDocFirestore);
      await updateDoc(medicoDocRef, {
        activo: true,
        telefono: telefono,
        uid: uidGenerado,
        rol: 'doctor',
        claveInicial: '' // Limpiamos la clave temporal
      });

      return { success: true, uid: uidGenerado };
    } catch (error) {
      console.error('Error al registrar en Authentication:', error);
      throw error;
    }
  }
}