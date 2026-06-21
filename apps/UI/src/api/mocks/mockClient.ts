import { createDB, verifyCredentials, createSession, destroySession, buildInscripcionViews, buildCalificacionViews } from './db';
import type { MockDB } from './db';
import type { AdminDashboardView, AsistenciaRegistro, AsistenciaView, CalificacionView, CoordinadorGrupoView, CrearEvaluacionInput, CreateGrupoInput, CrearPeriodoInput, CrearUsuarioInput, GrupoCalificarView, GrupoDetailView, GrupoDocenteView, GrupoView, InscripcionView, Periodo, ProgresoView, ReporteDesercion, ReporteDistribucion, ReporteRendimiento, ReportesKPI, ReportesView, SaveAsistenciaInput, SaveCalificacionInput, UpdateGrupoInput, Usuario } from '../types';

let _db: MockDB | null = null;
let _token: string | null = null;

export function getMockDB(): MockDB {
  if (!_db) _db = createDB();
  return _db;
}

export function getMockToken(): string | null {
  return _token;
}

export function setMockToken(t: string | null): void {
  _token = t;
}

async function wait(ms = 120): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function mkErr(code: string, message: string, status = 422) {
  const err: any = new Error(message);
  err.response = { data: { error: { code, message } } };
  err.status = status;
  return err;
}

function getUserId(): string {
  if (!_token) throw mkErr('session_expired', 'Sesión expirada o ausente', 401);
  const userId = getMockDB().sesiones.get(_token ?? '');
  if (!userId) {
    _token = null;
    throw mkErr('session_expired', 'Sesión expirada o ausente', 401);
  }
  return userId;
}

function assertUser(): void {
  const userId = getUserId();
  const user = getMockDB().usuarios.find((u) => u.id === userId);
  if (!user || !user.activo) throw mkErr('session_expired', 'Usuario no disponible', 401);
}

function currentUser() {
  return getMockDB().usuarios.find((u) => u.id === getUserId())!;
}

function assertRol(...roles: import('../types').Rol[]): void {
  const user = currentUser();
  if (!roles.includes(user.rol)) throw mkErr('forbidden', `Acceso restringido: requiere rol ${roles.join('/')}`, 403);
}

function assertCoordinadorOrAdmin(): void {
  assertRol('coordinador', 'administrativo');
}

function assertAdmin(): void {
  assertRol('administrativo');
}

function assertDocente(): void {
  assertRol('docente');
}

