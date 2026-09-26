import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  personOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline
} from 'ionicons/icons';

// Inyección de servicios Firebase / Auth
import { FirebaseService } from '../services/firebase.service';
import { AuthService } from '../services/auth.service'; // 👈 1. Importar AuthService (Ajusta la ruta según la ubicación de tu archivo)
import { Auth, user } from '@angular/fire/auth';
import { Firestore, doc, getDoc, collection, query, where, getDocs } from '@angular/fire/firestore';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    FormsModule
  ],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  logoUrl: string = 'assets/icon/MediSync.png';
  loginForm!: FormGroup;
  errorMessage: string = '';
  cargando: boolean = false;
  mostrarPassword: boolean = false;
  email: string = '';
  password: string = '';

  // Inyecciones mediante inject() para evitar errores de Angular Standalone
  private fb = inject(FormBuilder);
  private router = inject(Router);
  public firebaseSvc = inject(FirebaseService);
  public authSvc = inject(AuthService); // 👈 Inyección correcta de AuthService
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  constructor() {
    addIcons({
      personOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline
    });
  }

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    user(this.auth)
      .pipe(take(1))
      .subscribe(async (u) => {
        if (u) {
          console.log('Usuario ya autenticado:', u.uid);
          await this.redireccionarSegunRol(u.uid);
        }
      });
  }

  mostrarOcultarPassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }

  irARegistro() {
    this.router.navigate(['/register']);
  }

  recuperarPassword() {
    this.router.navigate(['/forgot-password']);
  }

  // Proceso principal de inicio de sesión
  async login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    try {
      // 1. Iniciar sesión con AuthService (esto genera el token y activa la escucha de sesión única)
      await this.authSvc.login(email, password);

      const usuario = this.auth.currentUser;
      if (!usuario) {
        this.errorMessage = 'No se pudo obtener la información del usuario.';
        return;
      }

      console.log('UID del usuario autenticado:', usuario.uid);
      
      // 2. Redirección según el rol registrado en Firestore
      await this.redireccionarSegunRol(usuario.uid);

    } catch (error: any) {
      console.error('Error en login:', error);
      this.errorMessage = 'Correo o contraseña incorrectos.';
    } finally {
      this.cargando = false;
    }
  }

  // Buscar rol en Firestore y redirigir
  async redireccionarSegunRol(uid: string) {
    try {
      const usuarioActual = this.auth.currentUser;
      const correoUsuario = usuarioActual ? usuarioActual.email : '';

      let usuarioSnap: any = null;

      // 1. Intentar buscar en 'patients' por UID
      let usuarioRef = doc(this.firestore, `patients/${uid}`);
      usuarioSnap = await getDoc(usuarioRef);

      // 2. Si no está en pacientes, buscar en 'doctors'
      if (!usuarioSnap.exists()) {
        usuarioRef = doc(this.firestore, `doctors/${uid}`);
        usuarioSnap = await getDoc(usuarioRef);

        if (!usuarioSnap.exists() && correoUsuario) {
          const q = query(collection(this.firestore, 'doctors'), where('correo', '==', correoUsuario));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            usuarioSnap = querySnapshot.docs[0];
            localStorage.setItem('medicoId', querySnapshot.docs[0].id);
          }
        }
      }

      // 3. Buscar en la colección general de users
      if (!usuarioSnap.exists()) {
        usuarioRef = doc(this.firestore, `users/${uid}`);
        usuarioSnap = await getDoc(usuarioRef);
      }

      if (!usuarioSnap || !usuarioSnap.exists()) {
        this.errorMessage = 'No se encontró la información del usuario en la base de datos.';
        return;
      }

      const datos: any = usuarioSnap.data();
      const role = (datos.role || datos.rol || '').toLowerCase(); 

      // 4. Redirección según el rol
      switch (role) {
        case 'doctor':
          await this.router.navigate(['/doctor-home']);
          break;
        case 'paciente':
        case 'user':
          await this.router.navigate(['/home']);
          break;
        case 'admin':
        case 'superadmin':
          await this.router.navigate(['/super-admin']);
          break;
        case 'secretaria':
          await this.router.navigate(['/secretaria']); 
          break;
        default:
          this.errorMessage = 'El usuario no tiene un rol válido asignado.';
          break;
      }
    } catch (error) {
      console.error('Error obteniendo el rol:', error);
      this.errorMessage = 'No se pudo verificar el rol del usuario.';
    }
  }

  async register() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;

    try {
      await this.firebaseSvc.register(email, password);
      alert('Usuario registrado correctamente.');
    } catch (error) {
      console.error('Error al registrar:', error);
      alert('Error al registrar usuario.');
    }
  }
}