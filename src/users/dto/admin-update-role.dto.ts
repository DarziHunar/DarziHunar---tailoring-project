import { IsEnum } from 'class-validator';
import { Role } from '../../generated/prisma/enums';

export class AdminUpdateRoleDto {
  @IsEnum(Role)
  role: Role;
}