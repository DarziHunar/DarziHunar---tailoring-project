import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '../auth/guards/auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
@UseGuards(AuthGuard)
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    @Post()
    create(@Req() req: any, @Body() dto: CreateReviewDto) {
        return this.reviewsService.create(req.user, dto);
    }

    @Get('tailor/:tailorId')
    findByTailor(
        @Param('tailorId', ParseIntPipe) tailorId: number,
    ) {
        return this.reviewsService.findByTailor(tailorId);
    }
}