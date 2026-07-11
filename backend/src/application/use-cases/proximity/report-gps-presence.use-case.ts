import { Inject, Injectable } from '@nestjs/common';
import { ICachePort } from '../../../domain/ports/cache.port';
import { CACHE_PORT } from '../../tokens';

export interface GpsPresence {
  status: 'inside' | 'outside';
  lat: number;
  lon: number;
  updatedAt: string;
}

@Injectable()
export class ReportGpsPresenceUseCase {
  constructor(@Inject(CACHE_PORT) private readonly cache: ICachePort) {}

  async execute(userId: string, lat: number, lon: number, inside: boolean) {
    const payload: GpsPresence = {
      status: inside ? 'inside' : 'outside',
      lat,
      lon,
      updatedAt: new Date().toISOString(),
    };
    await this.cache.set(`gps:last:${userId}`, JSON.stringify(payload), 120);
    return payload;
  }
}
