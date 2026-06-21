# Schema InsForge — Avior SIU

> Contrato de base de datos para implementar en InsForge (PostgreSQL 15+).
> Convenciones: snake_case, UUIDs, timestamptz, RLS en todas las tablas públicas.

---

## 1. Convenciones

| Aspecto | Regla |
|---------|-------|
| Nombres | `snake_case`, plural |
| PKs | `UUID DEFAULT gen_random_uuid()` |
| FKs | `UUID REFERENCES tabla(id)` con `ON DELETE` según semántica |
| Timestamps | `TIMESTAMPTZ NOT NULL DEFAULT now()` |
| Soft delete | columna `activo BOOLEAN NOT NULL DEFAULT true` |
| RLS | toda tabla pública tiene `ENABLE ROW LEVEL SECURITY` |
| Grants | `authenticated` tiene DML genérico, RLS decide filas |

---

## 2. Tablas

### 2.1 `usuarios`

```sql
CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  rol TEXT NOT NULL CHECK (rol IN ('estudiante', 'docente', 'coordinador', 'administrativo')),
  programa_ids UUID[] NOT NULL DEFAULT '{}',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Cada usuario ve su propia fila
CREATE POLICY usuarios_self_select ON public.usuarios
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));

-- Admin ve todos los usuarios activos
CREATE POLICY usuarios_admin_select ON public.usuarios
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'administrativo' AND activo = true)
  );

-- Admin puede crear/actualizar/eliminar
CREATE POLICY usuarios_admin_insert ON public.usuarios
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'administrativo' AND activo = true)
  );

CREATE POLICY usuarios_admin_update ON public.usuarios
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'administrativo' AND activo = true)
  );
```

### 2.2 `programas`

```sql
CREATE TABLE public.programas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.programas ENABLE ROW LEVEL SECURITY;

-- Todos los autenticados pueden leer programas
CREATE POLICY programas_select ON public.programas
  FOR SELECT TO authenticated
  USING (true);

-- Solo admin puede modificar
CREATE POLICY programas_admin_insert ON public.programas
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'administrativo'));
```

### 2.3 `cursos`

```sql
CREATE TABLE public.cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  creditos INTEGER NOT NULL CHECK (creditos > 0),
  programa_id UUID NOT NULL REFERENCES public.programas(id),
  prerrequisitos UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_cursos_codigo_programa ON public.cursos(codigo, programa_id);

ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;

CREATE POLICY cursos_select ON public.cursos
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY cursos_insert ON public.cursos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('administrativo', 'coordinador'))
  );
```

### 2.4 `periodos`

```sql
CREATE TABLE public.periodos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('semestral', 'cuatrimestral', 'anual')),
  fecha_inicio DATE NOT NULL,
  fecha_fin_inscripcion DATE NOT NULL,
  fecha_fin_clases DATE NOT NULL,
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'activo', 'cerrado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_fechas CHECK (fecha_inicio < fecha_fin_inscripcion AND fecha_fin_inscripcion < fecha_fin_clases)
);

ALTER TABLE public.periodos ENABLE ROW LEVEL SECURITY;

CREATE POLICY periodos_select ON public.periodos
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY periodos_admin_all ON public.periodos
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'administrativo'));
```

### 2.5 `grupos`

```sql
CREATE TABLE public.grupos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID NOT NULL REFERENCES public.cursos(id),
  periodo_id UUID NOT NULL REFERENCES public.periodos(id),
  docente_id UUID NOT NULL REFERENCES public.usuarios(id),
  horario JSONB NOT NULL,
  cupo INTEGER NOT NULL CHECK (cupo > 0),
  cupo_disponible INTEGER NOT NULL CHECK (cupo_disponible >= 0),
  aula TEXT NOT NULL,
  acta_cerrada BOOLEAN NOT NULL DEFAULT false,
  motivo_reapertura TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_grupos_periodo ON public.grupos(periodo_id);
CREATE INDEX idx_grupos_docente ON public.grupos(docente_id);
CREATE INDEX idx_grupos_curso ON public.grupos(curso_id);

ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;

CREATE POLICY grupos_select ON public.grupos
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY grupos_insert ON public.grupos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('administrativo', 'coordinador'))
  );

CREATE POLICY grupos_update ON public.grupos
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('administrativo', 'coordinador'))
  );
```

### 2.6 `inscripciones`

