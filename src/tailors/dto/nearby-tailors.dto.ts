import {
  IsBooleanString,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class NearbyTailorsDto {
  @IsNumberString()
  lat: string;

  @IsNumberString()
  lng: string;

  @IsOptional()
  @IsNumberString()
  radius?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumberString()
  minRating?: string;

  @IsOptional()
  @IsBooleanString()
  verified?: string;

  @IsOptional()
  @IsBooleanString()
  acceptingOrders?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsNumberString()
  offset?: string;

  @IsOptional()
  @IsIn(['nearest', 'rating'])
  sort?: 'nearest' | 'rating';
}
