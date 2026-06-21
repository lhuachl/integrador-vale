import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookPlus, CheckCircle, Clock, MapPin, User } from 'lucide-react';
import { api } from '@/api/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import type { GrupoView } from '@/api/types';

function horarioStr(horario: GrupoView['horario']): string {
  const dias = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return horario.map((b) => `${dias[b.dia]} ${b.inicio}-${b.fin}`).join(', ');
}

export function EstudianteInscripcionPage() {
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['inscripciones', 'disponibles'],
    queryFn: () => api.inscripciones.gruposDisponibles(),
  });

  const solicitar = useMutation({
    mutationFn: (grupoId: string) => api.inscripciones.solicitar({ grupoId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inscripciones', 'disponibles'] });
      qc.invalidateQueries({ queryKey: ['inscripciones', 'mis'] });
    },
  });

  if (isLoading) return <LoadingState mensaje="Buscando grupos disponibles…" />;

  if (error) return <ErrorState error="No se pudieron cargar los grupos." onRetry={() => refetch()} />;

  const groups = data?.data ?? [];

  return (
    <div>
      <PageHeader
        titulo="Inscripción a grupos"
        descripcion="Solicita inscripción en los grupos disponibles."
        titleClassName="text-glow"
      />

      {solicitar.isSuccess && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="size-4" />
          Solicitud enviada correctamente.
        </div>
      )}

      {solicitar.isError && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          Error: {(solicitar.error as any)?.response?.data?.error?.message ?? 'No se pudo enviar la solicitud'}
        </div>
      )}

      {groups.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<BookPlus className="size-10" />}
            titulo="Sin grupos disponibles"
            descripcion="No hay grupos abiertos para inscripción en este período."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {groups.map((g) => (
            <GrupoCard key={g.id} grupo={g} onSolicitar={solicitar.mutate} loading={solicitar.isPending} />
          ))}
        </div>
      )}
    </div>
  );
}

function GrupoCard({ grupo, onSolicitar, loading }: { grupo: GrupoView; onSolicitar: (id: string) => void; loading: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card card-neumorf p-4 transition-all hover:border-primary/20">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-sans font-semibold text-foreground">{grupo.cursoNombre}</h3>
          <p className="font-mono text-xs text-muted-foreground">{grupo.cursoCodigo} · {grupo.programaNombre} · {grupo.creditos} créditos</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {horarioStr(grupo.horario)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              {grupo.aula}
            </span>
            <span className="flex items-center gap-1">
              <User className="size-3" />
              {grupo.docenteNombre}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="whitespace-nowrap rounded-full border border-border px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
            {grupo.cupoDisponible}/{grupo.cupo} disp.
          </span>
          <button
            type="button"
            onClick={() => onSolicitar(grupo.id)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            <BookPlus className="size-3.5" />
            Solicitar
          </button>
        </div>
      </div>
    </div>
  );
}
