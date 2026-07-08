import {
  Controller,
  Post,
  Body,
  Get,
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { MetricsService } from '../../infrastructure/observability/metrics.service';
import { SkipRateLimit } from '../decorators/skip-rate-limit.decorator';

@Controller()
@SkipRateLimit()
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get('metrics')
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics(@Res() res: Response) {
    const data = await this.metrics.getMetrics();
    res.send(data);
  }
}
