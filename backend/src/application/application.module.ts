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
import { GetProofHistoryUseCase } from './use-cases/location/get-proof-history.use-case';
import { ChangePasswordUseCase } from './use-cases/auth/change-password.use-case';
import { ForgotPasswordUseCase } from './use-cases/auth/forgot-password.use-case';
import { ResetPasswordUseCase } from './use-cases/auth/reset-password.use-case';
import { TriggerPanicUseCase } from './use-cases/security/trigger-panic.use-case';
import { ResolvePanicUseCase } from './use-cases/security/resolve-panic.use-case';
import { GetActivePanicUseCase } from './use-cases/security/get-active-panic.use-case';
import { ReportProximityUseCase } from './use-cases/proximity/report-proximity.use-case';
import { GetProximityZonesUseCase } from './use-cases/proximity/get-proximity-zones.use-case';
import { GetProximityStatusUseCase } from './use-cases/proximity/get-proximity-status.use-case';
import { ReportGpsPresenceUseCase } from './use-cases/proximity/report-gps-presence.use-case';
import { GetHybridStatusUseCase } from './use-cases/proximity/get-hybrid-status.use-case';

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
    GetProofHistoryUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    TriggerPanicUseCase,
    ResolvePanicUseCase,
    GetActivePanicUseCase,
    ReportProximityUseCase,
    GetProximityZonesUseCase,
    GetProximityStatusUseCase,
    ReportGpsPresenceUseCase,
    GetHybridStatusUseCase,
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
    GetProofHistoryUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    TriggerPanicUseCase,
    ResolvePanicUseCase,
    GetActivePanicUseCase,
    ReportProximityUseCase,
    GetProximityZonesUseCase,
    GetProximityStatusUseCase,
    ReportGpsPresenceUseCase,
    GetHybridStatusUseCase,
  ],
})
export class ApplicationModule {}
