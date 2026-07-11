import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IAuditRepository } from '../../../domain/ports/audit.repository.port';
import { ICachePort } from '../../../domain/ports/cache.port';
import { PushNotificationService } from '../../../infrastructure/notifications/push-notification.service';
import { AUDIT_REPOSITORY, CACHE_PORT } from '../../tokens';
import { PanicAlert } from './trigger-panic.use-case';

@Injectable()
export class ResolvePanicUseCase {
  constructor(
    @Inject(CACHE_PORT) private readonly cache: ICachePort,
    @Inject(AUDIT_REPOSITORY) private readonly audit: IAuditRepository,
    private readonly push: PushNotificationService,
  ) {}

  async execute(userId: string, alertId: string): Promise<PanicAlert> {
    const raw = await this.cache.get(`panic:${alertId}`);
    if (!raw) {
      throw new NotFoundException('Alerta de pánico no encontrada o expirada');
    }

    const alert = JSON.parse(raw) as PanicAlert;
    if (alert.userId !== userId) {
      throw new ForbiddenException('No puedes resolver esta alerta');
    }
    if (alert.status === 'RESOLVED') {
      return alert;
    }

    alert.status = 'RESOLVED';
    alert.resolvedAt = new Date().toISOString();

    await this.cache.set(`panic:${alertId}`, JSON.stringify(alert), 3600);
    await this.cache.del(`panic:active:${userId}`);

    await this.audit.save({
      userId,
      action: 'PANIC_RESOLVED',
      details: JSON.stringify({ alertId }),
      timestamp: new Date(),
    });

    await this.push.notifyUser(
      userId,
      'Alerta de pánico cancelada',
      `La alerta ${alertId.slice(0, 8)} fue marcada como resuelta.`,
    );

    return alert;
  }
}
