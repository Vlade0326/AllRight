import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'AllRight2026!Secure' })
  @IsString()
  currentPassword!: string;

  @ApiProperty({ example: 'NewSecurePass2026!' })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
