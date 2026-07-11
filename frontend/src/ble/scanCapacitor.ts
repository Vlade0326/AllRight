import { APPLE_COMPANY_ID, BeaconMatchTarget, matchBeaconZone, parseIBeacon } from './ibeacon';
import type { DetectedBeacon, ScanHandle } from './scanWebBluetooth';

/** Dynamic import so web builds don't break if plugin is absent at runtime. */
export async function isCapacitorNative(): Promise<boolean> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

function dataViewFromUnknown(value: unknown): DataView | null {
  if (!value) return null;
  if (value instanceof DataView) return value;
  if (value instanceof ArrayBuffer) return new DataView(value);
  if (value instanceof Uint8Array) {
    return new DataView(value.buffer, value.byteOffset, value.byteLength);
  }
  // Capacitor sometimes delivers base64 strings
  if (typeof value === 'string') {
    try {
      const bin = atob(value);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new DataView(bytes.buffer);
    } catch {
      return null;
    }
  }
  return null;
}

function framesFromManufacturerData(
  manufacturerData: Record<string, unknown> | undefined,
) {
  if (!manufacturerData) return [];
  const frames = [];
  for (const [key, raw] of Object.entries(manufacturerData)) {
    const companyId = Number(key);
    const view = dataViewFromUnknown(raw);
    if (!view) continue;
    // Prefer Apple; also try parse on any company payload
    if (companyId === APPLE_COMPANY_ID || Number.isFinite(companyId)) {
      const parsed = parseIBeacon(view);
      if (parsed) frames.push(parsed);
    }
  }
  return frames;
}

export async function startCapacitorIBeaconScan(
  zones: BeaconMatchTarget[],
  onDetect: (hit: DetectedBeacon) => void,
): Promise<ScanHandle> {
  const { BleClient } = await import('@capacitor-community/bluetooth-le');

  await BleClient.initialize({ androidNeverForLocation: true });

  await BleClient.requestLEScan({ allowDuplicates: true }, (result) => {
    const rssi = typeof result.rssi === 'number' ? result.rssi : -100;
    const frames = framesFromManufacturerData(
      result.manufacturerData as Record<string, unknown> | undefined,
    );
    for (const frame of frames) {
      onDetect({
        frame,
        zone: matchBeaconZone(frame, zones),
        rssi,
        deviceName: result.localName ?? result.device?.name,
      });
    }
  });

  return {
    stop: () => {
      void BleClient.stopLEScan().catch(() => undefined);
    },
  };
}
