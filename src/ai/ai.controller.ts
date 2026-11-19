import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AiService } from './ai.service';
import { ChatRequestDto } from './dto/chat-request.dto';

@Controller('ai')
@UseGuards(AuthGuard)
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('chat')
  chat(@Body() dto: ChatRequestDto, @Req() req: any) {
    return this.ai.chat(dto, Number(req.user.sub));
  }
}
