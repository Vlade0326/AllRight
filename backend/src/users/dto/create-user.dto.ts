import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'El nombre completo del usuario' })
  @IsString()
  readonly name: string;

  @ApiProperty({ description: 'Correo electrónico único' })
  @IsEmail()
  readonly email: string;

  @ApiProperty({ description: 'Contraseña con al menos 8 caracteres' })
  @IsString()
  @MinLength(8)
  readonly password: string;
}