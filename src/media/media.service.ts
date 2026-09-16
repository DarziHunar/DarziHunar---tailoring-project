import { randomUUID } from 'crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class MediaService {
  private readonly s3: S3Client;

  private readonly bucket: string;

  constructor(
    private readonly prisma: PrismaService,
  ) {
    const region = process.env.AWS_REGION;
    const bucket = process.env.AWS_S3_BUCKET;

    if (!region) {
      throw new Error('AWS_REGION is not configured');
    }

    if (!bucket) {
      throw new Error('AWS_S3_BUCKET is not configured');
    }

    this.s3 = new S3Client({
      region,
    });

    this.bucket = bucket;
  }

  async createUploadUrl(
    tailorId: number,
    userId: number,
    fileName: string,
    contentType: string,
  ) {
    const tailor = await this.prisma.tailor.findUnique({
      where: {
        id: tailorId,
      },
    });

    if (!tailor) {
      throw new NotFoundException(
        'Tailor profile not found',
      );
    }

    if (tailor.userId !== userId) {
      throw new BadRequestException(
        'You can only upload images to your own portfolio',
      );
    }

    const extension =
      fileName.split('.').pop()?.toLowerCase() || 'jpg';

    const allowedExtensions = [
      'jpg',
      'jpeg',
      'png',
      'webp',
    ];

    if (!allowedExtensions.includes(extension)) {
      throw new BadRequestException(
        'Unsupported file extension',
      );
    }

    const safeFileName = fileName
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .toLowerCase();

    const uniqueId = randomUUID();

    const key =
      `tailors/${tailorId}/portfolio/` +
      `${uniqueId}-${safeFileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(
      this.s3,
      command,
      {
        expiresIn: 300,
      },
    );

    const image = await this.prisma.portfolioImage.create({
      data: {
        tailorId,
        s3Key: key,
        fileName,
        contentType,
      },
    });

    return {
      imageId: image.id,
      uploadUrl,
      key,
      expiresIn: 300,
    };
  }

  async getPortfolio(tailorId: number) {
    const tailor = await this.prisma.tailor.findUnique({
      where: {
        id: tailorId,
      },
    });

    if (!tailor) {
      throw new NotFoundException(
        'Tailor profile not found',
      );
    }

    return this.prisma.portfolioImage.findMany({
      where: {
        tailorId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        s3Key: true,
        fileName: true,
        contentType: true,
        createdAt: true,
      },
    });
  }

  async deletePortfolioImage(
    tailorId: number,
    userId: number,
    imageId: number,
  ) {
    const image =
      await this.prisma.portfolioImage.findUnique({
        where: {
          id: imageId,
        },
        include: {
          tailor: true,
        },
      });

    if (!image) {
      throw new NotFoundException(
        'Portfolio image not found',
      );
    }

    if (image.tailorId !== tailorId) {
      throw new BadRequestException(
        'Image does not belong to this tailor',
      );
    }

    if (image.tailor.userId !== userId) {
      throw new BadRequestException(
        'You can only delete your own portfolio images',
      );
    }

    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: image.s3Key,
      }),
    );

    await this.prisma.portfolioImage.delete({
      where: {
        id: imageId,
      },
    });

    return {
      message: 'Portfolio image deleted successfully',
    };
  }
}
