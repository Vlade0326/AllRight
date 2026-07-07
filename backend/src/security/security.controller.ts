import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { GeofenceService } from './geofence/geofence.service';
import { CryptoService } from './crypto/crypto.service';
import { AuditService } from '../audit/audit.service'; // <--- 1. Importa el servicio de auditoría
import { AuthGuard } from '../auth/auth.guard';

@Controller('security')
@UseGuards(AuthGuard)
export class SecurityController {
  
  // 2. Inyecta el AuditService en el constructor
  constructor(
    private readonly geofenceService: GeofenceService,
    private readonly cryptoService: CryptoService,
    private readonly auditService: AuditService 
  ) {}

  @Post('check-location')
  async checkLocation(@Body() body: { lat: number, lon: number }, @Req() req: any) {
    const userId = req.user.id;
    const isInside = this.geofenceService.isUserInZone(body.lat, body.lon);

    if (!isInside) {
      // 3. Ejecuta la destrucción
      this.cryptoService.destroyKey(userId);
      
      // 4. Registra el evento en la base de datos de logs
      await this.auditService.logAction(userId, 'SECURITY_DESTRUCTION', 'Usuario fuera de zona, llave destruida.');
      
      return { 
        status: 'DESTRUCTION_TRIGGERED', 
        message: 'Has salido de la zona segura. Llaves destruidas.' 
      };
    }

    return { status: 'SECURE', message: 'Ubicación confirmada.' };
  }
}