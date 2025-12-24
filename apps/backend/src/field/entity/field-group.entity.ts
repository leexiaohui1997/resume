import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entity/base.entity';
import { User } from '../../user/entity/user.entity';
import { Field } from './field.entity';

@Entity('field_groups')
export class FieldGroup extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @ManyToOne(() => User, user => user.fieldGroups)
  user: User;

  @OneToMany(() => Field, field => field.group)
  fields: Field[];
}
