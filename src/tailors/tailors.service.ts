import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTailorDto } from './dto/create-tailor.dto';
import { NearbyTailorsDto } from './dto/nearby-tailors.dto';
import { UpdateTailorDto } from './dto/update-tailor.dto';

@Injectable()
export class TailorsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(userId: number, dto: CreateTailorDto) {
        const existingTailor = await this.prisma.tailor.findUnique({
            where: { userId },
        });

        if (existingTailor) {
            throw new ConflictException(
                'Tailor profile already exists for this user',
            );
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.role !== 'TAILOR') {
            throw new ForbiddenException(
                'Only users with TAILOR role can create a tailor profile',
            );
        }

        const result = await this.prisma.$queryRaw<Array<{ id: number }>>`
    INSERT INTO "Tailor"
      (
        "userId",
        "shopName",
        "bio",
        "categories",
        "location",
        "verified",
        "rating",
        "startingPrice",
        "acceptingOrders",
        "createdAt",
        "updatedAt"
      )
    VALUES (
      ${userId},
      ${dto.shopName},
      ${dto.bio ?? null},
      ${dto.categories},
      ST_SetSRID(
        ST_MakePoint(${dto.longitude}, ${dto.latitude}),
        4326
      )::geography,
      ${dto.verified ?? false},
      ${dto.rating ?? 0},
      ${dto.startingPrice ?? 0},
      ${dto.acceptingOrders ?? true},
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
    RETURNING id;
  `;

