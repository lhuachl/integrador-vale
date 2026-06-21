# Diseño — Avior SIU

> Documento vivo. Fuente de verdad para producto, UI y contrato API.

---

## 1. Visión

Software académico multi-rol para gestión de programas, grupos, inscripciones, calificaciones y reportes. El cliente principal es una **web standalone** desplegada en Vercel u Oracle Cloud (deploy agnóstico). Mobile (iOS/Android) y desktop (Tauri) son aditivos futuros que consumen el mismo backend.

El backend es **Insforge** (Postgres + Auth + Storage + Functions). El frontend **nunca** usa `@insforge/sdk` directo: habla HTTP contra endpoints REST documentados en `api-contract.md`. Esto mantiene una sola abstracción (`ApiClient`) y permite cambiar el backend sin tocar UI.

---

## 2. Actores

| Rol | Responsabilidades | Restricciones clave |
|---|---|---|
| **Estudiante** | Ver sus cursos, calificaciones, horario, asistencia. Solicitar inscripción a grupos. Retirarse dentro del período. | Solo ve datos propios. No ve notas de pares. No edita calificaciones. |
| **Docente** | Ver sus grupos. Registrar asistencia y calificaciones. Definir evaluaciones con peso%. Cerrar y reabrir acta de sus grupos. | Solo edita datos de SUS grupos. No ve oferta académica completa. No gestiona usuarios. |
| **Administrativo** | CRUD de usuarios. Apertura/cierre de períodos académicos. Alta de oferta académica (grupos con cupo, aula, horario). Aprobar/rechazar inscripciones. | No aprueba planes de estudio. No ve reportes de rendimiento por programa. |
| **Coordinador** | Aprobar oferta académica de sus programas. Gestionar pensum. Ver reportes de rendimiento, distribución de notas, deserción. Aprobar/rechazar inscripciones de sus programas. | Pertenece a varios programas (`programaIds[]`). No gestiona usuarios (salvo de su programa). |

---

## 3. Plataformas

| # | Plataforma | Estado | Notas |
|---|---|---|---|
| 1 | **Web standalone** | Cliente principal | Build Vite → `dist/`. Deploy a Vercel o Oracle Cloud vía env vars. Mismo artefacto, distinto host. |
| 2 | Mobile (iOS/Android) | Segundo aditivo | Wrapper del bundle web (stack a decidir: Capacitor o React Native). |
| 3 | Desktop (Tauri) | Último aditivo | `apps/UI/src-tauri/` queda inerte durante dev web. Se retoma al final. |

`src-tauri/` y `@tauri-apps/api` se mantienen en `package.json` pero **sin uso** hasta Fase Tauri.

---

## 4. Stack

```
Frontend:  React 19 · Vite 7 · TypeScript
Routing:   React Router v7
Server:    TanStack Query
HTTP:      axios (withCredentials: true)
Forms:     React Hook Form + Zod
UI:        Tailwind v4 + shadcn/ui · lucide-react
Fonts:     @fontsource/poppins · @fontsource/libre-baskerville · @fontsource/ibm-plex-mono
Mock:      MSW (Mock Service Worker)
Aditivo:   reactbits.dev (animaciones específicas, sin instalar hasta necesidad)
PM:        pnpm · pnpm-workspace
```

Backend (fuera de alcance de este plan): **Insforge** sobre Postgres.

---

## 5. Arquitectura frontend

### Capas

```
┌────────────────────────────────────────────────────────┐
│ UI (React + componentes por rol)                       │
│   features/{auth,estudiantes,docentes,...}             │
├────────────────────────────────────────────────────────┤
│ Hooks de dominio (TanStack Query, RHF)                 │
├────────────────────────────────────────────────────────┤
│ ApiClient (interface)                                  │
│   ├── HttpApiClient   → axios (producción)             │
│   └── MockApiClient   → MSW (desarrollo/demo)          │
│   Selección por VITE_USE_MOCKS                         │
└────────────────────────────────────────────────────────┘
```

### Patrón de abstracción

`ApiClient` es una interfaz TypeScript. `HttpApiClient` y `MockApiClient` (gestionado por MSW a nivel de red) cumplen la misma firma. **MSW intercepta en el service worker**, así el código de UI es idéntico con mocks o sin ellos. Esto valida el contrato sin backend.

`HttpApiClient` añade:
- `axios.create({ baseURL: VITE_API_URL, withCredentials: true })`.
- Interceptor de respuesta que mapea errores HTTP a `ApiError { code, message, details? }`.

### Encapsulación de reglas de negocio en mocks

