import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateAuditDto {
  @ApiProperty({ description: 'ID del usuario que realizó la acción' })
  @IsString()
  @IsNotEmpty()
  readonly userId: string;

  @ApiProperty({ description: 'La acción realizada (ej: USER_CREATED)' })
  @IsString()
  @IsNotEmpty()
  readonly action: string;

  @ApiProperty({ description: 'Detalles adicionales en formato JSON', required: false })
  @IsOptional()
  @IsObject()
  readonly details?: any;
}