import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class Code {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  code: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp' })
  expireAt: Date;

  @ManyToOne(() => User, (user) => user.codes, { onDelete: 'CASCADE' })
  user: User;
}