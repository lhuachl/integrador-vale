import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { CheckCircle, Eye, EyeOff, Pencil, Trash2, UserPlus, Users, X } from 'lucide-react';
import { api } from '@/api/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import type { Rol, Usuario } from '@/api/types';

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

const ROLES: { value: Rol; label: string }[] = [
  { value: 'estudiante', label: 'Estudiante' },
  { value: 'docente', label: 'Docente' },
  { value: 'coordinador', label: 'Coordinador' },
  { value: 'administrativo', label: 'Administrativo' },
];

export function AdministrativoUsuariosPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editar, setEditar] = useState<Usuario | null>(null);
  const [filtroRol, setFiltroRol] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['usuarios', filtroRol],
    queryFn: () => api.usuarios.list(filtroRol ? { rol: filtroRol } : undefined),
  });

  const usuarios = data?.data ?? [];

  if (isLoading) return <LoadingState mensaje="Cargando usuarios…" />;
  if (error) return <ErrorState error="No se pudieron cargar los usuarios." onRetry={() => refetch()} />;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <PageHeader titulo="Usuarios" descripcion={`${usuarios.length} usuario(s) registrados.`} titleClassName="text-glow" />
        <button type="button" onClick={() => setShowForm(true)} className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-all hover:bg-primary/90">
          <UserPlus className="size-3.5" /> Nuevo usuario
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Filtrar:</span>
        {['', 'estudiante', 'docente', 'coordinador', 'administrativo'].map((r) => (
          <button key={r} type="button" onClick={() => setFiltroRol(r)}
            className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${filtroRol === r ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
          >
            {r ? ROLES.find((x) => x.value === r)?.label : 'Todos'}
          </button>
        ))}
      </div>

      {showForm && (
        <Modal onClose={() => setShowForm(false)} titulo="Crear usuario">
          <UsuarioForm onDone={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['usuarios'] }); }} />
        </Modal>
      )}

      {editar && (
        <Modal onClose={() => setEditar(null)} titulo="Editar usuario">
          <EditarUsuarioForm user={editar} onDone={() => { setEditar(null); qc.invalidateQueries({ queryKey: ['usuarios'] }); }} />
        </Modal>
      )}

      {usuarios.length === 0 ? (
        <div className="mt-6"><EmptyState icon={<Users className="size-10" />} titulo="Sin usuarios" descripcion="No hay usuarios registrados." /></div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card card-neumorf">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-sans text-xs font-semibold text-muted-foreground">Nombre</th>
                <th className="px-4 py-3 text-left font-sans text-xs font-semibold text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-center font-sans text-xs font-semibold text-muted-foreground">Rol</th>
                <th className="px-4 py-3 text-center font-sans text-xs font-semibold text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-center font-sans text-xs font-semibold text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{u.nombre}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 text-center"><RolBadge rol={u.rol} /></td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${u.activo ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button type="button" onClick={() => setEditar(u)} className="rounded-lg border border-border p-1.5 text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground">
                        <Pencil className="size-3.5" />
                      </button>
                      <EliminarUsuarioBtn userId={u.id} onDone={() => qc.invalidateQueries({ queryKey: ['usuarios'] })} />
                    </div>
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

function RolBadge({ rol }: { rol: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    estudiante: { label: 'Est.', cls: 'border-sky-500/30 text-sky-600 dark:text-sky-400' },
    docente: { label: 'Doc.', cls: 'border-violet-500/30 text-violet-600 dark:text-violet-400' },
    coordinador: { label: 'Coord.', cls: 'border-amber-500/30 text-amber-600 dark:text-amber-400' },
    administrativo: { label: 'Admin.', cls: 'border-primary/30 text-primary' },
  };
  const m = map[rol] ?? { label: rol, cls: 'border-muted-foreground/30 text-muted-foreground' };
  return <span className={`rounded-full border px-2 py-0.5 font-mono text-xs ${m.cls}`}>{m.label}</span>;
}

function UsuarioForm({ onDone }: { onDone: () => void }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState<Rol>('estudiante');
  const [showPw, setShowPw] = useState(false);

  const crear = useMutation({
    mutationFn: () => api.usuarios.crear({ nombre, email, password, rol, programaIds: [] }),
    onSuccess: onDone,
  });

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Nombre</label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Contraseña</label>
        <div className="relative">
          <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-8 text-sm text-foreground focus:border-primary focus:outline-none" />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showPw ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}</button>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Rol</label>
        <select value={rol} onChange={(e) => setRol(e.target.value as Rol)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none">
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      <button type="button" onClick={() => crear.mutate()} disabled={!nombre || !email || !password || crear.isPending} className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50">
        {crear.isPending ? 'Creando…' : <><CheckCircle className="size-4" /> Crear usuario</>}
      </button>
      {crear.isError && <p className="text-xs text-red-500">Error al crear</p>}
    </div>
  );
}

function EditarUsuarioForm({ user, onDone }: { user: Usuario; onDone: () => void }) {
  const [nombre, setNombre] = useState(user.nombre);
  const [email, setEmail] = useState(user.email);

  const actualizar = useMutation({
    mutationFn: () => api.usuarios.actualizar(user.id, { nombre, email }),
    onSuccess: onDone,
  });

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Editando: <span className="font-medium text-foreground">{user.nombre}</span> ({ROLES.find((r) => r.value === user.rol)?.label})</p>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Nombre</label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
      </div>
      <button type="button" onClick={() => actualizar.mutate()} disabled={!nombre || !email || actualizar.isPending} className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50">
        {actualizar.isPending ? 'Guardando…' : <><CheckCircle className="size-4" /> Guardar cambios</>}
      </button>
      {actualizar.isError && <p className="text-xs text-red-500">Error al guardar</p>}
    </div>
  );
}

function EliminarUsuarioBtn({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const eliminar = useMutation({
    mutationFn: () => api.usuarios.eliminar(userId),
    onSuccess: onDone,
  });

  if (!confirm) return <button type="button" onClick={() => setConfirm(true)} className="rounded-lg border border-red-500/30 p-1.5 text-red-400 transition-all hover:bg-red-500/10"><Trash2 className="size-3.5" /></button>;

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-red-500">¿Eliminar?</span>
      <button type="button" onClick={() => eliminar.mutate()} disabled={eliminar.isPending} className="rounded-lg bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600">Sí</button>
      <button type="button" onClick={() => setConfirm(false)} className="rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent">No</button>
    </div>
  );
}
