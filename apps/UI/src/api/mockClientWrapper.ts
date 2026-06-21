import type { ApiClient } from './client';
import type {
  AdminDashboardView, ApiPaginated, ApiResponse, AsistenciaView, CalificacionView, CoordinadorGrupoView,
  CrearEvaluacionInput, CreateGrupoInput, CrearPeriodoInput, CrearUsuarioInput,
  GrupoCalificarView, GrupoDetailView, GrupoDocenteView, GrupoView, InscripcionView, LoginInput,
  Periodo, ProgresoView, ReportesKPI, ReportesView, SaveAsistenciaInput, SaveCalificacionInput,
  SolicitarInscripcionInput, UpdateGrupoInput, Usuario,
} from './types';
import { mockApi } from './mocks/mockClient';

export class MockApiClient implements ApiClient {
  auth = {
    login: async (input: LoginInput): Promise<ApiResponse<Usuario>> => {
      const result = await mockApi.login(input.email, input.password);
      return { data: result.data.user };
    },
    logout: async (): Promise<void> => { await mockApi.logout(); },
    me: async (): Promise<ApiResponse<Usuario>> => {
      const result = await mockApi.me();
      return { data: result.data.user };
    },
  };

  usuarios = {
    list: async (params?: { rol?: string; programaId?: string; page?: number; limit?: number }): Promise<ApiPaginated<Usuario>> => {
      const result = await mockApi.listarUsuarios(params);
      const page = params?.page ?? 1;
      const limit = params?.limit ?? 20;
      return {
        data: result.data,
        meta: { page, limit, total: result.data.length },
      };
    },
    crear: async (input: CrearUsuarioInput): Promise<ApiResponse<Usuario>> => {
      const result = await mockApi.crearUsuario(input);
      return { data: result!.data };
    },
    actualizar: async (id: string, input: Partial<CrearUsuarioInput>): Promise<ApiResponse<Usuario>> => {
      const result = await mockApi.actualizarUsuario(id, input);
      return { data: result!.data };
    },
    eliminar: async (id: string): Promise<ApiResponse<void>> => {
      await mockApi.eliminarUsuario(id);
      return { data: undefined as any };
    },
  };

  admin = {
    dashboard: async (): Promise<ApiResponse<AdminDashboardView>> => {
      const result = await mockApi.adminDashboard();
      return { data: result!.data };
    },
  };

  periodos = {
    listar: async (): Promise<ApiResponse<Periodo[]>> => {
      const result = await mockApi.listarPeriodos();
      return { data: result.data };
    },
    crear: async (input: CrearPeriodoInput): Promise<ApiResponse<Periodo>> => {
      const result = await mockApi.crearPeriodo(input);
      return { data: result!.data };
    },
    actualizar: async (id: string, input: any): Promise<ApiResponse<Periodo>> => {
      const result = await mockApi.actualizarPeriodo(id, input);
      return { data: result!.data };
    },
    eliminar: async (id: string): Promise<ApiResponse<void>> => {
      await mockApi.eliminarPeriodo(id);
      return { data: undefined as any };
    },
  };

