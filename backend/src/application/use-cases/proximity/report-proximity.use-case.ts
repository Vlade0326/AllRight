import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { BeaconZone, DEFAULT_BEACON_ZONES } from '../../../domain/entities/beacon-zone.entity';
import { IAuditRepository } from '../../../domain/ports/audit.repository.port';
import { ICachePort } from '../../../domain/ports/cache.port';
import { AUDIT_REPOSITORY, CACHE_PORT } from '../../tokens';

export interface ReportProximityInput {
  userId: string;
  beaconId?: string;
  uuid: string;
  major: number;
  minor: number;
  rssi: number;
}

export interface ProximityStatus {
  status: 'inside' | 'outside' | 'unknown';
  beaconId?: string;
  beaconName?: string;
  rssi?: number;
  updatedAt?: string;
}

const LAST_TTL_SEC = 60;
const INSIDE_TTL_SEC = 90;

@Injectable()
export class ReportProximityUseCase {
  private readonly zones: BeaconZone[] = DEFAULT_BEACON_ZONES;

  constructor(
    @Inject(CACHE_PORT) private readonly cache: ICachePort,
    @Inject(AUDIT_REPOSITORY) private readonly audit: IAuditRepository,
  ) {}

  async execute(input: ReportProximityInput): Promise<ProximityStatus> {
    const zone = this.resolveZone(input);
    if (!zone) {
      throw new BadRequestException('Beacon no autorizado o desconocido');
    }

    const inside = input.rssi >= zone.rssiThreshold;
    const updatedAt = new Date().toISOString();
    const status: ProximityStatus = {
      status: inside ? 'inside' : 'outside',
      beaconId: zone.id,
      beaconName: zone.name,
      rssi: input.rssi,
      updatedAt,
    };

    await this.cache.set(
      `ble:last:${input.userId}`,
      JSON.stringify(status),
      LAST_TTL_SEC,
    );

    if (inside) {
      await this.cache.set(`ble:inside:${input.userId}`, zone.id, INSIDE_TTL_SEC);
    } else {
      await this.cache.del(`ble:inside:${input.userId}`);
    }

    await this.audit.save({
      userId: input.userId,
      action: 'BLE_PROXIMITY',
      details: JSON.stringify({
        beaconId: zone.id,
        rssi: input.rssi,
        inside,
      }),
      timestamp: new Date(),
    });

    return status;
  }

  private resolveZone(input: ReportProximityInput): BeaconZone | undefined {
    if (input.beaconId) {
      const byId = this.zones.find((z) => z.id === input.beaconId);
      if (
        byId &&
        byId.uuid.toLowerCase() === input.uuid.toLowerCase() &&
        byId.major === input.major &&
        byId.minor === input.minor
      ) {
        return byId;
      }
    }

    return this.zones.find(
      (z) =>
        z.uuid.toLowerCase() === input.uuid.toLowerCase() &&
        z.major === input.major &&
        z.minor === input.minor,
    );
  }
}