```sql
CREATE TABLE public.inscripciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id UUID NOT NULL REFERENCES public.usuarios(id),
  grupo_id UUID NOT NULL REFERENCES public.grupos(id),
  periodo_id UUID NOT NULL REFERENCES public.periodos(id),
  estado TEXT NOT NULL DEFAULT 'solicitada' CHECK (estado IN (
    'solicitada', 'aprobada', 'rechazada', 'activa',
    'retirada', 'aprobada_final', 'reprobada_final', 'cancelada'
  )),
  intentos INTEGER NOT NULL DEFAULT 1 CHECK (intentos >= 1 AND intentos <= 3),
  motivo_rechazo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inscripciones_estudiante ON public.inscripciones(estudiante_id);
CREATE INDEX idx_inscripciones_grupo ON public.inscripciones(grupo_id);
CREATE INDEX idx_inscripciones_periodo ON public.inscripciones(periodo_id);
CREATE INDEX idx_inscripciones_estado ON public.inscripciones(estado);

ALTER TABLE public.inscripciones ENABLE ROW LEVEL SECURITY;

-- Estudiante ve solo sus propias inscripciones
CREATE POLICY inscripciones_estudiante_select ON public.inscripciones
  FOR SELECT TO authenticated
  USING (estudiante_id = auth.uid());

-- Docente ve inscripciones de sus grupos
CREATE POLICY inscripciones_docente_select ON public.inscripciones
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.grupos g
      WHERE g.id = grupo_id AND g.docente_id = auth.uid()
    )
  );

-- Coordinador/admin ven todas
CREATE POLICY inscripciones_coordinador_select ON public.inscripciones
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('administrativo', 'coordinador'))
  );

-- Estudiante crea solicitudes
CREATE POLICY inscripciones_estudiante_insert ON public.inscripciones
  FOR INSERT TO authenticated
  WITH CHECK (estudiante_id = auth.uid());

-- Transiciones de estado via Edge Function (no insert/update directo)
```

### 2.7 `evaluaciones`

```sql
CREATE TABLE public.evaluaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id UUID NOT NULL REFERENCES public.grupos(id),
  nombre TEXT NOT NULL,
  peso INTEGER NOT NULL CHECK (peso > 0 AND peso <= 100),
  fecha DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_evaluaciones_grupo ON public.evaluaciones(grupo_id);

ALTER TABLE public.evaluaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY evaluaciones_select ON public.evaluaciones
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY evaluaciones_docente_all ON public.evaluaciones
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.grupos g
      WHERE g.id = grupo_id AND g.docente_id = auth.uid()
    )
  );
```

### 2.8 `calificaciones`

```sql
CREATE TABLE public.calificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscripcion_id UUID NOT NULL REFERENCES public.inscripciones(id),
  evaluacion_id UUID NOT NULL REFERENCES public.evaluaciones(id),
  nota NUMERIC(5,2) NOT NULL CHECK (nota >= 0 AND nota <= 20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uniq_inscripcion_evaluacion UNIQUE (inscripcion_id, evaluacion_id)
);

CREATE INDEX idx_calificaciones_inscripcion ON public.calificaciones(inscripcion_id);
CREATE INDEX idx_calificaciones_evaluacion ON public.calificaciones(evaluacion_id);

ALTER TABLE public.calificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY calificaciones_estudiante_select ON public.calificaciones
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.inscripciones i
      WHERE i.id = inscripcion_id AND i.estudiante_id = auth.uid()
    )
  );

CREATE POLICY calificaciones_docente_all ON public.calificaciones
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.inscripciones i
      JOIN public.grupos g ON g.id = i.grupo_id
      WHERE i.id = inscripcion_id AND g.docente_id = auth.uid()
    )
  );
```

### 2.9 `asistencias`

```sql
CREATE TABLE public.asistencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscripcion_id UUID NOT NULL REFERENCES public.inscripciones(id),
  fecha DATE NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('presente', 'ausente', 'tarde', 'justificado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uniq_inscripcion_fecha UNIQUE (inscripcion_id, fecha)
);

CREATE INDEX idx_asistencias_inscripcion ON public.asistencias(inscripcion_id);
CREATE INDEX idx_asistencias_fecha ON public.asistencias(fecha);
CREATE INDEX idx_asistencias_grupo_fecha ON public.asistencias(inscripcion_id, fecha);

ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY asistencias_estudiante_select ON public.asistencias
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.inscripciones i
      WHERE i.id = inscripcion_id AND i.estudiante_id = auth.uid()
    )
  );

CREATE POLICY asistencias_docente_all ON public.asistencias
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.inscripciones i
      JOIN public.grupos g ON g.id = i.grupo_id
      WHERE i.id = inscripcion_id AND g.docente_id = auth.uid()
    )
  );
```

### 2.10 `programa_usuarios` (relación N:M programa-usuario)

No es necesaria — `usuarios.programa_ids` (array UUID) cubre la relación.

---

## 3. Triggers y funciones helper