        return this.findById(result[0].id);
    }

    async update(
        tailorId: number,
        userId: number,
        dto: UpdateTailorDto,
    ) {
        const tailor = await this.prisma.tailor.findUnique({
            where: {
                id: tailorId,
            },
        });

        if (!tailor) {
            throw new NotFoundException('Tailor profile not found');
        }

        if (tailor.userId !== userId) {
            throw new ForbiddenException(
                'You can only update your own tailor profile',
            );
        }

        const { latitude, longitude, ...regularFields } = dto;

        await this.prisma.tailor.update({
            where: {
                id: tailorId,
            },
            data: regularFields,
        });

        if (latitude !== undefined && longitude !== undefined) {
            await this.prisma.$executeRaw`
        UPDATE "Tailor"
        SET "location" =
          ST_SetSRID(
            ST_MakePoint(${longitude}, ${latitude}),
            4326
          )::geography
        WHERE "id" = ${tailorId};
      `;
        }

        return this.findById(tailorId);
    }

    async findById(tailorId: number) {
        const result = await this.prisma.$queryRaw<
            Array<{
                id: number;
                userId: number;
                shopName: string;
                bio: string | null;
                categories: string[];
                latitude: number;
                longitude: number;
                verified: boolean;
                rating: number;
                startingPrice: number;
                acceptingOrders: boolean;
                createdAt: Date;
                updatedAt: Date;
            }>
        >`
    SELECT
      id,
      "userId",
      "shopName",
      bio,
      categories,
      ST_Y(location::geometry) AS latitude,
      ST_X(location::geometry) AS longitude,
      verified,
      rating,
      "startingPrice",
      "acceptingOrders",
      "createdAt",
      "updatedAt"
    FROM "Tailor"
    WHERE id = ${tailorId};
  `;

        if (result.length === 0) {
            throw new NotFoundException('Tailor profile not found');
        }

        return result[0];
    }
    async findNearby(dto: NearbyTailorsDto) {
        const latitude = Number(dto.lat);
        const longitude = Number(dto.lng);
        const radius = Number(dto.radius);

        const minRating =
            dto.minRating !== undefined
                ? Number(dto.minRating)
                : undefined;

        const limit = Math.min(
            dto.limit !== undefined ? Number(dto.limit) : 10,
            100,
        );

        const offset =
            dto.offset !== undefined
                ? Number(dto.offset)
                : 0;

        let minPrice: number | undefined;
        let maxPrice: number | undefined;

        if (dto.priceRange) {
            const parts = dto.priceRange.split('-');

            if (parts.length !== 2) {
                throw new BadRequestException(
                    'priceRange must be in format min-max',
                );
            }

            minPrice = Number(parts[0]);
            maxPrice = Number(parts[1]);

            if (
                Number.isNaN(minPrice) ||
                Number.isNaN(maxPrice) ||
                minPrice < 0 ||
                maxPrice < minPrice
            ) {
                throw new BadRequestException(
                    'Invalid priceRange. Example: 500-2000',
                );
            }
        }

        const verified =
            dto.verified !== undefined
                ? dto.verified === 'true'
                : undefined;

        const acceptingOrders =
            dto.acceptingOrders !== undefined
                ? dto.acceptingOrders === 'true'
                : undefined;

        let categoryCondition = Prisma.empty;
        let ratingCondition = Prisma.empty;
        let priceCondition = Prisma.empty;
        let verifiedCondition = Prisma.empty;
        let acceptingOrdersCondition = Prisma.empty;

        if (dto.category) {
            categoryCondition = Prisma.sql`
      AND ${Prisma.raw('"categories"')} @> ARRAY[${dto.category}]::text[]
    `;
        }

        if (minRating !== undefined) {
            ratingCondition = Prisma.sql`
      AND "rating" >= ${minRating}
    `;
        }

        if (minPrice !== undefined && maxPrice !== undefined) {
            priceCondition = Prisma.sql`
      AND "startingPrice" BETWEEN ${minPrice} AND ${maxPrice}
    `;
        }

        if (verified !== undefined) {
            verifiedCondition = Prisma.sql`
      AND "verified" = ${verified}
    `;
        }

        if (acceptingOrders !== undefined) {
            acceptingOrdersCondition = Prisma.sql`
      AND "acceptingOrders" = ${acceptingOrders}
    `;
        }

        let orderBy = Prisma.sql`
    distance_meters ASC
  `;

        if (dto.sort === 'rating') {
            orderBy = Prisma.sql`
      "rating" DESC,
      distance_meters ASC
    `;
        }

        if (dto.sort === 'price') {
            orderBy = Prisma.sql`
      "startingPrice" ASC,
      distance_meters ASC
    `;
        }

        const result = await this.prisma.$queryRaw<
            Array<{
                id: number;
                userId: number;
                shopName: string;
                bio: string | null;
                categories: string[];
                latitude: number;
                longitude: number;
                verified: boolean;
                rating: number;
                startingPrice: number;
                acceptingOrders: boolean;
                distance_meters: number;
                total_count: number;
                createdAt: Date;
                updatedAt: Date;
            }>
        >`
    WITH nearby AS (
      SELECT
        id,
        "userId",
        "shopName",
        bio,
        categories,
        ST_Y(location::geometry) AS latitude,
        ST_X(location::geometry) AS longitude,
        verified,
        rating,
        "startingPrice",
        "acceptingOrders",
        ST_Distance(
          location,
          ST_SetSRID(
            ST_MakePoint(${longitude}, ${latitude}),
            4326
          )::geography
        ) AS distance_meters,
        "createdAt",
        "updatedAt"
      FROM "Tailor"
      WHERE ST_DWithin(
        location,
        ST_SetSRID(
          ST_MakePoint(${longitude}, ${latitude}),
          4326
        )::geography,
        ${radius}
      )
      ${categoryCondition}
      ${ratingCondition}
      ${priceCondition}
      ${verifiedCondition}
      ${acceptingOrdersCondition}
    )
    SELECT
      *,
      COUNT(*) OVER()::integer AS total_count
    FROM nearby
    ORDER BY ${orderBy}
    LIMIT ${limit}
    OFFSET ${offset};
  `;

        const total =
            result.length > 0
                ? result[0].total_count
                : 0;

        return {
            data: result.map((tailor) => ({
                id: tailor.id,
                userId: tailor.userId,
                shopName: tailor.shopName,
                bio: tailor.bio,
                categories: tailor.categories,
                latitude: tailor.latitude,
                longitude: tailor.longitude,
                verified: tailor.verified,
                rating: tailor.rating,
                startingPrice: tailor.startingPrice,
                acceptingOrders: tailor.acceptingOrders,
                distanceMeters: Math.round(tailor.distance_meters),
                createdAt: tailor.createdAt,
                updatedAt: tailor.updatedAt,
            })),
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + result.length < total,
            },
        };
    }
}