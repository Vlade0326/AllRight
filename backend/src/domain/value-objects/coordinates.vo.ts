export class Coordinates {
  constructor(
    readonly latitude: number,
    readonly longitude: number,
  ) {
    if (latitude < -90 || latitude > 90) {
      throw new Error('Invalid latitude');
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error('Invalid longitude');
    }
  }
}
