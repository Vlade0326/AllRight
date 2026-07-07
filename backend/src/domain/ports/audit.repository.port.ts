export interface AuditEntry {
  userId: string;
  action: string;
  details: string;
  timestamp: Date;
}

export interface IAuditRepository {
  save(entry: AuditEntry): Promise<void>;
  findAll(): Promise<AuditEntry[]>;
}
