// src/posts/dto/create-post.dto.ts
import { IsArray, IsEnum, IsNotEmpty, IsString, ArrayNotEmpty, ValidateNested } from 'class-validator';
import { ServiceType } from '../enum/service-type.enum';
import { AnimalType } from '../enum/animal-type.enum';
import { AnimalSize } from '../enum/animal-size.enum';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(ServiceType, { each: true })
  serviceTypes: ServiceType[];

  @IsEnum(AnimalType)
  animalType: AnimalType;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(AnimalSize, { each: true })
  animalSizes: AnimalSize[];
}
