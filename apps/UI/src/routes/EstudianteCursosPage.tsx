import { useState } from 'react';
import { BookOpen, CheckCircle2, Clock, Search, XCircle, Eye, RotateCcw, FileText } from 'lucide-react';
import BorderGlow from '@/components/BorderGlow';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';

import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { BadgeEstadoInscripcion } from '@/components/ui/BadgeEstadoInscripcion';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import type { InscripcionView } from '@/api/types';

const DIAS: Record<number, string> = { 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 7: 'Dom' };

function scheduleLines(horario: InscripcionView['horario']) {
  return horario.map((b) => `${DIAS[b.dia]} ${b.inicio.slice(0, 5)}-${b.fin.slice(0, 5)}`).join('\n');
}



export function EstudianteCursosPage() {
  const [busqueda, setBusqueda] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['inscripciones', 'mis'],
    queryFn: () => api.inscripciones.mis(),
  });

  if (isLoading) return <LoadingState mensaje="Cargando inscripciones…" />;

  if (error) return <ErrorState error="No se pudieron cargar tus inscripciones." onRetry={() => refetch()} />;

  const rows = data?.data ?? [];
  const periodo = rows.length ? rows[0].periodoNombre : '';

  const filtradas = busqueda
    ? rows.filter((r) =>
        [r.cursoNombre, r.cursoCodigo, r.docenteNombre, r.grupoCodigo, r.aula].some((t) =>
          t.toLowerCase().includes(busqueda.toLowerCase()),
        ),
      )
    : rows;

  const activas = rows.filter((r) => r.estado === 'activa').length;
  const aprobadas = rows.filter((r) => r.estado === 'aprobada_final').length;
  const pendientes = rows.filter((r) => r.estado === 'solicitada' || r.estado === 'rechazada').length;
  const reprobadas = rows.filter((r) => r.estado === 'reprobada_final').length;

  if (rows.length === 0) {
    return (
      <div>
        <PageHeader titulo="Mis cursos" descripcion="No tienes inscripciones en el período activo." titleClassName="text-glow" />
        <div className="mt-6">
          <EmptyState
            icon={<BookOpen className="size-10" />}
            titulo="Sin inscripciones"
            descripcion="Aún no te has inscrito en ningún grupo este período."
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        titulo="Mis cursos"
        descripcion={`Período ${periodo} · ${rows.length} inscripción(es)`}
        titleClassName="text-glow"
      />

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Activas" valor={activas} icon={<BookOpen className="size-4" />} />
        <StatCard label="Aprobadas" valor={aprobadas} icon={<CheckCircle2 className="size-4" />} />
        <StatCard label="Pendientes" valor={pendientes} icon={<Clock className="size-4" />} />
        <StatCard label="Reprobadas" valor={reprobadas} icon={<XCircle className="size-4" />} />
      </div>

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

      <div className="mt-4">
        <BorderGlow
          backgroundColor="#0c0905"
          glowColor="15 75 44"
          borderRadius={24}
          glowRadius={60}
          glowIntensity={1.3}
          coneSpread={20}
          animated={true}
          colors={['hsl(15 75% 44%)', 'hsl(43 90% 59%)', 'hsl(26 59% 36%)']}
          className="w-full"
        >
          <div className="border-glow-inner">
        <DataTable
              columns={[
                {
                  key: 'curso',
                  label: 'Curso',
                  render: (row: InscripcionView) => (
                    <div>
                      <span className="font-medium text-foreground">{row.cursoNombre}</span>
                      <br />
                      <span className="font-mono text-xs text-muted-foreground">{row.cursoCodigo}</span>
                    </div>
                  ),
                },
                {
                  key: 'carrera',
                  label: 'Carrera',
                  render: (row: InscripcionView) => (
                    <span className="text-xs text-muted-foreground">{row.programaNombre}</span>
                  ),
                },
                {
                  key: 'grupo',
                  label: 'Grupo',
                  render: (row: InscripcionView) => (
                    <div className="font-sans text-sm">
                      <span className="font-medium">{row.grupoCodigo}</span>
                      <br />
                      <span className="text-xs text-muted-foreground">{row.aula}</span>
                    </div>
                  ),
                },
                {
                  key: 'horario',
                  label: 'Horario',
                  render: (row: InscripcionView) => (
                    <div className="whitespace-pre-line text-xs leading-relaxed">
                      {scheduleLines(row.horario) || '—'}
                    </div>
                  ),
                },
                {
                  key: 'docente',
                  label: 'Docente',
                  render: (row: InscripcionView) => (
                    <span className="text-sm text-muted-foreground">{row.docenteNombre}</span>
                  ),
                },
                {
                  key: 'estado',
                  label: 'Estado',
                  render: (row: InscripcionView) => (
                    <BadgeEstadoInscripcion estado={row.estado} motivoRechazo={row.motivoRechazo} />
                  ),
                },
                {
                  key: 'acciones',
                  label: '',
                  render: (row: InscripcionView) => {
                    switch (row.estado) {
                      case 'activa':
                        return (
                          <button
                            type="button"
                            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-all hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                          >
                            <Eye className="size-3" />
                            Ver detalle
                          </button>
                        );
                      case 'solicitada':
                        return (
                          <button
                            type="button"
                            className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-600 dark:text-amber-400 transition-all hover:bg-amber-500/20"
                          >
                            <Eye className="size-3" />
                            Ver detalle
                          </button>
                        );
                      case 'aprobada_final':
                        return (
                          <button
                            type="button"
                            className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs text-violet-600 dark:text-violet-400 transition-all hover:bg-violet-500/20"
                          >
                            <FileText className="size-3" />
                            Ver notas
                          </button>
                        );
                      case 'rechazada':
                        return (
                          <button
                            type="button"
                            className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs text-primary transition-all hover:bg-primary/20"
                          >
                            <RotateCcw className="size-3" />
                            Reinscribir
                          </button>
                        );
                      case 'reprobada_final':
                        return (
                          <button
                            type="button"
                            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-all hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                          >
                            <Eye className="size-3" />
                            Ver detalle
                          </button>
                        );
                      default:
                        return null;
                    }
                  },
                },
              ]}
              rows={filtradas}
              empty={
                <EmptyState
                  titulo="Sin resultados"
                  descripcion={busqueda ? `No hay inscripciones que coincidan con "${busqueda}".` : 'No hay inscripciones para mostrar.'}
                />
              }
            />
          </div>
        </BorderGlow>
      </div>
    </div>
  );
}
