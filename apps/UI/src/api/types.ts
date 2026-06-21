export type Rol = 'estudiante' | 'docente' | 'administrativo' | 'coordinador';

export type EstadoInscripcion =
  | 'solicitada'
  | 'aprobada'
  | 'rechazada'
  | 'activa'
  | 'retirada'
  | 'aprobada_final'
  | 'reprobada_final'
  | 'cancelada';

export type EstadoPeriodo = 'borrador' | 'activo' | 'cerrado';
export type TipoPeriodo = 'semestral' | 'cuatrimestral' | 'anual';
export type EstadoAsistencia = 'presente' | 'ausente' | 'tarde' | 'justificado';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  programaIds: string[];
  activo: boolean;
}

export interface Programa {
  id: string;
  nombre: string;
  codigo: string;
}

export interface Curso {
  id: string;
  codigo: string;
  nombre: string;
  creditos: number;
  programaId: string;
  prerrequisitos: string[];
}

export interface Periodo {
  id: string;
  nombre: string;
  tipo: TipoPeriodo;
  fechaInicio: string;
  fechaFinInscripcion: string;
  fechaFinClases: string;
  estado: EstadoPeriodo;
}

export interface BloqueHorario {
  dia: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  inicio: string;
  fin: string;
}

export interface Grupo {
  id: string;
  cursoId: string;
  periodoId: string;
  docenteId: string;
  horario: BloqueHorario[];
  cupo: number;
  cupoDisponible: number;
  aula: string;
  actaCerrada: boolean;
  motivoReapertura?: string;
}

export interface Inscripcion {
  id: string;
  estudianteId: string;
  grupoId: string;
  periodoId: string;
  estado: EstadoInscripcion;
  intentos: number;
  motivoRechazo?: string;
  createdAt: string;
}

export interface Evaluacion {
  id: string;
  grupoId: string;
  nombre: string;
  peso: number;
  fecha?: string;
}

export interface Calificacion {
  id: string;
  inscripcionId: string;
  evaluacionId: string;
  nota: number;
  createdAt: string;
}

