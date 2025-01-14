// src/posts/post.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';
import { ServiceType } from './enum/service-type.enum';
import { AnimalType } from './enum/animal-type.enum';
import { AnimalSize } from './enum/animal-size.enum';

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('simple-array')
  imagesUrl: string[];

  @Column('text')
  description: string;

  @ManyToOne(() => User, (user) => user.posts)
  user: User;

  @Column({
    type: "enum",
    enum: ServiceType,
    default: ServiceType.Other
  })
  serviceType: ServiceType;

  @Column({
    type: "enum",
    enum: AnimalType,
    default: AnimalType.Both
  })
  animalType: AnimalType;

  @Column({
    type: "enum",
    enum: AnimalSize,
    default: AnimalSize.Other
  })
  animalSize: AnimalSize;
}
