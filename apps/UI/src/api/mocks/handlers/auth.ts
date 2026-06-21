import { http, HttpResponse } from 'msw';
import { createDB, verifyCredentials, createSession, destroySession, type MockDB } from '../db';
import { buildClearSessionCookie, buildSessionCookie, getCurrentUserIdFromRequest } from '../lib/session';
import type { ApiError, ApiResponse, LoginInput, Usuario } from '../../types';
import { LoginInputSchema } from '../../schemas';

const db: MockDB = createDB();

function err(code: string, message: string, status = 422, details?: Record<string, unknown>) {
  const body: { error: ApiError } = { error: { code, message, details } };
  return HttpResponse.json(body, { status });
}

export const authHandlers = [
  http.post('/auth/login', async ({ request }) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return err('validation_error', 'Body inválido', 400);
    }

    const parsed = LoginInputSchema.safeParse(body);
    if (!parsed.success) {
      return err('validation_error', 'Datos inválidos', 422, {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const input = parsed.data as LoginInput;
    const user = verifyCredentials(db, input.email, input.password);
    if (!user) {
      return err('invalid_credentials', 'Email o contraseña incorrectos', 401);
    }

    const token = createSession(db, user.id);
    const responseBody: ApiResponse<Usuario> = { data: user };
    return HttpResponse.json(responseBody, {
      status: 200,
      headers: { 'Set-Cookie': buildSessionCookie(token) },
    });
  }),

  http.post('/auth/logout', ({ request }) => {
    const cookieHeader = request.headers.get('cookie') ?? '';
    const match = cookieHeader.split(';').map((c) => c.trim()).find((c) => c.startsWith('Session='));
    if (match) {
      const token = match.slice('Session='.length);
      destroySession(db, token);
    }
    return new HttpResponse(null, {
      status: 204,
      headers: { 'Set-Cookie': buildClearSessionCookie() },
    });
  }),

  http.get('/auth/me', ({ request }) => {
    const userId = getCurrentUserIdFromRequest(request, db);
    if (!userId) {
      return err('session_expired', 'Sesión expirada o ausente', 401);
    }
    const user = db.usuarios.find((u) => u.id === userId);
    if (!user || !user.activo) {
      return err('session_expired', 'Usuario no disponible', 401);
    }
    const responseBody: ApiResponse<Usuario> = { data: user };
    return HttpResponse.json(responseBody, { status: 200 });
  }),
];