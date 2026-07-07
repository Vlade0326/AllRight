import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Extraemos los roles requeridos para este endpoint desde los metadatos
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si la ruta no tiene el decorador @Roles, significa que es pública para cualquier usuario autenticado
    if (!requiredRoles) {
      return true;
    }

    // 2. Obtenemos el usuario que el AuthGuard ya inyectó en la petición
    const { user } = context.switchToHttp().getRequest();

    // 3. Evaluamos si el rol del usuario coincide con los permitidos
    const hasRole = requiredRoles.some((role) => user.role?.includes(role));
    
    if (!hasRole) {
      throw new ForbiddenException('No tienes los privilegios necesarios para acceder a este recurso');
    }

    return true;
  }
}