import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../api/client';
import { DetectedBeacon, canScanBle, startIBeaconScan } from '../ble/scanBeacons';

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
  const [scanning, setScanning] = useState(false);
  const [lastHit, setLastHit] = useState<string>('');
  const [canScan, setCanScan] = useState(false);
  const scanRef = useRef<{ stop: () => void } | null>(null);
  const lastReportRef = useRef<{ key: string; at: number }>({ key: '', at: 0 });

  useEffect(() => {
    void canScanBle().then(setCanScan);
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

    return () => {
      scanRef.current?.stop();
      scanRef.current = null;
    };
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

  async function onBeaconDetected(hit: DetectedBeacon) {
    const label = `${hit.frame.uuid.slice(0, 8)}… ${hit.frame.major}/${hit.frame.minor} @ ${hit.rssi} dBm`;
    setLastHit(label);

    if (!hit.zone) {
      onStatus(`iBeacon detectado (no whitelist): ${hit.frame.major}/${hit.frame.minor}`, true);
      return;
    }

    // Throttle identical reports (~2s) to avoid flooding API while scanning
    const key = `${hit.zone.id}:${Math.round(hit.rssi / 3)}`;
    const now = Date.now();
    if (lastReportRef.current.key === key && now - lastReportRef.current.at < 2000) {
      return;
    }
    lastReportRef.current = { key, at: now };
    await report(hit.zone, hit.rssi);
  }

  async function startScan() {
    if (!canScan) {
      onStatus(
        'BLE no disponible — usa app Capacitor (iOS/Android), Chrome+HTTPS, o el simulador',
        true,
      );
      return;
    }
    try {
      setScanning(true);
      onStatus('Escaneando iBeacon…');
      const handle = await startIBeaconScan(zones, (hit) => {
        void onBeaconDetected(hit);
      });
      scanRef.current = handle;
    } catch (e) {
      setScanning(false);
      onStatus('Escaneo BLE: ' + (e as Error).message, true);
    }
  }

  function stopScan() {
    scanRef.current?.stop();
    scanRef.current = null;
    setScanning(false);
    onStatus('Escaneo BLE detenido');
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
        {canScan && !scanning && (
          <button
            type="button"
            className="btn-primary"
            disabled={busy || !zones.length}
            onClick={startScan}
            data-testid="ble-scan-btn"
          >
            Escanear iBeacon real
          </button>
        )}
        {scanning && (
          <button
            type="button"
            className="btn-secondary"
            onClick={stopScan}
            data-testid="ble-stop-btn"
          >
            Detener escaneo
          </button>
        )}
        {lastHit && (
          <p className="ble-last-hit" data-testid="ble-last-hit">
            Último ad: {lastHit}
          </p>
        )}
      </div>
    </section>
  );
}
