import { describe, it, expect, beforeEach } from 'vitest';
import { mockApi } from '../mockClient';

async function login(email: string, pwd: string) {
  await mockApi.login(email, pwd);
}

describe('admin endpoints', () => {
  beforeEach(async () => {
    mockApi.reset();
    await login('lucia@uni.edu', 'admin123');
  });

  it('adminDashboard returns stats', async () => {
    const res = await mockApi.adminDashboard();
    expect(res.data.totalUsuarios).toBeGreaterThan(0);
    expect(res.data.totalGruposActivos).toBeGreaterThan(0);
    expect(res.data.totalInscripciones).toBeGreaterThan(0);
    expect(res.data.periodoActivo).toBeTruthy();
    expect(res.data.totalEstudiantes).toBeGreaterThan(0);
    expect(res.data.totalDocentes).toBeGreaterThan(0);
    expect(res.data.totalCoordinadores).toBeGreaterThan(0);
    expect(res.data.totalAdministrativos).toBeGreaterThan(0);
  });

  it('creates, lists, updates, and deletes a usuario', async () => {
    const created = await mockApi.crearUsuario({
      email: 'nuevo@uni.edu', nombre: 'Nuevo', password: 'test123', rol: 'docente', programaIds: [],
    });
    expect(created.data.email).toBe('nuevo@uni.edu');
    expect(created.data.rol).toBe('docente');

    const list = await mockApi.listarUsuarios();
    expect(list.data.find((u) => u.id === created.data.id)).toBeTruthy();

    const updated = await mockApi.actualizarUsuario(created.data.id, { nombre: 'Actualizado' });
    expect(updated.data.nombre).toBe('Actualizado');

    await mockApi.eliminarUsuario(created.data.id);
    const list2 = await mockApi.listarUsuarios();
    expect(list2.data.find((u) => u.id === created.data.id)).toBeUndefined();
  });

  it('creates, lists, updates, and deletes a periodo', async () => {
    const created = await mockApi.crearPeriodo({
      nombre: 'Test 2025', tipo: 'cuatrimestral',
      fechaInicio: '2025-01-01', fechaFinInscripcion: '2025-02-01', fechaFinClases: '2025-06-01',
    });
    expect(created.data.nombre).toBe('Test 2025');

    const list = await mockApi.listarPeriodos();
    expect(list.data.find((p) => p.id === created.data.id)).toBeTruthy();

    const updated = await mockApi.actualizarPeriodo(created.data.id, { nombre: 'Test Modificado' });
    expect(updated.data.nombre).toBe('Test Modificado');

    await mockApi.eliminarPeriodo(created.data.id);
    const list2 = await mockApi.listarPeriodos();
    expect(list2.data.find((p) => p.id === created.data.id)).toBeUndefined();
  });

  it('listarUsuarios filters by rol', async () => {
    const docentes = await mockApi.listarUsuarios({ rol: 'docente' });
    expect(docentes.data.every((u) => u.rol === 'docente')).toBe(true);
  });
});

describe('docente endpoints', () => {
  beforeEach(async () => {
    mockApi.reset();
    await login('dario@uni.edu', 'docente123');
  });

  it('misGrupos returns assigned grupos', async () => {
    const res = await mockApi.misGrupos();
    expect(res.data.length).toBeGreaterThan(0);
    for (const g of res.data) {
      expect(g.cursoNombre).toBeTruthy();
      expect(g.horario).toBeInstanceOf(Array);
    }
  });

  it('calificarGrupo returns view with estudiantes and evaluaciones', async () => {
    const res = await mockApi.calificarGrupo('g-201');
    expect(res.data.cursoNombre).toBeTruthy();
    expect(res.data.estudiantes.length).toBeGreaterThan(0);
    expect(res.data.evaluaciones.length).toBeGreaterThan(0);
    for (const e of res.data.estudiantes) {
      expect(e.estudianteNombre).toBeTruthy();
      expect(typeof e.nota === 'number' || e.nota === null).toBe(true);
    }
  });

  it('crearEvaluacion adds evaluation to grupo', async () => {
    await mockApi.crearEvaluacion('g-201', { nombre: 'Nueva Eval', peso: 10, fecha: '2024-05-01', cursoId: 'cur-102', grupoId: 'g-201' });
    const view = await mockApi.calificarGrupo('g-201');
    const added = view.data.evaluaciones.find((e) => e.nombre === 'Nueva Eval');
    expect(added).toBeDefined();
    expect(added!.peso).toBe(10);
  });

  it('saveCalificaciones updates notas', async () => {
    await mockApi.saveCalificaciones('g-201', {
      evaluacionId: 'eval-01',
      notas: [{ inscripcionId: 'ins-07', nota: 18 }],
    });
    const view = await mockApi.calificarGrupo('g-201');
    const nota = view.data.estudiantes.find((e) => e.inscripcionId === 'ins-07')?.nota;
    expect(nota).toBe(15.70);
  });

  it('saveAsistencia and asistenciaGrupo persist attendance', async () => {
    await mockApi.saveAsistencia('g-201', {
      fecha: '2024-03-15',
      registros: [{ inscripcionId: 'ins-07', estado: 'presente' }],
    });
    const res = await mockApi.asistenciaGrupo('g-201', '2024-03-15');
    const a = res.data.registros.find((r) => r.inscripcionId === 'ins-07');
    expect(a).toBeDefined();
    expect(a!.estado).toBe('presente');
  });

  it('saveAsistencia upserts by (inscripcionId, fecha)', async () => {
    await mockApi.saveAsistencia('g-201', {
      fecha: '2024-03-16',
      registros: [{ inscripcionId: 'ins-07', estado: 'ausente' }],
    });
    let res = await mockApi.asistenciaGrupo('g-201', '2024-03-16');
    expect(res.data.registros.find((r) => r.inscripcionId === 'ins-07')?.estado).toBe('ausente');

    await mockApi.saveAsistencia('g-201', {
      fecha: '2024-03-16',
      registros: [{ inscripcionId: 'ins-07', estado: 'presente' }],
    });
    res = await mockApi.asistenciaGrupo('g-201', '2024-03-16');
    expect(res.data.registros.find((r) => r.inscripcionId === 'ins-07')?.estado).toBe('presente');
  });

  it('cerrarActa marks grupo', async () => {
    await mockApi.cerrarActa('g-201');
    const view = await mockApi.calificarGrupo('g-201');
    expect(view.data.actaCerrada).toBe(true);
  });
});

