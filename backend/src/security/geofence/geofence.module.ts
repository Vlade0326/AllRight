import { Module } from '@nestjs/common';
import { GeofenceService } from './geofence.service';

@Module({
  providers: [GeofenceService],
  exports: [GeofenceService], // <--- ¡Esto es lo que faltaba!
})
export class GeofenceModule {}