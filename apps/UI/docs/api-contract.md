# Contrato API

> Contrato REST entre la UI y el backend (Insforge sobre Postgres). La UI consume vía `axios` con `withCredentials: true`. El backend implementa las reglas de negocio en SQL (constraints, transacciones, triggers, RLS, CTEs).

---

## 1. Stack backend asumido

- **Runtime:** Insforge (Postgres + Auth + Storage + Functions).
- **Persistencia:** PostgreSQL.
- **Auth:** sesión por cookie httpOnly emitida por el backend (`Session=...; HttpOnly; SameSite=Lax; Secure`).
- **RLS:** Postgres Row Level Security habilitada en tablas sensibles (`inscripciones`, `calificaciones`, `asistencia`).
- **CORS:** el backend acepta los orígenes declarados en `ALLOWED_ORIGINS` (Vercel + Oracle).

La UI **no** usa `@insforge/sdk` directo. Solo HTTP. La abstracción `ApiClient` permite reemplazar el backend sin tocar features.

---

## 2. Transporte

| Aspecto | Valor |
|---|---|
| Protocolo | HTTPS |
| Formato | `application/json; charset=utf-8` |
| Auth | Cookie `Session` (httpOnly, `SameSite=Lax`). Frontend NO envía tokens manualmente. |
| Content-Type request | `application/json` |
| Fechas | ISO 8601 UTC (`2026-06-20T14:00:00Z`) |
| Duración de sesión | 8h sliding window |
| Refresh | sliding (cada request autenticado renueva la cookie) |

### Headers de respuesta estándar

```
Content-Type: application/json; charset=utf-8
Set-Cookie: Session=<token>; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800
```

---

## 3. Formato de respuesta

### Respuesta exitosa

```json
{
  "data": <T> | [<T>],
  "meta"?: { "page": 1, "limit": 20, "total": 137 }
}
```

`data` puede ser objeto o array. Si el endpoint es paginado, devuelve `data: [...]` con `meta`.

### Respuesta de error

```json
{
  "error": {
    "code": "string",
    "message": "Mensaje legible para humanos",
    "details"?: { ... }
  }
}
```

`code` es estable y consumible por la UI. `message` se muestra al usuario. `details` lleva información estructurada (ej. lista de prerrequisitos faltantes).

---

## 4. Códigos HTTP

| Código | Significado | Cuándo |
|---|---|---|
| `200` | OK | GET, PATCH exitosos |
| `201` | Created | POST que crea recurso |
| `204` | No Content | POST sin body (acciones) |
| `400` | Bad Request | Body malformado (no es JSON, schema inválido) |
| `401` | Unauthorized | Cookie ausente, expirada o inválida |
| `403` | Forbidden | Usuario autenticado sin permiso (rol o alcance) |
| `404` | Not Found | Recurso no existe |
| `409` | Conflict | Conflicto de estado: cupo lleno, transición inválida, intentos agotados, ya existe activa |
| `422` | Unprocessable Entity | Validación de negocio: prerrequisitos faltantes, ventana cerrada, etc. |
| `500` | Internal Server Error | Error inesperado |

---

## 5. Esquema de errores (catálogo `code`)

| `code` | HTTP | Detalle |
|---|---|---|
| `invalid_credentials` | 401 | Email o password incorrectos |
| `session_expired` | 401 | Cookie expirada |
| `forbidden_role` | 403 | Rol del usuario no permite la acción |
| `forbidden_scope` | 403 | Usuario no tiene alcance sobre el recurso (programa, grupo propio) |
| `not_found` | 404 | Recurso no existe |
| `cupo_lleno` | 409 | Grupo sin cupo disponible |
| `invalid_transition` | 409 | Transición de estado no permitida (ej. aprobar una ya aprobada) |
| `max_intentos_exceeded` | 409 | Re-solicitud supera los 3 intentos por grupo |
| `already_approved_course` | 409 | Estudiante ya tiene inscripción `aprobada_final` para este curso |
| `schedule_conflict` | 409 | Horario del grupo choca con otra inscripción activa |
| `inscription_window_closed` | 422 | Hoy fuera de `[fechaInicio, fechaFinInscripcion]` del período |
| `periodo_not_active` | 422 | Período académico no está en estado `activo` |
| `missing_prerequisites` | 422 | Faltan cursos prerrequisitos (lista en `details.missing: string[]`) |
| `acta_cerrada` | 409 | Intento de editar calificación con acta cerrada |
| `evaluation_weights_invalid` | 422 | Suma de pesos ≠ 100 al cerrar acta |
| `validation_error` | 422 | Schema Zod falló (detalle por campo en `details.fields`) |

