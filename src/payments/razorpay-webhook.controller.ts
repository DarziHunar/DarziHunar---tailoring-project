import {
    Controller,
    Headers,
    HttpCode,
    Post,
    Req,
    ServiceUnavailableException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments/razorpay')
export class RazorpayWebhookController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Post('webhook')
    @HttpCode(200)
    handle(
        @Req() request: { rawBody?: Buffer },
        @Headers('x-razorpay-signature') signature?: string,
    ) {
        if (!request.rawBody) {
            throw new ServiceUnavailableException(
                'Raw request body is unavailable. Enable rawBody in NestFactory.create().',
            );
        }
        return this.paymentsService.handleRazorpayWebhook(request.rawBody, signature);
    }
}
