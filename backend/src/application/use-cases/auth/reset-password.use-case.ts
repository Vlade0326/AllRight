import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IUserRepository } from '../../../domain/ports/user.repository.port';
import { ICachePort } from '../../../domain/ports/cache.port';
import { USER_REPOSITORY, CACHE_PORT } from '../../tokens';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(CACHE_PORT) private readonly cache: ICachePort,
  ) {}

  async execute(token: string, newPassword: string) {
    const userId = await this.cache.get(`pwd-reset:${token}`);
    if (!userId) {
      throw new UnauthorizedException('Token de restablecimiento inválido o expirado');
    }

    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const samePassword = await bcrypt.compare(newPassword, user.password);
    if (samePassword) {
      throw new BadRequestException(
        'La nueva contraseña debe ser diferente a la actual',
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    await this.users.updatePassword(userId, hashed);
    await this.cache.del(`pwd-reset:${token}`);

    return { message: 'Contraseña restablecida correctamente' };
  }
}
