import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/express-request';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chat: ChatService,
    private readonly gateway: ChatGateway,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  @Get('ws-ticket')
  wsTicket(@CurrentUser() user: AuthenticatedUser) {
    const ticket = this.jwt.sign(
      { sub: user.id, purpose: 'ws' },
      { secret: this.config.get<string>('jwt.accessSecret'), expiresIn: '60s' },
    );
    return { ticket };
  }

  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.chat.listMine(user.id);
  }

  @Get(':id')
  getThread(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.chat.getThread(user.id, id);
  }

  @Post(':id/messages')
  async sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendMessageDto,
  ) {
    const message = await this.chat.sendMessage(user.id, id, dto.body);
    this.gateway.emitMessage(id, message);
    return message;
  }
}
