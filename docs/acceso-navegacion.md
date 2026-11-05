# Consulta de acceso por sitio

`AuthStore.hasSiteAccess(clientId)` indica si la navegación puede mostrar un destino.
No sustituye los guards ni la autorización del backend.

- El argumento es el cliente físico exacto de Keycloak, por ejemplo
  `SADAlumnos` o `SADAlumnos-iis`. No se combinan sus autorizaciones.
- Solo se admiten los nueve sistemas del catálogo y sus variantes `-iis`.
- Se exige sesión autenticada y un rol nuevo `ROLE_<MÓDULO>_ADMIN`,
  `ROLE_<MÓDULO>_SUPERADMIN` o el permiso de entrada confirmado del destino.
- NewSAD admite `PERMISSION_SAD_ACCESS`; SADAdministracion,
  `PERMISSION_ADMINISTRATION_ACCESS`; SADAlumnos,
  `PERMISSION_STUDENT_ACCESS_STUDENT_MODULE`.
- Profesores, Cursos, Exámenes, Actividades, Ayudantes y Procesos reconocen
  los módulos TEACHER, COURSE, EXAM, ACTIVITY, ASSISTANT y PROCESS respectivamente.
  Solo se reconocen sus roles administrativos nuevos hasta confirmar sus permisos
  de entrada; no se inventan equivalencias ni identificadores ACCESS.
- Roles antiguos, permisos antiguos, sistemas ausentes y datos inválidos no
  conceden acceso.
- Durante una suplantación, cada destino se evalúa con los roles y permisos
  efectivos que el usuario suplantado tiene en ese cliente físico, resueltos por
  el servidor en `siteAccess` al iniciar la suplantación. Nunca se usan los
  privilegios del operador. Una respuesta sin `siteAccess` conserva el
  comportamiento anterior: solo el cliente activo.
- `hasPermission()`, `hasGlobalAccess()` y los guards conservan su comportamiento.

## Configuración del menú de NewSAD

La cabecera evalúa cada destino con `hasSiteAccess(clientId)`, incluida Administración.
El rol administrativo de NewSAD no autoriza enlaces a otros sitios.
Los enlaces sin un cliente conocido y autorizado se ocultan, no se muestran deshabilitados.

Un operador debe proporcionar los valores exactos en el canal AppConfig existente,
para la pareja `ConfigureSite:ApplicationName` / `ConfigureSite:EnvironmentName`
de cada despliegue. Solo se leen filas activas. Esta implementación no ejecuta SQL,
no cambia datos almacenados y no necesita una migración.

| Destino | Clave AppConfig opcional | Campo JSON |
| --- | --- | --- |
| Alumnos | `StudentsMenuClientId` | `studentsMenuClientId` |
| Profesores | `TeachersMenuClientId` | `teachersMenuClientId` |
| Cursos | `CoursesMenuClientId` | `coursesMenuClientId` |
| Exámenes | `ExamsMenuClientId` | `examsMenuClientId` |
| Actividades | `ActivitiesMenuClientId` | `activitiesMenuClientId` |
| Ayudantes | `AssistantsMenuClientId` | `assistantsMenuClientId` |
| Procesos | `ProcessesMenuClientId` | `processesMenuClientId` |
| Administración | `AdministrationMenuClientId` | `administrationMenuClientId` |

Cada ID acompaña a su clave `<Destino>MenuUrl` existente; son valores independientes.
Por ejemplo, use `StudentsMenuClientId=SADAlumnos-iis` únicamente si ese es el
cliente físico del destino configurado. Un despliegue puede mezclar enlaces locales
y desplegados: no se deduce el ID del hostname, del entorno ni de otra configuración.
No se recortan ni transforman los IDs, ni se combinan las concesiones normal/`-iis`.

Las claves son aditivas y opcionales: una fila ausente da un ID vacío; el frontend
también rechaza valores que no sean cadenas. Sin IDs configurados, todos los destinos
del menú se ocultan, aunque existan sus URL o los roles del usuario. Una configuración
desconocida o con espacios no concede acceso.

Tras configurar los valores y reiniciar la aplicación para recargar AppConfig,
verifique con un usuario de prueba:

1. Solo aparecen los destinos con rol nuevo o permiso de entrada confirmado en
   el cliente físico exacto. No configure equivalencias de permisos aún no confirmadas.
2. Una URL HTTP(S) válida conserva su enlace externo. Si el usuario está autorizado
   pero la URL está ausente o es insegura, aparece «No disponible» sin enlace.
3. Durante suplantación se muestran los destinos que el usuario suplantado tiene
   en cada cliente físico configurado y se ocultan los que no tiene. El cliente
   activo solo se muestra si los roles o permisos efectivos del usuario suplantado lo permiten.
4. La marca local, el tema y el menú colapsable conservan su comportamiento.

La ocultación del menú es una regla de presentación; los guards y la autorización
del servidor siguen siendo obligatorios.
