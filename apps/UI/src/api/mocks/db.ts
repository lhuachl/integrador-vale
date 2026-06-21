import type { Usuario, InscripcionView, CalificacionView, CalificacionEvalView, Programa, Curso, Periodo, Grupo, Inscripcion, BloqueHorario, Evaluacion, Calificacion, Asistencia } from '../types';

interface Seed {
  id: string;
  password: string;
}

export interface MockDB {
  usuarios: Usuario[];
  sesiones: Map<string, string>;
  credenciales: Map<string, string>;
  programas: Programa[];
  cursos: Curso[];
  periodos: Periodo[];
  grupos: Grupo[];
  inscripciones: Inscripcion[];
  evaluaciones: Evaluacion[];
  calificaciones: Calificacion[];
  asistencias: Asistencia[];
}

export function createDB(): MockDB {
  const credenciales = new Map<string, string>();
  const seedCreds: Seed[] = [
    { id: 'u-est-1', password: 'estudiante123' },
    { id: 'u-doc-1', password: 'docente123' },
    { id: 'u-adm-1', password: 'admin123' },
    { id: 'u-coo-1', password: 'coord123' },
  ];
  for (const s of seedCreds) credenciales.set(s.id, s.password);

  const usuarios: Usuario[] = [
    { id: 'u-est-1', nombre: 'Ana Estudiante', email: 'ana@uni.edu', rol: 'estudiante', programaIds: ['prog-ing', 'prog-arq'], activo: true },
    { id: 'u-doc-1', nombre: 'Dario Docente', email: 'dario@uni.edu', rol: 'docente', programaIds: ['prog-ing', 'prog-arq', 'prog-old'], activo: true },
    { id: 'u-adm-1', nombre: 'Lucia Administrativa', email: 'lucia@uni.edu', rol: 'administrativo', programaIds: [], activo: true },
    { id: 'u-coo-1', nombre: 'Carlos Coordinador', email: 'carlos@uni.edu', rol: 'coordinador', programaIds: ['prog-ing', 'prog-arq'], activo: true },
    { id: 'u-est-2', nombre: 'Pedro Pérez', email: 'pedro@uni.edu', rol: 'estudiante', programaIds: ['prog-ing'], activo: true },
    { id: 'u-est-3', nombre: 'María García', email: 'maria@uni.edu', rol: 'estudiante', programaIds: ['prog-arq'], activo: true },
    { id: 'u-doc-2', nombre: 'Sofía Torres', email: 'sofia@uni.edu', rol: 'docente', programaIds: ['prog-ing'], activo: true },
  ];

  const programas: Programa[] = [
    { id: 'prog-ing', nombre: 'Ingeniería Informática', codigo: 'ING-INF' },
    { id: 'prog-arq', nombre: 'Arquitectura', codigo: 'ARQ' },
  ];

  const cursos: Curso[] = [
    { id: 'cur-101', codigo: 'MAT-101', nombre: 'Álgebra Lineal', creditos: 3, programaId: 'prog-ing', prerrequisitos: [] },
    { id: 'cur-102', codigo: 'MAT-102', nombre: 'Cálculo I', creditos: 4, programaId: 'prog-ing', prerrequisitos: [] },
    { id: 'cur-103', codigo: 'INF-101', nombre: 'Programación I', creditos: 4, programaId: 'prog-ing', prerrequisitos: [] },
    { id: 'cur-104', codigo: 'FIS-101', nombre: 'Física I', creditos: 4, programaId: 'prog-ing', prerrequisitos: ['cur-102'] },
    { id: 'cur-105', codigo: 'MAT-201', nombre: 'Ecuaciones Diferenciales', creditos: 3, programaId: 'prog-ing', prerrequisitos: ['cur-102'] },
    { id: 'cur-106', codigo: 'INF-102', nombre: 'Estructuras de Datos', creditos: 4, programaId: 'prog-ing', prerrequisitos: ['cur-103'] },
    { id: 'cur-107', codigo: 'ING-101', nombre: 'Inglés Técnico', creditos: 2, programaId: 'prog-ing', prerrequisitos: [] },
    { id: 'cur-201', codigo: 'ARQ-101', nombre: 'Dibujo Técnico', creditos: 3, programaId: 'prog-arq', prerrequisitos: [] },
    { id: 'cur-202', codigo: 'ARQ-102', nombre: 'Taller de Diseño', creditos: 4, programaId: 'prog-arq', prerrequisitos: ['cur-201'] },
    { id: 'cur-203', codigo: 'ARQ-103', nombre: 'Materiales de Construcción', creditos: 3, programaId: 'prog-arq', prerrequisitos: [] },
  ];

  const periodos: Periodo[] = [
    { id: 'per-2024-2', nombre: '2024-2', tipo: 'semestral', fechaInicio: '2024-08-15', fechaFinInscripcion: '2024-08-30', fechaFinClases: '2024-12-20', estado: 'cerrado' },
    { id: 'per-2025-1', nombre: '2025-1', tipo: 'semestral', fechaInicio: '2025-02-10', fechaFinInscripcion: '2025-03-15', fechaFinClases: '2025-07-04', estado: 'activo' },
  ];

  const dia = (d: number) => d as BloqueHorario['dia'];

  const grupos: Grupo[] = [
    { id: 'g-101', cursoId: 'cur-101', periodoId: 'per-2025-1', docenteId: 'u-doc-1', horario: [{ dia: dia(1), inicio: '08:00', fin: '10:00' }], cupo: 30, cupoDisponible: 25, aula: 'A-101', actaCerrada: false },
    { id: 'g-102', cursoId: 'cur-101', periodoId: 'per-2025-1', docenteId: 'u-doc-2', horario: [{ dia: dia(2), inicio: '10:00', fin: '12:00' }], cupo: 30, cupoDisponible: 30, aula: 'A-102', actaCerrada: false },
    { id: 'g-103', cursoId: 'cur-103', periodoId: 'per-2025-1', docenteId: 'u-doc-1', horario: [{ dia: dia(1), inicio: '10:00', fin: '12:00' }], cupo: 25, cupoDisponible: 20, aula: 'LAB-01', actaCerrada: false },
    { id: 'g-104', cursoId: 'cur-103', periodoId: 'per-2025-1', docenteId: 'u-doc-2', horario: [{ dia: dia(3), inicio: '08:00', fin: '10:00' }], cupo: 25, cupoDisponible: 25, aula: 'LAB-02', actaCerrada: false },
    { id: 'g-105', cursoId: 'cur-104', periodoId: 'per-2025-1', docenteId: 'u-doc-1', horario: [{ dia: dia(3), inicio: '14:00', fin: '16:00' }], cupo: 30, cupoDisponible: 5, aula: 'F-101', actaCerrada: false },
    { id: 'g-106', cursoId: 'cur-107', periodoId: 'per-2025-1', docenteId: 'u-doc-2', horario: [{ dia: dia(4), inicio: '08:00', fin: '10:00' }], cupo: 35, cupoDisponible: 28, aula: 'A-201', actaCerrada: false },
    { id: 'g-107', cursoId: 'cur-202', periodoId: 'per-2025-1', docenteId: 'u-doc-1', horario: [{ dia: dia(5), inicio: '14:00', fin: '18:00' }], cupo: 20, cupoDisponible: 18, aula: 'TALLER-01', actaCerrada: false },
    { id: 'g-108', cursoId: 'cur-203', periodoId: 'per-2025-1', docenteId: 'u-doc-2', horario: [{ dia: dia(2), inicio: '08:00', fin: '10:00' }], cupo: 30, cupoDisponible: 30, aula: 'A-301', actaCerrada: false },
    { id: 'g-201', cursoId: 'cur-102', periodoId: 'per-2024-2', docenteId: 'u-doc-1', horario: [{ dia: dia(1), inicio: '08:00', fin: '10:00' }], cupo: 30, cupoDisponible: 0, aula: 'A-101', actaCerrada: true },
    { id: 'g-202', cursoId: 'cur-101', periodoId: 'per-2024-2', docenteId: 'u-doc-2', horario: [{ dia: dia(2), inicio: '10:00', fin: '12:00' }], cupo: 30, cupoDisponible: 0, aula: 'A-102', actaCerrada: true },
    { id: 'g-203', cursoId: 'cur-103', periodoId: 'per-2024-2', docenteId: 'u-doc-1', horario: [{ dia: dia(3), inicio: '08:00', fin: '10:00' }], cupo: 25, cupoDisponible: 0, aula: 'LAB-01', actaCerrada: true },
    { id: 'g-204', cursoId: 'cur-104', periodoId: 'per-2024-2', docenteId: 'u-doc-2', horario: [{ dia: dia(4), inicio: '14:00', fin: '16:00' }], cupo: 30, cupoDisponible: 0, aula: 'F-101', actaCerrada: true },
  ];

  const inscripciones: Inscripcion[] = [
    { id: 'ins-01', estudianteId: 'u-est-1', grupoId: 'g-101', periodoId: 'per-2025-1', estado: 'activa', intentos: 1, createdAt: '2025-02-12T10:00:00Z' },
    { id: 'ins-02', estudianteId: 'u-est-1', grupoId: 'g-103', periodoId: 'per-2025-1', estado: 'activa', intentos: 1, createdAt: '2025-02-12T10:05:00Z' },
    { id: 'ins-03', estudianteId: 'u-est-1', grupoId: 'g-106', periodoId: 'per-2025-1', estado: 'activa', intentos: 1, createdAt: '2025-02-12T10:10:00Z' },
    { id: 'ins-04', estudianteId: 'u-est-1', grupoId: 'g-105', periodoId: 'per-2025-1', estado: 'solicitada', intentos: 1, createdAt: '2025-02-14T09:00:00Z' },
    { id: 'ins-05', estudianteId: 'u-est-1', grupoId: 'g-107', periodoId: 'per-2025-1', estado: 'solicitada', intentos: 1, createdAt: '2025-02-14T09:30:00Z' },
    { id: 'ins-06', estudianteId: 'u-est-1', grupoId: 'g-108', periodoId: 'per-2025-1', estado: 'rechazada', intentos: 1, motivoRechazo: 'Prerrequisito no cursado: Dibujo Técnico', createdAt: '2025-02-13T14:00:00Z' },
    { id: 'ins-07', estudianteId: 'u-est-1', grupoId: 'g-201', periodoId: 'per-2024-2', estado: 'aprobada_final', intentos: 1, createdAt: '2024-08-20T08:00:00Z' },
    { id: 'ins-08', estudianteId: 'u-est-1', grupoId: 'g-204', periodoId: 'per-2024-2', estado: 'reprobada_final', intentos: 1, createdAt: '2024-08-20T08:05:00Z' },
    { id: 'ins-09', estudianteId: 'u-est-1', grupoId: 'g-202', periodoId: 'per-2024-2', estado: 'retirada', intentos: 1, createdAt: '2024-08-20T08:10:00Z' },
    /* otras inscripciones para otros estudiantes */
    { id: 'ins-10', estudianteId: 'u-est-2', grupoId: 'g-101', periodoId: 'per-2025-1', estado: 'activa', intentos: 1, createdAt: '2025-02-12T11:00:00Z' },
    { id: 'ins-11', estudianteId: 'u-est-2', grupoId: 'g-104', periodoId: 'per-2025-1', estado: 'activa', intentos: 1, createdAt: '2025-02-12T11:05:00Z' },
    { id: 'ins-12', estudianteId: 'u-est-3', grupoId: 'g-108', periodoId: 'per-2025-1', estado: 'activa', intentos: 1, createdAt: '2025-02-12T12:00:00Z' },
  ];

  const evaluaciones: Evaluacion[] = [
    { id: 'eval-01', grupoId: 'g-201', nombre: 'Parcial 1', peso: 30, fecha: '2024-09-20' },
    { id: 'eval-02', grupoId: 'g-201', nombre: 'Parcial 2', peso: 30, fecha: '2024-11-05' },
    { id: 'eval-03', grupoId: 'g-201', nombre: 'Examen Final', peso: 40, fecha: '2024-12-10' },
    { id: 'eval-04', grupoId: 'g-204', nombre: 'Parcial 1', peso: 30, fecha: '2024-09-22' },
    { id: 'eval-05', grupoId: 'g-204', nombre: 'Parcial 2', peso: 30, fecha: '2024-11-08' },
    { id: 'eval-06', grupoId: 'g-204', nombre: 'Examen Final', peso: 40, fecha: '2024-12-12' },
    { id: 'eval-07', grupoId: 'g-101', nombre: 'Parcial 1', peso: 35, fecha: '2025-03-28' },
    { id: 'eval-08', grupoId: 'g-101', nombre: 'Parcial 2', peso: 35, fecha: '2025-05-16' },
    { id: 'eval-09', grupoId: 'g-101', nombre: 'Trabajo Práctico', peso: 30, fecha: '2025-06-06' },
    { id: 'eval-10', grupoId: 'g-103', nombre: 'Parcial 1', peso: 40, fecha: '2025-03-25' },
    { id: 'eval-11', grupoId: 'g-103', nombre: 'Parcial 2', peso: 40, fecha: '2025-05-13' },
    { id: 'eval-12', grupoId: 'g-103', nombre: 'Laboratorio', peso: 20, fecha: '2025-06-10' },
    { id: 'eval-13', grupoId: 'g-106', nombre: 'Parcial Único', peso: 60, fecha: '2025-04-15' },
    { id: 'eval-14', grupoId: 'g-106', nombre: 'Exposición Oral', peso: 40, fecha: '2025-06-03' },
    { id: 'eval-15', grupoId: 'g-202', nombre: 'Parcial 1', peso: 30, fecha: '2024-09-18' },
    { id: 'eval-16', grupoId: 'g-202', nombre: 'Parcial 2', peso: 30, fecha: '2024-11-03' },
    { id: 'eval-17', grupoId: 'g-202', nombre: 'Examen Final', peso: 40, fecha: '2024-12-08' },
  ];

  const calificaciones: Calificacion[] = [
    /* ins-07 — g-201 Cálculo I, aprobada_final */
    { id: 'cal-01', inscripcionId: 'ins-07', evaluacionId: 'eval-01', nota: 15, createdAt: '2024-09-21T00:00:00Z' },
    { id: 'cal-02', inscripcionId: 'ins-07', evaluacionId: 'eval-02', nota: 13, createdAt: '2024-11-06T00:00:00Z' },
    { id: 'cal-03', inscripcionId: 'ins-07', evaluacionId: 'eval-03', nota: 16, createdAt: '2024-12-11T00:00:00Z' },
    /* ins-08 — g-204 Física I 2024-2, reprobada_final */
    { id: 'cal-04', inscripcionId: 'ins-08', evaluacionId: 'eval-04', nota: 8, createdAt: '2024-09-23T00:00:00Z' },
    { id: 'cal-05', inscripcionId: 'ins-08', evaluacionId: 'eval-05', nota: 6, createdAt: '2024-11-09T00:00:00Z' },
    { id: 'cal-06', inscripcionId: 'ins-08', evaluacionId: 'eval-06', nota: 5, createdAt: '2024-12-13T00:00:00Z' },
    /* ins-01 — g-101 Álgebra Lineal 2025-1, activa (parciales cursando) */
    { id: 'cal-07', inscripcionId: 'ins-01', evaluacionId: 'eval-07', nota: 17, createdAt: '2025-03-29T00:00:00Z' },
    { id: 'cal-08', inscripcionId: 'ins-01', evaluacionId: 'eval-08', nota: 14, createdAt: '2025-05-17T00:00:00Z' },
    /* ins-02 — g-103 Programación I 2025-1, activa */
    { id: 'cal-09', inscripcionId: 'ins-02', evaluacionId: 'eval-10', nota: 18, createdAt: '2025-03-26T00:00:00Z' },
    { id: 'cal-10', inscripcionId: 'ins-02', evaluacionId: 'eval-11', nota: 16, createdAt: '2025-05-14T00:00:00Z' },
    /* ins-03 — g-106 Inglés Técnico 2025-1, activa */
    { id: 'cal-11', inscripcionId: 'ins-03', evaluacionId: 'eval-13', nota: 19, createdAt: '2025-04-16T00:00:00Z' },
    /* ins-09 — g-202 Álgebra Lineal 2024-2, retirada (1 parcial) */
    { id: 'cal-12', inscripcionId: 'ins-09', evaluacionId: 'eval-15', nota: 10, createdAt: '2024-09-19T00:00:00Z' },
  ];

  return {
    usuarios, sesiones: new Map<string, string>(), credenciales,
    programas, cursos, periodos, grupos, inscripciones,
    evaluaciones, calificaciones,
    asistencias: [],
  };
}

