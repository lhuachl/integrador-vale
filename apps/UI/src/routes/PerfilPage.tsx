import { useQuery } from '@tanstack/react-query';
import { Shield, Mail, BookOpen } from 'lucide-react';
import { api } from '@/api/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import type { Usuario } from '@/api/types';

const PROGRAMAS: Record<string, string> = {
  'prog-ing': 'Ingeniería Informática',
  'prog-arq': 'Arquitectura',
};

function Avatar({ nombre, size = 'lg' }: { nombre: string; size?: 'lg' | 'xl' }) {
  const initials = nombre
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const sizeClass = size === 'xl' ? 'size-20 text-2xl' : 'size-12 text-base';
  return (
    <div className={`inline-flex ${sizeClass} items-center justify-center rounded-full bg-primary/20 font-semibold text-primary`}>
      {initials}
    </div>
  );
}

export function PerfilPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.auth.me(),
  });

  if (isLoading) return <LoadingState mensaje="Cargando perfil…" />;

  if (error) return <ErrorState error="No se pudo cargar tu perfil." onRetry={() => refetch()} />;

  const user = data?.data as Usuario | undefined;
  if (!user) return <ErrorState error="No se pudo cargar tu perfil." onRetry={() => refetch()} />;

  return (
    <div className="max-w-2xl">
      <PageHeader titulo="Mi perfil" titleClassName="text-glow" />

      <div className="mt-8 rounded-xl border border-border bg-card card-neumorf p-6 sm:p-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          <Avatar nombre={user.nombre} size="xl" />
          <div className="text-center sm:text-left">
            <h2 className="font-serif text-2xl font-bold text-foreground">{user.nombre}</h2>
            <p className="mt-1 text-sm capitalize text-muted-foreground">{user.rol}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card card-neumorf p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Mail className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Correo</p>
              <p className="text-sm text-foreground">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card card-neumorf p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Shield className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Rol</p>
              <p className="text-sm capitalize text-foreground">{user.rol}</p>
            </div>
          </div>
        </div>
      </div>

      {user.programaIds.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-card card-neumorf p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Programas</p>
              <ul className="mt-1 space-y-1">
                {user.programaIds.map((pid) => (
                  <li key={pid} className="text-sm text-foreground">{PROGRAMAS[pid] ?? pid}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
