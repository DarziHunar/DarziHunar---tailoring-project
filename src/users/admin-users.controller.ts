
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
    BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';

import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { Role } from '../generated/prisma/enums';

import { AdminUpdateRoleDto } from './dto/admin-update-role.dto';
import { UsersService } from './users.service';

type AuthenticatedRequest = Request & {
    user: {
        sub: number;
        email: string;
        role: Role;
    };
};

@Controller('admin/users')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminUsersController {
    constructor(private readonly usersService: UsersService) { }

    // GET /admin/users
    @Get()
    findAll() {
        return this.usersService.adminFindAll();
    }

    // GET /admin/users/5
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.usersService.adminFindOne(id);
    }

    // PATCH /admin/users/5/role
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

    // DELETE /admin/users/5
    @Delete(':id')
    remove(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: AuthenticatedRequest,
    ) {
        return this.usersService.adminRemove(id, req.user.sub);
    }

    // DELETE /admin/users
    // Deletes all non-admin users and their dependent records.
    @Delete()
    deleteAllNonAdminUsers(
        @Body('confirmation') confirmation: string,
        @Req() req: AuthenticatedRequest,
    ) {
        if (confirmation !== 'DELETE ALL NON-ADMIN USERS') {
            throw new BadRequestException(
                'Confirmation must be DELETE ALL NON-ADMIN USERS',
            );
        }

        return this.usersService.adminDeleteAllNonAdminUsers(
            confirmation,
            req.user.sub,
        );
    }
}
