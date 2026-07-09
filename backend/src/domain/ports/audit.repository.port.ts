export interface AuditEntry {
  id?: number;
  userId: string;
  action: string;
  details: string;
  timestamp: Date;
}

export interface IAuditRepository {
  save(entry: AuditEntry): Promise<void>;
  findAll(): Promise<AuditEntry[]>;
  findByUserId(userId: string, limit?: number): Promise<AuditEntry[]>;
}
