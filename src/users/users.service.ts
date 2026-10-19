
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../generated/prisma/client';
import { Role } from '../generated/prisma/enums';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  // ==========================================
  // USER OPERATIONS
  // ==========================================

  // GET /users
  // The controller restricts this endpoint to admins.
  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }

  // GET /users/:id
  async findById(
    id: number,
    requestingUserId: number,
    requestingRole: Role,
  ) {
    if (
      id !== requestingUserId &&
      requestingRole !== Role.ADMIN
    ) {
      throw new ForbiddenException(
        'You can only view your own account',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // PATCH /users/:id
  async update(
    id: number,
    requestingUserId: number,
    dto: UpdateUserDto,
  ) {
    if (id !== requestingUserId) {
      throw new ForbiddenException(
        'You can only update your own account',
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    if (
      dto.email !== undefined &&
      dto.email !== existingUser.email
    ) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: dto.email },
        select: { id: true },
      });

      if (emailExists) {
        throw new ConflictException(
          'Email is already registered',
        );
      }
    }

    if (
      dto.phoneNumber !== undefined &&
      dto.phoneNumber !== existingUser.phoneNumber
    ) {
      const phoneExists = await this.prisma.user.findUnique({
        where: { phoneNumber: dto.phoneNumber },
        select: { id: true },
      });

      if (phoneExists) {
        throw new ConflictException(
          'Phone number is already registered',
        );
      }
    }

    const data: {
      email?: string;
      phoneNumber?: string;
      passwordHash?: string;
    } = {};

    if (dto.email !== undefined) {
      data.email = dto.email;
    }

    if (dto.phoneNumber !== undefined) {
      data.phoneNumber = dto.phoneNumber;
    }

    if (dto.password !== undefined) {
      data.passwordHash = await bcrypt.hash(
        dto.password,
        12,
      );
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          email: true,
          phoneNumber: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      if (
        error instanceof
        Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Email or phone number is already registered',
        );
      }

      throw error;
    }
  }

  // DELETE /users/:id
  async remove(
    id: number,
    requestingUserId: number,
  ) {
    if (id !== requestingUserId) {
      throw new ForbiddenException(
        'You can only delete your own account',
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    if (existingUser.role === Role.ADMIN) {
      throw new ForbiddenException(
        'Admin accounts cannot be deleted through this endpoint',
      );
    }

    try {
      await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof
        Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'This account has related records. Contact support for account deletion.',
        );
      }

      throw error;
    }

    return {
      message: 'User deleted successfully',
    };
  }

  // ==========================================
  // ADMIN OPERATIONS
  // ==========================================

  // GET /admin/users/:id
  async adminFindOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // PATCH /admin/users/:id/role
  async adminUpdateRole(
    id: number,
    newRole: Role,
    requestingAdminId: number,
  ) {
    const target = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
      },
    });

    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (
      id === requestingAdminId &&
      newRole !== Role.ADMIN
    ) {
      throw new ForbiddenException(
        'You cannot change your own administrator role',
      );
    }

    if (
      target.role === Role.ADMIN &&
      newRole !== Role.ADMIN
    ) {
      const adminCount = await this.prisma.user.count({
        where: { role: Role.ADMIN },
      });

      if (adminCount <= 1) {
        throw new BadRequestException(
          'Cannot demote the last administrator',
        );
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        role: true,
        updatedAt: true,
      },
    });
  }

  // DELETE /admin/users/:id
  async adminRemove(
    id: number,
    requestingAdminId: number,
  ) {
    if (id === requestingAdminId) {
      throw new ForbiddenException(
        'You cannot delete your own administrator account',
      );
    }

    const target = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
      },
    });

    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (target.role === Role.ADMIN) {
      throw new ForbiddenException(
        'Admin accounts require a separate offboarding process',
      );
    }

    try {
      await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof
        Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'This user has linked records. Use an approved account-deletion workflow.',
        );
      }

      throw error;
    }

    return {
      message: 'User deleted successfully',
      id,
    };
  }

  // DELETE /admin/users
  // Destructive: removes all non-admin users and their linked records.
  async adminDeleteAllNonAdminUsers(
    confirmation: string,
    requestingAdminId: number,
  ) {
    if (
      confirmation !== 'DELETE ALL NON-ADMIN USERS'
    ) {
      throw new BadRequestException(
        'Confirmation must exactly match: DELETE ALL NON-ADMIN USERS',
      );
    }

    const targetUsers = await this.prisma.user.findMany({
      where: {
        role: {
          not: Role.ADMIN,
        },
      },
      select: {
        id: true,
      },
    });

    const userIds = targetUsers.map(
      (user) => user.id,
    );

    if (userIds.length === 0) {
      return {
        message: 'No non-admin users found',
        deletedUsers: 0,
      };
    }

    const deletedUsers = await this.prisma.$transaction(
      async (tx) => {
        const tailorProfiles = await tx.tailor.findMany({
          where: {
            userId: { in: userIds },
          },
          select: {
            id: true,
          },
        });

        const tailorIds = tailorProfiles.map(
          (tailor) => tailor.id,
        );

        const affectedOrders = await tx.order.findMany({
          where: {
            OR: [
              { customerId: { in: userIds } },
              { tailorId: { in: tailorIds } },
            ],
          },
          select: {
            id: true,
          },
        });

        const orderIds = affectedOrders.map(
          (order) => order.id,
        );

        // Delete reviews authored by target users,
        // associated with target tailors, or linked to affected orders.
        await tx.review.deleteMany({
          where: {
            OR: [
              { customerId: { in: userIds } },
              { tailorId: { in: tailorIds } },
              { orderId: { in: orderIds } },
            ],
          },
        });

        if (orderIds.length > 0) {
          await tx.payment.deleteMany({
            where: {
              orderId: { in: orderIds },
            },
          });

          await tx.orderItem.deleteMany({
            where: {
              orderId: { in: orderIds },
            },
          });

          await tx.order.deleteMany({
            where: {
              id: { in: orderIds },
            },
          });
        }

        if (tailorIds.length > 0) {
          await tx.portfolioImage.deleteMany({
            where: {
              tailorId: { in: tailorIds },
            },
          });

          await tx.tailor.deleteMany({
            where: {
              id: { in: tailorIds },
            },
          });
        }

        await tx.measurementProfile.deleteMany({
          where: {
            userId: { in: userIds },
          },
        });

        // Keep every admin account intact.
        const result = await tx.user.deleteMany({
          where: {
            id: { in: userIds },
            role: { not: Role.ADMIN },
          },
        });

        return result.count;
      },
    );

    return {
      message:
        'Non-admin users and linked database records deleted',
      deletedUsers,
      adminAccountPreserved: true,
      requestedByAdminId: requestingAdminId,
    };
  }

  async adminFindAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }
  async adminDeleteAllUsers(confirmation: string) {
    if (confirmation !== 'DELETE ALL NON-ADMIN USERS') {
      throw new BadRequestException(
        'Confirmation must be DELETE ALL NON-ADMIN USERS',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Preserve admin accounts; remove dependent records first.
      await tx.review.deleteMany({});
      await tx.payment.deleteMany({});
      await tx.orderItem.deleteMany({});
      await tx.order.deleteMany({});
      await tx.portfolioImage.deleteMany({});
      await tx.tailor.deleteMany({});
      await tx.measurementProfile.deleteMany({});

      const result = await tx.user.deleteMany({
        where: {
          role: {
            not: Role.ADMIN,
          },
        },
      });

      return {
        message: 'All non-admin users deleted successfully',
        deletedUsers: result.count,
        adminsPreserved: true,
      };
    });
  }
}
