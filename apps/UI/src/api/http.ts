import axios, { AxiosError, AxiosInstance } from 'axios';
import type { ApiClient } from './client';
import type { AdminDashboardView, ApiError, ApiPaginated, ApiResponse, AsistenciaView, CalificacionView, CoordinadorGrupoView, CrearEvaluacionInput, CreateGrupoInput, CrearPeriodoInput, CrearUsuarioInput, GrupoCalificarView, GrupoDetailView, GrupoDocenteView, GrupoView, InscripcionView, LoginInput, Periodo, ProgresoView, ReportesKPI, ReportesView, SaveAsistenciaInput, SaveCalificacionInput, SolicitarInscripcionInput, UpdateGrupoInput, Usuario } from './types';

function createInstance(): AxiosInstance {
  const baseURL = import.meta.env.VITE_API_URL ?? '';
  const instance = axios.create({
    baseURL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
  });

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ error?: ApiError }>) => {
      const apiError: ApiError = error.response?.data?.error ?? {
        code: 'network_error',
        message: error.message || 'Error de red',
      };
      return Promise.reject(apiError);
    },
  );

  return instance;
}

export class HttpApiClient implements ApiClient {
  private http = createInstance();

  auth = {
    login: async (input: LoginInput) => {
      const { data } = await this.http.post<ApiResponse<Usuario>>('/auth/login', input);
      return data;
    },
    logout: async () => {
      await this.http.post('/auth/logout');
    },
    me: async () => {
      const { data } = await this.http.get<ApiResponse<Usuario>>('/auth/me');
      return data;
    },
  };

  usuarios = {
    list: async (params?: { rol?: string; programaId?: string; page?: number; limit?: number }) => {
      const { data } = await this.http.get<ApiPaginated<Usuario>>('/usuarios', { params });
      return data;
    },
    crear: async (input: CrearUsuarioInput) => {
      const { data } = await this.http.post<ApiResponse<Usuario>>('/usuarios', input);
      return data;
    },
    actualizar: async (id: string, input: Partial<CrearUsuarioInput>) => {
      const { data } = await this.http.patch<ApiResponse<Usuario>>(`/usuarios/${id}`, input);
      return data;
    },
    eliminar: async (id: string) => {
      const { data } = await this.http.delete<ApiResponse<void>>(`/usuarios/${id}`);
      return data;
    },
  };

  admin = {
    dashboard: async () => {
      const { data } = await this.http.get<ApiResponse<AdminDashboardView>>('/admin/dashboard');
      return data;
    },
  };

  periodos = {
    listar: async () => {
      const { data } = await this.http.get<ApiResponse<Periodo[]>>('/periodos');
      return data;
    },
    crear: async (input: CrearPeriodoInput) => {
      const { data } = await this.http.post<ApiResponse<Periodo>>('/periodos', input);
      return data;
    },
    actualizar: async (id: string, input: Partial<CrearPeriodoInput & { estado: import('./types').EstadoPeriodo }>) => {
      const { data } = await this.http.patch<ApiResponse<Periodo>>(`/periodos/${id}`, input);
      return data;
    },
    eliminar: async (id: string) => {
      const { data } = await this.http.delete<ApiResponse<void>>(`/periodos/${id}`);
      return data;
    },
  };

