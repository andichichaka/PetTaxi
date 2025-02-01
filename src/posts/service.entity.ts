import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, RelationId } from 'typeorm';
import { Post } from './post.entity';
import { Booking } from '../booking/booking.entity';
import { ServiceType } from './enum/service-type.enum';

@Entity()
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Post, (post) => post.services, { onDelete: 'CASCADE' })
  post: Post;

  @OneToMany(() => Booking, (booking) => booking.service)
  bookings: Booking[];

  @Column({
    type: 'enum',
    enum: ServiceType,
  })
  serviceType: ServiceType;

  @Column('decimal', { 
    precision: 10, 
    scale: 2, 
    transformer: {
        to: (value: number) => value,
        from: (value: string) => parseFloat(value),
    },
  })
  price: number;

  @Column('simple-array', { default: '' })
  unavailableDates: string[];
}
