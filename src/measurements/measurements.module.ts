
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MeasurementsController } from './measurements.controller';
import { MeasurementsService } from './measurements.service';
import { AdminMeasurementsController } from './admin-measurements.controller';

@Module({
    imports: [AuthModule],
    controllers: [MeasurementsController, AdminMeasurementsController],
    providers: [MeasurementsService],
    exports: [MeasurementsService],
})
export class MeasurementsModule { }