  coordinador = {
    grupos: async () => {
      const { data } = await this.http.get<ApiResponse<CoordinadorGrupoView[]>>('/coordinador/grupos');
      return data;
    },
    cursosDisponibles: async () => {
      const { data } = await this.http.get<ApiResponse<{ id: string; nombre: string; codigo: string }[]>>('/coordinador/cursos');
      return data;
    },
    docentesDisponibles: async () => {
      const { data } = await this.http.get<ApiResponse<{ id: string; nombre: string }[]>>('/coordinador/docentes');
      return data;
    },
    crearGrupo: async (input: CreateGrupoInput) => {
      const { data } = await this.http.post<ApiResponse<CoordinadorGrupoView>>('/coordinador/grupos', input);
      return data;
    },
    actualizarGrupo: async (id: string, input: UpdateGrupoInput) => {
      const { data } = await this.http.patch<ApiResponse<CoordinadorGrupoView>>(`/coordinador/grupos/${id}`, input);
      return data;
    },
    toggleActa: async (id: string) => {
      const { data } = await this.http.post<ApiResponse<{ actaCerrada: boolean }>>(`/coordinador/grupos/${id}/toggle-acta`);
      return data;
    },
    reportes: async () => {
      const { data } = await this.http.get<ApiResponse<ReportesView>>('/coordinador/reportes');
      return data;
    },
    reportesKPI: async () => {
      const { data } = await this.http.get<ApiResponse<ReportesKPI>>('/coordinador/reportes/kpi');
      return data;
    },
    detalleGrupo: async (id: string) => {
      const { data } = await this.http.get<ApiResponse<GrupoDetailView>>(`/coordinador/grupos/${id}`);
      return data;
    },
    estudiantesDisponibles: async (grupoId: string) => {
      const { data } = await this.http.get<ApiResponse<{ id: string; nombre: string; email: string }[]>>(`/coordinador/grupos/${grupoId}/estudiantes-disponibles`);
      return data;
    },
    agregarEstudiante: async (grupoId: string, estudianteId: string) => {
      const { data } = await this.http.post<ApiResponse<void>>(`/coordinador/grupos/${grupoId}/estudiantes`, { estudianteId });
      return data;
    },
    quitarEstudiante: async (grupoId: string, inscripcionId: string) => {
      const { data } = await this.http.delete<ApiResponse<void>>(`/coordinador/grupos/${grupoId}/estudiantes/${inscripcionId}`);
      return data;
    },
  };

  grupos = {
    mis: async () => {
      const { data } = await this.http.get<ApiResponse<GrupoDocenteView[]>>('/grupos/mis');
      return data;
    },
    calificar: async (id: string) => {
      const { data } = await this.http.get<ApiResponse<GrupoCalificarView>>(`/grupos/${id}/calificar`);
      return data;
    },
    saveCalificaciones: async (id: string, input: SaveCalificacionInput) => {
      const { data } = await this.http.post<ApiResponse<void>>(`/grupos/${id}/calificaciones`, input);
      return data;
    },
    asistencia: async (id: string, fecha: string) => {
      const { data } = await this.http.get<ApiResponse<AsistenciaView>>(`/grupos/${id}/asistencia`, { params: { fecha } });
      return data;
    },
    saveAsistencia: async (id: string, input: SaveAsistenciaInput) => {
      const { data } = await this.http.post<ApiResponse<void>>(`/grupos/${id}/asistencia`, input);
      return data;
    },
    crearEvaluacion: async (id: string, input: CrearEvaluacionInput) => {
      const { data } = await this.http.post<ApiResponse<void>>(`/grupos/${id}/evaluaciones`, input);
      return data;
    },
    cerrarActa: async (id: string) => {
      const { data } = await this.http.post<ApiResponse<void>>(`/grupos/${id}/cerrar-acta`);
      return data;
    },
  };

  inscripciones = {
    mis: async () => {
      const { data } = await this.http.get<ApiResponse<InscripcionView[]>>('/inscripciones/mis');
      return data;
    },
    gruposDisponibles: async () => {
      const { data } = await this.http.get<ApiResponse<GrupoView[]>>('/grupos/disponibles');
      return data;
    },
    solicitar: async (input: SolicitarInscripcionInput) => {
      const { data } = await this.http.post<ApiResponse<InscripcionView>>('/inscripciones', input);
      return data;
    },
  };

  calificaciones = {
    mis: async () => {
      const { data } = await this.http.get<ApiResponse<CalificacionView[]>>('/calificaciones/mis');
      return data;
    },
  };

  progreso = {
    mis: async () => {
      const { data } = await this.http.get<ApiResponse<ProgresoView[]>>('/estudiante/progreso');
      return data;
    },
  };
}