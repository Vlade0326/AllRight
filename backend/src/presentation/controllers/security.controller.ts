import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UpdateLocationUseCase } from '../../application/use-cases/location/update-location.use-case';
import { LogActionUseCase } from '../../application/use-cases/audit/log-action.use-case';
import { TriggerPanicUseCase } from '../../application/use-cases/security/trigger-panic.use-case';
import { ResolvePanicUseCase } from '../../application/use-cases/security/resolve-panic.use-case';
import { GetActivePanicUseCase } from '../../application/use-cases/security/get-active-panic.use-case';
import { AuthGuard } from '../guards/auth.guard';

@Controller('security')
@UseGuards(AuthGuard)
export class SecurityController {
  constructor(
    private readonly updateLocation: UpdateLocationUseCase,
    private readonly logAction: LogActionUseCase,
    private readonly triggerPanic: TriggerPanicUseCase,
    private readonly resolvePanic: ResolvePanicUseCase,
    private readonly getActivePanic: GetActivePanicUseCase,
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

  @Post('panic')
  trigger(
    @Body() body: { lat?: number; lon?: number; message?: string },
    @Req() req: { user: { sub: string } },
  ) {
    return this.triggerPanic.execute({
      userId: req.user.sub,
      lat: body.lat,
      lon: body.lon,
      message: body.message,
    });
  }

  @Get('panic/active')
  active(@Req() req: { user: { sub: string } }) {
    return this.getActivePanic.execute(req.user.sub);
  }

  @Post('panic/:alertId/resolve')
  resolve(
    @Param('alertId') alertId: string,
    @Req() req: { user: { sub: string } },
  ) {
    return this.resolvePanic.execute(req.user.sub, alertId);
  }
}
