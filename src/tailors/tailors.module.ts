
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { TailorsController } from './tailors.controller';
import { AdminTailorsController } from './admin-tailors.controller';
import { TailorsService } from './tailors.service';

@Module({
  imports: [AuthModule],

  controllers: [
    TailorsController,
    AdminTailorsController,
  ],

  providers: [TailorsService],

  exports: [TailorsService],
})
export class TailorsModule { }