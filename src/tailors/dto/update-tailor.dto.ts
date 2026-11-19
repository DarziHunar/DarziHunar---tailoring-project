import { Transform } from 'class-transformer';
import { StyleAudience } from '../../generated/prisma/enums';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

function normalizeAudienceInput(value: unknown): unknown {
  if (value === undefined || value === null) return value;
  if (Array.isArray(value)) {
    return value.map((item) => typeof item === 'string' ? item.trim().toUpperCase() : item);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map((item) => typeof item === 'string' ? item.trim().toUpperCase() : item);
    } catch { /* treat as a comma-separated list below */ }
    return trimmed.split(/[,;|]/).map((item) => item.trim().toUpperCase()).filter(Boolean);
  }
  return value;
}

export class UpdateTailorDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  shopName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @Transform(({ value }) => normalizeAudienceInput(value))
  @IsArray({ message: 'audiences must be an array.' })
  @ArrayNotEmpty({ message: 'Select at least one customer audience, or omit audiences to leave it unchanged.' })
  @IsEnum(StyleAudience, { each: true, message: 'Each audience must be WOMEN, MEN, TEENAGERS or CHILDREN.' })
  audiences?: StyleAudience[];

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
  @IsBoolean()
  acceptingOrders?: boolean;
}
