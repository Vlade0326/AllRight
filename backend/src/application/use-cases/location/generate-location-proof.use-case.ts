import { Inject, Injectable } from '@nestjs/common';
import { Coordinates } from '../../../domain/value-objects/coordinates.vo';
import { GeofenceZone } from '../../../domain/entities/geofence-zone.entity';
import { ILocationProofPort } from '../../../domain/ports/location-proof.port';
import { IAuditRepository } from '../../../domain/ports/audit.repository.port';
import { MetricsService } from '../../../infrastructure/observability/metrics.service';
import {
  AUDIT_REPOSITORY,
  GEOFENCE_ZONE,
  LOCATION_PROOF_PORT,
} from '../../tokens';

export interface GenerateLocationProofInput {
  userId: string;
  lat: number;
  lon: number;
}

@Injectable()
export class GenerateLocationProofUseCase {
  constructor(
    @Inject(LOCATION_PROOF_PORT)
    private readonly proofPort: ILocationProofPort,
    @Inject(GEOFENCE_ZONE) private readonly zone: GeofenceZone,
    @Inject(AUDIT_REPOSITORY) private readonly audit: IAuditRepository,
    private readonly metrics: MetricsService,
  ) {}

  async execute(input: GenerateLocationProofInput) {
    const end = this.metrics.startZkpGenerationTimer();
    try {
      const coordinates = new Coordinates(input.lat, input.lon);
      const proof = await this.proofPort.generateProof({
        userId: input.userId,
        coordinates,
        zoneId: this.zone.id,
      });

      await this.audit.save({
        userId: input.userId,
        action: 'ZKP_PROVE',
        details: JSON.stringify({
          adapter: proof.payload.adapter,
          isInside: proof.payload.publicSignals.isInside,
          zoneId: proof.payload.publicSignals.zoneId,
        }),
        timestamp: new Date(),
      });

      return proof;
    } finally {
      end();
    }
  }
}
