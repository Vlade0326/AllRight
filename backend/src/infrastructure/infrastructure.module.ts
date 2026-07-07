import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { Coordinates } from '../domain/value-objects/coordinates.vo';
import { GeofenceZone } from '../domain/entities/geofence-zone.entity';
import {
  AUDIT_REPOSITORY,
  CACHE_PORT,
  GEOFENCE_ZONE,
  LOCATION_PROOF_PORT,
  USER_REPOSITORY,
} from '../application/tokens';
import { validateEnv } from './config/env.validation';
import { RedisCacheAdapter } from './cache/redis-cache.adapter';
import { MetricsService } from './observability/metrics.service';
import { TypeOrmUserRepository } from './persistence/typeorm/user.repository';
import { TypeOrmAuditRepository } from './persistence/typeorm/audit.repository';
import { UserOrmEntity } from './persistence/typeorm/user.orm-entity';
import { AuditLogOrmEntity } from './persistence/typeorm/audit-log.orm-entity';
import { zkpAdapterProvider } from './zkp/zkp.provider';

const defaultZone = new GeofenceZone(
  'cali-safe-zone',
  new Coordinates(
    parseFloat(process.env.GEOFENCE_LAT ?? '3.4516'),
    parseFloat(process.env.GEOFENCE_LON ?? '-76.5320'),
  ),
  parseFloat(process.env.GEOFENCE_RADIUS_KM ?? '0.5'),
);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'root'),
        database: config.get('DB_DATABASE', 'postgres'),
        entities: [UserOrmEntity, AuditLogOrmEntity],
        migrations: [
          join(__dirname, 'persistence', 'typeorm', 'migrations', '*.{ts,js}'),
        ],
        migrationsRun: config.get('DB_MIGRATIONS_RUN', 'false') === 'true',
        synchronize: config.get('DB_SYNCHRONIZE', 'false') === 'true',
      }),
    }),
    TypeOrmModule.forFeature([UserOrmEntity, AuditLogOrmEntity]),
  ],
  providers: [
    MetricsService,
    RedisCacheAdapter,
    TypeOrmUserRepository,
    TypeOrmAuditRepository,
    zkpAdapterProvider,
    { provide: USER_REPOSITORY, useExisting: TypeOrmUserRepository },
    { provide: AUDIT_REPOSITORY, useExisting: TypeOrmAuditRepository },
    { provide: CACHE_PORT, useExisting: RedisCacheAdapter },
    { provide: GEOFENCE_ZONE, useValue: defaultZone },
  ],
  exports: [
    MetricsService,
    USER_REPOSITORY,
    AUDIT_REPOSITORY,
    CACHE_PORT,
    LOCATION_PROOF_PORT,
    GEOFENCE_ZONE,
    TypeOrmModule,
  ],
})
export class InfrastructureModule {}