---

## 6. Paginación

Endpoints `GET` de listado aceptan `?page=1&limit=20`. Default: `page=1`, `limit=20`. Máximo `limit=100`.

Respuesta:
```json
{
  "data": [...],
  "meta": { "page": 1, "limit": 20, "total": 137 }
}
```

---

## 7. Endpoints

> Notación: `[rol]` indica qué roles pueden llamar el endpoint. Si no se lista, solo `admin` o el dueño del recurso.

### 7.1 Auth

#### `POST /auth/login`
- **Roles:** público
- **Body:** `{ email: string, password: string }`
- **200:** `{ data: { user: Usuario } }` + cookie
- **401:** `invalid_credentials`
- **422:** `validation_error`

#### `POST /auth/logout`
- **Roles:** autenticado
- **204:** no content + cookie limpia

#### `GET /auth/me`
- **Roles:** autenticado
- **200:** `{ data: Usuario }`
- **401:** `session_expired`

---

### 7.2 Usuarios

#### `GET /usuarios`
- **Roles:** admin (todos), coord (de sus programas)
- **Query:** `?rol=&programaId=&page=&limit=`
- **200:** `{ data: Usuario[], meta }`

#### `POST /usuarios`
- **Roles:** admin
- **Body:** `{ nombre, email, rol, programaIds?: string[], password }`
- **201:** `{ data: Usuario }` (sin password)
- **409:** si email ya existe
- **422:** `validation_error`

#### `GET /usuarios/:id`
- **Roles:** admin, el propio usuario
- **200:** `{ data: Usuario }`
- **404:** `not_found`

#### `PATCH /usuarios/:id`
- **Roles:** admin
- **Body:** `{ nombre?, email?, rol?, programaIds?, activo? }`
- **200:** `{ data: Usuario }`
- **403:** `forbidden_role`

#### `DELETE /usuarios/:id` (soft delete)
- **Roles:** admin
- **204:** marca `activo = false`
- **403:** `forbidden_role`

---

### 7.3 Programas

#### `GET /programas`
- **Roles:** autenticado
- **200:** `{ data: Programa[] }`

#### `GET /programas/:id`
- **Roles:** autenticado
- **200:** `{ data: Programa & { cursos: Curso[] } }`

---

### 7.4 Cursos

#### `GET /cursos`
- **Roles:** autenticado
- **Query:** `?programaId=`
- **200:** `{ data: Curso[] }`

#### `GET /cursos/:id`
- **Roles:** autenticado
- **200:** `{ data: Curso & { prerrequisitos: Curso[] } }`

#### `POST /cursos`
- **Roles:** coord (de `programaId`), admin
- **Body:** `{ codigo, nombre, creditos, programaId, prerrequisitos: string[] }`
- **201:** `{ data: Curso }`
- **422:** `validation_error`

#### `PATCH /cursos/:id`
- **Roles:** coord, admin
- **200:** `{ data: Curso }`

---

### 7.5 Períodos académicos

#### `GET /periodos`
- **Roles:** autenticado
- **Query:** `?estado=&page=&limit=`
- **200:** `{ data: Periodo[], meta }`

