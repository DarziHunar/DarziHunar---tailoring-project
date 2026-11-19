import { createHmac, timingSafeEqual } from 'crypto';
import Razorpay from 'razorpay';
import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
    ServiceUnavailableException,
    ConflictException,
} from '@nestjs/common';

import { Role, OrderStatus, PaymentMethod, PaymentStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyRazorpayPaymentDto } from './dto/verify-razorpay-payment.dto';

interface AuthenticatedUser {
    sub: number;
    email: string;
    role: Role;
}

@Injectable()
export class PaymentsService {
    private readonly razorpay: Razorpay | null;
    private readonly razorpayKeyId: string | undefined;

    constructor(private readonly prisma: PrismaService) {
        this.razorpayKeyId = process.env.RAZORPAY_KEY_ID;
        const secret = process.env.RAZORPAY_KEY_SECRET;
        this.razorpay = this.razorpayKeyId && secret
            ? new Razorpay({ key_id: this.razorpayKeyId, key_secret: secret })
            : null;
    }

    async createRazorpayOrder(user: AuthenticatedUser, dto: CreatePaymentDto) {
        if (user.role !== Role.CUSTOMER) {
            throw new ForbiddenException('Only customers can initiate payments');
        }
        if (!this.razorpay || !this.razorpayKeyId) {
            throw new ServiceUnavailableException('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the API.');
        }
        if (dto.method !== PaymentMethod.RAZORPAY) {
            throw new BadRequestException('This checkout endpoint only supports the RAZORPAY payment method');
        }

        const order = await this.prisma.order.findUnique({
            where: { id: dto.orderId },
            include: { payments: true },
        });
        if (!order) throw new NotFoundException('Order not found');
        if (order.customerId !== user.sub) throw new ForbiddenException('You can only pay for your own orders');
        if (order.status !== OrderStatus.ACCEPTED) {
            throw new BadRequestException('Razorpay payment is available after the tailor accepts your request and submits a final quote');
        }
        if (order.payments.some((payment) => payment.status === PaymentStatus.SUCCESS)) {
            throw new ConflictException('This order has already been paid');
        }
        const amountPaise = order.totalAmount * 100;
        if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
            throw new BadRequestException('The tailor has not submitted a valid quote for this order yet');
        }

        // Reuse an existing pending Razorpay order so retries do not create
        // multiple provider orders for the same quote.
        const existingPending = order.payments.find((payment) =>
            payment.status === PaymentStatus.PENDING &&
            payment.providerOrderId &&
            payment.amount === order.totalAmount &&
            payment.currency === 'INR'
        );
        if (existingPending?.providerOrderId) {
            return {
                id: existingPending.id,
                orderId: existingPending.orderId,
                amount: existingPending.amount,
                currency: existingPending.currency,
                method: existingPending.method,
                status: existingPending.status,
                keyId: this.razorpayKeyId,
                providerOrderId: existingPending.providerOrderId,
                amountPaise,
            };
        }

        const providerOrder = await this.razorpay.orders.create({
            amount: amountPaise,
            currency: 'INR',
            receipt: `dh_${order.id}_${Date.now()}`,
            notes: { darzihunarOrderId: String(order.id), customerId: String(user.sub) },
        });

        const payment = await this.prisma.payment.create({
            data: {
                orderId: order.id,
                amount: order.totalAmount,
                currency: 'INR',
                method: dto.method,
                status: PaymentStatus.PENDING,
                providerOrderId: providerOrder.id,
            },
            select: { id: true, orderId: true, amount: true, currency: true, method: true, status: true },
        });

