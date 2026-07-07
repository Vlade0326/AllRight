import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RegisterUserUseCase } from '../../application/use-cases/auth/register-user.use-case';
import { CreateUserDto } from '../dto/create-user.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly registerUser: RegisterUserUseCase) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.registerUser.execute(dto);
  }
}