#### `POST /periodos`
- **Roles:** admin
- **Body:** `{ nombre, tipo, fechaInicio, fechaFinInscripcion, fechaFinClases }`
- **201:** `{ data: Periodo }`
- **422:** `validation_error` (fechas inconsistentes)

#### `PATCH /periodos/:id`
- **Roles:** admin
- **Body:** `{ nombre?, estado?, fechaFinInscripcion? }`
- **200:** `{ data: Periodo }`
- **409:** `invalid_transition` (ej. `cerrado → activo`)

---

### 7.6 Grupos (paralelos)

#### `GET /grupos`
- **Roles:** autenticado
- **Query:** `?cursoId=&periodoId=&programaId=&docenteId=&page=&limit=`
- **200:** `{ data: Grupo[], meta }`
- **Estudiante:** ve solo grupos donde `cupoDisponible > 0` y período activo, salvo `?misGrupos=true` que ve sus inscripciones.

#### `GET /grupos/:id`
- **Roles:** autenticado
- **200:** `{ data: Grupo & { curso, docente, periodo } }`

#### `POST /grupos`
- **Roles:** coord (de `programaId`), admin
- **Body:** `{ cursoId, periodoId, docenteId, horario, cupo, aula }`
- **201:** `{ data: Grupo }`
- **422:** `validation_error`, `schedule_conflict` (del docente)

#### `PATCH /grupos/:id`
- **Roles:** coord, admin
- **Body:** parcial
- **200:** `{ data: Grupo }`

#### `POST /grupos/:id/cerrar-acta`
- **Roles:** docente del grupo
- **Body:** `{}`
- **200:** `{ data: Grupo }` con `actaCerrada: true`
- **409:** si `actaCerrada` ya era true, o `evaluation_weights_invalid`
- **422:** si no todas las inscripciones activas tienen nota final

#### `POST /grupos/:id/reabrir-acta`
- **Roles:** docente del grupo
- **Body:** `{ motivo: string }` (obligatorio, min 10 chars)
- **200:** `{ data: Grupo }` con `actaCerrada: false`, `motivoReapertura` actualizado
- **409:** si acta no estaba cerrada
- **422:** `validation_error`

---

### 7.7 Inscripciones

#### `GET /inscripciones`
- **Roles:** autenticado
- **Query:** `?estudianteId=&grupoId=&periodoId=&estado=&page=&limit=`
- **Estudiante:** solo ve las propias (forzado por RLS, `estudianteId=me` resuelve al id actual).
- **Docente:** ve las de sus grupos.
- **Coord:** ve las de sus programas.
- **Admin:** ve todas.
- **200:** `{ data: Inscripcion[], meta }`

#### `POST /inscripciones`
- **Roles:** estudiante
- **Body:** `{ grupoId }`
- **201:** `{ data: Inscripcion }` con `estado: 'solicitada'`, `intentos: 1`
- **Comportamiento:**
  - Si ya existe Inscripción del estudiante a ese grupo en estado `rechazada`:
    - Si `intentos < 3`: incrementa `intentos`, transiciona a `solicitada`, limpia `motivoRechazo`.
    - Si `intentos >= 3`: `409 max_intentos_exceeded`.
  - Si no existe Inscripción previa: crea nueva.
- **Errores:**
  - `409 cupo_lleno`
  - `409 schedule_conflict`
  - `409 already_approved_course` (ya aprobada para ese curso)
  - `422 missing_prerequisites` (`details.missing: string[]`)
  - `422 inscription_window_closed`
  - `422 periodo_not_active`

#### `GET /inscripciones/:id`
- **Roles:** estudiante dueño, docente del grupo, coord, admin
- **200:** `{ data: Inscripcion }`
- **403:** `forbidden_scope`

#### `POST /inscripciones/:id/aprobar`
- **Roles:** coord (programa dueño), admin
- **Body:** `{}`
- **200:** `{ data: Inscripcion }` con `estado: 'aprobada'`
- **409:** `invalid_transition` (estado actual ≠ `solicitada`)
- **422:** si cupo cambió a 0 en el ínterin

