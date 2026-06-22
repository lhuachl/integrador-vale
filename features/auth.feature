# language: es

Funcionalidad: Autenticación
  Como usuario del SIU
  Quiero poder iniciar y cerrar sesión
  Para acceder a las funcionalidades según mi rol

  Antecedentes:
    Dado que el sistema está en funcionamiento

  Escenario: Login exitoso como estudiante
    Cuando envío POST /auth/login con email "ana@uni.edu" y password "estudiante123"
    Entonces recibo HTTP 200
    Y el cuerpo contiene "data.id"
    Y el cuerpo contiene "data.rol" igual a "estudiante"
    Y la respuesta incluye una cookie "Session" httpOnly

  Escenario: Login exitoso como administrativo
    Cuando envío POST /auth/login con email "lucia@uni.edu" y password "admin123"
    Entonces recibo HTTP 200
    Y el cuerpo contiene "data.rol" igual a "administrativo"

  Escenario: Login con credenciales inválidas
    Cuando envío POST /auth/login con email "ana@uni.edu" y password "incorrecta"
    Entonces recibo HTTP 401
    Y el cuerpo contiene "error.code" igual a "invalid_credentials"

  Escenario: Obtener perfil autenticado
    Dado que estoy autenticado como "ana@uni.edu"
    Cuando envío GET /auth/me
    Entonces recibo HTTP 200
    Y el cuerpo contiene "data.email" igual a "ana@uni.edu"
    Y el cuerpo contiene "data.rol" igual a "estudiante"

  Escenario: Obtener perfil sin autenticación
    Cuando envío GET /auth/me sin cookie de sesión
    Entonces recibo HTTP 401
    Y el cuerpo contiene "error.code" igual a "session_expired"

  Escenario: Cerrar sesión
    Dado que estoy autenticado como "ana@uni.edu"
    Cuando envío POST /auth/logout
    Entonces recibo HTTP 204
    Y la cookie "Session" es removida
