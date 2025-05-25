import { Expose } from 'class-transformer';

export class UpdateProfileResponseDto {
  @Expose()
  email: string;

  @Expose()
  username: string;

  @Expose()
  description: string;
}