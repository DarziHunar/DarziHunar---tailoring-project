
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

import { ReviewsService } from './reviews.service';

@Controller('admin/reviews')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminReviewsController {
    constructor(
        private readonly reviewsService: ReviewsService,
    ) { }

    @Get()
    findAll() {
        return this.reviewsService.adminFindAll();
    }

    @Get(':id')
    findById(@Param('id', ParseIntPipe) id: number) {
        return this.reviewsService.adminFindById(id);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.reviewsService.adminRemove(id);
    }
}
