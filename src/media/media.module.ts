import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { MediaController } from './media.controller';
import { ProfileMediaController } from './profile-media.controller';
import { MediaService } from './media.service';

@Module({
  imports: [AuthModule],
  controllers: [MediaController, ProfileMediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}