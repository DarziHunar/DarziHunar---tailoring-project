
import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { MeasurementsService } from './measurements.service';
import { CreateMeasurementDto } from './dto/create-measurement.dto';
import { UpdateMeasurementDto } from './dto/update-measurement.dto';

@Controller('measurements')
@UseGuards(AuthGuard)
export class MeasurementsController {
    constructor(
        private readonly measurementsService: MeasurementsService,
    ) { }

    @Post()
    create(@Req() req: any, @Body() dto: CreateMeasurementDto) {
        return this.measurementsService.create(
            Number(req.user.sub),
            dto,
        );
    }

    @Get()
    findAll(@Req() req: any) {
        return this.measurementsService.findAll(
            Number(req.user.sub),
        );
    }

    @Get(':id')
    findById(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: any,
    ) {
        return this.measurementsService.findById(
            id,
            Number(req.user.sub),
        );
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: any,
        @Body() dto: UpdateMeasurementDto,
    ) {
        return this.measurementsService.update(
            id,
            Number(req.user.sub),
            dto,
        );
    }

    @Delete(':id')
    remove(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: any,
    ) {
        return this.measurementsService.remove(
            id,
            Number(req.user.sub),
        );
    }
}
