import { UnauthorizedException } from '@nestjs/common';
import { ForgotPasswordUseCase } from './forgot-password.use-case';
import { ResetPasswordUseCase } from './reset-password.use-case';
import { IUserRepository } from '../../../domain/ports/user.repository.port';
import { ICachePort } from '../../../domain/ports/cache.port';
import { ConfigService } from '@nestjs/config';

describe('ForgotPasswordUseCase', () => {
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
  const users: jest.Mocked<IUserRepository> = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    updatePassword: jest.fn(),
  };
  const config = { get: jest.fn((key: string) => (key === 'NODE_ENV' ? 'development' : 900)) } as unknown as ConfigService;

  const useCase = new ForgotPasswordUseCase(users, cache, config);

  it('no revela si el email existe', async () => {
    users.findByEmail.mockResolvedValue(null);
    const result = await useCase.execute('unknown@test.com');
    expect(result.message).toContain('Si el correo');
    expect(result.resetToken).toBeUndefined();
  });

  it('genera token en dev cuando el usuario existe', async () => {
    users.findByEmail.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      password: 'hash',
      role: 'user',
    });
    const result = await useCase.execute('a@b.com');
    expect(cache.set).toHaveBeenCalled();
    expect(result.resetToken).toBeDefined();
  });
});

describe('ResetPasswordUseCase', () => {
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
  const users: jest.Mocked<IUserRepository> = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    updatePassword: jest.fn(),
  };

  const useCase = new ResetPasswordUseCase(users, cache);

  it('rechaza token inválido', async () => {
    cache.get.mockResolvedValue(null);
    await expect(useCase.execute('bad-token', 'NewPass123!')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
