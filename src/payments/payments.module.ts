import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { RazorpayWebhookController } from './razorpay-webhook.controller';

@Module({
    imports: [AuthModule],
    controllers: [PaymentsController, RazorpayWebhookController],
    providers: [PaymentsService],
    exports: [PaymentsService],
})
export class PaymentsModule { }