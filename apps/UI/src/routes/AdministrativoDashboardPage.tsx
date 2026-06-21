import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, CalendarRange, GraduationCap, LayoutDashboard, School, UserCheck, Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { api } from '@/api/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { StatCard } from '@/components/ui/StatCard';

const PIE_COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#DC2626'];

export function AdministrativoDashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.admin.dashboard(),
  });

  const d = data?.data;

  if (isLoading) return <LoadingState mensaje="Cargando dashboard…" />;
  if (error) return <ErrorState error="No se pudo cargar el dashboard." onRetry={() => refetch()} />;
  if (!d) return null;

  const pieData = [
    { name: 'Estudiantes', value: d.totalEstudiantes },
    { name: 'Docentes', value: d.totalDocentes },
    { name: 'Coordinadores', value: d.totalCoordinadores },
    { name: 'Administrativos', value: d.totalAdministrativos },
  ].filter((x) => x.value > 0);

  return (
    <div>
      <PageHeader titulo="Dashboard administrativo" descripcion="Resumen del sistema y acceso rápido." titleClassName="text-glow" />

      {/* KPI Cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={<Users className="size-4" />} label="Usuarios totales" valor={d.totalUsuarios} />
        <StatCard icon={<BookOpen className="size-4" />} label="Grupos activos" valor={d.totalGruposActivos} />
        <StatCard icon={<UserCheck className="size-4" />} label="Inscripciones" valor={d.totalInscripciones} />
        <StatCard icon={<CalendarRange className="size-4" />} label="Período activo" valor={d.periodoActivo ?? 'Ninguno'} />
      </div>

      {/* Distribution + Quick Actions */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card card-neumorf p-4">
          <h3 className="mb-4 font-sans text-sm font-semibold text-foreground">Usuarios por rol</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card card-neumorf p-4">
          <h3 className="mb-4 font-sans text-sm font-semibold text-foreground">Acceso rápido</h3>
          <div className="space-y-2">
            <Link to="/administrativo/usuarios" className="flex items-center gap-3 rounded-lg border border-border/50 px-4 py-3 text-sm font-medium text-foreground transition-all hover:bg-accent hover:text-accent-foreground">
              <Users className="size-4 text-primary" />
              <span>Gestión de usuarios</span>
            </Link>
            <Link to="/administrativo/periodos" className="flex items-center gap-3 rounded-lg border border-border/50 px-4 py-3 text-sm font-medium text-foreground transition-all hover:bg-accent hover:text-accent-foreground">
              <CalendarRange className="size-4 text-primary" />
              <span>Gestión de períodos</span>
            </Link>
            <div className="flex items-center gap-3 rounded-lg border border-border/50 px-4 py-3 text-sm text-muted-foreground">
              <School className="size-4" />
              <span>{d.totalDocentes} docente(s) activos</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border/50 px-4 py-3 text-sm text-muted-foreground">
              <GraduationCap className="size-4" />
              <span>{d.totalEstudiantes} estudiante(s) activos</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border/50 px-4 py-3 text-sm text-muted-foreground">
              <LayoutDashboard className="size-4" />
              <span>{d.totalGruposActivos} grupo(s) en período activo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