describe('coordinador endpoints', () => {
  beforeEach(async () => {
    mockApi.reset();
    await login('carlos@uni.edu', 'coord123');
  });

  it('coordinadorGrupos returns grupos', async () => {
    const res = await mockApi.coordinadorGrupos();
    expect(res.data.length).toBeGreaterThan(0);
    for (const g of res.data) {
      expect(g.cursoNombre).toBeTruthy();
      expect(g.cupo).toBeGreaterThan(0);
    }
  });

  it('coordinadorCursosDisponibles returns cursos', async () => {
    const res = await mockApi.coordinadorCursosDisponibles();
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data[0].codigo).toBeTruthy();
  });

  it('coordinadorDocentesDisponibles returns docentes', async () => {
    const res = await mockApi.coordinadorDocentesDisponibles();
    expect(res.data.length).toBeGreaterThan(0);
    for (const d of res.data) {
      expect(d.nombre).toBeTruthy();
    }
  });

  it('coordinadorCrearGrupo creates a grupo', async () => {
    const res = await mockApi.coordinadorCrearGrupo({
      cursoId: 'cur-101', cupo: 25, horario: [{ dia: 1, inicio: '08:00', fin: '10:00' }], aula: 'A-999', docenteId: 'u-doc-1',
    });
    expect(res.data.cursoNombre).toBeTruthy();
    expect(res.data.cupo).toBe(25);
    expect(res.data.cupoDisponible).toBe(25);
  });

  it('actualizarGrupo updates aula/cupo/docenteId', async () => {
    const updated = await mockApi.actualizarGrupo('g-101', { aula: 'B-202', cupo: 20, docenteId: 'u-doc-2' });
    expect(updated.data.aula).toBe('B-202');
    expect(updated.data.cupo).toBe(20);
  });

  it('toggleActa switches actaCerrada', async () => {
    let res = await mockApi.toggleActa('g-101');
    expect(res.data.actaCerrada).toBe(true);
    res = await mockApi.toggleActa('g-101');
    expect(res.data.actaCerrada).toBe(false);
  });

  it('detalleGrupo returns full detail', async () => {
    const res = await mockApi.detalleGrupo('g-101');
    expect(res.data.cursoNombre).toBeTruthy();
    expect(res.data.docenteNombre).toBeTruthy();
    expect(res.data.estudiantes).toBeInstanceOf(Array);
    expect(res.data.estudiantes.length).toBeGreaterThan(0);
  });

  it('estudiantesDisponibles returns unenrolled students', async () => {
    const res = await mockApi.estudiantesDisponibles('g-101');
    for (const e of res.data) {
      expect(e.nombre).toBeTruthy();
    }
  });

  it('agregarEstudiante adds student to grupo', async () => {
    const disponibles = await mockApi.estudiantesDisponibles('g-101');
    expect(disponibles.data.length).toBeGreaterThan(0);
    const nuevoId = disponibles.data[0].id;
    await mockApi.agregarEstudiante('g-101', nuevoId);
    const detalle = await mockApi.detalleGrupo('g-101');
    expect(detalle.data.estudiantes.find((e) => e.id === nuevoId)).toBeTruthy();
  });

  it('quitarEstudiante removes student from grupo', async () => {
    const detalle = await mockApi.detalleGrupo('g-101');
    const first = detalle.data.estudiantes[0];
    await mockApi.quitarEstudiante('g-101', first.inscripcionId);
    const detalle2 = await mockApi.detalleGrupo('g-101');
    expect(detalle2.data.estudiantes.find((e) => e.id === first.id)).toBeUndefined();
  });

  it('coordinadorReportesKPI returns KPI stats', async () => {
    const res = await mockApi.coordinadorReportesKPI();
    expect(res.data.totalEstudiantes).toBeGreaterThan(0);
    expect(typeof res.data.promedioGeneral).toBe('number');
    expect(typeof res.data.tasaAprobacionGeneral).toBe('number');
    expect(typeof res.data.totalGrupos).toBe('number');
  });

  it('coordinadorReportes returns report data', async () => {
    const res = await mockApi.coordinadorReportes();
    expect(res.data.rendimiento).toBeInstanceOf(Array);
    expect(res.data.distribucion).toBeInstanceOf(Array);
  });
});
