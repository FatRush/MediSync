import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { 
  Firestore, 
  collection, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Specialty {
  id?: string;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private firestore: Firestore = inject(Firestore);

  // Obtener en tiempo real con onSnapshot (evita el bug de collectionData)
  getSpecialties(): Observable<Specialty[]> {
    return new Observable<Specialty[]>((observer) => {
      const specialtyRef = collection(this.firestore, 'specialties'); // 👈 Apunta a specialties
      const q = query(specialtyRef, orderBy('nombre')); // Opcional: ordenado alfabéticamente

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const specialties: Specialty[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              nombre: data['nombre'],
              descripcion: data['descripcion'],
              activo: data['activo']
            };
          });
          observer.next(specialties);
        },
        (error) => {
          console.error('Error en onSnapshot de especialidades:', error);
          observer.error(error);
        }
      );

      return () => unsubscribe();
    });
  }

  addSpecialty(specialty: Specialty) {
    const specialtyRef = collection(this.firestore, 'specialties');
    const { id, ...data } = specialty; 
    return addDoc(specialtyRef, data);
  }

  updateSpecialty(specialty: Specialty) {
    const specialtyDocRef = doc(this.firestore, `specialties/${specialty.id}`);
    const { id, ...data } = specialty;
    return updateDoc(specialtyDocRef, data);
  }

  deleteSpecialty(id: string) {
    const specialtyDocRef = doc(this.firestore, `specialties/${id}`);
    return deleteDoc(specialtyDocRef);
  }
}