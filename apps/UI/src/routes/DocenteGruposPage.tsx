import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Users, ClipboardList, GraduationCap, ChevronRight, UserCheck } from 'lucide-react';
import { api } from '@/api/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

const DIAS = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function horarioStr(horario: { dia: number; inicio: string; fin: string }[]): string {
  return horario.map((b) => `${DIAS[b.dia]} ${b.inicio}-${b.fin}`).join(', ');
}

export function DocenteGruposPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['grupos', 'mis'],
    queryFn: () => api.grupos.mis(),
  });

  if (isLoading) return <LoadingState mensaje="Cargando tus grupos…" />;

  if (error) return <ErrorState error="No se pudieron cargar tus grupos." onRetry={() => refetch()} />;

  const groups = data?.data ?? [];

  if (groups.length === 0) {
    return (
      <div>
        <PageHeader titulo="Mis grupos" descripcion="Grupos que dictas en el período activo." titleClassName="text-glow" />
        <div className="mt-6">
          <EmptyState icon={<GraduationCap className="size-10" />} titulo="Sin grupos" descripcion="No tienes grupos asignados en el período activo." />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader titulo="Mis grupos" descripcion={`${groups.length} grupo(s) en el período activo.`} titleClassName="text-glow" />

      <div className="mt-6 space-y-3">
        {groups.map((g) => (
          <Link
            key={g.id}
            to={`/docente/grupos/${g.id}`}
            className="block rounded-xl border border-border bg-card card-neumorf p-4 transition-all hover:border-primary/20 hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="font-sans font-semibold text-foreground">{g.cursoNombre}</h3>
                <p className="font-mono text-xs text-muted-foreground">
                  {g.cursoCodigo} · {g.creditos} créditos · {g.periodoNombre}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {horarioStr(g.horario)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" />
                    {g.aula}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="size-3.5" />
                  {g.totalEstudiantes}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ClipboardList className="size-3.5" />
                  {g.evaluacionesCount} eval.
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
            </div>
            <div className="mt-3 flex gap-2 border-t border-border pt-3">
              <Link
                to={`/docente/grupos/${g.id}`}
                className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-all hover:bg-primary/20"
                onClick={(e) => e.stopPropagation()}
              >
                <ClipboardList className="size-3" />
                Calificar
              </Link>
              <Link
                to={`/docente/grupos/${g.id}/asistencia`}
                className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-all hover:bg-primary/20"
                onClick={(e) => e.stopPropagation()}
              >
                <UserCheck className="size-3" />
                Asistencia
              </Link>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
