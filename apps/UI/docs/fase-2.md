# Fase 2 — Informe de esqueleto

> Resumen de alto nivel de lo ejecutado en la Fase 2. Complementa `design.md` y `api-contract.md`.

---

## Objetivo

Tener un entorno de desarrollo funcional donde: la UI arranca, el usuario puede autenticarse contra mocks, y cada rol tiene su layout con placeholders listos para reemplazar en la Fase 4. Sin pantallas reales todavía — solo el esqueleto navegable.

---

## Tareas ejecutadas

### 1. Dependencias

**Runtime:**
- `react-router-dom@^7.18.0` — routing declarativo
- `@tanstack/react-query@^5.101.0` — server state, cache, loading/error por query
- `axios@^1.18.0` — HTTP client con `withCredentials: true`
- `react-hook-form@^7.80.0` + `@hookform/resolvers@^5.4.0` — forms + validación
- `zod@^4.4.3` — schemas de validación (compartidos con el backend)
- `lucide-react@^1.21.0` — iconos
- `@fontsource/{poppins,libre-baskerville,ibm-plex-mono}` — fuentes auto-hospedadas

**Dev:**
- `tailwindcss@^4.3.1` + `@tailwindcss/vite@^4.3.1` — styling con el plugin de Vite (config CSS, no JS)
- `msw@^2.14.6` — mocks a nivel de service worker

### 2. Configuración base

- `vite.config.ts` — agregado el plugin `@tailwindcss/vite`.
- `index.html` — `lang="es"`, título "Avior SIU".
- `tsconfig.json` — sin cambios (la base ya era estricta, sirvió tal cual).
- `src/index.css` — escrita con la **paleta completa** (light/dark en OKLCH), `@theme inline` para exponer las CSS vars como utilities de Tailwind v4, `@layer base` para el reset.
- `public/mockServiceWorker.js` — generado por `npx msw init` y registrado en `package.json` bajo `msw.workerDirectory`.

### 3. Capa de API

**Diseño:** una sola implementación `HttpApiClient` (axios). MSW intercepta a nivel de red, así que el mismo cliente sirve para mocks y para producción. No hay un `MockApiClient` separado — sería duplicación.

- `src/api/types.ts` — DTOs completos del contrato (Usuario, Programa, Curso, Periodo, Grupo, Inscripcion, Evaluacion, Calificacion, Asistencia, ApiError, ApiResponse, ApiPaginated, LoginInput).
- `src/api/schemas.ts` — Zod: `RolSchema`, `EstadoInscripcionSchema`, `UsuarioSchema`, `LoginInputSchema`, `ApiErrorSchema`.
- `src/api/client.ts` — interface `ApiClient` + factory que devuelve `HttpApiClient`. Por ahora solo expone `auth.*` y `usuarios.list`. Los demás endpoints se agregan en Fase 4 cuando se necesiten.
- `src/api/http.ts` — `axios.create` con `withCredentials: true`, interceptor que mapea errores HTTP a `ApiError { code, message, details? }`.

### 4. Capa de mocks (MSW)

Helpers de reglas de negocio viven en `src/api/mocks/lib/` como funciones nombradas, no como clases ni use cases. DHH-aligned.

- `src/api/mocks/lib/transitions.ts` — **tabla de transiciones como dato exportado**, función `canTransition(from, to): boolean`, set `ESTADOS_TERMINALES`. Una sola fuente de verdad para la máquina de estados.
- `src/api/mocks/lib/session.ts` — helpers para parsear, setear y limpiar la cookie `Session` httpOnly. `getCurrentUserIdFromRequest()` extrae el usuario de la sesión activa.
- `src/api/mocks/db.ts` — store en memoria. Crea 4 usuarios seed (uno por rol) con credenciales fijas. Tabla `sesiones: Map<token, userId>` y `credenciales: Map<userId, password>`.
- `src/api/mocks/handlers/auth.ts` — handlers de `/auth/login`, `/auth/logout`, `/auth/me`. Login valida con `LoginInputSchema`, verifica credenciales, crea sesión, devuelve cookie. Errores tipados (`invalid_credentials`, `session_expired`, `validation_error`).
- `src/api/mocks/browser.ts` — `setupWorker(...authHandlers)` + `startMockWorker()` que resuelve cuando MSW está listo.

### 5. UI

