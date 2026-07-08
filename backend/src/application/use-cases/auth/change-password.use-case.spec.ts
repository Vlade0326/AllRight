import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ChangePasswordUseCase } from './change-password.use-case';
import { IUserRepository } from '../../../domain/ports/user.repository.port';

describe('ChangePasswordUseCase', () => {
  const hashedOld = bcrypt.hashSync('OldPass123!', 4);

  const users: jest.Mocked<IUserRepository> = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    updatePassword: jest.fn(),
  };

  const useCase = new ChangePasswordUseCase(users);

  beforeEach(() => {
    jest.clearAllMocks();
    users.findById.mockResolvedValue({
      id: 'user-1',
      email: 'test@allright.app',
      password: hashedOld,
      role: 'user',
    });
  });

  it('rechaza si la contraseña actual es incorrecta', async () => {
    await expect(
      useCase.execute('user-1', 'wrong', 'NewPass123!'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza si la nueva contraseña es igual a la actual', async () => {
    await expect(
      useCase.execute('user-1', 'OldPass123!', 'OldPass123!'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('actualiza la contraseña cuando los datos son válidos', async () => {
    const result = await useCase.execute('user-1', 'OldPass123!', 'NewPass123!');
    expect(result.message).toContain('actualizada');
    expect(users.updatePassword).toHaveBeenCalledWith(
      'user-1',
      expect.not.stringMatching(hashedOld),
    );
  });
});
