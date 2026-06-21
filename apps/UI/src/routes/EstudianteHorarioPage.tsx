import { useQuery } from '@tanstack/react-query';
import { Calendar, MapPin } from 'lucide-react';
import { api } from '@/api/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import type { InscripcionView } from '@/api/types';

const DIAS = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HORAS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

const COLORES = [
  'border-l-red-500/60 bg-red-500/5',
  'border-l-rose-500/60 bg-rose-500/5',
  'border-l-amber-500/60 bg-amber-500/5',
  'border-l-emerald-500/60 bg-emerald-500/5',
  'border-l-sky-500/60 bg-sky-500/5',
  'border-l-violet-500/60 bg-violet-500/5',
];

type GrillaSlot = { curso: string; aula: string; color: string };

function buildGrilla(views: InscripcionView[]): Map<string, GrillaSlot> {
  const map = new Map<string, GrillaSlot>();
  let colorIdx = 0;
  for (const v of views) {
    if (v.estado !== 'activa') continue;
    for (const b of v.horario) {
      const desde = parseInt(b.inicio);
      const hasta = parseInt(b.fin);
      for (let h = desde; h < hasta; h++) {
        const key = `${b.dia}-${h}`;
        if (!map.has(key)) {
          map.set(key, { curso: v.cursoNombre, aula: v.aula, color: COLORES[colorIdx % COLORES.length] });
        }
      }
    }
    colorIdx++;
  }
  return map;
}

export function EstudianteHorarioPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['inscripciones', 'mis'],
    queryFn: () => api.inscripciones.mis(),
  });

  if (isLoading) return <LoadingState mensaje="Cargando horario…" />;

  if (error) return <ErrorState error="No se pudo cargar tu horario." onRetry={() => refetch()} />;

  const rows = data?.data ?? [];
  const activas = rows.filter((r) => r.estado === 'activa');

  if (activas.length === 0) {
    return (
      <div>
        <PageHeader titulo="Horario semanal" descripcion="Tus clases del período activo." titleClassName="text-glow" />
        <div className="mt-6">
          <EmptyState
            icon={<Calendar className="size-10" />}
            titulo="Sin horario"
            descripcion="No tienes cursos activos este período."
          />
        </div>
      </div>
    );
  }

  const grilla = buildGrilla(activas);

  return (
    <div>
      <PageHeader
        titulo="Horario semanal"
        descripcion={`${activas.length} curso(s) activo(s)`}
        titleClassName="text-glow"
      />

      <div className="mt-6 overflow-x-auto">
        <div
          className="grid min-w-[640px] rounded-xl border border-border bg-card card-neumorf p-1"
          style={{ gridTemplateColumns: '4rem repeat(6, 1fr)' }}
        >
          <div />
          {[1, 2, 3, 4, 5, 6].map((d) => (
            <div key={d} className="px-2 py-2 text-center font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {DIAS[d]}
            </div>
          ))}

          {HORAS.map((h) => (
            <>
              <div key={`h-${h}`} className="border-t border-border px-2 py-2 text-right font-mono text-xs text-muted-foreground">
                {h.toString().padStart(2, '0')}:00
              </div>
              {[1, 2, 3, 4, 5, 6].map((d) => {
                const slot = grilla.get(`${d}-${h}`);
                return (
                  <div
                    key={`${d}-${h}`}
                    className={`relative min-h-[4rem] border-t border-border px-1.5 py-1 ${
                      slot ? `${slot.color} border-l-2` : ''
                    }`}
                  >
                    {slot && (
                      <div className="h-full">
                        <p className="font-sans text-[11px] font-semibold leading-tight text-foreground">{slot.curso}</p>
                        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{slot.aula}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {activas.map((v) => (
          <div key={v.id} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{v.cursoNombre}</span>
            <span className="size-1 rounded-full bg-border" />
            <MapPin className="size-3" />
            {v.aula}
          </div>
        ))}
      </div>
    </div>
  );
}
