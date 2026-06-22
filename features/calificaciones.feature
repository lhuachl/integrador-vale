# language: es

Funcionalidad: Evaluaciones y calificaciones
  Como docente del SIU
  Quiero crear evaluaciones y registrar calificaciones
  Para llevar el control académico de mis grupos

  Antecedentes:
    Dado que estoy autenticado como "dario@uni.edu" (rol: docente)
    Y el grupo "MAT101" tiene el acta abierta

  Escenario: Crear evaluación para un grupo
    Cuando envío POST /grupos/:id/evaluaciones con nombre y peso
    Entonces recibo HTTP 200
    Y la evaluación aparece en GET /grupos/:id/calificar

  Escenario: No se puede crear evaluación con acta cerrada
    Dado que el acta del grupo está cerrada
    Cuando envío POST /grupos/:id/evaluaciones
    Entonces recibo HTTP 409

  Escenario: Registrar calificaciones en batch
    Dado que existen evaluaciones para el grupo
    Y existen estudiantes activos en el grupo
    Cuando envío POST /grupos/:id/calificaciones con "evaluacionId" y "notas"
    Entonces recibo HTTP 200
    Y las calificaciones se reflejan en GET /grupos/:id/calificar

  Escenario: Estudiante ve sus calificaciones
    Dado que estoy autenticado como "ana@uni.edu"
    Cuando envío GET /calificaciones/mis
    Entonces recibo HTTP 200
    Y cada elemento tiene "cursoNombre", "notaFinal", "evaluaciones", "estado"

  Escenario: Nota final calculada como promedio ponderado
    Dado que tengo calificación 16 en Parcial1 (peso 40%) y 14 en Parcial2 (peso 60%)
    Cuando consulto GET /calificaciones/mis
    Entonces "notaFinal" es 14.8

  Escenario: Eliminar evaluación sin calificaciones asociadas
    Dado que la evaluación no tiene calificaciones registradas
    Cuando envío DELETE /evaluaciones/:id
    Entonces recibo HTTP 204

  Escenario: No se puede eliminar evaluación con calificaciones
    Dado que la evaluación tiene calificaciones asociadas
    Cuando envío DELETE /evaluaciones/:id
    Entonces recibo HTTP 409

  Escenario: Docente no puede calificar grupo de otro docente
    Dado que el grupo pertenece a otro docente
    Cuando envío POST /grupos/:id/calificaciones
    Entonces recibo HTTP 403
