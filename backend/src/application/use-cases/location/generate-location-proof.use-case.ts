import { Inject, Injectable } from '@nestjs/common';
import { Coordinates } from '../../../domain/value-objects/coordinates.vo';
import { GeofenceZone } from '../../../domain/entities/geofence-zone.entity';
import { ILocationProofPort } from '../../../domain/ports/location-proof.port';
import { MetricsService } from '../../../infrastructure/observability/metrics.service';
import {
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
    private readonly metrics: MetricsService,
  ) {}

  async execute(input: GenerateLocationProofInput) {
    const end = this.metrics.startZkpGenerationTimer();
    try {
      const coordinates = new Coordinates(input.lat, input.lon);
      return await this.proofPort.generateProof({
        userId: input.userId,
        coordinates,
        zoneId: this.zone.id,
      });
    } finally {
      end();
    }
  }
}
