import { useQuery } from '@tanstack/react-query';
import { GraduationCap, Rocket } from 'lucide-react';
import { api } from '@/api/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

export function EstudianteProgresoPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['progreso', 'mis'],
    queryFn: () => api.progreso.mis(),
  });

  if (isLoading) return <LoadingState mensaje="Cargando progreso…" />;

  if (error) return <ErrorState error="No se pudo cargar tu progreso." onRetry={() => refetch()} />;

  const rows = data?.data ?? [];

  if (rows.length === 0) {
    return (
      <div>
        <PageHeader titulo="Progreso hacia la graduación" descripcion="Créditos aprobados vs totales por programa." titleClassName="text-glow" />
        <div className="mt-6">
          <EmptyState icon={<Rocket className="size-10" />} titulo="Sin datos de progreso" descripcion="Aún no estás inscrito en ningún programa." />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        titulo="Progreso hacia la graduación"
        descripcion="Créditos aprobados vs totales por programa."
        titleClassName="text-glow"
      />

      <div className="mt-6 space-y-6">
        {rows.map((p) => (
          <div key={p.programaCodigo} className="rounded-xl border border-border bg-card card-neumorf p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-sans font-semibold text-foreground">{p.programaNombre}</h3>
                <p className="font-mono text-xs text-muted-foreground">{p.programaCodigo}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">{p.porcentaje}%</p>
                  <p className="text-xs text-muted-foreground">{p.aprobados}/{p.totalCreditos} créditos</p>
                </div>
                <GraduationCap className="size-8 text-primary/60" />
              </div>
            </div>

            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${Math.min(p.porcentaje, 100)}%` }}
              />
            </div>

            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" />
                {p.aprobados} aprobados
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-amber-500/60" />
                {p.enCurso} en curso
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-muted-foreground/30" />
                {p.totalCreditos - p.aprobados - p.enCurso} pendientes
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
