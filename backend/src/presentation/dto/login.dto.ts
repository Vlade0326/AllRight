import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'usuario@allright.test' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'TestPass123!' })
  @IsString()
  @MinLength(1)
  password!: string;
}
