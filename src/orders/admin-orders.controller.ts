
import {
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Body,
    UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { Role } from '../generated/prisma/enums';

import { OrdersService } from './orders.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('admin/orders')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminOrdersController {
    constructor(
        private readonly ordersService: OrdersService,
    ) { }

    @Get()
    findAll() {
        return this.ordersService.adminFindAll();
    }

    @Get(':id')
    findById(@Param('id', ParseIntPipe) id: number) {
        return this.ordersService.adminFindById(id);
    }

    @Patch(':id/status')
    updateStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateOrderStatusDto,
    ) {
        return this.ordersService.adminUpdateStatus(id, dto.status);
    }
}
