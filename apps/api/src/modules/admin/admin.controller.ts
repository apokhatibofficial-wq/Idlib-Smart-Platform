import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import type { AuthenticatedUser } from '../../common/types/express-request';
import { AdminService } from './admin.service';
import { UpdateActiveStatusDto } from './dto/update-status.dto';

@Controller('admin')
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('overview')
  overview() {
    return this.admin.overview();
  }

  @Get('users')
  listUsers() {
    return this.admin.listUsers();
  }

  @Audit('user.status_update')
  @HttpCode(HttpStatus.OK)
  @Patch('users/:id/status')
  updateUserStatus(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Body() dto: UpdateActiveStatusDto,
  ) {
    return this.admin.updateUserStatus(id, admin.id, dto.isActive);
  }

  @Get('stores')
  listStores() {
    return this.admin.listStores();
  }

  @Audit('store.status_update')
  @HttpCode(HttpStatus.OK)
  @Patch('stores/:id/status')
  updateStoreStatus(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Body() dto: UpdateActiveStatusDto,
  ) {
    return this.admin.updateStoreStatus(id, admin.id, dto.isActive);
  }

  @Get('logs')
  logs(@Query('page', new ParseIntPipe({ optional: true })) page?: number) {
    return this.admin.logs(page);
  }

  @Get('coupons/pending')
  pendingCoupons() {
    return this.admin.listPendingCoupons();
  }

  @Audit('coupon.approve')
  @HttpCode(HttpStatus.OK)
  @Post('coupons/:id/approve')
  approveCoupon(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    return this.admin.reviewCoupon(id, admin.id, true);
  }

  @Audit('coupon.reject')
  @HttpCode(HttpStatus.OK)
  @Post('coupons/:id/reject')
  rejectCoupon(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    return this.admin.reviewCoupon(id, admin.id, false);
  }
}
