const SESSION_COOKIE = 'Session';

export function parseSessionFromCookie(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  if (!match) return null;
  const value = match.slice(SESSION_COOKIE.length + 1);
  return value || null;
}

export function buildSessionCookie(token: string, maxAgeSeconds = 28800): string {
  return `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
}

export function buildClearSessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

export function getSessionTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  return parseSessionFromCookie(cookieHeader);
}

export function getCurrentUserIdFromRequest(request: Request, db: { sesiones: Map<string, string> }): string | null {
  const token = getSessionTokenFromRequest(request);
  if (!token) return null;
  return db.sesiones.get(token) ?? null;
}