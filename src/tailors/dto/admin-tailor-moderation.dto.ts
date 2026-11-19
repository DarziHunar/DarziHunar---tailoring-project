import { IsBoolean, IsOptional } from 'class-validator';

export class AdminTailorModerationDto {
  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @IsOptional()
  @IsBoolean()
  acceptingOrders?: boolean;
}
