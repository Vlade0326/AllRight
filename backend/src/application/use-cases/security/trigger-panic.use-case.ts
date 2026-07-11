import {
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { IAuditRepository } from '../../../domain/ports/audit.repository.port';
import { ICachePort } from '../../../domain/ports/cache.port';
import { IEmailPort } from '../../../domain/ports/email.port';
import { IUserRepository } from '../../../domain/ports/user.repository.port';
import { PushNotificationService } from '../../../infrastructure/notifications/push-notification.service';
import { RateLimitService } from '../../../infrastructure/security/rate-limit.service';
import {
  AUDIT_REPOSITORY,
  CACHE_PORT,
  EMAIL_PORT,
  USER_REPOSITORY,
} from '../../tokens';

export interface TriggerPanicInput {
  userId: string;
  lat?: number;
  lon?: number;
  message?: string;
}

export interface PanicAlert {
  alertId: string;
  userId: string;
  status: 'ACTIVE' | 'RESOLVED';
  lat?: number;
  lon?: number;
  message?: string;
  triggeredAt: string;
  resolvedAt?: string;
}

const PANIC_TTL_SEC = 3600;
const PANIC_RATE_MAX = 3;
const PANIC_RATE_WINDOW_SEC = 3600;

@Injectable()
export class TriggerPanicUseCase {
  constructor(
    @Inject(CACHE_PORT) private readonly cache: ICachePort,
    @Inject(AUDIT_REPOSITORY) private readonly audit: IAuditRepository,
    @Inject(EMAIL_PORT) private readonly email: IEmailPort,
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    private readonly push: PushNotificationService,
    private readonly rateLimit: RateLimitService,
    private readonly config: ConfigService,
  ) {}

  async execute(input: TriggerPanicInput): Promise<PanicAlert> {
    const existingId = await this.cache.get(`panic:active:${input.userId}`);
    if (existingId) {
      throw new ConflictException('Ya hay una alerta de pánico activa');
    }

    const rl = await this.rateLimit.check(
      `rl:panic:${input.userId}`,
      this.config.get<number>('PANIC_RATE_MAX', PANIC_RATE_MAX),
      this.config.get<number>('PANIC_RATE_WINDOW_SEC', PANIC_RATE_WINDOW_SEC),
    );
    if (!rl.allowed) {
      throw new HttpException(
        {
          message: 'Límite de alertas de pánico alcanzado. Intenta más tarde.',
          retryAfterSec: rl.retryAfterSec,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const alertId = randomUUID();
    const alert: PanicAlert = {
      alertId,
      userId: input.userId,
      status: 'ACTIVE',
      lat: input.lat,
      lon: input.lon,
      message: input.message,
      triggeredAt: new Date().toISOString(),
    };

    await this.cache.set(
      `panic:${alertId}`,
      JSON.stringify(alert),
      PANIC_TTL_SEC,
    );
    await this.cache.set(`panic:active:${input.userId}`, alertId, PANIC_TTL_SEC);

    await this.audit.save({
      userId: input.userId,
      action: 'PANIC_TRIGGERED',
      details: JSON.stringify({
        alertId,
        lat: input.lat,
        lon: input.lon,
        message: input.message,
      }),
      timestamp: new Date(),
    });

    const locationHint =
      input.lat != null && input.lon != null
        ? ` (${input.lat.toFixed(5)}, ${input.lon.toFixed(5)})`
        : '';

    await this.push.notifyUser(
      input.userId,
      'Alerta de pánico activada',
      `SOS enviado${locationHint}. ID: ${alertId.slice(0, 8)}`,
    );

    const user = await this.users.findById(input.userId);
    const notifyEmail = this.config.get<string>('PANIC_NOTIFY_EMAIL');
    if (notifyEmail) {
      await this.email.send({
        to: notifyEmail,
        subject: `[AllRight SOS] Alerta de pánico — ${alertId.slice(0, 8)}`,
        text: [
          'Se activó una alerta de pánico.',
          `Usuario: ${user?.email ?? input.userId}`,
          `Alert ID: ${alertId}`,
          `Ubicación: ${locationHint || 'no disponible'}`,
          `Mensaje: ${input.message ?? '(ninguno)'}`,
          `Hora: ${alert.triggeredAt}`,
        ].join('\n'),
      });
    }

    return alert;
  }
}
