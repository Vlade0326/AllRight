import { Inject, Injectable } from '@nestjs/common';
import { IAuditRepository } from '../../../domain/ports/audit.repository.port';
import { AUDIT_REPOSITORY } from '../../tokens';

@Injectable()
export class LogActionUseCase {
  constructor(
    @Inject(AUDIT_REPOSITORY) private readonly audit: IAuditRepository,
  ) {}

  async execute(userId: string, action: string, details: unknown) {
    await this.audit.save({
      userId,
      action,
      details:
        typeof details === 'string' ? details : JSON.stringify(details),
      timestamp: new Date(),
    });
  }
}
