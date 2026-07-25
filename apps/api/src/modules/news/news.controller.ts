import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import type { AuthenticatedUser } from '../../common/types/express-request';
import { NewsService } from './news.service';
import {
  CreateAlertDto,
  CreateNewsDto,
  UpdateAlertDto,
  UpdateNewsDto,
} from './dto/create-news.dto';

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

  @Roles(Role.ADMIN)
  @Audit('news.update')
  @Patch('news/:id')
  updateNews(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Body() dto: UpdateNewsDto,
  ) {
    return this.news.updateNews(id, admin.id, dto);
  }

  @Get('alerts')
  listAlerts() {
    return this.news.listAlerts();
  }

  @Roles(Role.ADMIN)
  @Get('alerts/all')
  listAllAlerts() {
    return this.news.listAllAlerts();
  }

  @Roles(Role.ADMIN)
  @Audit('alert.create')
  @Post('alerts')
  createAlert(@CurrentUser() admin: AuthenticatedUser, @Body() dto: CreateAlertDto) {
    return this.news.createAlert(admin.id, dto);
  }

  @Roles(Role.ADMIN)
  @Audit('alert.update')
  @Patch('alerts/:id')
  updateAlert(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Body() dto: UpdateAlertDto,
  ) {
    return this.news.updateAlert(id, admin.id, dto);
  }

  @Roles(Role.ADMIN)
  @Audit('alert.delete')
  @HttpCode(HttpStatus.OK)
  @Delete('alerts/:id')
  deleteAlert(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    return this.news.deleteAlert(id, admin.id);
  }
}
