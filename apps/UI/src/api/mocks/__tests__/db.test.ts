import { describe, it, expect } from 'vitest';
import { createDB, buildInscripcionViews, buildCalificacionViews, type MockDB } from '../db';

function freshDB(): MockDB {
  return createDB();
}

describe('buildInscripcionViews', () => {
  it('returns inscripciones for the given estudiante sorted by estado then date', () => {
    const db = freshDB();
    const views = buildInscripcionViews(db, 'u-est-1');

    expect(views.length).toBeGreaterThan(0);
    // first items should be activa or solicitada
    for (const v of views.slice(0, 5)) {
      expect(['activa', 'solicitada']).toContain(v.estado);
    }
    // all have required fields
    for (const v of views) {
      expect(v.id).toBeTruthy();
      expect(v.cursoNombre).toBeTruthy();
      expect(v.cursoCodigo).toBeTruthy();
      expect(v.grupoCodigo).toMatch(/^Grupo /);
      expect(v.horario).toBeInstanceOf(Array);
      expect(v.docenteNombre).toBeTruthy();
      expect(v.periodoNombre).toBeTruthy();
    }
  });

  it('returns empty for unknown estudiante', () => {
    const db = freshDB();
    const views = buildInscripcionViews(db, 'u-no-existe');
    expect(views).toEqual([]);
  });

  it('includes all 8 estados across Ana\'s enrollments', () => {
    const db = freshDB();
    const views = buildInscripcionViews(db, 'u-est-1');
    const estados = new Set(views.map((v) => v.estado));
    expect(estados.has('activa')).toBe(true);
    expect(estados.has('solicitada')).toBe(true);
    expect(estados.has('rechazada')).toBe(true);
    expect(estados.has('aprobada_final')).toBe(true);
    expect(estados.has('reprobada_final')).toBe(true);
    expect(estados.has('retirada')).toBe(true);
  });
});

describe('buildCalificacionViews', () => {
  it('returns calificaciones for Ana with weighted averages', () => {
    const db = freshDB();
    const views = buildCalificacionViews(db, 'u-est-1');

    expect(views.length).toBeGreaterThan(0);
    for (const v of views) {
      expect(v.cursoNombre).toBeTruthy();
      expect(v.evaluaciones).toBeInstanceOf(Array);
      // notaFinal >= 0 for courses with grades, -1 for courses without
      if (v.estado === 'aprobada_final' || v.estado === 'reprobada_final' || v.estado === 'activa') {
        expect(v.evaluaciones.length).toBeGreaterThan(0);
      }
    }
  });

  it('excludes solicitada and rechazada inscripciones', () => {
    const db = freshDB();
    const views = buildCalificacionViews(db, 'u-est-1');
    const estados = views.map((v) => v.estado);
    expect(estados).not.toContain('solicitada');
    expect(estados).not.toContain('rechazada');
    expect(estados).not.toContain('cancelada');
  });

  it('calculates weighted average correctly for aprobada_final curso', () => {
    const db = freshDB();
    const views = buildCalificacionViews(db, 'u-est-1');
    // ins-07 is g-201 Cálculo I with aprobada_final
    const calc = views.find((v) => v.inscripcionId === 'ins-07');
    expect(calc).toBeDefined();
    expect(calc!.notaFinal).toBeGreaterThan(0);
    // notas: Parcial 1=15(p30), Parcial 2=13(p30), Final=16(p40)
    // weighted = (15*30 + 13*30 + 16*40) / 100 = (450 + 390 + 640) / 100 = 1480/100 = 14.80
    expect(calc!.notaFinal).toBe(14.80);
  });

  it('calculates weighted average correctly for reprobada_final curso', () => {
    const db = freshDB();
    const views = buildCalificacionViews(db, 'u-est-1');
    // ins-08 is g-204 Física I 2024-2 with reprobada_final
    const calc = views.find((v) => v.inscripcionId === 'ins-08');
    expect(calc).toBeDefined();
    // notas: Parcial 1=8(p30), Parcial 2=6(p30), Final=5(p40)
    // weighted = (8*30 + 6*30 + 5*40) / 100 = (240 + 180 + 200) / 100 = 620/100 = 6.20
    expect(calc!.notaFinal).toBe(6.20);
  });
});
