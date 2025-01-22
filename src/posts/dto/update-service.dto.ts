import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ServiceType } from '../enum/service-type.enum';

export class UpdateServiceDto {
  @IsEnum(ServiceType)
  @IsOptional()
  serviceType?: ServiceType;

  @IsNumber()
  @IsOptional()
  price?: number;
}
