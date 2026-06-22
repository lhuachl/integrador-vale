-- Migration: tablas-base

-- 1. Crear todas las tablas primero
CREATE TABLE public.programas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

-- 2. RLS policies
ALTER TABLE public.programas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periodos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY programas_select ON public.programas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY programas_admin_insert ON public.programas
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'administrativo'));

CREATE POLICY cursos_select ON public.cursos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY cursos_insert ON public.cursos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('administrativo', 'coordinador'))
  );

CREATE POLICY periodos_select ON public.periodos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY periodos_admin_all ON public.periodos
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'administrativo'));

CREATE POLICY usuarios_self_select ON public.usuarios
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY usuarios_admin_select ON public.usuarios
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'administrativo' AND activo = true)
  );

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
