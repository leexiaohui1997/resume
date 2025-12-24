import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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
    excludeId?: number
  ): Promise<boolean> {
    const queryBuilder = this.fieldRepository
      .createQueryBuilder('field')
      .where('field.user.id = :userId', { userId })
      .andWhere('field.name = :name', { name });

    if (groupId !== undefined) {
      if (groupId === null) {
        queryBuilder.andWhere('field.groupId IS NULL');
      } else {
        queryBuilder.andWhere('field.groupId = :groupId', { groupId });
      }
    }

    if (excludeId) {
      queryBuilder.andWhere('field.id != :excludeId', { excludeId });
    }

    const count = await queryBuilder.getCount();
    return count > 0;
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
      await this.fieldGroupRepository.remove(fieldGroup);
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
    if (createFieldDto.groupId) {
      const fieldGroup = await this.fieldGroupRepository.findOne({
        where: { id: createFieldDto.groupId, user: { id: userId } },
      });
      if (!fieldGroup) {
        throw new NotFoundException('字段组不存在或无权访问');
      }
    }

    // 验证父级字段是否存在且属于当前用户
    if (createFieldDto.belongId) {
      const parentField = await this.fieldRepository.findOne({
        where: { id: createFieldDto.belongId, user: { id: userId } },
      });
      if (!parentField) {
        throw new NotFoundException('父级字段不存在或无权访问');
      }
    }

    // 检查字段名称在同一字段组下是否已存在
    const nameExists = await this.isFieldNameExists(
      userId,
      createFieldDto.name,
      createFieldDto.groupId || null
    );
    if (nameExists) {
      throw new ConflictException('字段名称在同一字段组下已存在');
    }

    const field = this.fieldRepository.create({
      ...createFieldDto,
      user,
    });

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
      order: { order: 'ASC', createTime: 'DESC' },
    });
  }

  async updateField(id: number, userId: number, updateFieldDto: UpdateFieldDto): Promise<Field> {
    const field = await this.findFieldById(id, userId);

    // 如果更新了字段组，验证字段组是否存在且属于当前用户
    if (updateFieldDto.groupId !== undefined && updateFieldDto.groupId !== field.group?.id) {
      if (updateFieldDto.groupId) {
        const fieldGroup = await this.fieldGroupRepository.findOne({
          where: { id: updateFieldDto.groupId, user: { id: userId } },
        });
        if (!fieldGroup) {
          throw new NotFoundException('字段组不存在或无权访问');
        }
      }
    }

    // 如果更新了父级字段，验证父级字段是否存在且属于当前用户
    if (updateFieldDto.belongId !== undefined && updateFieldDto.belongId !== field.belong?.id) {
      if (updateFieldDto.belongId) {
        const parentField = await this.fieldRepository.findOne({
          where: { id: updateFieldDto.belongId, user: { id: userId } },
        });
        if (!parentField) {
          throw new NotFoundException('父级字段不存在或无权访问');
        }
      }
    }

    // 如果更新了名称，检查新名称在同一字段组下是否已存在
    if (updateFieldDto.name && updateFieldDto.name !== field.name) {
      const groupId =
        updateFieldDto.groupId !== undefined ? updateFieldDto.groupId : field.group?.id;
      const nameExists = await this.isFieldNameExists(
        userId,
        updateFieldDto.name,
        groupId || null,
        id
      );
      if (nameExists) {
        throw new ConflictException('字段名称在同一字段组下已存在');
      }
    }

    Object.assign(field, updateFieldDto);

    try {
      return await this.fieldRepository.save(field);
    } catch (error) {
      this.logger.error('更新字段失败', error);
      throw new InternalServerErrorException('更新字段失败，请稍后重试');
    }
  }

  async deleteField(id: number, userId: number): Promise<void> {
    const field = await this.findFieldById(id, userId);

    try {
      await this.fieldRepository.remove(field);
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

    // 验证所有字段组和父级字段是否存在且属于当前用户
    const groupIds = batchCreateFieldDto.fields
      .filter(field => field.groupId)
      .map(field => field.groupId);

    const belongIds = batchCreateFieldDto.fields
      .filter(field => field.belongId)
      .map(field => field.belongId);

    if (groupIds.length > 0) {
      const fieldGroups = await this.fieldGroupRepository.find({
        where: groupIds.map(id => ({ id, user: { id: userId } })),
      });
      if (fieldGroups.length !== groupIds.length) {
        throw new NotFoundException('部分字段组不存在或无权访问');
      }
    }

    if (belongIds.length > 0) {
      const parentFields = await this.fieldRepository.find({
        where: belongIds.map(id => ({ id, user: { id: userId } })),
      });
      if (parentFields.length !== belongIds.length) {
        throw new NotFoundException('部分父级字段不存在或无权访问');
      }
    }

    // 检查批量创建的字段名称在同一字段组下是否已存在
    for (const fieldData of batchCreateFieldDto.fields) {
      const nameExists = await this.isFieldNameExists(
        userId,
        fieldData.name,
        fieldData.groupId || null
      );
      if (nameExists) {
        throw new ConflictException(`字段名称"${fieldData.name}"在同一字段组下已存在`);
      }
    }

    // 检查批量创建的字段中是否有重复名称
    const fieldsByGroup = new Map<number | null, Map<string, boolean>>();
    for (const fieldData of batchCreateFieldDto.fields) {
      const groupId = fieldData.groupId || null;
      if (!fieldsByGroup.has(groupId)) {
        fieldsByGroup.set(groupId, new Map());
      }
      const groupFields = fieldsByGroup.get(groupId)!;
      if (groupFields.has(fieldData.name)) {
        throw new ConflictException(
          `批量创建的字段中，字段名称"${fieldData.name}"在同一字段组下重复`
        );
      }
      groupFields.set(fieldData.name, true);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const fields = batchCreateFieldDto.fields.map(fieldData =>
        queryRunner.manager.create(Field, {
          ...fieldData,
          user,
        })
      );

      const savedFields = await queryRunner.manager.save(fields);
      await queryRunner.commitTransaction();
      return savedFields;
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

    // 检查批量更新的字段名称在同一字段组下是否已存在
    for (const { update, field } of updatesWithFields) {
      if (update.data.name && update.data.name !== field.name) {
        const groupId = update.data.groupId !== undefined ? update.data.groupId : field.group?.id;
        const nameExists = await this.isFieldNameExists(
          userId,
          update.data.name,
          groupId || null,
          update.id
        );
        if (nameExists) {
          throw new ConflictException(`字段名称"${update.data.name}"在同一字段组下已存在`);
        }
      }
    }

    // 检查批量更新的字段中是否有重复名称
    const fieldsByGroup = new Map<number | null, Map<string, number>>();
    for (const { update, field } of updatesWithFields) {
      if (update.data.name) {
        const groupId = update.data.groupId !== undefined ? update.data.groupId : field.group?.id;
        if (groupId !== undefined) {
          if (!fieldsByGroup.has(groupId)) {
            fieldsByGroup.set(groupId, new Map());
          }
          const groupFields = fieldsByGroup.get(groupId)!;
          if (
            groupFields.has(update.data.name) &&
            groupFields.get(update.data.name) !== update.id
          ) {
            throw new ConflictException(
              `批量更新的字段中，字段名称"${update.data.name}"在同一字段组下重复`
            );
          }
          groupFields.set(update.data.name, update.id);
        }
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const updatedFields: Field[] = [];

      for (const { update, field } of updatesWithFields) {
        // 如果更新了字段组，验证字段组是否存在且属于当前用户
        if (update.data.groupId !== undefined && update.data.groupId !== field.group?.id) {
          if (update.data.groupId) {
            const fieldGroup = await queryRunner.manager.findOne(FieldGroup, {
              where: { id: update.data.groupId, user: { id: userId } },
            });
            if (!fieldGroup) {
              throw new NotFoundException(`ID为${update.data.groupId}的字段组不存在或无权访问`);
            }
          }
        }

        // 如果更新了父级字段，验证父级字段是否存在且属于当前用户
        if (update.data.belongId !== undefined && update.data.belongId !== field.belong?.id) {
          if (update.data.belongId) {
            const parentField = await queryRunner.manager.findOne(Field, {
              where: { id: update.data.belongId, user: { id: userId } },
            });
            if (!parentField) {
              throw new NotFoundException(`ID为${update.data.belongId}的父级字段不存在或无权访问`);
            }
          }
        }

        Object.assign(field, update.data);
        const savedField = await queryRunner.manager.save(field);
        updatedFields.push(savedField);
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
