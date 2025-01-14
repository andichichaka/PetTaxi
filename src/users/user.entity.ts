import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Post } from '../posts/post.entity';
import { Role } from 'src/roles/enum/role.enum';

@Entity()
export class User{
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    email: string;

    @Column({ unique: true })
    username: string;

    @Column({select: false})
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

    @OneToMany(() => Post, (post) => post.user, { cascade: true })
    posts: Post[];
}