#### `POST /inscripciones/:id/rechazar`
- **Roles:** coord, admin
- **Body:** `{ motivo?: string }`
- **200:** `{ data: Inscripcion }` con `estado: 'rechazada'`, `motivoRechazo`, `intentos++`
- **409:** `invalid_transition`

#### `POST /inscripciones/:id/retirar`
- **Roles:** estudiante dueño
- **Body:** `{}`
- **200:** `{ data: Inscripcion }` con `estado: 'retirada'`
- **409:** `invalid_transition` (estado actual ≠ `activa`)

---

### 7.8 Evaluaciones

#### `GET /evaluaciones`
- **Roles:** autenticado (filtros aplicados por RLS)
- **Query:** `?grupoId=&page=&limit=`
- **200:** `{ data: Evaluacion[], meta }`

#### `POST /evaluaciones`
- **Roles:** docente del grupo
- **Body:** `{ grupoId, nombre, peso, fecha? }`
- **201:** `{ data: Evaluacion }`
- **409:** `acta_cerrada`

#### `PATCH /evaluaciones/:id`
- **Roles:** docente del grupo
- **200:** `{ data: Evaluacion }`
- **409:** `acta_cerrada`

#### `DELETE /evaluaciones/:id`
- **Roles:** docente del grupo
- **204**
- **409:** `acta_cerrada` o si hay calificaciones asociadas

---

### 7.9 Calificaciones

#### `GET /calificaciones`
- **Roles:** autenticado
- **Query:** `?grupoId=&estudianteId=&evaluacionId=&inscripcionId=&page=&limit=`
- **Estudiante:** solo ve las propias (RLS).
- **200:** `{ data: Calificacion[], meta }`

#### `POST /calificaciones`
- **Roles:** docente del grupo
- **Body:** `{ items: { inscripcionId, evaluacionId, nota }[] }` (batch)
- **200:** `{ data: Calificacion[] }`
- **422:** `validation_error` (nota fuera de [0,100])
- **409:** `acta_cerrada`

---

### 7.10 Asistencia

#### `GET /asistencia`
- **Roles:** autenticado
- **Query:** `?grupoId=&fecha=&inscripcionId=&page=&limit=`
- **200:** `{ data: Asistencia[], meta }`

#### `POST /asistencia`
- **Roles:** docente del grupo
- **Body:** `{ grupoId, fecha, items: { inscripcionId, estado }[] }` (batch por día)
- **200:** `{ data: Asistencia[] }`
- **409:** `acta_cerrada`

---

### 7.11 Reportes

#### `GET /reportes/resumen`
- **Roles:** coord, admin
- **Query:** `?programaId=&periodoId=`
- **200:**
  ```json
  {
    "data": {
      "programaId": "...",
      "periodoId": "...",
      "totalGrupos": 42,
      "totalInscripciones": 1280,
      "aprobados": 980,
      "reprobados": 220,
      "retirados": 80,
      "tasaDesercion": 6.25,
      "distribucionNotas": [
        { "rango": "0-59", "cantidad": 80 },
        { "rango": "60-69", "cantidad": 140 },
        { "rango": "70-79", "cantidad": 480 },
        { "rango": "80-89", "cantidad": 360 },
        { "rango": "90-100", "cantidad": 140 }
      ],
      "rendimientoPorGrupo": [
        { "grupoId": "...", "curso": "...", "promedio": 78.4, "aprobados": 28, "reprobados": 4 }
      ]
    }
  }
  ```

---

## 8. Schemas TypeScript (DTOs)

