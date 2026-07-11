export type SignalPresence = 'inside' | 'outside' | 'unknown';

export type HybridMode =
  | 'SECURE_INDOOR'
  | 'SECURE_OUTDOOR'
  | 'OUTSIDE'
  | 'UNKNOWN';

export interface HybridStatus {
  mode: HybridMode;
  label: string;
  secure: boolean;
  gps: SignalPresence;
  ble: SignalPresence;
  source: 'ble' | 'gps' | 'both' | 'none';
  beaconId?: string;
  beaconName?: string;
}

/**
 * Fuse GPS geofence + BLE proximity.
 * Indoors: BLE can override GPS-out (GPS often fails indoors).
 * Outdoors: GPS inside + no BLE → outdoor secure zone.
 */
export function fuseLocationSignals(
  gps: SignalPresence,
  ble: SignalPresence,
  meta?: { beaconId?: string; beaconName?: string },
): HybridStatus {
  if (ble === 'inside') {
    return {
      mode: 'SECURE_INDOOR',
      label: 'Seguro (interior BLE)',
      secure: true,
      gps,
      ble,
      source: gps === 'inside' ? 'both' : 'ble',
      beaconId: meta?.beaconId,
      beaconName: meta?.beaconName,
    };
  }

  if (gps === 'inside') {
    return {
      mode: 'SECURE_OUTDOOR',
      label: 'Seguro (geofence GPS)',
      secure: true,
      gps,
      ble,
      source: 'gps',
    };
  }

  if (gps === 'outside' || ble === 'outside') {
    return {
      mode: 'OUTSIDE',
      label: 'Fuera de zona',
      secure: false,
      gps,
      ble,
      source: gps === 'outside' && ble === 'outside' ? 'both' : gps === 'outside' ? 'gps' : 'ble',
    };
  }

  return {
    mode: 'UNKNOWN',
    label: 'Sin señal suficiente',
    secure: false,
    gps,
    ble,
    source: 'none',
  };
}
