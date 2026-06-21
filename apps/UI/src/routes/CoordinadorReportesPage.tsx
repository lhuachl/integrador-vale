import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { BarChart3, BookOpen, Download, GraduationCap, TrendingDown, Users } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { api } from '@/api/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatCard } from '@/components/ui/StatCard';
import type { ReportesView } from '@/api/types';

type Tab = 'dashboard' | 'rendimiento' | 'distribucion' | 'desercion';

function descargarCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function exportPDF(data: ReportesView, kpi: { totalEstudiantes: number; promedioGeneral: number; tasaAprobacionGeneral: number; totalGrupos: number; totalRetirados: number }) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Reportes Avior SIU', 14, 20);
  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 14, 28);

  doc.setFontSize(12);
  doc.text('Indicadores clave', 14, 38);
  autoTable(doc, {
    startY: 42,
    head: [['Indicador', 'Valor']],
    body: [
      ['Estudiantes', String(kpi.totalEstudiantes)],
      ['Grupos activos', String(kpi.totalGrupos)],
      ['Promedio general', String(kpi.promedioGeneral)],
      ['Tasa aprobación', `${kpi.tasaAprobacionGeneral}%`],
      ['Retirados/Cancelados', String(kpi.totalRetirados)],
    ],
    styles: { fontSize: 9 },
  });

  if (data.rendimiento.length > 0) {
    let y = (doc as any).lastAutoTable?.finalY ?? 50;
    doc.setFontSize(12);
    doc.text('Rendimiento por grupo', 14, y + 10);
    autoTable(doc, {
      startY: y + 14,
      head: [['Curso', 'Docente', 'Est.', 'Prom.', 'Aprob.', 'Reprob.', '%']],
      body: data.rendimiento.map((r) => [r.cursoNombre, r.docenteNombre, String(r.estudiantes), String(r.promedio), String(r.aprobados), String(r.reprobados), `${r.tasaAprobacion}%`]),
      styles: { fontSize: 8 },
    });
  }

  doc.save('reportes-avior.pdf');
}

