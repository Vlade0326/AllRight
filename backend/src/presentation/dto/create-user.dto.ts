import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'usuario@allright.test' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'TestPass123!' })
  @IsString()
  @MinLength(8)
  password!: string;
}
