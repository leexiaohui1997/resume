import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, Length } from 'class-validator';

export class UpdateFieldGroupDto {
  @ApiProperty({ description: '字段组名称', required: false, example: '详细信息' })
  @IsOptional()
  @IsString()
  @Length(1, 100, { message: '字段组名称长度必须在1到100个字符之间' })
  name?: string;
}
