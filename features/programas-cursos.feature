# language: es

Funcionalidad: Catálogo académico
  Como usuario autenticado del SIU
  Quiero consultar programas y cursos disponibles
  Para conocer la oferta académica

  Antecedentes:
    Dado que estoy autenticado como "ana@uni.edu"

  Escenario: Listar todos los programas
    Cuando envío GET /programas
    Entonces recibo HTTP 200
    Y "data" es un array con programas que tienen "id", "nombre", "codigo"

  Escenario: Ver detalle de un programa con sus cursos
    Cuando envío GET /programas/:id (programa Ingeniería Informática)
    Entonces recibo HTTP 200
    Y "data.nombre" contiene "Ingeniería"
    Y "data.cursos" es un array con cursos del programa

  Escenario: Listar todos los cursos
    Cuando envío GET /cursos
    Entonces recibo HTTP 200
    Y "data" es un array con cursos que tienen "codigo", "nombre", "creditos", "programaId"

  Escenario: Filtrar cursos por programa
    Cuando envío GET /cursos?programaId=<ING-INF>
    Entonces recibo HTTP 200
    Y todos los cursos en "data" pertenecen a Ingeniería Informática

  Escenario: Ver detalle de curso con prerrequisitos resueltos
    Cuando envío GET /cursos/:id (Estructuras de Datos)
    Entonces recibo HTTP 200
    Y "data.prerrequisitos" es un array con los cursos prerrequisito

  Escenario: Programa inexistente devuelve 404
    Cuando envío GET /programas/00000000-0000-0000-0000-000000000000
    Entonces recibo HTTP 404

  Escenario: Coordinador puede crear curso
    Dado que estoy autenticado como "carlos@uni.edu" (rol: coordinador)
    Cuando envío POST /cursos con codigo, nombre, creditos y programaId
    Entonces recibo HTTP 201
    Y "data.codigo" coincide con el enviado

  Escenario: Estudiante no puede crear curso
    Cuando envío POST /cursos con datos válidos
    Entonces recibo HTTP 403
