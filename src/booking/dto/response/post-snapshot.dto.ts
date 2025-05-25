// post-snapshot.dto.ts
import { Expose } from 'class-transformer';
import { Location } from '../../../posts/location.entity';

export class PostSnapshotDto {
  @Expose()
  id: number;

  @Expose()
  imagesUrl: string[];

  @Expose()
  description: string;

  @Expose()
  animalType: string;

  @Expose()
  animalSizes: string[];

  @Expose()
  user: any;

  @Expose()
  location?: Location;

  @Expose()
  services: any[];

  @Expose()
  reviews?: any[];
}