  coordinador = {
    grupos: async (): Promise<ApiResponse<CoordinadorGrupoView[]>> => {
      const result = await mockApi.coordinadorGrupos();
      return { data: result.data };
    },
    cursosDisponibles: async (): Promise<ApiResponse<{ id: string; nombre: string; codigo: string }[]>> => {
      const result = await mockApi.coordinadorCursosDisponibles();
      return { data: result.data };
    },
    docentesDisponibles: async (): Promise<ApiResponse<{ id: string; nombre: string }[]>> => {
      const result = await mockApi.coordinadorDocentesDisponibles();
      return { data: result.data };
    },
    crearGrupo: async (input: CreateGrupoInput): Promise<ApiResponse<CoordinadorGrupoView>> => {
      const result = await mockApi.coordinadorCrearGrupo(input);
      return { data: result.data };
    },
    actualizarGrupo: async (id: string, input: UpdateGrupoInput): Promise<ApiResponse<CoordinadorGrupoView>> => {
      const result = await mockApi.actualizarGrupo(id, input);
      return { data: result!.data };
    },
    toggleActa: async (id: string): Promise<ApiResponse<{ actaCerrada: boolean }>> => {
      const result = await mockApi.toggleActa(id);
      return { data: result!.data };
    },
    reportes: async (): Promise<ApiResponse<ReportesView>> => {
      const result = await mockApi.coordinadorReportes();
      return { data: result.data };
    },
    reportesKPI: async (): Promise<ApiResponse<ReportesKPI>> => {
      const result = await mockApi.coordinadorReportesKPI();
      return { data: result!.data };
    },
    detalleGrupo: async (id: string): Promise<ApiResponse<GrupoDetailView>> => {
      const result = await mockApi.detalleGrupo(id);
      return { data: result!.data };
    },
    estudiantesDisponibles: async (grupoId: string): Promise<ApiResponse<{ id: string; nombre: string; email: string }[]>> => {
      const result = await mockApi.estudiantesDisponibles(grupoId);
      return { data: result!.data };
    },
    agregarEstudiante: async (grupoId: string, estudianteId: string): Promise<ApiResponse<void>> => {
      await mockApi.agregarEstudiante(grupoId, estudianteId);
      return { data: undefined as any };
    },
    quitarEstudiante: async (grupoId: string, inscripcionId: string): Promise<ApiResponse<void>> => {
      await mockApi.quitarEstudiante(grupoId, inscripcionId);
      return { data: undefined as any };
    },
  };

  grupos = {
    mis: async (): Promise<ApiResponse<GrupoDocenteView[]>> => {
      const result = await mockApi.misGrupos();
      return { data: result.data };
    },
    calificar: async (id: string): Promise<ApiResponse<GrupoCalificarView>> => {
      const result = await mockApi.calificarGrupo(id);
      return { data: result.data };
    },
    saveCalificaciones: async (id: string, input: SaveCalificacionInput): Promise<ApiResponse<void>> => {
      await mockApi.saveCalificaciones(id, input);
      return { data: undefined as any };
    },
    asistencia: async (id: string, fecha: string): Promise<ApiResponse<AsistenciaView>> => {
      const result = await mockApi.asistenciaGrupo(id, fecha);
      return { data: result.data };
    },
    saveAsistencia: async (id: string, input: SaveAsistenciaInput): Promise<ApiResponse<void>> => {
      await mockApi.saveAsistencia(id, input);
      return { data: undefined as any };
    },
    crearEvaluacion: async (id: string, input: CrearEvaluacionInput): Promise<ApiResponse<void>> => {
      await mockApi.crearEvaluacion(id, input);
      return { data: undefined as any };
    },
    cerrarActa: async (id: string): Promise<ApiResponse<void>> => {
      await mockApi.cerrarActa(id);
      return { data: undefined as any };
    },
  };

  inscripciones = {
    mis: async (): Promise<ApiResponse<InscripcionView[]>> => {
      const result = await mockApi.misInscripciones();
      return { data: result.data };
    },
    gruposDisponibles: async (): Promise<ApiResponse<GrupoView[]>> => {
      const result = await mockApi.gruposDisponibles();
      return { data: result.data };
    },
    solicitar: async (input: SolicitarInscripcionInput): Promise<ApiResponse<InscripcionView>> => {
      const result = await mockApi.solicitarInscripcion(input.grupoId);
      return { data: result.data };
    },
  };

  calificaciones = {
    mis: async (): Promise<ApiResponse<CalificacionView[]>> => {
      const result = await mockApi.misCalificaciones();
      return { data: result.data };
    },
  };

  progreso = {
    mis: async (): Promise<ApiResponse<ProgresoView[]>> => {
      const result = await mockApi.misProgreso();
      return { data: result.data };
    },
  };
}