- `src/App.tsx` — `BrowserRouter` + `QueryClientProvider` (staleTime 30s, sin refetchOnFocus). Rutas declaradas: `/login`, `/estudiante/*`, `/docente/*`, `/coordinador/*`, `/administrativo/*`, catch-all → `/login`.
- `src/main.tsx` — bootstrap async: si `VITE_USE_MOCKS === 'true'`, arranca MSW antes de `createRoot`. Si falla MSW, la app igual carga (fail-soft) — la UI mostrará errores de red, no crash.
- `src/components/layout/AppLayout.tsx` — sidebar con nav por rol (consulta `me.data.rol` y renderiza el subset correspondiente), topbar con nombre + toggle de tema (light/dark sobre `<html>`) + botón logout. En modo mock, un panel inferior permite **alternar entre roles sin re-login** (útil para demos).
- `src/routes/LoginPage.tsx` — formulario con RHF + Zod, 4 botones de **quick-login** por rol, manejo de errores del server (401 → mensaje, 422 → detalle por campo). Tras éxito, redirige a la home del rol y guarda la respuesta en el cache de TanStack Query con key `['auth', 'me']`.
- `src/routes/PlaceholderPage.tsx` — componente genérico reutilizado por las 8 rutas placeholder. Solo texto + un card "Próximamente".

### 6. Variables de entorno

- `.env.development` — `VITE_USE_MOCKS=true`, `VITE_API_URL=http://localhost:3000`.
- `.env.production` — `VITE_USE_MOCKS=false`, `VITE_API_URL=https://api.example.com` (placeholder).
- `.env.example` — plantilla con la lista de variables.

---

## Decisiones técnicas notables

- **Tailwind v4 desde el inicio** — no v3. Config por CSS (`@theme inline`), no `tailwind.config.js`. Cambia cómo se exponen los tokens pero los utilities son los mismos.
- **MSW > mock client en JS puro** — intercepta a nivel de service worker, el código de UI no sabe que hay mocks. Cuando llegue el backend real, se desactiva MSW y nada cambia.
- **`HttpApiClient` único, no dual** — el diseño original contemplaba `MockApiClient` separado. Se eliminó porque MSW intercepta transparentemente, tener dos clases era duplicación sin beneficio.
- **Tabla de transiciones como dato** — `transitions.ts` exporta `TRANSICIONES_VALIDADAS` y `ESTADOS_TERMINALES`. Si en el futuro se quiere generar UI desde el modelo, el dato ya está listo.
- **Selector de rol mock en sidebar** — solo visible cuando `VITE_USE_MOCKS === true`. Reemplaza el "logout + login" en demos. Se quita en producción por un guard trivial.

---

## Verificación

- `pnpm build` — pasa `tsc` (strict, sin `any` implícitos) + `vite build`. Bundle final: 420 KB JS, 27 KB CSS (gzip: 134 KB JS, 5.4 KB CSS).
- `pnpm dev` — arranca en ~200 ms en `http://localhost:1420`. Redirige `/` → `/login`.
- Flujo manual: quick-login "Estudiante" → cookie `Session` set → redirige a `/estudiante/cursos`. Toggle dark → fondo cambia. Selector de rol mock "Docente" → navega a `/docente/grupos` (mismo usuario, distinto rol en sesión). Logout → limpia cookie → vuelve a `/login`.

---

## Lo que NO se hizo en esta fase

- Pantallas reales (Fase 4). Solo placeholders.
- shadcn/ui primitives (Button/Card/Dialog/etc.). Para Fase 2 bastaba con Tailwind crudo.
- Tests (ni unitarios ni E2E). Plan original: tests solo para `lib/transitions.ts` y `lib/prerequisites.ts` cuando el flujo esté estable.
- Endpoints adicionales en `ApiClient` (programas, cursos, periodos, grupos, etc.). Se agregan en Fase 4 a medida que cada pantalla los necesita.
- `lib/prerequisites.ts`, `lib/quota.ts`, `lib/grades.ts` — los helpers que sí requieren reglas de negocio. Llegan en Fase 4 cuando se implementen los flujos de inscripción y calificación.

---

## Estado del proyecto

```
apps/UI/
├── docs/
│   ├── design.md            ← fase 1
│   ├── api-contract.md      ← fase 1
│   └── fase-2.md            ← este informe
├── public/
│   └── mockServiceWorker.js
├── src/
│   ├── api/                 ← types, schemas, client, http, mocks/{db,lib,handlers,browser}
│   ├── components/layout/   ← AppLayout
│   ├── routes/              ← LoginPage, PlaceholderPage
│   ├── index.css            ← Tailwind v4 + design tokens
│   ├── App.tsx              ← Router + QueryProvider
│   └── main.tsx             ← MSW boot + render
├── .env.{development,production,example}
├── package.json
└── README.md
```

Listo para Fase 3 — pulir Login + agregar shadcn primitives + implementar las 8 pantallas reales de los 4 roles.