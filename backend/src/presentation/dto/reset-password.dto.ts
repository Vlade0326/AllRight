import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token recibido por correo o en modo dev' })
  @IsString()
  token!: string;

  @ApiProperty({ example: 'NewSecurePass2026!' })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
