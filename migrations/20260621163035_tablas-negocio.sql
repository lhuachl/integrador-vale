-- Migration: tablas-negocio

-- 1. Crear todas las tablas primero
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

CREATE TABLE public.evaluaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id UUID NOT NULL REFERENCES public.grupos(id),
  nombre TEXT NOT NULL,
  peso INTEGER NOT NULL CHECK (peso > 0 AND peso <= 100),
  fecha DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_evaluaciones_grupo ON public.evaluaciones(grupo_id);

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

-- 2. RLS policies
ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY grupos_select ON public.grupos
  FOR SELECT TO authenticated USING (true);

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

CREATE POLICY inscripciones_estudiante_select ON public.inscripciones
  FOR SELECT TO authenticated
  USING (estudiante_id = auth.uid());

CREATE POLICY inscripciones_docente_select ON public.inscripciones
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.grupos g WHERE g.id = grupo_id AND g.docente_id = auth.uid()
    )
  );

CREATE POLICY inscripciones_coordinador_select ON public.inscripciones
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('administrativo', 'coordinador'))
  );

CREATE POLICY inscripciones_estudiante_insert ON public.inscripciones
  FOR INSERT TO authenticated
  WITH CHECK (estudiante_id = auth.uid());

CREATE POLICY evaluaciones_select ON public.evaluaciones
  FOR SELECT TO authenticated USING (true);

CREATE POLICY evaluaciones_docente_all ON public.evaluaciones
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.grupos g WHERE g.id = grupo_id AND g.docente_id = auth.uid()
    )
  );

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
