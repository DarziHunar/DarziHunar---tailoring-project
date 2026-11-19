import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TailorsModule } from './tailors/tailors.module';
import { OrdersModule } from './orders/orders.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { MediaModule } from './media/media.module';
import { MeasurementsModule } from './measurements/measurements.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { StylesModule } from './styles/styles.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AiModule } from './ai/ai.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    TailorsModule,
    OrdersModule,
    AuthModule,
    PrismaModule,
    MediaModule,
    MeasurementsModule,
    PaymentsModule,
    ReviewsModule,
    StylesModule,
    NotificationsModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