Las reglas complejas (prerrequisitos, cupo atómico, transiciones de Inscripción, cierre de acta) viven en `src/api/mocks/lib/` como **funciones nombradas**, no como clases ni use cases. La tabla de transiciones es **dato**, no objeto de dominio.

**No se hace:**
- ❌ Clases `Inscripcion` con `.aprobar()/.rechazar()/.retirar()`.
- ❌ Use cases (`InscribirEstudianteUseCase`, `CerrarActaUseCase`).
- ❌ Repositorios como interfaces (`IInscripcionRepository`).
- ❌ Reimplementar reglas de negocio en la UI.

**Se hace:**
- ✅ `lib/transitions.ts` — tabla de transiciones + `canTransition(from, to)`.
- ✅ `lib/prerequisites.ts` — `checkPrerequisites(estudianteId, cursoId)`.
- ✅ `lib/quota.ts` — `decrementQuotaAtomically(grupoId)`.
- ✅ `lib/grades.ts` — `validateGrade(n)`, `computeFinal(evaluaciones, notas)`.
- ✅ `lib/session.ts` — cookie mock.

En el backend real, estas reglas se implementan en SQL (constraints, transacciones, triggers, CTEs). El frontend **nunca** las reimplementa — solo lee `estado` y muestra UI.

---

## 6. Estructura de carpetas

