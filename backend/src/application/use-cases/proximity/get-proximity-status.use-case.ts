import { Inject, Injectable } from '@nestjs/common';
import { ICachePort } from '../../../domain/ports/cache.port';
import { CACHE_PORT } from '../../tokens';
import { ProximityStatus } from './report-proximity.use-case';

@Injectable()
export class GetProximityStatusUseCase {
  constructor(@Inject(CACHE_PORT) private readonly cache: ICachePort) {}

  async execute(userId: string): Promise<ProximityStatus> {
    const raw = await this.cache.get(`ble:last:${userId}`);
    if (!raw) {
      return { status: 'unknown' };
    }
    return JSON.parse(raw) as ProximityStatus;
  }
}
