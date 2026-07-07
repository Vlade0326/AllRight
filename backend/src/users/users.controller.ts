import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service'; // Asegúrate de importar el servicio
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  // El constructor inyecta el servicio para que puedas usarlo
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}