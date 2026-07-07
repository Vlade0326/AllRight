export interface LocationProofPayload {
  adapter?: 'commitment' | 'snarkjs';
  commitment?: string;
  nonce?: string;
  publicSignals: {
    zoneId: string;
    isInside: boolean;
    bounds?: {
      minLat: number;
      maxLat: number;
      minLon: number;
      maxLon: number;
    };
    signals?: string[];
  };
}

export class LocationProof {
  constructor(
    readonly proof: string | Record<string, unknown>,
    readonly payload: LocationProofPayload,
    readonly generatedAt: Date = new Date(),
  ) {}
}
