import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Role, OrderStatus, StyleAudience, MeasurementMethod, PaymentStatus } from '../generated/prisma/enums';
import { CreateOrderDto } from './dto/create-order.dto';
import { SetOrderQuoteDto } from './dto/set-order-quote-dto';
import { NotificationsService } from '../notifications/notifications.service';

interface AuthenticatedUser {
    sub: number;
    email: string;
    role: Role;
}

@Injectable()
export class OrdersService {
    constructor(private readonly prisma: PrismaService, private readonly notifications: NotificationsService) { }

    async create(customer: AuthenticatedUser, dto: CreateOrderDto) {
        if (customer.role !== Role.CUSTOMER) {
            throw new ForbiddenException(
                'Only customers can place orders',
            );
        }

        const tailor = await this.prisma.tailor.findUnique({
            where: { id: dto.tailorId },
        });

        if (!tailor) {
            throw new NotFoundException('Tailor profile not found');
        }

        if (!tailor.acceptingOrders) {
            throw new BadRequestException(
                'This tailor is not accepting orders',
            );
        }
        if (tailor.userId === customer.sub) {
            throw new BadRequestException(
                'You cannot place an order with your own tailor profile',
            );
        }

        for (const item of dto.items) {
            if (!item.fabric?.trim() || !item.sizeLabel?.trim()) {
                throw new BadRequestException('Fabric and size/fit are required for every order item');
            }
            const entries = Object.entries(item.measurements ?? {});
            if (entries.length === 0 || entries.some(([key, value]) =>
                !key.trim() || typeof value !== 'number' || !Number.isFinite(value) || value <= 0
            )) {
                throw new BadRequestException('Measurements must contain positive numeric values');
            }
            const references = item.referenceImages ?? [];
            if (references.some((key) => !key.startsWith(`users/${customer.sub}/order-references/`))) {
                throw new BadRequestException('An order reference image does not belong to this customer');
            }
        }

        const items = dto.items.map((item) => ({
            garmentType: item.garmentType.trim(),
            measurements: item.measurements as any,
            notes: item.notes?.trim() || null,
            referenceImages: item.referenceImages ?? [],
            quantity: item.quantity,
            // The tailor sets a final order quote after reviewing the request.
            unitPrice: 0,
            audience: item.audience as StyleAudience | undefined,
            fabric: item.fabric?.trim() || null,
            sizeLabel: item.sizeLabel?.trim() || null,
            garmentColor: item.garmentColor?.trim() || null,
            designType: item.designType?.trim() || null,
            measurementMethod: (item.measurementMethod || 'MANUAL') as MeasurementMethod,
            measurementUnit: item.measurementUnit || 'cm',
            styleName: item.garmentType.trim(),
        }));

        // No payment amount is assigned until the tailor submits a final quote.
        const totalAmount = 0;

        const createdOrder = await this.prisma.order.create({
            data: {
                customerId: customer.sub,
                tailorId: tailor.id,
                totalAmount,
                deliveryDetails: {
                    fullName: dto.deliveryDetails.fullName,
                    phone: dto.deliveryDetails.phone,
                    addressLine1: dto.deliveryDetails.addressLine1,
                    ...(dto.deliveryDetails.addressLine2 && {
                        addressLine2: dto.deliveryDetails.addressLine2,
                    }),
                    city: dto.deliveryDetails.city,
                    state: dto.deliveryDetails.state,
                    postalCode: dto.deliveryDetails.postalCode,
                    country: dto.deliveryDetails.country ?? 'India',
                } satisfies Prisma.InputJsonObject,
                items: {
                    create: items,
                },
            },
            include: {
                items: true,
                tailor: {
                    select: {
                        id: true,
                        shopName: true,
                    },
                },
            },
        });
        await Promise.all([
            this.notifications.createSafely(
                customer.sub,
                'Order request placed',
                `Your request #${createdOrder.id} has been sent to ${tailor.shopName}. The tailor will review it and send a final quote.`,
                'ORDER_PLACED',
                { orderId: createdOrder.id },
            ),
            this.notifications.createSafely(
                tailor.userId,
                'New order request',
                `You received a new request #${createdOrder.id}. Review the customer's design and measurements and send a quote.`,
                'NEW_ORDER',
                { orderId: createdOrder.id },
            ),
        ]);
        return createdOrder;
    }

    async setQuote(id: number, dto: SetOrderQuoteDto, user: AuthenticatedUser) {
        if (user.role !== Role.TAILOR) {
            throw new ForbiddenException('Only the assigned tailor can submit an order quote');
        }
        if (!Number.isSafeInteger(dto.amount) || dto.amount <= 0 || dto.amount > 10_000_000) {
            throw new BadRequestException('Enter a valid final quote between ₹1 and ₹1,00,00,000');
        }

        const order = await this.prisma.order.findUnique({
            where: { id },
            include: { tailor: true, payments: true },
        });
        if (!order) throw new NotFoundException('Order not found');
        await this.assertCanAccess(order, user);
        if (order.status !== OrderStatus.PENDING) {
            throw new BadRequestException('A quote can only be submitted for a new pending request');
        }
        if (order.payments.some((payment) => payment.status === PaymentStatus.SUCCESS)) {
            throw new BadRequestException('This order has already been paid');
        }

        const updatedOrder = await this.prisma.order.update({
            where: { id },
            data: {
                totalAmount: dto.amount,
                status: OrderStatus.ACCEPTED,
            },
            include: this.orderInclude(),
        });
        await this.notifications.createSafely(
            order.customerId,
            'Your tailor sent a quote',
            `Your order #${order.id} has a final quote of ₹${dto.amount.toLocaleString('en-IN')}. Open My Orders to review and pay securely.`,
            'QUOTE_READY',
            { orderId: order.id },
        );
        return updatedOrder;
    }

