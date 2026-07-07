import { Module } from '@nestjs/common';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { GeofenceModule } from './geofence/geofence.module';
import { CryptoService } from './crypto/crypto.service'; // Asegúrate que esta ruta sea exacta

@Module({
  imports: [
    AuthModule,
    AuditModule,
    GeofenceModule,
  ],
  controllers: [SecurityController],
  providers: [
    SecurityService, 
    CryptoService, // CryptoService está aquí como provider
  ],
})
export class SecurityModule {} // La clase se llama SecurityModule