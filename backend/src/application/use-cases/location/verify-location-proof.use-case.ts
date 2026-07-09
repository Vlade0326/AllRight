import { Inject, Injectable } from '@nestjs/common';
import { LocationProof } from '../../../domain/entities/location-proof.entity';
import { ILocationProofPort } from '../../../domain/ports/location-proof.port';
import { ICachePort } from '../../../domain/ports/cache.port';
import { IAuditRepository } from '../../../domain/ports/audit.repository.port';
import { MetricsService } from '../../../infrastructure/observability/metrics.service';
import { AUDIT_REPOSITORY, CACHE_PORT, LOCATION_PROOF_PORT } from '../../tokens';

const CONCURRENT_USERS_KEY = 'allright:concurrent_users';
const USER_SESSION_TTL = 300;

@Injectable()
export class VerifyLocationProofUseCase {
  constructor(
    @Inject(LOCATION_PROOF_PORT)
    private readonly proofPort: ILocationProofPort,
    @Inject(CACHE_PORT) private readonly cache: ICachePort,
    @Inject(AUDIT_REPOSITORY) private readonly audit: IAuditRepository,
    private readonly metrics: MetricsService,
  ) {}

  async execute(userId: string, proof: LocationProof) {
    const endTimer = this.metrics.startZkpVerificationTimer();
    try {
      const result = await this.proofPort.verifyProof(proof);
      endTimer(result.valid ? 'valid' : 'invalid');

      await this.audit.save({
        userId,
        action: 'ZKP_VERIFY',
        details: JSON.stringify({
          valid: result.valid,
          isInside: result.isInside,
          zoneId: result.zoneId,
        }),
        timestamp: new Date(),
      });

      if (result.valid && result.isInside) {
        await this.cache.sadd(CONCURRENT_USERS_KEY, userId);
        await this.cache.expire(CONCURRENT_USERS_KEY, USER_SESSION_TTL);
        this.metrics.recordLocationUpdate('success', result.zoneId);
      } else if (result.valid && !result.isInside) {
        this.metrics.recordLocationUpdate('outside_zone', result.zoneId);
      } else {
        this.metrics.recordLocationUpdate('invalid_proof', result.zoneId);
      }

      const concurrent = await this.cache.scard(CONCURRENT_USERS_KEY);
      this.metrics.setConcurrentUsers(concurrent);

      return result;
    } catch (error) {
      endTimer('invalid');
      throw error;
    }
  }
}
