import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { Role, OrderStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

interface AuthenticatedUser {
    sub: number;
    email: string;
    role: Role;
}

@Injectable()
export class PaymentsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(user: AuthenticatedUser, dto: CreatePaymentDto) {
        if (user.role !== Role.CUSTOMER) {
            throw new ForbiddenException(
                'Only customers can initiate payments',
            );
        }

        const order = await this.prisma.order.findUnique({
            where: { id: dto.orderId },
            include: { payments: true },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        if (order.customerId !== user.sub) {
            throw new ForbiddenException(
                'You can only pay for your own orders',
            );
        }

        if (
            order.status === OrderStatus.CANCELLED ||
            order.status === OrderStatus.REJECTED
        ) {
            throw new BadRequestException(
                'Payment is not allowed for cancelled or rejected orders',
            );
        }

        if (
            order.payments.some((payment) => payment.status === 'SUCCESS')
        ) {
            throw new BadRequestException(
                'This order already has a successful payment',
            );
        }

        if (
            !Number.isSafeInteger(order.totalAmount) ||
            order.totalAmount <= 0
        ) {
            throw new BadRequestException(
                'The order amount is invalid',
            );
        }

        return this.prisma.payment.create({
            data: {
                orderId: order.id,
                amount: order.totalAmount,
                currency: 'INR',
                method: dto.method,
                status: 'PENDING',
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
            },
        });
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