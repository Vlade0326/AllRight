import { BadRequestException } from '@nestjs/common';
import { ReportProximityUseCase } from './report-proximity.use-case';
import { ICachePort } from '../../../domain/ports/cache.port';
import { IAuditRepository } from '../../../domain/ports/audit.repository.port';

describe('ReportProximityUseCase', () => {
  const cache: jest.Mocked<ICachePort> = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    sadd: jest.fn(),
    srem: jest.fn(),
    scard: jest.fn(),
  };
  const audit: jest.Mocked<IAuditRepository> = {
    save: jest.fn(),
    findAll: jest.fn(),
    findByUserId: jest.fn(),
  };

  const useCase = new ReportProximityUseCase(cache, audit);

  beforeEach(() => jest.clearAllMocks());

  it('marca inside cuando RSSI supera umbral', async () => {
    const result = await useCase.execute({
      userId: 'u1',
      uuid: 'f7826da6-4fa2-4e98-8024-bc5b71e0893e',
      major: 1,
      minor: 1,
      rssi: -55,
    });
    expect(result.status).toBe('inside');
    expect(result.beaconId).toBe('cali-office-lobby');
    expect(audit.save).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'BLE_PROXIMITY' }),
    );
  });

  it('marca outside cuando RSSI es débil', async () => {
    const result = await useCase.execute({
      userId: 'u1',
      uuid: 'f7826da6-4fa2-4e98-8024-bc5b71e0893e',
      major: 1,
      minor: 1,
      rssi: -90,
    });
    expect(result.status).toBe('outside');
    expect(cache.del).toHaveBeenCalled();
  });

  it('rechaza beacon desconocido', async () => {
    await expect(
      useCase.execute({
        userId: 'u1',
        uuid: '00000000-0000-0000-0000-000000000000',
        major: 9,
        minor: 9,
        rssi: -40,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
