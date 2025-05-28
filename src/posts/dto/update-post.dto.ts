import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayNotEmpty,
  IsNotEmpty,
} from 'class-validator';
import { Location } from '../entities/location.entity';
import { AnimalType } from '../enum/animal-type.enum';
import { AnimalSize } from '../enum/animal-size.enum';
import { Type } from 'class-transformer';
import { UpdateServiceDto } from './update-service.dto';

export class UpdatePostDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  location?: Location;

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
