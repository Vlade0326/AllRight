import { join } from 'path';
import { existsSync } from 'fs';

export function getZkpArtifactsEnv(): 'dev' | 'prod' {
  const env = process.env.ZKP_ARTIFACTS_ENV ?? 'dev';
  return env === 'prod' ? 'prod' : 'dev';
}

export function getZkpArtifactsDir(): string {
  return join(process.cwd(), 'circuits', 'artifacts', getZkpArtifactsEnv());
}

export function getZkpArtifactPaths() {
  const base = getZkpArtifactsDir();
  return {
    base,
    wasm: join(base, 'geofence.wasm'),
    zkey: join(base, 'geofence_final.zkey'),
    vKey: join(base, 'verification_key.json'),
    r1cs: join(base, 'geofence.r1cs'),
  };
}

export function zkpArtifactsAvailable(): boolean {
  const { wasm, zkey, vKey } = getZkpArtifactPaths();
  return existsSync(wasm) && existsSync(zkey) && existsSync(vKey);
}
