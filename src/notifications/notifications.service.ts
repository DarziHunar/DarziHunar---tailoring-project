import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  constructor(private readonly prisma: PrismaService) {}

  /** Safe notification delivery: notification failure must never roll back an already-created order. */
  async createSafely(userId: number, title: string, body: string, type = 'GENERAL', data?: Record<string, unknown>) {
    try {
      return await this.prisma.notification.create({
        data: { userId, title, body, type, ...(data ? { data: data as any } : {}) },
      });
    } catch (error) {
      this.logger.error(`Could not persist notification for user ${userId}`, error instanceof Error ? error.stack : String(error));
      return null;
    }
  }

  findForUser(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId }, orderBy: { createdAt: 'desc' }, take: 100,
    });
  }

  async markRead(userId: number, notificationId: number) {
    const result = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId }, data: { readAt: new Date() },
    });
    if (result.count === 0) throw new NotFoundException('Notification not found');
    return { id: notificationId, read: true };
  }

  async markAllRead(userId: number) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null }, data: { readAt: new Date() },
    });
    return { updated: result.count };
  }
}
