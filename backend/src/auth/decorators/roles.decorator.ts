import { SetMetadata } from '@nestjs/common';

// 🏷️ Este decorador guardará los roles permitidos en los metadatos de la ruta
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);