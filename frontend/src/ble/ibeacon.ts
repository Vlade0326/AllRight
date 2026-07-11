/** Apple company ID used by classic iBeacon advertisements. */
export const APPLE_COMPANY_ID = 0x004c;

export interface IBeaconFrame {
  uuid: string;
  major: number;
  minor: number;
  txPower: number;
}

export interface BeaconMatchTarget {
  id: string;
  name: string;
  uuid: string;
  major: number;
  minor: number;
  rssiThreshold: number;
}

/**
 * Parse Apple iBeacon payload from BLE manufacturer data.
 * Layout after company id: type(0x02), len(0x15), uuid[16], major[2], minor[2], txPower[1]
 */
export function parseIBeacon(data: DataView | ArrayBuffer | Uint8Array): IBeaconFrame | null {
  const view =
    data instanceof DataView
      ? data
      : data instanceof ArrayBuffer
        ? new DataView(data)
        : new DataView(data.buffer, data.byteOffset, data.byteLength);

  if (view.byteLength < 23) return null;
  if (view.getUint8(0) !== 0x02 || view.getUint8(1) !== 0x15) return null;

  const uuidBytes = new Uint8Array(view.buffer, view.byteOffset + 2, 16);
  const uuid = formatUuid(uuidBytes);
  const major = view.getUint16(18, false);
  const minor = view.getUint16(20, false);
  const txPower = view.getInt8(22);

  return { uuid, major, minor, txPower };
}

export function formatUuid(bytes: Uint8Array): string {
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

export function matchBeaconZone(
  frame: IBeaconFrame,
  zones: BeaconMatchTarget[],
): BeaconMatchTarget | undefined {
  return zones.find(
    (z) =>
      z.uuid.toLowerCase() === frame.uuid.toLowerCase() &&
      z.major === frame.major &&
      z.minor === frame.minor,
  );
}

/** Build a synthetic iBeacon manufacturer payload (for tests / mock ads). */
export function buildIBeaconPayload(
  uuid: string,
  major: number,
  minor: number,
  txPower = -59,
): Uint8Array {
  const hex = uuid.replace(/-/g, '');
  if (hex.length !== 32) throw new Error('UUID inválido');
  const out = new Uint8Array(23);
  out[0] = 0x02;
  out[1] = 0x15;
  for (let i = 0; i < 16; i++) {
    out[2 + i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  out[18] = (major >> 8) & 0xff;
  out[19] = major & 0xff;
  out[20] = (minor >> 8) & 0xff;
  out[21] = minor & 0xff;
  out[22] = txPower & 0xff;
  return out;
}
