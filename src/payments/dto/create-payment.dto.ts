import { IsEnum, IsInt, Min } from 'class-validator';
import { PaymentMethod } from '../../generated/prisma/enums';

export class CreatePaymentDto {
    @IsInt()
    @Min(1)
    orderId: number;

    @IsEnum(PaymentMethod)
    method: PaymentMethod;
}