import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsObject, IsOptional,
  IsString, Max, MaxLength, Min, MinLength, ValidateNested, Matches, IsDefined,
} from 'class-validator';
import { Type } from 'class-transformer';

const AUDIENCES = ['WOMEN', 'MEN', 'TEENAGERS', 'CHILDREN'];
const MEASUREMENT_METHODS = ['MANUAL', 'CAMERA_ASSISTED'];

export class CreateOrderItemDto {
  @IsString() @MinLength(1) @MaxLength(100)
  garmentType: string;

  @IsObject()
  measurements: Record<string, unknown>;

  @IsOptional() @IsIn(AUDIENCES)
  audience?: string;

  @IsOptional() @IsString() @MaxLength(100)
  fabric?: string;

  @IsOptional() @IsString() @MaxLength(30)
  sizeLabel?: string;

  @IsOptional() @IsIn(MEASUREMENT_METHODS)
  measurementMethod?: string;

  @IsOptional() @IsIn(['cm', 'in'])
  measurementUnit?: string;

  @IsOptional() @IsString() @MaxLength(1000)
  notes?: string;

  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true })
  referenceImages?: string[];

  @IsInt() @Min(1) @Max(20)
  quantity: number;
}


export class DeliveryDetailsDto {
  @IsString() @MinLength(2) @MaxLength(100)
  fullName: string;

  @IsString()
  @Matches(/^\+?[0-9][0-9\s-]{7,15}$/)
  phone: string;

  @IsString() @MinLength(4) @MaxLength(180)
  addressLine1: string;

  @IsOptional() @IsString() @MaxLength(180)
  addressLine2?: string;

  @IsString() @MinLength(2) @MaxLength(100)
  city: string;

  @IsString() @MinLength(2) @MaxLength(100)
  state: string;

  @IsString() @Matches(/^[A-Za-z0-9 -]{3,12}$/)
  postalCode: string;

  @IsOptional() @IsString() @MaxLength(80)
  country?: string;
}

export class CreateOrderDto {
  @IsInt() @Min(1)
  tailorId: number;

  @IsDefined() @ValidateNested() @Type(() => DeliveryDetailsDto)
  deliveryDetails: DeliveryDetailsDto;

  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(10)
  @ValidateNested({ each: true }) @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
