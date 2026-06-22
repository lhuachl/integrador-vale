# language: es

Funcionalidad: Períodos académicos
  Como administrador
  Quiero gestionar los períodos académicos
  Para configurar las ventanas de inscripción

  Antecedentes:
    Dado que estoy autenticado como "lucia@uni.edu" (rol: administrativo)

  Escenario: Listar períodos
    Cuando envío GET /periodos
    Entonces recibo HTTP 200
    Y "data" contiene períodos con "nombre", "tipo", "fechaInicio", "estado"
    Y "meta" contiene paginación

  Escenario: Filtrar períodos activos
    Cuando envío GET /periodos?estado=activo
    Entonces todos los períodos en "data" tienen "estado" igual a "activo"

  Escenario: Crear nuevo período
    Cuando envío POST /periodos con nombre, tipo, fechas válidas
    Entonces recibo HTTP 201
    Y "data.estado" es "borrador"

  Escenario: Transición de estado inválida
    Dado que existe un período en estado "cerrado"
    Cuando envío PATCH /periodos/:id con "estado": "activo"
    Entonces recibo HTTP 409
    Y "error.code" es "invalid_transition"

  Escenario: Activar período borrador
    Dado que existe un período en estado "borrador"
    Cuando envío PATCH /periodos/:id con "estado": "activo"
    Entonces recibo HTTP 200

  Escenario: Eliminar período sin grupos
    Dado que existe un período sin grupos asociados
    Cuando envío DELETE /periodos/:id
    Entonces recibo HTTP 204

  Escenario: No se puede eliminar período con grupos
    Dado que el período "2025-1" tiene grupos asociados
    Cuando envío DELETE /periodos/2025-1
    Entonces recibo HTTP 409
