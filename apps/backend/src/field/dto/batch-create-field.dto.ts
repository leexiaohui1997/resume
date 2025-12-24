import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateFieldDto } from './create-field.dto';

export class BatchCreateFieldDto {
  @ApiProperty({ description: '字段列表', type: [CreateFieldDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFieldDto)
  fields: CreateFieldDto[];
}
