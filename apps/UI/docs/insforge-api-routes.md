# Mapeo de rutas API — Avior SIU en InsForge

> Cada ruta que el frontend consume se mapea a PostgREST directo o a una Edge Function de InsForge. PostgREST para CRUD simple; Edge Functions para lógica con validaciones, cálculos, o múltiples writes.

**URL base:** `VITE_API_URL=https://<project>.insforge.app` (desarrollo) o el subdominio de producción.

**Autenticación:** Cookie `session` httpOnly vía InsForge Auth. PostgREST respeta RLS; Edge Functions verifican `ctx.auth`.

---

## 1. Rutas que van directo a PostgREST

PostgREST expone las tablas de `public` como REST automáticamente en `/rest/v1/<tabla>`. Usa querystring para filtros (`?select=...&column=eq.value`).

### 1.1 Programas

| Frontend | PostgREST | Method |
|---|---|---|
| `GET /programas` | `GET /rest/v1/programas` | GET |
| `GET /programas/:id` | `GET /rest/v1/programas?id=eq.<id>` | GET |

### 1.2 Cursos

| Frontend | PostgREST | Method |
|---|---|---|
| `GET /cursos?programaId=` | `GET /rest/v1/cursos?programa_id=eq.<id>` | GET |
| `GET /cursos/:id` | `GET /rest/v1/cursos?id=eq.<id>` | GET |

### 1.3 Períodos

| Frontend | PostgREST | Method |
|---|---|---|
| `GET /periodos?estado=&page=&limit=` | `GET /rest/v1/periodos?estado=eq.<val>&order=created_at.desc&limit=20&offset=0` | GET |

### 1.4 Evaluaciones

| Frontend | PostgREST | Method |
|---|---|---|
| `GET /evaluaciones?grupoId=` | `GET /rest/v1/evaluaciones?grupo_id=eq.<id>` | GET |

---

## 2. Rutas que requieren Edge Functions

Endpoints con lógica de negocio, joins complejos, o múltiples writes.

### Convención de nombres

```
POST   /functions/v1/<slug>
GET    /functions/v1/<slug>
PATCH  /functions/v1/<slug>?method=PATCH  (InsForge Functions solo GET/POST)
DELETE /functions/v1/<slug>?method=DELETE
```

---

### 2.1 Auth

| Slug | Method | Body / Query | Response | Lógica |
|---|---|---|---|---|
| `auth-login` | POST | `{ email, password }` | `{ data: { user: Usuario } }` + cookie | Proxy a `POST /auth/v1/token?grant_type=password`, luego consulta `public.usuarios` por `auth_user_id` |
| `auth-logout` | POST | `{}` | 204 | Proxy a `POST /auth/v1/logout` |
| `auth-me` | GET | — | `{ data: Usuario }` | Lee cookie, consulta `public.usuarios WHERE auth_user_id = auth.uid()` |

### 2.2 Usuarios

| Slug | Method | Body / Query | Response | Lógica |
|---|---|---|---|---|
| `usuarios-list` | GET | `?rol=&programaId=&page=&limit=` | `{ data: Usuario[], meta }` | Query filtrado por rol/programa_id con paginación |
| `usuarios-create` | POST | `{ nombre, email, password, rol, programaIds }` | `{ data: Usuario }` (201) | Crea en auth.users via admin API + trigger crea en usuarios |
| `usuarios-update` | PATCH | `{ id, nombre?, rol?, ... }` | `{ data: Usuario }` | Actualiza `public.usuarios` + opcionalmente auth.users |
| `usuarios-delete` | DELETE | `{ id }` | 204 | Marca `activo = false` (soft delete) |

### 2.3 Grupos (coordinador)

| Slug | Method | Body / Query | Response | Lógica |
|---|---|---|---|---|
| `coordinador-grupos` | GET | — | `{ data: CoordinadorGrupoView[] }` | Grupos con join a cursos, programas, periodos, conteo de estudiantes |
| `coordinador-grupos-create` | POST | `{ cursoId, horario, aula, docenteId, cupo }` | `{ data: CoordinadorGrupoView }` (201) | Crea grupo con `cupo_disponible = cupo`, valida docente existe |
| `coordinador-grupos-update` | PATCH | `{ id, aula?, cupo?, ... }` | `{ data: CoordinadorGrupoView }` | Actualiza grupo, recalcula `cupo_disponible` si cambia `cupo` |
| `coordinador-grupos-toggle-acta` | POST | `{ id }` | `{ data: { actaCerrada: boolean } }` | Toggle `acta_cerrada` |
| `coordinador-grupos-detail` | GET | `?id=` | `{ data: GrupoDetailView }` | Grupo + estudiantes con inscripciones, join a usuarios |
| `coordinador-grupos-estudiantes-disponibles` | GET | `?grupoId=` | `{ data: { id, nombre, email }[] }` | Estudiantes no inscritos en el grupo |
| `coordinador-grupos-agregar-estudiante` | POST | `{ grupoId, estudianteId }` | 201 | Crea inscripción `activa`, decrementa cupo |
| `coordinador-grupos-quitar-estudiante` | DELETE | `?grupoId=&inscripcionId=` | 204 | Elimina inscripción, incrementa cupo |

### 2.4 Grupos (docente)

