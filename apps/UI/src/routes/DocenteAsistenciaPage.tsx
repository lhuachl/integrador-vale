import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ClipboardList, UserCheck } from 'lucide-react';
import { api } from '@/api/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import type { EstadoAsistencia } from '@/api/types';

const ESTADOS: { value: EstadoAsistencia; label: string }[] = [
  { value: 'presente', label: 'Presente' },
  { value: 'ausente', label: 'Ausente' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'justificado', label: 'Justificado' },
];

const ESTILO_BOTON: Record<EstadoAsistencia, string> = {
  presente: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
  ausente: 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/40',
  tarde: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40',
  justificado: 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/40',
};

export function DocenteAsistenciaPage() {
  const { grupoId } = useParams<{ grupoId: string }>();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [fecha, setFecha] = useState(today);
  const [estados, setEstados] = useState<Record<string, EstadoAsistencia>>({});

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['grupos', grupoId, 'asistencia', fecha],
    queryFn: () => api.grupos.asistencia(grupoId!, fecha),
    enabled: !!grupoId,
  });

  const guardar = useMutation({
    mutationFn: () => {
      const registros = Object.entries(estados).map(([inscripcionId, estado]) => ({ inscripcionId, estado }));
      return api.grupos.saveAsistencia(grupoId!, { fecha, registros });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grupos', grupoId, 'asistencia'] });
    },
  });

  if (isLoading) return <LoadingState mensaje="Cargando estudiantes…" />;
  if (error) return <ErrorState error="No se pudo cargar la asistencia." onRetry={() => refetch()} />;

  const view = data?.data;
  if (!view) return null;

  return (
    <div>
      <div className="mb-4">
        <Link to="/docente/grupos" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-3" />
          Volver a mis grupos
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <PageHeader
          titulo="Tomar asistencia"
          descripcion={`${view.registros.length} estudiante(s)`}
          titleClassName="text-glow"
        />
        <input
          type="date"
          value={fecha}
          onChange={(e) => {
            setFecha(e.target.value);
            setEstados({});
          }}
          className="mt-1 rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {view.registros.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={<ClipboardList className="size-10" />} titulo="Sin estudiantes" descripcion="Este grupo no tiene estudiantes inscritos." />
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {view.registros.map((r) => (
            <div key={r.inscripcionId} className="flex items-center justify-between rounded-xl border border-border bg-card card-neumorf px-4 py-3">
              <span className="text-sm text-foreground">{r.estudianteNombre}</span>
              <div className="flex gap-1.5">
                {ESTADOS.map((e) => {
                  const activo = estados[r.inscripcionId] === e.value;
                  return (
                    <button
                      key={e.value}
                      type="button"
                      onClick={() =>
                        setEstados((prev) => ({
                          ...prev,
                          [r.inscripcionId]: activo ? undefined! : e.value,
                        }))
                      }
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                        activo ? ESTILO_BOTON[e.value] : 'border-border text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      {e.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => guardar.mutate()}
              disabled={guardar.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              <UserCheck className="size-4" />
              {guardar.isPending ? 'Guardando…' : 'Guardar asistencia'}
            </button>
            {guardar.isSuccess && <span className="text-xs text-emerald-600 dark:text-emerald-400">Asistencia guardada</span>}
            {guardar.isError && (
              <span className="text-xs text-red-600 dark:text-red-400">
                Error: {(guardar.error as any)?.response?.data?.error?.message ?? 'Error al guardar'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
