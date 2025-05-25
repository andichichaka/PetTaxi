import { Expose } from 'class-transformer';

export class PostUserDto {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Expose()
  username: string;

  @Expose()
  profilePicture: string;
}