export function CoordinadorReportesPage() {
  const [tab, setTab] = useState<Tab>('dashboard');

  const kpiQ = useQuery({ queryKey: ['coordinador', 'reportes', 'kpi'], queryFn: () => api.coordinador.reportesKPI() });
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['coordinador', 'reportes'],
    queryFn: () => api.coordinador.reportes(),
  });

  if (isLoading) return <LoadingState mensaje="Generando reportes…" />;
  if (error) return <ErrorState error="No se pudieron cargar los reportes." onRetry={() => refetch()} />;

  const r = data?.data;
  const kpi = kpiQ.data?.data;
  if (!r || !kpi) return null;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <PageHeader titulo="Reportes" descripcion="Dashboard de indicadores, rendimiento, distribución y deserción." titleClassName="text-glow" />
        <button type="button" onClick={() => exportPDF(r, kpi)} className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground">
          <Download className="size-3.5" /> PDF
        </button>
      </div>

      {/* KPI Cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard icon={<Users className="size-4" />} label="Estudiantes" valor={kpi.totalEstudiantes} />
        <StatCard icon={<BookOpen className="size-4" />} label="Grupos" valor={kpi.totalGrupos} />
        <StatCard icon={<BarChart3 className="size-4" />} label="Promedio" valor={kpi.promedioGeneral.toFixed(1)} />
        <StatCard icon={<GraduationCap className="size-4" />} label="Aprobación" valor={`${kpi.tasaAprobacionGeneral}%`} />
        <StatCard icon={<TrendingDown className="size-4" />} label="Retiros" valor={kpi.totalRetirados} />
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {(['dashboard', 'rendimiento', 'distribucion', 'desercion'] as Tab[]).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition-all ${tab === t ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}>
            {t === 'dashboard' ? 'Dashboard' : t === 'rendimiento' ? 'Rendimiento' : t === 'distribucion' ? 'Distribución' : 'Deserción'}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <CSVExportBtn r={r} tab={tab} />
        </div>
      </div>

      {tab === 'dashboard' && <DashboardTab data={r} />}
      {tab === 'rendimiento' && <RendimientoTab data={r.rendimiento} />}
      {tab === 'distribucion' && <DistribucionTab data={r.distribucion} />}
      {tab === 'desercion' && <DesercionTab data={r.desercion} />}
    </div>
  );
}

function CSVExportBtn({ r, tab }: { r: ReportesView; tab: string }) {
  const handle = () => {
    if (tab === 'rendimiento')
      descargarCSV('rendimiento.csv', ['Curso', 'Docente', 'Estudiantes', 'Promedio', 'Aprobados', 'Reprobados', 'Tasa Aprobación'],
        r.rendimiento.map((x) => [x.cursoNombre, x.docenteNombre, String(x.estudiantes), String(x.promedio), String(x.aprobados), String(x.reprobados), String(x.tasaAprobacion) + '%']));
    else if (tab === 'distribucion')
      descargarCSV('distribucion_notas.csv', ['Rango', 'Cantidad'], r.distribucion.map((x) => [x.rango, String(x.cantidad)]));
    else if (tab === 'desercion')
      descargarCSV('desercion.csv', ['Curso', 'Inscritos', 'Retirados', 'Cancelados', 'Tasa Deserción'],
        r.desercion.map((x) => [x.cursoNombre, String(x.totalInscritos), String(x.retirados), String(x.cancelados), String(x.tasaDesercion) + '%']));
  };
  return (
    <button type="button" onClick={handle} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground">
      <Download className="size-3.5" /> CSV
    </button>
  );
}

function DashboardTab({ data }: { data: ReportesView }) {
  const totalActivas = data.rendimiento.reduce((s, r) => s + r.estudiantes, 0);
  const totalAprobados = data.rendimiento.reduce((s, r) => s + r.aprobados, 0);
  const pendientes = totalActivas - totalAprobados;
  const pieData = [
    { name: 'Aprobados', value: totalAprobados, color: '#10b981' },
    { name: 'Pendientes', value: Math.max(0, pendientes), color: '#f59e0b' },
  ];

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      {/* Promedio por grupo */}
      <div className="rounded-xl border border-border bg-card card-neumorf p-4">
        <h3 className="mb-4 font-sans text-sm font-semibold text-foreground">Promedio por grupo</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.rendimiento}>
            <XAxis dataKey="cursoNombre" tick={{ fontSize: 10 }} />
            <YAxis domain={[0, 20]} />
            <Tooltip />
            <Bar dataKey="promedio" radius={[6, 6, 0, 0]}>
              {data.rendimiento.map((r, i) => (
                <Cell key={i} fill={r.promedio >= 10 ? '#10b981' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Aprobados vs Pendientes */}
      <div className="rounded-xl border border-border bg-card card-neumorf p-4">
        <h3 className="mb-4 font-sans text-sm font-semibold text-foreground">Aprobados vs Pendientes</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Tasa aprobación por grupo */}
      <div className="rounded-xl border border-border bg-card card-neumorf p-4">
        <h3 className="mb-4 font-sans text-sm font-semibold text-foreground">Tasa de aprobación por grupo</h3>
        <div className="space-y-3">
          {data.rendimiento.map((r) => (
            <div key={r.grupoId}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{r.cursoNombre}</span>
                <span className="font-mono text-muted-foreground">{r.tasaAprobacion}%</span>
              </div>
              <div className="h-5 w-full overflow-hidden rounded-lg bg-muted">
                <div className={`h-full rounded-lg transition-all ${r.tasaAprobacion >= 60 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${r.tasaAprobacion}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deserción por grupo */}
      <div className="rounded-xl border border-border bg-card card-neumorf p-4">
        <h3 className="mb-4 font-sans text-sm font-semibold text-foreground">Deserción por grupo</h3>
        <div className="space-y-3">
          {data.desercion.map((d, i) => (
            <div key={i}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{d.cursoNombre}</span>
                <span className="font-mono text-red-400">{d.tasaDesercion}%</span>
              </div>
              <div className="h-5 w-full overflow-hidden rounded-lg bg-muted">
                <div className="h-full rounded-lg bg-red-500" style={{ width: `${Math.min(100, d.tasaDesercion)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RendimientoTab({ data }: { data: ReportesView['rendimiento'] }) {
  if (data.length === 0) return <div className="mt-6"><EmptyState icon={<BarChart3 className="size-10" />} titulo="Sin datos" descripcion="No hay grupos con datos de rendimiento." /></div>;
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card card-neumorf">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left font-sans text-xs font-semibold text-muted-foreground">Curso</th>
            <th className="px-4 py-3 text-left font-sans text-xs font-semibold text-muted-foreground">Docente</th>
            <th className="px-4 py-3 text-center font-sans text-xs font-semibold text-muted-foreground">Est.</th>
            <th className="px-4 py-3 text-center font-sans text-xs font-semibold text-muted-foreground">Prom.</th>
            <th className="px-4 py-3 text-center font-sans text-xs font-semibold text-muted-foreground">Aprob.</th>
            <th className="px-4 py-3 text-center font-sans text-xs font-semibold text-muted-foreground">%</th>
          </tr>
        </thead>
        <tbody>
          {data.map((r) => (
            <tr key={r.grupoId} className="border-b border-border/50 last:border-0">
              <td className="px-4 py-3 font-medium text-foreground">{r.cursoNombre}</td>
              <td className="px-4 py-3 text-muted-foreground">{r.docenteNombre}</td>
              <td className="px-4 py-3 text-center text-muted-foreground">{r.estudiantes}</td>
              <td className="px-4 py-3 text-center font-mono text-foreground">{r.promedio >= 0 ? r.promedio.toFixed(2) : '—'}</td>
              <td className="px-4 py-3 text-center">
                <span className="font-mono text-emerald-600 dark:text-emerald-400">{r.aprobados}</span>
                <span className="mx-1 text-muted-foreground">/</span>
                <span className="font-mono text-red-600 dark:text-red-400">{r.reprobados}</span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className={`font-mono ${r.tasaAprobacion >= 60 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{r.tasaAprobacion}%</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DistribucionTab({ data }: { data: ReportesView['distribucion'] }) {
  const max = Math.max(...data.map((d) => d.cantidad), 1);
  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card card-neumorf p-4">
        <h3 className="mb-4 font-sans text-sm font-semibold text-foreground">Histograma de notas</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <XAxis dataKey="rango" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-3">
        {data.map((d) => (
          <div key={d.rango}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">Rango {d.rango}</span>
              <span className="font-mono text-muted-foreground">{d.cantidad} estudiante(s)</span>
            </div>
            <div className="h-6 w-full overflow-hidden rounded-lg bg-muted">
              <div className="h-full rounded-lg transition-all duration-700" style={{ width: `${(d.cantidad / max) * 100}%`, backgroundColor: d.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DesercionTab({ data }: { data: ReportesView['desercion'] }) {
  if (data.length === 0) return <div className="mt-6"><EmptyState icon={<TrendingDown className="size-10" />} titulo="Sin datos" descripcion="No hay inscripciones registradas." /></div>;
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card card-neumorf">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left font-sans text-xs font-semibold text-muted-foreground">Curso</th>
            <th className="px-4 py-3 text-center font-sans text-xs font-semibold text-muted-foreground">Inscritos</th>
            <th className="px-4 py-3 text-center font-sans text-xs font-semibold text-muted-foreground">Retirados</th>
            <th className="px-4 py-3 text-center font-sans text-xs font-semibold text-muted-foreground">Cancelados</th>
            <th className="px-4 py-3 text-center font-sans text-xs font-semibold text-muted-foreground">Tasa</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0">
              <td className="px-4 py-3 font-medium text-foreground">{d.cursoNombre}</td>
              <td className="px-4 py-3 text-center text-muted-foreground">{d.totalInscritos}</td>
              <td className="px-4 py-3 text-center text-amber-600 dark:text-amber-400">{d.retirados}</td>
              <td className="px-4 py-3 text-center text-red-600 dark:text-red-400">{d.cancelados}</td>
              <td className={`px-4 py-3 text-center font-mono ${d.tasaDesercion > 20 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>{d.tasaDesercion}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
