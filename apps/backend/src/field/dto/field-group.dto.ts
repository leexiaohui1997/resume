import { ApiProperty } from '@nestjs/swagger';

export class FieldGroupDto {
  @ApiProperty({ description: '字段组ID', example: 1 })
  id: number;

  @ApiProperty({ description: '字段组名称', example: '基本信息' })
  name: string;

  @ApiProperty({ description: '创建时间', example: '2023-01-01T00:00:00.000Z' })
  createTime: Date;

  @ApiProperty({ description: '更新时间', example: '2023-01-01T00:00:00.000Z' })
  updateTime: Date;
}
