# language: es

Funcionalidad: Gestión de Grupos
  Como coordinador y docente
  Quiero crear y administrar grupos (paralelos)
  Para organizar la oferta de cursos por período

  Antecedentes:
    Dado que existe el período activo "2025-1"
    Y existe el curso "MAT101" (Álgebra)
    Y existe el docente "dario@uni.edu"

  Escenario: Listar grupos disponibles para inscripción (vista estudiante)
    Dado que estoy autenticado como "ana@uni.edu"
    Cuando envío GET /grupos/disponibles
    Entonces recibo HTTP 200
    Y cada grupo tiene "cursoNombre", "cursoCodigo", "docenteNombre", "cupoDisponible", "inscrito"
    Y todos los grupos tienen "cupoDisponible" mayor a 0

  Escenario: Ver detalle de un grupo con curso, docente y periodo
    Cuando envío GET /grupos/:id
    Entonces recibo HTTP 200
    Y "data.curso" contiene nombre del curso
    Y "data.docente" contiene nombre del docente
    Y "data.periodo" contiene nombre del período

  Escenario: Coordinador crea un grupo
    Dado que estoy autenticado como "carlos@uni.edu"
    Cuando envío POST /coordinador/grupos con cursoId, horario, docenteId y cupo
    Entonces recibo HTTP 201
    Y "data.cursoCodigo" coincide con el curso seleccionado
    Y "data.periodoNombre" es el período activo
    Y "data.totalEstudiantes" es 0

  Escenario: Coordinador actualiza datos de un grupo
    Cuando envío PATCH /coordinador/grupos/:id con "aula": "Nueva Aula"
    Entonces recibo HTTP 200
    Y "data.aula" es "Nueva Aula"

  Escenario: Docente ve sus grupos
    Dado que estoy autenticado como "dario@uni.edu"
    Cuando envío GET /grupos/mis
    Entonces recibo HTTP 200
    Y cada grupo tiene "cursoNombre", "totalEstudiantes", "evaluacionesCount"
    Y todos los grupos pertenecen a "dario@uni.edu"

  Escenario: Docente consulta vista de calificar
    Dado que existe un grupo con evaluaciones creadas
    Cuando envío GET /grupos/:id/calificar
    Entonces recibo HTTP 200
    Y "data.evaluaciones" contiene las evaluaciones del grupo
    Y "data.estudiantes" contiene los estudiantes activos

  Escenario: Cerrar acta con pesos de evaluación válidos
    Dado que las evaluaciones del grupo suman 100%
    Y todas las inscripciones activas tienen calificaciones completas
    Cuando envío POST /grupos/:id/cerrar-acta
    Entonces recibo HTTP 200
    Y "data.actaCerrada" es true

  Escenario: No se puede cerrar acta si pesos no suman 100
    Dado que las evaluaciones del grupo suman 80%
    Cuando envío POST /grupos/:id/cerrar-acta
    Entonces recibo HTTP 422
    Y "error.code" es "evaluation_weights_invalid"

  Escenario: Reabrir acta con motivo
    Dado que el acta del grupo está cerrada
    Cuando envío POST /grupos/:id/reabrir-acta con "motivo" de al menos 10 caracteres
    Entonces recibo HTTP 200
    Y "data.actaCerrada" es false
    Y "data.motivoReapertura" contiene el motivo

  Escenario: No se puede reabrir acta que no está cerrada
    Dado que el acta del grupo está abierta
    Cuando envío POST /grupos/:id/reabrir-acta
    Entonces recibo HTTP 409

  Escenario: Docente crea evaluación para su grupo
    Dado que estoy autenticado como "dario@uni.edu"
    Cuando envío POST /grupos/:id/evaluaciones con nombre y peso
    Entonces recibo HTTP 200

  Escenario: No se puede modificar grupo con acta cerrada
    Dado que el acta del grupo está cerrada
    Cuando envío POST /grupos/:id/evaluaciones
    Entonces recibo HTTP 409
    Y "error.code" es "acta_cerrada"
