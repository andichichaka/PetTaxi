import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
  } from 'typeorm';
  import { User } from '../../users/user.entity';
  import { Post } from '../../posts/post.entity';
  
  @Entity()
  export class Review {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ type: 'text' })
    comment: string;
  
    @ManyToOne(() => User, (user) => user.reviews, { eager: true })
    user: User;
  
    @ManyToOne(() => Post, (post) => post.reviews, { onDelete: 'CASCADE', eager: false })
    post: Post;
  
    @CreateDateColumn()
    createdAt: Date;
  }