| Slug | Method | Body / Query | Response | Lógica |
|---|---|---|---|---|
| `grupos-mis` | GET | — | `{ data: GrupoDocenteView[] }` | Grupos donde `docente_id = auth.uid()`, con conteo de estudiantes y evaluaciones |
| `grupos-calificar` | GET | `?id=` | `{ data: GrupoCalificarView }` | Grupo + evaluaciones + estudiantes con nota ponderada |
| `grupos-calificaciones-save` | POST | `{ grupoId, evaluacionId, notas }` | 200 | Upsert calificaciones, valida acta abierta, recalcula nota final |
| `grupos-asistencia-get` | GET | `?id=&fecha=` | `{ data: AsistenciaView }` | Lista de estudiantes con estado de asistencia para una fecha |
| `grupos-asistencia-save` | POST | `{ grupoId, fecha, registros }` | 200 | Upsert asistencias por `(inscripcionId, fecha)` |
| `grupos-evaluaciones-create` | POST | `{ grupoId, nombre, peso, fecha, cursoId }` | 201 | Crea evaluación, valida acta abierta |
| `grupos-cerrar-acta` | POST | `{ grupoId }` | 200 | Marca `acta_cerrada = true`, valida suma de pesos = 100 |

### 2.5 Inscripciones (estudiante)

| Slug | Method | Body / Query | Response | Lógica |
|---|---|---|---|---|
| `inscripciones-mis` | GET | — | `{ data: InscripcionView[] }` | Inscripciones del estudiante con joins a curso, grupo, docente, horario, período |
| `grupos-disponibles` | GET | — | `{ data: GrupoView[] }` | Grupos con cupo disponible, período activo, no inscrito; join a curso, programa, docente |
| `inscripciones-solicitar` | POST | `{ grupoId }` | `{ data: InscripcionView }` | Valida ventana, cupo, prerrequisitos, choque horario, intentos < 3; crea/retry inscripción |

### 2.6 Calificaciones (estudiante)

| Slug | Method | Body / Query | Response | Lógica |
|---|---|---|---|---|
| `calificaciones-mis` | GET | — | `{ data: CalificacionView[] }` | Calificaciones del estudiante con nota final ponderada por grupo, todas las evaluaciones por inscripción |

### 2.7 Progreso (estudiante)

| Slug | Method | Body / Query | Response | Lógica |
|---|---|---|---|---|
| `estudiante-progreso` | GET | — | `{ data: ProgresoView[] }` | Progreso por programa: créditos totales, aprobados, en curso, porcentaje |

### 2.8 Reportes (coordinador/admin)

| Slug | Method | Body / Query | Response | Lógica |
|---|---|---|---|---|
| `coordinador-reportes-kpi` | GET | — | `{ data: ReportesKPI }` | Total estudiantes, promedio general, tasa aprobación, total grupos, retirados |
| `coordinador-reportes` | GET | — | `{ data: ReportesView }` | Rendimiento por grupo, distribución de notas, deserción |
| `admin-dashboard` | GET | — | `{ data: AdminDashboardView }` | Totales: usuarios por rol, grupos activos, inscripciones, período activo |
| `usuarios-list` | GET | `?rol=&programaId=&page=&limit=` | `{ data: Usuario[], meta }` | Lista de usuarios con paginación y filtros (admin) |
| `periodos-create` | POST | `{ nombre, tipo, fechas }` | `{ data: Periodo }` (201) | Crea período |
| `periodos-update` | PATCH | `{ id, ... }` | `{ data: Periodo }` | Actualiza período |
| `periodos-delete` | DELETE | `{ id }` | 204 | Elimina período |

---

## 3. Mapeo PostgREST → Frontend TypeScript

PostgREST usa `snake_case`. El frontend espera `camelCase`. El `HttpApiClient` en `http.ts` no transforma — la transformación debe hacerse en la Edge Function o en un interceptor de axios.

**Opción recomendada:** interceptor de axios que transforma `snake_case ↔ camelCase` automáticamente.

```typescript
// src/api/transform.ts
function snakeToCamel(obj: any): any {
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
        snakeToCamel(v),
      ])
    );
  }
  return obj;
}
```

O bien, cada Edge Function retorna directamente en camelCase (más trabajo pero más control).

---

## 4. Paginación en PostgREST

El frontend envía `?page=1&limit=20`. PostgREST usa `?limit=20&offset=0`.

Las Edge Functions deben traducir:
```typescript
const page = ctx.query.page ? parseInt(ctx.query.page) : 1;
const limit = ctx.query.limit ? parseInt(ctx.query.limit) : 20;
const offset = (page - 1) * limit;
const { data, count } = await ctx.sql`
  SELECT *, COUNT(*) OVER() AS total
  FROM public.usuarios
  ORDER BY created_at DESC
  LIMIT ${limit} OFFSET ${offset}
`;
const total = data.length > 0 ? parseInt(data[0].total) : 0;
return ctx.json({ data, meta: { page, limit, total } });
```

---

## 5. Resumen de implementación

| Endpoints | Implementación | Cantidad |
|---|---|---|
| CRUD simple (programas, cursos, periodos list) | PostgREST directo | ~6 |
| Auth (login, logout, me) | Edge Functions + proxy a auth API | 3 |
| Lógica de negocio (inscripciones, calificaciones, reportes) | Edge Functions | ~25 |
| Admin (usuarios CRUD, periodos CRUD, dashboard) | Edge Functions | ~8 |

**Total Edge Functions a implementar: ~30**

Se pueden agrupar varios endpoints en una misma función (ej. `usuarios.ts` con manejo de ruta interna), o una función por endpoint. Recomendación: una función por endpoint para simplicidad y despliegue independiente.
