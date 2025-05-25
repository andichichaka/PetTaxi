// service-with-post.dto.ts
import { Expose, Type } from 'class-transformer';
import { PostSnapshotDto } from './post-snapshot.dto';

export class ServiceWithPostDto {
  @Expose()
  id: number;

  @Expose()
  serviceType: string;

  @Expose()
  price: number;

  @Expose()
  unavailableDates: string[];

  @Expose()
  @Type(() => PostSnapshotDto)
  post: PostSnapshotDto;
}