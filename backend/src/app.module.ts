import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { getZkpArtifactsDir } from './infrastructure/zkp/zkp-artifacts.util';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { ApplicationModule } from './application/application.module';
import { AuthPresentationModule } from './presentation/modules/auth-presentation.module';
import { AuthController } from './presentation/controllers/auth.controller';
import { UsersController } from './presentation/controllers/users.controller';
import { SecurityController } from './presentation/controllers/security.controller';
import { LocationController } from './presentation/controllers/location.controller';
import { HealthController } from './presentation/controllers/health.controller';
import { MetricsController } from './presentation/controllers/metrics.controller';
import { NotificationsController } from './presentation/controllers/notifications.controller';
import { GlobalExceptionFilter } from './presentation/filters/http-exception.filter';
import { HttpMetricsInterceptor } from './presentation/interceptors/http-metrics.interceptor';
import { RateLimitGuard } from './presentation/guards/rate-limit.guard';

@Module({
  imports: [
    InfrastructureModule,
    ApplicationModule,
    AuthPresentationModule,
    ServeStaticModule.forRoot(
      {
        rootPath: join(__dirname, '..', 'public'),
        exclude: ['/zkp/*path'],
      },
      {
        rootPath: getZkpArtifactsDir(),
        serveRoot: '/zkp',
        serveStaticOptions: { index: false },
      },
    ),
  ],
  controllers: [
    AuthController,
    UsersController,
    SecurityController,
    LocationController,
    HealthController,
    MetricsController,
    NotificationsController,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor },
    { provide: APP_GUARD, useClass: RateLimitGuard },
  ],
})
export class AppModule {}
