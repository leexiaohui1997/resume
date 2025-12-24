import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';
import { FieldType } from '../enums/field-type.enum';

export class UpdateFieldDto {
  @ApiProperty({ description: '字段名称', required: false, example: '姓名' })
  @IsOptional()
  @IsString()
  @Length(1, 100, { message: '字段名称长度必须在1到100个字符之间' })
  name?: string;

  @ApiProperty({
    description: '字段类型',
    enum: FieldType,
    required: false,
    example: FieldType.TEXT,
  })
  @IsOptional()
  @IsEnum(FieldType, { message: '字段类型无效' })
  type?: FieldType;

  @ApiProperty({ description: '字段值', required: false })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiProperty({ description: '所属字段组ID', required: false })
  @IsOptional()
  @IsNumber()
  groupId?: number;

  @ApiProperty({ description: '展示顺序', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  order?: number;

  @ApiProperty({ description: '父级字段ID', required: false })
  @IsOptional()
  @IsNumber()
  belongId?: number;

  @ApiProperty({ description: '在数组中的位置', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pos?: number;
}
