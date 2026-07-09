import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AuditEntry,
  IAuditRepository,
} from '../../../domain/ports/audit.repository.port';
import { AuditLogOrmEntity } from './audit-log.orm-entity';

@Injectable()
export class TypeOrmAuditRepository implements IAuditRepository {
  constructor(
    @InjectRepository(AuditLogOrmEntity)
    private readonly repo: Repository<AuditLogOrmEntity>,
  ) {}

  async save(entry: AuditEntry): Promise<void> {
    await this.repo.save(entry);
  }

  async findAll(): Promise<AuditEntry[]> {
    const rows = await this.repo.find();
    return rows.map((r) => this.toEntry(r));
  }

  async findByUserId(userId: string, limit = 50): Promise<AuditEntry[]> {
    const rows = await this.repo.find({
      where: { userId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
    return rows.map((r) => this.toEntry(r));
  }

  private toEntry(entity: AuditLogOrmEntity): AuditEntry {
    return {
      id: entity.id,
      userId: entity.userId,
      action: entity.action,
      details: entity.details,
      timestamp: entity.timestamp,
    };
  }
}
