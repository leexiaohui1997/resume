import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, IsNull, Not, Repository } from 'typeorm';
import { User } from '../user/entity/user.entity';
import { BatchCreateFieldDto } from './dto/batch-create-field.dto';
import { BatchUpdateFieldDto, BatchUpdateItemDto } from './dto/batch-update-field.dto';
import { CreateFieldGroupDto } from './dto/create-field-group.dto';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldGroupDto } from './dto/update-field-group.dto';
import { UpdateFieldDto } from './dto/update-field.dto';
import { FieldGroup } from './entity/field-group.entity';
import { Field } from './entity/field.entity';

@Injectable()
export class FieldService {
  private readonly logger = new Logger(FieldService.name);

  constructor(
    @InjectRepository(Field)
    private readonly fieldRepository: Repository<Field>,
    @InjectRepository(FieldGroup)
    private readonly fieldGroupRepository: Repository<FieldGroup>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource
  ) {}

  /**
   * 检查字段组名称是否已存在
   * @param userId 用户ID
   * @param name 字段组名称
   * @param excludeId 排除的字段组ID（用于更新时检查）
   * @returns 是否存在
   */
  private async isFieldGroupNameExists(
    userId: number,
    name: string,
    excludeId?: number
  ): Promise<boolean> {
    const queryBuilder = this.fieldGroupRepository
      .createQueryBuilder('fieldGroup')
      .where('fieldGroup.user.id = :userId', { userId })
      .andWhere('fieldGroup.name = :name', { name });

    if (excludeId) {
      queryBuilder.andWhere('fieldGroup.id != :excludeId', { excludeId });
    }

    const count = await queryBuilder.getCount();
    return count > 0;
  }

  /**
   * 检查字段名称是否已存在
   * @param userId 用户ID
   * @param name 字段名称
   * @param groupId 字段组ID
   * @param excludeId 排除的字段ID（用于更新时检查）
   * @returns 是否存在
   */
  private async isFieldNameExists(
    userId: number,
    name: string,
    groupId?: number | null,
    excludeId?: number,
    pos?: number | null,
    belongId?: number | null
  ): Promise<boolean> {
    const queryBuilder = this.fieldRepository
      .createQueryBuilder('field')
      .where('field.user.id = :userId', { userId })
      .andWhere('field.name = :name', { name });

    if (groupId !== undefined) {
      if (groupId === null) {
        queryBuilder.andWhere('field.group_id IS NULL');
      } else {
        queryBuilder.andWhere('field.group_id = :groupId', { groupId });
      }
    }

    // 根据belongId和pos的条件进行查询
    if (belongId === null) {
      // 如果没有belongId，直接忽略pos，按没有pos的情况进行比对
      queryBuilder.andWhere('field.belong_id IS NULL');
      queryBuilder.andWhere('field.pos IS NULL');
    } else if (belongId !== undefined) {
      // 如果有belongId
      queryBuilder.andWhere('field.belong_id = :belongId', { belongId });

      // 根据pos的值进行查询
      if (pos === null) {
        queryBuilder.andWhere('field.pos IS NULL');
      } else if (pos !== undefined) {
        queryBuilder.andWhere('field.pos = :pos', { pos });
      }
    }

    if (excludeId) {
      queryBuilder.andWhere('field.id != :excludeId', { excludeId });
    }

    const count = await queryBuilder.getCount();
    return count > 0;
  }

  /**
   * 检查belongId和pos组合是否唯一
   * @param userId 用户ID
   * @param belongId 父级字段ID
   * @param pos 在数组中的位置
   * @param excludeId 排除的字段ID（用于更新时检查）
   * @returns 是否唯一
   */
  private async isBelongIdAndPosUnique(
    userId: number,
    belongId: number,
    pos: number,
    excludeId?: number
  ): Promise<boolean> {
    const queryBuilder = this.fieldRepository
      .createQueryBuilder('field')
      .where('field.user.id = :userId', { userId })
      .andWhere('field.belong_id = :belongId', { belongId })
      .andWhere('field.pos = :pos', { pos });

    // 如果有excludeId，则排除该ID
    if (excludeId) {
      queryBuilder.andWhere('field.id != :excludeId', { excludeId });
    }

    const count = await queryBuilder.getCount();
    return count === 0;
  }

