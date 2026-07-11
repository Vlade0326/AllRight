import { Inject, Injectable } from '@nestjs/common';
import { ICachePort } from '../../../domain/ports/cache.port';
import { CACHE_PORT } from '../../tokens';
import { PanicAlert } from './trigger-panic.use-case';

@Injectable()
export class GetActivePanicUseCase {
  constructor(@Inject(CACHE_PORT) private readonly cache: ICachePort) {}

  async execute(userId: string): Promise<PanicAlert | null> {
    const alertId = await this.cache.get(`panic:active:${userId}`);
    if (!alertId) return null;

    const raw = await this.cache.get(`panic:${alertId}`);
    if (!raw) {
      await this.cache.del(`panic:active:${userId}`);
      return null;
    }

    return JSON.parse(raw) as PanicAlert;
  }
}
