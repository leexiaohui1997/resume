import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { BatchCreateFieldItemDto } from './batch-create-field-item.dto';

export class BatchCreateFieldDto {
  @ApiProperty({ description: '字段列表', type: [BatchCreateFieldItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchCreateFieldItemDto)
  fields: BatchCreateFieldItemDto[];
}
