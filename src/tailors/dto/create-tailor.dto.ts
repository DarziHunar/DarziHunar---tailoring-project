import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  IsNotEmpty,
} from 'class-validator';

export class CreateTailorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  shopName: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @IsArray()
  @IsString({ each: true })
  categories: string[];

  // Coordinates are optional during initial onboarding. A profile without
  // coordinates will not appear in radius-based nearby searches.
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(80)
  experienceYears?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  specialization?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  startingPrice?: number;

  @IsOptional()
  @IsBoolean()
  acceptingOrders?: boolean;
}
