// src/posts/dto/create-post.dto.ts
import { IsArray, IsEnum, IsNotEmpty, IsString, ArrayNotEmpty, ValidateNested } from 'class-validator';
import { ServiceType } from '../enum/service-type.enum';
import { AnimalType } from '../enum/animal-type.enum';
import { AnimalSize } from '../enum/animal-size.enum';

export class CreatePostDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  imagesUrl?: string[];

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @IsEnum(AnimalType)
  animalType: AnimalType;

  @IsEnum(AnimalSize)
  animalSize: AnimalSize;
}
