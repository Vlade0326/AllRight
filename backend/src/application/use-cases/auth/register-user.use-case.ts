import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IUserRepository } from '../../../domain/ports/user.repository.port';
import { UserRole } from '../../../infrastructure/persistence/typeorm/user-role.enum';
import { USER_REPOSITORY } from '../../tokens';

export interface RegisterUserInput {
  email: string;
  password: string;
  role?: string;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(input: RegisterUserInput) {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(input.password, salt);
    return this.users.create({
      email: input.email,
      password: hashed,
      role: input.role ?? UserRole.USER,
    });
  }
}
