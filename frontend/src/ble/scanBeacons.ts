import {
  APPLE_COMPANY_ID,
  BeaconMatchTarget,
  IBeaconFrame,
  matchBeaconZone,
  parseIBeacon,
} from './ibeacon';

export interface DetectedBeacon {
  frame: IBeaconFrame;
  zone?: BeaconMatchTarget;
  rssi: number;
  deviceName?: string;
}

type AdvertisementLike = {
  rssi?: number | null;
  device?: { name?: string | null };
  manufacturerData?: Map<number, DataView>;
};

type BluetoothLike = {
  requestLEScan?: (options: Record<string, unknown>) => Promise<{ stop: () => void }>;
  requestDevice: (options: Record<string, unknown>) => Promise<{
    name?: string | null;
    watchAdvertisements?: () => Promise<void>;
    addEventListener: (type: string, listener: (ev: AdvertisementLike) => void) => void;
    removeEventListener?: (type: string, listener: (ev: AdvertisementLike) => void) => void;
  }>;
  addEventListener: (type: string, listener: (ev: AdvertisementLike) => void) => void;
  removeEventListener: (type: string, listener: (ev: AdvertisementLike) => void) => void;
};

export function getBluetooth(): BluetoothLike | null {
  if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) return null;
  return (navigator as Navigator & { bluetooth: BluetoothLike }).bluetooth;
}

function extractFrames(event: AdvertisementLike): IBeaconFrame[] {
  const frames: IBeaconFrame[] = [];
  const map = event.manufacturerData;
  if (!map) return frames;

  const apple = map.get(APPLE_COMPANY_ID);
  if (apple) {
    const parsed = parseIBeacon(apple);
    if (parsed) frames.push(parsed);
  }

  // Some stacks expose company id without filtering — scan all entries
  for (const [companyId, data] of map.entries()) {
    if (companyId === APPLE_COMPANY_ID) continue;
    const parsed = parseIBeacon(data);
    if (parsed) frames.push(parsed);
  }

  return frames;
}

export interface ScanHandle {
  stop: () => void;
}

/**
 * Prefer Chrome `requestLEScan` (continuous ads). Fallback: pick device + watchAdvertisements.
 */
export async function startIBeaconScan(
  zones: BeaconMatchTarget[],
  onDetect: (hit: DetectedBeacon) => void,
): Promise<ScanHandle> {
  const bluetooth = getBluetooth();
  if (!bluetooth) {
    throw new Error('Web Bluetooth no disponible (usa Chrome/Android + HTTPS)');
  }

  const handleAd = (event: AdvertisementLike) => {
    const rssi = typeof event.rssi === 'number' ? event.rssi : -100;
    for (const frame of extractFrames(event)) {
      onDetect({
        frame,
        zone: matchBeaconZone(frame, zones),
        rssi,
        deviceName: event.device?.name ?? undefined,
      });
    }
  };

  if (typeof bluetooth.requestLEScan === 'function') {
    const scan = await bluetooth.requestLEScan({
      keepRepeatedDevices: true,
      filters: [{ manufacturerData: [{ companyIdentifier: APPLE_COMPANY_ID }] }],
    });
    bluetooth.addEventListener('advertisementreceived', handleAd);
    return {
      stop: () => {
        try {
          scan.stop();
        } catch {
          // ignore
        }
        bluetooth.removeEventListener('advertisementreceived', handleAd);
      },
    };
  }

  // Fallback: user picks a peripheral that advertises Apple manufacturer data
  const device = await bluetooth.requestDevice({
    filters: [{ manufacturerData: [{ companyIdentifier: APPLE_COMPANY_ID }] }],
    optionalServices: [],
  });

  if (!device.watchAdvertisements) {
    throw new Error(
      'Este navegador no soporta escaneo continuo (requestLEScan / watchAdvertisements). Activa flags de Web Bluetooth o usa el simulador.',
    );
  }

  await device.watchAdvertisements();
  device.addEventListener('advertisementreceived', handleAd);

  return {
    stop: () => {
      device.removeEventListener?.('advertisementreceived', handleAd);
    },
  };
}
