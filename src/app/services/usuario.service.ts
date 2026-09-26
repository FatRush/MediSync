import { Injectable, inject } from '@angular/core';

import {
  Firestore,
  doc,
  getDoc,
  setDoc
} from '@angular/fire/firestore';

export interface Usuario {

  nombre: string;

  apellido: string;

  correo: string;

  telefono: string;

  rol: string;

}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private firestore = inject(Firestore);


  async guardarUsuario(
    uid: string,
    usuario: Usuario
  ) {

    const usuarioRef =
      doc(
        this.firestore,
        `users/${uid}`
      );


    await setDoc(
      usuarioRef,
      {
        ...usuario,

        fechaRegistro:
          new Date()

      },
      {
        merge: true
      }
    );

  }


  async obtenerUsuario(
    uid: string
  ): Promise<Usuario | null> {

    const usuarioRef =
      doc(
        this.firestore,
        `users/${uid}`
      );


    const documento =
      await getDoc(usuarioRef);


    if (documento.exists()) {

    //  return documento.data()
     //   as Usuario;

    }


    return null;

  }

}