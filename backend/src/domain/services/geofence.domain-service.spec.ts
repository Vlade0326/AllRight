import { Coordinates } from '../value-objects/coordinates.vo';
import { GeofenceZone } from '../entities/geofence-zone.entity';
import { GeofenceDomainService } from './geofence.domain-service';

describe('GeofenceDomainService', () => {
  const service = new GeofenceDomainService();
  const zone = new GeofenceZone(
    'test-zone',
    new Coordinates(3.4516, -76.532),
    0.5,
  );

  it('returns true for coordinates inside zone', () => {
    expect(
      service.isInsideZone(new Coordinates(3.4516, -76.532), zone),
    ).toBe(true);
  });

  it('returns false for coordinates far outside zone', () => {
    expect(
      service.isInsideZone(new Coordinates(40.4168, -3.7038), zone),
    ).toBe(false);
  });
});
