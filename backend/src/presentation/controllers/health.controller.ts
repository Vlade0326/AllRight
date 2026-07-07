import { Controller, Get } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { CACHE_PORT } from '../../application/tokens';
import { ICachePort } from '../../domain/ports/cache.port';

@Controller('health')
export class HealthController {
  constructor(@Inject(CACHE_PORT) private readonly cache: ICachePort) {}

  @Get()
  health() {
    return { status: 'ok', service: 'allright-api' };
  }

  @Get('ready')
  async ready() {
    try {
      await this.cache.set('health:ping', '1', 5);
      return { status: 'ready' };
    } catch {
      return { status: 'degraded', redis: false };
    }
  }
}
