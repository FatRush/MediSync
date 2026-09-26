import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, query, orderBy, onSnapshot, doc, setDoc, getDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private firestore = inject(Firestore);

  async obtenerOCrearChat(pacienteId: string, medicoId: string, pacienteNombre: string, medicoNombre: string) {
    const chatId = `${pacienteId}_${medicoId}`;
    const chatRef = doc(this.firestore, `chats/${chatId}`);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        pacienteId,
        medicoId,
        pacienteNombre,
        medicoNombre,
        ultimoMensaje: '',
        ultimaActualizacion: new Date()
      });
    }
    return chatId;
  }

  async enviarMensaje(chatId: string, remitenteId: string, texto: string) {
    const mensajesRef = collection(this.firestore, `chats/${chatId}/mensajes`);
    await addDoc(mensajesRef, {
      remitenteId,
      texto,
      fechaEnvio: new Date()
    });

    const chatRef = doc(this.firestore, `chats/${chatId}`);
    await setDoc(chatRef, {
      ultimoMensaje: texto,
      ultimaActualizacion: new Date()
    }, { merge: true });
  }

  escucharMensajes(chatId: string, callback: (mensajes: any[]) => void) {
    const mensajesRef = collection(this.firestore, `chats/${chatId}/mensajes`);
    const q = query(mensajesRef, orderBy('fechaEnvio', 'asc'));

    return onSnapshot(q, (snapshot) => {
      const mensajes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(mensajes);
    });
  }
}