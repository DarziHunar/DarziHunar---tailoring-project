
import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMeasurementDto } from './dto/create-measurement.dto';
import { UpdateMeasurementDto } from './dto/update-measurement.dto';

const ALLOWED_MEASUREMENTS: Record<string, string[]> = {
    SHIRT: [
        'chest',
        'waist',
        'shoulder',
        'sleeveLength',
        'shirtLength',
        'neck',
    ],
    TROUSERS: [
        'waist',
        'hip',
        'inseam',
        'outseam',
        'thigh',
        'ankle',
    ],
    KURTA: [
        'chest',
        'waist',
        'shoulder',
        'sleeveLength',
        'kurtaLength',
    ],
    SHERWANI: [
        'chest',
        'waist',
        'shoulder',
        'sleeveLength',
        'sherwaniLength',
    ],
    DRESS: [
        'bust',
        'waist',
        'hip',
        'shoulder',
        'sleeveLength',
        'dressLength',
    ],
    BLOUSE: [
        'bust',
        'underBust',
        'waist',
        'shoulder',
        'blouseLength',
        'sleeveLength',
    ],
};

@Injectable()
export class MeasurementsService {
    constructor(private readonly prisma: PrismaService) { }

    private validateMeasurements(
        garmentType: string,
        measurements: Record<string, number>,
    ): void {
        const allowed = ALLOWED_MEASUREMENTS[garmentType];

        if (!allowed) {
            throw new BadRequestException('Unsupported garment type');
        }

        if (
            !measurements ||
            typeof measurements !== 'object' ||
            Array.isArray(measurements)
        ) {
            throw new BadRequestException(
                'Measurements must be a JSON object',
            );
        }

        const entries = Object.entries(measurements);

        if (entries.length === 0) {
            throw new BadRequestException(
                'Provide at least one measurement',
            );
        }

        for (const [key, value] of entries) {
            if (!allowed.includes(key)) {
                throw new BadRequestException(
                    `Measurement "${key}" is not supported for ${garmentType}`,
                );
            }

            if (
                typeof value !== 'number' ||
                !Number.isFinite(value) ||
                value <= 0 ||
                value > 500
            ) {
                throw new BadRequestException(
                    `Measurement "${key}" must be a number greater than 0 and at most 500`,
                );
            }
        }
    }

    async create(userId: number, dto: CreateMeasurementDto) {
        this.validateMeasurements(dto.garmentType, dto.measurements);

        return this.prisma.measurementProfile.create({
            data: {
                userId,
                name: dto.name.trim(),
                garmentType: dto.garmentType,
                measurements: dto.measurements as any,
                unit: dto.unit ?? 'cm',
            },
        });
    }

    async findAll(userId: number) {
        return this.prisma.measurementProfile.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async findById(id: number, userId: number) {
        const profile = await this.prisma.measurementProfile.findUnique({
            where: { id },
        });

        if (!profile) {
            throw new NotFoundException('Measurement profile not found');
        }

        if (profile.userId !== userId) {
            throw new ForbiddenException(
                'You cannot access this measurement profile',
            );
        }

        return profile;
    }

    async update(
        id: number,
        userId: number,
        dto: UpdateMeasurementDto,
    ) {
        const current = await this.findById(id, userId);

        const garmentType = dto.garmentType ?? current.garmentType;
        const measurements =
            dto.measurements ??
            (current.measurements as Record<string, number>);

        this.validateMeasurements(garmentType, measurements);

        return this.prisma.measurementProfile.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name.trim() }),
                ...(dto.garmentType !== undefined && {
                    garmentType: dto.garmentType,
                }),
                ...(dto.measurements !== undefined && {
                    measurements: dto.measurements as any,
                }),
                ...(dto.unit !== undefined && { unit: dto.unit }),
            },
        });
    }

    async remove(id: number, userId: number) {
        await this.findById(id, userId);

        await this.prisma.measurementProfile.delete({
            where: { id },
        });

        return {
            success: true,
            message: 'Measurement profile deleted successfully',
        };
    }
    async adminFindAll() {
        return this.prisma.measurementProfile.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async adminFindById(id: number) {
        const profile = await this.prisma.measurementProfile.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        if (!profile) {
            throw new NotFoundException('Measurement profile not found');
        }

        return profile;
    }

    async adminRemove(id: number) {
        await this.adminFindById(id);

        try {
            await this.prisma.measurementProfile.delete({
                where: { id },
            });
        } catch (error) {
            // P2003 means a related record prevents deletion.
            if (
                error instanceof
                (await import('../generated/prisma/client.js')).Prisma
                    .PrismaClientKnownRequestError &&
                error.code === 'P2003'
            ) {
                throw new ConflictException(
                    'Cannot delete this measurement profile because related records exist',
                );
            }

            throw error;
        }

        return {
            success: true,
            message: 'Measurement profile deleted successfully by admin',
            id,
        };
    }
}
