import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('audit_logs')
export class AuditLogOrmEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: string;

  @Column()
  action!: string;

  @Column('text')
  details!: string;

  @Column()
  timestamp!: Date;
}
