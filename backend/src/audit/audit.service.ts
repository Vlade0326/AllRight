import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { CreateAuditDto } from './dto/create-audit.dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async create(createAuditDto: CreateAuditDto) {
    const newLog = this.auditRepository.create(createAuditDto);
    return await this.auditRepository.save(newLog);
  }

  async findAll() {
    return await this.auditRepository.find();
  } // <--- ¡Importante! Cerramos el método findAll aquí

  // Ahora definimos logAction como un método independiente
 async logAction(userId: string, action: string, details: any) {
    // Creamos un objeto plano primero
    const logData = {
      userId,
      action,
      details: typeof details === 'string' ? details : JSON.stringify(details),
      timestamp: new Date(),
    };

    // Usamos 'save' directamente en lugar de 'create' + 'save' 
    // para evitar la validación estricta de 'create'
    return await this.auditRepository.save(logData as any); 
  }
}