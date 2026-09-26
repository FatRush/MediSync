export interface Cita {

  id?: string;
  pacienteId: string;
  pacienteNombre: string;
  pacienteApellido: string;
  medicoId: string;
  medicoNombre: string;
  especialidad: string;
  fecha: string;
  hora: string;
  motivo: string;
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
  creadoEn?: any;

}