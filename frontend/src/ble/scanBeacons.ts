import type { BeaconMatchTarget } from './ibeacon';
import {
  DetectedBeacon,
  getBluetooth,
  ScanHandle,
  startWebBluetoothIBeaconScan,
} from './scanWebBluetooth';
import { isCapacitorNative, startCapacitorIBeaconScan } from './scanCapacitor';

export type { DetectedBeacon, ScanHandle } from './scanWebBluetooth';
export { getBluetooth } from './scanWebBluetooth';

export async function canScanBle(): Promise<boolean> {
  if (await isCapacitorNative()) return true;
  return !!getBluetooth();
}

/**
 * Native Capacitor (iOS/Android) first; Web Bluetooth fallback (Chrome).
 */
export async function startIBeaconScan(
  zones: BeaconMatchTarget[],
  onDetect: (hit: DetectedBeacon) => void,
): Promise<ScanHandle> {
  if (await isCapacitorNative()) {
    return startCapacitorIBeaconScan(zones, onDetect);
  }
  return startWebBluetoothIBeaconScan(zones, onDetect);
}
