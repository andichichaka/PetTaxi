
import { IsArray, IsEnum, IsOptional, IsString, ValidateNested, ArrayNotEmpty } from 'class-validator';
import { ServiceType } from '../enum/service-type.enum';
import { AnimalType } from '../enum/animal-type.enum';
import { AnimalSize } from '../enum/animal-size.enum';

export class UpdatePostDto {
  @IsArray()
  @IsOptional()
  @ArrayNotEmpty()
  @IsString({ each: true })
  imagesUrl?: string[];

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ServiceType)
  @IsOptional()
  serviceType?: ServiceType;

  @IsEnum(AnimalType)
  @IsOptional()
  animalType?: AnimalType;

  @IsEnum(AnimalSize)
  @IsOptional()
  animalSize?: AnimalSize;
}
