# Roles y permisos de NewSAD

Catálogo de los roles y permisos que NewSAD declara en Keycloak, normalizado según
`Estandarizacion-Permisos.md` (identificadores en inglés y mayúsculas, módulo en singular, acción
descriptiva que comienza con un verbo, y descripción obligatoria en español).

SAD es el nombre propio del sistema legado y se registra como excepción explícita a la regla de
identificadores en inglés: sus roles y permisos usan el módulo `SAD`.

## Catálogo

| Nombre en Keycloak            | Valor interno en el token | Tipo       | Descripción en español                                                                                     |
| ----------------------------- | ------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- |
| `PERMISSION_SAD_ACCESS`       | `SAD_ACCESS`              | PERMISSION | Ingresar al sistema NewSAD y abrir su página de inicio. Por sí solo no autoriza consultar ni modificar datos. |
| `ROLE_SAD_ADMIN`              | `SAD_ADMIN`               | ROLE       | Acceso completo a las funcionalidades del módulo SAD, sin comprobación de permisos individuales. No autoriza la suplantación de usuarios. |
| `ROLE_SAD_SUPERADMIN`         | `SAD_SUPERADMIN`          | ROLE       | Acceso completo a las funcionalidades del módulo SAD y suplantación de usuarios.                             |

El cliente de Keycloak es `NewSAD` en desarrollo y `NewSAD-iis` en el servidor. El valor interno es
el nombre del rol o permiso sin el prefijo `ROLE_`/`PERMISSION_`, tal como lo materializa
`KeycloakClaimsMapper` en el backend y `AuthStore` en el frontend.

## Alcance de los roles administrativos

- Un rol administrativo de SAD concede acceso completo dentro de SAD y no concede acceso a los
  demás módulos del ecosistema.
- La excepción de acceso completo se resuelve por el nombre exacto del rol. Un sufijo `ADMIN` o
  `SUPERADMIN` en un nombre arbitrario no otorga privilegios: las pruebas cubren
  `ROLE_Administrador`, `ROLE_SuperAdmin`, `ROLE_ADMIN` y `ROLE_SUPERADMIN` como nombres sin efecto.
- La suplantación de usuarios queda reservada a `SAD_SUPERADMIN`, como indica el apartado 7 del
  estándar. `SAD_ADMIN` conserva el acceso completo a su módulo, pero el panel `/admin` y el endpoint
  `POST /api/auth/impersonation` le responden con acceso denegado; el backend lo resuelve con la
  política `SadImpersonation` y el frontend con la marca `superAdminOnly` de la ruta.
- La entrada del menú "Administración" apunta al módulo externo de administración del ecosistema y
  sigue visible para quien tiene acceso global en SAD; el acceso efectivo a ese módulo lo decide su
  propia aplicación.

## Cambio de identificadores (sin compatibilidad)

| Antes (heredado)                    | Ahora (estándar)                    |
| ----------------------------------- | ----------------------------------- |
| `PERMISSION_SAD_INGRESAR`           | `PERMISSION_SAD_ACCESS`             |
| `ROLE_ADMIN`                        | `ROLE_SAD_ADMIN`                    |
| `ROLE_SUPERADMIN`                   | `ROLE_SAD_SUPERADMIN`               |

No se mantiene una ventana con los dos nombres: el código solo acepta los valores nuevos.

Consecuencia operativa: hasta que los roles y el permiso nuevos existan y estén asignados en
Keycloak, los usuarios que entraban solo por permiso pierden el acceso. Los usuarios con los roles
administrativos nuevos siguen entrando por la excepción de acceso completo.

## Dónde se declaran

- Backend: `src/Domain/Constants/Permission.cs` y `src/Domain/Constants/Roles.cs`.
- Frontend: `src/Web/WebUI/src/app/core/permissions.ts` y `src/Web/WebUI/src/app/core/roles.ts`.
- Autorización del backend: `src/Web/WebApi/Endpoints/Config/ConfigEndpoints.cs` exige
  `Permission.SAD_Access` y `PermissionPolicyProvider` materializa la política bajo demanda.
- Visibilidad en la interfaz: `src/Web/WebUI/src/app/app.routes.ts` protege el layout con
  `PERMISSIONS.SAD_ACCESS`.
