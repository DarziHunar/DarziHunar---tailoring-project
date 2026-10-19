
import {
    IsIn,
    IsObject,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';

export const GARMENT_TYPES = [
    'SHIRT',
    'TROUSERS',
    'KURTA',
    'SHERWANI',
    'DRESS',
    'BLOUSE',
] as const;

export class CreateMeasurementDto {
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    name: string;

    @IsIn(GARMENT_TYPES)
    garmentType: (typeof GARMENT_TYPES)[number];

    @IsObject()
    measurements: Record<string, number>;

    @IsOptional()
    @IsIn(['cm'])
    unit?: string;
}