export function findUserByEmail(db: MockDB, email: string): Usuario | undefined {
  return db.usuarios.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function verifyCredentials(db: MockDB, email: string, password: string): Usuario | null {
  const user = findUserByEmail(db, email);
  if (!user) return null;
  const stored = db.credenciales.get(user.id);
  if (stored !== password) return null;
  return user;
}

export function createSession(db: MockDB, userId: string): string {
  const token = `mock-${crypto.randomUUID()}`;
  db.sesiones.set(token, userId);
  return token;
}

export function destroySession(db: MockDB, token: string): void {
  db.sesiones.delete(token);
}

function getDocenteNombre(db: MockDB, docenteId: string): string {
  return db.usuarios.find((u) => u.id === docenteId)?.nombre ?? '-';
}

export function buildCalificacionViews(db: MockDB, estudianteId: string): CalificacionView[] {
  const misInscripciones = db.inscripciones.filter(
    (i) => i.estudianteId === estudianteId && i.estado !== 'solicitada' && i.estado !== 'rechazada' && i.estado !== 'cancelada',
  );

  return misInscripciones.map((ins) => {
    const grupo = db.grupos.find((g) => g.id === ins.grupoId);
    const curso = grupo ? db.cursos.find((c) => c.id === grupo.cursoId) : undefined;
    const grupoEvals = db.evaluaciones.filter((e) => e.grupoId === grupo?.id);
    const notas = db.calificaciones.filter((c) => c.inscripcionId === ins.id);

    const evaluaciones: CalificacionEvalView[] = grupoEvals.map((ev) => {
      const cal = notas.find((c) => c.evaluacionId === ev.id);
      return {
        evaluacionId: ev.id,
        nombre: ev.nombre,
        peso: ev.peso,
        nota: cal?.nota ?? -1,
      };
    });

    // ponytail: weighted average, missing evals excluded from denominator
    const conNota = evaluaciones.filter((e) => e.nota >= 0);
    const sumaPesos = conNota.reduce((s, e) => s + e.peso, 0);
    const notaFinal = sumaPesos > 0
      ? Math.round((conNota.reduce((s, e) => s + e.nota * e.peso, 0) / sumaPesos) * 100) / 100
      : -1;

    return {
      inscripcionId: ins.id,
      cursoNombre: curso?.nombre ?? '-',
      cursoCodigo: curso?.codigo ?? '-',
      creditos: curso?.creditos ?? 0,
      grupoCodigo: grupo ? `Grupo ${grupo.id.slice(-3).toUpperCase()}` : '-',
      docenteNombre: grupo ? getDocenteNombre(db, grupo.docenteId) : '-',
      evaluaciones,
      notaFinal,
      estado: ins.estado,
    };
  });
}

export function buildInscripcionViews(db: MockDB, estudianteId: string): InscripcionView[] {
  const misInscripciones = db.inscripciones.filter((i) => i.estudianteId === estudianteId);

  return misInscripciones.map((ins) => {
    const grupo = db.grupos.find((g) => g.id === ins.grupoId);
    const curso = grupo ? db.cursos.find((c) => c.id === grupo.cursoId) : undefined;
    const periodo = db.periodos.find((p) => p.id === ins.periodoId);

    return {
      id: ins.id,
      cursoId: curso?.id ?? '',
      cursoNombre: curso?.nombre ?? '-',
      cursoCodigo: curso?.codigo ?? '-',
      creditos: curso?.creditos ?? 0,
      programaNombre: curso ? (db.programas.find((p) => p.id === curso.programaId)?.nombre ?? '-') : '-',
      grupoId: grupo?.id ?? '',
      grupoCodigo: grupo ? `Grupo ${grupo.id.slice(-3).toUpperCase()}` : '-',
      horario: grupo?.horario ?? [],
      aula: grupo?.aula ?? '-',
      docenteNombre: grupo ? getDocenteNombre(db, grupo.docenteId) : '-',
      estado: ins.estado,
      intentos: ins.intentos,
      motivoRechazo: ins.motivoRechazo,
      periodoNombre: periodo?.nombre ?? '-',
      createdAt: ins.createdAt,
    };
  }).sort((a, b) => {
    // activas y solicitadas primero, luego por fecha descendente
    const peso = (e: string) => e === 'activa' || e === 'solicitada' ? 0 : 1;
    const pa = peso(a.estado), pb = peso(b.estado);
    if (pa !== pb) return pa - pb;
    return b.createdAt.localeCompare(a.createdAt);
  });
}
