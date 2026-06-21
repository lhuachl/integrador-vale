# AGENTS.md — Avior SIU (apps/UI)

## Stack

```
React 19 · Vite 7 · TypeScript (strict)
Routing:     React Router v7
Server state: TanStack Query v5
HTTP:        axios (withCredentials)
Forms:       React Hook Form + Zod
UI:          Tailwind v4 + shadcn/ui (Radix Nova) + lucide-react
Fonts:       @fontsource/poppins · libre-baskerville · ibm-plex-mono
Animations:  @react-bits/Hyperspeed-TS-CSS · @react-bits/BorderGlow-TS-CSS
Mocks:       mockClient.ts en memoria (NO MSW service worker)
Package:     pnpm
```

## Reglas de diseño

### Visual language: Dark glass (default) + Light paper-like

| Modo | Estilo |
|---|---|
| **Dark** (default) | Glass sobre negro profundo. Sidebar `bg-sidebar` semi-transparente, blur-xl. Cards `bg-card` con opacidad 45%. |
| **Light** | Cremoso paper-like con neumorfismo. Fondo `oklch(0.955 0.012 75)`. Cards con `card-neumorf` (dual shadow: luz + sombra). Sidebar con `card-neumorf-sm`. |

### Paleta OKLCH (definida en `src/index.css`)

| Token | Light | Dark |
|---|---|---|
| `--background` | `oklch(0.9550 0.0120 75.0)` | `oklch(0.1600 0.0080 60.0)` |
| `--foreground` | `oklch(0.2200 0.0180 60.0)` | `oklch(0.9699 0.0013 106.4)` |
| `--card` | `oklch(0.9400 0.0140 78.0)` | `oklch(0.2200 0.0100 60.0 / 0.45)` |
| `--primary` | `oklch(0.4650 0.1470 24.9)` | `oklch(0.5054 0.1905 27.5)` |
| `--border` | `oklch(0.8800 0.0180 78.0)` | `oklch(0.3000 0.0100 60.0)` |
| `--muted-foreground` | `oklch(0.5500 0.0200 65.0)` | `oklch(0.7500 0.0100 60.0)` |

`--shadow-light: oklch(1.0 0 0)` y `--shadow-dark: oklch(0.8 0.03 70 / 0.35)` en light; ambos `transparent` en dark.

### Utilitarios neumorf

- `card-neumorf` — dual shadow -8/+8 px para cards elevadas
- `card-neumorf-sm` — dual shadow -4/+4 px para sidebar
- `card-neumorf-inset` — inset shadow para inputs
- `glass-card` — `bg-background/30 backdrop-blur-xl border-white/10` (dark)
- `glass-card-solid` — `bg-white/5 backdrop-blur-xl border-white/10` (dark)
- `neumorf-input` — inset dual shadow, sin border

### Tipografía

- **Sans (UI general):** Poppins
- **Serif (títulos académicos, headings):** Libre Baskerville
- **Mono (códigos, IDs, datos tabulares):** IBM Plex Mono

### Componentes UI (`src/components/ui/`)

| Componente | Props |
|---|---|
| `PageHeader` | `titulo, descripcion?, acciones?` |
| `DataTable<T>` | `columns: {key, label, render?}[], rows, empty?` |
| `EmptyState` | `icon?, titulo, descripcion, accion?` |
| `LoadingState` | `mensaje?` |
| `ErrorState` | `error, onRetry?` |
| `Badge` | `variant: default\|success\|warning\|destructive\|info\|muted` |
| `BadgeEstadoInscripcion` | `estado, motivoRechazo?` |
| `StatCard` | `label, valor, icon?` |

### API Client

`src/api/client.ts` exporta `api` que es `HttpApiClient` o `MockApiClient` según `VITE_USE_MOCKS`. En mocks (`VITE_USE_MOCKS=true`), el `MockApiClient` usa un módulo en memoria en `src/api/mocks/mockClient.ts`. Los mocks tienen delays simulados.

### Login (BorderGlow card)

El card del login usa `BorderGlow` con `animated={true}`:
- `backgroundColor="#0c0905"` (negro cálido)
- `glowColor="15 75 44"` (HSL del primary OKLCH)
- `colors=[hsl(15 75% 44%), hsl(43 90% 59%), hsl(26 59% 36%)]` (terracota + ámbar + marrón)

