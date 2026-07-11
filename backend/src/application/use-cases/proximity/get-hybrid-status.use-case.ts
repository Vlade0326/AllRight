import { Inject, Injectable } from '@nestjs/common';
import {
  fuseLocationSignals,
  HybridStatus,
  SignalPresence,
} from '../../../domain/services/hybrid-location.domain-service';
import { ICachePort } from '../../../domain/ports/cache.port';
import { CACHE_PORT } from '../../tokens';
import { ProximityStatus } from './report-proximity.use-case';
import { GpsPresence } from './report-gps-presence.use-case';

@Injectable()
export class GetHybridStatusUseCase {
  constructor(@Inject(CACHE_PORT) private readonly cache: ICachePort) {}

  async execute(userId: string): Promise<HybridStatus> {
    const gpsRaw = await this.cache.get(`gps:last:${userId}`);
    const bleRaw = await this.cache.get(`ble:last:${userId}`);

    const gps: SignalPresence = gpsRaw
      ? (JSON.parse(gpsRaw) as GpsPresence).status
      : 'unknown';

    let ble: SignalPresence = 'unknown';
    let beaconId: string | undefined;
    let beaconName: string | undefined;

    if (bleRaw) {
      const bleStatus = JSON.parse(bleRaw) as ProximityStatus;
      ble = bleStatus.status;
      beaconId = bleStatus.beaconId;
      beaconName = bleStatus.beaconName;
    }

    return fuseLocationSignals(gps, ble, { beaconId, beaconName });
  }
}
