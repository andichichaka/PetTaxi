import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Service } from '../posts/service.entity';
import { AnimalType } from '../posts/enum/animal-type.enum';
import { AnimalSize } from '../posts/enum/animal-size.enum';

@Entity()
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Service, (service) => service.bookings, { onDelete: 'CASCADE' })
  service: Service;

  @ManyToOne(() => User, (user) => user.bookings, { eager: true })
  user: User;

  @Column({
    type: 'enum',
    enum: AnimalType,
  })
  animalType: AnimalType;

  @Column({
    type: 'enum',
    enum: AnimalSize,
  })
  animalSize: AnimalSize;

  @Column('simple-array', { nullable: true })
  bookingDates: string[]; // List of ISO 8601 dates for weekly services

  @Column()
  price: number;

  @Column('text', { nullable: true })
  notes: string;

  @Column({ default: false })
  isApproved: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