```
apps/UI/
├── docs/
│   ├── design.md            ← este archivo
│   └── api-contract.md      ← endpoints REST
├── public/
│   └── mockServiceWorker.js ← generado por MSW (npx msw init)
├── src/
│   ├── api/
│   │   ├── client.ts            ← interface ApiClient + factory
│   │   ├── http.ts              ← axios instance + interceptors
│   │   ├── types.ts             ← DTOs (User, Grupo, Inscripcion, ...)
│   │   ├── schemas.ts           ← Zod (request/response)
│   │   └── mocks/
│   │       ├── browser.ts       ← setupWorker MSW
│   │       ├── db.ts            ← store en memoria + seed
│   │       ├── lib/
│   │       │   ├── transitions.ts
│   │       │   ├── prerequisites.ts
│   │       │   ├── quota.ts
│   │       │   ├── grades.ts
│   │       │   └── session.ts
│   │       └── handlers/        ← uno por recurso, delgados
│   ├── features/
│   │   ├── auth/
│   │   ├── estudiantes/
│   │   ├── docentes/
│   │   ├── coordinadores/
│   │   └── administrativos/
│   ├── components/
│   │   └── ui/                  ← shadcn primitives
│   ├── routes/
│   ├── lib/
│   ├── index.css                ← Tailwind v4 + design tokens
│   ├── App.tsx
│   └── main.tsx
├── .env.development             ← VITE_USE_MOCKS=true
├── .env.production              ← VITE_USE_MOCKS=false
├── .env.example                 ← plantilla
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 7. Design system

### Paleta (Tailwind v4 + OKLCH)

Tokens definidos en `src/index.css`. Modo claro por defecto, modo oscuro vía clase `.dark` en `<html>`.

**Light:**
| Token | Valor | Uso |
|---|---|---|
| `--background` | `oklch(0.9779 0.0042 56.3756)` | Fondo de página |
| `--foreground` | `oklch(0.2178 0 0)` | Texto principal |
| `--card` | `oklch(0.9779 0.0042 56.3756)` | Fondo de tarjetas |
| `--primary` | `oklch(0.4650 0.1470 24.9381)` | Acciones primarias (rojo-terracota) |
| `--secondary` | `oklch(0.9625 0.0385 89.0943)` | Secundarios (ámbar claro) |
| `--muted` | `oklch(0.9431 0.0068 53.4442)` | Texto/atenuados |
| `--accent` | `oklch(0.9619 0.0580 95.6174)` | Acentos |
| `--destructive` | `oklch(0.4437 0.1613 26.8994)` | Errores |
| `--border` | `oklch(0.9355 0.0324 80.9937)` | Bordes |
| `--ring` | `oklch(0.4650 0.1470 24.9381)` | Foco |

**Dark:** variables equivalentes con tonos invertidos (background oscuro, foreground claro, primary más saturado).

**Charts:** 5 colores chart-1..5 ya definidos para reportes.

### Tipografía

- **Sans (UI general):** Poppins
- **Serif (títulos académicos, reportes):** Libre Baskerville
- **Mono (códigos, IDs, datos tabulares):** IBM Plex Mono

Carga vía `@fontsource/*` (npm, sin CDN externo).

### Otros tokens

- **Radius:** `0.375rem` (sm/md derivan: `radius - 4px`, `radius - 2px`; lg = radius; xl = `radius + 4px`).
- **Sombras:** sistema con `--shadow-color: hsl(0 63% 18%)` y opacidad variable (xs..2xl).
- **Spacing:** `0.25rem` base.
- **Dark mode:** toggle manual en la topbar (ícono sol/luna). Default: claro.

---

## 8. Modelo de dominio

### Entidades

| Entidad | Campos clave |
|---|---|
| **Usuario** | `id`, `nombre`, `email`, `rol: 'estudiante'\|'docente'\|'administrativo'\|'coordinador'`, `programaIds: string[]` (relevante para coord), `activo: boolean` |
| **Programa** | `id`, `nombre`, `codigo` |
| **Curso** | `id`, `codigo`, `nombre`, `creditos`, `programaId`, `prerrequisitos: string[]` (IDs de cursos) |
| **Período académico** | `id`, `nombre`, `tipo: 'semestral'\|'cuatrimestral'\|'anual'`, `fechaInicio`, `fechaFinInscripcion`, `fechaFinClases`, `estado: 'borrador'\|'activo'\|'cerrado'` |
| **Grupo (paralelo)** | `id`, `cursoId`, `periodoId`, `docenteId`, `horario: { dia: 1..7, inicio: HH:mm, fin: HH:mm }[]`, `cupo: number`, `cupoDisponible: number`, `aula`, `actaCerrada: boolean`, `motivoReapertura?: string` |
| **Inscripción** | `id`, `estudianteId`, `grupoId`, `periodoId`, `estado: 'solicitada'\|'aprobada'\|'rechazada'\|'activa'\|'retirada'\|'aprobada_final'\|'reprobada_final'\|'cancelada'`, `intentos: number`, `motivoRechazo?: string`, `createdAt` |
| **Evaluación** | `id`, `grupoId`, `nombre`, `peso: number` (0-100), `fecha?` |
| **Calificación** | `id`, `inscripcionId`, `evaluacionId`, `nota: number` (0-100), `createdAt` |
| **Asistencia** | `id`, `inscripcionId`, `fecha`, `estado: 'presente'\|'ausente'\|'tarde'\|'justificado'` |

### Relaciones

- `Programa 1—N Curso`
- `Curso N—N Curso` (prerrequisitos)
- `Curso 1—N Grupo`
- `Periodo 1—N Grupo`
- `Grupo N—1 Docente (Usuario)`
- `Grupo 1—N Inscripcion`
- `Grupo 1—N Evaluacion`
- `Inscripcion 1—N Calificacion`
- `Inscripcion 1—N Asistencia`

---

## 9. Reglas de negocio

| # | Regla | Implementación SQL (backend) | Mock |
|---|---|---|---|
| 1 | Prerrequisitos | CTE: `EXISTS` por cada prereq con inscripción `aprobada_final` | `lib/prerequisites.ts` |
| 2 | Sin choque de horario | Función SQL `has_schedule_conflict(estudianteId, grupoId)` | Check inline en handler |
| 3 | Cupo atómico | `UPDATE grupos SET cupoDisponible = cupoDisponible - 1 WHERE id = ? AND cupoDisponible > 0 RETURNING cupoDisponible` | `lib/quota.ts` (JS single-threaded) |
| 4 | Ventana de inscripción | Check `fechaInicio ≤ NOW() ≤ fechaFinInscripcion` del período | Check de fechas en handler |
| 5 | Período activo | Check `estado = 'activo'` del período | Check en handler |
| 6 | Cierre de acta | Trigger `BEFORE UPDATE ON calificaciones WHEN OLD.acta_cerrada = true → RAISE EXCEPTION` | `grades.ts` valida `actaCerrada` |
| 7 | Alcance por rol | RLS policies en Postgres (Insforge las soporta) | Filtros en MSW handlers |
| 8 | Soft delete de usuarios | `activo: boolean` en usuarios, JOIN filtra inactivos | Filtro en `db.ts` |

---

## 10. Máquina de estados — Inscripción

### Estados

`solicitada` · `aprobada` · `rechazada` · `activa` · `retirada` · `aprobada_final` · `reprobada_final` · `cancelada`

### Transiciones válidas

| Desde | Hacia | Acción | Quién |
|---|---|---|---|
| `solicitada` | `aprobada` | `POST /inscripciones/:id/aprobar` | coord (programa dueño) o admin |
| `solicitada` | `rechazada` | `POST /inscripciones/:id/rechazar` | coord o admin |
| `aprobada` | `activa` | Automático al iniciar período | sistema |
| `activa` | `retirada` | `POST /inscripciones/:id/retirar` | estudiante dueño |
| `activa` | `aprobada_final` | `POST /grupos/:id/cerrar-acta` (nota ≥ 70) | docente del grupo |
| `activa` | `reprobada_final` | `POST /grupos/:id/cerrar-acta` (nota < 70) | docente del grupo |
| `activa` | `cancelada` | Cancelación administrativa | admin |
| `retirada` | `activa` | Re-ingreso (valida cupo + período) | estudiante dueño |
| `rechazada` | `solicitada` | Re-solicitud (intentos < 3) | estudiante dueño |

### Estados terminales

`aprobada_final` · `reprobada_final` · `cancelada`

### Reglas adicionales

- **Reintentos:** máximo **3 intentos** por grupo. Cuando `intentos >= 3`, nueva solicitud al mismo grupo → `409 max_intentos_exceeded`.
- **Recursar prohibido:** si existe Inscripción `aprobada_final` para `(estudianteId, cursoId)`, no se permiten nuevas inscripciones a ese curso.
- **Reabrir acta:** docente puede reabrir con `POST /grupos/:id/reabrir-acta { motivo: string }` (obligatorio). Esto desbloquea la edición de calificaciones.

---

## 11. Pantallas (mockups)

### Login (común)
- Inputs: email, password.
- Acción: `POST /auth/login` → setea cookie `Session`.
- Errores: 401 (credenciales), 422 (formato).
- Tras éxito: redirige al layout del rol.

### Layout por rol
- Sidebar con navegación específica del rol.
- Topbar: nombre del usuario, selector de rol (solo en modo mock para demos), toggle de tema.
- Área de contenido: rutas del rol.

### Selector de rol mock
- Solo visible cuando `VITE_USE_MOCKS === true`.
- Lista de usuarios seed (uno por rol) para alternar identidad sin re-login.
- Útil para demos y tests manuales.

### Estudiante
| Pantalla | Endpoint | Muestra |
|---|---|---|
| **Mis cursos** | `GET /inscripciones?estudianteId=me` | Lista de grupos inscritos con: curso, docente, horario, créditos, estado de inscripción. |
| **Calificaciones** | `GET /calificaciones?inscripcionId=X` | Tabla de evaluaciones + nota + nota final calculada. |

### Docente
| Pantalla | Endpoint | Muestra |
|---|---|---|
| **Mis grupos** | `GET /grupos?docenteId=me` | Lista de grupos activos con: curso, período, cantidad de estudiantes, estado del acta. |
| **Calificar grupo** | `GET /grupos/:id` + `GET /calificaciones?grupoId=X` | Tabla de estudiantes × evaluaciones con inputs editables. Botón guardar batch. Acciones: cerrar acta / reabrir acta. |

### Coordinador
| Pantalla | Endpoint | Muestra |
|---|---|---|
| **Gestión de grupos** | `GET /grupos?programaId=me` | Tabla con crear/editar grupos. Filtros por período y curso. |
| **Reportes** | `GET /reportes/resumen?programaId&periodoId` | Cards de resumen + gráfico de distribución de notas + % deserción. |

### Administrativo
| Pantalla | Endpoint | Muestra |
|---|---|---|
| **Usuarios** | `GET /usuarios?rol&programaId` | Tabla con CRUD completo. Alta/baja. |
| **Períodos académicos** | `GET /periodos` | Lista con crear/cambiar estado. |

---

## 12. Fuera de alcance (YAGNI)

- Backend real (vive en otro app del monorepo).
- Mobile (aditivo futuro).
- Material del curso (archivos) — Insforge provee buckets, no se usan aún.
- Recuperación de contraseña.
- Notificaciones in-app (email, push).
- Tema oscuro completo y accesibilidad AA — solo toggle mínimo viable.
- Tests E2E hasta que el flujo esté estable.
- Tests unitarios solo para `lib/transitions.ts` y `lib/prerequisites.ts` (las reglas que el backend real va a reimplementar en SQL).

---

## 13. Fases de entrega

1. **Fase 1 — Docs** ← en curso
2. **Fase 2 — Esqueleto:** deps, Router, layout base, `ApiClient` con factory, MSW, TanStack Query, login mock con cookie.
3. **Fase 3 — Login + layout por rol** + selector de rol mock.
4. **Fase 4 — Mockups de los 4 roles** en paralelo (1 pantalla por rol).
5. **Fase 5 — Deploy agnóstico** (Vercel + Oracle): scripts, env vars, README de deploy.
6. **Fase 6 (aditivo futuro) — Mobile.**
7. **Fase 7 (aditivo futuro) — Tauri:** retomar `src-tauri/`, ajustes de `tauri.conf.json`, build desktop.