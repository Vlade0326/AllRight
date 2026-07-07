import { Injectable } from '@nestjs/common';

@Injectable()
export class SecurityService {
  // Aquí irá la lógica de seguridad cuando la necesites
  checkSecurity() {
    return 'Security Service is active';
  }
}