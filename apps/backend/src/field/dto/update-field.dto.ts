import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateFieldDto {
  @ApiProperty({ description: '字段值', required: false })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiProperty({ description: '在数组中的位置', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pos?: number;
}
