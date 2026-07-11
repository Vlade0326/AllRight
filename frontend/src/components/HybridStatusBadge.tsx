import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';

export interface HybridStatus {
  mode: 'SECURE_INDOOR' | 'SECURE_OUTDOOR' | 'OUTSIDE' | 'UNKNOWN';
  label: string;
  secure: boolean;
  gps: 'inside' | 'outside' | 'unknown';
  ble: 'inside' | 'outside' | 'unknown';
  source: 'ble' | 'gps' | 'both' | 'none';
  beaconId?: string;
  beaconName?: string;
}

interface HybridStatusBadgeProps {
  coords: { lat: number; lon: number } | null;
  zoneInside: boolean | null;
  refreshKey?: number;
}

export function HybridStatusBadge({
  coords,
  zoneInside,
  refreshKey = 0,
}: HybridStatusBadgeProps) {
  const [hybrid, setHybrid] = useState<HybridStatus | null>(null);

  const refresh = useCallback(async () => {
    try {
      if (coords && zoneInside !== null) {
        await apiFetch('/proximity/gps', {
          method: 'POST',
          body: JSON.stringify({
            lat: coords.lat,
            lon: coords.lon,
            inside: zoneInside,
          }),
        });
      }
      const result = await apiFetch<HybridStatus>('/proximity/hybrid');
      setHybrid(result);
    } catch {
      // non-critical
    }
  }, [coords, zoneInside]);

  useEffect(() => {
    void refresh();
  }, [refresh, refreshKey]);

  if (!hybrid) {
    return (
      <div className="hybrid-badge" data-testid="hybrid-status">
        <span className="zone-badge">Híbrido: —</span>
      </div>
    );
  }

  const cls = hybrid.secure ? 'in-zone' : hybrid.mode === 'UNKNOWN' ? '' : 'out-zone';

  return (
    <div className="hybrid-badge" data-testid="hybrid-status">
      <span className={`zone-badge ${cls}`}>{hybrid.label}</span>
      <span className="hybrid-meta" data-testid="hybrid-meta">
        GPS:{hybrid.gps} · BLE:{hybrid.ble}
        {hybrid.beaconName ? ` · ${hybrid.beaconName}` : ''}
      </span>
    </div>
  );
}
