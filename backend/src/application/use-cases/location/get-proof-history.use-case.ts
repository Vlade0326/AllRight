import { Inject, Injectable } from '@nestjs/common';
import { IAuditRepository } from '../../../domain/ports/audit.repository.port';
import { AUDIT_REPOSITORY } from '../../tokens';

const PROOF_ACTIONS = new Set(['ZKP_PROVE', 'ZKP_VERIFY']);

export interface ProofHistoryItem {
  id: number;
  action: 'ZKP_PROVE' | 'ZKP_VERIFY';
  timestamp: string;
  adapter?: string;
  valid?: boolean;
  isInside: boolean;
  zoneId: string;
}

@Injectable()
export class GetProofHistoryUseCase {
  constructor(@Inject(AUDIT_REPOSITORY) private readonly audit: IAuditRepository) {}

  async execute(userId: string, limit = 50): Promise<ProofHistoryItem[]> {
    const entries = await this.audit.findByUserId(userId, limit);

    return entries
      .filter((e) => PROOF_ACTIONS.has(e.action) && e.id != null)
      .map((e) => {
        const meta = JSON.parse(e.details) as Record<string, unknown>;
        return {
          id: e.id!,
          action: e.action as 'ZKP_PROVE' | 'ZKP_VERIFY',
          timestamp: e.timestamp.toISOString(),
          adapter: meta.adapter as string | undefined,
          valid: meta.valid as boolean | undefined,
          isInside: Boolean(meta.isInside),
          zoneId: String(meta.zoneId ?? ''),
        };
      });
  }
}
