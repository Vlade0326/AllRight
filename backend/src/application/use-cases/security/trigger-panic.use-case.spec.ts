import { ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import { TriggerPanicUseCase } from './trigger-panic.use-case';
import { ICachePort } from '../../../domain/ports/cache.port';
import { IAuditRepository } from '../../../domain/ports/audit.repository.port';
import { IEmailPort } from '../../../domain/ports/email.port';
import { IUserRepository } from '../../../domain/ports/user.repository.port';
import { PushNotificationService } from '../../../infrastructure/notifications/push-notification.service';
import { RateLimitService } from '../../../infrastructure/security/rate-limit.service';
import { ConfigService } from '@nestjs/config';

describe('TriggerPanicUseCase', () => {
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
  const email: jest.Mocked<IEmailPort> = { send: jest.fn() };
  const users: jest.Mocked<IUserRepository> = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    updatePassword: jest.fn(),
  };
  const push = { notifyUser: jest.fn() } as unknown as PushNotificationService;
  const rateLimit = {
    check: jest.fn().mockResolvedValue({
      allowed: true,
      remaining: 2,
      limit: 3,
      retryAfterSec: 3600,
    }),
  } as unknown as RateLimitService;
  const config = {
    get: jest.fn((key: string, def?: unknown) => {
      if (key === 'PANIC_NOTIFY_EMAIL') return 'ops@allright.app';
      return def;
    }),
  } as unknown as ConfigService;

  const useCase = new TriggerPanicUseCase(
    cache,
    audit,
    email,
    users,
    push,
    rateLimit,
    config,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    (rateLimit.check as jest.Mock).mockResolvedValue({
      allowed: true,
      remaining: 2,
      limit: 3,
      retryAfterSec: 3600,
    });
    cache.get.mockResolvedValue(null);
    users.findById.mockResolvedValue({
      id: 'u1',
      email: 'user@test.com',
      password: 'hash',
      role: 'user',
    });
  });

  it('crea alerta ACTIVE y audita PANIC_TRIGGERED', async () => {
    const result = await useCase.execute({
      userId: 'u1',
      lat: 3.45,
      lon: -76.53,
      message: 'Ayuda',
    });

    expect(result.status).toBe('ACTIVE');
    expect(result.alertId).toBeDefined();
    expect(cache.set).toHaveBeenCalled();
    expect(audit.save).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PANIC_TRIGGERED' }),
    );
    expect(push.notifyUser).toHaveBeenCalled();
    expect(email.send).toHaveBeenCalled();
  });

  it('rechaza si ya hay alerta activa', async () => {
    cache.get.mockResolvedValue('existing-alert-id');
    await expect(
      useCase.execute({ userId: 'u1', lat: 3.45, lon: -76.53 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rechaza por rate limit', async () => {
    (rateLimit.check as jest.Mock).mockResolvedValue({
      allowed: false,
      remaining: 0,
      limit: 3,
      retryAfterSec: 3600,
    });
    await expect(useCase.execute({ userId: 'u1' })).rejects.toBeInstanceOf(
      HttpException,
    );
  });
});
