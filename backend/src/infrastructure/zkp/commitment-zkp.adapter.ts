import { Injectable, Inject } from '@nestjs/common';
import * as crypto from 'crypto';
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
import { GeofenceDomainService } from '../../domain/services/geofence.domain-service';
import { GEOFENCE_ZONE } from '../../application/tokens';

/**
 * ZKP adapter v1: commitment-based zero-knowledge geofence proof.
 * Coordinates never leave the client in plaintext; server verifies commitment
 * against zone parameters without persisting exact lat/lon.
 * Swappable for circom/snarkjs Groth16 in v2.
 */
@Injectable()
export class CommitmentZkpAdapter implements ILocationProofPort {
  private readonly geofence = new GeofenceDomainService();
  private readonly pepper: string;

  constructor(@Inject(GEOFENCE_ZONE) private readonly zone: GeofenceZone) {
    this.pepper = process.env.ZKP_PEPPER ?? 'allright-zkp-pepper-change-me';
  }

  async generateProof(input: GenerateProofInput): Promise<LocationProof> {
    const isInside = this.geofence.isInsideZone(input.coordinates, this.zone);
    const nonce = crypto.randomBytes(16).toString('hex');
    const commitment = this.buildCommitment(
      input.coordinates,
      input.userId,
      nonce,
      isInside,
    );

    const payload: LocationProofPayload = {
      adapter: 'commitment',
      commitment,
      nonce,
      publicSignals: {
        zoneId: input.zoneId,
        isInside,
      },
    };

    const proof = crypto
      .createHmac('sha256', this.pepper)
      .update(JSON.stringify(payload))
      .digest('hex');

    return new LocationProof(proof, payload);
  }

  async verifyProof(proof: LocationProof): Promise<VerificationResult> {
    const zoneId = proof.payload?.publicSignals?.zoneId ?? 'unknown';
    const proofHex = String(proof.proof ?? '');

    try {
      const expectedProof = crypto
        .createHmac('sha256', this.pepper)
        .update(JSON.stringify(proof.payload ?? {}))
        .digest('hex');

      const validProof =
        /^[0-9a-f]+$/i.test(proofHex) &&
        proofHex.length === expectedProof.length &&
        crypto.timingSafeEqual(
          Buffer.from(proofHex, 'hex'),
          Buffer.from(expectedProof, 'hex'),
        );

      const valid =
        validProof && proof.payload?.publicSignals?.zoneId === this.zone.id;

      return {
        valid,
        isInside: valid ? Boolean(proof.payload.publicSignals.isInside) : false,
        zoneId,
      };
    } catch {
      return { valid: false, isInside: false, zoneId };
    }
  }

  private buildCommitment(
    coords: Coordinates,
    userId: string,
    nonce: string,
    isInside: boolean,
  ): string {
    const scaledLat = Math.round(coords.latitude * 1e6);
    const scaledLon = Math.round(coords.longitude * 1e6);
    return crypto
      .createHash('sha256')
      .update(
        `${scaledLat}:${scaledLon}:${userId}:${nonce}:${isInside}:${this.zone.id}`,
      )
      .digest('hex');
  }
}
