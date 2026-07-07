import { Controller, Post, Get, Body, UseGuards, Req, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getZkpArtifactPaths, zkpArtifactsAvailable } from '../../infrastructure/zkp/zkp-artifacts.util';
import { GenerateLocationProofUseCase } from '../../application/use-cases/location/generate-location-proof.use-case';
import { VerifyLocationProofUseCase } from '../../application/use-cases/location/verify-location-proof.use-case';
import { LocationProof } from '../../domain/entities/location-proof.entity';
import { GeofenceZone } from '../../domain/entities/geofence-zone.entity';
import { GEOFENCE_ZONE } from '../../application/tokens';
import { AuthGuard } from '../guards/auth.guard';

@Controller('location')
@UseGuards(AuthGuard)
export class LocationController {
  constructor(
    private readonly generateProof: GenerateLocationProofUseCase,
    private readonly verifyProof: VerifyLocationProofUseCase,
    private readonly config: ConfigService,
    @Inject(GEOFENCE_ZONE) private readonly zone: GeofenceZone,
  ) {}

  @Get('config')
  getConfig() {
    const paths = getZkpArtifactPaths();
    const scale = 1_000_000;
    const centerLat = Math.round(this.zone.center.latitude * scale);
    const centerLon = Math.round(this.zone.center.longitude * scale);
    const delta = Math.round((this.zone.radiusKm / 111.32) * scale);

    return {
      adapter: this.config.get('ZKP_ADAPTER', 'commitment'),
      zone: {
        id: this.zone.id,
        lat: this.zone.center.latitude,
        lon: this.zone.center.longitude,
        radiusKm: this.zone.radiusKm,
      },
      bounds: {
        minLat: centerLat - delta,
        maxLat: centerLat + delta,
        minLon: centerLon - delta,
        maxLon: centerLon + delta,
      },
      zkpAssetsAvailable: zkpArtifactsAvailable(),
      zkpArtifactsEnv: paths.base.split(/[/\\]/).pop(),
    };
  }

  @Post('prove')
  prove(
    @Body() body: { lat: number; lon: number },
    @Req() req: { user: { sub: string } },
  ) {
    return this.generateProof.execute({
      userId: req.user.sub,
      lat: body.lat,
      lon: body.lon,
    });
  }

  @Post('verify')
  verify(
    @Body() body: { proof: string; payload: LocationProof['payload'] },
    @Req() req: { user: { sub: string } },
  ) {
    const locationProof = new LocationProof(body.proof, body.payload);
    return this.verifyProof.execute(req.user.sub, locationProof);
  }
}
