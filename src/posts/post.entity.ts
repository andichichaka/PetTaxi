import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Not, OneToMany } from 'typeorm';
import { User } from '../users/user.entity';
import { Location } from './location.entity';
import { AnimalType } from './enum/animal-type.enum';
import { AnimalSize } from './enum/animal-size.enum';
import { Service } from './service.entity';
import { Review } from 'src/reviews/entities/review.entity';

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'simple-array',
    nullable: true,
    default: ''
  })
  imagesUrl: string[];

  @Column('text')
  description: string;

  @ManyToOne(() => Location, (location) => location.posts, { eager: true })
  location: Location;

  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE', eager: true })
  user: User;

  @OneToMany(() => Service, (service) => service.post, { cascade: ['insert'], eager: true })
  services: Service[];

  @Column({
    type: "enum",
    enum: AnimalType
  })
  animalType: AnimalType;

  @Column({
    type: "enum",
    enum: AnimalSize,
    array: true, nullable: false, default: '{}' })
  animalSizes: AnimalSize[];

  @OneToMany(() => Review, (review) => review.post, { cascade: true })
  reviews: Review[];
}