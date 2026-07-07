import { Injectable } from '@nestjs/common';

@Injectable()
export class GeofenceService {
  private readonly SAFE_LAT = 3.4516; // Coordenada base
  private readonly SAFE_LON = -76.5320;
  private readonly RADIUS_KM = 0.5;

  public isUserInZone(userLat: number, userLon: number): boolean {
    const R = 6371;
    const dLat = (userLat - this.SAFE_LAT) * Math.PI / 180;
    const dLon = (userLon - this.SAFE_LON) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.SAFE_LAT * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return distance <= this.RADIUS_KM;
  }
}
