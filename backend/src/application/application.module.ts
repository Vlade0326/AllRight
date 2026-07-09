import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { LoginUseCase } from './use-cases/auth/login.use-case';
import { RegisterUserUseCase } from './use-cases/auth/register-user.use-case';
import { LogActionUseCase } from './use-cases/audit/log-action.use-case';
import { GenerateLocationProofUseCase } from './use-cases/location/generate-location-proof.use-case';
import { VerifyLocationProofUseCase } from './use-cases/location/verify-location-proof.use-case';
import { UpdateLocationUseCase } from './use-cases/location/update-location.use-case';
import { ChangePasswordUseCase } from './use-cases/auth/change-password.use-case';
import { ForgotPasswordUseCase } from './use-cases/auth/forgot-password.use-case';
import { ResetPasswordUseCase } from './use-cases/auth/reset-password.use-case';

@Module({
  imports: [
    InfrastructureModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'change-me-in-production'),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES_IN', '60m') as `${number}m`,
        },
      }),
    }),
  ],
  providers: [
    LoginUseCase,
    RegisterUserUseCase,
    LogActionUseCase,
    GenerateLocationProofUseCase,
    VerifyLocationProofUseCase,
    UpdateLocationUseCase,
    ChangePasswordUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
  ],
  exports: [
    JwtModule,
    LoginUseCase,
    RegisterUserUseCase,
    LogActionUseCase,
    GenerateLocationProofUseCase,
    VerifyLocationProofUseCase,
    UpdateLocationUseCase,
    ChangePasswordUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
  ],
})
export class ApplicationModule {}
