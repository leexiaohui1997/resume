import { Injectable } from '@nestjs/common';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { BaseQueryDto, ConditionItemDto, QueryOperator, SortItemDto } from '../dto/base-query.dto';

interface QueryOptions extends BaseQueryDto {
  condition?: ConditionItemDto[];
  sort?: SortItemDto[];
}

@Injectable()
export class QueryService {
  /**
   * 应用分页、排序和筛选到查询构建器
   */
  async applyQueryOptions<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    queryDto: QueryOptions,
    allowedSortFields: string[] = []
  ): Promise<SelectQueryBuilder<T>> {
    // 应用筛选
    this.applyFilters(queryBuilder, queryDto);

    // 应用排序
    this.applySorting(queryBuilder, queryDto, allowedSortFields);

    // 应用分页
    this.applyPagination(queryBuilder, queryDto);

    return queryBuilder;
  }

  /**
   * 获取分页数据
   */
  async getPaginatedData<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>
  ): Promise<{ data: T[]; total: number }> {
    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  /**
   * 应用筛选条件
   */
  private applyFilters<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    queryDto: QueryOptions
  ): void {
    if (!queryDto.condition || !Array.isArray(queryDto.condition)) {
      return;
    }

    // 遍历所有条件项
    queryDto.condition.forEach((conditionItem, index: number) => {
      const { key, operate, value } = conditionItem;

      // 根据操作符类型应用不同的查询
      switch (operate) {
        case QueryOperator.EQUAL:
          queryBuilder.andWhere(`${queryBuilder.alias}.${key} = :${key}_${index}`, {
            [`${key}_${index}`]: value,
          });
          break;

        case QueryOperator.NOT_EQUAL:
          queryBuilder.andWhere(`${queryBuilder.alias}.${key} != :${key}_${index}`, {
            [`${key}_${index}`]: value,
          });
          break;

        case QueryOperator.GREATER_THAN:
          queryBuilder.andWhere(`${queryBuilder.alias}.${key} > :${key}_${index}`, {
            [`${key}_${index}`]: value,
          });
          break;

        case QueryOperator.GREATER_THAN_OR_EQUAL:
          queryBuilder.andWhere(`${queryBuilder.alias}.${key} >= :${key}_${index}`, {
            [`${key}_${index}`]: value,
          });
          break;

        case QueryOperator.LESS_THAN:
          queryBuilder.andWhere(`${queryBuilder.alias}.${key} < :${key}_${index}`, {
            [`${key}_${index}`]: value,
          });
          break;

        case QueryOperator.LESS_THAN_OR_EQUAL:
          queryBuilder.andWhere(`${queryBuilder.alias}.${key} <= :${key}_${index}`, {
            [`${key}_${index}`]: value,
          });
          break;

        case QueryOperator.IN: // OR查询
          if (Array.isArray(value) && value.length > 0) {
            const orConditions = value
              .map((v, i) => `${queryBuilder.alias}.${key} = :${key}_${index}_${i}`)
              .join(' OR ');

            const orParams: Record<string, any> = {};
            value.forEach((v, i) => {
              orParams[`${key}_${index}_${i}`] = v;
            });

            queryBuilder.andWhere(`(${orConditions})`, orParams);
          }
          break;

        case QueryOperator.NOT_IN:
          if (Array.isArray(value) && value.length > 0) {
            queryBuilder.andWhere(`${queryBuilder.alias}.${key} NOT IN (:...${key}_${index})`, {
              [`${key}_${index}`]: value,
            });
          }
          break;

        case QueryOperator.BETWEEN: // 范围查询
          if (Array.isArray(value) && value.length === 2) {
            queryBuilder.andWhere(
              `${queryBuilder.alias}.${key} BETWEEN :${key}_${index}_start AND :${key}_${index}_end`,
              {
                [`${key}_${index}_start`]: value[0],
                [`${key}_${index}_end`]: value[1],
              }
            );
          }
          break;

        case QueryOperator.LIKE:
          queryBuilder.andWhere(`${queryBuilder.alias}.${key} LIKE :${key}_${index}`, {
            [`${key}_${index}`]: `%${value}%`,
          });
          break;

        case QueryOperator.ILIKE:
          queryBuilder.andWhere(`${queryBuilder.alias}.${key} ILIKE :${key}_${index}`, {
            [`${key}_${index}`]: `%${value}%`,
          });
          break;
      }
    });
  }

  /**
   * 应用排序
   */
  private applySorting<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    queryDto: QueryOptions,
    allowedSortFields: string[] = []
  ): void {
    if (queryDto.sort && Array.isArray(queryDto.sort)) {
      queryDto.sort.forEach(sortItem => {
        const { key, order } = sortItem;
        if (allowedSortFields.includes(key)) {
          const sortOrder = order.toUpperCase() as Uppercase<typeof order>;
          queryBuilder.addOrderBy(`${queryBuilder.alias}.${key}`, sortOrder);
        }
      });
    }
  }

  /**
   * 应用分页
   */
  private applyPagination<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    queryDto: QueryOptions
  ): void {
    const page = Number(queryDto.page) || 1;
    const limit = Number(queryDto.limit) || 10;
    const offset = (page - 1) * limit;

    queryBuilder.skip(offset).take(limit);
  }
}