Los inputs usan iconos internos (`Mail`, `Lock`) y toggle de contraseña (`Eye`, `EyeOff`).

### Rutas

```
/login
/estudiante/cursos           ← implementada (EstudianteCursosPage)
/estudiante/calificaciones    ← placeholder
/docente/grupos               ← placeholder
/docente/grupos/:grupoId      ← placeholder
/coordinador/grupos           ← placeholder
/coordinador/reportes         ← placeholder
/administrativo/usuarios      ← placeholder
/administrativo/periodos      ← placeholder
```

## Modelo de datos (DTOs en `src/api/types.ts`)

```
Usuario, Programa, Curso, Periodo, Grupo, Inscripcion, Evaluacion, Calificacion, Asistencia
```

## Máquina de estados — Inscripción

```
solicitada → aprobada | rechazada
aprobada   → activa
activa     → retirada | aprobada_final | reprobada_final | cancelada
retirada   → activa
rechazada  → solicitada  (retry, max 3 intentos por grupo)
```

## Reglas de negocio clave

1. Prerrequisitos: estudiante debe tener inscripción `aprobada_final` de cada prerrequisito
2. Cupo atómico: `UPDATE grupos SET cupoDisponible = cupoDisponible - 1 WHERE id = ? AND cupoDisponible > 0`
3. Sin choque de horario entre inscripciones activas
4. Ventana de inscripción: `[fechaInicio, fechaFinInscripcion]` del período
5. Cierre de acta: docente cierra → calificaciones inmutables salvo reabertura con `POST /grupos/:id/reabrir-acta { motivo }`

## Errores del API (códigos)

`invalid_credentials` · `session_expired` · `forbidden_role` · `forbidden_scope` · `not_found` · `cupo_lleno` · `invalid_transition` · `max_intentos_exceeded` · `already_approved_course` · `schedule_conflict` · `inscription_window_closed` · `periodo_not_active` · `missing_prerequisites` · `acta_cerrada` · `evaluation_weights_invalid` · `validation_error`

## Base de datos mock (seed completa)

| Tabla | Data |
|---|---|
| Programas | 2 (ING-INF, ARQ) |
| Cursos | 10 (Álgebra, Cálculo I, Programación I, Física I, Ecuaciones Diferenciales, Estructuras de Datos, Inglés Técnico, Dibujo Técnico, Taller de Diseño, Materiales) |
| Períodos | 2 (2024-2 cerrado, 2025-1 activo) |
| Grupos | 12 (8 en 2025-1, 4 en 2024-2) |
| Inscripciones estudiante seed | 9 (3 activas, 2 solicitadas, 1 aprobada_final, 1 reprobada_final, 1 retirada, 1 rechazada) |
| Usuarios | 7 (4 seed + 2 estudiantes extra + 1 docente extra) |

## Cuentas mock (seed en `src/api/mocks/db.ts`)

| Rol | Email | Password |
|---|---|---|
| Estudiante | `ana@uni.edu` | `estudiante123` |
| Docente | `dario@uni.edu` | `docente123` |
| Coordinador | `carlos@uni.edu` | `coord123` |
| Administrativo | `lucia@uni.edu` | `admin123` |

## Endpoints mock disponibles

| Ruta | Método | Mock |
|---|---|---|
| `/auth/login` | POST | mockClient.ts → login |
| `/auth/logout` | POST | mockClient.ts → logout |
| `/auth/me` | GET | mockClient.ts → me |
| `/usuarios` | GET | mockClientWrapper.ts → usuarios.list |
| `/inscripciones/mis` | GET | mockClient.ts → misInscripciones |

## Instalar y correr

```bash
pnpm install
pnpm dev          # VITE_USE_MOCKS=true por defecto en .env.development
pnpm build         # tsc + vite build
```

## Fuera de alcance

- Backend real (Insforge/Postgres) — consumirÃ¡ `apps/UI` via HTTP cuando exista
- Mobile — aditivo futuro
- Tauri desktop — `src-tauri/` inerte, se retomarÃ¡ al final
- shadcn/ui completo — solo Button por ahora
- Tests E2E hasta flujo estable
