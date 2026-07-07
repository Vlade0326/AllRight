import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { UpdateLocationUseCase } from '../../application/use-cases/location/update-location.use-case';
import { LogActionUseCase } from '../../application/use-cases/audit/log-action.use-case';
import { AuthGuard } from '../guards/auth.guard';

@Controller('security')
@UseGuards(AuthGuard)
export class SecurityController {
  constructor(
    private readonly updateLocation: UpdateLocationUseCase,
    private readonly logAction: LogActionUseCase,
  ) {}

  @Post('check-location')
  async checkLocation(
    @Body() body: { lat: number; lon: number },
    @Req() req: { user: { sub: string } },
  ) {
    const result = await this.updateLocation.execute(
      req.user.sub,
      body.lat,
      body.lon,
    );
    if (result.status === 'DESTRUCTION_TRIGGERED') {
      await this.logAction.execute(
        req.user.sub,
        'SECURITY_DESTRUCTION',
        result.message,
      );
    }
    return result;
  }
}
