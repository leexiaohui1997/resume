import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { FieldService } from './field.service';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';
import { CreateFieldGroupDto } from './dto/create-field-group.dto';
import { UpdateFieldGroupDto } from './dto/update-field-group.dto';
import { BatchCreateFieldDto } from './dto/batch-create-field.dto';
import { BatchUpdateFieldDto } from './dto/batch-update-field.dto';
import { FieldDto } from './dto/field.dto';
import { FieldGroupDto } from './dto/field-group.dto';

@ApiTags('字段管理')
@Controller('field')
@UseGuards(JwtAuthGuard)
export class FieldController {
  constructor(private readonly fieldService: FieldService) {}

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

  @Get('group')
  @ApiOperation({ summary: '获取字段组列表' })
  @ApiResponse({ status: 200, description: '获取成功', type: [FieldGroupDto] })
  @ApiResponse({ status: 401, description: '未授权' })
  async getFieldGroups(@Req() req: RequestWithUser) {
    const { userId } = req.user;
    return this.fieldService.findFieldGroupsByUserId(userId);
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
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除字段组' })
  @ApiParam({ name: 'id', description: '字段组ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '字段组不存在' })
  async deleteFieldGroup(@Req() req: RequestWithUser, @Param('id') id: string) {
    const { userId } = req.user;
    await this.fieldService.deleteFieldGroup(+id, userId);
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
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除字段' })
  @ApiParam({ name: 'id', description: '字段ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
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

  @Put('batch')
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
}
