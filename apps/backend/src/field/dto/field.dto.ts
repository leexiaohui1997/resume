import { ApiProperty } from '@nestjs/swagger';
import { FieldType } from '../enums/field-type.enum';

export class FieldDto {
  @ApiProperty({ description: '字段ID', example: 1 })
  id: number;

  @ApiProperty({ description: '字段名称', example: '姓名' })
  name: string;

  @ApiProperty({ description: '字段类型', enum: FieldType, example: FieldType.TEXT })
  type: FieldType;

  @ApiProperty({ description: '字段值', required: false })
  value?: string;

  @ApiProperty({ description: '所属字段组ID', required: false })
  groupId?: number;

  @ApiProperty({ description: '展示顺序', required: false })
  order?: number;

  @ApiProperty({ description: '父级字段ID', required: false })
  belongId?: number;

  @ApiProperty({ description: '在数组中的位置', required: false })
  pos?: number;

  @ApiProperty({ description: '创建时间', example: '2023-01-01T00:00:00.000Z' })
  createTime: Date;

  @ApiProperty({ description: '更新时间', example: '2023-01-01T00:00:00.000Z' })
  updateTime: Date;
}
