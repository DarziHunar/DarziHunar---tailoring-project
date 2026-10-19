import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '../auth/guards/auth.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('orders')
@UseGuards(AuthGuard)
export class OrdersController {
    constructor(
        private readonly ordersService: OrdersService,
    ) { }

    @Post()
    create(@Req() req: any, @Body() dto: CreateOrderDto) {
        return this.ordersService.create(req.user, dto);
    }

    @Get()
    findAll(@Req() req: any) {
        return this.ordersService.findAll(req.user);
    }

    @Get(':id')
    findById(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: any,
    ) {
        return this.ordersService.findById(id, req.user);
    }

    @Patch(':id/status')
    updateStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateOrderStatusDto,
        @Req() req: any,
    ) {
        return this.ordersService.updateStatus(
            id,
            dto.status,
            req.user,
        );
    }
}