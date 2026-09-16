import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';

import { MediaService } from './media.service';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';

@Controller('tailors')
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
  ) {}

  @Post(':id/portfolio/upload-url')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('TAILOR')
  createUploadUrl(
    @Param('id', ParseIntPipe) tailorId: number,
    @Req() req: any,
    @Body() dto: CreateUploadUrlDto,
  ) {
    return this.mediaService.createUploadUrl(
      tailorId,
      req.user.sub,
      dto.fileName,
      dto.contentType,
    );
  }

  @Get(':id/portfolio')
  getPortfolio(
    @Param('id', ParseIntPipe) tailorId: number,
  ) {
    return this.mediaService.getPortfolio(tailorId);
  }

  @Delete(':id/portfolio/:imageId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('TAILOR')
  deletePortfolioImage(
    @Param('id', ParseIntPipe) tailorId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @Req() req: any,
  ) {
    return this.mediaService.deletePortfolioImage(
      tailorId,
      req.user.sub,
      imageId,
    );
  }
}
