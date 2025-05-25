import { Expose, Type } from 'class-transformer';
import { PostSnapshotDto } from 'src/booking/dto/response/post-snapshot.dto';

export class GetProfileResponseDto {
  @Expose()
  id: number;

  @Expose()
  username: string;

  @Expose()
  email: string;

  @Expose()
  description: string;

  @Expose()
  profilePicture: string;

  @Expose()
  @Type(() => PostSnapshotDto)
  posts: PostSnapshotDto[];
}