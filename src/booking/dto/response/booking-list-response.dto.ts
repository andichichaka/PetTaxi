// booking-list-response.dto.ts
import { Expose, Type } from 'class-transformer';
import { ServiceWithPostDto } from './service-with-post.dto';

export class BookingListResponseDto {
  @Expose()
  id: number;

  @Expose()
  animalType: string;

  @Expose()
  animalSize: string;

  @Expose()
  bookingDates: string[];

  @Expose()
  price: number;

  @Expose()
  notes: string;

  @Expose()
  isApproved: boolean;

  @Expose()
  service: ServiceWithPostDto;

  @Expose()
  user: any;

  @Expose()
  createdAt: string;
}