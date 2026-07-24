import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/express-request';
import { PushService } from './push.service';
import { SubscribeDto, UnsubscribeDto } from './dto/subscribe.dto';

@Controller('push')
export class PushController {
  constructor(private readonly push: PushService) {}

  @Public()
  @Get('vapid-public-key')
  vapidPublicKey() {
    return this.push.vapidPublicKey();
  }

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  subscribe(@CurrentUser() user: AuthenticatedUser, @Body() dto: SubscribeDto) {
    return this.push.subscribe(user.id, dto);
  }

  @Post('unsubscribe')
  @HttpCode(HttpStatus.OK)
  unsubscribe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UnsubscribeDto) {
    return this.push.unsubscribe(user.id, dto.endpoint);
  }
}
