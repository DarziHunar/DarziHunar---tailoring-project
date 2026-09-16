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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';

import { TailorsService } from './tailors.service';
import { CreateTailorDto } from './dto/create-tailor.dto';
import { UpdateTailorDto } from './dto/update-tailor.dto';
import { Query } from '@nestjs/common';
import { NearbyTailorsDto } from './dto/nearby-tailors.dto';

@Controller('tailors')
export class TailorsController {
    constructor(private readonly tailorsService: TailorsService) { }

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

    @Get('nearby')
    findNearby(@Query() dto: NearbyTailorsDto) {
        return this.tailorsService.findNearby(dto);
    }
    @Get(':id')
    findById(@Param('id', ParseIntPipe) id: number) {
        return this.tailorsService.findById(id);
    }
}