# Setup InsForge — Avior SIU

> Paso a paso para desplegar el backend de Avior SIU en InsForge.

---

## Prerrequisitos

```bash
# CLI de InsForge
npm install -g @insforge/cli

# Autenticarse
npx @insforge/cli login
```

---

## 1. Vincular proyecto existente

```bash
# Desde la raíz del monorepo (o donde quieras el backend)
npx @insforge/cli link

# Seleccionar proyecto "av-siu" (si no existe, crearlo)
npx @insforge/cli current  # verificar que está linkeado
```

Esto crea `.insforge/project.json` con:

```json
{
  "project_id": "e0a663d4-efb4-4a99-87e8-b5dc2b690a9f",
  "app_key": "yj3acv2g",
  "region": "us-east",
  "backend_url": "https://yj3acv2g.insforge.app",
  "api_key": "..."
}
```

---

## 2. Configurar auth y despliegue

```bash
# Exportar configuración actual
npx @insforge/cli config export --out insforge.toml
```

Editar `insforge.toml`:

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

[deployments]
subdomain = "av-siu"
```

Aplicar:

```bash
npx @insforge/cli config apply --file insforge.toml
```

---

## 3. Migraciones de base de datos

Crear y aplicar migraciones en orden:

### 3.1 Tablas base (programas, cursos, periodos)

```bash
npx @insforge/cli db migrations new create-programas
# Escribir migrations/<timestamp>_create-programas.sql con DDL de programas, cursos, periodos
npx @insforge/cli db migrations up --all
```

### 3.2 Tablas de negocio (grupos, inscripciones, evaluaciones, calificaciones, asistencias)

```bash
npx @insforge/cli db migrations new create-grupos
# Escribir migrations/<timestamp>_create-grupos.sql con DDL de grupos, inscripciones, evaluaciones, calificaciones, asistencias
npx @insforge/cli db migrations up --all
```

### 3.3 Triggers y funciones

```bash
npx @insforge/cli db migrations new create-triggers
# Escribir migrations/<timestamp>_create-triggers.sql con triggers y funciones helper
npx @insforge/cli db migrations up --all
```

**Contenido de cada migración:** ver `docs/insforge-schema.md`.

---

## 4. Seed data

```bash
npx @insforge/cli db query "$(cat docs/insforge-seed.sql)"
```

O crear una migración de seed:

```bash
npx @insforge/cli db migrations new seed-data
# Copiar contenido de docs/insforge-seed.md al archivo
npx @insforge/cli db migrations up --all
```

Ver `docs/insforge-seed.md` para el SQL completo.

---

## 5. Desplegar Edge Functions

### 5.1 Auth functions

```bash
mkdir -p functions/auth-login
cat > functions/auth-login/index.ts << 'EOF'
// Edge Function para login
// Ver docs/insforge-auth.md para el código completo
EOF

npx @insforge/cli functions deploy auth-login --file functions/auth-login/index.ts
```

Repetir para `auth-me`, `auth-logout`.

### 5.2 Business functions

```bash
# Crear estructura
mkdir -p functions/{usuarios-list,usuarios-create,grupos-mis,inscripciones-mis,...}

# Desplegar cada una
for fn in funciones/*/; do
  slug=$(basename "$fn")
  npx @insforge/cli functions deploy "$slug" --file "$fn/index.ts"
done
```

### 5.3 Lista completa de funciones a desplegar

Ver `docs/insforge-api-routes.md` para la especificación de cada una.

---

## 6. Configurar frontend

### 6.1 Variables de entorno del frontend

```bash
# .env.development.local (no committear)
VITE_USE_MOCKS=false
VITE_API_URL=https://yj3acv2g.insforge.app
```

O en el dashboard de Vercel para producción:

```
VITE_USE_MOCKS=false
VITE_API_URL=https://av-siu.insforge.app
```

### 6.2 Verificar conexión

```bash
pnpm dev
# Abrir http://localhost:1420
# Login con ana@uni.edu / estudiante123
# Debería redirigir al dashboard de estudiante
```

---

## 7. Diagnóstico

```bash
# Ver logs de Edge Function
npx @insforge/cli logs function.logs --limit 50

# Health check completo
npx @insforge/cli diagnose

# Ver migraciones aplicadas
npx @insforge/cli db migrations list

# Consulta directa a la DB
npx @insforge/cli db query "SELECT count(*) FROM usuarios" --json
```

---

## 8. Orden recomendado de implementación

| Paso | Componente | Depende de |
|---|---|---|
| 1 | Vincular proyecto + config auth | — |
| 2 | Migraciones: tablas base (programas, cursos, periodos, usuarios) | paso 1 |
| 3 | Migraciones: tablas de negocio (grupos, inscripciones, evaluaciones, calificaciones, asistencias) | paso 2 |
| 4 | Migraciones: triggers y funciones | paso 3 |
| 5 | Seed data | paso 4 |
| 6 | Edge Functions: auth (login, logout, me) | paso 4 |
| 7 | Edge Functions: usuario (estudiante endpoints) | paso 6 |
| 8 | Edge Functions: docente (calificar, asistencia, evaluaciones) | paso 6 |
| 9 | Edge Functions: coordinador (grupos, reportes, estudiantes) | paso 6 |
| 10 | Edge Functions: admin (usuarios CRUD, periodos CRUD, dashboard) | paso 6 |
| 11 | Configurar frontend (VITE_USE_MOCKS=false) | paso 10 |
| 12 | Probar flujo completo | paso 11 |

---

## 9. Variables de entorno del backend (secrets)

```bash
# Service key para admin API de auth
npx @insforge/cli secrets add INSFORGE_SERVICE_KEY <value>
```