        return {
            ...payment,
            keyId: this.razorpayKeyId,
            providerOrderId: providerOrder.id,
            amountPaise,
            currency: 'INR',
        };
    }

    async verifyRazorpayPayment(user: AuthenticatedUser, dto: VerifyRazorpayPaymentDto) {
        if (user.role !== Role.CUSTOMER) throw new ForbiddenException('Only customers can verify payments');
        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret || !this.razorpay || !this.razorpayKeyId) {
            throw new ServiceUnavailableException('Razorpay is not configured on the API');
        }

        const payment = await this.prisma.payment.findUnique({
            where: { providerOrderId: dto.razorpay_order_id },
            include: { order: { select: { id: true, customerId: true, totalAmount: true, status: true } } },
        });
        if (!payment) throw new NotFoundException('Razorpay payment order not found');
        if (payment.order.customerId !== user.sub) throw new ForbiddenException('You can only verify your own payment');
        if (payment.order.totalAmount !== payment.amount) {
            throw new ConflictException('The order quote has changed. Refresh My Orders and contact support if you were charged.');
        }
        if (payment.status === PaymentStatus.SUCCESS && payment.providerPaymentId === dto.razorpay_payment_id) {
            return { success: true, paymentId: payment.id, orderId: payment.orderId, status: payment.status };
        }
        if (payment.order.status !== OrderStatus.ACCEPTED) {
            throw new ConflictException('This order is no longer awaiting payment. Refresh My Orders or contact support if you were charged.');
        }
        if (payment.status !== PaymentStatus.PENDING && payment.status !== PaymentStatus.FAILED) {
            throw new ConflictException('This payment is no longer available for verification');
        }

        const expected = createHmac('sha256', secret)
            .update(`${dto.razorpay_order_id}|${dto.razorpay_payment_id}`)
            .digest('hex');
        const expectedBuffer = Buffer.from(expected, 'hex');
        const receivedBuffer = /^[a-f0-9]{64}$/i.test(dto.razorpay_signature)
            ? Buffer.from(dto.razorpay_signature, 'hex')
            : Buffer.alloc(0);
        if (expectedBuffer.length !== receivedBuffer.length || !timingSafeEqual(expectedBuffer, receivedBuffer)) {
            throw new BadRequestException('Razorpay payment signature verification failed');
        }

        // Confirm the provider-side payment is captured and matches our server-side order.
        // A valid checkout signature alone should not be treated as proof of captured funds.
        const providerPayment = await this.razorpay.payments.fetch(dto.razorpay_payment_id);
        if (
            providerPayment.order_id !== payment.providerOrderId ||
            providerPayment.amount !== payment.amount * 100 ||
            providerPayment.currency !== payment.currency ||
            providerPayment.status !== 'captured'
        ) {
            throw new ConflictException('Razorpay has not confirmed a captured payment for this order. Please retry or contact support.');
        }

        const updated = await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: PaymentStatus.SUCCESS,
                providerReference: dto.razorpay_payment_id,
                providerPaymentId: dto.razorpay_payment_id,
                providerSignature: dto.razorpay_signature,
            },
            select: { id: true, orderId: true, amount: true, currency: true, status: true, providerPaymentId: true },
        });
        return { success: true, payment: updated };
    }


    async handleRazorpayWebhook(rawBody: Buffer | undefined, signature: string | undefined) {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!webhookSecret) {
            throw new ServiceUnavailableException('Razorpay webhook is not configured. Set RAZORPAY_WEBHOOK_SECRET on the API.');
        }
        if (!rawBody?.length || !signature || !/^[a-f0-9]{64}$/i.test(signature)) {
            throw new BadRequestException('Missing or invalid Razorpay webhook signature');
        }

        // Razorpay signs the exact raw request bytes; parsing/re-serialising JSON first breaks verification.
        const expected = createHmac('sha256', webhookSecret).update(rawBody).digest();
        const received = Buffer.from(signature, 'hex');
        if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
            throw new ForbiddenException('Razorpay webhook signature verification failed');
        }

        let event: any;
        try {
            event = JSON.parse(rawBody.toString('utf8'));
        } catch {
            throw new BadRequestException('Invalid Razorpay webhook payload');
        }

        const eventName = typeof event?.event === 'string' ? event.event : '';
        if (!['payment.captured', 'payment.failed', 'order.paid'].includes(eventName)) {
            return { received: true, ignored: true };
        }

        const entity = event?.payload?.payment?.entity;
        const providerOrderId = entity?.order_id;
        const providerPaymentId = entity?.id;
        if (typeof providerOrderId !== 'string' || typeof providerPaymentId !== 'string') {
            throw new BadRequestException('Razorpay webhook is missing payment identifiers');
        }

        const payment = await this.prisma.payment.findUnique({
            where: { providerOrderId },
            include: { order: { select: { id: true, totalAmount: true, customerId: true } } },
        });
        if (!payment) {
            // Unknown/old Razorpay orders are acknowledged but cannot mutate an app order.
            return { received: true, ignored: true };
        }

        if (entity.amount !== payment.amount * 100 || entity.currency !== payment.currency ||
            payment.order.totalAmount !== payment.amount) {
            throw new ConflictException('Razorpay webhook amount or currency does not match the saved order quote');
        }

        if (eventName === 'payment.failed') {
            if (payment.status !== PaymentStatus.SUCCESS) {
                await this.prisma.payment.update({
                    where: { id: payment.id },
                    data: { status: PaymentStatus.FAILED },
                });
            }
            return { received: true, updated: payment.status !== PaymentStatus.SUCCESS };
        }

        if (entity.status !== 'captured' && entity.captured !== true) {
            return { received: true, ignored: true };
        }

        if (payment.status === PaymentStatus.SUCCESS && payment.providerPaymentId === providerPaymentId) {
            return { received: true, duplicate: true };
        }

        await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: PaymentStatus.SUCCESS,
                providerReference: providerPaymentId,
                providerPaymentId,
            },
        });

        return { received: true, updated: true, orderId: payment.orderId };
    }

    async create(_user: AuthenticatedUser, _dto: CreatePaymentDto) {
        // Do not allow legacy/manual payment rows: all customer payments must
        // be created as Razorpay Orders and verified against provider capture.
        throw new BadRequestException(
            'Manual payments are disabled. Use the Razorpay checkout flow.',
        );
    }

    async findMyPayments(user: AuthenticatedUser) {
        if (user.role !== Role.CUSTOMER) {
            throw new ForbiddenException(
                'Only customers can access this endpoint',
            );
        }

        return this.prisma.payment.findMany({
            where: {
                order: {
                    customerId: user.sub,
                },
            },
            select: {
                id: true,
                orderId: true,
                amount: true,
                currency: true,
                method: true,
                status: true,
                providerReference: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async findById(id: number, user: AuthenticatedUser) {
        const payment = await this.prisma.payment.findUnique({
            where: { id },
            include: {
                order: {
                    select: {
                        id: true,
                        customerId: true,
                        tailorId: true,
                    },
                },
            },
        });

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        if (
            user.role !== Role.ADMIN &&
            !(
                user.role === Role.CUSTOMER &&
                payment.order.customerId === user.sub
            )
        ) {
            throw new ForbiddenException(
                'You do not have access to this payment',
            );
        }

        return {
            id: payment.id,
            orderId: payment.orderId,
            amount: payment.amount,
            currency: payment.currency,
            method: payment.method,
            status: payment.status,
            providerReference: payment.providerReference,
            createdAt: payment.createdAt,
            updatedAt: payment.updatedAt,
        };
    }
}