    async findAll(user: AuthenticatedUser) {
        if (user.role === Role.CUSTOMER) {
            return this.prisma.order.findMany({
                where: { customerId: user.sub, payments: { some: { status: 'SUCCESS' } } },
                include: this.orderInclude(),
                orderBy: { createdAt: 'desc' },
            });
        }

        if (user.role === Role.TAILOR) {
            return this.prisma.order.findMany({
                where: {
                    tailor: { userId: user.sub },
                },
                include: this.orderInclude(),
                orderBy: { createdAt: 'desc' },
            });
        }

        if (user.role === Role.ADMIN) {
            return this.prisma.order.findMany({
                include: this.orderInclude(),
                orderBy: { createdAt: 'desc' },
            });
        }

        throw new ForbiddenException('Role is not permitted');
    }

    // Customer recovery: orders created before checkout that do not yet have a successful payment.
    async findPendingPayment(user: AuthenticatedUser) {
        if (user.role !== Role.CUSTOMER) {
            throw new ForbiddenException('Only customers can view their pending payments');
        }

        return this.prisma.order.findMany({
            where: {
                customerId: user.sub,
                status: { notIn: [OrderStatus.CANCELLED, OrderStatus.REJECTED] },
                payments: { none: { status: PaymentStatus.SUCCESS } },
            },
            include: this.orderInclude(),
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: number, user: AuthenticatedUser) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: this.orderInclude(),
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        await this.assertCanAccess(order, user);

        return order;
    }

    async updateStatus(
        id: number,
        newStatus: OrderStatus,
        user: AuthenticatedUser,
    ) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: { tailor: true, payments: true },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        await this.assertCanAccess(order, user);

        if (user.role === Role.TAILOR && newStatus === OrderStatus.IN_PROGRESS &&
            !order.payments.some((payment) => payment.status === PaymentStatus.SUCCESS)) {
            throw new BadRequestException('The customer must complete Razorpay payment before work can begin');
        }

        if (
            !this.canTransition(
                order.status,
                newStatus,
                user.role,
            )
        ) {
            throw new BadRequestException(
                `Status transition from ${order.status} to ${newStatus} is not allowed for your role`,
            );
        }

        const updatedOrder = await this.prisma.order.update({
            where: { id },
            data: { status: newStatus },
            include: this.orderInclude(),
        });
        if (user.role !== Role.CUSTOMER) {
            await this.notifications.createSafely(
                order.customerId,
                'Order status updated',
                `Your order #${order.id} is now ${newStatus.replace(/_/g, ' ').toLowerCase()}. Open My Orders for details.`,
                'ORDER_STATUS',
                { orderId: order.id, status: newStatus },
            );
        }
        return updatedOrder;
    }


    // Admin: Get all orders
    async adminFindAll() {
        return this.prisma.order.findMany({
            include: this.orderInclude(),
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    // Admin: Get a specific order
    async adminFindById(id: number) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: this.orderInclude(),
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return order;
    }

    // Admin: Update order status
    async adminUpdateStatus(
        id: number,
        newStatus: OrderStatus,
    ) {
        const admin: AuthenticatedUser = {
            sub: 0,
            email: '',
            role: Role.ADMIN,
        };

        return this.updateStatus(id, newStatus, admin);
    }


    private async assertCanAccess(
        order: {
            customerId: number;
            tailor: { userId: number };
        },
        user: AuthenticatedUser,
    ) {
        if (user.role === Role.ADMIN) {
            return;
        }

        if (
            user.role === Role.CUSTOMER &&
            order.customerId === user.sub
        ) {
            return;
        }

        if (
            user.role === Role.TAILOR &&
            order.tailor.userId === user.sub
        ) {
            return;
        }

        throw new ForbiddenException(
            'You do not have access to this order',
        );
    }

    private canTransition(
        current: OrderStatus,
        next: OrderStatus,
        role: Role,
    ): boolean {
        const transitions: Record<
            OrderStatus,
            Partial<Record<Role, OrderStatus[]>>
        > = {
            PENDING: {
                CUSTOMER: [OrderStatus.CANCELLED],
                TAILOR: [
                    OrderStatus.ACCEPTED,
                    OrderStatus.REJECTED,
                ],
                ADMIN: [
                    OrderStatus.ACCEPTED,
                    OrderStatus.REJECTED,
                    OrderStatus.CANCELLED,
                ],
            },
            ACCEPTED: {
                TAILOR: [OrderStatus.IN_PROGRESS],
                ADMIN: [
                    OrderStatus.IN_PROGRESS,
                    OrderStatus.CANCELLED,
                ],
            },
            REJECTED: {},
            IN_PROGRESS: {
                TAILOR: [OrderStatus.READY],
                ADMIN: [
                    OrderStatus.READY,
                    OrderStatus.CANCELLED,
                ],
            },
            READY: {
                CUSTOMER: [OrderStatus.COMPLETED],
                TAILOR: [OrderStatus.IN_PROGRESS],
                ADMIN: [
                    OrderStatus.COMPLETED,
                    OrderStatus.IN_PROGRESS,
                ],
            },
            COMPLETED: {},
            CANCELLED: {},
        };

        return (
            transitions[current][role]?.includes(next) ?? false
        );
    }

    private orderInclude() {
        return {
            items: true,
            tailor: {
                select: {
                    id: true,
                    shopName: true,
                    userId: true,
                },
            },
            customer: {
                select: {
                    id: true,
                    email: true,
                },
            },
            payments: { select: { status: true, amount: true, currency: true, method: true, createdAt: true } },
        };
    }
}