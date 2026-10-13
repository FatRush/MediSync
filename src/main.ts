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
