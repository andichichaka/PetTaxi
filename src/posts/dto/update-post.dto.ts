import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayNotEmpty,
  IsNotEmpty,
} from 'class-validator';
import { ServiceType } from '../enum/service-type.enum';
import { AnimalType } from '../enum/animal-type.enum';
import { AnimalSize } from '../enum/animal-size.enum';
import { Type } from 'class-transformer';
import { UpdateServiceDto } from './update-service.dto';

export class UpdatePostDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateServiceDto)
  @IsOptional()
  services?: UpdateServiceDto[];

  @IsEnum(AnimalType)
  @IsOptional()
  animalType?: AnimalType;

  @IsArray()
  @IsOptional()
  @IsEnum(AnimalSize, { each: true })
  animalSizes?: AnimalSize[];
}
