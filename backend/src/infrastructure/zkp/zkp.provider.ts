import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeofenceZone } from '../../domain/entities/geofence-zone.entity';
import { LOCATION_PROOF_PORT, GEOFENCE_ZONE } from '../../application/tokens';
import { CommitmentZkpAdapter } from './commitment-zkp.adapter';
import { SnarkjsZkpAdapter } from './snarkjs-zkp.adapter';

export const zkpAdapterProvider: Provider = {
  provide: LOCATION_PROOF_PORT,
  useFactory: (zone: GeofenceZone, config: ConfigService) => {
    const adapter = config.get<string>('ZKP_ADAPTER', 'commitment');
    return adapter === 'snarkjs'
      ? new SnarkjsZkpAdapter(zone)
      : new CommitmentZkpAdapter(zone);
  },
  inject: [GEOFENCE_ZONE, ConfigService],
};
