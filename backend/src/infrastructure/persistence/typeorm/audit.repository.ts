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
    return this.repo.find();
  }
}