  // 字段组相关方法
  async createFieldGroup(
    userId: number,
    createFieldGroupDto: CreateFieldGroupDto
  ): Promise<FieldGroup> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 检查字段组名称是否已存在
    const nameExists = await this.isFieldGroupNameExists(userId, createFieldGroupDto.name);
    if (nameExists) {
      throw new ConflictException('字段组名称已存在');
    }

    const fieldGroup = this.fieldGroupRepository.create({
      ...createFieldGroupDto,
      user,
    });

    try {
      return await this.fieldGroupRepository.save(fieldGroup);
    } catch (error) {
      this.logger.error('创建字段组失败', error);
      throw new InternalServerErrorException('创建字段组失败，请稍后重试');
    }
  }

  async findFieldGroupById(id: number, userId: number): Promise<FieldGroup> {
    const fieldGroup = await this.fieldGroupRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!fieldGroup) {
      throw new NotFoundException('字段组不存在');
    }

    if (fieldGroup.user.id !== userId) {
      throw new ForbiddenException('无权访问该字段组');
    }

    return fieldGroup;
  }

  async findFieldGroupsByUserId(userId: number): Promise<FieldGroup[]> {
    return this.fieldGroupRepository.find({
      where: { user: { id: userId } },
      order: { createTime: 'DESC' },
    });
  }

  /**
   * 创建字段组查询构建器
   */
  createFieldGroupsQueryBuilder() {
    return this.fieldGroupRepository
      .createQueryBuilder('fieldGroup')
      .leftJoinAndSelect('fieldGroup.user', 'user');
  }

  async updateFieldGroup(
    id: number,
    userId: number,
    updateFieldGroupDto: UpdateFieldGroupDto
  ): Promise<FieldGroup> {
    const fieldGroup = await this.findFieldGroupById(id, userId);

    // 如果更新了名称，检查新名称是否已存在
    if (updateFieldGroupDto.name && updateFieldGroupDto.name !== fieldGroup.name) {
      const nameExists = await this.isFieldGroupNameExists(userId, updateFieldGroupDto.name, id);
      if (nameExists) {
        throw new ConflictException('字段组名称已存在');
      }
    }

    Object.assign(fieldGroup, updateFieldGroupDto);

    try {
      return await this.fieldGroupRepository.save(fieldGroup);
    } catch (error) {
      this.logger.error('更新字段组失败', error);
      throw new InternalServerErrorException('更新字段组失败，请稍后重试');
    }
  }

  async deleteFieldGroup(id: number, userId: number): Promise<void> {
    const fieldGroup = await this.findFieldGroupById(id, userId);

    try {
      // 使用事务确保删除操作的原子性
      await this.fieldGroupRepository.manager.transaction(async transactionManager => {
        // 查找该字段组下的所有字段
        const fields = await transactionManager.find(Field, {
          where: {
            group: { id },
            user: { id: userId },
          },
        });

        // 递归删除每个字段及其子字段
        for (const field of fields) {
          await this.recursiveDeleteField(transactionManager, field.id, userId);
        }

        // 删除字段组
        await transactionManager.remove(fieldGroup);
      });
    } catch (error) {
      this.logger.error('删除字段组失败', error);
      throw new InternalServerErrorException('删除字段组失败，请稍后重试');
    }
  }

  // 字段相关方法
  async createField(userId: number, createFieldDto: CreateFieldDto): Promise<Field> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 验证字段组是否存在且属于当前用户
    let fieldGroup: FieldGroup | null = null;
    if (createFieldDto.groupId) {
      fieldGroup = await this.fieldGroupRepository.findOne({
        where: { id: createFieldDto.groupId, user: { id: userId } },
      });
      if (!fieldGroup) {
        throw new NotFoundException('字段组不存在或无权访问');
      }
    }

    // 验证父级字段是否存在且属于当前用户
    let belongField: Field | null = null;
    if (createFieldDto.belongId) {
      belongField = await this.fieldRepository.findOne({
        where: { id: createFieldDto.belongId, user: { id: userId } },
      });
      if (!belongField) {
        throw new NotFoundException('父级字段不存在或无权访问');
      }
    }

    // 检查字段名称是否唯一（同一用户同一字段组同一父级字段同一pos下唯一）
    const nameExists = await this.isFieldNameExists(
      userId,
      createFieldDto.name,
      createFieldDto.groupId || null,
      undefined, // excludeId
      createFieldDto.pos || null,
      createFieldDto.belongId || null
    );
    if (nameExists) {
      throw new ConflictException('字段名称在当前条件下已存在');
    }

    // 只有当belongId和pos都不为null或undefined时，才检查belongId和pos组合的唯一性
    let existingField: Field | null = null;
    if (createFieldDto.belongId !== undefined && createFieldDto.pos !== undefined) {
      const isUnique = await this.isBelongIdAndPosUnique(
        userId,
        createFieldDto.belongId,
        createFieldDto.pos
      );

      if (!isUnique) {
        // 查找并删除具有相同belong_id和pos的现有字段
        existingField = await this.fieldRepository.findOne({
          where: {
            user: { id: userId },
            belong: { id: createFieldDto.belongId },
            pos: createFieldDto.pos,
          },
        });

        if (existingField) {
          // 使用事务确保删除和创建操作的原子性
          await this.fieldRepository.manager.transaction(async transactionManager => {
            // 递归删除该字段及其所有子字段
            await this.recursiveDeleteField(transactionManager, existingField!.id, userId);
          });
        }
      }
    }

    const field = new Field();
    field.name = createFieldDto.name;
    field.type = createFieldDto.type;
    field.value = createFieldDto.value ?? null;
    field.pos = createFieldDto.pos ?? null;
    field.group = fieldGroup ?? null;
    field.belong = belongField ?? null;
    field.user = user;

    try {
      return await this.fieldRepository.save(field);
    } catch (error) {
      this.logger.error('创建字段失败', error);
      throw new InternalServerErrorException('创建字段失败，请稍后重试');
    }
  }

  async findFieldById(id: number, userId: number): Promise<Field> {
    const field = await this.fieldRepository.findOne({
      where: { id },
      relations: ['user', 'group', 'belong'],
    });

    if (!field) {
      throw new NotFoundException('字段不存在');
    }

    if (field.user.id !== userId) {
      throw new ForbiddenException('无权访问该字段');
    }

    return field;
  }

  async findFieldsByUserId(userId: number, groupId?: number): Promise<Field[]> {
    const whereCondition: any = { user: { id: userId } };
    if (groupId) {
      whereCondition.group = { id: groupId };
    }

    return this.fieldRepository.find({
      where: whereCondition,
      relations: ['group', 'belong'],
      order: { createTime: 'DESC' },
    });
  }

  /**
   * 调整字段位置
   * @param userId 用户ID
   * @param fieldId 要调整的字段ID
   * @param oldPos 旧位置
   * @param newPos 新位置
   * @param groupId 字段组ID
   * @param belongId 父级字段ID
   */
  private async adjustFieldPositions(
    userId: number,
    fieldId: number,
    oldPos: number,
    newPos: number,
    groupId?: number,
    belongId?: number
  ): Promise<void> {
    // 如果位置没有变化，直接返回
    if (oldPos === newPos) return;

    // 如果没有belongId，则不进行位置调整
    if (!belongId) return;

    // 构建查询条件
    const whereCondition: any = {
      user: { id: userId },
      id: Not(fieldId), // 排除当前字段
    };

    if (groupId) {
      whereCondition.group = { id: groupId };
    } else {
      whereCondition.group = IsNull();
    }

    if (belongId) {
      whereCondition.belong = { id: belongId };
    } else {
      whereCondition.belong = IsNull();
    }

    // 确定调整范围和方向
    let start: number, end: number, adjustment: number;

    if (newPos > oldPos) {
      // 向后移动
      start = oldPos;
      end = newPos;
      adjustment = -1; // 中间的字段向前移动一位
    } else {
      // 向前移动
      start = newPos;
      end = oldPos;
      adjustment = 1; // 中间的字段向后移动一位
    }

    // 获取需要调整的字段
    const fieldsToAdjust = await this.fieldRepository.find({
      where: {
        ...whereCondition,
        pos: Between(start, end),
      },
    });

    // 使用事务更新字段的pos值
    await this.fieldRepository.manager.transaction(async transactionManager => {
      // 更新受影响字段的pos值
      for (const field of fieldsToAdjust) {
        // 确保pos不为null
        if (field.pos !== null) {
          field.pos += adjustment;
          await transactionManager.save(field);
        }
      }

      // 更新目标字段的pos值
      const targetField = await this.fieldRepository.findOne({
        where: { id: fieldId },
      });
      if (targetField) {
        targetField.pos = newPos;
        await transactionManager.save(targetField);
      }
    });
  }

  async updateField(id: number, userId: number, updateFieldDto: UpdateFieldDto): Promise<Field> {
    const field = await this.findFieldById(id, userId);

    // 保存原始pos值
    const oldPos = field.pos || 0;

    // 只更新允许修改的字段：value、pos
    if (updateFieldDto.value !== undefined) {
      // 修复类型不匹配：UpdateFieldDto.value是string | undefined，而Field.value是string | null
      field.value = updateFieldDto.value ?? null;
    }

    // 如果pos有变化，调整相关字段的位置
    if (updateFieldDto.pos !== undefined && updateFieldDto.pos !== oldPos) {
      await this.adjustFieldPositions(
        userId,
        id,
        oldPos,
        updateFieldDto.pos,
        field.group?.id,
        field.belong?.id
      );

      // 更新当前字段的pos
      field.pos = updateFieldDto.pos;
    }

    try {
      return await this.fieldRepository.save(field);
    } catch (error) {
      this.logger.error('更新字段失败', error);
      throw new InternalServerErrorException('更新字段失败，请稍后重试');
    }
  }

  /**
   * 递归删除字段及其所有子字段
   * @param transactionManager 事务管理器
   * @param id 字段ID
   * @param userId 用户ID
   */
  private async recursiveDeleteField(
    transactionManager: any,
    id: number,
    userId: number
  ): Promise<void> {
    // 查找所有belong_id为该字段ID的字段
    const childFields = await transactionManager.find(Field, {
      where: {
        belong: { id },
        user: { id: userId },
      },
    });

    // 递归删除所有子字段
    for (const childField of childFields) {
      await this.recursiveDeleteField(transactionManager, childField.id, userId);
    }

    // 删除当前字段
    const fieldToDelete = await transactionManager.findOne(Field, {
      where: { id },
    });

    if (fieldToDelete) {
      await transactionManager.remove(fieldToDelete);
    }
  }

  async deleteField(id: number, userId: number): Promise<void> {
    // 验证字段是否存在
    await this.findFieldById(id, userId);

    try {
      // 使用事务确保删除操作的原子性
      await this.fieldRepository.manager.transaction(async transactionManager => {
        // 递归删除字段及其所有子字段
        await this.recursiveDeleteField(transactionManager, id, userId);
      });
    } catch (error) {
      this.logger.error('删除字段失败', error);
      throw new InternalServerErrorException('删除字段失败，请稍后重试');
    }
  }

  // 批量创建字段
  async batchCreateFields(
    userId: number,
    batchCreateFieldDto: BatchCreateFieldDto
  ): Promise<Field[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 验证字段组是否存在且属于当前用户
    const groupIds = batchCreateFieldDto.fields
      .filter(field => field.groupId)
      .map(field => field.groupId);

    if (groupIds.length > 0) {
      // 去重，避免重复字段组ID导致的问题
      const uniqueGroupIds = [...new Set(groupIds)];
      const fieldGroups = await this.fieldGroupRepository.find({
        where: uniqueGroupIds.map(id => ({ id, user: { id: userId } })),
      });
      if (fieldGroups.length !== uniqueGroupIds.length) {
        throw new NotFoundException('部分字段组不存在或无权访问');
      }
    }

    // 检查批量创建的字段名称在同一字段组、同一belongId和pos下是否已存在
    for (const fieldData of batchCreateFieldDto.fields) {
      if (typeof fieldData.belongId === 'string') {
        continue;
      }

      const nameExists = await this.isFieldNameExists(
        userId,
        fieldData.name,
        fieldData.groupId || null,
        undefined, // excludeId
        fieldData.pos || null,
        fieldData.belongId || null
      );
      if (nameExists) {
        throw new ConflictException(`字段名称"${fieldData.name}"在当前条件下已存在`);
      }
    }

    // 检查批量创建的字段中是否有重复名称
    // 使用复合键：groupId-belongId-pos作为分组依据
    const fieldsByCondition = new Map<string, Map<string, boolean>>();
    for (const fieldData of batchCreateFieldDto.fields) {
      const groupId = fieldData.groupId ?? null;
      const belongId = fieldData.belongId ?? null;
      const pos = fieldData.pos ?? null;

      // 创建复合键：groupId-belongId-pos
      const key = `${groupId}-${belongId}-${pos}`;

      if (!fieldsByCondition.has(key)) {
        fieldsByCondition.set(key, new Map());
      }

      const conditionFields = fieldsByCondition.get(key)!;
      if (conditionFields.has(fieldData.name)) {
        throw new ConflictException(
          `批量创建的字段中，字段名称"${fieldData.name}"在相同条件下重复`
        );
      }
      conditionFields.set(fieldData.name, true);
    }

    // 验证特殊格式的belongId
    for (let i = 0; i < batchCreateFieldDto.fields.length; i++) {
      const fieldData = batchCreateFieldDto.fields[i];
      if (
        fieldData.belongId &&
        typeof fieldData.belongId === 'string' &&
        fieldData.belongId.startsWith('#')
      ) {
        const index = parseInt(fieldData.belongId.substring(1));
        if (isNaN(index) || index >= i) {
          throw new BadRequestException(
            `字段"${fieldData.name}"的belongId "${fieldData.belongId}" 无效，引用的下标必须小于当前字段的位置`
          );
        }
      } else if (fieldData.belongId && typeof fieldData.belongId === 'number') {
        // 验证普通数字类型的belongId是否存在且属于当前用户
        const parentField = await this.fieldRepository.findOne({
          where: { id: fieldData.belongId, user: { id: userId } },
        });
        if (!parentField) {
          throw new NotFoundException(
            `字段"${fieldData.name}"的父级字段ID ${fieldData.belongId} 不存在或无权访问`
          );
        }
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const createdFields: Field[] = [];

    try {
      // 按照fields数组的顺序依次创建字段
      for (let i = 0; i < batchCreateFieldDto.fields.length; i++) {
        const fieldData = batchCreateFieldDto.fields[i];

        // 解析belongId
        let belongField: Field | null = null;
        if (fieldData.belongId) {
          if (typeof fieldData.belongId === 'string' && fieldData.belongId.startsWith('#')) {
            // 特殊格式belongId
            const index = parseInt(fieldData.belongId.substring(1));
            belongField = createdFields[index];
          } else if (typeof fieldData.belongId === 'number') {
            // 普通数字belongId
            belongField = await queryRunner.manager.findOne(Field, {
              where: { id: fieldData.belongId, user: { id: userId } },
            });
          }
        }

        // 获取字段组
        let fieldGroup: FieldGroup | null = null;
        if (fieldData.groupId) {
          fieldGroup = await queryRunner.manager.findOne(FieldGroup, {
            where: { id: fieldData.groupId, user: { id: userId } },
          });
        }

        // 检查是否存在相同belong_id和pos的字段，如果存在则先删除
        if (belongField && fieldData.pos !== undefined && fieldData.pos !== null) {
          const existingField = await queryRunner.manager.findOne(Field, {
            where: {
              user: { id: userId },
              belong: { id: belongField.id },
              pos: fieldData.pos,
            },
          });

          if (existingField) {
            // 递归删除该字段及其所有子字段
            await this.recursiveDeleteField(queryRunner.manager, existingField.id, userId);
          }
        }

        // 创建字段
        const newField = queryRunner.manager.create(Field, {
          name: fieldData.name,
          type: fieldData.type,
          value: fieldData.value ?? null,
          pos: fieldData.pos ?? null,
          group: fieldGroup,
          belong: belongField,
          user,
        });

        const savedField = await queryRunner.manager.save(newField);
        createdFields.push(savedField);
      }

      await queryRunner.commitTransaction();
      return createdFields;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('批量创建字段失败', error);
      throw new InternalServerErrorException('批量创建字段失败，请稍后重试');
    } finally {
      await queryRunner.release();
    }
  }

  // 批量更新字段
  async batchUpdateFields(
    userId: number,
    batchUpdateFieldDto: BatchUpdateFieldDto
  ): Promise<Field[]> {
    // 预先验证所有更新操作，避免部分更新成功后失败
    const updatesWithFields: Array<{ update: BatchUpdateItemDto; field: Field }> = [];

    for (const update of batchUpdateFieldDto.updates) {
      const field = await this.fieldRepository.findOne({
        where: { id: update.id, user: { id: userId } },
        relations: ['user', 'group', 'belong'],
      });

      if (!field) {
        throw new NotFoundException(`ID为${update.id}的字段不存在或无权访问`);
      }

      updatesWithFields.push({ update, field });
    }

    // 按groupId和belongId分组
    const updatesByGroup = new Map<string, Array<{ update: BatchUpdateItemDto; field: Field }>>();

    for (const { update, field } of updatesWithFields) {
      const key = `${field.group?.id || 'null'}-${field.belong?.id || 'null'}`;

      if (!updatesByGroup.has(key)) {
        updatesByGroup.set(key, []);
      }
      updatesByGroup.get(key)?.push({ update, field });
    }

    // 移除字段名称检查，因为名称不再允许修改

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const updatedFields: Field[] = [];

      // 处理每个分组的更新
      for (const [groupKey, groupUpdates] of updatesByGroup) {
        // 先处理pos变更
        const posUpdates = groupUpdates.filter(({ update }) => update.data.pos !== undefined);

        if (posUpdates.length > 0) {
          // 按新pos排序，从后往前更新，避免冲突
          posUpdates.sort((a, b) => (b.update.data.pos || 0) - (a.update.data.pos || 0));

          for (const { update, field } of posUpdates) {
            const oldPos = field.pos || 0;
            const newPos = update.data.pos || 0;

            if (oldPos !== newPos) {
              // 获取该组所有字段
              const [groupIdStr, belongIdStr] = groupKey.split('-');
              const groupId = groupIdStr === 'null' ? undefined : parseInt(groupIdStr);
              const belongId = belongIdStr === 'null' ? undefined : parseInt(belongIdStr);

              // 如果没有belongId，则不进行位置调整，只更新当前字段
              if (!belongId) {
                field.pos = newPos;
                await queryRunner.manager.save(field);
                continue;
              }

              // 调整位置
              let start: number, end: number, adjustment: number;

              if (newPos > oldPos) {
                start = oldPos;
                end = newPos;
                adjustment = -1;
              } else {
                start = newPos;
                end = oldPos;
                adjustment = 1;
              }

              // 获取需要调整的字段
              const fieldsToAdjust = await queryRunner.manager.find(Field, {
                where: {
                  user: { id: userId },
                  id: Not(field.id),
                  ...(groupId ? { group: { id: groupId } } : { group: IsNull() }),
                  ...(belongId ? { belong: { id: belongId } } : { belong: IsNull() }),
                  pos: Between(start, end),
                },
              });

              // 调整中间字段的位置
              for (const fieldToAdjust of fieldsToAdjust) {
                // 确保pos不为null
                if (fieldToAdjust.pos !== null) {
                  fieldToAdjust.pos += adjustment;
                  await queryRunner.manager.save(fieldToAdjust);
                }
              }

              // 更新目标字段
              field.pos = newPos;
              await queryRunner.manager.save(field);
            }
          }
        }

        // 处理其他更新（如value）
        const otherUpdates = groupUpdates.filter(({ update }) => update.data.value !== undefined);

        for (const { update, field } of otherUpdates) {
          // 修复类型不匹配：UpdateFieldDto.value是string | undefined，而Field.value是string | null
          field.value = update.data.value ?? null;
          const savedField = await queryRunner.manager.save(field);
          updatedFields.push(savedField);
        }
      }

      await queryRunner.commitTransaction();
      return updatedFields;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('批量更新字段失败', error);
      throw new InternalServerErrorException('批量更新字段失败，请稍后重试');
    } finally {
      await queryRunner.release();
    }
  }
}
