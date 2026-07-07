export interface UserRecord {
  id: string;
  email: string;
  password: string;
  role: string;
}

export interface IUserRepository {
  create(data: Omit<UserRecord, 'id'>): Promise<UserRecord>;
  findAll(): Promise<UserRecord[]>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
}