export const mockApi = {
  async login(email: string, password: string) {
    await wait(350);
    const user = verifyCredentials(getMockDB(), email, password);
    if (!user) throw mkErr('invalid_credentials', 'Email o contraseña incorrectos', 401);
    _token = createSession(getMockDB(), user.id);
    return { data: { user }, status: 200 };
  },

  async logout() {
    await wait(100);
    if (_token) {
      destroySession(getMockDB(), _token);
      _token = null;
    }
    return { data: null, status: 204 };
  },

  async me() {
    await wait(80);
    if (!_token) throw mkErr('session_expired', 'Sesión expirada o ausente', 401);
    const userId = getMockDB().sesiones.get(_token ?? '');
    if (!userId) {
      _token = null;
      throw mkErr('session_expired', 'Sesión expirada o ausente', 401);
    }
    const user = getMockDB().usuarios.find((u) => u.id === userId);
    if (!user || !user.activo) throw mkErr('session_expired', 'Usuario no disponible', 401);
    return { data: { user }, status: 200 };
  },

  async misInscripciones(): Promise<{ data: InscripcionView[]; status: number }> {
    await wait(200);
    assertUser();
    assertRol('estudiante');
    const views = buildInscripcionViews(getMockDB(), getUserId());
    return { data: views, status: 200 };
  },

  async misCalificaciones(): Promise<{ data: CalificacionView[]; status: number }> {
    await wait(250);
    assertUser();
    assertRol('estudiante');
    const views = buildCalificacionViews(getMockDB(), getUserId());
    return { data: views, status: 200 };
  },

  async gruposDisponibles(): Promise<{ data: GrupoView[]; status: number }> {
    await wait(200);
    assertUser();
    assertRol('estudiante');
    const db = getMockDB();
    const userId = getUserId();
    const user = db.usuarios.find((u) => u.id === userId)!;
    const periodo = db.periodos.find((p) => p.estado === 'activo');
    if (!periodo) return { data: [], status: 200 };

    const grupoIdsInscrito = new Set(
      db.inscripciones
        .filter((i) => i.estudianteId === userId && ['activa', 'solicitada', 'aprobada'].includes(i.estado))
        .map((i) => i.grupoId),
    );

    const groups = db.grupos.filter((g) => {
      if (g.periodoId !== periodo.id) return false;
      if (g.cupoDisponible <= 0) return false;
      if (grupoIdsInscrito.has(g.id)) return false;
      const curso = db.cursos.find((c) => c.id === g.cursoId);
      if (!curso) return false;
      if (!user.programaIds.includes(curso.programaId)) return false;
      return true;
    });

    const views: GrupoView[] = groups.map((g) => {
      const curso = db.cursos.find((c) => c.id === g.cursoId)!;
      const prog = db.programas.find((p) => p.id === curso.programaId);
      const docente = db.usuarios.find((u) => u.id === g.docenteId);
      return {
        id: g.id,
        cursoNombre: curso.nombre,
        cursoCodigo: curso.codigo,
        creditos: curso.creditos,
        programaNombre: prog?.nombre ?? '-',
        horario: g.horario,
        aula: g.aula,
        docenteNombre: docente?.nombre ?? '-',
        cupo: g.cupo,
        cupoDisponible: g.cupoDisponible,
        inscrito: false,
      };
    });

    return { data: views, status: 200 };
  },

  /* ---- usuarios CRUD ---- */
  async listarUsuarios(params?: { rol?: string; programaId?: string }): Promise<{ data: Usuario[]; status: number }> {
    await wait(150);
    assertUser();
    assertAdmin();
    const db = getMockDB();
    const filtered = db.usuarios.filter((u) => {
      if (params?.rol && u.rol !== params.rol) return false;
      if (params?.programaId && !u.programaIds.includes(params.programaId)) return false;
      return u.activo;
    });
    return { data: filtered, status: 200 };
  },

  async crearUsuario(input: CrearUsuarioInput): Promise<{ data: Usuario; status: number }> {
    await wait(200);
    assertUser();
    assertAdmin();
    const db = getMockDB();
    const exists = db.usuarios.find((u) => u.email === input.email);
    if (exists) throw mkErr('duplicate', 'El email ya está registrado', 409);
    const id = `u-${Date.now()}`;
    const user: any = {
      id,
      nombre: input.nombre,
      email: input.email,
      rol: input.rol,
      programaIds: input.programaIds,
      activo: true,
    };
    db.usuarios.push(user);
    return { data: { id, nombre: user.nombre, email: user.email, rol: user.rol, programaIds: user.programaIds, activo: true }, status: 201 };
  },

  async actualizarUsuario(id: string, input: Partial<CrearUsuarioInput>): Promise<{ data: Usuario; status: number }> {
    await wait(200);
    assertUser();
    assertAdmin();
    const db = getMockDB();
    const user = db.usuarios.find((u) => u.id === id);
    if (!user) throw mkErr('not_found', 'Usuario no encontrado', 404);
    Object.assign(user, input);
    return { data: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, programaIds: user.programaIds, activo: user.activo }, status: 200 };
  },

  async eliminarUsuario(id: string): Promise<{ data: void; status: number }> {
    await wait(200);
    assertUser();
    assertAdmin();
    const db = getMockDB();
    const idx = db.usuarios.findIndex((u) => u.id === id);
    if (idx === -1) throw mkErr('not_found', 'Usuario no encontrado', 404);
    db.usuarios[idx].activo = false;
    return { data: undefined as any, status: 200 };
  },

  /* ---- periodos CRUD ---- */
  async listarPeriodos(): Promise<{ data: Periodo[]; status: number }> {
    await wait(100);
    assertUser();
    assertAdmin();
    return { data: getMockDB().periodos.map((p: any) => ({ id: p.id, nombre: p.nombre, tipo: p.tipo, fechaInicio: p.fechaInicio, fechaFinInscripcion: p.fechaFinInscripcion, fechaFinClases: p.fechaFinClases, estado: p.estado })), status: 200 };
  },

  async crearPeriodo(input: CrearPeriodoInput): Promise<{ data: Periodo; status: number }> {
    await wait(200);
    assertUser();
    assertAdmin();
    const db = getMockDB();
    const id = `per-${Date.now()}`;
    const periodo: any = { id, ...input, estado: 'borrador' as const };
    db.periodos.push(periodo);
    return { data: { id, nombre: input.nombre, tipo: input.tipo, fechaInicio: input.fechaInicio, fechaFinInscripcion: input.fechaFinInscripcion, fechaFinClases: input.fechaFinClases, estado: 'borrador' }, status: 201 };
  },

  async actualizarPeriodo(id: string, input: Partial<CrearPeriodoInput & { estado: import('../types').EstadoPeriodo }>): Promise<{ data: Periodo; status: number }> {
    await wait(200);
    assertUser();
    assertAdmin();
    const db = getMockDB();
    const p = db.periodos.find((per: any) => per.id === id);
    if (!p) throw mkErr('not_found', 'Período no encontrado', 404);
    Object.assign(p, input);
    return { data: { id: p.id, nombre: p.nombre, tipo: p.tipo, fechaInicio: p.fechaInicio, fechaFinInscripcion: p.fechaFinInscripcion, fechaFinClases: p.fechaFinClases, estado: p.estado }, status: 200 };
  },

  async eliminarPeriodo(id: string): Promise<{ data: void; status: number }> {
    await wait(200);
    assertUser();
    assertAdmin();
    const db = getMockDB();
    const idx = db.periodos.findIndex((p: any) => p.id === id);
    if (idx === -1) throw mkErr('not_found', 'Período no encontrado', 404);
    db.periodos.splice(idx, 1);
    return { data: undefined as any, status: 200 };
  },

  async coordinadorGrupos(): Promise<{ data: CoordinadorGrupoView[]; status: number }> {
    await wait(200);
    assertUser();
    assertCoordinadorOrAdmin();
    const db = getMockDB();
    const userId = getUserId();
    const user = db.usuarios.find((u) => u.id === userId)!;
    if (user.rol !== 'coordinador' && user.rol !== 'administrativo') throw mkErr('forbidden', 'Solo coordinadores o administrativos', 403);

    const periodo = db.periodos.find((p) => p.estado === 'activo');
    if (!periodo) return { data: [], status: 200 };

    const groups = db.grupos.filter((g) => g.periodoId === periodo.id);
    const views: CoordinadorGrupoView[] = groups.map((g) => {
      const curso = db.cursos.find((c) => c.id === g.cursoId);
      const prog = curso ? db.programas.find((p) => p.id === curso.programaId) : undefined;
      const docente = db.usuarios.find((u) => u.id === g.docenteId);
      const estudiantes = db.inscripciones.filter((i) => i.grupoId === g.id && ['activa', 'aprobada_final', 'reprobada_final'].includes(i.estado));
      return {
        id: g.id,
        cursoNombre: curso?.nombre ?? '-',
        cursoCodigo: curso?.codigo ?? '-',
        programaNombre: prog?.nombre ?? '-',
        periodoNombre: periodo.nombre,
        horario: g.horario,
        aula: g.aula,
        docenteNombre: docente?.nombre ?? '-',
        cupo: g.cupo,
        cupoDisponible: g.cupoDisponible,
        totalEstudiantes: estudiantes.length,
        actaCerrada: g.actaCerrada,
      };
    });

    return { data: views, status: 200 };
  },

  async coordinadorCursosDisponibles(): Promise<{ data: { id: string; nombre: string; codigo: string }[]; status: number }> {
    await wait(100);
    assertUser();
    assertCoordinadorOrAdmin();
    const db = getMockDB();
    const userId = getUserId();
    const user = db.usuarios.find((u) => u.id === userId)!;
    const cursos = db.cursos.filter((c) => user.programaIds.includes(c.programaId));
    return { data: cursos.map((c) => ({ id: c.id, nombre: c.nombre, codigo: c.codigo })), status: 200 };
  },

  async coordinadorDocentesDisponibles(): Promise<{ data: { id: string; nombre: string }[]; status: number }> {
    await wait(100);
    assertUser();
    assertCoordinadorOrAdmin();
    const db = getMockDB();
    return { data: db.usuarios.filter((u: any) => u.rol === 'docente' && u.activo).map((u: any) => ({ id: u.id, nombre: u.nombre })), status: 200 };
  },

  async coordinadorCrearGrupo(input: CreateGrupoInput): Promise<{ data: CoordinadorGrupoView; status: number }> {
    await wait(200);
    assertUser();
    assertCoordinadorOrAdmin();
    const db = getMockDB();
    const periodo = db.periodos.find((p) => p.estado === 'activo');
    if (!periodo) throw mkErr('no_active_period', 'No hay período activo', 400);
    const curso = db.cursos.find((c) => c.id === input.cursoId);
    if (!curso) throw mkErr('not_found', 'Curso no encontrado', 404);

    const id = `g-${Date.now()}`;
    const grupo: any = {
      id,
      cursoId: input.cursoId,
      periodoId: periodo.id,
      docenteId: input.docenteId,
      horario: input.horario,
      cupo: input.cupo,
      cupoDisponible: input.cupo,
      aula: input.aula,
      actaCerrada: false,
    };
    db.grupos.push(grupo);

    const docente = db.usuarios.find((u) => u.id === input.docenteId);
    const prog = db.programas.find((p) => p.id === curso.programaId);
    return {
      data: {
        id,
        cursoNombre: curso.nombre,
        cursoCodigo: curso.codigo,
        programaNombre: prog?.nombre ?? '-',
        periodoNombre: periodo.nombre,
        horario: input.horario,
        aula: input.aula,
        docenteNombre: docente?.nombre ?? '-',
        cupo: input.cupo,
        cupoDisponible: input.cupo,
        totalEstudiantes: 0,
        actaCerrada: false,
      },
      status: 201,
    };
  },

  async actualizarGrupo(id: string, input: UpdateGrupoInput): Promise<{ data: CoordinadorGrupoView; status: number }> {
    await wait(200);
    assertUser();
    assertCoordinadorOrAdmin();
    const db = getMockDB();
    const grupo = db.grupos.find((g: any) => g.id === id);
    if (!grupo) throw mkErr('not_found', 'Grupo no encontrado', 404);
    const oldCupo = grupo.cupo;
    Object.assign(grupo, input);
    if (input.cupo !== undefined) grupo.cupoDisponible = Math.max(0, input.cupo - (oldCupo - grupo.cupoDisponible));
    const curso = db.cursos.find((c: any) => c.id === grupo.cursoId);
    const docente = db.usuarios.find((u: any) => u.id === grupo.docenteId);
    const prog = db.programas.find((p: any) => p.id === curso?.programaId);
    const periodo = db.periodos.find((p: any) => p.id === grupo.periodoId);
    const estudiantes = db.inscripciones.filter((i: any) => i.grupoId === grupo.id && ['activa', 'aprobada_final', 'reprobada_final'].includes(i.estado));
    return {
      data: {
        id: grupo.id, cursoNombre: curso?.nombre ?? '-', cursoCodigo: curso?.codigo ?? '-',
        programaNombre: prog?.nombre ?? '-', periodoNombre: periodo?.nombre ?? '-',
        horario: grupo.horario, aula: grupo.aula, docenteNombre: docente?.nombre ?? '-',
        cupo: grupo.cupo, cupoDisponible: grupo.cupoDisponible,
        totalEstudiantes: estudiantes.length, actaCerrada: grupo.actaCerrada,
      },
      status: 200,
    };
  },

  async toggleActa(id: string): Promise<{ data: { actaCerrada: boolean }; status: number }> {
    await wait(200);
    assertUser();
    assertCoordinadorOrAdmin();
    const db = getMockDB();
    const grupo = db.grupos.find((g: any) => g.id === id);
    if (!grupo) throw mkErr('not_found', 'Grupo no encontrado', 404);
    grupo.actaCerrada = !grupo.actaCerrada;
    return { data: { actaCerrada: grupo.actaCerrada }, status: 200 };
  },

  async detalleGrupo(id: string): Promise<{ data: GrupoDetailView; status: number }> {
    await wait(200);
    assertUser();
    assertCoordinadorOrAdmin();
    const db = getMockDB();
    const grupo = db.grupos.find((g: any) => g.id === id);
    if (!grupo) throw mkErr('not_found', 'Grupo no encontrado', 404);
    const curso = db.cursos.find((c: any) => c.id === grupo.cursoId);
    const docente = db.usuarios.find((u: any) => u.id === grupo.docenteId);
    const prog = db.programas.find((p: any) => p.id === curso?.programaId);
    const periodo = db.periodos.find((p: any) => p.id === grupo.periodoId);
    const insc = db.inscripciones.filter((i: any) => i.grupoId === grupo.id);
    const estudiantes = insc.map((i: any) => {
      const u = db.usuarios.find((usr: any) => usr.id === i.estudianteId);
      return { id: u?.id ?? '', inscripcionId: i.id, nombre: u?.nombre ?? '-', email: u?.email ?? '', estado: i.estado };
    });
    return {
      data: {
        id: grupo.id, cursoNombre: curso?.nombre ?? '-', cursoCodigo: curso?.codigo ?? '-',
        programaNombre: prog?.nombre ?? '-', periodoNombre: periodo?.nombre ?? '-',
        horario: grupo.horario, aula: grupo.aula, docenteNombre: docente?.nombre ?? '-',
        docenteId: grupo.docenteId, cupo: grupo.cupo, cupoDisponible: grupo.cupoDisponible,
        totalEstudiantes: estudiantes.length, actaCerrada: grupo.actaCerrada, estudiantes,
      },
      status: 200,
    };
  },

  async estudiantesDisponibles(grupoId: string): Promise<{ data: { id: string; nombre: string; email: string }[]; status: number }> {
    await wait(100);
    assertUser();
    assertCoordinadorOrAdmin();
    const db = getMockDB();
    const grupo = db.grupos.find((g: any) => g.id === grupoId);
    if (!grupo) throw mkErr('not_found', 'Grupo no encontrado', 404);
    const inscritos = new Set(db.inscripciones.filter((i: any) => i.grupoId === grupoId).map((i: any) => i.estudianteId));
    const disponibles = db.usuarios.filter((u: any) => u.rol === 'estudiante' && u.activo && !inscritos.has(u.id));
    return { data: disponibles.map((u: any) => ({ id: u.id, nombre: u.nombre, email: u.email })), status: 200 };
  },

  async agregarEstudiante(grupoId: string, estudianteId: string): Promise<{ data: any; status: number }> {
    await wait(200);
    assertUser();
    assertCoordinadorOrAdmin();
    const db = getMockDB();
    const grupo = db.grupos.find((g: any) => g.id === grupoId);
    if (!grupo) throw mkErr('not_found', 'Grupo no encontrado', 404);
    if (grupo.cupoDisponible <= 0) throw mkErr('no_cupo', 'El grupo no tiene cupos disponibles', 400);
    const exists = db.inscripciones.find((i: any) => i.grupoId === grupoId && i.estudianteId === estudianteId);
    if (exists) throw mkErr('duplicate', 'El estudiante ya está en el grupo', 409);
    db.inscripciones.push({
      id: `ins-${Date.now()}`, estudianteId: estudianteId, grupoId,
      periodoId: grupo.periodoId, estado: 'activa', intentos: 1, createdAt: new Date().toISOString(),
    });
    grupo.cupoDisponible--;
    return { data: null, status: 201 };
  },

  async quitarEstudiante(grupoId: string, inscripcionId: string): Promise<{ data: any; status: number }> {
    await wait(200);
    assertUser();
    assertCoordinadorOrAdmin();
    const db = getMockDB();
    const idx = db.inscripciones.findIndex((i: any) => i.id === inscripcionId && i.grupoId === grupoId);
    if (idx === -1) throw mkErr('not_found', 'Inscripción no encontrada', 404);
    db.inscripciones.splice(idx, 1);
    const grupo = db.grupos.find((g: any) => g.id === grupoId);
    if (grupo) grupo.cupoDisponible++;
    return { data: null, status: 200 };
  },

  async coordinadorReportesKPI(): Promise<{ data: ReportesKPI; status: number }> {
    await wait(150);
    assertUser();
    assertCoordinadorOrAdmin();
    const db = getMockDB();
    const periodo = db.periodos.find((p: any) => p.estado === 'activo');
    if (!periodo) return { data: { totalEstudiantes: 0, promedioGeneral: 0, tasaAprobacionGeneral: 0, totalGrupos: 0, totalRetirados: 0 }, status: 200 };
    const grupos = db.grupos.filter((g: any) => g.periodoId === periodo.id);
    const todasInsc = db.inscripciones.filter((i: any) => grupos.some((g: any) => g.id === i.grupoId));
    const activas = todasInsc.filter((i: any) => ['activa', 'aprobada_final', 'reprobada_final'].includes(i.estado));
    const retirados = todasInsc.filter((i: any) => i.estado === 'retirada' || i.estado === 'cancelada').length;
    const estudiantesUnicos = new Set(activas.map((i: any) => i.estudianteId)).size;
    const calificaciones = db.calificaciones.filter((c: any) => activas.some((i: any) => i.id === c.inscripcionId));
    const promedios = new Map<string, number[]>();
    for (const c of calificaciones) {
      if (!promedios.has(c.inscripcionId)) promedios.set(c.inscripcionId, []);
      promedios.get(c.inscripcionId)!.push(c.nota);
    }
    let sumaProm = 0; let alumnosConNota = 0; let aprobados = 0;
    for (const [, notasArr] of promedios) {
      if (notasArr.length > 0) {
        const avg = notasArr.reduce((s: number, n: number) => s + n, 0) / notasArr.length;
        sumaProm += avg; alumnosConNota++;
        if (avg >= 10) aprobados++;
      }
    }
    return {
      data: {
        totalEstudiantes: estudiantesUnicos, promedioGeneral: alumnosConNota > 0 ? Math.round((sumaProm / alumnosConNota) * 100) / 100 : 0,
        tasaAprobacionGeneral: alumnosConNota > 0 ? Math.round((aprobados / alumnosConNota) * 100) : 0,
        totalGrupos: grupos.length, totalRetirados: retirados,
      },
      status: 200,
    };
  },

  async coordinadorReportes(): Promise<{ data: ReportesView; status: number }> {
    await wait(300);
    assertUser();
    assertCoordinadorOrAdmin();
    const db = getMockDB();
    const periodo = db.periodos.find((p) => p.estado === 'activo');
    if (!periodo) return { data: { rendimiento: [], distribucion: [], desercion: [] }, status: 200 };

    const grupos = db.grupos.filter((g) => g.periodoId === periodo.id);

    const rendimiento: ReporteRendimiento[] = grupos.map((g) => {
      const curso = db.cursos.find((c) => c.id === g.cursoId);
      const docente = db.usuarios.find((u) => u.id === g.docenteId);
      const insc = db.inscripciones.filter(
        (i) => i.grupoId === g.id && ['activa', 'aprobada_final', 'reprobada_final'].includes(i.estado),
      );

      let suma = 0;
      let conNota = 0;
      let aprobados = 0;
      let reprobados = 0;

      for (const i of insc) {
        if (i.estado === 'aprobada_final') { aprobados++; continue; }
        if (i.estado === 'reprobada_final') { reprobados++; continue; }
        const evals = db.evaluaciones.filter((e) => e.grupoId === g.id);
        const cals = db.calificaciones.filter((c) => c.inscripcionId === i.id);
        const notas = evals.map((e) => {
          const cal = cals.find((c) => c.evaluacionId === e.id);
          return cal ? { nota: cal.nota, peso: e.peso } : null;
        }).filter(Boolean) as { nota: number; peso: number }[];

        if (notas.length > 0) {
          const sumaPesos = notas.reduce((s, n) => s + n.peso, 0);
          const prom = sumaPesos > 0
            ? Math.round((notas.reduce((s, n) => s + n.nota * n.peso, 0) / sumaPesos) * 100) / 100
            : -1;
          if (prom >= 0) {
            suma += prom;
            conNota++;
            if (prom >= 10) aprobados++; else reprobados++;
          }
        }
      }

      const total = insc.length;
      return {
        cursoNombre: curso?.nombre ?? '-',
        grupoId: g.id,
        docenteNombre: docente?.nombre ?? '-',
        estudiantes: total,
        promedio: conNota > 0 ? Math.round((suma / conNota) * 100) / 100 : -1,
        aprobados,
        reprobados,
        tasaAprobacion: total > 0 ? Math.round((aprobados / total) * 100) : 0,
      };
    });

    /* distribución — recolectar promedios de todas las inscripciones con nota final */
    const todosPromedios: number[] = [];
    for (const g of grupos) {
      const evals = db.evaluaciones.filter((e) => e.grupoId === g.id);
      const insc = db.inscripciones.filter(
        (i) => i.grupoId === g.id && ['activa', 'aprobada_final', 'reprobada_final'].includes(i.estado),
      );
      for (const i of insc) {
        if (i.estado === 'aprobada_final') { todosPromedios.push(15); continue; }
        if (i.estado === 'reprobada_final') { todosPromedios.push(6); continue; }
        const cals = db.calificaciones.filter((c) => c.inscripcionId === i.id);
        const notas = evals.map((e) => {
          const cal = cals.find((c) => c.evaluacionId === e.id);
          return cal ? { nota: cal.nota, peso: e.peso } : null;
        }).filter(Boolean) as { nota: number; peso: number }[];
        if (notas.length > 0) {
          const sp = notas.reduce((s, n) => s + n.peso, 0);
          const prom = sp > 0 ? Math.round((notas.reduce((s, n) => s + n.nota * n.peso, 0) / sp) * 100) / 100 : -1;
          if (prom >= 0) todosPromedios.push(prom);
        }
      }
    }

    const rangos: { label: string; min: number; max: number; color: string }[] = [
      { label: '0–5', min: 0, max: 5, color: '#ef4444' },
      { label: '5–10', min: 5, max: 10, color: '#f59e0b' },
      { label: '10–15', min: 10, max: 15, color: '#0ea5e9' },
      { label: '15–20', min: 15, max: 20, color: '#10b981' },
    ];

    const distribucion: ReporteDistribucion[] = rangos.map((r) => ({
      rango: r.label,
      cantidad: todosPromedios.filter((p) => p >= r.min && p < r.max).length,
      color: r.color,
    }));

    /* deserción */
    const desercion: ReporteDesercion[] = grupos.map((g) => {
      const curso = db.cursos.find((c) => c.id === g.cursoId);
      const insc = db.inscripciones.filter((i) => i.grupoId === g.id);
      const retirados = insc.filter((i) => i.estado === 'retirada').length;
      const cancelados = insc.filter((i) => i.estado === 'cancelada').length;
      return {
        cursoNombre: curso?.nombre ?? '-',
        totalInscritos: insc.length,
        retirados,
        cancelados,
        tasaDesercion: insc.length > 0 ? Math.round(((retirados + cancelados) / insc.length) * 100) : 0,
      };
    });

    return { data: { rendimiento, distribucion, desercion }, status: 200 };
  },

  async adminDashboard(): Promise<{ data: AdminDashboardView; status: number }> {
    await wait(150);
    assertUser();
    assertAdmin();
    const db = getMockDB();
    const usuarios = db.usuarios.filter((u: any) => u.activo);
    const periodo = db.periodos.find((p: any) => p.estado === 'activo');
    const grupos = periodo ? db.grupos.filter((g: any) => g.periodoId === periodo.id) : [];
    const inscripciones = grupos.flatMap((g: any) => db.inscripciones.filter((i: any) => i.grupoId === g.id));
    return {
      data: {
        totalUsuarios: usuarios.length,
        totalEstudiantes: usuarios.filter((u: any) => u.rol === 'estudiante').length,
        totalDocentes: usuarios.filter((u: any) => u.rol === 'docente').length,
        totalCoordinadores: usuarios.filter((u: any) => u.rol === 'coordinador').length,
        totalAdministrativos: usuarios.filter((u: any) => u.rol === 'administrativo').length,
        periodoActivo: periodo?.nombre ?? null,
        totalGruposActivos: grupos.length,
        totalInscripciones: inscripciones.length,
      },
      status: 200,
    };
  },

  async misGrupos(): Promise<{ data: GrupoDocenteView[]; status: number }> {
    await wait(200);
    assertUser();
    assertDocente();
    const db = getMockDB();
    const userId = getUserId();
    const user = db.usuarios.find((u) => u.id === userId)!;
    if (user.rol !== 'docente') throw mkErr('forbidden', 'Solo docentes pueden ver sus grupos', 403);

    const periodo = db.periodos.find((p) => p.estado === 'activo');
    if (!periodo) return { data: [], status: 200 };

    const misGrupos = db.grupos.filter((g) => g.docenteId === userId && g.periodoId === periodo.id);

    const views: GrupoDocenteView[] = misGrupos.map((g) => {
      const curso = db.cursos.find((c) => c.id === g.cursoId);
      const estudiantes = db.inscripciones.filter(
        (i) => i.grupoId === g.id && ['activa', 'aprobada_final', 'reprobada_final'].includes(i.estado),
      );
      const evals = db.evaluaciones.filter((e) => e.grupoId === g.id);
      return {
        id: g.id,
        cursoNombre: curso?.nombre ?? '-',
        cursoCodigo: curso?.codigo ?? '-',
        creditos: curso?.creditos ?? 0,
        periodoNombre: periodo.nombre,
        horario: g.horario,
        aula: g.aula,
        totalEstudiantes: estudiantes.length,
        evaluacionesCount: evals.length,
      };
    });

    return { data: views, status: 200 };
  },

  async calificarGrupo(grupoId: string): Promise<{ data: GrupoCalificarView; status: number }> {
    await wait(200);
    assertUser();
    assertDocente();
    const db = getMockDB();
    const grupo = db.grupos.find((g) => g.id === grupoId);
    if (!grupo) throw mkErr('not_found', 'Grupo no encontrado', 404);

    const curso = db.cursos.find((c) => c.id === grupo.cursoId)!;
    const evals = db.evaluaciones.filter((e) => e.grupoId === grupoId);
    const inscripciones = db.inscripciones.filter(
      (i) => i.grupoId === grupoId && ['activa', 'aprobada_final', 'reprobada_final'].includes(i.estado),
    );

    const estudiantes = inscripciones.map((ins) => {
      const user = db.usuarios.find((u) => u.id === ins.estudianteId);
      let nota: number | null = null;
      const saved = db.calificaciones.filter((c) => c.inscripcionId === ins.id);
      if (saved.length > 0 && evals.length > 0) {
        const totalWeight = evals.reduce((s, e) => s + e.peso, 0);
        if (totalWeight > 0) {
          const weightedSum = evals.reduce((s, e) => {
            const c = saved.find((x) => x.evaluacionId === e.id);
            return s + (c ? c.nota * e.peso : 0);
          }, 0);
          nota = Math.round((weightedSum / totalWeight) * 100) / 100;
        }
      }
      return {
        inscripcionId: ins.id,
        estudianteNombre: user?.nombre ?? '-',
        nota,
      };
    });

    const views: GrupoCalificarView = {
      cursoId: grupo.cursoId,
      cursoNombre: curso?.nombre ?? '-',
      cursoCodigo: curso?.codigo ?? '-',
      evaluaciones: evals.map((e) => ({ id: e.id, nombre: e.nombre, peso: e.peso })),
      estudiantes,
      actaCerrada: grupo.actaCerrada ?? false,
    };

    return { data: views, status: 200 };
  },

  async saveCalificaciones(grupoId: string, input: SaveCalificacionInput): Promise<{ data: any; status: number }> {
    await wait(200);
    assertUser();
    assertDocente();
    const db = getMockDB();
    const grupo = db.grupos.find((g) => g.id === grupoId);
    if (!grupo) throw mkErr('not_found', 'Grupo no encontrado', 404);

    for (const n of input.notas) {
      const existing = db.calificaciones.find(
        (c) => c.inscripcionId === n.inscripcionId && c.evaluacionId === input.evaluacionId,
      );
      if (existing) {
        existing.nota = n.nota;
      } else {
        db.calificaciones.push({
          id: `cal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          inscripcionId: n.inscripcionId,
          evaluacionId: input.evaluacionId,
          nota: n.nota,
          createdAt: new Date().toISOString(),
        });
      }
    }

    return { data: null, status: 200 };
  },

  async asistenciaGrupo(grupoId: string, fecha: string): Promise<{ data: AsistenciaView; status: number }> {
    await wait(200);
    assertUser();
    assertDocente();
    const db = getMockDB();
    const grupo = db.grupos.find((g) => g.id === grupoId);
    if (!grupo) throw mkErr('not_found', 'Grupo no encontrado', 404);

    const inscripciones = db.inscripciones.filter(
      (i) => i.grupoId === grupoId && ['activa', 'aprobada_final', 'reprobada_final'].includes(i.estado),
    );

    const registros: AsistenciaRegistro[] = inscripciones.map((ins) => {
      const user = db.usuarios.find((u) => u.id === ins.estudianteId);
      const saved = db.asistencias.find((a) => a.inscripcionId === ins.id && a.fecha === fecha);
      return {
        inscripcionId: ins.id,
        estudianteNombre: user?.nombre ?? '-',
        estado: saved?.estado ?? null,
      };
    });

    return { data: { fecha, registros }, status: 200 };
  },

  async saveAsistencia(grupoId: string, input: SaveAsistenciaInput): Promise<{ data: any; status: number }> {
    await wait(200);
    assertUser();
    assertDocente();
    const db = getMockDB();
    const grupo = db.grupos.find((g) => g.id === grupoId);
    if (!grupo) throw mkErr('not_found', 'Grupo no encontrado', 404);
    for (const r of input.registros) {
      const existing = db.asistencias.find((a) => a.inscripcionId === r.inscripcionId && a.fecha === input.fecha);
      if (existing) {
        existing.estado = r.estado;
      } else {
        db.asistencias.push({
          id: `asi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          inscripcionId: r.inscripcionId,
          fecha: input.fecha,
          estado: r.estado,
        });
      }
    }
    return { data: null, status: 200 };
  },

  async crearEvaluacion(grupoId: string, input: CrearEvaluacionInput): Promise<{ data: any; status: number }> {
    await wait(200);
    assertUser();
    assertDocente();
    const db = getMockDB();
    const grupo = db.grupos.find((g: any) => g.id === grupoId);
    if (!grupo) throw mkErr('not_found', 'Grupo no encontrado', 404);
    const evalId = `eval-${Date.now()}`;
    db.evaluaciones.push({
      id: evalId, grupoId, nombre: input.nombre, peso: input.peso, fecha: input.fecha,
    });
    return { data: null, status: 201 };
  },

  async cerrarActa(grupoId: string): Promise<{ data: any; status: number }> {
    await wait(200);
    assertUser();
    assertDocente();
    const db = getMockDB();
    const grupo = db.grupos.find((g: any) => g.id === grupoId);
    if (!grupo) throw mkErr('not_found', 'Grupo no encontrado', 404);
    grupo.actaCerrada = true;
    return { data: null, status: 200 };
  },

  async misProgreso(): Promise<{ data: ProgresoView[]; status: number }> {
    await wait(150);
    assertUser();
    assertRol('estudiante');
    const db = getMockDB();
    const userId = getUserId();
    const user = db.usuarios.find((u) => u.id === userId)!;

    const views: ProgresoView[] = user.programaIds.map((pid) => {
      const prog = db.programas.find((p) => p.id === pid)!;
      const progCursos = db.cursos.filter((c) => c.programaId === pid);
      const totalCreditos = progCursos.reduce((s, c) => s + c.creditos, 0);

      const inscripcionesEst = db.inscripciones.filter((i) => i.estudianteId === userId);
      const aprobados = progCursos
        .filter((c) =>
          inscripcionesEst.some(
            (i) => i.estado === 'aprobada_final' && db.grupos.find((g) => g.id === i.grupoId)?.cursoId === c.id,
          ),
        )
        .reduce((s, c) => s + c.creditos, 0);

      const enCurso = progCursos
        .filter((c) =>
          inscripcionesEst.some(
            (i) => i.estado === 'activa' && db.grupos.find((g) => g.id === i.grupoId)?.cursoId === c.id,
          ),
        )
        .reduce((s, c) => s + c.creditos, 0);

      return {
        programaNombre: prog.nombre,
        programaCodigo: prog.codigo,
        totalCreditos,
        aprobados,
        enCurso,
        porcentaje: totalCreditos > 0 ? Math.round((aprobados / totalCreditos) * 100) : 0,
      };
    });

    return { data: views, status: 200 };
  },

  async solicitarInscripcion(grupoId: string): Promise<{ data: InscripcionView; status: number }> {
    await wait(200);
    assertUser();
    assertRol('estudiante');
    const db = getMockDB();
    const userId = getUserId();
    const periodo = db.periodos.find((p) => p.estado === 'activo');
    if (!periodo) throw mkErr('no_active_period', 'No hay un período activo', 400);

    const grupo = db.grupos.find((g) => g.id === grupoId);
    if (!grupo) throw mkErr('not_found', 'Grupo no encontrado', 404);
    if (grupo.periodoId !== periodo.id) throw mkErr('period_mismatch', 'El grupo no pertenece al período activo', 400);
    if (grupo.cupoDisponible <= 0) throw mkErr('no_cupo', 'El grupo no tiene cupos disponibles', 400);

    const existing = db.inscripciones.find(
      (i) => i.estudianteId === userId && i.grupoId === grupoId && ['activa', 'solicitada', 'aprobada'].includes(i.estado),
    );
    if (existing) throw mkErr('already_inscrito', 'Ya estás inscrito en este grupo', 409);

    const ins: any = {
      id: `ins-${Date.now()}`,
      estudianteId: userId,
      grupoId: grupo.id,
      periodoId: periodo.id,
      estado: 'solicitada',
      intentos: 1,
      createdAt: new Date().toISOString(),
    };
    db.inscripciones.push(ins);
    grupo.cupoDisponible--;

    const views = buildInscripcionViews(db, userId);
    const view = views.find((v) => v.id === ins.id)!;
    return { data: view, status: 201 };
  },

  reset() {
    _db = createDB();
    _token = null;
  },
};
