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

interface AuthenticatedUser {
    sub: number;
    email: string;
    role: Role;
}

@Injectable()
export class OrdersService {
    constructor(private readonly prisma: PrismaService) { }

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
        if (
            !Number.isSafeInteger(tailor.startingPrice) ||
            tailor.startingPrice <= 0
        ) {
            throw new BadRequestException(
                'This tailor has not configured a valid starting price. Please contact the tailor.',
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
            unitPrice: tailor.startingPrice,
            audience: item.audience as StyleAudience | undefined,
            fabric: item.fabric?.trim() || null,
            sizeLabel: item.sizeLabel?.trim() || null,
            measurementMethod: (item.measurementMethod || 'MANUAL') as MeasurementMethod,
            measurementUnit: item.measurementUnit || 'cm',
            styleName: item.garmentType.trim(),
        }));

        const totalAmount = items.reduce(
            (total, item) => total + item.unitPrice * item.quantity,
            0,
        );

        if (!Number.isSafeInteger(totalAmount) || totalAmount <= 0) {
            throw new BadRequestException(
                'The calculated order amount is invalid',
            );
        }

        return this.prisma.order.create({
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
                        startingPrice: true,
                    },
                },
            },
        });
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
                    payments: { some: { status: 'SUCCESS' } },
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
            include: { tailor: true },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        await this.assertCanAccess(order, user);

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

        return this.prisma.order.update({
            where: { id },
            data: { status: newStatus },
            include: this.orderInclude(),
        });
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
        };
    }
}