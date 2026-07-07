import { Coordinates } from '../value-objects/coordinates.vo';

export class GeofenceZone {
  constructor(
    readonly id: string,
    readonly center: Coordinates,
    readonly radiusKm: number,
  ) {}
}
