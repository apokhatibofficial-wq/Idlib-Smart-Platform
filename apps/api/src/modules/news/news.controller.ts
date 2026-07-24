import { Body, Controller, Get, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import type { AuthenticatedUser } from '../../common/types/express-request';
import { NewsService } from './news.service';
import { CreateAlertDto, CreateNewsDto } from './dto/create-news.dto';

@Controller()
export class NewsController {
  constructor(private readonly news: NewsService) {}

  @Get('news')
  listNews() {
    return this.news.listNews();
  }

  @Roles(Role.ADMIN)
  @Audit('news.create')
  @Post('news')
  createNews(@CurrentUser() admin: AuthenticatedUser, @Body() dto: CreateNewsDto) {
    return this.news.createNews(admin.id, dto);
  }

  @Get('alerts')
  listAlerts() {
    return this.news.listAlerts();
  }

  @Roles(Role.ADMIN)
  @Audit('alert.create')
  @Post('alerts')
  createAlert(@CurrentUser() admin: AuthenticatedUser, @Body() dto: CreateAlertDto) {
    return this.news.createAlert(admin.id, dto);
  }
}
