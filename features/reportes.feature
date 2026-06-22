# language: es

Funcionalidad: Reportes y dashboard
  Como administrador y coordinador
  Quiero ver estadísticas y KPIs del sistema
  Para tomar decisiones académicas

  Antecedentes:
    Dado que estoy autenticado como "lucia@uni.edu" (rol: administrativo)

  Escenario: Ver dashboard administrativo
    Cuando envío GET /admin/dashboard
    Entonces recibo HTTP 200
    Y "data" contiene "totalUsuarios", "totalEstudiantes", "totalDocentes"
    Y "data" contiene "totalCoordinadores", "totalAdministrativos"
    Y "data" contiene "periodoActivo", "totalGruposActivos", "totalInscripciones"

  Escenario: Dashboard refleja datos reales
    Cuando envío GET /admin/dashboard
    Entonces "data.totalUsuarios" es 5
    Y "data.totalEstudiantes" es 1
    Y "data.totalGruposActivos" es mayor que 0

  Escenario: Reporte de resumen del sistema
    Cuando envío GET /reportes/resumen
    Entonces recibo HTTP 200
    Y "data" contiene "totalGrupos", "totalInscripciones", "aprobados", "reprobados", "retirados"
    Y "data" contiene "tasaDesercion", "distribucionNotas", "rendimientoPorGrupo"

  Escenario: Reporte KPI del coordinador
    Dado que estoy autenticado como "carlos@uni.edu"
    Cuando envío GET /coordinador/reportes/kpi
    Entonces recibo HTTP 200
    Y "data" contiene "totalEstudiantes", "tasaAprobacionGeneral", "totalGrupos", "totalRetirados"

  Escenario: Reporte de rendimiento por grupo
    Dado que estoy autenticado como "carlos@uni.edu"
    Cuando envío GET /coordinador/reportes
    Entonces recibo HTTP 200
    Y "data.rendimiento" contiene objetos con "cursoNombre", "grupoId", "promedio", "tasaAprobacion"

  Escenario: Progreso del estudiante hacia la graduación
    Dado que estoy autenticado como "ana@uni.edu"
    Cuando envío GET /estudiante/progreso
    Entonces recibo HTTP 200
    Y "data" es un array agrupado por programa
    Y cada elemento tiene "programaNombre", "totalCreditos", "aprobados", "porcentaje"

  Escenario: Coordinador ve lista de grupos con estadísticas
    Dado que estoy autenticado como "carlos@uni.edu"
    Cuando envío GET /coordinador/grupos
    Entonces recibo HTTP 200
    Y cada grupo tiene "cursoNombre", "docenteNombre", "totalEstudiantes", "actaCerrada"

  Escenario: Coordinador ve detalle de grupo con estudiantes
    Cuando envío GET /coordinador/grupos/:id
    Entonces recibo HTTP 200
    Y "data" contiene "estudiantes" con "nombre", "email", "estado"
    Y "data" contiene "docenteId", "totalEstudiantes", "cupoDisponible"