```typescript
type Rol = 'estudiante' | 'docente' | 'administrativo' | 'coordinador';

type EstadoInscripcion =
  | 'solicitada'
  | 'aprobada'
  | 'rechazada'
  | 'activa'
  | 'retirada'
  | 'aprobada_final'
  | 'reprobada_final'
  | 'cancelada';

type EstadoPeriodo = 'borrador' | 'activo' | 'cerrado';
type TipoPeriodo = 'semestral' | 'cuatrimestral' | 'anual';
type EstadoAsistencia = 'presente' | 'ausente' | 'tarde' | 'justificado';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  programaIds: string[];
  activo: boolean;
}

interface Programa {
  id: string;
  nombre: string;
  codigo: string;
}

interface Curso {
  id: string;
  codigo: string;
  nombre: string;
  creditos: number;
  programaId: string;
  prerrequisitos: string[];
}

interface Periodo {
  id: string;
  nombre: string;
  tipo: TipoPeriodo;
  fechaInicio: string;       // ISO 8601
  fechaFinInscripcion: string;
  fechaFinClases: string;
  estado: EstadoPeriodo;
}

interface BloqueHorario {
  dia: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  inicio: string;            // "HH:mm"
  fin: string;               // "HH:mm"
}

interface Grupo {
  id: string;
  cursoId: string;
  periodoId: string;
  docenteId: string;
  horario: BloqueHorario[];
  cupo: number;
  cupoDisponible: number;
  aula: string;
  actaCerrada: boolean;
  motivoReapertura?: string;
}

interface Inscripcion {
  id: string;
  estudianteId: string;
  grupoId: string;
  periodoId: string;
  estado: EstadoInscripcion;
  intentos: number;
  motivoRechazo?: string;
  createdAt: string;
}

interface Evaluacion {
  id: string;
  grupoId: string;
  nombre: string;
  peso: number;              // 0-100
  fecha?: string;
}

interface Calificacion {
  id: string;
  inscripcionId: string;
  evaluacionId: string;
  nota: number;              // 0-100
  createdAt: string;
}

interface Asistencia {
  id: string;
  inscripcionId: string;
  fecha: string;             // YYYY-MM-DD
  estado: EstadoAsistencia;
}

interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

interface ApiResponse<T> {
  data: T;
}

interface ApiPaginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number };
}
```

---

## 9. Schemas Zod (validación de response)

> Los schemas Zod se usan en `src/api/schemas.ts` para validar las respuestas del backend antes de llegar a la UI. Si una respuesta no cumple, se considera error del server (se loggea y se muestra error genérico).

```typescript
import { z } from 'zod';

export const RolSchema = z.enum(['estudiante', 'docente', 'administrativo', 'coordinador']);
export const EstadoInscripcionSchema = z.enum([
  'solicitada', 'aprobada', 'rechazada', 'activa',
  'retirada', 'aprobada_final', 'reprobada_final', 'cancelada',
]);

export const UsuarioSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  email: z.string().email(),
  rol: RolSchema,
  programaIds: z.array(z.string()),
  activo: z.boolean(),
});

export const GrupoSchema = z.object({
  id: z.string(),
  cursoId: z.string(),
  periodoId: z.string(),
  docenteId: z.string(),
  horario: z.array(z.object({
    dia: z.number().int().min(1).max(7),
    inicio: z.string().regex(/^\d{2}:\d{2}$/),
    fin: z.string().regex(/^\d{2}:\d{2}$/),
  })),
  cupo: z.number().int().positive(),
  cupoDisponible: z.number().int().min(0),
  aula: z.string(),
  actaCerrada: z.boolean(),
  motivoReapertura: z.string().optional(),
});

export const InscripcionSchema = z.object({
  id: z.string(),
  estudianteId: z.string(),
  grupoId: z.string(),
  periodoId: z.string(),
  estado: EstadoInscripcionSchema,
  intentos: z.number().int().min(1).max(3),
  motivoRechazo: z.string().optional(),
  createdAt: z.string().datetime(),
});

export const CalificacionSchema = z.object({
  id: z.string(),
  inscripcionId: z.string(),
  evaluacionId: z.string(),
  nota: z.number().min(0).max(100),
  createdAt: z.string().datetime(),
});

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});
```

