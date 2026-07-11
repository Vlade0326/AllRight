import { describe, expect, it } from 'vitest';
import { buildIBeaconPayload, matchBeaconZone, parseIBeacon } from './ibeacon';

describe('parseIBeacon', () => {
  const uuid = 'f7826da6-4fa2-4e98-8024-bc5b71e0893e';

  it('parses a valid Apple iBeacon frame', () => {
    const payload = buildIBeaconPayload(uuid, 1, 2, -59);
    const frame = parseIBeacon(payload);
    expect(frame).not.toBeNull();
    expect(frame!.uuid).toBe(uuid);
    expect(frame!.major).toBe(1);
    expect(frame!.minor).toBe(2);
    expect(frame!.txPower).toBe(-59);
  });

  it('rejects short or invalid payloads', () => {
    expect(parseIBeacon(new Uint8Array([0x02, 0x15]))).toBeNull();
    expect(parseIBeacon(new Uint8Array(23).fill(0))).toBeNull();
  });

  it('matches whitelist zone by uuid/major/minor', () => {
    const frame = parseIBeacon(buildIBeaconPayload(uuid, 1, 1))!;
    const zone = matchBeaconZone(frame, [
      {
        id: 'cali-office-lobby',
        name: 'Lobby Cali',
        uuid,
        major: 1,
        minor: 1,
        rssiThreshold: -70,
      },
    ]);
    expect(zone?.id).toBe('cali-office-lobby');
  });
});
