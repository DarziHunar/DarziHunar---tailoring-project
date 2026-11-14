import { IsString, MinLength } from 'class-validator';

export class VerifyRazorpayPaymentDto {
  @IsString() @MinLength(5)
  razorpay_order_id: string;

  @IsString() @MinLength(5)
  razorpay_payment_id: string;

  @IsString() @MinLength(20)
  razorpay_signature: string;
}
