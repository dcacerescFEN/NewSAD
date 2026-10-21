// Identificadores del estándar (Estandarizacion-Permisos.md): el valor viaja sin el prefijo
// PERMISSION_ que agrega Keycloak y sigue el formato PERMISSION_<MÓDULO>_<ACCIÓN_DESCRIPTIVA>.
export const PERMISSIONS = {
  // ACCEDER al módulo SAD: por sí solo no autoriza consultar ni modificar su información.
  SAD_ACCESS: 'SAD_ACCESS',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
