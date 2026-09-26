export interface Paciente {

  uid: string;
  nombre: string;
  apellido: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  fechaNacimiento: string;
  conocidoComo: string;
  lugarNacimiento: string;
  grupoEtnico: string;
  estadoCivil: string;
  ocupacion: string;
  tipoSangre: string;
  provincia: string;
  direccion: string;
  telefono: string;
  correo: string;
  creadoEn?: any;
  actualizadoEn?: any;
}