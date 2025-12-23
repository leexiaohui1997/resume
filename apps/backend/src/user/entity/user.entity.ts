import { Column, Entity, OneToMany } from 'typeorm';
import { Token } from '../../auth/entity/token.entity';
import { BaseEntity } from '../../common/entity/base.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ length: 50, unique: true })
  username: string;

  @Column({ select: false })
  password: string;

  @OneToMany(() => Token, token => token.user)
  tokens: Token[];
}
