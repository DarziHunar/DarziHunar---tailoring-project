
import {
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Delete,
    UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { Role } from '../generated/prisma/enums';

import { MeasurementsService } from './measurements.service';

@Controller('admin/measurements')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminMeasurementsController {
    constructor(
        private readonly measurementsService: MeasurementsService,
    ) { }

    @Get()
    findAll() {
        return this.measurementsService.adminFindAll();
    }

    @Get(':id')
    findById(@Param('id', ParseIntPipe) id: number) {
        return this.measurementsService.adminFindById(id);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.measurementsService.adminRemove(id);
    }
}
