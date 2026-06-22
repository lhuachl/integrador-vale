# language: es

Funcionalidad: Inscripciones a cursos
  Como estudiante del SIU
  Quiero inscribirme en grupos disponibles
  Para cursar materias en el período activo

  Antecedentes:
    Dado que estoy autenticado como "ana@uni.edu" (rol: estudiante)
    Y existe el período activo "2025-1" con ventana de inscripción abierta

  Escenario: Solicitar inscripción en un grupo con cupo
    Dado que el grupo tiene cupoDisponible > 0
    Cuando envío POST /inscripciones con "grupoId" del grupo
    Entonces recibo HTTP 201
    Y "data.estado" es "solicitada"
    Y "data.intentos" es 1
    Y el cupoDisponible del grupo disminuye en 1

  Escenario: Ver mis inscripciones
    Cuando envío GET /inscripciones/mis
    Entonces recibo HTTP 200
    Y "data" contiene mis inscripciones con "cursoNombre", "docenteNombre", "estado"

  Escenario: No se puede inscribir en grupo sin cupo
    Dado que el grupo tiene cupoDisponible = 0
    Cuando envío POST /inscripciones con el grupoId
    Entonces recibo HTTP 409
    Y "error.code" es "cupo_lleno"

  Escenario: No se puede inscribir en período inactivo
    Dado que el grupo pertenece a un período cerrado
    Cuando envío POST /inscripciones con el grupoId
    Entonces recibo HTTP 422
    Y "error.code" es "periodo_not_active"

  Escenario: No se puede inscribir fuera de la ventana
    Dado que hoy está fuera de [fechaInicio, fechaFinInscripcion]
    Cuando envío POST /inscripciones
    Entonces recibo HTTP 422
    Y "error.code" es "inscription_window_closed"

  Escenario: No se puede inscribir si faltan prerrequisitos
    Dado que el curso tiene prerrequisitos no aprobados
    Cuando envío POST /inscripciones
    Entonces recibo HTTP 422
    Y "error.code" es "missing_prerequisites"
    Y "error.details.missing" contiene los códigos de cursos faltantes

  Escenario: Reintentar inscripción rechazada (menos de 3 intentos)
    Dado que tengo una inscripción rechazada con intentos < 3
    Cuando envío POST /inscripciones con el mismo grupoId
    Entonces recibo HTTP 201
    Y "data.estado" es "solicitada"
    Y "data.intentos" se incrementa

  Escenario: No se puede reintentar con 3 intentos agotados
    Dado que tengo una inscripción rechazada con intentos = 3
    Cuando envío POST /inscripciones con el mismo grupoId
    Entonces recibo HTTP 409
    Y "error.code" es "max_intentos_exceeded"

  Escenario: Coordinador aprueba inscripción solicitada
    Dado que estoy autenticado como "carlos@uni.edu" (rol: coordinador)
    Y existe una inscripción en estado "solicitada"
    Cuando envío POST /inscripciones/:id/aprobar
    Entonces recibo HTTP 200
    Y "data.estado" es "aprobada"

  Escenario: Coordinador rechaza inscripción
    Dado que existe una inscripción en estado "solicitada"
    Cuando envío POST /inscripciones/:id/rechazar con "motivo" opcional
    Entonces recibo HTTP 200
    Y "data.estado" es "rechazada"
    Y el cupoDisponible del grupo se libera

  Escenario: Estudiante se retira de curso activo
    Dado que tengo una inscripción en estado "activa"
    Cuando envío POST /inscripciones/:id/retirar
    Entonces recibo HTTP 200
    Y "data.estado" es "retirada"

  Escenario: No se puede aprobar inscripción que no está solicitada
    Dado que la inscripción está en estado "activa"
    Cuando envío POST /inscripciones/:id/aprobar
    Entonces recibo HTTP 409
    Y "error.code" es "invalid_transition"

  Escenario: No se puede inscribir si ya aprobaste el curso
    Dado que ya tengo una inscripción "aprobada_final" para este curso
    Cuando envío POST /inscripciones con el mismo curso (otro grupo)
    Entonces recibo HTTP 409
    Y "error.code" es "already_approved_course"

  Escenario: Choque de horario detectado
    Dado que tengo una inscripción activa con horario Lun 08:00-10:00
    Cuando intento inscribirme en un grupo con horario Lun 08:00-10:00
    Entonces recibo HTTP 409
    Y "error.code" es "schedule_conflict"
