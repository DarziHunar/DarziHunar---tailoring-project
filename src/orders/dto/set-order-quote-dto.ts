import { IsInt, Max, Min } from 'class-validator';

export class SetOrderQuoteDto {
  // Amount is supplied in whole INR. The server converts it to paise for Razorpay.
  @IsInt()
  @Min(1)
  @Max(10000000)
  amount: number;
}
