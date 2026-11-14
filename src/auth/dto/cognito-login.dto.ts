import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CognitoLoginDto {
  @IsString()
  @MinLength(20)
  idToken: string;

  // Used only when Cognito creates a new local user. Existing account roles are preserved.
  @IsOptional()
  @IsIn(['CUSTOMER', 'TAILOR'])
  role?: 'CUSTOMER' | 'TAILOR';
}
