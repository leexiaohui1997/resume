import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateFieldGroupDto {
  @ApiProperty({ description: '字段组名称', example: '基本信息' })
  @IsString()
  @Length(1, 100, { message: '字段组名称长度必须在1到100个字符之间' })
  name: string;
}
