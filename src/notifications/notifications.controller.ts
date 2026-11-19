import { Controller, Get, Patch, Param, ParseIntPipe, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
    constructor(private readonly notifications: NotificationsService) { }

    @Get()
    list(@Req() req: any) {
        return this.notifications.findForUser(Number(req.user.sub));
    }

    @Patch('read-all')
    markAllRead(@Req() req: any) {
        return this.notifications.markAllRead(Number(req.user.sub));
    }

    @Patch(':id/read')
    markRead(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.notifications.markRead(Number(req.user.sub), id);
    }
}
