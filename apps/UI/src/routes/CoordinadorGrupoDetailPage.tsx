import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { GrupoDetailView } from '@/api/types';
import { ArrowLeft, CheckCircle, Clock, Lock, MapPin, Plus, Trash2, Unlock, User, UserPlus, Users, X } from 'lucide-react';
import { api } from '@/api/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

const DIAS = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

type Tab = 'info' | 'estudiantes' | 'acta';
const TABS: { key: Tab; label: string }[] = [
  { key: 'info', label: 'Información' },
  { key: 'estudiantes', label: 'Estudiantes' },
  { key: 'acta', label: 'Acta' },
];

function horarioStr(horario: { dia: number; inicio: string; fin: string }[]): string {
  return horario.map((b) => `${DIAS[b.dia]} ${b.inicio}-${b.fin}`).join(', ');
}

export function CoordinadorGrupoDetailPage() {
  const { grupoId } = useParams<{ grupoId: string }>();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('info');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['coordinador', 'grupo', grupoId],
    queryFn: () => api.coordinador.detalleGrupo(grupoId!),
    enabled: !!grupoId,
  });

  const grupo = data?.data;

  if (isLoading) return <LoadingState mensaje="Cargando grupo…" />;
  if (error) return <ErrorState error="No se pudo cargar el grupo." onRetry={() => refetch()} />;
  if (!grupo) return null;

  return (
    <div>
      <div className="mb-4">
        <Link to="/coordinador/grupos" className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-3" /> Volver a grupos
        </Link>
      </div>

      <PageHeader titulo={grupo.cursoNombre} descripcion={`${grupo.cursoCodigo} · ${grupo.programaNombre} · ${grupo.periodoNombre}`} titleClassName="text-glow" />

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="size-3" />{horarioStr(grupo.horario)}</span>
        <span className="flex items-center gap-1"><MapPin className="size-3" />{grupo.aula}</span>
        <span className="flex items-center gap-1"><User className="size-3" />{grupo.docenteNombre}</span>
        <span className="flex items-center gap-1"><Users className="size-3" />{grupo.totalEstudiantes}/{grupo.cupo} cupos</span>
        <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-xs ${grupo.actaCerrada ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'border-amber-500/30 text-amber-600 dark:text-amber-400'}`}>
          {grupo.actaCerrada ? <Lock className="size-3" /> : <Unlock className="size-3" />}
          Acta {grupo.actaCerrada ? 'cerrada' : 'abierta'}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${tab === t.key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'info' && <InfoTab grupo={grupo} onDone={() => qc.invalidateQueries({ queryKey: ['coordinador', 'grupo', grupoId] })} />}
      {tab === 'estudiantes' && <EstudiantesTab grupo={grupo} />}
      {tab === 'acta' && <ActaTab grupo={grupo} onDone={() => qc.invalidateQueries({ queryKey: ['coordinador', 'grupo', grupoId] })} />}
    </div>
  );
}

/* ---- Info tab ---- */
function InfoTab({ grupo, onDone }: { grupo: GrupoDetailView; onDone: () => void }) {
  const qc = useQueryClient();
  const { data: docentesData } = useQuery({ queryKey: ['coordinador', 'docentes'], queryFn: () => api.coordinador.docentesDisponibles() });
  const docentes = docentesData?.data ?? [];

  const [aula, setAula] = useState(grupo.aula);
  const [cupo, setCupo] = useState(String(grupo.cupo));
  const [docenteId, setDocenteId] = useState(grupo.docenteId);

  const guadar = useMutation({
    mutationFn: () => api.coordinador.actualizarGrupo(grupo.id, {
      aula: aula !== grupo.aula ? aula : undefined,
      cupo: cupo !== String(grupo.cupo) ? parseInt(cupo) : undefined,
      docenteId: docenteId !== grupo.docenteId ? docenteId : undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coordinador', 'grupos'] }); onDone(); },
  });

  return (
    <div className="mt-6 max-w-lg space-y-4">
      <div className="rounded-xl border border-border bg-card card-neumorf p-4">
        <h3 className="mb-3 font-sans text-sm font-semibold text-foreground">Editar grupo</h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Aula</label>
              <input value={aula} onChange={(e) => setAula(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
            </div>
            <div className="w-24">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Cupo</label>
              <input type="number" value={cupo} onChange={(e) => setCupo(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Docente</label>
            <select value={docenteId} onChange={(e) => setDocenteId(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none">
              {docentes.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </select>
          </div>
          <button type="button" onClick={() => guadar.mutate()} disabled={guadar.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50">
            {guadar.isPending ? 'Guardando…' : <><CheckCircle className="size-4" /> Guardar cambios</>}
          </button>
          {guadar.isSuccess && <p className="text-xs text-emerald-500">Cambios guardados</p>}
          {guadar.isError && <p className="text-xs text-red-500">Error al guardar</p>}
        </div>
      </div>
    </div>
  );
}

/* ---- Estudiantes tab ---- */
function EstudiantesTab({ grupo }: { grupo: GrupoDetailView }) {
  const [showAgregar, setShowAgregar] = useState(false);
  const qc = useQueryClient();

  const { data: disponiblesData } = useQuery({
    queryKey: ['coordinador', 'grupo', grupo.id, 'disponibles'],
    queryFn: () => api.coordinador.estudiantesDisponibles(grupo.id),
    enabled: showAgregar,
  });

  const agregar = useMutation({
    mutationFn: (estudianteId: string) => api.coordinador.agregarEstudiante(grupo.id, estudianteId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coordinador', 'grupo', grupo.id] }); qc.invalidateQueries({ queryKey: ['coordinador', 'grupo', grupo.id, 'disponibles'] }); },
  });

  const quitar = useMutation({
    mutationFn: (inscripcionId: string) => api.coordinador.quitarEstudiante(grupo.id, inscripcionId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coordinador', 'grupo', grupo.id] }); qc.invalidateQueries({ queryKey: ['coordinador', 'grupo', grupo.id, 'disponibles'] }); },
  });

  const disponibles = disponiblesData?.data ?? [];

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{grupo.estudiantes.length} estudiante(s) inscritos</p>
        <button type="button" onClick={() => setShowAgregar(!showAgregar)} disabled={grupo.cupoDisponible <= 0} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50">
          <UserPlus className="size-3.5" /> Agregar estudiante
        </button>
      </div>

      {showAgregar && (
        <div className="mb-4 rounded-xl border border-border bg-card card-neumorf p-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-semibold text-foreground">Estudiantes disponibles</h4>
            <button type="button" onClick={() => setShowAgregar(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="size-3.5" /></button>
          </div>
          {disponibles.length === 0 ? (
            <p className="text-xs text-muted-foreground">No hay estudiantes disponibles para agregar.</p>
          ) : (
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {disponibles.map((est) => (
                <div key={est.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{est.nombre}</p>
                    <p className="text-xs text-muted-foreground">{est.email}</p>
                  </div>
                  <button type="button" onClick={() => agregar.mutate(est.id)} disabled={agregar.isPending} className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-all hover:bg-primary/20 disabled:opacity-50">
                    {agregar.isPending ? '…' : <><Plus className="size-3" /> Agregar</>}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {grupo.estudiantes.length === 0 ? (
        <EmptyState icon={<Users className="size-10" />} titulo="Sin estudiantes" descripcion="Este grupo no tiene estudiantes inscritos." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card card-neumorf">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-sans text-xs font-semibold text-muted-foreground">Estudiante</th>
                <th className="px-4 py-3 text-left font-sans text-xs font-semibold text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-center font-sans text-xs font-semibold text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-center font-sans text-xs font-semibold text-muted-foreground">Acción</th>
              </tr>
            </thead>
            <tbody>
              {grupo.estudiantes.map((est) => (
                <tr key={est.inscripcionId} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{est.nombre}</td>
                  <td className="px-4 py-3 text-muted-foreground">{est.email}</td>
                  <td className="px-4 py-3 text-center"><EstadoBadge estado={est.estado} /></td>
                  <td className="px-4 py-3 text-center">
                    <button type="button" onClick={() => quitar.mutate(est.inscripcionId)} disabled={quitar.isPending} className="rounded-lg border border-red-500/30 p-1.5 text-red-400 transition-all hover:bg-red-500/10 disabled:opacity-50">
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    solicitada: { label: 'Solicitada', cls: 'border-amber-500/30 text-amber-600 dark:text-amber-400' },
    aprobada: { label: 'Aprobada', cls: 'border-sky-500/30 text-sky-600 dark:text-sky-400' },
    activa: { label: 'Activa', cls: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400' },
    retirada: { label: 'Retirada', cls: 'border-red-500/30 text-red-600 dark:text-red-400' },
    cancelada: { label: 'Cancelada', cls: 'border-muted text-muted-foreground' },
    aprobada_final: { label: 'Aprobada', cls: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400' },
    reprobada_final: { label: 'Reprobada', cls: 'border-red-500/30 text-red-600 dark:text-red-400' },
  };
  const m = map[estado] ?? { label: estado, cls: 'border-muted-foreground/30 text-muted-foreground' };
  return <span className={`rounded-full border px-2 py-0.5 font-mono text-xs ${m.cls}`}>{m.label}</span>;
}

/* ---- Acta tab ---- */
function ActaTab({ grupo, onDone }: { grupo: GrupoDetailView; onDone: () => void }) {
  const qc = useQueryClient();
  const toggleActa = useMutation({
    mutationFn: () => api.coordinador.toggleActa(grupo.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coordinador', 'grupos'] }); onDone(); },
  });

  return (
    <div className="mt-6 max-w-lg">
      <div className="rounded-xl border border-border bg-card card-neumorf p-4">
        <h3 className="mb-3 font-sans text-sm font-semibold text-foreground">Estado del acta</h3>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${grupo.actaCerrada ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'border-amber-500/30 text-amber-600 dark:text-amber-400'}`}>
            {grupo.actaCerrada ? <Lock className="size-5" /> : <Unlock className="size-5" />}
            Acta {grupo.actaCerrada ? 'cerrada' : 'abierta'}
          </span>
          <button type="button" onClick={() => toggleActa.mutate()} disabled={toggleActa.isPending} className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${grupo.actaCerrada ? 'border-amber-500/30 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400' : 'border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400'}`}>
            {grupo.actaCerrada ? <Unlock className="size-4" /> : <Lock className="size-4" />}
            {grupo.actaCerrada ? 'Reabrir acta' : 'Cerrar acta'}
          </button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          {grupo.actaCerrada
            ? 'El acta está cerrada. No se pueden modificar notas ni agregar estudiantes.'
            : 'El acta está abierta. Se pueden ingresar notas y modificar el grupo.'}
        </p>
        {toggleActa.isSuccess && <p className="mt-2 text-xs text-emerald-500">Acta {grupo.actaCerrada ? 'cerrada' : 'reabierta'}</p>}
        {toggleActa.isError && <p className="mt-2 text-xs text-red-500">Error al cambiar estado del acta</p>}
      </div>
    </div>
  );
}
