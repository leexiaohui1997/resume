import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';
import { FieldType } from '../enums/field-type.enum';

export class BatchCreateFieldItemDto {
  @ApiProperty({ description: '字段名称', example: '姓名' })
  @IsString()
  @Length(1, 100, { message: '字段名称长度必须在1到100个字符之间' })
  name: string;

  @ApiProperty({ description: '字段类型', enum: FieldType, example: FieldType.TEXT })
  @IsEnum(FieldType, { message: '字段类型无效' })
  type: FieldType;

  @ApiProperty({ description: '字段值', required: false })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiProperty({ description: '所属字段组ID', required: false })
  @IsOptional()
  @IsNumber()
  groupId?: number;

  @ApiProperty({
    description: '父级字段ID，支持特殊格式如#0表示第一个创建的字段',
    required: false,
  })
  @IsOptional()
  belongId?: number | string;

  @ApiProperty({ description: '在数组中的位置', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pos?: number;
}
