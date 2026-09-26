import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideHttpClient } from '@angular/common/http'; // <- 1. Importa esto
import { getFunctions, provideFunctions } from '@angular/fire/functions';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

const environment = {
  production: false,
  firebaseConfig: {
  apiKey: "AIzaSyBq5ED-9Bxr1vRQOfPe5vdihp7mFzoIr28",
  authDomain: "medisync-34d73.firebaseapp.com",
  projectId: "medisync-34d73",
  storageBucket: "medisync-34d73.firebasestorage.app",
  messagingSenderId: "520526431945",
  appId: "1:520526431945:web:6fc249ccaec4c1a8362f18",
  measurementId: "G-G269CW487Y"
  }
};

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideIonicAngular({}),
    provideAuth(() => getAuth()),
    provideHttpClient(),
    provideFunctions(() => getFunctions()),
    provideFirestore(() => getFirestore()),
  ],
});
