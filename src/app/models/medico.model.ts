export interface Medico {
  id?: string;
  nombre: string;
  especialidad?: string;
  especialidadId?: string;
  especialidadNombre?: string;
  descripcion?: string;
  activo: boolean;
  telefono?: string;
  correo?: string;     // <--- Asegúrate de que esta línea esté aquí
  experiencia?: string;
  horarios?: string[];
  claveInicial?: string;
  rol?: string;
}