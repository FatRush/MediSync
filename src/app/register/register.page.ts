import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../services/firebase.service';
import { Auth, user } from '@angular/fire/auth';
import { take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonContent,
  IonInput,
  IonButton,
   } from '@ionic/angular/standalone';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonInput,
    IonButton,
  ]
})
export class RegisterPage {
  registerForm!: FormGroup;
  email = '';
  password = '';
  confirmarPassword = '';

  private emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  constructor(private router: Router, public firebaseSvc: FirebaseService, private auth: Auth, private fb: FormBuilder) {
    }

    ngOnInit() {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });
  }
esCorreoValido(correo: string): boolean {
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return pattern.test(correo.trim());
}

  async register() {
  // 1. Validar que los campos no estén vacíos
  if (
    !this.email ||
    !this.password ||
    !this.confirmarPassword
  ) {
    alert('Por favor complete todos los campos.');
    return;
  }

  // 2. Validar que sea un formato de correo válido
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(this.email.trim())) {
    alert('Por favor ingresa un correo electrónico válido (ejemplo: usuario@correo.com).');
    return;
  }

  // 3. Validar coincidencia de contraseñas
  if (this.password !== this.confirmarPassword) {
    alert('Las contraseñas no coinciden.');
    return;
  }

  // 4. Intentar registro en Firebase
  try {
    await this.firebaseSvc.register(this.email.trim(), this.password);
    alert('Registro realizado correctamente');
    this.router.navigate(['/paciente']);
  } catch (error) {
    alert('Error al registrar usuario.');
  }
}
}