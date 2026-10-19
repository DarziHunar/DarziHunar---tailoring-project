import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsInt,
    IsObject,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
    MinLength,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    garmentType: string;

    @IsObject()
    measurements: Record<string, unknown>;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    notes?: string;

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(10)
    @IsString({ each: true })
    referenceImages?: string[];

    @IsInt()
    @Min(1)
    @Max(20)
    quantity: number;
}

export class CreateOrderDto {
    @IsInt()
    @Min(1)
    tailorId: number;

    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(10)
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items: CreateOrderItemDto[];
}