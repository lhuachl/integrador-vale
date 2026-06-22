# language: es

Funcionalidad: Gestión de usuarios
  Como administrador del SIU
  Quiero crear, listar, actualizar y desactivar usuarios
  Para administrar el acceso al sistema

  Antecedentes:
    Dado que estoy autenticado como "lucia@uni.edu" (rol: administrativo)

  Escenario: Listar todos los usuarios
    Cuando envío GET /usuarios
    Entonces recibo HTTP 200
    Y "data" es un array con al menos 4 elementos
    Y cada elemento tiene "id", "nombre", "email", "rol", "programaIds", "activo"
    Y "meta" contiene "page", "limit", "total"

  Escenario: Listar usuarios filtrados por rol
    Cuando envío GET /usuarios?rol=estudiante
    Entonces recibo HTTP 200
    Y todos los elementos en "data" tienen "rol" igual a "estudiante"

  Escenario: Ver un usuario por ID
    Cuando envío GET /usuarios/:id (siendo :id el ID de ana@uni.edu)
    Entonces recibo HTTP 200
    Y "data.email" es "ana@uni.edu"

  Escenario: Ver usuario inexistente
    Cuando envío GET /usuarios/00000000-0000-0000-0000-000000000000
    Entonces recibo HTTP 404
    Y "error.code" es "not_found"

  Escenario: Crear nuevo usuario
    Cuando envío POST /usuarios con nombre, email único, password, rol y programaIds
    Entonces recibo HTTP 201
    Y "data" contiene el nuevo usuario con los campos enviados
    Y "data.activo" es true

  Escenario: Crear usuario con email duplicado
    Cuando envío POST /usuarios con un email que ya existe
    Entonces recibo HTTP 409

  Escenario: Actualizar datos de usuario
    Cuando envío PATCH /usuarios/:id con "nombre": "Nuevo Nombre"
    Entonces recibo HTTP 200
    Y "data.nombre" es "Nuevo Nombre"

  Escenario: Desactivar usuario (soft delete)
    Cuando envío DELETE /usuarios/:id
    Entonces recibo HTTP 204
    Y el usuario ya no aparece en GET /usuarios con activo=true

  Escenario: Estudiante no puede listar usuarios
    Dado que estoy autenticado como "ana@uni.edu" (rol: estudiante)
    Cuando envío GET /usuarios
    Entonces recibo HTTP 403
    Y "error.code" es "forbidden_role"

  Escenario: Estudiante puede ver su propio perfil
    Dado que estoy autenticado como "ana@uni.edu"
    Cuando envío GET /usuarios/:miId
    Entonces recibo HTTP 200
    Y "data.rol" es "estudiante"
