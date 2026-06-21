import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Clock, FileText, Lock, MapPin, Plus, Users, User, GraduationCap, X, CheckCircle } from 'lucide-react';
import type { BloqueHorario } from '@/api/types';
import { api } from '@/api/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

const DIAS = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HORAS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

function horarioStr(horario: { dia: number; inicio: string; fin: string }[]): string {
  return horario.map((b) => `${DIAS[b.dia]} ${b.inicio}-${b.fin}`).join(', ');
}

export function CoordinadorGruposPage() {
  const qc = useQueryClient();
  const [showCrear, setShowCrear] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['coordinador', 'grupos'],
    queryFn: () => api.coordinador.grupos(),
  });
  const groups = data?.data ?? [];

  if (isLoading) return <LoadingState mensaje="Cargando grupos…" />;
  if (error) return <ErrorState error="No se pudieron cargar los grupos." onRetry={() => refetch()} />;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <PageHeader titulo="Gestión de grupos" descripcion={`${groups.length} grupo(s) en el período activo.`} titleClassName="text-glow" />
        <button type="button" onClick={() => setShowCrear(true)} className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-all hover:bg-primary/90">
          <Plus className="size-3.5" /> Nuevo grupo
        </button>
      </div>

      {showCrear && (
        <Modal onClose={() => setShowCrear(false)} titulo="Crear nuevo grupo">
          <GrupoForm onDone={() => { setShowCrear(false); qc.invalidateQueries({ queryKey: ['coordinador', 'grupos'] }); }} />
        </Modal>
      )}

      {groups.length === 0 ? (
        <div className="mt-6"><EmptyState icon={<GraduationCap className="size-10" />} titulo="Sin grupos" descripcion="No hay grupos en el período activo." /></div>
      ) : (
        <div className="mt-6 space-y-2">
          {groups.map((g) => (
            <Link key={g.id} to={`/coordinador/grupos/${g.id}`} className="block rounded-xl border border-border bg-card card-neumorf p-4 transition-all hover:border-primary/20 hover:shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-sans font-semibold text-foreground">{g.cursoNombre}</h3>
                  <p className="font-mono text-xs text-muted-foreground">{g.cursoCodigo} · {g.programaNombre} · {g.periodoNombre}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="size-3" />{horarioStr(g.horario)}</span>
                    <span className="flex items-center gap-1"><MapPin className="size-3" />{g.aula}</span>
                    <span className="flex items-center gap-1"><User className="size-3" />{g.docenteNombre}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="size-3.5" />{g.totalEstudiantes}/{g.cupo}</span>
                  <ActaBadge cerrada={g.actaCerrada} />
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ActaBadge({ cerrada }: { cerrada: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-xs ${cerrada ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'border-amber-500/30 text-amber-600 dark:text-amber-400'}`}>
      {cerrada ? <Lock className="size-3" /> : <FileText className="size-3" />}
      {cerrada ? 'Cerrada' : 'Abierta'}
    </span>
  );
}

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

/* ---- crear ---- */
function GrupoForm({ onDone }: { onDone: () => void }) {
  const { data: cursosData } = useQuery({ queryKey: ['coordinador', 'cursos'], queryFn: () => api.coordinador.cursosDisponibles() });
  const { data: docentesData } = useQuery({ queryKey: ['coordinador', 'docentes'], queryFn: () => api.coordinador.docentesDisponibles() });
  const cursos = cursosData?.data ?? [];
  const docentes = docentesData?.data ?? [];

  const [cursoId, setCursoId] = useState('');
  const [aula, setAula] = useState('');
  const [cupo, setCupo] = useState('30');
  const [docenteId, setDocenteId] = useState('');
  const [bloques, setBloques] = useState<{ dia: number; inicio: string; fin: string }[]>([{ dia: 1, inicio: '08:00', fin: '10:00' }]);

  const crear = useMutation({
    mutationFn: () => api.coordinador.crearGrupo({ cursoId, horario: bloques as BloqueHorario[], aula, docenteId, cupo: parseInt(cupo) || 30 }),
    onSuccess: onDone,
  });

  const addBloque = () => setBloques([...bloques, { dia: 1, inicio: '08:00', fin: '10:00' }]);
  const updBloque = (i: number, k: string, v: any) => {
    const next = bloques.map((b, j) => (j === i ? { ...b, [k]: v } : b));
    setBloques(next);
  };
  const delBloque = (i: number) => bloques.length > 1 && setBloques(bloques.filter((_, j) => j !== i));

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Curso</label>
        <select value={cursoId} onChange={(e) => setCursoId(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none">
          <option value="">Seleccionar…</option>
          {cursos.map((c) => <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Docente</label>
        <select value={docenteId} onChange={(e) => setDocenteId(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none">
          <option value="">Seleccionar…</option>
          {docentes.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
        </select>
      </div>
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
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Horario</label>
        {bloques.map((b, i) => (
          <div key={i} className="mb-2 flex items-center gap-2">
            <select value={b.dia} onChange={(e) => updBloque(i, 'dia', parseInt(e.target.value))} className="w-20 rounded-lg border border-border bg-background px-2 py-2 text-xs text-foreground focus:border-primary focus:outline-none">
              {DIAS.slice(1).map((d, idx) => <option key={idx + 1} value={idx + 1}>{d}</option>)}
            </select>
            <select value={b.inicio} onChange={(e) => updBloque(i, 'inicio', e.target.value)} className="w-24 rounded-lg border border-border bg-background px-2 py-2 text-xs text-foreground focus:border-primary focus:outline-none">
              {HORAS.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
            <span className="text-xs text-muted-foreground">a</span>
            <select value={b.fin} onChange={(e) => updBloque(i, 'fin', e.target.value)} className="w-24 rounded-lg border border-border bg-background px-2 py-2 text-xs text-foreground focus:border-primary focus:outline-none">
              {HORAS.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
            <button type="button" onClick={() => delBloque(i)} className="p-1 text-red-400 hover:text-red-500 disabled:opacity-30" disabled={bloques.length <= 1}><X className="size-3.5" /></button>
          </div>
        ))}
        <button type="button" onClick={addBloque} className="text-xs text-primary hover:underline">+ Agregar bloque</button>
      </div>
      <button type="button" onClick={() => crear.mutate()} disabled={!cursoId || !docenteId || !aula || crear.isPending} className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50">
        {crear.isPending ? 'Creando…' : <><CheckCircle className="size-4" /> Crear grupo</>}
      </button>
      {crear.isError && <p className="text-xs text-red-500">Error al crear</p>}
    </div>
  );
}
