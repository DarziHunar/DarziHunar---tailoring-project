import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateTailorDto } from './dto/create-tailor.dto';
import { UpdateTailorDto } from './dto/update-tailor.dto';

@Injectable()
export class TailorsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(userId: number, dto: CreateTailorDto) {
        const existingTailor = await this.prisma.tailor.findUnique({
            where: {
                userId,
            },
        });

        if (existingTailor) {
            throw new ConflictException(
                'Tailor profile already exists for this user',
            );
        }

        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.role !== 'TAILOR') {
            throw new ForbiddenException(
                'Only users with TAILOR role can create a tailor profile',
            );
        }

        const result = await this.prisma.$queryRaw<
            Array<{ id: number }>
        >`
    INSERT INTO "Tailor"
      (
        "userId",
        "shopName",
        "bio",
        "categories",
        "location",
        "verified",
        "rating",
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
}