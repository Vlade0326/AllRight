import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import { ReportProximityUseCase } from '../../application/use-cases/proximity/report-proximity.use-case';
import { GetProximityZonesUseCase } from '../../application/use-cases/proximity/get-proximity-zones.use-case';
import { GetProximityStatusUseCase } from '../../application/use-cases/proximity/get-proximity-status.use-case';

@Controller('proximity')
@UseGuards(AuthGuard)
export class ProximityController {
  constructor(
    private readonly reportProximity: ReportProximityUseCase,
    private readonly getZones: GetProximityZonesUseCase,
    private readonly getStatus: GetProximityStatusUseCase,
  ) {}

  @Get('zones')
  zones() {
    return this.getZones.execute();
  }

  @Get('status')
  status(@Req() req: { user: { sub: string } }) {
    return this.getStatus.execute(req.user.sub);
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
