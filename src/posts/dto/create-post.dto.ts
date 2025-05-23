import { IsArray, IsEnum, IsNotEmpty, IsString, ArrayNotEmpty, ValidateNested } from 'class-validator';
import { ServiceType } from '../enum/service-type.enum';
import { AnimalType } from '../enum/animal-type.enum';
import { AnimalSize } from '../enum/animal-size.enum';
import { Type } from 'class-transformer';
import { CreateServiceDto } from './create-service.dto';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  @Type(() => Number)
  location: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateServiceDto)
  services: CreateServiceDto[];

  @IsEnum(AnimalType)
  animalType: AnimalType;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(AnimalSize, { each: true })
  animalSizes: AnimalSize[];
}
