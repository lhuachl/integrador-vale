import { describe, it, expect, beforeEach } from 'vitest';
import { mockApi } from '../mockClient';

describe('mockApi integration', () => {
  beforeEach(() => {
    mockApi.reset();
  });

  describe('auth', () => {
    it('login with valid credentials returns user', async () => {
      const res = await mockApi.login('ana@uni.edu', 'estudiante123');
      expect(res.data.user).toBeDefined();
      expect(res.data.user.email).toBe('ana@uni.edu');
      expect(res.data.user.rol).toBe('estudiante');
      expect(res.status).toBe(200);
    });

    it('login with wrong password throws', async () => {
      await expect(mockApi.login('ana@uni.edu', 'wrong')).rejects.toThrow();
    });

    it('me() returns logged-in user', async () => {
      await mockApi.login('ana@uni.edu', 'estudiante123');
      const res = await mockApi.me();
      expect(res.data.user.id).toBe('u-est-1');
    });

    it('me() throws when not logged in', async () => {
      await expect(mockApi.me()).rejects.toThrow();
    });

    it('logout clears session', async () => {
      await mockApi.login('ana@uni.edu', 'estudiante123');
      await mockApi.logout();
      await expect(mockApi.me()).rejects.toThrow();
    });
  });

  describe('inscripciones', () => {
    it('returns inscripciones for logged-in estudiante', async () => {
      await mockApi.login('ana@uni.edu', 'estudiante123');
      const res = await mockApi.misInscripciones();
      expect(res.data.length).toBeGreaterThan(0);
      expect(res.data[0].cursoNombre).toBeTruthy();
    });

    it('throws when not logged in', async () => {
      await expect(mockApi.misInscripciones()).rejects.toThrow();
    });
  });

  describe('calificaciones', () => {
    it('returns calificaciones with correct weighted averages for logged-in estudiante', async () => {
      await mockApi.login('ana@uni.edu', 'estudiante123');
      const res = await mockApi.misCalificaciones();
      expect(res.data.length).toBeGreaterThan(0);
      // ins-07: weighted avg should be exactly 14.80
      const calc = res.data.find((c) => c.inscripcionId === 'ins-07');
      expect(calc).toBeDefined();
      expect(calc!.notaFinal).toBe(14.80);
    });

    it('throws when not logged in', async () => {
      await expect(mockApi.misCalificaciones()).rejects.toThrow();
    });
  });

  describe('progreso', () => {
    it('returns progreso for logged-in estudiante', async () => {
      await mockApi.login('ana@uni.edu', 'estudiante123');
      const res = await mockApi.misProgreso();
      expect(res.data).toHaveLength(2);
      const ing = res.data.find((p) => p.programaCodigo === 'ING-INF');
      expect(ing).toBeDefined();
      expect(ing!.totalCreditos).toBe(24);
      expect(ing!.aprobados).toBe(4);
      expect(ing!.enCurso).toBe(9);
      expect(ing!.porcentaje).toBe(17);
    });

    it('throws when not logged in', async () => {
      await expect(mockApi.misProgreso()).rejects.toThrow();
    });
  });
});
