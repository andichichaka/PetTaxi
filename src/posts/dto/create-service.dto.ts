import { IsArray, IsEnum, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceType } from '../enum/service-type.enum';

export class CreateServiceDto {
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @IsNotEmpty()
  price: number;

  @IsArray()
  unavailableDates: string[];
}
