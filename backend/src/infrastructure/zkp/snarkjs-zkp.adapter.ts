import { Injectable, Inject } from '@nestjs/common';
import { readFileSync } from 'fs';
import * as snarkjs from 'snarkjs';
import { Coordinates } from '../../domain/value-objects/coordinates.vo';
import { GeofenceZone } from '../../domain/entities/geofence-zone.entity';
import {
  LocationProof,
  LocationProofPayload,
} from '../../domain/entities/location-proof.entity';
import {
  GenerateProofInput,
  ILocationProofPort,
  VerificationResult,
} from '../../domain/ports/location-proof.port';
import { GEOFENCE_ZONE } from '../../application/tokens';
import {
  getZkpArtifactsEnv,
  getZkpArtifactPaths,
  zkpArtifactsAvailable,
} from './zkp-artifacts.util';

@Injectable()
export class SnarkjsZkpAdapter implements ILocationProofPort {
  private readonly wasmPath: string;
  private readonly zkeyPath: string;
  private readonly vKey: Record<string, unknown>;
  private readonly artifactsEnv: string;

  constructor(@Inject(GEOFENCE_ZONE) private readonly zone: GeofenceZone) {
    const paths = getZkpArtifactPaths();
    this.artifactsEnv = getZkpArtifactsEnv();
    this.wasmPath = paths.wasm;
    this.zkeyPath = paths.zkey;

    if (!zkpArtifactsAvailable()) {
      throw new Error(
        `Snarkjs ZKP artifacts missing for env="${this.artifactsEnv}". ` +
          `Run: npm run zkp:build:${this.artifactsEnv}`,
      );
    }

    this.vKey = JSON.parse(readFileSync(paths.vKey, 'utf8'));
  }

  async generateProof(input: GenerateProofInput): Promise<LocationProof> {
    const bounds = this.getBounds();
    const scaled = this.scaleCoordinates(input.coordinates);

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      { userLat: scaled.lat, userLon: scaled.lon, ...bounds },
      this.wasmPath,
      this.zkeyPath,
    );

    const payload: LocationProofPayload = {
      adapter: 'snarkjs',
      publicSignals: {
        zoneId: input.zoneId,
        isInside: publicSignals[4] === '1',
        bounds,
        signals: publicSignals,
      },
    };

    return new LocationProof(JSON.stringify(proof), payload);
  }

  async verifyProof(proof: LocationProof): Promise<VerificationResult> {
    if (proof.payload.adapter !== 'snarkjs') {
      return {
        valid: false,
        isInside: false,
        zoneId: proof.payload.publicSignals.zoneId,
      };
    }

    const groth16Proof =
      typeof proof.proof === 'string' ? JSON.parse(proof.proof) : proof.proof;

    const signals =
      proof.payload.publicSignals.signals ??
      this.buildExpectedPublicSignals(proof.payload.publicSignals.bounds!);

    const valid = await snarkjs.groth16.verify(this.vKey, signals, groth16Proof);

    return {
      valid,
      isInside: valid && signals[4] === '1',
      zoneId: proof.payload.publicSignals.zoneId,
    };
  }

  private scaleCoordinates(coords: Coordinates) {
    const scale = 1_000_000;
    return {
      lat: Math.round(coords.latitude * scale),
      lon: Math.round(coords.longitude * scale),
    };
  }

  private getBounds() {
    const scale = 1_000_000;
    const centerLat = Math.round(this.zone.center.latitude * scale);
    const centerLon = Math.round(this.zone.center.longitude * scale);
    const delta = Math.round((this.zone.radiusKm / 111.32) * scale);

    return {
      minLat: centerLat - delta,
      maxLat: centerLat + delta,
      minLon: centerLon - delta,
      maxLon: centerLon + delta,
    };
  }

  private buildExpectedPublicSignals(bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  }) {
    return [
      String(bounds.minLat),
      String(bounds.maxLat),
      String(bounds.minLon),
      String(bounds.maxLon),
      '1',
    ];
  }
}
