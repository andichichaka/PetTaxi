import { Expose, Type } from 'class-transformer';
import { User } from 'src/users/user.entity';
import { Location } from '../../entities/location.entity';
import { ServiceSnapshotDto } from './service-snapshot.dto';

export class PostCreateResponseDto {
  @Expose()
  id: number;

  @Expose()
  description: string;

  @Expose()
  animalType: string;

  @Expose()
  animalSizes: string[];

  @Expose()
  user: User;

  @Expose()
  location: Location;

  @Expose()
  @Type(() => ServiceSnapshotDto)
  services: ServiceSnapshotDto[];
}