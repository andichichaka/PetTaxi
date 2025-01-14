
import { IsArray, IsEnum, IsOptional, IsString, ValidateNested, ArrayNotEmpty } from 'class-validator';
import { ServiceType } from '../enum/service-type.enum';
import { AnimalType } from '../enum/animal-type.enum';
import { AnimalSize } from '../enum/animal-size.enum';

export class UpdatePostDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  @IsEnum(ServiceType, { each: true })
  serviceTypes?: ServiceType[];


  @IsEnum(AnimalType)
  @IsOptional()
  animalType?: AnimalType;

  @IsEnum(AnimalSize)
  @IsOptional()
  @IsEnum(AnimalSize, { each: true })
  animalSizes?: AnimalSize[];
}
