export interface BeaconZone {
  id: string;
  name: string;
  uuid: string;
  major: number;
  minor: number;
  /** RSSI mínimo (menos negativo = más cerca). Ej: -70 */
  rssiThreshold: number;
}

export const DEFAULT_BEACON_ZONES: BeaconZone[] = [
  {
    id: 'cali-office-lobby',
    name: 'Lobby Cali',
    uuid: 'f7826da6-4fa2-4e98-8024-bc5b71e0893e',
    major: 1,
    minor: 1,
    rssiThreshold: -70,
  },
  {
    id: 'cali-safe-room',
    name: 'Sala segura',
    uuid: 'f7826da6-4fa2-4e98-8024-bc5b71e0893e',
    major: 1,
    minor: 2,
    rssiThreshold: -65,
  },
];
