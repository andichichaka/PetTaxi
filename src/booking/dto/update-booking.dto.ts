import { IsOptional, IsEnum, IsDateString, IsString, IsArray } from 'class-validator';
import { AnimalType } from '../../posts/enum/animal-type.enum';
import { AnimalSize } from '../../posts/enum/animal-size.enum';

export class UpdateBookingDto {
  @IsOptional()
  @IsEnum(AnimalType)
  animalType?: AnimalType;

  @IsOptional()
  @IsEnum(AnimalSize)
  animalSize?: AnimalSize;

  @IsOptional()
  @IsArray()
  @IsDateString()
  bookingDates?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}