### 3.1 Sincronizar auth.users → usuarios al crear cuenta

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (auth_user_id, nombre, email, rol, programa_ids)
  VALUES (
    NEW.id,
    COALESCE(NEW.profile->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.profile->>'rol', 'estudiante'),
    COALESCE(
      (SELECT array_agg(unnest) FROM unnest(
        COALESCE((NEW.profile->>'programa_ids')::UUID[], '{}'::UUID[])
      )),
      '{}'::UUID[]
    )
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 3.2 Validar transiciones de estado en inscripciones

```sql
CREATE OR REPLACE FUNCTION public.validate_inscripcion_transition()
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
    RAISE EXCEPTION 'invalid_transition: de % a %', OLD.estado, NEW.estado;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inscripciones_transition_check
  BEFORE UPDATE ON public.inscripciones
  FOR EACH ROW
  WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
  EXECUTE FUNCTION public.validate_inscripcion_transition();
```

### 3.3 Bloquear edición si acta está cerrada

```sql
CREATE OR REPLACE FUNCTION public.prevent_edit_closed_acta()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT acta_cerrada FROM public.grupos WHERE id = NEW.grupo_id) THEN
    RAISE EXCEPTION 'acta_cerrada';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calificaciones_acta_check
  BEFORE INSERT OR UPDATE OR DELETE ON public.calificaciones
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_edit_closed_acta();

CREATE TRIGGER evaluaciones_acta_check
  BEFORE INSERT OR UPDATE OR DELETE ON public.evaluaciones
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_edit_closed_acta();
```

### 3.4 Actualizar `updated_at` automáticamente

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER usuarios_updated_at
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER inscripciones_updated_at
  BEFORE UPDATE ON public.inscripciones
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
```

---

## 4. Funciones de consulta (para Edge Functions o RPC)

### 4.1 Calcular nota final ponderada por estudiante

```sql
CREATE OR REPLACE FUNCTION public.calcular_nota_final(p_inscripcion_id UUID)
RETURNS NUMERIC(5,2) AS $$
DECLARE
  v_nota NUMERIC(5,2);
BEGIN
  SELECT COALESCE(
    SUM(c.nota * e.peso) / NULLIF(SUM(e.peso), 0),
    0
  ) INTO v_nota
  FROM public.calificaciones c
  JOIN public.evaluaciones e ON e.id = c.evaluacion_id
  WHERE c.inscripcion_id = p_inscripcion_id;

  RETURN ROUND(v_nota::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql STABLE;
```

### 4.2 Reportes KPI (coordinador)

```sql
CREATE OR REPLACE FUNCTION public.reportes_kpi(p_periodo_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_periodo_id UUID;
  result JSONB;
BEGIN
  IF p_periodo_id IS NULL THEN
    SELECT id INTO v_periodo_id FROM public.periodos WHERE estado = 'activo' LIMIT 1;
  ELSE
    v_periodo_id := p_periodo_id;
  END IF;

  IF v_periodo_id IS NULL THEN
    RETURN jsonb_build_object(
      'total_estudiantes', 0, 'promedio_general', 0,
      'tasa_aprobacion_general', 0, 'total_grupos', 0, 'total_retirados', 0
    );
  END IF;

  SELECT jsonb_build_object(
    'total_estudiantes', COUNT(DISTINCT i.estudiante_id),
    'promedio_general', ROUND(AVG(nota_data.nota)::NUMERIC, 2),
    'tasa_aprobacion_general', CASE WHEN COUNT(*) > 0 THEN ROUND(COUNT(*) FILTER (WHERE nota_data.nota >= 10) * 100.0 / COUNT(*)) ELSE 0 END,
    'total_grupos', (SELECT COUNT(*) FROM public.grupos WHERE periodo_id = v_periodo_id),
    'total_retirados', COUNT(*) FILTER (WHERE i.estado = 'retirada')
  )
  FROM public.inscripciones i
  LEFT JOIN LATERAL (
    SELECT public.calcular_nota_final(i.id) AS nota
  ) nota_data ON true
  WHERE i.periodo_id = v_periodo_id
  INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

---

## 5. Índices adicionales para performance

```sql
-- Búsqueda de choque de horario
CREATE INDEX idx_grupos_horario ON public.grupos USING GIN (horario);

-- Filtro rápido de usuarios por rol
CREATE INDEX idx_usuarios_rol ON public.usuarios(rol) WHERE activo = true;

-- Búsqueda de período activo
CREATE INDEX idx_periodos_activo ON public.periodos(estado) WHERE estado = 'activo';

-- Inscripciones activas por estudiante (choque de horario)
CREATE INDEX idx_inscripciones_activas ON public.inscripciones(estudiante_id, grupo_id) WHERE estado = 'activa';
```

---

## 6. Grants

```sql
-- Roles autenticados tienen DML genérico en tablas públicas
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- RLS decide el acceso fila por fila
```

---

## 7. Notas de implementación

| Aspecto | Detalle |
|---------|---------|
| Migraciones | Una migración por tabla + una para triggers/funciones |
| Seed data | Ver `insforge-seed.md` |
| RLS | No usar `FOR ALL`, preferir políticas específicas por operación |
| Funciones `SECURITY DEFINER` | Solo para funciones llamadas desde RLS o triggers que cruzan tablas |
| Conexión auth→usuario | `auth.users(id)` es el UUID de InsForge Auth; `usuarios.auth_user_id` lo referencia |
