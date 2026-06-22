-- Migration: triggers-funciones

-- 1. Sincronizar auth.users → usuarios al crear cuenta
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (auth_user_id, nombre, email, rol, programa_ids)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'rol', 'estudiante'),
    COALESCE(
      (SELECT array_agg(unnest) FROM unnest(
        COALESCE((NEW.raw_user_meta_data->>'programa_ids')::UUID[], '{}'::UUID[])
      )),
      '{}'::UUID[]
    )
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. Validar transiciones de estado en inscripciones
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

DROP TRIGGER IF EXISTS inscripciones_transition_check ON public.inscripciones;
CREATE TRIGGER inscripciones_transition_check
  BEFORE UPDATE ON public.inscripciones
  FOR EACH ROW
  WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
  EXECUTE FUNCTION public.validate_inscripcion_transition();

-- 3. Bloquear edición si acta está cerrada
CREATE OR REPLACE FUNCTION public.prevent_edit_closed_acta()
RETURNS TRIGGER AS $$
DECLARE
  v_grupo_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'calificaciones' THEN
    SELECT grupo_id INTO v_grupo_id FROM public.inscripciones WHERE id = NEW.inscripcion_id;
  ELSE
    v_grupo_id := NEW.grupo_id;
  END IF;

  IF (SELECT acta_cerrada FROM public.grupos WHERE id = v_grupo_id) THEN
    RAISE EXCEPTION 'acta_cerrada';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calificaciones_acta_check ON public.calificaciones;
CREATE TRIGGER calificaciones_acta_check
  BEFORE INSERT OR UPDATE OR DELETE ON public.calificaciones
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_edit_closed_acta();

DROP TRIGGER IF EXISTS evaluaciones_acta_check ON public.evaluaciones;
CREATE TRIGGER evaluaciones_acta_check
  BEFORE INSERT OR UPDATE OR DELETE ON public.evaluaciones
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_edit_closed_acta();

-- 4. Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS usuarios_updated_at ON public.usuarios;
CREATE TRIGGER usuarios_updated_at
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS inscripciones_updated_at ON public.inscripciones;
CREATE TRIGGER inscripciones_updated_at
  BEFORE UPDATE ON public.inscripciones
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 5. Helper: current_usuario_id
CREATE OR REPLACE FUNCTION public.current_usuario_id()
RETURNS UUID AS $$
  SELECT id FROM public.usuarios WHERE auth_user_id = auth.uid() AND activo = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 6. Calcular nota final ponderada por estudiante
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

-- 7. Reportes KPI
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

-- 8. Índices adicionales
CREATE INDEX IF NOT EXISTS idx_grupos_horario ON public.grupos USING GIN (horario);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON public.usuarios(rol) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_periodos_activo ON public.periodos(estado) WHERE estado = 'activo';
CREATE INDEX IF NOT EXISTS idx_inscripciones_activas ON public.inscripciones(estudiante_id, grupo_id) WHERE estado = 'activa';

-- 9. Grants
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
