import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import { ReportProximityUseCase } from '../../application/use-cases/proximity/report-proximity.use-case';
import { GetProximityZonesUseCase } from '../../application/use-cases/proximity/get-proximity-zones.use-case';
import { GetProximityStatusUseCase } from '../../application/use-cases/proximity/get-proximity-status.use-case';
import { ReportGpsPresenceUseCase } from '../../application/use-cases/proximity/report-gps-presence.use-case';
import { GetHybridStatusUseCase } from '../../application/use-cases/proximity/get-hybrid-status.use-case';

@Controller('proximity')
@UseGuards(AuthGuard)
export class ProximityController {
  constructor(
    private readonly reportProximity: ReportProximityUseCase,
    private readonly getZones: GetProximityZonesUseCase,
    private readonly getStatus: GetProximityStatusUseCase,
    private readonly reportGps: ReportGpsPresenceUseCase,
    private readonly getHybrid: GetHybridStatusUseCase,
  ) {}

  @Get('zones')
  zones() {
    return this.getZones.execute();
  }

  @Get('status')
  status(@Req() req: { user: { sub: string } }) {
    return this.getStatus.execute(req.user.sub);
  }

  @Get('hybrid')
  hybrid(@Req() req: { user: { sub: string } }) {
    return this.getHybrid.execute(req.user.sub);
  }

  @Post('gps')
  gps(
    @Body() body: { lat: number; lon: number; inside: boolean },
    @Req() req: { user: { sub: string } },
  ) {
    return this.reportGps.execute(req.user.sub, body.lat, body.lon, body.inside);
  }

  @Post('report')
  report(
    @Body()
    body: {
      beaconId?: string;
      uuid: string;
      major: number;
      minor: number;
      rssi: number;
    },
    @Req() req: { user: { sub: string } },
  ) {
    return this.reportProximity.execute({
      userId: req.user.sub,
      beaconId: body.beaconId,
      uuid: body.uuid,
      major: body.major,
      minor: body.minor,
      rssi: body.rssi,
    });
  }
}
