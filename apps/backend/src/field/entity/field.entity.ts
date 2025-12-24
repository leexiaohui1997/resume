import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entity/base.entity';
import { User } from '../../user/entity/user.entity';
import { FieldGroup } from './field-group.entity';
import { FieldType } from '../enums/field-type.enum';

@Entity('fields')
export class Field extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ type: 'tinyint' })
  type: FieldType;

  @Column({ type: 'text', nullable: true })
  value: string;

  @ManyToOne(() => FieldGroup, group => group.fields, { nullable: true })
  @JoinColumn({ name: 'group_id' })
  group: FieldGroup;

  @Column({ type: 'int', nullable: true })
  order: number;

  @ManyToOne(() => Field, { nullable: true })
  @JoinColumn({ name: 'belong_id' })
  belong: Field;

  @Column({ type: 'int', nullable: true })
  pos: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
