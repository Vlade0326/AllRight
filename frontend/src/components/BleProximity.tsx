import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';

export interface BeaconZone {
  id: string;
  name: string;
  uuid: string;
  major: number;
  minor: number;
  rssiThreshold: number;
}

export interface ProximityStatus {
  status: 'inside' | 'outside' | 'unknown';
  beaconId?: string;
  beaconName?: string;
  rssi?: number;
  updatedAt?: string;
}

interface BleProximityProps {
  onStatus: (msg: string, isError?: boolean) => void;
}

export function BleProximity({ onStatus }: BleProximityProps) {
  const [zones, setZones] = useState<BeaconZone[]>([]);
  const [status, setStatus] = useState<ProximityStatus>({ status: 'unknown' });
  const [selectedId, setSelectedId] = useState('');
  const [rssi, setRssi] = useState(-55);
  const [busy, setBusy] = useState(false);
  const webBt =
    typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  useEffect(() => {
    (async () => {
      try {
        const list = await apiFetch<BeaconZone[]>('/proximity/zones');
        setZones(list);
        if (list[0]) setSelectedId(list[0].id);
        const current = await apiFetch<ProximityStatus>('/proximity/status');
        setStatus(current);
      } catch {
        // non-critical
      }
    })();
  }, []);

  async function report(zone: BeaconZone, signal: number) {
    setBusy(true);
    try {
      const result = await apiFetch<ProximityStatus>('/proximity/report', {
        method: 'POST',
        body: JSON.stringify({
          beaconId: zone.id,
          uuid: zone.uuid,
          major: zone.major,
          minor: zone.minor,
          rssi: signal,
        }),
      });
      setStatus(result);
      onStatus(
        result.status === 'inside'
          ? `BLE: en zona — ${result.beaconName}`
          : `BLE: fuera / señal débil (${result.rssi} dBm)`,
        result.status !== 'inside',
      );
    } catch (e) {
      onStatus('Error BLE: ' + (e as Error).message, true);
    } finally {
      setBusy(false);
    }
  }

  async function simulate() {
    const zone = zones.find((z) => z.id === selectedId);
    if (!zone) return;
    await report(zone, rssi);
  }

  async function scanWebBluetooth() {
    if (!webBt) {
      onStatus('Web Bluetooth no disponible — usa simulador', true);
      return;
    }
    try {
      // PoC: request any BLE device; map first configured zone with simulated RSSI
      // Real iBeacon parsing requires manufacturer data (Chrome Android).
      await (navigator as Navigator & { bluetooth: { requestDevice: (o: unknown) => Promise<unknown> } }).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [],
      });
      const zone = zones[0];
      if (zone) await report(zone, -50);
    } catch (e) {
      onStatus('Escaneo BLE cancelado o fallido: ' + (e as Error).message, true);
    }
  }

  const badgeClass =
    status.status === 'inside'
      ? 'in-zone'
      : status.status === 'outside'
        ? 'out-zone'
        : '';

  return (
    <section className="ble-panel" data-testid="ble-proximity">
      <div className="ble-header">
        <h2>Proximidad BLE</h2>
        <span className={`zone-badge ${badgeClass}`} data-testid="ble-status">
          {status.status === 'inside'
            ? 'En zona interior'
            : status.status === 'outside'
              ? 'Sin proximidad'
              : 'Sin señal'}
        </span>
      </div>

      <div className="ble-sim">
        <label>
          Beacon
          <select
            data-testid="ble-beacon-select"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          RSSI {rssi} dBm
          <input
            type="range"
            min={-100}
            max={-30}
            value={rssi}
            data-testid="ble-rssi"
            onChange={(e) => setRssi(Number(e.target.value))}
          />
        </label>
        <button
          type="button"
          className="btn-secondary"
          disabled={busy || !zones.length}
          onClick={simulate}
          data-testid="ble-simulate-btn"
        >
          Simular detección
        </button>
        {webBt && (
          <button
            type="button"
            className="btn-secondary"
            disabled={busy}
            onClick={scanWebBluetooth}
            data-testid="ble-scan-btn"
          >
            Escanear BLE
          </button>
        )}
      </div>
    </section>
  );
}
