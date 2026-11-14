import { IsString, MinLength } from 'class-validator';

export class CompleteProfileImageDto {
  @IsString()
  @MinLength(1)
  key: string;
}
