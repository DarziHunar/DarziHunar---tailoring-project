
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { Role } from '../generated/prisma/enums';

import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AdminUpdateRoleDto } from './dto/admin-update-role.dto';

type AuthenticatedRequest = Request & {
  user: {
    sub: number;
    email: string;
    role: Role;
  };
};

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  // GET /users
  // Only admins can list all accounts.
  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  // GET /users/:id
  // Users can view their own profile; admins can view any profile.
  @Get(':id')
  findById(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.findById(
      id,
      req.user.sub,
      req.user.role,
    );
  }

  // PATCH /users/:id
  // Users can update only their own profile.
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(
      id,
      req.user.sub,
      dto,
    );
  }

  // DELETE /users/:id
  // Users can delete their own account, subject to database constraints.
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.remove(
      id,
      req.user.sub,
    );
  }
}

@Controller('admin/users')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminUsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  // GET /admin/users
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  // GET /admin/users/:id
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.adminFindOne(id);
  }

  // PATCH /admin/users/:id/role
  @Patch(':id/role')
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateRoleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.adminUpdateRole(
      id,
      dto.role,
      req.user.sub,
    );
  }

  // DELETE /admin/users/:id
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.adminRemove(
      id,
      req.user.sub,
    );
  }

  // DELETE /admin/users
  // Requires explicit confirmation and preserves all admin accounts.
  @Delete()
  deleteAllNonAdminUsers(
    @Body('confirmation') confirmation: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.adminDeleteAllNonAdminUsers(
      confirmation,
      req.user.sub,
    );
  }
}
