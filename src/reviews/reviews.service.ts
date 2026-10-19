import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { OrderStatus, Role } from '../generated/prisma/enums';

import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

interface AuthenticatedUser {
    sub: number;
    email: string;
    role: Role;
}

@Injectable()
export class ReviewsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(user: AuthenticatedUser, dto: CreateReviewDto) {
        if (user.role !== Role.CUSTOMER) {
            throw new ForbiddenException(
                'Only customers can submit reviews',
            );
        }

        const order = await this.prisma.order.findUnique({
            where: { id: dto.orderId },
            include: {
                review: true,
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        if (order.customerId !== user.sub) {
            throw new ForbiddenException(
                'You can only review your own orders',
            );
        }

        if (order.status !== OrderStatus.COMPLETED) {
            throw new ConflictException(
                'You can review an order only after it is completed',
            );
        }

        if (order.review) {
            throw new ConflictException(
                'This order has already been reviewed',
            );
        }

        try {
            return await this.prisma.$transaction(async (tx) => {
                const review = await tx.review.create({
                    data: {
                        orderId: order.id,
                        customerId: user.sub,
                        tailorId: order.tailorId,
                        rating: dto.rating,
                        comment: dto.comment?.trim() || null,
                    },
                    select: {
                        id: true,
                        orderId: true,
                        customerId: true,
                        tailorId: true,
                        rating: true,
                        comment: true,
                        createdAt: true,
                    },
                });

                const aggregate = await tx.review.aggregate({
                    where: {
                        tailorId: order.tailorId,
                    },
                    _avg: {
                        rating: true,
                    },
                });

                await tx.tailor.update({
                    where: {
                        id: order.tailorId,
                    },
                    data: {
                        rating: aggregate._avg.rating ?? 0,
                    },
                });

                return review;
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new ConflictException(
                    'This order has already been reviewed',
                );
            }

            throw error;
        }
    }

    async findByTailor(tailorId: number) {
        const tailor = await this.prisma.tailor.findUnique({
            where: { id: tailorId },
            select: { id: true },
        });

        if (!tailor) {
            throw new NotFoundException('Tailor not found');
        }

        const [reviews, aggregate] = await Promise.all([
            this.prisma.review.findMany({
                where: { tailorId },
                select: {
                    id: true,
                    orderId: true,
                    rating: true,
                    comment: true,
                    createdAt: true,
                    customer: {
                        select: {
                            id: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            this.prisma.review.aggregate({
                where: { tailorId },
                _avg: {
                    rating: true,
                },
                _count: {
                    _all: true,
                },
            }),
        ]);

        return {
            tailorId,
            averageRating: aggregate._avg.rating ?? 0,
            totalReviews: aggregate._count._all,
            reviews,
        };
    }
    async adminFindAll() {
        return this.prisma.review.findMany({
            include: {
                customer: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
                tailor: {
                    select: {
                        id: true,
                        shopName: true,
                    },
                },
                order: {
                    select: {
                        id: true,
                        status: true,
                        totalAmount: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async adminFindById(id: number) {
        const review = await this.prisma.review.findUnique({
            where: { id },
            include: {
                customer: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
                tailor: {
                    select: {
                        id: true,
                        shopName: true,
                    },
                },
                order: {
                    select: {
                        id: true,
                        status: true,
                        totalAmount: true,
                    },
                },
            },
        });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        return review;
    }

    async adminRemove(id: number) {
        const review = await this.prisma.review.findUnique({
            where: { id },
            select: {
                id: true,
                tailorId: true,
            },
        });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        await this.prisma.$transaction(async (tx) => {
            await tx.review.delete({
                where: { id },
            });

            const aggregate = await tx.review.aggregate({
                where: { tailorId: review.tailorId },
                _avg: { rating: true },
            });

            await tx.tailor.update({
                where: { id: review.tailorId },
                data: {
                    rating: aggregate._avg.rating ?? 0,
                },
            });
        });

        return {
            success: true,
            message: 'Review deleted successfully by admin',
            id,
        };
    }
}