
import {
    Controller,
    Get,
    Delete,
    Param,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { Role } from '../generated/prisma/enums';

import { TailorsService } from './tailors.service';

@Controller('admin/tailors')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminTailorsController {
    constructor(
        private readonly tailorsService: TailorsService,
    ) { }

    // Get all tailor profiles
    @Get()
    findAll() {
        return this.tailorsService.adminFindAll();
    }

    // Get a specific tailor profile
    @Get(':id')
    findOne(
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.tailorsService.findById(id);
    }


    @Delete(':id')
    remove(
        @Param('id', ParseIntPipe) id: number,
    ) {
        return this.tailorsService.adminRemove(id);
    }

}
