// src/posts/post.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Not } from 'typeorm';
import { User } from '../users/user.entity';
import { ServiceType } from './enum/service-type.enum';
import { AnimalType } from './enum/animal-type.enum';
import { AnimalSize } from './enum/animal-size.enum';
import { empty } from 'rxjs';

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'simple-array',
    nullable: true,
  })
  imagesUrl: string[];

  @Column('text')
  description: string;

  @ManyToOne(() => User, (user) => user.posts)
  user: User;

  @Column({
    type: "simple-array",
    enum: ServiceType
  })
  serviceTypes: ServiceType[];

  @Column({
    type: "enum",
    enum: AnimalType
  })
  animalType: AnimalType;

  @Column({
    type: "simple-array",
    enum: AnimalSize
  })
  animalSizes: AnimalSize[];
}
