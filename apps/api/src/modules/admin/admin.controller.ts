import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import type { AuthenticatedUser } from '../../common/types/express-request';
import { AdminService } from './admin.service';

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
