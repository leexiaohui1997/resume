import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueryService } from '../common/services/query.service';
import { User } from '../user/entity/user.entity';
import { FieldGroup } from './entity/field-group.entity';
import { Field } from './entity/field.entity';
import { FieldController } from './field.controller';
import { FieldService } from './field.service';

@Module({
  imports: [TypeOrmModule.forFeature([Field, FieldGroup, User])],
  controllers: [FieldController],
  providers: [FieldService, QueryService],
  exports: [FieldService],
})
export class FieldModule {}
