import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { StyleAudience } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTailorDto } from './dto/create-tailor.dto';
import { NearbyTailorsDto } from './dto/nearby-tailors.dto';
import { UpdateTailorDto } from './dto/update-tailor.dto';
import { SaveTailorLocationDto } from './dto/save-tailor-location.dto';

const ALLOWED_AUDIENCES = Object.values(StyleAudience);

@Injectable()
export class TailorsService {
    constructor(private readonly prisma: PrismaService) { }

    private normalizeAudience(value: string): StyleAudience {
        const normalized = value.trim().toUpperCase();

        if (!ALLOWED_AUDIENCES.includes(normalized as StyleAudience)) {
            throw new BadRequestException(
                'Audience must be WOMEN, MEN, TEENAGERS or CHILDREN',
            );
        }

        return normalized as StyleAudience;
    }

    private validateCoordinates(latitude: number, longitude: number) {
        if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
            throw new BadRequestException('latitude must be between -90 and 90');
        }
        if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
            throw new BadRequestException('longitude must be between -180 and 180');
        }
    }

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
            throw new BadRequestException(
                'Provide both latitude and longitude, or leave both empty',
            );
        }

        if (dto.latitude !== undefined && dto.longitude !== undefined) {
            this.validateCoordinates(dto.latitude, dto.longitude);
        }

        const audiences = dto.audiences?.map((audience) =>
            this.normalizeAudience(audience),
        );

        const result = await this.prisma.$queryRaw<Array<{ id: number }>>`
            INSERT INTO "Tailor" (
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
                    ELSE ST_SetSRID(
                        ST_MakePoint(${dto.longitude ?? null}, ${dto.latitude ?? null}),
                        4326
                    )::geography
                END,
                ${dto.experienceYears ?? null},
                ${dto.specialization?.trim() ?? null},
                false,
                0,
                ${dto.startingPrice ?? 0},
                ${dto.acceptingOrders ?? true},
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            RETURNING id;
        `;

        const tailorId = result[0]?.id;
        if (!tailorId) {
            throw new ConflictException('Tailor profile could not be created');
        }

        // Keep audience groups separate from garment/service categories.
        // An explicit empty array clears the selected audiences.
        if (audiences !== undefined) {
            await this.prisma.tailor.update({
                where: { id: tailorId },
                data: { audiences },
            });
        }

        return this.findById(tailorId);
    }

    /**
     * Saves the signed-in tailor's GPS location. If the tailor profile does not
     * exist yet, create a minimal profile; otherwise update only its location.
     */
    async saveMyLocation(userId: number, dto: SaveTailorLocationDto) {
        this.validateCoordinates(dto.latitude, dto.longitude);

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, fullName: true, role: true },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.role !== 'TAILOR') {
            throw new ForbiddenException(
                'Only tailor accounts can save a shop location',
            );
        }

        const fallbackShopName = user.fullName?.trim()
            ? `${user.fullName.trim()}'s Tailoring Shop`
            : 'My Tailoring Shop';

        // location is an Unsupported geography field in Prisma, so use PostGIS.
        // The unique userId constraint makes this upsert safe for repeated
        // first-login requests. Existing profile fields are left untouched.
        const result = await this.prisma.$queryRaw<Array<{ id: number }>>`
            INSERT INTO "Tailor" (
                "userId", "shopName", "categories", "location",
                "verified", "rating", "startingPrice", "acceptingOrders",
                "createdAt", "updatedAt"
            )
            VALUES (
                ${userId},
                ${fallbackShopName},
                ARRAY[]::text[],
                ST_SetSRID(
                    ST_MakePoint(${dto.longitude}, ${dto.latitude}),
                    4326
                )::geography,
                false,
                0,
                0,
                true,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT ("userId") DO UPDATE SET
                "location" = EXCLUDED."location",
                "updatedAt" = CURRENT_TIMESTAMP
            RETURNING id;
        `;

        const tailorId = result[0]?.id;
        if (!tailorId) {
            throw new ConflictException('Tailor location could not be saved');
        }

        return this.findById(tailorId);
    }

    async update(
        tailorId: number,
        userId: number,
        dto: UpdateTailorDto,
    ) {
        const tailor = await this.prisma.tailor.findUnique({
            where: { id: tailorId },
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
            throw new BadRequestException(
                'Provide both latitude and longitude, or leave both empty',
            );
        }

        if (latitude !== undefined && longitude !== undefined) {
            this.validateCoordinates(latitude, longitude);
        }

        if (regularFields.audiences !== undefined) {
            regularFields.audiences = regularFields.audiences.map((audience) =>
                this.normalizeAudience(audience),
            );
        }

        if (Object.keys(regularFields).length > 0) {
            await this.prisma.tailor.update({
                where: { id: tailorId },
                data: regularFields,
            });
        }

        if (latitude !== undefined && longitude !== undefined) {
            await this.prisma.$executeRaw`
                UPDATE "Tailor"
                SET "location" = ST_SetSRID(
                    ST_MakePoint(${longitude}, ${latitude}),
                    4326
                )::geography,
                "updatedAt" = CURRENT_TIMESTAMP
                WHERE "id" = ${tailorId};
            `;
        }

        return this.findById(tailorId);
    }

    async findById(tailorId: number) {
        const result = await this.prisma.$queryRaw<Array<{
            id: number;
            userId: number;
            shopName: string;
            bio: string | null;
            categories: string[];
            audiences: StyleAudience[];
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
        }>>`
            SELECT
                id,
                "userId",
                "shopName",
                bio,
                categories,
                audiences,
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

        return {
            ...result[0],
            fullName: user?.fullName ?? null,
        };
    }

    async findMine(userId: number) {
        const tailor = await this.prisma.tailor.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!tailor) {
            throw new NotFoundException('Tailor profile not found');
        }

        return this.findById(tailor.id);
    }

    // These are garment/service categories, not Women/Men/Teenagers/Children.
    async findCategories() {
        const rows = await this.prisma.tailor.findMany({
            where: { acceptingOrders: true },
            select: { categories: true },
        });

        return Array.from(new Set(
            rows.flatMap((row) => row.categories)
                .map((value) => value.trim())
                .filter(Boolean),
        )).sort((a, b) => a.localeCompare(b));
    }

    async findAll() {
        return this.prisma.tailor.findMany({
            where: { acceptingOrders: true },
            select: {
                id: true,
                userId: true,
                shopName: true,
                bio: true,
                categories: true,
                audiences: true,
                experienceYears: true,
                specialization: true,
                verified: true,
                rating: true,
                startingPrice: true,
                acceptingOrders: true,
                createdAt: true,
                updatedAt: true,
                user: { select: { fullName: true } },
            },
            orderBy: [
                { verified: 'desc' },
                { rating: 'desc' },
                { createdAt: 'desc' },
            ],
        });
    }

    /**
     * The /tailors/by-category endpoint receives an audience (MEN, WOMEN,
     * TEENAGERS or CHILDREN), so it must filter Tailor.audiences, not categories.
     */
    async findByCategory(category: string) {
        const audience = this.normalizeAudience(category);

        return this.prisma.tailor.findMany({
            where: {
                audiences: { has: audience },
                acceptingOrders: true,
            },
            select: {
                id: true,
                userId: true,
                shopName: true,
                bio: true,
                categories: true,
                audiences: true,
                experienceYears: true,
                specialization: true,
                verified: true,
                rating: true,
                startingPrice: true,
                acceptingOrders: true,
                createdAt: true,
                updatedAt: true,
                user: { select: { fullName: true } },
            },
            orderBy: [
                { verified: 'desc' },
                { rating: 'desc' },
                { createdAt: 'desc' },
            ],
        });
    }

    async findNearby(dto: NearbyTailorsDto) {
        const latitude = Number(dto.lat);
        const longitude = Number(dto.lng);
        // Always defaults to 4 km. Clients may narrow the radius but cannot
        // increase it beyond 4,000 metres.
        const radius = dto.radius === undefined ? 4000 : Number(dto.radius);

        this.validateCoordinates(latitude, longitude);

        if (!Number.isFinite(radius) || radius < 100 || radius > 4000) {
            throw new BadRequestException(
                'radius must be between 100 and 4000 metres',
            );
        }

        const audience = dto.category
            ? this.normalizeAudience(dto.category)
            : undefined;

        const minRating = dto.minRating !== undefined
            ? Number(dto.minRating)
            : undefined;

        if (
            minRating !== undefined &&
            (!Number.isFinite(minRating) || minRating < 0 || minRating > 5)
        ) {
            throw new BadRequestException('minRating must be between 0 and 5');
        }

        const requestedLimit = dto.limit !== undefined ? Number(dto.limit) : 10;
        if (!Number.isFinite(requestedLimit) || requestedLimit < 1) {
            throw new BadRequestException('limit must be a positive number');
        }
        const limit = Math.min(Math.trunc(requestedLimit), 100);

        const requestedOffset = dto.offset !== undefined ? Number(dto.offset) : 0;
        if (!Number.isFinite(requestedOffset) || requestedOffset < 0) {
            throw new BadRequestException('offset must be a non-negative number');
        }
        const offset = Math.trunc(requestedOffset);

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
                !Number.isFinite(minPrice) ||
                !Number.isFinite(maxPrice) ||
                minPrice < 0 ||
                maxPrice < minPrice
            ) {
                throw new BadRequestException(
                    'Invalid priceRange. Example: 500-2000',
                );
            }
        }

        const verified = dto.verified !== undefined
            ? dto.verified === 'true'
            : undefined;

        // Customer discovery must never return unavailable tailors.
        if (dto.acceptingOrders === 'false') {
            throw new BadRequestException(
                'Nearby discovery only returns tailors accepting orders',
            );
        }

        let audienceCondition = Prisma.empty;
        let ratingCondition = Prisma.empty;
        let priceCondition = Prisma.empty;
        let verifiedCondition = Prisma.empty;

        if (audience) {
            audienceCondition = Prisma.sql`
                AND t."audiences" @> ARRAY[${audience}::"StyleAudience"]
            `;
        }

        if (minRating !== undefined) {
            ratingCondition = Prisma.sql`
                AND t."rating" >= ${minRating}
            `;
        }

        if (minPrice !== undefined && maxPrice !== undefined) {
            priceCondition = Prisma.sql`
                AND t."startingPrice" BETWEEN ${minPrice} AND ${maxPrice}
            `;
        }

        if (verified !== undefined) {
            verifiedCondition = Prisma.sql`
                AND t."verified" = ${verified}
            `;
        }

        let orderBy = Prisma.sql`distance_meters ASC`;

        if (dto.sort === 'rating') {
            orderBy = Prisma.sql`
                "rating" DESC,
                distance_meters ASC
            `;
        } else if (dto.sort === 'price') {
            orderBy = Prisma.sql`
                "startingPrice" ASC,
                distance_meters ASC
            `;
        }

        const result = await this.prisma.$queryRaw<Array<{
            id: number;
            userId: number;
            shopName: string;
            bio: string | null;
            categories: string[];
            audiences: StyleAudience[];
            latitude: number;
            longitude: number;
            fullName: string | null;
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
        }>>`
            WITH nearby AS (
                SELECT
                    t.id,
                    t."userId",
                    t."shopName",
                    t.bio,
                    t.categories,
                    t.audiences,
                    ST_Y(t.location::geometry) AS latitude,
                    ST_X(t.location::geometry) AS longitude,
                    u."fullName" AS "fullName",
                    t."experienceYears",
                    t.specialization,
                    t.verified,
                    t.rating,
                    t."startingPrice",
                    t."acceptingOrders",
                    ST_Distance(
                        t.location,
                        ST_SetSRID(
                            ST_MakePoint(${longitude}, ${latitude}),
                            4326
                        )::geography
                    ) AS distance_meters,
                    t."createdAt",
                    t."updatedAt"
                FROM "Tailor" t
                INNER JOIN "User" u ON u.id = t."userId"
                WHERE t.location IS NOT NULL
                    AND t."acceptingOrders" = TRUE
                    AND ST_DWithin(
                        t.location,
                        ST_SetSRID(
                            ST_MakePoint(${longitude}, ${latitude}),
                            4326
                        )::geography,
                        ${radius}
                    )
                    ${audienceCondition}
                    ${ratingCondition}
                    ${priceCondition}
                    ${verifiedCondition}
            )
            SELECT
                *,
                COUNT(*) OVER()::integer AS total_count
            FROM nearby
            ORDER BY ${orderBy}
            LIMIT ${limit}
            OFFSET ${offset};
        `;

        const total = result.length > 0 ? result[0].total_count : 0;

        return {
            data: result.map((tailor) => ({
                id: tailor.id,
                userId: tailor.userId,
                shopName: tailor.shopName,
                bio: tailor.bio,
                categories: tailor.categories,
                audiences: tailor.audiences,
                latitude: tailor.latitude,
                longitude: tailor.longitude,
                fullName: tailor.fullName,
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
        const result = await this.prisma.$queryRaw<Array<{
            id: number;
            userId: number;
            shopName: string;
            bio: string | null;
            categories: string[];
            audiences: StyleAudience[];
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
            user_id: number;
            user_email: string;
            user_role: string;
        }>>`
            SELECT
                t.id,
                t."userId",
                t."shopName",
                t.bio,
                t.categories,
                t.audiences,
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
            INNER JOIN "User" u ON u.id = t."userId"
            ORDER BY t.id ASC;
        `;

        return result.map((tailor) => ({
            id: tailor.id,
            userId: tailor.userId,
            shopName: tailor.shopName,
            bio: tailor.bio,
            categories: tailor.categories,
            audiences: tailor.audiences,
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
            select: { id: true, userId: true },
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
            await this.prisma.tailor.delete({ where: { id: tailorId } });
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
            await this.prisma.tailor.delete({ where: { id: tailorId } });
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
