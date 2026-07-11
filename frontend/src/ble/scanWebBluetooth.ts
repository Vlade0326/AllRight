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

export async function startWebBluetoothIBeaconScan(
  zones: BeaconMatchTarget[],
  onDetect: (hit: DetectedBeacon) => void,
): Promise<ScanHandle> {
  const bluetooth = getBluetooth();
  if (!bluetooth) {
    throw new Error('Web Bluetooth no disponible (usa app Capacitor iOS/Android o Chrome + HTTPS)');
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

  const device = await bluetooth.requestDevice({
    filters: [{ manufacturerData: [{ companyIdentifier: APPLE_COMPANY_ID }] }],
    optionalServices: [],
  });

  if (!device.watchAdvertisements) {
    throw new Error(
      'Escaneo continuo no disponible. Usa la app nativa Capacitor (iOS/Android) o activa flags Web Bluetooth.',
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
