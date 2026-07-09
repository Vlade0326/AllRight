import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  apiFetch,
  generateProofClient,
  getToken,
  isInsideBounds,
  isSecureForGps,
  LocationConfig,
  LocationProof,
  ProofHistoryItem,
} from '../api/client';

export function useLocationApp() {
  const [config, setConfig] = useState<LocationConfig | null>(null);
  const [coords, setCoordsState] = useState<{ lat: number; lon: number } | null>(null);
  const [history, setHistory] = useState<ProofHistoryItem[]>([]);
  const [status, setStatus] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gpsWarning, setGpsWarning] = useState<string | null>(null);
  const [enableGps, setEnableGps] = useState(false);
  const lastProof = useRef<LocationProof | null>(null);

  const setStatusMsg = useCallback((msg: string, isError = false) => {
    setStatus(msg);
    setStatusError(isError);
  }, []);

  const setCoords = useCallback(
    (lat: number, lon: number) => {
      setCoordsState({ lat, lon });
    },
    [],
  );

  const zoneInside = useMemo(() => {
    if (!coords || !config?.bounds) return null;
    return isInsideBounds(coords.lat, coords.lon, config.bounds);
  }, [coords, config]);

  const loadHistory = useCallback(async () => {
    try {
      const items = await apiFetch<ProofHistoryItem[]>('/location/history');
      setHistory(items);
    } catch {
      // non-critical
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    window.location.href = '/';
  }, []);

  useEffect(() => {
    if (!getToken()) {
      window.location.href = '/';
      return;
    }

    if (!isSecureForGps()) {
      setGpsWarning(
        'GPS requiere HTTPS — usa npm run docker:https (puerto 3443) o accede por localhost',
      );
      setEnableGps(false);
    } else if (!navigator.geolocation) {
      setGpsWarning('Geolocalización no disponible — usando ubicación demo');
      setEnableGps(false);
    } else {
      setEnableGps(true);
    }

    (async () => {
      try {
        const cfg = await apiFetch<LocationConfig>('/location/config');
        setConfig(cfg);
        if (!isSecureForGps() || !navigator.geolocation) {
          setCoordsState({ lat: cfg.zone.lat, lon: cfg.zone.lon });
        }
        setStatusMsg(`Modo ZKP: ${cfg.adapter}`);
        await loadHistory();
      } catch (e) {
        setStatusMsg('Error al cargar: ' + (e as Error).message, true);
        setTimeout(() => (window.location.href = '/'), 2000);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadHistory, setStatusMsg]);

  const generateProof = useCallback(async () => {
    if (!coords || !config) {
      setStatusMsg('Esperando ubicación…', true);
      return;
    }

    setStatusMsg('Generando proof…');
    try {
      if (config.adapter === 'snarkjs' && config.zkpAssetsAvailable && window.snarkjs) {
        lastProof.current = await generateProofClient(coords.lat, coords.lon, config);
        setStatusMsg('Proof Groth16 generado en el dispositivo ✓');
        await apiFetch('/location/prove/record', {
          method: 'POST',
          body: JSON.stringify({
            adapter: 'snarkjs',
            isInside: lastProof.current.payload.publicSignals.isInside,
            zoneId: config.zone.id,
          }),
        });
      } else {
        lastProof.current = await apiFetch<LocationProof>('/location/prove', {
          method: 'POST',
          body: JSON.stringify({ lat: coords.lat, lon: coords.lon }),
        });
        setStatusMsg('Proof generado (modo commitment) ✓');
      }
      await loadHistory();
    } catch (e) {
      setStatusMsg('Error al generar: ' + (e as Error).message, true);
    }
  }, [coords, config, loadHistory, setStatusMsg]);

  const verifyProof = useCallback(async () => {
    if (!lastProof.current) {
      setStatusMsg('Primero genera un proof', true);
      return;
    }

    setStatusMsg('Verificando…');
    try {
      const result = await apiFetch<{ valid: boolean; isInside: boolean }>('/location/verify', {
        method: 'POST',
        body: JSON.stringify({
          proof: lastProof.current.proof,
          payload: lastProof.current.payload,
        }),
      });
      setStatusMsg(
        result.valid
          ? `Verificado ✓ — ${result.isInside ? 'dentro de zona' : 'fuera de zona'}`
          : 'Proof inválido ✗',
        !result.valid,
      );
      await loadHistory();
    } catch (e) {
      setStatusMsg('Error al verificar: ' + (e as Error).message, true);
    }
  }, [loadHistory, setStatusMsg]);

  const checkGeofence = useCallback(async () => {
    if (!coords) {
      setStatusMsg('Esperando ubicación…', true);
      return;
    }

    setStatusMsg('Comprobando geofence…');
    try {
      const result = await apiFetch<{ message?: string; status: string }>(
        '/security/check-location',
        {
          method: 'POST',
          body: JSON.stringify({ lat: coords.lat, lon: coords.lon }),
        },
      );
      setStatusMsg(result.message || result.status);
    } catch (e) {
      setStatusMsg('Error: ' + (e as Error).message, true);
    }
  }, [coords, setStatusMsg]);

  return {
    config,
    coords,
    setCoords,
    zoneInside,
    history,
    loadHistory,
    status,
    statusError,
    loading,
    gpsWarning,
    enableGps,
    logout,
    generateProof,
    verifyProof,
    checkGeofence,
  };
}
