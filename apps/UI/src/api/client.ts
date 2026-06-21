import type { AdminDashboardView, ApiPaginated, ApiResponse, AsistenciaView, CalificacionView, CoordinadorGrupoView, CrearEvaluacionInput, CreateGrupoInput, CrearPeriodoInput, CrearUsuarioInput, GrupoCalificarView, GrupoDetailView, GrupoDocenteView, GrupoView, InscripcionView, LoginInput, Periodo, ProgresoView, ReportesKPI, ReportesView, SaveAsistenciaInput, SaveCalificacionInput, SolicitarInscripcionInput, UpdateGrupoInput, Usuario } from './types';

export interface ApiClient {
  auth: {
    login(input: LoginInput): Promise<ApiResponse<Usuario>>;
    logout(): Promise<void>;
    me(): Promise<ApiResponse<Usuario>>;
  };
  usuarios: {
    list(params?: { rol?: string; programaId?: string; page?: number; limit?: number }): Promise<ApiPaginated<Usuario>>;
    crear(input: CrearUsuarioInput): Promise<ApiResponse<Usuario>>;
    actualizar(id: string, input: Partial<CrearUsuarioInput>): Promise<ApiResponse<Usuario>>;
    eliminar(id: string): Promise<ApiResponse<void>>;
  };
  admin: {
    dashboard(): Promise<ApiResponse<AdminDashboardView>>;
  };
  periodos: {
    listar(): Promise<ApiResponse<Periodo[]>>;
    crear(input: CrearPeriodoInput): Promise<ApiResponse<Periodo>>;
    actualizar(id: string, input: Partial<CrearPeriodoInput & { estado: import('./types').EstadoPeriodo }>): Promise<ApiResponse<Periodo>>;
    eliminar(id: string): Promise<ApiResponse<void>>;
  };
  coordinador: {
    grupos(): Promise<ApiResponse<CoordinadorGrupoView[]>>;
    cursosDisponibles(): Promise<ApiResponse<{ id: string; nombre: string; codigo: string }[]>>;
    docentesDisponibles(): Promise<ApiResponse<{ id: string; nombre: string }[]>>;
    crearGrupo(input: CreateGrupoInput): Promise<ApiResponse<CoordinadorGrupoView>>;
    actualizarGrupo(id: string, input: UpdateGrupoInput): Promise<ApiResponse<CoordinadorGrupoView>>;
    toggleActa(id: string): Promise<ApiResponse<{ actaCerrada: boolean }>>;
    reportes(): Promise<ApiResponse<ReportesView>>;
    reportesKPI(): Promise<ApiResponse<ReportesKPI>>;
    detalleGrupo(id: string): Promise<ApiResponse<GrupoDetailView>>;
    estudiantesDisponibles(grupoId: string): Promise<ApiResponse<{ id: string; nombre: string; email: string }[]>>;
    agregarEstudiante(grupoId: string, estudianteId: string): Promise<ApiResponse<void>>;
    quitarEstudiante(grupoId: string, inscripcionId: string): Promise<ApiResponse<void>>;
  };
  grupos: {
    mis(): Promise<ApiResponse<GrupoDocenteView[]>>;
    calificar(id: string): Promise<ApiResponse<GrupoCalificarView>>;
    saveCalificaciones(id: string, input: SaveCalificacionInput): Promise<ApiResponse<void>>;
    asistencia(id: string, fecha: string): Promise<ApiResponse<AsistenciaView>>;
    saveAsistencia(id: string, input: SaveAsistenciaInput): Promise<ApiResponse<void>>;
    crearEvaluacion(id: string, input: CrearEvaluacionInput): Promise<ApiResponse<void>>;
    cerrarActa(id: string): Promise<ApiResponse<void>>;
  };
  inscripciones: {
    mis(): Promise<ApiResponse<InscripcionView[]>>;
    gruposDisponibles(): Promise<ApiResponse<GrupoView[]>>;
    solicitar(input: SolicitarInscripcionInput): Promise<ApiResponse<InscripcionView>>;
  };
  calificaciones: {
    mis(): Promise<ApiResponse<CalificacionView[]>>;
  };
  progreso: {
    mis(): Promise<ApiResponse<ProgresoView[]>>;
  };
}

import { HttpApiClient } from './http';
import { MockApiClient } from './mockClientWrapper';

const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';

export const api: ApiClient = useMocks ? new MockApiClient() : new HttpApiClient();