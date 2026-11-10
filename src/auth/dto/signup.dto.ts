import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class SignupDto {
  @IsString()
  @MinLength(2)
  fullName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsIn(['CUSTOMER', 'TAILOR'])
  role?: 'CUSTOMER' | 'TAILOR';

  @IsOptional()
  @IsString()
  shopName?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  experience?: number;

  @IsOptional()
  @IsString()
  specialization?: string;
}