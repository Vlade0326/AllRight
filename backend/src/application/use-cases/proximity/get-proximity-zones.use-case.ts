import { Injectable } from '@nestjs/common';
import { DEFAULT_BEACON_ZONES } from '../../../domain/entities/beacon-zone.entity';

@Injectable()
export class GetProximityZonesUseCase {
  execute() {
    return DEFAULT_BEACON_ZONES.map((z) => ({
      id: z.id,
      name: z.name,
      uuid: z.uuid,
      major: z.major,
      minor: z.minor,
      rssiThreshold: z.rssiThreshold,
    }));
  }
}
