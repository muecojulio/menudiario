# Política de seguridad

## Reportar una vulnerabilidad

Si encuentras un problema de seguridad, **no abras un issue público**. Usa la función
_Report a vulnerability_ (GitHub Security Advisories) de este repositorio o escribe al
mantenedor desde su perfil de GitHub. Incluye los pasos para reproducirlo y el impacto
esperado. Responderemos en un plazo razonable y coordinaremos la corrección antes de publicar.

## Versiones soportadas

Solo la rama `main` recibe correcciones de seguridad.

## Medidas en el proyecto

- **Sin secretos en el código ni claves de terceros.** Todas las APIs integradas son públicas
  y no requieren clave ni registro.
- **Validación de entrada:** cada función del servidor valida sus parámetros con zod, y lo guardado
  en `localStorage` se valida antes de usarse.
- **Datos externos tratados como no confiables:** respuestas limitadas en tamaño y tiempo,
  texto sin caracteres de control, enlaces e imágenes solo `https` desde dominios permitidos, y
  URLs de consulta construidas desde listas fijas (nunca desde texto libre del usuario).
- **Cabeceras de seguridad** en `vercel.json`: Content-Security-Policy, `X-Content-Type-Options`,
  `Referrer-Policy` y `Permissions-Policy` (cámara, micrófono, ubicación, pagos y USB desactivados).
- **Análisis automático:** CodeQL en cada PR y en cron semanal, `npm audit` de dependencias de
  producción, y Dependabot para actualizaciones.
