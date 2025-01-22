import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Post } from '../posts/post.entity';
import { Role } from 'src/roles/enum/role.enum';
import { Booking } from 'src/booking/booking.entity';
import { Code } from './code.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column({ unique: true })
  username: string;

  @Column({ select: false })
  password: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.User,
  })
  role: Role;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  profilePic?: string;

  @Column({ type: 'bool' ,default: false })
  isEmailVerified: boolean;

  @OneToMany(() => Post, (post) => post.user, { cascade: true })
  posts: Post[];

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings: Booking[];

  @OneToMany(() => Code, (code) => code.user, { cascade: false })
  codes: Code[];
}
