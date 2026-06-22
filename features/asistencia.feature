# language: es

Funcionalidad: Asistencia
  Como docente del SIU
  Quiero registrar la asistencia de mis estudiantes
  Para llevar el control de presencia en clase

  Antecedentes:
    Dado que estoy autenticado como "dario@uni.edu" (rol: docente)
    Y el grupo "MAT101" tiene estudiantes activos

  Escenario: Registrar asistencia en batch
    Cuando envío POST /grupos/:id/asistencia con "fecha" y "registros"
    Entonces recibo HTTP 200
    Y los registros contienen "inscripcionId", "estado"

  Escenario: Consultar asistencia por fecha
    Cuando envío GET /grupos/:id/asistencia?fecha=2025-03-10
    Entonces recibo HTTP 200
    Y "data.fecha" es "2025-03-10"
    Y "data.registros" contiene los estudiantes con su estado

  Escenario: No se puede registrar asistencia con acta cerrada
    Dado que el acta del grupo está cerrada
    Cuando envío POST /grupos/:id/asistencia
    Entonces recibo HTTP 409

  Escenario: Estudiante ve su propia asistencia
    Dado que estoy autenticado como "ana@uni.edu"
    Cuando envío GET /asistencia
    Entonces recibo HTTP 200
    Y solo veo mis propias asistencias

  Escenario: Upsert de asistencia (misma fecha sobreescribe)
    Dado que ya existe un registro de asistencia para una fecha
    Cuando envío POST /grupos/:id/asistencia con nuevos estados para la misma fecha
    Entonces recibo HTTP 200
    Y los estados se actualizan (upsert)
