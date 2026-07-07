import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || 'anonymous'; // Toma el ID si está logueado
    const action = `${request.method} ${request.url}`;

    return next.handle().pipe(
      tap(() => {
        // Registra la acción después de que la ruta se ejecute con éxito
        this.auditService.logAction(userId, action, request.body);
      }),
    );
  }
}