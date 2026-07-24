import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import type { AuthenticatedUser } from '../../common/types/express-request';
import { BusinessAccountsService } from './business-accounts.service';
import { CreateBusinessAccountDto } from './dto/create-business-account.dto';
import { RejectBusinessAccountDto } from './dto/review-business-account.dto';

@Controller('business-accounts')
export class BusinessAccountsController {
  constructor(private readonly businessAccounts: BusinessAccountsService) {}

  @Get('mine')
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.businessAccounts.getMine(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBusinessAccountDto) {
    return this.businessAccounts.create(user.id, dto);
  }

  @Roles(Role.ADMIN)
  @Get('pending')
  listPending() {
    return this.businessAccounts.listPending();
  }

  @Roles(Role.ADMIN)
  @Audit('business_account.approve')
  @HttpCode(HttpStatus.OK)
  @Post(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    return this.businessAccounts.approve(id, admin.id);
  }

  @Roles(Role.ADMIN)
  @Audit('business_account.reject')
  @HttpCode(HttpStatus.OK)
  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Body() dto: RejectBusinessAccountDto,
  ) {
    return this.businessAccounts.reject(id, admin.id, dto);
  }
}
