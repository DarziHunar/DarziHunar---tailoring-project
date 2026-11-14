import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { CompleteProfileImageDto } from './dto/complete-profile-image.dto';
import { MediaService } from './media.service';

@Controller('users/me')
@UseGuards(AuthGuard)
export class ProfileMediaController {
  constructor(private readonly mediaService: MediaService) { }

  @Post('profile-image/upload-url')
  createProfileImageUploadUrl(@Req() req: any, @Body() dto: CreateUploadUrlDto) {
    return this.mediaService.createUserProfileImageUploadUrl(Number(req.user.sub), dto.fileName, dto.contentType);
  }

  @Post('profile-image/complete')
  completeProfileImageUpload(@Req() req: any, @Body() dto: CompleteProfileImageDto) {
    return this.mediaService.completeUserProfileImageUpload(Number(req.user.sub), dto.key);
  }

  @Get('profile-image')
  getProfileImageUrl(@Req() req: any) {
    return this.mediaService.getUserProfileImageUrl(Number(req.user.sub));
  }

  @Post('order-reference/upload-url')
  createOrderReferenceUploadUrl(@Req() req: any, @Body() dto: CreateUploadUrlDto) {
    return this.mediaService.createOrderReferenceUploadUrl(Number(req.user.sub), dto.fileName, dto.contentType);
  }
}