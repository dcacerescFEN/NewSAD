## Descripción

Esta propuesta plantea la separación del monolito actual del Sistema de Administración Docente (SAD) en diferentes aplicaciones independientes. Esta página de inicio servirá como punto central, mostrando enlaces a cada uno de los nuevos sistemas y un iframe que integra visualizaciones de Power BI relevantes.

## Características principales

- Página de inicio centralizada con enlaces a los diferentes módulos del sistema
- Integración de reportes y dashboards de Power BI mediante iframe
- Navegación intuitiva y acceso rápido a cada software especializado

## Configuración de destinos de navegación

AppConfig permite definir un cliente físico por destino, además de las URLs
existentes. Las claves activas corresponden a la aplicación y ambiente configurados.

| Clave | Cliente predeterminado |
| --- | --- |
| `StudentsMenuClientId` | `SADAlumnos` |
| `TeachersMenuClientId` | `SADProfesores` |
| `CoursesMenuClientId` | `SADCursos` |
| `ExamsMenuClientId` | `SADExamenes` |
| `ActivitiesMenuClientId` | `SADActividades` |
| `AssistantsMenuClientId` | `SADAyudantes` |
| `ProcessesMenuClientId` | `SADProcesos` |
| `ReportsMenuClientId` | `SADInformes` |
| `AdministrationMenuClientId` | `SADAdministracion` |

`ReportsMenuUrl` usa `https://sadinformes-dev.fen.uchile.cl` como valor predeterminado.
Configurar explícitamente el cliente con sufijo `-iis` cuando corresponda al destino;
no se infiere desde la URL ni se combinan sus permisos con el cliente sin sufijo.
Reiniciar la API para recargar AppConfig. Esta integración solo lee configuración:
no crea filas, clientes Keycloak ni asignaciones de roles.
Los llamadores antiguos de `ConfigSite.Initialize` conservan sus argumentos y dejan
los nuevos campos sin configurar; una recarga no retiene valores anteriores.

## Acceso a cada destino

Cada enlace de la barra se muestra solo si el usuario tiene acceso al cliente
físico exacto configurado en `*MenuClientId`. Se acepta alguno de estos valores
en `resource_access[<cliente>].roles` del token:

- `ROLE_<MÓDULO>_ADMIN`
- `ROLE_<MÓDULO>_SUPERADMIN`
- el permiso de entrada del módulo, cuando está confirmado:
  `PERMISSION_SAD_ACCESS` (NewSAD), `PERMISSION_STUDENT_ACCESS_STUDENT_MODULE`
  (SADAlumnos), `PERMISSION_ADMINISTRATION_ACCESS` (SADAdministracion) y
  `PERMISSION_REPORT_ACCESS` (SADInformes).

Los módulos restantes aceptan solo los roles administrativos de su módulo.
Los roles de `SADInformes` no habilitan `SADInformes-iis`, ni al revés: el sufijo
solo selecciona la política y los roles se leen del cliente exacto configurado.
Clientes desconocidos, roles antiguos o datos malformados no habilitan enlaces.

### Cambio de comportamiento

Antes, los enlaces comunes se mostraban siempre y Administración dependía del
acceso global de NewSAD. Ahora todos los destinos exigen autorización propia, y
Administración usa la misma política que los demás. Un usuario sin acceso al
destino deja de ver ese enlace.

Durante una suplantación solo se evalúa el cliente activo con las autorizaciones
efectivas del usuario suplantado; los permisos del usuario real no habilitan
enlaces a otros sistemas. Como NewSAD no es un destino de su propia barra, la
barra queda vacía mientras se suplanta a un usuario. Un destino autorizado sin
URL válida se muestra deshabilitado, fuera de la tabulación y sin `href`.

Este cambio afecta únicamente la visibilidad de la barra. No modifica los guards
internos de NewSAD, el significado de `hasGlobalAccess` ni la autorización de sus
API: ver un enlace no concede acceso al sistema destino.

## Próximos pasos

1. Identificar y definir los módulos que compondrán el nuevo ecosistema
2. Diseñar la estructura y el flujo de navegación de la página de inicio
3. Implementar la integración de Power BI y los enlaces a los sistemas

## Contacto

Para sugerencias o comentarios, por favor contactar al equipo de desarrollo.
