import {
    IsArray,
    IsBoolean,
    IsNumber,
    IsOptional,
    IsString,
    Min,
    Max,
} from 'class-validator';

export class CreateTailorDto {
    @IsString()
    shopName: string;

    @IsOptional()
    @IsString()
    bio?: string;

    @IsArray()
    @IsString({ each: true })
    categories: string[];

    @IsNumber()
    latitude: number;

    @IsNumber()
    longitude: number;

    @IsOptional()
    @IsBoolean()
    verified?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(5)
    rating?: number;
}