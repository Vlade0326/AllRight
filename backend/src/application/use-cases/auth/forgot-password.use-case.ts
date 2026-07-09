import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { IUserRepository } from '../../../domain/ports/user.repository.port';
import { ICachePort } from '../../../domain/ports/cache.port';
import { USER_REPOSITORY, CACHE_PORT } from '../../tokens';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(CACHE_PORT) private readonly cache: ICachePort,
    private readonly config: ConfigService,
  ) {}

  async execute(email: string) {
    const user = await this.users.findByEmail(email);
    const ttlSec = this.config.get<number>('PASSWORD_RESET_TTL_SEC', 900);
    let resetToken: string | undefined;

    if (user) {
      resetToken = randomBytes(32).toString('hex');
      await this.cache.set(`pwd-reset:${resetToken}`, user.id, ttlSec);
    }

    const response: Record<string, string> = {
      message:
        'Si el correo está registrado, recibirás instrucciones para restablecer la contraseña.',
    };

    if (this.config.get('NODE_ENV') !== 'production' && resetToken) {
      response.resetToken = resetToken;
      response.resetUrl = `/auth/reset-password?token=${resetToken}`;
    }

    return response;
  }
}
