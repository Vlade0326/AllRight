import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ICachePort } from '../../domain/ports/cache.port';
import { CACHE_PORT } from '../../application/tokens';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfterSec: number;
}

@Injectable()
export class RateLimitService {
  constructor(
    @Inject(CACHE_PORT) private readonly cache: ICachePort,
    private readonly config: ConfigService,
  ) {}

  async check(
    key: string,
    max: number,
    windowSec: number,
  ): Promise<RateLimitResult> {
    const count = await this.cache.incr(key);
    if (count === 1) {
      await this.cache.expire(key, windowSec);
    }

    const allowed = count <= max;
    return {
      allowed,
      remaining: Math.max(0, max - count),
      limit: max,
      retryAfterSec: windowSec,
    };
  }

  async checkGlobal(ip: string, route: string): Promise<RateLimitResult> {
    const windowSec = this.config.get<number>('RATE_LIMIT_WINDOW_SEC', 60);
    const max = this.config.get<number>('RATE_LIMIT_MAX', 120);
    return this.check(`rl:global:${ip}:${route}`, max, windowSec);
  }

  async checkLoginFailure(ip: string): Promise<RateLimitResult> {
    const windowSec = this.config.get<number>('RATE_LIMIT_LOGIN_WINDOW_SEC', 300);
    const max = this.config.get<number>('RATE_LIMIT_LOGIN_MAX', 10);
    return this.check(`rl:login-fail:${ip}`, max, windowSec);
  }

  async isLoginBlocked(ip: string): Promise<RateLimitResult> {
    const windowSec = this.config.get<number>('RATE_LIMIT_LOGIN_WINDOW_SEC', 300);
    const max = this.config.get<number>('RATE_LIMIT_LOGIN_MAX', 10);
    const key = `rl:login-fail:${ip}`;
    const current = await this.cache.get(key);
    const count = current ? parseInt(current, 10) : 0;
    return {
      allowed: count < max,
      remaining: Math.max(0, max - count),
      limit: max,
      retryAfterSec: windowSec,
    };
  }
}
