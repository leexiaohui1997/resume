import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { QueryService } from '../common/services/query.service';
import { BatchCreateFieldDto } from './dto/batch-create-field.dto';
import { BatchUpdateFieldDto } from './dto/batch-update-field.dto';
import { CreateFieldGroupDto } from './dto/create-field-group.dto';
import { CreateFieldDto } from './dto/create-field.dto';
import { FieldGroupQueryDto } from './dto/field-group-query.dto';
import { FieldGroupDto } from './dto/field-group.dto';
import { FieldDto } from './dto/field.dto';
import { UpdateFieldGroupDto } from './dto/update-field-group.dto';
import { UpdateFieldDto } from './dto/update-field.dto';
import { FieldService } from './field.service';

@ApiTags('字段管理')
@Controller('field')
@UseGuards(JwtAuthGuard)
export class FieldController {
  constructor(
    private readonly fieldService: FieldService,
    private readonly queryService: QueryService
  ) {}

  // 字段组相关接口
  @Post('group')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建字段组' })
  @ApiResponse({ status: 201, description: '创建成功', type: FieldGroupDto })
  @ApiResponse({ status: 401, description: '未授权' })
  async createFieldGroup(
    @Req() req: RequestWithUser,
    @Body() createFieldGroupDto: CreateFieldGroupDto
  ) {
    const { userId } = req.user;
    return this.fieldService.createFieldGroup(userId, createFieldGroupDto);
  }

  @Post('group/search')
  @ApiOperation({ summary: '查询字段组列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async getFieldGroups(
    @Req() req: RequestWithUser,
    @Body(new ValidationPipe({ transform: true })) query: FieldGroupQueryDto
  ) {
    const { userId } = req.user;

    // 创建基础查询
    const queryBuilder = this.fieldService.createFieldGroupsQueryBuilder();

    // 添加用户ID筛选
    queryBuilder.andWhere('fieldGroup.user.id = :userId', { userId });

    // 应用查询选项
    await this.queryService.applyQueryOptions(
      queryBuilder,
      query,
      ['name', 'createTime', 'updateTime'] // 允许排序的字段
    );

    // 获取分页数据
    const { data, total } = await this.queryService.getPaginatedData(queryBuilder);

    // 计算总页数
    const limit = query.limit || 10; // 提供默认值
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page: query.page,
      limit: query.limit,
      totalPages,
    };
  }

  @Get('group/:id')
  @ApiOperation({ summary: '获取字段组详情' })
  @ApiParam({ name: 'id', description: '字段组ID' })
  @ApiResponse({ status: 200, description: '获取成功', type: FieldGroupDto })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '字段组不存在' })
  async getFieldGroup(@Req() req: RequestWithUser, @Param('id') id: string) {
    const { userId } = req.user;
    return this.fieldService.findFieldGroupById(+id, userId);
  }

  @Put('group/:id')
  @ApiOperation({ summary: '更新字段组' })
  @ApiParam({ name: 'id', description: '字段组ID' })
  @ApiResponse({ status: 200, description: '更新成功', type: FieldGroupDto })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '字段组不存在' })
  async updateFieldGroup(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateFieldGroupDto: UpdateFieldGroupDto
  ) {
    const { userId } = req.user;
    return this.fieldService.updateFieldGroup(+id, userId, updateFieldGroupDto);
  }

  @Delete('group/:id')
  @ApiOperation({ summary: '删除字段组' })
  @ApiParam({ name: 'id', description: '字段组ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '字段组不存在' })
  async deleteFieldGroup(@Req() req: RequestWithUser, @Param('id') id: string) {
    const { userId } = req.user;
    await this.fieldService.deleteFieldGroup(+id, userId);
  }

  @Put('batch-update')
  @ApiOperation({ summary: '批量更新字段' })
  @ApiResponse({ status: 200, description: '更新成功', type: [FieldDto] })
  @ApiResponse({ status: 401, description: '未授权' })
  async batchUpdateFields(
    @Req() req: RequestWithUser,
    @Body() batchUpdateFieldDto: BatchUpdateFieldDto
  ) {
    const { userId } = req.user;
    return this.fieldService.batchUpdateFields(userId, batchUpdateFieldDto);
  }

  // 字段相关接口
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建字段' })
  @ApiResponse({ status: 201, description: '创建成功', type: FieldDto })
  @ApiResponse({ status: 401, description: '未授权' })
  async createField(@Req() req: RequestWithUser, @Body() createFieldDto: CreateFieldDto) {
    const { userId } = req.user;
    return this.fieldService.createField(userId, createFieldDto);
  }

  @Get()
  @ApiOperation({ summary: '获取字段列表' })
  @ApiQuery({ name: 'groupId', required: false, description: '字段组ID' })
  @ApiResponse({ status: 200, description: '获取成功', type: [FieldDto] })
  @ApiResponse({ status: 401, description: '未授权' })
  async getFields(@Req() req: RequestWithUser, @Query('groupId') groupId?: string) {
    const { userId } = req.user;
    return this.fieldService.findFieldsByUserId(userId, groupId ? +groupId : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取字段详情' })
  @ApiParam({ name: 'id', description: '字段ID' })
  @ApiResponse({ status: 200, description: '获取成功', type: FieldDto })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '字段不存在' })
  async getField(@Req() req: RequestWithUser, @Param('id') id: string) {
    const { userId } = req.user;
    return this.fieldService.findFieldById(+id, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新字段' })
  @ApiParam({ name: 'id', description: '字段ID' })
  @ApiResponse({ status: 200, description: '更新成功', type: FieldDto })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '字段不存在' })
  async updateField(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateFieldDto: UpdateFieldDto
  ) {
    const { userId } = req.user;
    return this.fieldService.updateField(+id, userId, updateFieldDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除字段' })
  @ApiParam({ name: 'id', description: '字段ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '字段不存在' })
  async deleteField(@Req() req: RequestWithUser, @Param('id') id: string) {
    const { userId } = req.user;
    await this.fieldService.deleteField(+id, userId);
  }

  // 批量操作接口
  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '批量创建字段' })
  @ApiResponse({ status: 201, description: '创建成功', type: [FieldDto] })
  @ApiResponse({ status: 401, description: '未授权' })
  async batchCreateFields(
    @Req() req: RequestWithUser,
    @Body() batchCreateFieldDto: BatchCreateFieldDto
  ) {
    const { userId } = req.user;
    return this.fieldService.batchCreateFields(userId, batchCreateFieldDto);
  }
}
