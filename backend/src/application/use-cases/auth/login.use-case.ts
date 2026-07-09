import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { IUserRepository } from '../../../domain/ports/user.repository.port';
import { USER_REPOSITORY } from '../../tokens';
import { RateLimitService } from '../../../infrastructure/security/rate-limit.service';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly rateLimit: RateLimitService,
  ) {}

  async execute(email: string, password: string, clientIp = 'unknown') {
    const blocked = await this.rateLimit.isLoginBlocked(clientIp);
    if (!blocked.allowed) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Demasiados intentos fallidos. Intente más tarde.',
          retryAfterSec: blocked.retryAfterSec,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.users.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      await this.rateLimit.checkLoginFailure(clientIp);
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
