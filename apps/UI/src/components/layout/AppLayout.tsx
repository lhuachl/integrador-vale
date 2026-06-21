import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { BarChart3, CalendarRange, GraduationCap, LayoutDashboard, LogOut, Moon, Shield, Sun, Users, ClipboardList, User, Calendar, BookOpen, BookPlus, TrendingUp } from 'lucide-react';
import { api } from '@/api/client';
import type { ApiResponse, Rol, Usuario } from '@/api/types';

const MOCK_DEMO_LOGINS: Record<Rol, { email: string; password: string }> = {
  estudiante: { email: 'ana@uni.edu', password: 'estudiante123' },
  docente: { email: 'dario@uni.edu', password: 'docente123' },
  coordinador: { email: 'carlos@uni.edu', password: 'coord123' },
  administrativo: { email: 'lucia@uni.edu', password: 'admin123' },
};

function Avatar({ nombre }: { nombre: string }) {
  const initials = nombre
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
      {initials}
    </div>
  );
}

const NAV_POR_ROL: Record<Rol, { to: string; label: string; icon: typeof GraduationCap }[]> = {
  estudiante: [
    { to: '/estudiante/cursos', label: 'Mis cursos', icon: BookOpen },
    { to: '/estudiante/calificaciones', label: 'Calificaciones', icon: ClipboardList },
    { to: '/estudiante/horario', label: 'Horario semanal', icon: Calendar },
    { to: '/estudiante/inscripciones', label: 'Inscripción', icon: BookPlus },
    { to: '/estudiante/progreso', label: 'Progreso', icon: TrendingUp },
  ],
  docente: [
    { to: '/docente/grupos', label: 'Mis grupos', icon: GraduationCap },
  ],
  coordinador: [
    { to: '/coordinador/grupos', label: 'Gestión de grupos', icon: BookOpen },
    { to: '/coordinador/reportes', label: 'Reportes', icon: Shield },
  ],
  administrativo: [
    { to: '/administrativo', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/administrativo/usuarios', label: 'Usuarios', icon: Users },
    { to: '/administrativo/periodos', label: 'Períodos', icon: CalendarRange },
    { to: '/coordinador/grupos', label: 'Gestión de grupos', icon: BookOpen },
    { to: '/coordinador/reportes', label: 'Reportes', icon: BarChart3 },
  ],
};

const ROLE_HOME: Record<Rol, string> = {
  estudiante: '/estudiante/cursos',
  docente: '/docente/grupos',
  coordinador: '/coordinador/grupos',
  administrativo: '/administrativo',
};

const ALL_ROLES: Rol[] = ['estudiante', 'docente', 'coordinador', 'administrativo'];

export function AppLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const { data: meResult, isLoading } = useQuery<ApiResponse<Usuario>>({
    queryKey: ['auth', 'me'],
    queryFn: () => api.auth.me(),
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !meResult) navigate('/login', { replace: true });
  }, [isLoading, meResult, navigate]);

  if (!meResult) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">
        Cargando…
      </div>
    );
  }

  const me = meResult.data;
  const nav = NAV_POR_ROL[me.rol];

  async function handleLogout() {
    await api.auth.logout();
    queryClient.clear();
    navigate('/login', { replace: true });
  }

  async function handleSwitchRole(rol: Rol) {
    if (rol === me.rol) return;
    const creds = MOCK_DEMO_LOGINS[rol];
    try {
      await api.auth.logout();
      await api.auth.login(creds);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      navigate(ROLE_HOME[rol], { replace: true });
    } catch {
      handleLogout();
    }
  }

  return (
    <div className="flex h-screen bg-background text-foreground font-sans">
      <aside className="flex w-60 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground card-neumorf-sm">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <h1 className="font-serif text-xl font-bold text-sidebar-primary">Avior SIU</h1>
          <p className="mt-1 text-xs text-sidebar-foreground/60">Sistema Integrado Universitario</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/40">
            Navegación
          </p>
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium glow-sm border-l-2 border-primary'
                    : 'text-sidebar-foreground/60 hover:bg-accent hover:text-accent-foreground'
                }`
              }
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </NavLink>
          ))}

          <div className="my-3 border-t border-sidebar-border" />

          <NavLink
            to="/perfil"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium glow-sm border-l-2 border-primary'
                  : 'text-sidebar-foreground/60 hover:bg-accent hover:text-accent-foreground'
              }`
            }
          >
            <User className="size-4 shrink-0" />
            Mi perfil
          </NavLink>

          <div className="my-3 border-t border-sidebar-border" />

          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/40">
            Cambiar rol (mock)
          </p>
          <div className="space-y-0.5">
            {ALL_ROLES.map((rol) => (
              <button
                key={rol}
                type="button"
                onClick={() => handleSwitchRole(rol)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs capitalize transition-all ${
                  me.rol === rol
                    ? 'bg-primary/10 text-primary font-medium glow-sm'
                    : 'text-sidebar-foreground/50 hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {rol}
              </button>
            ))}
          </div>
        </nav>

        <div className="px-3 py-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3">
            <Avatar nombre={me.nombre} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-sidebar-foreground">{me.nombre}</p>
              <p className="text-xs text-sidebar-foreground/40 capitalize">{me.rol}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 p-1.5 rounded-lg text-sidebar-foreground/40 transition-all hover:bg-accent hover:text-accent-foreground"
              aria-label="Cerrar sesión"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card/50 px-6 backdrop-blur-sm">
          <h2 className="font-serif text-lg capitalize text-foreground/80">{me.rol}</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              className="p-2 rounded-lg text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground"
              aria-label="Cambiar tema"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">{me.nombre}</span>
              <Avatar nombre={me.nombre} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
