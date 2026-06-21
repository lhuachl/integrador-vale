import { describe, it, expect, beforeEach } from 'vitest';
import { mockApi } from '../mockClient';

type Rol = 'estudiante' | 'docente' | 'coordinador' | 'administrativo';

const LOGINS: Record<Rol, { email: string; password: string }> = {
  estudiante: { email: 'ana@uni.edu', password: 'estudiante123' },
  docente: { email: 'dario@uni.edu', password: 'docente123' },
  coordinador: { email: 'carlos@uni.edu', password: 'coord123' },
  administrativo: { email: 'lucia@uni.edu', password: 'admin123' },
};

async function loginAs(rol: Rol) {
  await mockApi.login(LOGINS[rol].email, LOGINS[rol].password);
}

async function expectRejects(promise: Promise<any>) {
  await expect(promise).rejects.toThrow();
}

describe('auth guards', () => {
  beforeEach(() => {
    mockApi.reset();
  });

  describe('assertRol("estudiante")', () => {
    const estudianteEndpoints = [
      () => mockApi.misInscripciones(),
      () => mockApi.misCalificaciones(),
      () => mockApi.gruposDisponibles(),
      () => mockApi.misProgreso(),
      () => mockApi.solicitarInscripcion('g-201'),
    ];

    it.each([['docente'], ['coordinador'], ['administrativo']] as [Rol][])(
      'blocks %s from estudiante endpoints', async (rol) => {
        await loginAs(rol);
        for (const ep of estudianteEndpoints) {
          await expectRejects(ep());
        }
      },
    );

    it('allows estudiante to access estudiante endpoints', async () => {
      await loginAs('estudiante');
      const res = await mockApi.misInscripciones();
      expect(res.data.length).toBeGreaterThan(0);
    });
  });

  describe('assertDocente()', () => {
    const docenteEndpoints = [
      () => mockApi.misGrupos(),
      () => mockApi.calificarGrupo('g-201'),
      () => mockApi.saveCalificaciones('g-201', { evaluacionId: 'eval-01', notas: [{ inscripcionId: 'ins-07', nota: 10 }] }),
      () => mockApi.asistenciaGrupo('g-201', '2024-03-01'),
      () => mockApi.saveAsistencia('g-201', { fecha: '2024-03-01', registros: [{ inscripcionId: 'ins-07', estado: 'presente' }] }),
      () => mockApi.crearEvaluacion('g-201', { nombre: 'Test', peso: 10, fecha: '2024-04-01', cursoId: 'cur-102', grupoId: 'g-201' }),
      () => mockApi.cerrarActa('g-201'),
    ];

    it.each([['estudiante'], ['coordinador'], ['administrativo']] as [Rol][])(
      'blocks %s from docente endpoints', async (rol) => {
        await loginAs(rol);
        for (const ep of docenteEndpoints) {
          await expectRejects(ep());
        }
      },
    );

    it('allows docente to access docente endpoints', async () => {
      await loginAs('docente');
      const res = await mockApi.misGrupos();
      expect(res.data.length).toBeGreaterThan(0);
    });
  });

  describe('assertCoordinadorOrAdmin()', () => {
    const coordinadorEndpoints = [
      () => mockApi.coordinadorGrupos(),
      () => mockApi.coordinadorCursosDisponibles(),
      () => mockApi.coordinadorDocentesDisponibles(),
      () => mockApi.coordinadorReportesKPI(),
      () => mockApi.coordinadorReportes(),
      () => mockApi.detalleGrupo('g-201'),
      () => mockApi.estudiantesDisponibles('g-201'),
      () => mockApi.agregarEstudiante('g-201', 'u-est-2'),
      () => mockApi.quitarEstudiante('g-201', 'ins-01'),
    ];

    it.each([['estudiante'], ['docente']] as [Rol][])(
      'blocks %s from coordinador/admin endpoints', async (rol) => {
        await loginAs(rol);
        for (const ep of coordinadorEndpoints) {
          await expectRejects(ep());
        }
      },
    );

    it.each([['coordinador'], ['administrativo']] as [Rol][])(
      'allows %s to access coordinador/admin endpoints', async (rol) => {
        await loginAs(rol);
        const res = await mockApi.coordinadorGrupos();
        expect(res.data.length).toBeGreaterThan(0);
      },
    );
  });

  describe('assertAdmin()', () => {
    const adminEndpoints = [
      () => mockApi.adminDashboard(),
      () => mockApi.listarPeriodos(),
      () => mockApi.listarUsuarios(),
      () => mockApi.crearPeriodo({ nombre: 'Test', tipo: 'cuatrimestral', fechaInicio: '2024-01-01', fechaFinInscripcion: '2024-02-01', fechaFinClases: '2024-06-01' }),
      () => mockApi.crearUsuario({ email: 'test@uni.edu', nombre: 'Test', password: 'test123', rol: 'estudiante', programaIds: [] }),
    ];

    it.each([['estudiante'], ['docente'], ['coordinador']] as [Rol][])(
      'blocks %s from admin-only endpoints', async (rol) => {
        await loginAs(rol);
        for (const ep of adminEndpoints) {
          await expectRejects(ep());
        }
      },
    );

    it('allows administrativo to access admin-only endpoints', async () => {
      await loginAs('administrativo');
      const res = await mockApi.adminDashboard();
      expect(res.data.totalUsuarios).toBeGreaterThan(0);
    });
  });
});
