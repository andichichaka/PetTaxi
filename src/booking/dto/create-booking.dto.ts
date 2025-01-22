import { IsNotEmpty, IsEnum, IsNumber, IsDateString, IsString, IsOptional, IsArray } from 'class-validator';
import { AnimalType } from '../../posts/enum/animal-type.enum';
import { AnimalSize } from '../../posts/enum/animal-size.enum';

export class CreateBookingDto {
    @IsNotEmpty()
    @IsNumber()
    serviceId: number;
  
    @IsNotEmpty()
    @IsEnum(AnimalType)
    animalType: AnimalType;
  
    @IsNotEmpty()
    @IsEnum(AnimalSize)
    animalSize: AnimalSize;
  
    @IsOptional()
    @IsArray()
    @IsArray()
    @IsDateString()
    bookingDates?: string[];
  
    @IsOptional()
    @IsString()
    notes?: string;
  }
  