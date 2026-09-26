import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from '@angular/fire/auth';import { onSnapshot, Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { inject } from '@angular/core';


//export interface CitaMedica {
export interface Specialty {
  id?: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);

  // --- AUTENTICACIÓN ---
  login(email: string, pass: string) {
    return signInWithEmailAndPassword(this.auth, email, pass);
  }

  register(email: string, pass: string) {
    return createUserWithEmailAndPassword(this.auth, email, pass);
  }

  logout() {
    return signOut(this.auth);
  }
  // getSpecialties(): Observable<Specialty[]> {
  //   // const specialtyRef = collection(this.firestore, 'especialidades');
  //   // return collectionData(specialtyRef, { idField: 'id' }) as Observable<Specialty[]>;
  //  }

// getSpecialties(): Observable<Specialty[]> {
//     // Creamos un Observable manual para evitar el bug de collectionData
//     return new Observable<Specialty[]>((observer) => {
//       const specialtyRef = collection(this.firestore, 'especialidades');

//       // onSnapshot escucha los cambios en tiempo real directo desde Firebase
//       const unsubscribe = onSnapshot(
//         specialtyRef,
//         (snapshot) => {
//           // Mapeamos los documentos al formato Specialty
//           const specialties: Specialty[] = snapshot.docs.map((docSnap) => {
//             const data = docSnap.data();
//             return {
//               id: docSnap.id,
//               name: data['name'] // Asegúrate de que el campo en Firestore siga siendo 'name'
//             };
//           });
          
//           // Emitimos los datos al componente
//           observer.next(specialties);
//         },
//         (error) => {
//           console.error('Error en onSnapshot:', error);
//           observer.error(error);
//         }
//       );

//       // Cuando el componente se destruya, dejamos de escuchar a Firebase
//       return () => unsubscribe();
//     });

    
//   }

//   addSpecialty(specialty: Specialty) {
//     const specialtyref = collection(this.firestore, 'especialidades');
//     const { id, ...data } = specialty; 
//     return addDoc(specialtyref, data);
//   }

//   updateSpecialty(specialty: Specialty) {
//     const specialtyDocRef = doc(this.firestore, `especialidades/${specialty.id}`);
//     const { id, ...data } = specialty;
//     return updateDoc(specialtyDocRef, data);
//   }

//   deleteSpecialty(id: string) {
//     const specialtyDocRef = doc(this.firestore, `especialidades/${id}`);
//     return deleteDoc(specialtyDocRef);
//   }

 recoverPassword(email: string) {
     return sendPasswordResetEmail(this.auth, email);
  }

//   // // --- CRUD FIRESTORE ---
//   // getCitas(): Observable<CitaMedica[]> {
//   //   const citasRef = collection(this.firestore, 'citas');
//   //   // idField extrae el ID del documento autogenerado por Firestore
//   //   return collectionData(citasRef, { idField: 'id' }) as Observable<CitaMedica[]>;
//   // }

//   // addCita(cita: CitaMedica) {
//   //   const citasRef = collection(this.firestore, 'citas');
//   //   const { id, ...data } = cita; // Removemos el ID vacío para evitar errores en Firestore
//   //   return addDoc(citasRef, data);
//   // }

//   // updateCita(cita: CitaMedica) {
//   //   const citaDocRef = doc(this.firestore, `citas/${cita.id}`);
//   //   return updateDoc(citaDocRef, { ...cita });
//   // }

//   // deleteCita(id: string) {
//   //   const citaDocRef = doc(this.firestore, `citas/${id}`);
//   //   return deleteDoc(citaDocRef);
//   // }
  
}