export interface Asistencia {
  id: string;
  inscripcionId: string;
  fecha: string;
  estado: EstadoAsistencia;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiPaginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface InscripcionView {
  id: string;
  cursoId: string;
  cursoNombre: string;
  cursoCodigo: string;
  creditos: number;
  programaNombre: string;
  grupoId: string;
  grupoCodigo: string;
  horario: BloqueHorario[];
  aula: string;
  docenteNombre: string;
  estado: EstadoInscripcion;
  intentos: number;
  motivoRechazo?: string;
  periodoNombre: string;
  createdAt: string;
}

export interface GrupoView {
  id: string;
  cursoNombre: string;
  cursoCodigo: string;
  creditos: number;
  programaNombre: string;
  horario: BloqueHorario[];
  aula: string;
  docenteNombre: string;
  cupo: number;
  cupoDisponible: number;
  inscrito: boolean;
}

export interface CalificarRow {
  inscripcionId: string;
  estudianteNombre: string;
  nota: number | null;
}

export interface GrupoCalificarView {
  cursoId: string;
  cursoNombre: string;
  cursoCodigo: string;
  evaluaciones: { id: string; nombre: string; peso: number }[];
  estudiantes: CalificarRow[];
  actaCerrada: boolean;
}

export interface SaveCalificacionInput {
  evaluacionId: string;
  notas: { inscripcionId: string; nota: number }[];
}

export interface AsistenciaRegistro {
  inscripcionId: string;
  estudianteNombre: string;
  estado: EstadoAsistencia | null;
}

export interface AsistenciaView {
  fecha: string;
  registros: AsistenciaRegistro[];
}

export interface SaveAsistenciaInput {
  fecha: string;
  registros: { inscripcionId: string; estado: EstadoAsistencia }[];
}

export interface ReporteRendimiento {
  cursoNombre: string;
  grupoId: string;
  docenteNombre: string;
  estudiantes: number;
  promedio: number;
  aprobados: number;
  reprobados: number;
  tasaAprobacion: number;
}

export interface ReporteDistribucion {
  rango: string;
  cantidad: number;
  color: string;
}

export type EstadoActa = 'abierta' | 'cerrada';

export interface CrearEvaluacionInput {
  cursoId: string;
  grupoId: string;
  nombre: string;
  peso: number;
  fecha: string;
}

export interface CrearUsuarioInput {
  nombre: string;
  email: string;
  password: string;
  rol: Rol;
  programaIds: string[];
}

export interface CrearPeriodoInput {
  nombre: string;
  tipo: TipoPeriodo;
  fechaInicio: string;
  fechaFinInscripcion: string;
  fechaFinClases: string;
}

export interface ReporteDesercion {
  cursoNombre: string;
  totalInscritos: number;
  retirados: number;
  cancelados: number;
  tasaDesercion: number;
}

export interface ReportesView {
  rendimiento: ReporteRendimiento[];
  distribucion: ReporteDistribucion[];
  desercion: ReporteDesercion[];
}

export interface CoordinadorGrupoView {
  id: string;
  cursoNombre: string;
  cursoCodigo: string;
  programaNombre: string;
  periodoNombre: string;
  horario: BloqueHorario[];
  aula: string;
  docenteNombre: string;
  cupo: number;
  cupoDisponible: number;
  totalEstudiantes: number;
  actaCerrada: boolean;
}

export interface CreateGrupoInput {
  cursoId: string;
  horario: BloqueHorario[];
  aula: string;
  docenteId: string;
  cupo: number;
}

export interface UpdateGrupoInput {
  horario?: BloqueHorario[];
  aula?: string;
  docenteId?: string;
  cupo?: number;
}

export interface GrupoDocenteView {
  id: string;
  cursoNombre: string;
  cursoCodigo: string;
  creditos: number;
  periodoNombre: string;
  horario: BloqueHorario[];
  aula: string;
  totalEstudiantes: number;
  evaluacionesCount: number;
}

export interface ProgresoView {
  programaNombre: string;
  programaCodigo: string;
  totalCreditos: number;
  aprobados: number;
  enCurso: number;
  porcentaje: number;
}

export interface SolicitarInscripcionInput {
  grupoId: string;
}

export interface GrupoDetailEstudiante {
  id: string;
  inscripcionId: string;
  nombre: string;
  email: string;
  estado: EstadoInscripcion;
}
export interface GrupoDetailView {
  id: string;
  cursoNombre: string;
  cursoCodigo: string;
  programaNombre: string;
  periodoNombre: string;
  horario: BloqueHorario[];
  aula: string;
  docenteNombre: string;
  docenteId: string;
  cupo: number;
  cupoDisponible: number;
  totalEstudiantes: number;
  actaCerrada: boolean;
  estudiantes: GrupoDetailEstudiante[];
}

export interface ReportesKPI {
  totalEstudiantes: number;
  promedioGeneral: number;
  tasaAprobacionGeneral: number;
  totalGrupos: number;
  totalRetirados: number;
}

export interface AdminDashboardView {
  totalUsuarios: number;
  totalEstudiantes: number;
  totalDocentes: number;
  totalCoordinadores: number;
  totalAdministrativos: number;
  periodoActivo: string | null;
  totalGruposActivos: number;
  totalInscripciones: number;
}

export interface CalificacionEvalView {
  evaluacionId: string;
  nombre: string;
  peso: number;
  nota: number;
}

export interface CalificacionView {
  inscripcionId: string;
  cursoNombre: string;
  cursoCodigo: string;
  creditos: number;
  grupoCodigo: string;
  docenteNombre: string;
  evaluaciones: CalificacionEvalView[];
  notaFinal: number;
  estado: EstadoInscripcion;
}