import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, UserCredential } from '@angular/fire/auth';
import { Firestore, doc, setDoc, onSnapshot, Unsubscribe } from '@angular/fire/firestore';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  private sessionUnsubscribe: Unsubscribe | null = null;

  constructor() {
    // Escuchar cambios de autenticación en la app
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.iniciarEscuchaSesion(user.uid);
      } else {
        this.detenerEscuchaSesion();
      }
    });
  }

  // 1. Iniciar sesión en Firebase Auth y registrar token activo en Firestore
  async login(email: string, pass: string): Promise<UserCredential> {
    const userCredential = await signInWithEmailAndPassword(this.auth, email, pass);
    const uid = userCredential.user.uid;

    // Generar nuevo ID de sesión único
    const sessionId = crypto.randomUUID();
    localStorage.setItem('current_session_id', sessionId);

    // Guardar SIEMPRE en 'users/{uid}' para evitar problemas de lectura/permisos
    const userDocRef = doc(this.firestore, `users/${uid}`);
    await setDoc(userDocRef, { 
      activeSessionId: sessionId,
      lastLogin: new Date()
    }, { merge: true });

    return userCredential;
  }

  // 2. Escuchar en tiempo real si el activeSessionId cambia
  private iniciarEscuchaSesion(uid: string) {
    this.detenerEscuchaSesion();

    const userDocRef = doc(this.firestore, `users/${uid}`);

    this.sessionUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const activeSessionId = docSnap.data()['activeSessionId'];
        const currentSessionId = localStorage.getItem('current_session_id');

        console.log('--- Control de Sesión Única ---');
        console.log('ID en Firestore:', activeSessionId);
        console.log('ID LocalStorage:', currentSessionId);

        // Si existe un activeSessionId y no coincide con el navegador actual -> Expulsar
        if (activeSessionId && currentSessionId && activeSessionId !== currentSessionId) {
          alert('Se ha iniciado sesión con esta cuenta en otro navegador o dispositivo.');
          this.logout();
        }
      }
    }, (error) => {
      console.warn('Error escuchando sesión en Firestore:', error);
    });
  }

  // 3. Detener escucha activa de forma segura
  public detenerEscuchaSesion(): void {
    if (typeof this.sessionUnsubscribe === 'function') {
      this.sessionUnsubscribe();
      this.sessionUnsubscribe = null;
    }
  }

  // 4. Cerrar sesión
  async logout(): Promise<void> {
    this.detenerEscuchaSesion();
    localStorage.removeItem('current_session_id');
    await signOut(this.auth);
    await this.router.navigate(['/login']);
  }
}