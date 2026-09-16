import { IsIn, IsString } from 'class-validator';

export class CreateUploadUrlDto {
  @IsString()
  fileName: string;

  @IsString()
  @IsIn([
    'image/jpeg',
    'image/png',
    'image/webp',
  ])
  contentType: string;
}
