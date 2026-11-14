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

        if ((dto.latitude === undefined) !== (dto.longitude === undefined)) {
            throw new BadRequestException('Provide both latitude and longitude, or leave both empty');
        }

        const result = await this.prisma.$queryRaw<Array<{ id: number }>>`
    INSERT INTO "Tailor"
      (
        "userId", "shopName", "bio", "categories", "location",
        "experienceYears", "specialization", "verified", "rating",
        "startingPrice", "acceptingOrders", "createdAt", "updatedAt"
      )
    VALUES (
      ${userId},
      ${dto.shopName.trim()},
      ${dto.bio?.trim() ?? null},
      ${dto.categories},
      CASE
        WHEN ${dto.latitude ?? null}::double precision IS NULL THEN NULL
        ELSE ST_SetSRID(ST_MakePoint(${dto.longitude ?? null}, ${dto.latitude ?? null}), 4326)::geography
      END,
      ${dto.experienceYears ?? null},
      ${dto.specialization?.trim() ?? null},
      false,
      0,
      ${dto.startingPrice ?? 0},
      ${dto.acceptingOrders ?? true},
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
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
        if ((latitude === undefined) !== (longitude === undefined)) {
            throw new BadRequestException('Provide both latitude and longitude, or leave both empty');
        }

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
                latitude: number | null;
                longitude: number | null;
                experienceYears: number | null;
                specialization: string | null;
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
      "experienceYears",
      specialization,
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

        const user = await this.prisma.user.findUnique({
            where: { id: result[0].userId },
            select: { fullName: true },
        });
        return { ...result[0], fullName: user?.fullName ?? null };
    }

    async findMine(userId: number) {
        const tailor = await this.prisma.tailor.findUnique({
            where: { userId },
            select: { id: true },
        });
        if (!tailor) throw new NotFoundException('Tailor profile not found');
        return this.findById(tailor.id);
    }

    async findCategories() {
        const rows = await this.prisma.tailor.findMany({
            where: { acceptingOrders: true },
            select: { categories: true },
        });
        const categories = Array.from(new Set(
            rows.flatMap((row) => row.categories)
                .map((value) => value.trim())
                .filter(Boolean),
        )).sort((a, b) => a.localeCompare(b));
        return categories;
    }

    async findAll() {
        return this.prisma.tailor.findMany({
            where: { acceptingOrders: true },
            select: {
                id: true, userId: true, shopName: true, bio: true,
                categories: true, experienceYears: true, specialization: true,
                verified: true, rating: true, startingPrice: true, acceptingOrders: true,
                createdAt: true, updatedAt: true,
                user: { select: { fullName: true } },
            },
            orderBy: [{ verified: 'desc' }, { rating: 'desc' }, { createdAt: 'desc' }],
        });
    }

    async findByCategory(category: string) {
        const normalized = category.trim();
        if (!normalized) throw new BadRequestException('category is required');
        return this.prisma.tailor.findMany({
            where: { categories: { has: normalized }, acceptingOrders: true },
            select: {
                id: true, userId: true, shopName: true, bio: true,
                categories: true, experienceYears: true, specialization: true,
                verified: true, rating: true, startingPrice: true, acceptingOrders: true,
                createdAt: true, updatedAt: true,
                user: { select: { fullName: true } },
            },
            orderBy: [{ verified: 'desc' }, { rating: 'desc' }, { createdAt: 'desc' }],
        });
    }

    async findNearby(dto: NearbyTailorsDto) {
        const latitude = Number(dto.lat);
        const longitude = Number(dto.lng);
        const radius = Number(dto.radius);

        if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
            throw new BadRequestException('lat must be a valid latitude');
        }
        if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
            throw new BadRequestException('lng must be a valid longitude');
        }
        if (!Number.isFinite(radius) || radius < 100 || radius > 10000) {
            throw new BadRequestException('radius must be between 100 and 10000 metres');
        }

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
                experienceYears: number | null;
                specialization: string | null;
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
        "experienceYears",
        specialization,
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
                experienceYears: tailor.experienceYears,
                specialization: tailor.specialization,
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

    async adminFindAll() {
        const result = await this.prisma.$queryRaw<
            Array<{
                id: number;
                userId: number;
                shopName: string;
                bio: string | null;
                categories: string[];
                latitude: number;
                longitude: number;
                experienceYears: number | null;
                specialization: string | null;
                verified: boolean;
                rating: number;
                startingPrice: number;
                acceptingOrders: boolean;
                createdAt: Date;
                updatedAt: Date;
                user_id: number;
                user_email: string;
                user_role: string;
            }>
        >`
    SELECT
      t.id,
      t."userId",
      t."shopName",
      t.bio,
      t.categories,
      t."experienceYears",
      t.specialization,
      ST_Y(t.location::geometry) AS latitude,
      ST_X(t.location::geometry) AS longitude,
      t.verified,
      t.rating,
      t."startingPrice",
      t."acceptingOrders",
      t."createdAt",
      t."updatedAt",
      u.id AS user_id,
      u.email AS user_email,
      u.role::text AS user_role
    FROM "Tailor" t
    INNER JOIN "User" u
      ON u.id = t."userId"
    ORDER BY t.id ASC;
  `;

        return result.map((tailor) => ({
            id: tailor.id,
            userId: tailor.userId,
            shopName: tailor.shopName,
            bio: tailor.bio,
            categories: tailor.categories,
            experienceYears: tailor.experienceYears,
            specialization: tailor.specialization,
            latitude: tailor.latitude,
            longitude: tailor.longitude,
            verified: tailor.verified,
            rating: tailor.rating,
            startingPrice: tailor.startingPrice,
            acceptingOrders: tailor.acceptingOrders,
            createdAt: tailor.createdAt,
            updatedAt: tailor.updatedAt,
            user: {
                id: tailor.user_id,
                email: tailor.user_email,
                role: tailor.user_role,
            },
        }));
    }

    async remove(tailorId: number, userId: number) {
        const tailor = await this.prisma.tailor.findUnique({
            where: { id: tailorId },
            select: {
                id: true,
                userId: true,
            },
        });

        if (!tailor) {
            throw new NotFoundException('Tailor profile not found');
        }

        if (tailor.userId !== userId) {
            throw new ForbiddenException(
                'You can only delete your own tailor profile',
            );
        }

        try {
            await this.prisma.tailor.delete({
                where: { id: tailorId },
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2003'
            ) {
                throw new ConflictException(
                    'Cannot delete this tailor profile because related records exist',
                );
            }

            throw error;
        }

        return {
            message: 'Tailor profile deleted successfully',
            tailorId,
        };
    }

    async adminRemove(tailorId: number) {
        const tailor = await this.prisma.tailor.findUnique({
            where: { id: tailorId },
            select: { id: true },
        });

        if (!tailor) {
            throw new NotFoundException('Tailor profile not found');
        }

        try {
            await this.prisma.tailor.delete({
                where: { id: tailorId },
            });
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2003'
            ) {
                throw new ConflictException(
                    'Cannot delete this tailor profile because related records exist',
                );
            }

            throw error;
        }

        return {
            message: 'Tailor profile deleted successfully by admin',
            tailorId,
        };
    }
}