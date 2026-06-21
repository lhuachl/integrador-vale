import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ClipboardList, FilePlus, Lock, Users, X } from 'lucide-react';
import { api } from '@/api/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

export function DocenteCalificarPage() {
  const { grupoId } = useParams<{ grupoId: string }>();
  const qc = useQueryClient();
  const [evalId, setEvalId] = useState<string>('');
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [showCrearEval, setShowCrearEval] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['grupos', grupoId, 'calificar'],
    queryFn: () => api.grupos.calificar(grupoId!),
    enabled: !!grupoId,
  });

  const guardar = useMutation({
    mutationFn: () => {
      const notasArr = Object.entries(notas)
        .filter(([, v]) => v !== '')
        .map(([inscripcionId, nota]) => ({ inscripcionId, nota: Math.min(20, Math.max(0, parseFloat(nota) || 0)) }));
      return api.grupos.saveCalificaciones(grupoId!, { evaluacionId: evalId, notas: notasArr });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grupos', grupoId, 'calificar'] });
      setNotas({});
    },
  });

  const cerrarActa = useMutation({
    mutationFn: () => api.grupos.cerrarActa(grupoId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['grupos', grupoId, 'calificar'] }),
  });

  if (isLoading) return <LoadingState mensaje="Cargando grupo…" />;
  if (error) return <ErrorState error="No se pudo cargar el grupo." onRetry={() => refetch()} />;
  const view = data?.data;
  if (!view) return null;

  return (
    <div>
      <div className="mb-4">
        <Link to="/docente/grupos" className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-3" />
          Volver a mis grupos
        </Link>
      </div>

      <PageHeader
        titulo={view.cursoNombre}
        descripcion={`${view.cursoCodigo} · ${view.estudiantes.length} estudiante(s) · ${view.evaluaciones.length} evaluación(es)`}
        titleClassName="text-glow"
      />

      <div className="mt-4 flex items-center gap-3">
        {view.actaCerrada ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <Lock className="size-3.5" /> Acta cerrada
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 px-3 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <FilePlus className="size-3.5" /> Acta abierta
          </span>
        )}
        <button type="button" onClick={() => setShowCrearEval(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground">
          <FilePlus className="size-3.5" /> Nueva evaluación
        </button>
        {!view.actaCerrada && (
          <button type="button" onClick={() => cerrarActa.mutate()} disabled={cerrarActa.isPending} className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-500 transition-all hover:bg-red-500/10 disabled:opacity-50">
            <Lock className="size-3.5" /> {cerrarActa.isPending ? 'Cerrando…' : 'Cerrar acta'}
          </button>
        )}
      </div>

      {showCrearEval && (
        <CrearEvaluacionForm grupoId={grupoId!} cursoId={view.cursoId} onDone={() => { setShowCrearEval(false); qc.invalidateQueries({ queryKey: ['grupos', grupoId, 'calificar'] }); }} />
      )}

      {view.evaluaciones.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={<ClipboardList className="size-10" />} titulo="Sin evaluaciones" descripcion="Crea una evaluación para empezar a calificar." />
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            {view.evaluaciones.map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => {
                  setEvalId(ev.id);
                  const next: Record<string, string> = {};
                  for (const est of view.estudiantes) next[est.inscripcionId] = '';
                  setNotas(next);
                }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  evalId === ev.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                }`}
              >
                {ev.nombre} ({ev.peso}%)
              </button>
            ))}
          </div>

          {!evalId ? (
            <div className="mt-6">
              <EmptyState icon={<Users className="size-10" />} titulo="Selecciona una evaluación" descripcion="Elige una evaluación arriba para ingresar notas." />
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card card-neumorf">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-sans text-xs font-semibold text-muted-foreground">Estudiante</th>
                    <th className="w-40 px-4 py-3 text-center font-sans text-xs font-semibold text-muted-foreground">Nota (0–20)</th>
                  </tr>
                </thead>
                <tbody>
                  {view.estudiantes.map((est) => (
                    <tr key={est.inscripcionId} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-3 text-foreground">{est.estudianteNombre}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          max={20}
                          step={0.5}
                          value={notas[est.inscripcionId] ?? ''}
                          onChange={(e) => setNotas((prev) => ({ ...prev, [est.inscripcionId]: e.target.value }))}
                          placeholder="—"
                          disabled={view.actaCerrada}
                          className="block w-full rounded-lg border border-border bg-background px-3 py-1.5 text-center font-mono text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {evalId && !view.actaCerrada && (
            <div className="mt-4 flex items-center gap-3">
              <button type="button" onClick={() => guardar.mutate()} disabled={guardar.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50">
                <CheckCircle className="size-4" />
                {guardar.isPending ? 'Guardando…' : 'Guardar notas'}
              </button>
              {guardar.isSuccess && <span className="text-xs text-emerald-600 dark:text-emerald-400">Notas guardadas</span>}
              {guardar.isError && <span className="text-xs text-red-600 dark:text-red-400">Error: {(guardar.error as any)?.response?.data?.error?.message ?? 'Error al guardar'}</span>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CrearEvaluacionForm({ grupoId, cursoId, onDone }: { grupoId: string; cursoId: string; onDone: () => void }) {
  const [nombre, setNombre] = useState('');
  const [peso, setPeso] = useState('20');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));

  const crear = useMutation({
    mutationFn: () => api.grupos.crearEvaluacion(grupoId, { nombre, peso: parseInt(peso) || 0, fecha, cursoId, grupoId }),
    onSuccess: onDone,
  });

  return (
    <div className="mt-4 rounded-xl border border-border bg-card card-neumorf p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-semibold text-foreground">Nueva evaluación</h4>
        <button type="button" onClick={onDone} className="p-1 text-muted-foreground hover:text-foreground"><X className="size-3.5" /></button>
      </div>
      <div className="flex flex-wrap gap-3">
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del parcial" className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none" />
        <input type="number" value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="Peso %" className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
        <button type="button" onClick={() => crear.mutate()} disabled={!nombre || crear.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50">
          {crear.isPending ? 'Creando…' : <><CheckCircle className="size-4" /> Crear</>}
        </button>
      </div>
      {crear.isSuccess && <p className="mt-2 text-xs text-emerald-500">Evaluación creada</p>}
      {crear.isError && <p className="mt-2 text-xs text-red-500">Error al crear</p>}
    </div>
  );
}
