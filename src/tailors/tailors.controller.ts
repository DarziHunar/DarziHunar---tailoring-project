import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';

import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { TailorsService } from './tailors.service';
import { CreateTailorDto } from './dto/create-tailor.dto';
import { UpdateTailorDto } from './dto/update-tailor.dto';
import { NearbyTailorsDto } from './dto/nearby-tailors.dto';

@Controller('tailors')
export class TailorsController {
    constructor(private readonly tailorsService: TailorsService) { }

    // Public catalogue endpoints. They return only profiles accepting orders.
    @Get('categories')
    findCategories() {
        return this.tailorsService.findCategories();
    }

    @Get('by-category')
    findByCategory(@Query('category') category?: string) {
        if (!category?.trim()) throw new BadRequestException('category query parameter is required');
        return this.tailorsService.findByCategory(category);
    }

    @Get('nearby')
    findNearby(@Query() dto: NearbyTailorsDto) {
        return this.tailorsService.findNearby(dto);
    }

    @Get('me')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('TAILOR')
    findMine(@Req() req: any) {
        return this.tailorsService.findMine(req.user.sub);
    }

    @Get()
    findAll() {
        return this.tailorsService.findAll();
    }

    @Get(':id')
    findById(@Param('id', ParseIntPipe) id: number) {
        return this.tailorsService.findById(id);
    }

    @Post()
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('TAILOR')
    create(@Req() req: any, @Body() dto: CreateTailorDto) {
        return this.tailorsService.create(req.user.sub, dto);
    }

    @Patch(':id')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('TAILOR')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: any,
        @Body() dto: UpdateTailorDto,
    ) {
        return this.tailorsService.update(id, req.user.sub, dto);
    }

    @Delete(':id')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('TAILOR')
    remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.tailorsService.remove(id, req.user.sub);
    }
}
