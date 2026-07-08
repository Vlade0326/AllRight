import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository, UserRecord } from '../../../domain/ports/user.repository.port';
import { UserOrmEntity } from './user.orm-entity';

@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
  ) {}

  async create(data: Omit<UserRecord, 'id'>): Promise<UserRecord> {
    const entity = this.repo.create(data as UserOrmEntity);
    const saved = await this.repo.save(entity);
    return this.toRecord(saved);
  }

  async findAll(): Promise<UserRecord[]> {
    const rows = await this.repo.find();
    return rows.map((r) => this.toRecord(r));
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const row = await this.repo.findOneBy({ email });
    return row ? this.toRecord(row) : null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const row = await this.repo.findOneBy({ id });
    return row ? this.toRecord(row) : null;
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.repo.update({ id }, { password: passwordHash });
  }

  private toRecord(entity: UserOrmEntity): UserRecord {
    return {
      id: entity.id,
      email: entity.email,
      password: entity.password,
      role: entity.role,
    };
  }
}
