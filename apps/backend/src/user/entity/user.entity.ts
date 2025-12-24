import { Column, Entity, OneToMany } from 'typeorm';
import { Token } from '../../auth/entity/token.entity';
import { BaseEntity } from '../../common/entity/base.entity';
import { FieldGroup } from '../../field/entity/field-group.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ length: 50, unique: true })
  username: string;

  @Column({ select: false })
  password: string;

  @Column({ length: 255, nullable: true })
  avatarUrl: string;

  @Column({ length: 50, nullable: true })
  nickname: string;

  @OneToMany(() => Token, token => token.user)
  tokens: Token[];

  @OneToMany(() => FieldGroup, group => group.user)
  fieldGroups: FieldGroup[];
}
