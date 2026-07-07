import { Inject, Injectable } from '@nestjs/common';
import { Coordinates } from '../../../domain/value-objects/coordinates.vo';
import { GeofenceZone } from '../../../domain/entities/geofence-zone.entity';
import { GeofenceDomainService } from '../../../domain/services/geofence.domain-service';
import { ICachePort } from '../../../domain/ports/cache.port';
import { IAuditRepository } from '../../../domain/ports/audit.repository.port';
import { MetricsService } from '../../../infrastructure/observability/metrics.service';
import {
  AUDIT_REPOSITORY,
  CACHE_PORT,
  GEOFENCE_ZONE,
} from '../../tokens';

@Injectable()
export class UpdateLocationUseCase {
  private readonly geofence = new GeofenceDomainService();

  constructor(
    @Inject(GEOFENCE_ZONE) private readonly zone: GeofenceZone,
    @Inject(CACHE_PORT) private readonly cache: ICachePort,
    @Inject(AUDIT_REPOSITORY) private readonly audit: IAuditRepository,
    private readonly metrics: MetricsService,
  ) {}

  async execute(userId: string, lat: number, lon: number) {
    const coordinates = new Coordinates(lat, lon);
    const isInside = this.geofence.isInsideZone(coordinates, this.zone);

    if (!isInside) {
      await this.cache.del(`allright:keys:${userId}`);
      await this.cache.srem('allright:concurrent_users', userId);
      await this.audit.save({
        userId,
        action: 'SECURITY_DESTRUCTION',
        details: 'Usuario fuera de zona, llave destruida.',
        timestamp: new Date(),
      });
      this.metrics.recordLocationUpdate('destruction', this.zone.id);
      return {
        status: 'DESTRUCTION_TRIGGERED',
        message: 'Has salido de la zona segura. Llaves destruidas.',
      };
    }

    await this.cache.sadd('allright:concurrent_users', userId);
    await this.cache.expire('allright:concurrent_users', 300);
    this.metrics.recordLocationUpdate('success', this.zone.id);
    const concurrent = await this.cache.scard('allright:concurrent_users');
    this.metrics.setConcurrentUsers(concurrent);

    return { status: 'SECURE', message: 'Ubicación confirmada.' };
  }
}
