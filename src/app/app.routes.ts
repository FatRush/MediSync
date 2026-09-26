import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard'; 


export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then( m => m.LoginPage),
    
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then( m => m.RegisterPage)
  },
  // {
  //   path: 'specialties',
  //   loadComponent: () => import('./specialties/specialties.page').then( m => m.SpecialtiesPage)
  // },

  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password.page').then( m => m.ForgotPasswordPage)
  },
  {
    path: 'paciente',
    loadComponent: () => import('./pages/paciente/paciente.page').then( m => m.PacientePage)
  },
  {
    path: 'my-appointments',
    loadComponent: () => import('./my-appointments/my-appointments.page').then( m => m.MyAppointmentsPage)
  },
 {
  path: 'agendar-cita',
  loadComponent: () => import('./agendar-cita/agendar-cita.page').then(m => m.AgendarCitaPage)
},
  {
    path: 'detail-appointment/:id',
    loadComponent: () => import('./detail-appointment/detail-appointment.page').then( m => m.DetailAppointmentPage)
  },
  {
    path: 'doctor-home',
    loadComponent: () => import('./doctor-home/doctor-home.page').then( m => m.DoctorHomePage)
  },
  {
    path: 'doctor-citas',
    loadComponent: () => import('./doctor-citas/doctor-citas.page').then( m => m.DoctorCitasPage)
  },
  {
    path: 'super-admin',
    loadComponent: () => import('./super-admin/super-admin.page').then( m => m.SuperAdminPage)
  },
  {
    path: 'super-admin-specialty',
    loadComponent: () => import('./super-admin-specialty/super-admin-specialty.page').then( m => m.SuperAdminSpecialtyPage)
  },
  {
    path: 'super-admin-doctores',
    loadComponent: () => import('./super-admin-doctores/super-admin-doctores.page').then( m => m.SuperAdminDoctoresPage)
  },
  {
    path: 'register-doctor',
    loadComponent: () => import('./register-doctor/register-doctor.page').then( m => m.RegisterDoctorPage)
  },
  {
    path: 'agregar-clinica',
    loadComponent: () => import('./agregar-clinica/agregar-clinica.page').then( m => m.AgregarClinicaPage)
  },
  {
    path: 'secretaria',
    loadComponent: () => import('./secretaria/secretaria.page').then( m => m.SecretariaPage)
  },
  {
    path: 'super-admin-secretaria',
    loadComponent: () => import('./super-admin-secretaria/super-admin-secretaria.page').then( m => m.SuperAdminSecretariaPage)
  },
  {
    path: 'soporte-medico',
    loadComponent: () => import('./soporte-medico/soporte-medico.page').then( m => m.SoporteMedicoPage)
  },
  
];
