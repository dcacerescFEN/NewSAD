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

## Próximos pasos

1. Identificar y definir los módulos que compondrán el nuevo ecosistema
2. Diseñar la estructura y el flujo de navegación de la página de inicio
3. Implementar la integración de Power BI y los enlaces a los sistemas

## Contacto

Para sugerencias o comentarios, por favor contactar al equipo de desarrollo.
