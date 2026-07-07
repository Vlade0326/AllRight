import { plainToInstance } from 'class-transformer';
import { IsEnum, IsOptional, IsString, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

enum ZkpAdapter {
  Commitment = 'commitment',
  Snarkjs = 'snarkjs',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV?: Environment;

  @IsString()
  @IsOptional()
  JWT_SECRET?: string;

  @IsString()
  @IsOptional()
  ZKP_PEPPER?: string;

  @IsEnum(ZkpAdapter)
  @IsOptional()
  ZKP_ADAPTER?: ZkpAdapter;

  @IsString()
  @IsOptional()
  DB_SYNCHRONIZE?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: true });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  const isProduction = config.NODE_ENV === 'production';
  if (!isProduction) {
    return validated;
  }

  const jwtSecret = String(config.JWT_SECRET ?? '');
  const zkpPepper = String(config.ZKP_PEPPER ?? '');

  if (jwtSecret.length < 32 || jwtSecret === 'change-me-in-production') {
    throw new Error('JWT_SECRET must be a unique secret of at least 32 characters');
  }

  if (
    zkpPepper.length < 32 ||
    zkpPepper.includes('change-me') ||
    zkpPepper === 'allright-zkp-pepper'
  ) {
    throw new Error('ZKP_PEPPER must be a unique secret of at least 32 characters');
  }

  if (config.DB_SYNCHRONIZE === 'true') {
    throw new Error('DB_SYNCHRONIZE must be false in production');
  }

  return validated;
}
