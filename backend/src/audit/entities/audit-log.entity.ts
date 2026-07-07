import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  action: string;

  @Column('text') // Usamos 'text' para que acepte JSON guardado como string
  details: string;

  @Column()
  timestamp: Date;
}