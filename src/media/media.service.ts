import { randomUUID } from 'crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetCallerIdentityCommand, STSClient, type GetCallerIdentityCommandOutput } from '@aws-sdk/client-sts';

import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class MediaService {
  private readonly s3: S3Client;
  private readonly sts: STSClient;
  private readonly bucket: string;
  private readonly region: string;
  private readonly expectedAccountId?: string;

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

    const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
    const sessionToken = process.env.AWS_SESSION_TOKEN?.trim();

    if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) {
      throw new Error('Set both AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY, or remove both and use an IAM role.');
    }

    const expectedAccountId = process.env.AWS_EXPECTED_ACCOUNT_ID?.trim();
    if (expectedAccountId && !/^\d{12}$/.test(expectedAccountId)) {
      throw new Error('AWS_EXPECTED_ACCOUNT_ID must be the 12-digit AWS account ID.');
    }

    // When access keys are present, pass them explicitly to both S3 and STS.
    // This avoids accidentally signing requests with a different shared profile.
    const credentials = accessKeyId && secretAccessKey
      ? {
          accessKeyId,
          secretAccessKey,
          ...(sessionToken ? { sessionToken } : {}),
        }
      : undefined;
    const clientConfig = {
      region,
      ...(credentials ? { credentials } : {}),
    };

    this.region = region;
    this.bucket = bucket;
    this.expectedAccountId = expectedAccountId;
    this.s3 = new S3Client(clientConfig);
    this.sts = new STSClient(clientConfig);
  }

  /** Verify the exact AWS principal used to sign each upload URL. */
  private async verifySigningIdentity(flow: string, key: string): Promise<void> {
    const diagnosticsEnabled = process.env.AWS_S3_DIAGNOSTICS === 'true';
    if (!this.expectedAccountId && !diagnosticsEnabled) return;

    let identity: GetCallerIdentityCommandOutput;
    try {
      identity = await this.sts.send(new GetCallerIdentityCommand({}));
    } catch (error) {
      console.error('[DarziHunar S3 signer] STS identity check failed', error);
      throw new ServiceUnavailableException(
        'Could not verify the AWS credentials used for S3. Check AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and AWS_SESSION_TOKEN.',
      );
    }

    const caller = identity;
    if (diagnosticsEnabled) {
      console.info('[DarziHunar S3 signer]', {
        flow,
        bucket: this.bucket,
        region: this.region,
        keyPrefix: key.split('/').slice(0, 3).join('/'),
        callerArn: caller.Arn,
        account: caller.Account,
        expectedAccount: this.expectedAccountId,
      });
    }

    if (this.expectedAccountId && caller.Account !== this.expectedAccountId) {
      throw new ServiceUnavailableException(
        `S3 credentials are using AWS account ${caller.Account ?? 'unknown'}, but DarziHunar expects account ${this.expectedAccountId}. Update the backend AWS credentials and fully restart the API. No upload URL was created.`,
      );
    }
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

    await this.verifySigningIdentity('tailor-portfolio', key);
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

  private validateCustomerImage(fileName: string, contentType: string) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(contentType)) throw new BadRequestException('Only JPEG, PNG or WebP images are allowed');
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(extension)) throw new BadRequestException('Unsupported image extension');
  }

  async createUserProfileImageUploadUrl(userId: number, fileName: string, contentType: string) {
    this.validateCustomerImage(fileName, contentType);
    const key = `users/${userId}/profile/${randomUUID()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
    await this.verifySigningIdentity('user-profile-image', key);
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 });
    // Persist the key only after the client confirms that the S3 PUT succeeded.
    return { uploadUrl, key, expiresIn: 300 };
  }

  async completeUserProfileImageUpload(userId: number, key: string) {
    const prefix = `users/${userId}/profile/`;
    if (!key || !key.startsWith(prefix) || key.includes('..')) {
      throw new BadRequestException('Invalid profile image key');
    }

    try {
      await this.s3.send(new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ...(this.expectedAccountId ? { ExpectedBucketOwner: this.expectedAccountId } : {}),
      }));
    } catch {
      throw new BadRequestException('The image was not found in S3. Upload the image before completing the profile update.');
    }

    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profileImageKey: true },
    });
    if (!current) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: { profileImageKey: key },
    });

    // Best-effort cleanup of the previous private profile image.
    if (current.profileImageKey && current.profileImageKey !== key) {
      await this.s3.send(new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: current.profileImageKey,
        ...(this.expectedAccountId ? { ExpectedBucketOwner: this.expectedAccountId } : {}),
      })).catch(() => undefined);
    }

    return this.getUserProfileImageUrl(userId);
  }

  async getUserProfileImageUrl(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { profileImageKey: true } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.profileImageKey) return { imageUrl: null };
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: user.profileImageKey,
    });
    return { imageUrl: await getSignedUrl(this.s3, command, { expiresIn: 3600 }) };
  }

  async createOrderReferenceUploadUrl(userId: number, fileName: string, contentType: string) {
    this.validateCustomerImage(fileName, contentType);
    const key = `users/${userId}/order-references/${randomUUID()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
    await this.verifySigningIdentity('order-reference', key);
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 });
    return { uploadUrl, key, expiresIn: 300 };
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
        ...(this.expectedAccountId ? { ExpectedBucketOwner: this.expectedAccountId } : {}),
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
