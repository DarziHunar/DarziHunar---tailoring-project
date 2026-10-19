import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { AdminReviewsController } from './admin-reviews.controller';

@Module({
    imports: [AuthModule],
    controllers: [ReviewsController, AdminReviewsController],
    providers: [ReviewsService],
    exports: [ReviewsService],
})
export class ReviewsModule { }