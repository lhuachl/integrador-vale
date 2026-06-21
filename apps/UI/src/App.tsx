import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from './routes/LoginPage';
import { AdministrativoDashboardPage } from './routes/AdministrativoDashboardPage';
import { AdministrativoUsuariosPage } from './routes/AdministrativoUsuariosPage';
import { AdministrativoPeriodosPage } from './routes/AdministrativoPeriodosPage';
import { EstudianteCursosPage } from './routes/EstudianteCursosPage';
import { EstudianteCalificacionesPage } from './routes/EstudianteCalificacionesPage';
import { EstudianteHorarioPage } from './routes/EstudianteHorarioPage';
import { EstudianteInscripcionPage } from './routes/EstudianteInscripcionPage';
import { EstudianteProgresoPage } from './routes/EstudianteProgresoPage';
import { DocenteGruposPage } from './routes/DocenteGruposPage';
import { DocenteCalificarPage } from './routes/DocenteCalificarPage';
import { DocenteAsistenciaPage } from './routes/DocenteAsistenciaPage';
import { CoordinadorGruposPage } from './routes/CoordinadorGruposPage';
import { CoordinadorGrupoDetailPage } from './routes/CoordinadorGrupoDetailPage';
import { CoordinadorReportesPage } from './routes/CoordinadorReportesPage';
import { PerfilPage } from './routes/PerfilPage';
import { AppLayout } from './components/layout/AppLayout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<AppLayout />}>
            <Route path="/estudiante/cursos" element={<EstudianteCursosPage />} />
            <Route path="/estudiante/calificaciones" element={<EstudianteCalificacionesPage />} />
            <Route path="/estudiante/horario" element={<EstudianteHorarioPage />} />
            <Route path="/estudiante/inscripciones" element={<EstudianteInscripcionPage />} />
            <Route path="/estudiante/progreso" element={<EstudianteProgresoPage />} />
            <Route path="/perfil" element={<PerfilPage />} />

            <Route path="/docente/grupos" element={<DocenteGruposPage />} />
            <Route path="/docente/grupos/:grupoId" element={<DocenteCalificarPage />} />
            <Route path="/docente/grupos/:grupoId/asistencia" element={<DocenteAsistenciaPage />} />

            <Route path="/coordinador/grupos" element={<CoordinadorGruposPage />} />
            <Route path="/coordinador/grupos/:grupoId" element={<CoordinadorGrupoDetailPage />} />
            <Route path="/coordinador/reportes" element={<CoordinadorReportesPage />} />

            <Route path="/administrativo" element={<AdministrativoDashboardPage />} />
            <Route path="/administrativo/usuarios" element={<AdministrativoUsuariosPage />} />
            <Route path="/administrativo/periodos" element={<AdministrativoPeriodosPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}