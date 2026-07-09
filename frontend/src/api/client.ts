export const SCALE = 1_000_000;

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
    throw new Error(msg || `Error ${res.status}`);
  }
  return data as T;
}

export interface LocationConfig {
  adapter: string;
  zone: { id: string; lat: number; lon: number; radiusKm: number };
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number };
  zkpAssetsAvailable: boolean;
}

export interface ProofHistoryItem {
  id: number;
  action: 'ZKP_PROVE' | 'ZKP_VERIFY';
  timestamp: string;
  adapter?: string;
  valid?: boolean;
  isInside: boolean;
  zoneId: string;
}

export interface LocationProof {
  proof: string;
  payload: {
    adapter: string;
    publicSignals: {
      zoneId: string;
      isInside: boolean;
      bounds?: LocationConfig['bounds'];
      signals?: string[];
    };
  };
}

export function scaleCoords(lat: number, lon: number) {
  return { lat: Math.round(lat * SCALE), lon: Math.round(lon * SCALE) };
}

export function isInsideBounds(
  lat: number,
  lon: number,
  bounds: LocationConfig['bounds'],
): boolean {
  const s = scaleCoords(lat, lon);
  return (
    s.lat >= bounds.minLat &&
    s.lat <= bounds.maxLat &&
    s.lon >= bounds.minLon &&
    s.lon <= bounds.maxLon
  );
}

export function isSecureForGps(): boolean {
  return window.isSecureContext || location.hostname === 'localhost';
}

declare global {
  interface Window {
    snarkjs?: {
      groth16: {
        fullProve: (
          input: Record<string, number>,
          wasm: string,
          zkey: string,
        ) => Promise<{ proof: unknown; publicSignals: string[] }>;
      };
    };
  }
}

export async function generateProofClient(
  lat: number,
  lon: number,
  config: LocationConfig,
): Promise<LocationProof> {
  if (!window.snarkjs) throw new Error('snarkjs no cargado');

  const scaled = scaleCoords(lat, lon);
  const input = { userLat: scaled.lat, userLon: scaled.lon, ...config.bounds };
  const { proof, publicSignals } = await window.snarkjs.groth16.fullProve(
    input,
    '/zkp/geofence.wasm',
    '/zkp/geofence_final.zkey',
  );

  return {
    proof: JSON.stringify(proof),
    payload: {
      adapter: 'snarkjs',
      publicSignals: {
        zoneId: config.zone.id,
        isInside: publicSignals[4] === '1',
        bounds: config.bounds,
        signals: publicSignals,
      },
    },
  };
}
