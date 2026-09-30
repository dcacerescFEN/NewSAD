export const PERMISSIONS = {
  SAD_ENTER: 'SAD_INGRESAR'
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
