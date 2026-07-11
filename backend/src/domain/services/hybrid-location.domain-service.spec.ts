import { fuseLocationSignals } from './hybrid-location.domain-service';

describe('fuseLocationSignals', () => {
  it('BLE inside → SECURE_INDOOR even if GPS outside', () => {
    const r = fuseLocationSignals('outside', 'inside', {
      beaconId: 'cali-safe-room',
      beaconName: 'Sala segura',
    });
    expect(r.mode).toBe('SECURE_INDOOR');
    expect(r.secure).toBe(true);
    expect(r.source).toBe('ble');
  });

  it('GPS inside + BLE unknown → SECURE_OUTDOOR', () => {
    const r = fuseLocationSignals('inside', 'unknown');
    expect(r.mode).toBe('SECURE_OUTDOOR');
    expect(r.source).toBe('gps');
  });

  it('both outside → OUTSIDE', () => {
    const r = fuseLocationSignals('outside', 'outside');
    expect(r.mode).toBe('OUTSIDE');
    expect(r.secure).toBe(false);
  });

  it('both unknown → UNKNOWN', () => {
    const r = fuseLocationSignals('unknown', 'unknown');
    expect(r.mode).toBe('UNKNOWN');
  });
});
