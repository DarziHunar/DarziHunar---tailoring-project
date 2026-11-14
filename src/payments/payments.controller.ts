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
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyRazorpayPaymentDto } from './dto/verify-razorpay-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(AuthGuard)
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post()
    create(@Req() req: any, @Body() dto: CreatePaymentDto) {
        return this.paymentsService.create(req.user, dto);
    }

    @Post('razorpay/order')
    createRazorpayOrder(@Req() req: any, @Body() dto: CreatePaymentDto) {
        return this.paymentsService.createRazorpayOrder(req.user, dto);
    }

    @Post('razorpay/verify')
    verifyRazorpayPayment(@Req() req: any, @Body() dto: VerifyRazorpayPaymentDto) {
        return this.paymentsService.verifyRazorpayPayment(req.user, dto);
    }

    @Get('my')
    findMyPayments(@Req() req: any) {
        return this.paymentsService.findMyPayments(req.user);
    }

    @Get(':id')
    findById(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: any,
    ) {
        return this.paymentsService.findById(id, req.user);
    }
}