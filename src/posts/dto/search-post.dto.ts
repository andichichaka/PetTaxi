import { IsOptional, IsString, IsEnum, IsArray } from 'class-validator';
import { ServiceType } from '../enum/service-type.enum';
import { AnimalType } from '../enum/animal-type.enum';
import { AnimalSize } from '../enum/animal-size.enum';

export class SearchPostsDto {
  @IsOptional()
  @IsString()
  keywords?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(ServiceType, { each: true })
  serviceTypes?: ServiceType[];

  @IsOptional()
  @IsEnum(AnimalType)
  animalType?: AnimalType;

  @IsOptional()
  @IsArray()
  @IsEnum(AnimalSize, { each: true })
  animalSizes?: AnimalSize[];
}
