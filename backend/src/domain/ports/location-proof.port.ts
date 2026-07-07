import { Coordinates } from '../value-objects/coordinates.vo';
import { LocationProof } from '../entities/location-proof.entity';

export interface GenerateProofInput {
  userId: string;
  coordinates: Coordinates;
  zoneId: string;
}

export interface VerificationResult {
  valid: boolean;
  isInside: boolean;
  zoneId: string;
}

export interface ILocationProofPort {
  generateProof(input: GenerateProofInput): Promise<LocationProof>;
  verifyProof(proof: LocationProof): Promise<VerificationResult>;
}
