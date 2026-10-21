// Identificadores del estándar (Estandarizacion-Permisos.md): el valor viaja sin el prefijo ROLE_
// que agrega Keycloak y sigue el formato ROLE_<MÓDULO>_<ADMIN|SUPERADMIN>.
export const ROLES = {
  ADMIN: 'SAD_ADMIN',
  SUPERADMIN: 'SAD_SUPERADMIN',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
