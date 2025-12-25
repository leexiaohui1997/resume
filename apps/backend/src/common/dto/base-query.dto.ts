import {
  IsOptional,
  IsNumber,
  Min,
  IsString,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// 定义查询操作符
export enum QueryOperator {
  EQUAL = 'eq',
  NOT_EQUAL = 'ne',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL = 'lte',
  IN = 'in', // 对应OR查询
  NOT_IN = 'nin',
  BETWEEN = 'between', // 对应范围查询
  LIKE = 'like',
  ILIKE = 'ilike',
}

// 条件项DTO
export class ConditionItemDto {
  @IsString()
  key: string;

  @IsEnum(QueryOperator)
  operate: QueryOperator;

  @IsOptional()
  value: any;
}

// 排序项DTO
export class SortItemDto {
  @IsString()
  key: string;

  @IsEnum(['asc', 'desc'])
  order: 'asc' | 'desc';
}

// 基础查询DTO
export class BaseQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SortItemDto)
  sort?: SortItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConditionItemDto)
  condition?: ConditionItemDto[];
}
