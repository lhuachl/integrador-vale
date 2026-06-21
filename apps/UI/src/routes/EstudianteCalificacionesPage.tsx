import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { api } from '@/api/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { BadgeEstadoInscripcion } from '@/components/ui/BadgeEstadoInscripcion';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import type { CalificacionView } from '@/api/types';

export function EstudianteCalificacionesPage() {
  const [busqueda, setBusqueda] = useState('');
  const [expandido, setExpandido] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['calificaciones', 'mis'],
    queryFn: () => api.calificaciones.mis(),
  });

  if (isLoading) return <LoadingState mensaje="Cargando calificaciones…" />;

  if (error) return <ErrorState error="No se pudieron cargar tus calificaciones." onRetry={() => refetch()} />;

  const rows = data?.data ?? [];

  const filtradas = busqueda
    ? rows.filter((r) =>
        [r.cursoNombre, r.cursoCodigo, r.docenteNombre, r.grupoCodigo].some((t) =>
          t.toLowerCase().includes(busqueda.toLowerCase()),
        ),
      )
    : rows;

  if (rows.length === 0) {
    return (
      <div>
        <PageHeader titulo="Calificaciones" descripcion="Notas de tus inscripciones." titleClassName="text-glow" />
        <div className="mt-6">
          <EmptyState
            icon={<BookOpen className="size-10" />}
            titulo="Sin calificaciones"
            descripcion="Aún no tienes notas registradas."
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader titulo="Calificaciones" descripcion={`${rows.length} curso(s) con notas`} titleClassName="text-glow" />

      <div className="mt-6 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por curso, código, docente…"
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-shadow focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
          />
        </div>
        {busqueda && (
          <button
            type="button"
            onClick={() => setBusqueda('')}
            className="rounded-lg px-3 py-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {filtradas.map((row) => (
          <CursoCalificacionCard
            key={row.inscripcionId}
            row={row}
            expandido={expandido === row.inscripcionId}
            onToggle={() => setExpandido(expandido === row.inscripcionId ? null : row.inscripcionId)}
          />
        ))}
      </div>
    </div>
  );
}

function CursoCalificacionCard({ row, expandido, onToggle }: { row: CalificacionView; expandido: boolean; onToggle: () => void }) {
  const tieneNotas = row.evaluaciones.length > 0;
  const notaFinalLabel = row.notaFinal >= 0 ? row.notaFinal.toFixed(2) : '—';

  return (
    <div className="rounded-xl border border-border bg-card card-neumorf overflow-hidden">
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-lg font-semibold text-foreground truncate">{row.cursoNombre}</h3>
            <BadgeEstadoInscripcion estado={row.estado} />
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-mono">{row.cursoCodigo}</span>
            <span className="size-1 rounded-full bg-border" />
            <span>{row.grupoCodigo}</span>
            <span className="size-1 rounded-full bg-border" />
            <span>{row.docenteNombre}</span>
            <span className="size-1 rounded-full bg-border" />
            <span>{row.creditos} créd.</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Nota final</p>
            <p className={`font-serif text-xl font-bold ${row.notaFinal >= 11 ? 'text-primary' : 'text-destructive'}`}>
              {notaFinalLabel}
            </p>
          </div>
          {expandido ? <ChevronUp className="size-5 text-muted-foreground" /> : <ChevronDown className="size-5 text-muted-foreground" />}
        </div>
      </button>

      {expandido && (
        <div className="border-t border-border px-5 py-4">
          {tieneNotas ? (
            <div className="space-y-2">
              {row.evaluaciones.map((ev) => (
                <div key={ev.evaluacionId} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-foreground">{ev.nombre}</p>
                    <p className="text-xs text-muted-foreground">Peso: {ev.peso}%</p>
                  </div>
                  <span className={`font-mono text-lg font-bold ${ev.nota >= 11 ? 'text-primary' : 'text-destructive'}`}>
                    {ev.nota >= 0 ? ev.nota.toFixed(1) : '—'}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                <p className="text-sm font-semibold text-foreground">Promedio ponderado</p>
                <span className={`font-mono text-lg font-bold ${row.notaFinal >= 11 ? 'text-primary' : 'text-destructive'}`}>
                  {notaFinalLabel}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">Sin evaluaciones registradas.</p>
          )}
        </div>
      )}
    </div>
  );
}
