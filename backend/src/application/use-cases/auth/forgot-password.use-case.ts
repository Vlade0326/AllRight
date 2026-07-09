import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { IUserRepository } from '../../../domain/ports/user.repository.port';
import { ICachePort } from '../../../domain/ports/cache.port';
import { IEmailPort } from '../../../domain/ports/email.port';
import { USER_REPOSITORY, CACHE_PORT, EMAIL_PORT } from '../../tokens';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(CACHE_PORT) private readonly cache: ICachePort,
    @Inject(EMAIL_PORT) private readonly email: IEmailPort,
    private readonly config: ConfigService,
  ) {}

  async execute(email: string) {
    const user = await this.users.findByEmail(email);
    const ttlSec = this.config.get<number>('PASSWORD_RESET_TTL_SEC', 900);
    let resetToken: string | undefined;

    if (user) {
      resetToken = randomBytes(32).toString('hex');
      await this.cache.set(`pwd-reset:${resetToken}`, user.id, ttlSec);

      const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
      const resetUrl = `${appUrl}/?reset=${resetToken}`;
      await this.email.send({
        to: email,
        subject: 'Restablecer contraseña — AllRight',
        text: `Solicitaste restablecer tu contraseña. Usa este enlace (válido 15 min): ${resetUrl}`,
        html: `<p>Solicitaste restablecer tu contraseña.</p><p><a href="${resetUrl}">Restablecer contraseña</a></p>`,
      });
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
