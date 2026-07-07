import { Coordinates } from '../value-objects/coordinates.vo';
import { GeofenceZone } from '../entities/geofence-zone.entity';

export class GeofenceDomainService {
  isInsideZone(coordinates: Coordinates, zone: GeofenceZone): boolean {
    const R = 6371;
    const dLat =
      ((coordinates.latitude - zone.center.latitude) * Math.PI) / 180;
    const dLon =
      ((coordinates.longitude - zone.center.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((zone.center.latitude * Math.PI) / 180) *
        Math.cos((coordinates.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return distance <= zone.radiusKm;
  }
}
