import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { CalendarPlus, CalendarRange, CheckCircle, Pencil, Plus, Trash2, X } from 'lucide-react';
import { api } from '@/api/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import type { EstadoPeriodo, Periodo, TipoPeriodo } from '@/api/types';

function Modal({ onClose, titulo, children }: { onClose: () => void; titulo: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl card-neumorf" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-sans font-semibold text-foreground">{titulo}</h2>
          <button type="button" onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground"><X className="size-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const TIPOS: { value: TipoPeriodo; label: string }[] = [
  { value: 'semestral', label: 'Semestral' },
  { value: 'cuatrimestral', label: 'Cuatrimestral' },
  { value: 'anual', label: 'Anual' },
];

const ESTADOS: { value: EstadoPeriodo; label: string; cls: string }[] = [
  { value: 'borrador', label: 'Borrador', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  { value: 'activo', label: 'Activo', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  { value: 'cerrado', label: 'Cerrado', cls: 'bg-muted text-muted-foreground' },
];

export function AdministrativoPeriodosPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editar, setEditar] = useState<Periodo | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => api.periodos.listar(),
  });

  const periodos = data?.data ?? [];

  if (isLoading) return <LoadingState mensaje="Cargando períodos…" />;
  if (error) return <ErrorState error="No se pudieron cargar los períodos." onRetry={() => refetch()} />;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <PageHeader titulo="Períodos académicos" descripcion={`${periodos.length} período(s) registrados.`} titleClassName="text-glow" />
        <button type="button" onClick={() => setShowForm(true)} className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-all hover:bg-primary/90">
          <Plus className="size-3.5" /> Nuevo período
        </button>
      </div>

      {showForm && (
        <Modal onClose={() => setShowForm(false)} titulo="Crear período">
          <PeriodoForm onDone={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['periodos'] }); }} />
        </Modal>
      )}

      {editar && (
        <Modal onClose={() => setEditar(null)} titulo="Editar período">
          <EditarPeriodoForm periodo={editar} onDone={() => { setEditar(null); qc.invalidateQueries({ queryKey: ['periodos'] }); }} />
        </Modal>
      )}

      {periodos.length === 0 ? (
        <div className="mt-6"><EmptyState icon={<CalendarRange className="size-10" />} titulo="Sin períodos" descripcion="No hay períodos académicos registrados." /></div>
      ) : (
        <div className="mt-4 space-y-2">
          {periodos.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-border bg-card card-neumorf p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-sans font-semibold text-foreground">{p.nombre}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADOS.find((e) => e.value === p.estado)?.cls ?? ''}`}>{ESTADOS.find((e) => e.value === p.estado)?.label}</span>
                </div>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {TIPOS.find((t) => t.value === p.tipo)?.label} · {p.fechaInicio} → {p.fechaFinClases}
                </p>
              </div>
              <button type="button" onClick={() => setEditar(p)} className="rounded-lg border border-border p-1.5 text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground">
                <Pencil className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PeriodoForm({ onDone }: { onDone: () => void }) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<TipoPeriodo>('semestral');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFinIns, setFechaFinIns] = useState('');
  const [fechaFinClases, setFechaFinClases] = useState('');

  const crear = useMutation({
    mutationFn: () => api.periodos.crear({ nombre, tipo, fechaInicio, fechaFinInscripcion: fechaFinIns, fechaFinClases }),
    onSuccess: onDone,
  });

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Nombre</label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: 2026-I" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Tipo</label>
        <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoPeriodo)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none">
          {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Inicio</label>
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Fin insc.</label>
          <input type="date" value={fechaFinIns} onChange={(e) => setFechaFinIns(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Fin clases</label>
          <input type="date" value={fechaFinClases} onChange={(e) => setFechaFinClases(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
      </div>
      <button type="button" onClick={() => crear.mutate()} disabled={!nombre || !fechaInicio || !fechaFinIns || !fechaFinClases || crear.isPending} className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50">
        {crear.isPending ? 'Creando…' : <><CalendarPlus className="size-4" /> Crear período</>}
      </button>
      {crear.isError && <p className="text-xs text-red-500">Error al crear</p>}
    </div>
  );
}

function EditarPeriodoForm({ periodo, onDone }: { periodo: Periodo; onDone: () => void }) {
  const [nombre, setNombre] = useState(periodo.nombre);
  const [tipo, setTipo] = useState(periodo.tipo);
  const [fechaInicio, setFechaInicio] = useState(periodo.fechaInicio);
  const [fechaFinIns, setFechaFinIns] = useState(periodo.fechaFinInscripcion);
  const [fechaFinClases, setFechaFinClases] = useState(periodo.fechaFinClases);
  const [estado, setEstado] = useState<EstadoPeriodo>(periodo.estado);

  const actualizar = useMutation({
    mutationFn: () => api.periodos.actualizar(periodo.id, { nombre, tipo, fechaInicio, fechaFinInscripcion: fechaFinIns, fechaFinClases, estado }),
    onSuccess: onDone,
  });

  const eliminar = useMutation({
    mutationFn: () => api.periodos.eliminar(periodo.id),
    onSuccess: onDone,
  });

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Nombre</label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Tipo</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoPeriodo)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none">
            {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Estado</label>
          <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoPeriodo)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none">
            {ESTADOS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Inicio</label>
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Fin insc.</label>
          <input type="date" value={fechaFinIns} onChange={(e) => setFechaFinIns(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Fin clases</label>
          <input type="date" value={fechaFinClases} onChange={(e) => setFechaFinClases(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => actualizar.mutate()} disabled={actualizar.isPending} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50">
          {actualizar.isPending ? 'Guardando…' : <><CheckCircle className="size-4" /> Guardar</>}
        </button>
        <button type="button" onClick={() => eliminar.mutate()} disabled={eliminar.isPending} className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-500 transition-all hover:bg-red-500/10 disabled:opacity-50">
          <Trash2 className="size-4" /> Eliminar
        </button>
      </div>
      {actualizar.isError && <p className="text-xs text-red-500">Error al guardar</p>}
      {eliminar.isError && <p className="text-xs text-red-500">Error al eliminar</p>}
    </div>
  );
}
