import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, ValidateNested } from 'class-validator';
import { UpdateFieldDto } from './update-field.dto';

export class BatchUpdateItemDto {
  @ApiProperty({ description: '字段ID', example: 1 })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '更新内容', type: UpdateFieldDto })
  @ValidateNested()
  @Type(() => UpdateFieldDto)
  data: UpdateFieldDto;
}

export class BatchUpdateFieldDto {
  @ApiProperty({ description: '更新列表', type: [BatchUpdateItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchUpdateItemDto)
  updates: BatchUpdateItemDto[];
}