---

## 10. Reglas de server (implementación SQL)

### Regla 1 — Prerrequisitos

CTE en la creación de Inscripción:
```sql
WITH prereq_ok AS (
  SELECT c.id
  FROM cursos c
  WHERE c.id = :curso_id
    AND NOT EXISTS (
      SELECT 1 FROM unnest(c.prerrequisitos) AS pid
      WHERE NOT EXISTS (
        SELECT 1 FROM inscripciones i
        JOIN grupos g ON g.id = i.grupo_id
        WHERE i.estudiante_id = :estudiante_id
          AND g.curso_id = pid
          AND i.estado = 'aprobada_final'
      )
    )
)
SELECT id FROM prereq_ok;
```
Si retorna 0 filas → `422 missing_prerequisites` con `details.missing = [...]`.

### Regla 3 — Cupo atómico

```sql
UPDATE grupos
SET cupo_disponible = cupo_disponible - 1
WHERE id = :grupo_id AND cupo_disponible > 0
RETURNING cupo_disponible;
```
Si retorna 0 filas → `409 cupo_lleno`.

### Regla 6 — Cierre de acta (trigger)

```sql
CREATE OR REPLACE FUNCTION prevent_edit_closed_acta()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT acta_cerrada FROM grupos WHERE id = NEW.grupo_id) THEN
    RAISE EXCEPTION 'acta_cerrada' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calificaciones_acta_check
BEFORE INSERT OR UPDATE OR DELETE ON calificaciones
FOR EACH ROW EXECUTE FUNCTION prevent_edit_closed_acta();
```

### Transiciones de Inscripción (check)

```sql
CREATE OR REPLACE FUNCTION validate_inscripcion_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.estado = NEW.estado THEN RETURN NEW; END IF;
  IF NOT (
    (OLD.estado = 'solicitada' AND NEW.estado IN ('aprobada', 'rechazada')) OR
    (OLD.estado = 'aprobada'   AND NEW.estado = 'activa') OR
    (OLD.estado = 'activa'     AND NEW.estado IN ('retirada', 'aprobada_final', 'reprobada_final', 'cancelada')) OR
    (OLD.estado = 'retirada'   AND NEW.estado = 'activa') OR
    (OLD.estado = 'rechazada'  AND NEW.estado = 'solicitada')
  ) THEN
    RAISE EXCEPTION 'invalid_transition' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inscripciones_transition_check
BEFORE UPDATE ON inscripciones
FOR EACH ROW WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
EXECUTE FUNCTION validate_inscripcion_transition();
```

### Recursar prohibido (constraint)

```sql
CREATE UNIQUE INDEX uniq_aprobada_curso_estudiante
ON inscripciones (estudiante_id, grupo_id)
WHERE estado = 'aprobada_final';
```
Equivalente funcional con `EXISTS` check en `POST /inscripciones`.

---

## 11. Versionado

- Sin versionado en URL (`/v1/...`). Cambios incompatibles → nuevo path (`/grupos-v2/...`).
- Cambios aditivos (nuevo campo opcional, nuevo endpoint) no rompen clientes.

---

## 12. Consideraciones de CORS

```
Access-Control-Allow-Origin: <ALLOWED_ORIGINS>
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age: 86400
```

`ALLOWED_ORIGINS` debe incluir:
- Origen de Vercel (`https://<app>.vercel.app` o dominio custom).
- Origen de Oracle Cloud (el dominio del static host).

Sin `Allow-Credentials: true` la cookie no se envía al backend cross-origin.

---

## 13. Consideraciones de deployment

- `VITE_API_URL` se setea por entorno en el host (Vercel env vars / Oracle config).
- `VITE_USE_MOCKS=false` en producción.
- El `dist/` es estático, sirve en cualquier CDN o static host.
- `index.html` debe servirse con `Cache-Control: no-cache`. Assets con hash en el nombre (`assets/index-abc123.js`) sí se cachean agresivamente.