# Avior SIU — UI

Cliente web (Vite + React 19 + TypeScript + Tailwind v4) que consume el backend vía HTTP. Mockeado con MSW en desarrollo.

## Setup

```bash
pnpm install
pnpm dev          # dev server (mocks activos)
pnpm build        # tsc + vite build
```

## Variables de entorno

| Variable | Valores | Descripción |
|---|---|---|
| `VITE_USE_MOCKS` | `true` / `false` | Si `true`, arranca MSW antes de la app |
| `VITE_API_URL` | URL | Base del backend (cuando `VITE_USE_MOCKS=false`) |

Plantilla en `.env.example`. Defaults en `.env.development` y `.env.production`.

## Estructura

```
src/
├── api/              ← ApiClient interface, http (axios), types, Zod
│   └── mocks/        ← MSW handlers, db en memoria, helpers de reglas
├── components/layout/ ← AppLayout (sidebar + topbar)
├── routes/           ← LoginPage + PlaceholderPage
├── index.css         ← Tailwind v4 + design tokens
├── App.tsx           ← Router + QueryClientProvider
└── main.tsx          ← Boot MSW (en mock) + render
```

## Cuentas mock

| Rol | Email | Password |
|---|---|---|
| Estudiante | `ana@uni.edu` | `estudiante123` |
| Docente | `dario@uni.edu` | `docente123` |
| Coordinador | `carlos@uni.edu` | `coord123` |
| Administrativo | `lucia@uni.edu` | `admin123` |

## Documentación

- [docs/design.md](./docs/design.md) — visión, actores, reglas de negocio, design system.
- [docs/api-contract.md](./docs/api-contract.md) — endpoints REST, payloads, errores, SQL de reglas.

## Estado

Fase 2 — Esqueleto. Login funcional, layout por rol, 8 placeholders. Próxima fase: mockups navegables por rol.