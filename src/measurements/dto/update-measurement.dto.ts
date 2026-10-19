
import {
    IsIn,
    IsObject,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';
import { GARMENT_TYPES } from './create-measurement.dto';

export class UpdateMeasurementDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    name?: string;

    @IsOptional()
    @IsIn(GARMENT_TYPES)
    garmentType?: (typeof GARMENT_TYPES)[number];

    @IsOptional()
    @IsObject()
    measurements?: Record<string, number>;

    @IsOptional()
    @IsIn(['cm'])
    unit?: string;
}
