# Auth InsForge — Avior SIU

> Cómo mapear el sistema de autenticación de InsForge al flujo que espera el frontend.

---

## 1. Flujo actual del frontend

El frontend (Vite + React) usa:

```
axios con withCredentials: true
Cookie httpOnly: Session=<token>
Endpoints: POST /auth/login, POST /auth/logout, GET /auth/me
```

InsForge Auth ya maneja sesiones con cookie httpOnly de forma nativa. El frontend no necesita cambiar su lógica.

---

## 2. Configuración de Auth en InsForge

### 2.1 `insforge.toml`

```toml
[auth]
allowed_redirect_urls = [
  "http://localhost:1420",
  "https://tu-app.vercel.app"
]
require_email_verification = false
disable_signup = true  # Solo admin crea usuarios

[auth.password]
min_length = 8
require_number = false
require_lowercase = true
require_uppercase = false
require_special_char = false

[deployments]
subdomain = "av-siu"
```

Aplicar:

```bash
npx @insforge/cli config apply --file insforge.toml
```

### 2.2 Cookies

InsForge Auth emite cookie `session` automáticamente en:

- `POST /auth/v1/token?grant_type=password` (login email+password)
- Retorna `Set-Cookie: session=<token>; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`

El frontend no necesita leer ni enviar tokens manualmente — `withCredentials: true` hace que el navegador envíe la cookie automáticamente.

---

## 3. Endpoints de Auth

### 3.1 Login — `POST /auth/v1/token?grant_type=password`

```
POST https://<project>.insforge.app/auth/v1/token?grant_type=password
Content-Type: application/json

{
  "email": "ana@uni.edu",
  "password": "estudiante123"
}
```

Respuesta (200):
```json
{
  "access_token": "...",
  "token_type": "bearer",
  "expires_in": 28800,
  "refresh_token": "...",
  "user": { "id": "...", "email": "ana@uni.edu" }
}
```

La cookie se setea automáticamente. La UI **ignora** el `access_token` — solo confía en la cookie.

### 3.2 Logout — `POST /auth/v1/logout`

```
POST https://<project>.insforge.app/auth/v1/logout
Cookie: session=<token>
```

Respuesta: 204 No Content + cookie limpia.

### 3.3 Me — `GET /auth/v1/me`

```
GET https://<project>.insforge.app/auth/v1/me
Cookie: session=<token>
```

Respuesta (200):
```json
{
  "id": "uuid",
  "email": "ana@uni.edu",
  "role": "authenticated",
  "profile": { ... }
}
```

**Problema:** Esto devuelve el usuario de InsForge Auth, no nuestro `public.usuarios` con `rol` y `programa_ids`.

### 3.4 Solución: Edge Function `/auth/me` que une auth.users con usuarios

Necesitamos un Edge Function que el frontend llame en lugar de `/auth/v1/me`:

```typescript
// functions/auth-me/index.ts
import { Context } from '@insforge/functions';

export default async (ctx: Context) => {
  const user = ctx.auth; // InsForge Auth user from cookie
  if (!user) {
    return ctx.json({ error: { code: 'session_expired', message: 'Sesión expirada' } }, 401);
  }

  const { data: usuario, error } = await ctx.sql`
    SELECT id, nombre, email, rol, programa_ids, activo
    FROM public.usuarios
    WHERE auth_user_id = ${user.id} AND activo = true
    LIMIT 1
  `;

  if (error || !usuario.length) {
    return ctx.json({ error: { code: 'not_found', message: 'Usuario no encontrado' } }, 404);
  }

  return ctx.json({ data: usuario[0] });
};
```

---

## 4. Creación de usuarios (admin)

El admin crea usuarios via:

1. **InsForge Admin API** (`POST /auth/v1/admin/users`) — crea el usuario en auth.users
2. El trigger `on_auth_user_created` inserta la fila en `public.usuarios`

Edge Function para crear usuario:

```typescript
// functions/usuarios-create/index.ts
export default async (ctx: Context) => {
  const user = ctx.auth;
  if (!user) return ctx.json({ error: { code: 'session_expired', message: 'No autenticado' } }, 401);

  const { data: admin } = await ctx.sql`
    SELECT rol FROM public.usuarios WHERE auth_user_id = ${user.id} LIMIT 1
  `;
  if (!admin.length || admin[0].rol !== 'administrativo') {
    return ctx.json({ error: { code: 'forbidden_role', message: 'Solo admin puede crear usuarios' } }, 403);
  }

  const { email, password, nombre, rol, programa_ids } = ctx.body;

  // Crear en auth.users via admin API
  const authRes = await ctx.fetch(`${ctx.env.INSFORGE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ctx.env.INSFORGE_SERVICE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email, password, email_confirm: true,
      profile: { nombre, rol, programa_ids }
    })
  });

  if (!authRes.ok) {
    const err = await authRes.json();
    return ctx.json({ error: { code: 'validation_error', message: err.msg || 'Error al crear usuario' } }, 422);
  }

  const authUser = await authRes.json();
  return ctx.json({ data: { id: authUser.id, email, nombre, rol, programa_ids, activo: true } }, 201);
};
```

---

## 5. Mapeo auth.uid() → usuarios.id

En RLS policies y funciones, usamos `auth.uid()` como el UUID de `auth.users`. Para obtener el `id` de `public.usuarios`, necesitamos:

```sql
-- Helper function para obtener usuarios.id desde auth.uid()
CREATE OR REPLACE FUNCTION public.current_usuario_id()
RETURNS UUID AS $$
  SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid() AND activo = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

---

## 6. Resumen de rutas de auth

| Frontend llama | Backend real | Método | Descripción |
|---|---|---|---|
| `/auth/login` | `POST /auth/v1/token?grant_type=password` | POST | Login email+password, setea cookie |
| `/auth/logout` | `POST /auth/v1/logout` | POST | Limpia cookie |
| `/auth/me` | Edge Function `/auth/me` | GET | Retorna `Usuario` completo desde `public.usuarios` |

---

## 7. Config TOML (insforge.toml)

```toml
[auth]
disable_signup = true
require_email_verification = false
allowed_redirect_urls = ["http://localhost:1420"]

[auth.password]
min_length = 8
require_number = false
require_lowercase = true
require_uppercase = false
require_special_char = false
```
