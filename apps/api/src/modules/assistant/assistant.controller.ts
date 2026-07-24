import { Body, Controller, Get, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/express-request';
import { AssistantService } from './assistant.service';
import { AskAssistantDto } from './dto/ask-assistant.dto';

@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Get('suggestions')
  suggestions() {
    return this.assistant.suggestions();
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('ask')
  ask(@CurrentUser() user: AuthenticatedUser, @Body() dto: AskAssistantDto) {
    return this.assistant.ask(user.id, dto.question);
  }
}
