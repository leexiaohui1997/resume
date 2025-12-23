import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entity/base.entity';
import { User } from '../../user/entity/user.entity';

export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
}

@Entity('tokens')
export class Token extends BaseEntity {
  @Column({ length: 500 })
  token: string;

  @Column({
    type: 'enum',
    enum: TokenType,
    default: TokenType.ACCESS,
  })
  type: TokenType;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  isRevoked: boolean;

  @ManyToOne(() => User, user => user.tokens)
  user: User;
}
